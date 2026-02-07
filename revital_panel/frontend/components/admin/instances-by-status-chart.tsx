'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface InstancesByStatusChartProps {
  data: Record<string, number>;
  loading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  activa: '#16a34a',
  suspendida: '#f59e0b',
  eliminada: '#6b7280',
  error: '#ef4444',
  creando: '#3b82f6',
};

export function InstancesByStatusChart({
  data,
  loading,
}: InstancesByStatusChartProps) {
  if (loading) {
    return (
      <div className="h-64 w-full rounded-lg border bg-muted animate-pulse" />
    );
  }

  const chartData = Object.entries(data)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg border bg-muted/30 text-muted-foreground">
        Sin datos
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={STATUS_COLORS[entry.name] ?? '#94a3b8'}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
