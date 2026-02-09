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
import type { InstancesByPlanItem } from '@/types';

interface InstancesByPlanBarChartProps {
  data: InstancesByPlanItem[];
  loading?: boolean;
}

export function InstancesByPlanBarChart({
  data,
  loading,
}: InstancesByPlanBarChartProps) {
  if (loading) {
    return (
      <div className="h-64 w-full rounded-lg border bg-muted animate-pulse" />
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis dataKey="nom_plan" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="activas" stackId="estado" fill="#16a34a" name="Activas" />
          <Bar
            dataKey="suspendidas"
            stackId="estado"
            fill="#f59e0b"
            name="Suspendidas"
          />
          <Bar
            dataKey="eliminadas"
            stackId="estado"
            fill="#6b7280"
            name="Eliminadas"
          />
          <Bar dataKey="error" stackId="estado" fill="#ef4444" name="Error" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

