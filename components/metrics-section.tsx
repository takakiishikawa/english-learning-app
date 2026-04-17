"use client"

import { useState } from "react"
import { NativeCampModal } from "@/components/native-camp-modal"
import { SpeakingScoreModal } from "@/components/speaking-score-modal"
import { PencilSquareIcon } from "@heroicons/react/24/outline"
import { TrendingUp, TrendingDown } from "lucide-react"
import type { SpeakingScore } from "@/lib/types"

interface Props {
  weeklyRepeating: number
  weeklyGrammar: number
  weeklyExpression: number
  weeklySpeaking: number
  weeklyNativeCampCount: number
  weeklyShadowing: number
  repeatingDiff: number | null
  speakingDiff: number | null
  ncCountDiff: number | null
  shadowingDiff: number | null
  latestScore: number | null
  scoreDiff: number | null
  initialScores: SpeakingScore[]
}

function DiffBadge({ diff, unit = "" }: { diff: number | null; unit?: string }) {
  if (diff === null) return null
  if (diff === 0) return <span className="text-xs text-muted-foreground">前7日比 ±0{unit}</span>
  const positive = diff > 0
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${positive ? "text-[#16A34A]" : "text-destructive"}`}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      前7日比 {positive ? "+" : ""}{diff}{unit}
    </span>
  )
}

function MetricCard({
  label,
  value,
  unit,
  sub,
  diff,
  diffUnit,
  action,
}: {
  label: string
  value: React.ReactNode
  unit: string
  sub?: string
  diff: number | null
  diffUnit?: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-[8px] bg-muted px-4 py-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.05em]">
          {label}
        </span>
        {action}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[28px] font-medium leading-none tabular-nums">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      <div className="mt-1.5 min-h-[16px]">
        <DiffBadge diff={diff} unit={diffUnit} />
      </div>
    </div>
  )
}

export function MetricsSection({
  weeklyRepeating,
  weeklyGrammar,
  weeklyExpression,
  weeklySpeaking,
  weeklyNativeCampCount,
  weeklyShadowing,
  repeatingDiff,
  speakingDiff,
  ncCountDiff,
  shadowingDiff,
  latestScore,
  scoreDiff,
  initialScores,
}: Props) {
  const [ncOpen, setNcOpen] = useState(false)
  const [scoreOpen, setScoreOpen] = useState(false)

  const editBtn = (onClick: () => void) => (
    <button
      onClick={onClick}
      className="rounded p-0.5 hover:bg-muted-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
    >
      <PencilSquareIcon className="h-3.5 w-3.5" />
    </button>
  )

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          label="リピーティング"
          value={weeklyRepeating}
          unit="回"
          sub={`文法 ${weeklyGrammar} / フレーズ ${weeklyExpression}`}
          diff={repeatingDiff}
        />
        <MetricCard
          label="スピーキング"
          value={weeklySpeaking}
          unit="回"
          diff={speakingDiff}
        />
        <MetricCard
          label="Native Camp"
          value={weeklyNativeCampCount * 25}
          unit="分"
          sub={`${weeklyNativeCampCount}回`}
          diff={ncCountDiff !== null ? ncCountDiff * 25 : null}
          diffUnit="分"
          action={editBtn(() => setNcOpen(true))}
        />
        <MetricCard
          label="シャドーイング"
          value={weeklyShadowing}
          unit="分"
          diff={shadowingDiff}
          diffUnit="分"
        />
        <div className="rounded-[8px] bg-muted px-4 py-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.05em]">
              AI Speaking Test
            </span>
            {editBtn(() => setScoreOpen(true))}
          </div>
          {latestScore !== null ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] font-medium leading-none tabular-nums">{latestScore}</span>
                <span className="text-sm text-muted-foreground">点</span>
              </div>
              {scoreDiff !== null && (
                <p className={`text-xs mt-1 flex items-center gap-0.5 ${scoreDiff >= 0 ? "text-[#16A34A]" : "text-destructive"}`}>
                  {scoreDiff >= 0 ? "↑" : "↓"} 前回比 {scoreDiff >= 0 ? "+" : ""}{scoreDiff}点
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">未記録</p>
          )}
        </div>
      </div>

      <NativeCampModal open={ncOpen} onClose={() => setNcOpen(false)} />
      <SpeakingScoreModal open={scoreOpen} onClose={() => setScoreOpen(false)} initialScores={initialScores} />
    </>
  )
}
