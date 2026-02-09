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

interface InstancesByRegionChartProps {
  data: Record<string, number>;
  loading?: boolean;
}

export function InstancesByRegionChart({
  data,
  loading,
}: InstancesByRegionChartProps) {
  if (loading) {
    return (
      <div className="h-64 w-full rounded-lg border bg-muted animate-pulse" />
    );
  }

  const chartData = Object.entries(data)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({
      name: name === 'sin_region' ? 'Sin region' : name,
      value,
    }))
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
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={80} tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey="value" fill="#16a34a" radius={[0, 4, 4, 0]} name="Instancias" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
