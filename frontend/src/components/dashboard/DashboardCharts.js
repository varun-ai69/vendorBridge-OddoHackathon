"use client";

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["#1e40af", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];

export function SpendChart({ data = [] }) {
  if (!data.length) return null;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e40af" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#1e40af" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted)" />
        <YAxis tick={{ fontSize: 12 }} stroke="var(--muted)" tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
        <Tooltip
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}
          formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Spend"]}
        />
        <Area type="monotone" dataKey="total_spend" stroke="#1e40af" fill="url(#spendGrad)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryChart({ data = [] }) {
  if (!data.length) return null;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}
          formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Amount"]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ApprovalTrendChart({ data = [] }) {
  if (!data.length) return null;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted)" />
        <YAxis tick={{ fontSize: 12 }} stroke="var(--muted)" />
        <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
        <Bar dataKey="approved" fill="#059669" radius={[4, 4, 0, 0]} />
        <Bar dataKey="rejected" fill="#dc2626" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
