"use client";

import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@takaki/go-design-system";
import { Zap, Flame, Mountain, ChevronRight } from "lucide-react";
import { useCurrentLanguage } from "@/lib/language-context";

const PRESETS_EN = [30, 50, 100] as const;
const PRESETS_VI = [10, 20, 30] as const;

type Option = {
  count: number;
  label: string;
  desc: string;
  icon: React.ReactNode;
  primary?: boolean;
};

export function RepeatingCountPicker({
  total,
  onSelect,
}: {
  total: number;
  onSelect: (count: number) => void;
}) {
  const router = useRouter();
  const language = useCurrentLanguage();

  const descs = ["サクッと", "集中して", "がっつり"] as const;
  const icons = [
    <Zap key="z" className="h-4 w-4" />,
    <Flame key="f" className="h-4 w-4" />,
    <Mountain key="m" className="h-4 w-4" />,
  ];

  const presets = language === "vi" ? PRESETS_VI : PRESETS_EN;
  const options: Option[] = presets.map((n, i) => ({
    count: Math.min(n, total),
    label: `${Math.min(n, total)}件`,
    desc: descs[i],
    icon: icons[i],
  }));

  // Dedupe (e.g. when total < 10, all three options would say the same number)
  const seen = new Set<number>();
  const uniqueOptions = options.filter((o) => {
    if (seen.has(o.count)) return false;
    seen.add(o.count);
    return true;
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.push("/");
      }}
    >
      <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>今日のペースを選ぼう</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          {uniqueOptions.map((o) => (
            <Button
              key={o.count}
              size="lg"
              variant={o.primary ? "default" : "outline"}
              className="w-full justify-between h-14"
              onClick={() => onSelect(o.count)}
            >
              <span className="flex items-center gap-3">
                {o.icon}
                <span className="text-base font-medium">{o.label}</span>
              </span>
              <span className="flex items-center gap-2 opacity-70">
                <span className="text-xs">{o.desc}</span>
                <ChevronRight className="h-4 w-4" />
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
