"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface BarChartComponentProps {
  data: {
    factor: string
    impact: number
  }[]
}

export function BarChartComponent({ data }: BarChartComponentProps) {
  const chartConfig = {
    impact: {
      label: "Impact",
      color: "hsl(var(--primary))",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Factors</CardTitle>
        <CardDescription>Top factors affecting your loan approval chances</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[-20, 20]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                dataKey="factor"
                type="category"
                width={120}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Bar dataKey="impact" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              <ChartTooltip content={<ChartTooltipContent />} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
