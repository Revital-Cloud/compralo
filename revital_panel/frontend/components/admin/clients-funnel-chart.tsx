'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ClientsTimeseriesPoint } from '@/types';

interface ClientsFunnelChartProps {
  data: ClientsTimeseriesPoint[];
  loading?: boolean;
}

export function ClientsFunnelChart({ data, loading }: ClientsFunnelChartProps) {
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
        <BarChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis dataKey="periodoLabel" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="registros" fill="#3b82f6" name="Registros" />
          <Bar dataKey="trials" fill="#f59e0b" name="Trials" />
          <Bar dataKey="activos" fill="#16a34a" name="Activos" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

