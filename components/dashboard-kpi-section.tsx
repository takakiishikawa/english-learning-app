"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { SectionCards, type KpiCard, Button } from "@takaki/go-design-system";
import { Pencil } from "lucide-react";
import type { SpeakingScore } from "@/lib/types";

const NativeCampModal = dynamic(
  () =>
    import("@/components/native-camp-modal").then((m) => ({
      default: m.NativeCampModal,
    })),
  { ssr: false },
);
const SpeakingScoreModal = dynamic(
  () =>
    import("@/components/speaking-score-modal").then((m) => ({
      default: m.SpeakingScoreModal,
    })),
  { ssr: false },
);

type BaseCard = Omit<KpiCard, "actions">;

const NC_INDEX = 2;
const SPEAKING_SCORE_INDEX = 4;

function EditIconButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="p-1 rounded-md text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
      aria-label="編集"
      variant="ghost"
    >
      <Pencil className="h-3.5 w-3.5" />
    </Button>
  );
}

export function DashboardKpiSection({
  cards,
  initialScores,
}: {
  cards: BaseCard[];
  initialScores: SpeakingScore[];
}) {
  const [ncOpen, setNcOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);

  const enriched: KpiCard[] = cards.map((card, i) => {
    if (i === NC_INDEX) {
      return {
        ...card,
        actions: <EditIconButton onClick={() => setNcOpen(true)} />,
      };
    }
    if (i === SPEAKING_SCORE_INDEX) {
      return {
        ...card,
        actions: <EditIconButton onClick={() => setScoreOpen(true)} />,
      };
    }
    return card;
  });

  return (
    <>
      <SectionCards cards={enriched} />
      <NativeCampModal open={ncOpen} onClose={() => setNcOpen(false)} />
      <SpeakingScoreModal
        open={scoreOpen}
        onClose={() => setScoreOpen(false)}
        initialScores={initialScores}
      />
    </>
  );
}
