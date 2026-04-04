"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { LineChart, type LineChartPoint, type LineChartSeries } from "@/components/line-chart"

type PracticeLog = {
  practiced_at: string
  grammar_done_count: number
  expression_done_count: number
  speaking_count: number
}

type NcLog = {
  logged_at: string
  count: number
  minutes: number
}

function fmtMonth(ym: string): string {
  const [y, m] = ym.split("-")
  return `${y}/${m}`
}

function fmtDate(str: string): string {
  const [, m, d] = str.split("-")
  return `${m}/${d}`
}

function buildMonthlyData(logs: PracticeLog[], ncLogs: NcLog[]): {
  repeating: LineChartPoint[]
  speaking: LineChartPoint[]
  nativeCamp: LineChartPoint[]
} {
  const rMap = new Map<string, { grammar: number; expression: number; speaking: number }>()
  for (const l of logs) {
    const ym = l.practiced_at.slice(0, 7)
    const e = rMap.get(ym) ?? { grammar: 0, expression: 0, speaking: 0 }
    rMap.set(ym, {
      grammar: e.grammar + l.grammar_done_count,
      expression: e.expression + l.expression_done_count,
      speaking: e.speaking + l.speaking_count,
    })
  }

  const ncMap = new Map<string, number>()
  for (const nc of ncLogs) {
    const ym = nc.logged_at.slice(0, 7)
    ncMap.set(ym, (ncMap.get(ym) ?? 0) + nc.minutes)
  }

  const allMonths = [...new Set([...rMap.keys(), ...ncMap.keys()])].sort()

  return {
    repeating: allMonths.map((ym) => ({
      label: fmtMonth(ym),
      grammar: rMap.get(ym)?.grammar ?? 0,
      expression: rMap.get(ym)?.expression ?? 0,
    })),
    speaking: allMonths.map((ym) => ({
      label: fmtMonth(ym),
      speaking: rMap.get(ym)?.speaking ?? 0,
    })),
    nativeCamp: allMonths.map((ym) => ({
      label: fmtMonth(ym),
      minutes: ncMap.get(ym) ?? 0,
    })),
  }
}

// 全期間: 日次の実績値をそのまま表示。legend の合計 = 全期間の総合計になる
function buildAllTimeData(logs: PracticeLog[], ncLogs: NcLog[]): {
  repeating: LineChartPoint[]
  speaking: LineChartPoint[]
  nativeCamp: LineChartPoint[]
} {
  const sorted = [...logs].sort((a, b) => a.practiced_at.localeCompare(b.practiced_at))

  const ncDayMap = new Map<string, number>()
  for (const nc of ncLogs) {
    ncDayMap.set(nc.logged_at, (ncDayMap.get(nc.logged_at) ?? 0) + nc.minutes)
  }
  const sortedNcDays = [...ncDayMap.keys()].sort()

  return {
    repeating: sorted.map((l) => ({
      label: fmtDate(l.practiced_at),
      grammar: l.grammar_done_count,
      expression: l.expression_done_count,
    })),
    speaking: sorted.map((l) => ({
      label: fmtDate(l.practiced_at),
      speaking: l.speaking_count,
    })),
    nativeCamp: sortedNcDays.map((d) => ({
      label: fmtDate(d),
      minutes: ncDayMap.get(d)!,
    })),
  }
}

const repeatingSeries: LineChartSeries[] = [
  { key: "grammar", label: "文法", color: "#3B82F6" },
  { key: "expression", label: "フレーズ", color: "#10B981" },
]
const speakingSeries: LineChartSeries[] = [
  { key: "speaking", label: "スピーキング", color: "#3B82F6" },
]
const ncSeries: LineChartSeries[] = [
  { key: "minutes", label: "学習時間", color: "#10B981" },
]

export function ReportCharts({
  logs,
  ncLogs,
}: {
  logs: PracticeLog[]
  ncLogs: NcLog[]
}) {
  const [mode, setMode] = useState<"monthly" | "alltime">("monthly")

  const monthly = buildMonthlyData(logs, ncLogs)
  const alltime = buildAllTimeData(logs, ncLogs)
  const data = mode === "monthly" ? monthly : alltime

  return (
    <Tabs value={mode} onValueChange={(v) => setMode(v as "monthly" | "alltime")}>
      <TabsList>
        <TabsTrigger value="monthly">月次</TabsTrigger>
        <TabsTrigger value="alltime">全期間</TabsTrigger>
      </TabsList>

      <TabsContent value={mode} className="space-y-4 mt-4">
        <LineChart
          title="リピーティング"
          series={repeatingSeries}
          data={data.repeating}
          unit="回"
        />
        <LineChart
          title="スピーキング"
          series={speakingSeries}
          data={data.speaking}
          unit="回"
        />
        <LineChart
          title="Native Camp 学習時間"
          series={ncSeries}
          data={data.nativeCamp}
          unit="分"
        />
      </TabsContent>
    </Tabs>
  )
}
