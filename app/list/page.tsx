"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Grammar, Expression } from "@/lib/types"

type GrammarWithLesson = Grammar & { lessons: { lesson_no: string } | null }
type ExpressionWithLesson = Expression & { lessons: { lesson_no: string } | null }
import { Star } from "lucide-react"

function StarRating({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
        />
      ))}
    </span>
  )
}

function GrammarTab() {
  const supabase = createClient()
  const [items, setItems] = useState<GrammarWithLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<"all" | "try" | "done">("all")
  const [freqFilter, setFreqFilter] = useState<"all" | "3" | "4" | "5">("all")
  const [selected, setSelected] = useState<GrammarWithLesson | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("grammar")
        .select("*, lessons(lesson_no)")
        .order("created_at", { ascending: false })
      setItems((data ?? []) as GrammarWithLesson[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = items.filter((item) => {
    const isDone = item.play_count >= 10
    if (statusFilter === "try" && isDone) return false
    if (statusFilter === "done" && !isDone) return false
    if (freqFilter !== "all" && item.frequency < parseInt(freqFilter)) return false
    return true
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">読み込み中...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="try">練習中</SelectItem>
            <SelectItem value="done">習得済み</SelectItem>
          </SelectContent>
        </Select>
        <Select value={freqFilter} onValueChange={(v) => setFreqFilter(v as typeof freqFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="使用頻度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全頻度</SelectItem>
            <SelectItem value="3">★3以上</SelectItem>
            <SelectItem value="4">★4以上</SelectItem>
            <SelectItem value="5">★5のみ</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} 件 / 全 {items.length} 件</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">テキストID</TableHead>
            <TableHead>文法名</TableHead>
            <TableHead>概要</TableHead>
            <TableHead>頻度</TableHead>
            <TableHead>回数</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((item) => (
            <TableRow
              key={item.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => setSelected(item)}
            >
              <TableCell className="font-mono text-xs text-muted-foreground">
                {item.lessons?.lesson_no ?? "—"}
              </TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{item.summary.split("\n")[0]}{item.summary.includes("\n") ? "..." : ""}</TableCell>
              <TableCell><StarRating value={item.frequency} /></TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.play_count} / 10</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selected && (
        <Dialog open={!!selected} onClose={() => setSelected(null)} title={selected.name}>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">簡易解説</p>
              <p className="text-sm">{selected.summary}</p>
            </div>
            {selected.detail && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">詳細解説</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.detail}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">例文</p>
              <ul className="space-y-2">
                {selected.examples.split("\n").filter(Boolean).map((ex, i) => (
                  <li key={i} className="rounded-lg bg-muted px-3 py-2 text-sm">{ex}</li>
                ))}
              </ul>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}

function PhraseTab() {
  const supabase = createClient()
  const [items, setItems] = useState<ExpressionWithLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<"all" | "try" | "done">("all")
  const [freqFilter, setFreqFilter] = useState<"all" | "3" | "4" | "5">("all")
  const [selected, setSelected] = useState<ExpressionWithLesson | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("expressions")
        .select("*, lessons(lesson_no)")
        .order("created_at", { ascending: false })
      setItems((data ?? []) as ExpressionWithLesson[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = items.filter((item) => {
    const isDone = item.play_count >= 10
    if (statusFilter === "try" && isDone) return false
    if (statusFilter === "done" && !isDone) return false
    if (freqFilter !== "all" && item.frequency < parseInt(freqFilter)) return false
    return true
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">読み込み中...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="try">練習中</SelectItem>
            <SelectItem value="done">習得済み</SelectItem>
          </SelectContent>
        </Select>
        <Select value={freqFilter} onValueChange={(v) => setFreqFilter(v as typeof freqFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="使用頻度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全頻度</SelectItem>
            <SelectItem value="3">★3以上</SelectItem>
            <SelectItem value="4">★4以上</SelectItem>
            <SelectItem value="5">★5のみ</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} 件 / 全 {items.length} 件</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">テキストID</TableHead>
            <TableHead>種別</TableHead>
            <TableHead>フレーズ</TableHead>
            <TableHead>意味</TableHead>
            <TableHead>頻度</TableHead>
            <TableHead>回数</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((item) => (
            <TableRow
              key={item.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => setSelected(item)}
            >
              <TableCell className="font-mono text-xs text-muted-foreground">
                {item.lessons?.lesson_no ?? "—"}
              </TableCell>
              <TableCell><Badge variant="outline" className="text-xs">{item.category}</Badge></TableCell>
              <TableCell className="font-medium">{item.expression}</TableCell>
              <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{item.meaning.split("\n")[0]}{item.meaning.includes("\n") ? "..." : ""}</TableCell>
              <TableCell><StarRating value={item.frequency} /></TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.play_count} / 10</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selected && (
        <Dialog open={!!selected} onClose={() => setSelected(null)} title={selected.expression}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground whitespace-pre-line">{selected.meaning}</p>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">会話例</p>
              <div className="space-y-2">
                {selected.conversation.split("\n").filter(Boolean).map((line, i) => {
                  const isA = line.startsWith("A:")
                  return (
                    <div
                      key={i}
                      className={`rounded-lg px-3 py-2 text-sm ${
                        isA ? "bg-blue-50 text-blue-900" : "bg-amber-50 text-amber-900"
                      }`}
                    >
                      {line}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2 border-t">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">使用頻度</span>
                <StarRating value={selected.frequency} />
              </div>
              <span className="text-xs text-muted-foreground">
                練習回数: {selected.play_count} / 10
              </span>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}

export default function ListPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">文法・フレーズ</h1>
        <p className="text-muted-foreground mt-1">登録済みの文法・フレーズを確認できます</p>
      </div>

      <Tabs defaultValue="grammar">
        <TabsList>
          <TabsTrigger value="grammar">文法</TabsTrigger>
          <TabsTrigger value="phrase">フレーズ</TabsTrigger>
        </TabsList>
        <TabsContent value="grammar" className="mt-4">
          <GrammarTab />
        </TabsContent>
        <TabsContent value="phrase" className="mt-4">
          <PhraseTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
