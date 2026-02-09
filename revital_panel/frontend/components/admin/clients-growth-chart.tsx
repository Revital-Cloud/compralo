'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ClientsTimeseriesPoint } from '@/types';

interface ClientsGrowthChartProps {
  data: ClientsTimeseriesPoint[];
  loading?: boolean;
}

export function ClientsGrowthChart({ data, loading }: ClientsGrowthChartProps) {
  if (loading) {
    return (
      <div className="h-64 w-full rounded-lg border bg-muted animate-pulse" />
    );
  }

  const formatted = data.map((p) => ({
    ...p,
    periodoLabel: new Date(p.periodo).toLocaleDateString('es-CO', {
      month: 'short',
      year: '2-digit',
    }),
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted}>
          <defs>
            <linearGradient id="clientsGrowthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis dataKey="periodoLabel" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="registros"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#clientsGrowthGradient)"
            name="Nuevos registros"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
