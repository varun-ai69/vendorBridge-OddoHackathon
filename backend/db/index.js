// db/index.js
// PostgreSQL connection pool with RLS session variable injection.
//
// Every query that touches a tenant-scoped table needs the three session
// variables set via SET LOCAL before Postgres evaluates any RLS policy:
//   app.current_user_id  — UUID of the authenticated user
//   app.current_org_id   — UUID of the user's organization
//   app.current_role     — role string (admin / procurement_officer / manager / vendor)
//
// Usage:
//   const db = require('./db');
//
//   Regular query (no RLS context — only safe for public/unauthenticated routes)
//   const result = await db.query('SELECT id FROM organizations WHERE id = $1', [id]);
//
//   Authenticated query (RLS enforced)
//   const result = await db.withSession(req.user, async (query) => {
//     return query('SELECT * FROM rfqs WHERE org_id = $1', [req.user.org_id]);
//   });

const { Pool } = require('pg');

const pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME     || 'oddoHackathon',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '',

    // Keep enough connections for concurrent requests
    max:             20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Log pool errors so they don't crash the process silently
pool.on('error', (err) => {
    console.error('[db] Unexpected pool error:', err.message);
});


// ---------------------------------------------------------------------------
// db.query — bare query, no RLS session variables set.
// Use ONLY for auth routes (login, register-org, forgot-password, reset-password)
// where the user is not yet authenticated and no tenant scoping is needed.
// ---------------------------------------------------------------------------
async function query(text, params) {
    const client = await pool.connect();
    try {
        return await client.query(text, params);
    } finally {
        client.release();
    }
}


// ---------------------------------------------------------------------------
// db.withSession — checks out a client, injects RLS session variables
// inside a transaction, runs the caller-supplied async function, then
// releases the client.
//
// The caller receives a `query(text, params)` function that is bound to
// the same client (and therefore the same transaction + session vars).
//
// user must have: { id, org_id, role }
// ---------------------------------------------------------------------------
async function withSession(user, fn) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // SET LOCAL scopes the variables to this transaction only.
        // They are automatically cleared when the transaction ends.
        await client.query(`
            SELECT
                set_config('app.current_user_id', $1, TRUE),
                set_config('app.current_org_id',  $2, TRUE),
                set_config('app.current_role',     $3, TRUE)
        `, [
            String(user.id),
            String(user.org_id),
            String(user.role),
        ]);

        // Expose a bound query function so the caller doesn't need the client ref
        const boundQuery = (text, params) => client.query(text, params);

        const result = await fn(boundQuery);

        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}


// ---------------------------------------------------------------------------
// db.withTransaction — same as withSession but without RLS variables.
// Use when you need a multi-step transaction on public tables (e.g. register-org
// which creates both an organization row and an admin user row atomically).
// ---------------------------------------------------------------------------
async function withTransaction(fn) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const boundQuery = (text, params) => client.query(text, params);
        const result = await fn(boundQuery);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}


// ---------------------------------------------------------------------------
// Graceful shutdown — drains the pool when the process exits.
// Called from server.js on SIGTERM / SIGINT.
// ---------------------------------------------------------------------------
async function close() {
    await pool.end();
    console.log('[db] Pool closed');
}


module.exports = { query, withSession, withTransaction, close };