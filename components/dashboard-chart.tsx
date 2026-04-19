"use client"

import { useId } from "react"
import {
  Card, CardContent, CardHeader, CardTitle,
  type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@takaki/go-design-system"
import { AreaChart, Area, XAxis, CartesianGrid, ReferenceLine } from "recharts"

interface DashboardChartProps {
  title: string
  data: Record<string, unknown>[]
  config: ChartConfig
  xKey: string
  yKeys: string[]
  unit?: string
  baseline?: number
  emptyText?: string
}

export function DashboardChart({
  title, data, config, xKey, yKeys, unit = "", baseline, emptyText,
}: DashboardChartProps) {
  const uid = useId().replace(/:/g, "")
  const hasData = data.some((d) => yKeys.some((k) => (d[k] as number) > 0))

  return (
    <Card className="shadow-none border border-[var(--color-border-subtle)]">
      <CardHeader className="pb-1 pt-4 px-5">
        <CardTitle className="text-[13px] font-medium text-muted-foreground uppercase tracking-[0.05em]">
          {title}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1.5">
          {yKeys.map((key) => {
            const total = data.reduce((sum, d) => sum + ((d[key] as number) ?? 0), 0)
            const color = (config[key]?.color as string | undefined) ?? "var(--color-primary)"
            return (
              <span key={key} className="flex items-center gap-1.5 text-[15px] font-medium" style={{ color }}>
                <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                {config[key]?.label}{" "}
                <span className="tabular-nums">{total}{unit}</span>
              </span>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4 pt-2">
        {!hasData ? (
          <div className="h-[160px] flex items-center justify-center text-xs text-muted-foreground">
            {emptyText ?? "データが溜まるとグラフが表示されます"}
          </div>
        ) : (
          <ChartContainer config={config} className="h-[160px] w-full">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                {yKeys.map((key) => {
                  const color = (config[key]?.color as string | undefined) ?? "var(--color-primary)"
                  return (
                    <linearGradient key={key} id={`${uid}-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                  )
                })}
              </defs>
              <CartesianGrid vertical={false} strokeOpacity={0.15} />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              {baseline != null && (
                <ReferenceLine
                  y={baseline}
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  className="stroke-muted-foreground/40"
                />
              )}
              {yKeys.map((key) => {
                const color = (config[key]?.color as string | undefined) ?? "var(--color-primary)"
                return (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={1.5}
                    fill={`url(#${uid}-${key})`}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                )
              })}
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
