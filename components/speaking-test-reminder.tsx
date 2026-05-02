"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Banner } from "@takaki/go-design-system";
import type { SpeakingScore } from "@/lib/types";

const SpeakingScoreModal = dynamic(
  () =>
    import("@/components/speaking-score-modal").then((m) => ({
      default: m.SpeakingScoreModal,
    })),
  { ssr: false },
);

function hasScoreThisMonth(scores: SpeakingScore[]): boolean {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return scores.some((s) => s.tested_at.startsWith(ym));
}

export function SpeakingTestReminder({
  testDay,
  initialScores,
}: {
  testDay: number;
  initialScores: SpeakingScore[];
}) {
  const [justSaved, setJustSaved] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  if (justSaved || hasScoreThisMonth(initialScores)) return null;

  return (
    <>
      <Banner
        variant="info"
        title="今月の NC AI Speaking Test"
        description={`毎月 ${testDay} 日が受検日です。スコアを記録すると非表示になります。`}
        action={{ label: "スコアを記録", onClick: () => setModalOpen(true) }}
      />
      <SpeakingScoreModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialScores={initialScores}
        onSaved={() => {
          setJustSaved(true);
          setModalOpen(false);
        }}
      />
    </>
  );
}
