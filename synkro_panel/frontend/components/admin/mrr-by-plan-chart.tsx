'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface MRRByPlanChartProps {
  data: Record<string, number>;
  loading?: boolean;
}

export function MRRByPlanChart({ data, loading }: MRRByPlanChartProps) {
  if (loading) {
    return (
      <div className="h-64 w-full rounded-lg border bg-muted animate-pulse" />
    );
  }

  const chartData = Object.entries(data)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

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
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value: number | undefined) => {
              if (value === undefined) return '';
              return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'USD',
              }).format(value);
            }}
          />
          <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} name="MRR" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
