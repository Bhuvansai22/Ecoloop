/**
 * CarbonChart — Recharts charts for carbon dashboard
 */
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#22c55e', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981', '#3b82f6', '#f97316'];

export const MonthlyBarChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={240}>
    <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
      <XAxis dataKey="month" tick={{ fill: '#4b7a4b', fontSize: 11 }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fill: '#4b7a4b', fontSize: 11 }} axisLine={false} tickLine={false} />
      <Tooltip
        contentStyle={{ background: '#141914', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
        labelStyle={{ color: '#86efac' }}
        itemStyle={{ color: '#22c55e' }}
        formatter={(v) => [`${v} kg CO₂`, 'Carbon Saved']}
      />
      <Bar dataKey="carbonSaved" fill="#22c55e" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

export const CategoryPieChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={240}>
    <PieChart>
      <Pie data={data} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
        {data.map((_, i) => (
          <Cell key={i} fill={COLORS[i % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{ background: '#141914', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
        formatter={(v) => [`${v} kg CO₂`]}
      />
    </PieChart>
  </ResponsiveContainer>
);

export const CarbonLineChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={240}>
    <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
      <XAxis dataKey="month" tick={{ fill: '#4b7a4b', fontSize: 11 }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fill: '#4b7a4b', fontSize: 11 }} axisLine={false} tickLine={false} />
      <Tooltip
        contentStyle={{ background: '#141914', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
        formatter={(v) => [`${v} kg CO₂`]}
      />
      <Line type="monotone" dataKey="carbonSaved" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
    </LineChart>
  </ResponsiveContainer>
);
