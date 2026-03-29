"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { incrementGrammarPlayCount } from "@/app/actions/practice"
import type { Grammar } from "@/lib/types"
import { Play, Square, ChevronLeft, ChevronRight, Star } from "lucide-react"

function StarRating({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
        />
      ))}
    </span>
  )
}

export default function GrammarRepeatingPage() {
  const supabase = createClient()
  const [items, setItems] = useState<Grammar[]>([])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentLine, setCurrentLine] = useState(-1)
  const [rate, setRate] = useState(1.0)
  const [loading, setLoading] = useState(true)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const cancelRef = useRef(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("grammar")
        .select("*")
        .lt("play_count", 7)
        .order("created_at", { ascending: true })
      setItems(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const current = items[index]
  const examples = current?.examples.split("\n").filter(Boolean) ?? []

  const stopSpeech = useCallback(() => {
    cancelRef.current = true
    window.speechSynthesis.cancel()
    setPlaying(false)
    setCurrentLine(-1)
  }, [])

  const speakLine = useCallback(
    (text: string, lineIndex: number): Promise<void> => {
      return new Promise((resolve) => {
        if (cancelRef.current) {
          resolve()
          return
        }
        setCurrentLine(lineIndex)
        const utter = new SpeechSynthesisUtterance(text)
        utter.lang = "en-US"
        utter.rate = rate
        utteranceRef.current = utter
        utter.onend = () => resolve()
        utter.onerror = () => resolve()
        window.speechSynthesis.speak(utter)
      })
    },
    [rate]
  )

  const pause = (ms: number) =>
    new Promise<void>((r) => setTimeout(r, ms))

  const handlePlay = useCallback(async () => {
    if (!current || examples.length === 0) return
    cancelRef.current = false
    setPlaying(true)

    for (let i = 0; i < examples.length; i++) {
      if (cancelRef.current) break
      await speakLine(examples[i], i)
      if (i < examples.length - 1 && !cancelRef.current) {
        await pause(500)
      }
    }

    if (!cancelRef.current) {
      setPlaying(false)
      setCurrentLine(-1)
      await incrementGrammarPlayCount(current.id)
      const updatedCount = current.play_count + 1
      setItems((prev) =>
        updatedCount >= 7
          ? prev.filter((_, idx) => idx !== index)
          : prev.map((item, idx) =>
              idx === index ? { ...item, play_count: updatedCount } : item
            )
      )
      if (updatedCount >= 7) {
        setIndex((prev) => Math.max(0, prev - 1))
      }
    }
  }, [current, examples, speakLine, index, incrementGrammarPlayCount])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">読み込み中...</div>
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
        <p className="text-lg">Try中の文法はありません</p>
        <p className="text-sm">すべて完了しました！</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">文法リピーティング</h1>
          <p className="text-muted-foreground mt-1">
            {index + 1} / {items.length} 件
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {current.play_count} / 7 回
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{current.name}</CardTitle>
            <StarRating value={current.frequency} />
          </div>
          <p className="text-muted-foreground">{current.summary}</p>
          {current.detail && (
            <p className="text-sm text-muted-foreground border-t pt-2 mt-2">
              {current.detail}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium mb-3">例文:</p>
          <ul className="space-y-2">
            {examples.map((ex, i) => (
              <li
                key={i}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  i === currentLine
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {ex}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-3">
            場面: {current.usage_scene}
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm text-muted-foreground whitespace-nowrap">速度</span>
          <Slider
            min={60}
            max={140}
            step={10}
            value={[Math.round(rate * 100)]}
            onValueChange={([v]) => setRate(v / 100)}
            className="w-32"
          />
          <span className="text-sm text-muted-foreground w-10">{(rate).toFixed(1)}x</span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => { stopSpeech(); setIndex((i) => Math.max(0, i - 1)) }}
          disabled={index === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {playing ? (
          <Button onClick={stopSpeech} variant="destructive" size="lg">
            <Square className="mr-2 h-4 w-4" />
            停止
          </Button>
        ) : (
          <Button onClick={handlePlay} size="lg">
            <Play className="mr-2 h-4 w-4" />
            再生
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={() => { stopSpeech(); setIndex((i) => Math.min(items.length - 1, i + 1)) }}
          disabled={index === items.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
