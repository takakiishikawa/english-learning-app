import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Flame } from "lucide-react"
import { CTASection } from "@/components/cta-section"
import { MetricsSection } from "@/components/metrics-section"
import { LineChart, type LineChartPoint } from "@/components/line-chart"
import { DashboardAutoCheck } from "@/components/dashboard-auto-check"
import type { SpeakingScore } from "@/lib/types"

function getWeekMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const sorted = [...new Set(dates)].sort((a, b) => b.localeCompare(a))
  const today = new Date().toISOString().split("T")[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0
  let streak = 0
  let current = sorted[0] === today ? today : yesterday
  for (const date of sorted) {
    if (date === current) {
      streak++
      current = new Date(new Date(current).getTime() - 86400000)
        .toISOString()
        .split("T")[0]
    } else {
      break
    }
  }
  return streak
}

function fmtDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default async function HomePage() {
  const supabase = await createClient()

  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]
  const thisMonday = getWeekMonday(today)
  const thisMondayStr = thisMonday.toISOString().split("T")[0]

  // 8 week buckets: index 0 = oldest, index 7 = this week
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const mon = new Date(thisMonday)
    mon.setDate(mon.getDate() - (7 - i) * 7)
    const sun = new Date(mon)
    sun.setDate(sun.getDate() + 6)
    return {
      monStr: mon.toISOString().split("T")[0],
      sunStr: sun.toISOString().split("T")[0],
      label: `${fmtDate(mon)}〜${fmtDate(sun)}`,
    }
  })

  const rangeStartStr = weeks[0].monStr

  const [logsResult, grammarResult, expressionsResult, rangeLogsResult, scoresResult] =
    await Promise.all([
      supabase.from("practice_logs").select("practiced_at"),
      supabase.from("grammar").select("play_count"),
      supabase.from("expressions").select("play_count"),
      supabase
        .from("practice_logs")
        .select("practiced_at, grammar_done_count, expression_done_count, speaking_count, native_camp_count")
        .gte("practiced_at", rangeStartStr)
        .lte("practiced_at", todayStr)
        .order("practiced_at"),
      supabase
        .from("speaking_scores")
        .select("id, user_id, score, tested_at, created_at")
        .order("tested_at"),
    ])

  const allLogs = logsResult.data ?? []
  const grammars = grammarResult.data ?? []
  const expressions = expressionsResult.data ?? []
  const rangeLogs = rangeLogsResult.data ?? []
  const scores = (scoresResult.data ?? []) as SpeakingScore[]

  // Streak + monthly days
  const streak = calculateStreak(allLogs.map((l) => l.practiced_at))
  const thisMonthStr = today.toISOString().slice(0, 7)
  const monthlyDays = allLogs.filter((l) => l.practiced_at.startsWith(thisMonthStr)).length

  // Grammar / expression counts
  const grammarsInProgress = grammars.filter((g) => g.play_count > 0 && g.play_count < 10).length
  const grammarDone = grammars.filter((g) => g.play_count >= 10).length
  const expressionsInProgress = expressions.filter((e) => e.play_count > 0 && e.play_count < 10).length
  const expressionDone = expressions.filter((e) => e.play_count >= 10).length

  // This week's metrics
  const thisWeekLogs = rangeLogs.filter((l) => l.practiced_at >= thisMondayStr)
  const weeklyGrammar = thisWeekLogs.reduce((s, l) => s + (l.grammar_done_count ?? 0), 0)
  const weeklyExpression = thisWeekLogs.reduce((s, l) => s + (l.expression_done_count ?? 0), 0)
  const weeklyRepeating = weeklyGrammar + weeklyExpression
  const weeklySpeaking = thisWeekLogs.reduce((s, l) => s + (l.speaking_count ?? 0), 0)
  const weeklyNativeCampCount = thisWeekLogs.reduce((s, l) => s + (l.native_camp_count ?? 0), 0)

  // Speaking score metrics
  const sortedScores = [...scores].sort((a, b) => b.tested_at.localeCompare(a.tested_at))
  const latestScore = sortedScores.length > 0 ? sortedScores[0].score : null
  const scoreDiff = sortedScores.length >= 2 ? sortedScores[0].score - sortedScores[1].score : null

  // Today's native camp check for auto-modal
  const todayLog = rangeLogs.find((l) => l.practiced_at === todayStr)
  const hasNativeCampToday = (todayLog?.native_camp_count ?? 0) > 0

  // Chart: weekly repeating breakdown
  const repeatingChartData: LineChartPoint[] = weeks.map(({ monStr, sunStr, label }) => {
    let grammar = 0,
      expression = 0
    rangeLogs.forEach((l) => {
      if (l.practiced_at >= monStr && l.practiced_at <= sunStr) {
        grammar += l.grammar_done_count ?? 0
        expression += l.expression_done_count ?? 0
      }
    })
    return { label, grammar, expression }
  })

  // Chart: weekly native camp minutes
  const ncChartData: LineChartPoint[] = weeks.map(({ monStr, sunStr, label }) => {
    let minutes = 0
    rangeLogs.forEach((l) => {
      if (l.practiced_at >= monStr && l.practiced_at <= sunStr) {
        minutes += (l.native_camp_count ?? 0) * 25
      }
    })
    return { label, minutes }
  })

  // Chart: speaking score per test date
  const scoreChartData: LineChartPoint[] = [...scores]
    .sort((a, b) => a.tested_at.localeCompare(b.tested_at))
    .map((s) => {
      const d = new Date(s.tested_at)
      return { label: fmtDate(d), score: s.score }
    })

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">ホーム</h1>
        <p className="text-muted-foreground mt-1">学習進捗の概要</p>
      </div>

      {/* Streak Card */}
      <Card className="shadow-sm">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="rounded-xl bg-orange-50 p-3">
            <Flame className="h-7 w-7 text-orange-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{streak}</span>
              <span className="text-lg text-muted-foreground">日連続</span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">今月 {monthlyDays} 日練習</p>
          </div>
        </CardContent>
      </Card>

      {/* 練習を始める */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          練習を始める
        </h2>
        <CTASection
          grammarsInProgress={grammarsInProgress}
          expressionsInProgress={expressionsInProgress}
          grammarDone={grammarDone}
          expressionDone={expressionDone}
        />
      </div>

      {/* 学習ログ */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          学習ログ
        </h2>
        <MetricsSection
          weeklyRepeating={weeklyRepeating}
          weeklyGrammar={weeklyGrammar}
          weeklyExpression={weeklyExpression}
          weeklySpeaking={weeklySpeaking}
          weeklyNativeCampCount={weeklyNativeCampCount}
          latestScore={latestScore}
          scoreDiff={scoreDiff}
          initialScores={scores}
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <LineChart
            title="リピーティング推移（週別）"
            series={[
              { key: "grammar", label: "文法", color: "#3B82F6" },
              { key: "expression", label: "フレーズ", color: "#10B981" },
            ]}
            data={repeatingChartData}
            unit="回"
          />
          <LineChart
            title="Native Camp 学習時間（週別）"
            series={[{ key: "minutes", label: "学習時間", color: "#8B5CF6" }]}
            data={ncChartData}
            unit="分"
          />
        </div>
        <LineChart
          title="Speaking スコア推移"
          series={[{ key: "score", label: "スコア", color: "#F59E0B" }]}
          data={scoreChartData}
          unit="点"
          emptyText="スコアを記録するとグラフが表示されます"
        />
      </div>

      <DashboardAutoCheck hasNativeCampToday={hasNativeCampToday} />
    </div>
  )
}
