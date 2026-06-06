#!/bin/bash
# docker/init-db.sh
# PostgreSQL runs this automatically on first container start.
# Any .sql file dropped in /docker-entrypoint-initdb.d/ is executed
# in filename order — that's why files are prefixed 01_, 02_, 03_.
# This script is just a log wrapper so you can see what's happening.

set -e

echo "[init-db] Running schema..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/01_schema.sql

echo "[init-db] Running triggers..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/02_triggers.sql

echo "[init-db] Running seed data..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/03_seed.sql

echo "[init-db] Done. Database ready."