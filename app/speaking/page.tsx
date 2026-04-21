import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, Badge, PageHeader } from "@takaki/go-design-system"
import { GenerateImagesButton } from "./GenerateImagesButton"

const SESSIONS_REQUIRED = 3

function SessionDots({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: SESSIONS_REQUIRED }).map((_, i) => (
        <span
          key={i}
          className={`inline-block w-2 h-2 rounded-full transition-colors ${
            i < count
              ? "bg-[color:var(--color-grammar)]"
              : "bg-muted-foreground/20"
          }`}
        />
      ))}
    </div>
  )
}

export default async function SpeakingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: grammars }, { data: pendingGrammars }, { data: speakingLogs }] = await Promise.all([
    supabase
      .from("grammar")
      .select("id, name, summary, image_url, play_count, lessons!lesson_id(lesson_no)")
      .not("image_url", "is", null)
      .or("play_count.is.null,play_count.lt.10")
      .order("created_at", { ascending: false }),
    supabase
      .from("grammar")
      .select("id, name")
      .is("image_url", null)
      .order("created_at", { ascending: false }),
    user
      ? supabase.from("speaking_logs").select("grammar_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
  ])

  // grammar_id ごとのセッション数を集計
  const sessionCounts = new Map<string, number>()
  for (const log of speakingLogs ?? []) {
    sessionCounts.set(log.grammar_id, (sessionCounts.get(log.grammar_id) ?? 0) + 1)
  }

  const allWithImages = (grammars ?? []).map(g => ({ id: g.id, name: g.name }))
  const items = grammars ?? []
  const pending = pendingGrammars ?? []

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="スピーキング"
        description="画像を見ながら英語で説明する練習"
        actions={allWithImages.length > 0 ? (
          <GenerateImagesButton
            items={allWithImages}
            force
            label="全画像を再生成"
            variant="outline"
          />
        ) : undefined}
      />

      {/* Pending image generation banner */}
      {pending.length > 0 && (
        <div className="rounded-lg border border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning)]/10 px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-[color:var(--color-warning)]">
            {pending.length}件の文法の画像がまだ生成されていません
          </p>
          <GenerateImagesButton items={pending} />
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
          <p className="text-lg">練習できる文法がありません</p>
          <p className="text-sm">テキストを追加すると画像が自動生成されます</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((g) => {
            const lesson = Array.isArray(g.lessons) ? g.lessons[0] : g.lessons
            const sessions = Math.min(sessionCounts.get(g.id) ?? 0, SESSIONS_REQUIRED)
            return (
              <Link key={g.id} href={`/speaking/${g.id}`}>
                <Card className="cursor-pointer hover:shadow-md hover:border-[var(--color-border-default)] transition-all overflow-hidden group p-0 border-[var(--color-border-default)] shadow-sm">
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={g.image_url!}
                      alt={g.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      {lesson ? (
                        <Badge variant="outline">
                          No.{(lesson as { lesson_no: string }).lesson_no}
                        </Badge>
                      ) : <span />}
                      <SessionDots count={sessions} />
                    </div>
                    <p className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
                      {g.name}
                    </p>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
