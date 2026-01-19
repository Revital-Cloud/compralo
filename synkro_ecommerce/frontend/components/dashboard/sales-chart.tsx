'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Button } from "@/components/ui"
import { Select } from "@/components/ui"
import { IconDownload } from "@tabler/icons-react"

interface SalesDataPoint {
  month: string
  sales: number
  orders: number
  revenue: number
}

interface SalesChartProps {
  salesData: SalesDataPoint[]
  summary: {
    totalSales: number
    totalOrders: number
    conversionRate: string
  }
  loading: boolean
}

export const SalesChart = ({ salesData, summary, loading }: SalesChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const maxSales = salesData.length > 0 ? Math.max(...salesData.map(d => d.sales)) : 1
  
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Resumen de Ventas</CardTitle>
            <CardDescription>Rendimiento de ventas mensual</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select defaultValue="monthly" className="w-28">
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
              <option value="yearly">Anual</option>
            </Select>
            <Button variant="outline" size="sm">
              <IconDownload className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
        ) : (
          <>
            <div className="h-80 flex items-end justify-between space-x-2">
              {salesData.map((data, index) => (
                <div 
                  key={data.month} 
                  className="flex flex-col items-center space-y-2 flex-1 cursor-pointer group"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="relative w-full">
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        hoveredIndex === index 
                          ? 'bg-blue-600 shadow-lg' 
                          : 'bg-blue-500 group-hover:bg-blue-600'
                      }`}
                      style={{ 
                        height: `${(data.sales / maxSales) * 240}px`,
                        minHeight: '20px'
                      }}
                    />
                    {hoveredIndex === index && (
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                        ${data.revenue.toFixed(0)} ingresos
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{data.month}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-2xl font-bold">${summary.totalSales}</span>
                <p className="text-sm text-muted-foreground">{summary.totalOrders} órdenes</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm text-muted-foreground">Tasa de Conversión</p>
                <span className="text-lg font-semibold text-green-600">{summary.conversionRate}%</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export type { SalesDataPoint } 