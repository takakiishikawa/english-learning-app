import Link from "next/link";
import { PageHeader } from "@takaki/go-design-system";
import { BookOpen, MessageSquare, Mic, Play } from "lucide-react";

function PracticeCard({
  href,
  icon,
  title,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="group w-full text-left flex flex-col items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-card px-4 py-5 hover:border-[var(--color-border-default)] hover:border border-border transition-all"
    >
      <span className="text-muted-foreground">{icon}</span>
      <p className="text-sm font-medium text-foreground text-center leading-snug">
        {title}
      </p>
    </Link>
  );
}

export default function PracticePage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="練習を始める"
        description="練習するカテゴリを選んでください"
      />
      <div className="grid grid-cols-4 gap-3">
        <PracticeCard
          href="/repeating/grammar"
          icon={<BookOpen className="h-5 w-5" />}
          title="文法練習"
        />
        <PracticeCard
          href="/repeating/expression"
          icon={<MessageSquare className="h-5 w-5" />}
          title="フレーズ練習"
        />
        <PracticeCard
          href="/speaking"
          icon={<Mic className="h-5 w-5" />}
          title="スピーキング"
        />
        <PracticeCard
          href="/shadowing"
          icon={<Play className="h-5 w-5" />}
          title="シャドーイング"
        />
      </div>
    </div>
  );
}
