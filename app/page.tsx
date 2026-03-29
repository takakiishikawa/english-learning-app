import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, CalendarDays, CheckSquare, BookOpen } from "lucide-react"

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
      const prev = new Date(new Date(current).getTime() - 86400000)
      current = prev.toISOString().split("T")[0]
    } else {
      break
    }
  }

  return streak
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [logsResult, grammarResult, expressionsResult] = await Promise.all([
    supabase.from("practice_logs").select("practiced_at"),
    supabase.from("grammar").select("play_count"),
    supabase.from("expressions").select("play_count"),
  ])

  const logs = logsResult.data ?? []
  const grammars = grammarResult.data ?? []
  const expressions = expressionsResult.data ?? []

  const streak = calculateStreak(logs.map((l) => l.practiced_at))

  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthlyDays = logs.filter((l) => l.practiced_at.startsWith(thisMonth)).length

  const grammarDone = grammars.filter((g) => g.play_count >= 7).length
  const expressionDone = expressions.filter((e) => e.play_count >= 7).length

  const stats = [
    {
      title: "連続練習日数",
      value: streak,
      unit: "日",
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      title: "今月の練習日数",
      value: monthlyDays,
      unit: "日",
      icon: CalendarDays,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      title: "文法 Done",
      value: grammarDone,
      unit: `/ ${grammars.length}`,
      icon: BookOpen,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      title: "表現 Done",
      value: expressionDone,
      unit: `/ ${expressions.length}`,
      icon: CheckSquare,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">学習進捗の概要</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ title, value, unit, icon: Icon, color, bg }) => (
          <Card key={title}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {title}
                </CardTitle>
                <div className={`rounded-full p-2 ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{value}</span>
                <span className="text-lg text-muted-foreground">{unit}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">文法 Try中</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {grammars.filter((g) => g.play_count < 7).length}
              <span className="text-sm font-normal text-muted-foreground ml-1">件</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">表現 Try中</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {expressions.filter((e) => e.play_count < 7).length}
              <span className="text-sm font-normal text-muted-foreground ml-1">件</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
