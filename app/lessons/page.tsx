"use client"

import { useEffect, useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateLessonStatus } from "@/app/actions/practice"
import type { Lesson } from "@/lib/types"

const STATUS_COLOR: Record<string, string> = {
  "未受講": "secondary",
  try: "default",
  Done: "outline",
}

function LessonTable({
  lessons,
  onStatusChange,
}: {
  lessons: Lesson[]
  onStatusChange: (id: string, status: Lesson["status"]) => void
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>レッスン番号</TableHead>
          <TableHead>トピック</TableHead>
          <TableHead>ステータス</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lessons.map((lesson) => (
          <TableRow key={lesson.id}>
            <TableCell className="font-mono font-medium">{lesson.lesson_no}</TableCell>
            <TableCell>{lesson.topic}</TableCell>
            <TableCell>
              <Select
                value={lesson.status}
                onValueChange={(val) => {
                  const status = val as Lesson["status"]
                  onStatusChange(lesson.id, status)
                  startTransition(async () => {
                    await updateLessonStatus(lesson.id, status)
                  })
                }}
                disabled={isPending}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="未受講">未受講</SelectItem>
                  <SelectItem value="try">try</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function LessonsPage() {
  const supabase = createClient()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("lessons")
        .select("*")
        .order("level")
        .order("lesson_no")
      setLessons((data as Lesson[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function handleStatusChange(id: string, status: Lesson["status"]) {
    setLessons((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    )
  }

  const byLevel = (level: number) => lessons.filter((l) => l.level === level)

  const statusSummary = (lvl: number) => {
    const items = byLevel(lvl)
    const done = items.filter((l) => l.status === "Done").length
    const trying = items.filter((l) => l.status === "try").length
    return `${done} Done / ${trying} try / ${items.length} 件`
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">レッスン管理</h1>
        <p className="text-muted-foreground mt-1">受講状況の管理</p>
      </div>

      <Tabs defaultValue="1">
        <TabsList>
          <TabsTrigger value="1">Level 1</TabsTrigger>
          <TabsTrigger value="2">Level 2</TabsTrigger>
          <TabsTrigger value="3">Level 3</TabsTrigger>
        </TabsList>

        {[1, 2, 3].map((lvl) => (
          <TabsContent key={lvl} value={String(lvl)} className="space-y-3">
            <p className="text-sm text-muted-foreground">{statusSummary(lvl)}</p>
            {byLevel(lvl).length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Level {lvl} のレッスンデータがありません
              </p>
            ) : (
              <LessonTable
                lessons={byLevel(lvl)}
                onStatusChange={handleStatusChange}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
