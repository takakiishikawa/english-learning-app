"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@takaki/go-design-system";
import type { ChartConfig } from "@takaki/go-design-system";

type PracticeLog = {
  practiced_at: string;
  grammar_done_count: number;
  expression_done_count: number;
  speaking_count: number;
};

type NcLog = {
  logged_at: string;
  count: number;
  minutes: number;
};

type YoutubeLog = {
  completed_at: string;
  youtube_videos: { duration: string | null } | null;
};

function parseDurToMin(dur: string | null | undefined): number {
  if (!dur) return 0;
  const parts = dur.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 60 + parts[1];
  if (parts.length === 2) return parts[0];
  return 0;
}

function fmtMonth(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}/${m}`;
}

function fmtDate(str: string): string {
  const [, m, d] = str.split("-");
  return `${m}/${d}`;
}

type ChartRow = Record<string, string | number>;

function buildMonthlyData(
  logs: PracticeLog[],
  ncLogs: NcLog[],
): {
  repeating: ChartRow[];
  speaking: ChartRow[];
  nativeCamp: ChartRow[];
} {
  const rMap = new Map<
    string,
    { grammar: number; expression: number; speaking: number }
  >();
  for (const l of logs) {
    const ym = l.practiced_at.slice(0, 7);
    const e = rMap.get(ym) ?? { grammar: 0, expression: 0, speaking: 0 };
    rMap.set(ym, {
      grammar: e.grammar + l.grammar_done_count,
      expression: e.expression + l.expression_done_count,
      speaking: e.speaking + l.speaking_count,
    });
  }
  const ncMap = new Map<string, number>();
  for (const nc of ncLogs) {
    const ym = nc.logged_at.slice(0, 7);
    ncMap.set(ym, (ncMap.get(ym) ?? 0) + nc.minutes);
  }
  const allMonths = [...new Set([...rMap.keys(), ...ncMap.keys()])].sort();
  return {
    repeating: allMonths.map((ym) => ({
      label: fmtMonth(ym),
      grammar: rMap.get(ym)?.grammar ?? 0,
      expression: rMap.get(ym)?.expression ?? 0,
    })),
    speaking: allMonths.map((ym) => ({
      label: fmtMonth(ym),
      speaking: rMap.get(ym)?.speaking ?? 0,
    })),
    nativeCamp: allMonths.map((ym) => ({
      label: fmtMonth(ym),
      minutes: ncMap.get(ym) ?? 0,
    })),
  };
}

function buildAllTimeData(
  logs: PracticeLog[],
  ncLogs: NcLog[],
): {
  repeating: ChartRow[];
  speaking: ChartRow[];
  nativeCamp: ChartRow[];
} {
  const sorted = [...logs].sort((a, b) =>
    a.practiced_at.localeCompare(b.practiced_at),
  );
  const ncDayMap = new Map<string, number>();
  for (const nc of ncLogs)
    ncDayMap.set(nc.logged_at, (ncDayMap.get(nc.logged_at) ?? 0) + nc.minutes);
  const sortedNcDays = [...ncDayMap.keys()].sort();
  return {
    repeating: sorted.map((l) => ({
      label: fmtDate(l.practiced_at),
      grammar: l.grammar_done_count,
      expression: l.expression_done_count,
    })),
    speaking: sorted.map((l) => ({
      label: fmtDate(l.practiced_at),
      speaking: l.speaking_count,
    })),
    nativeCamp: sortedNcDays.map((d) => ({
      label: fmtDate(d),
      minutes: ncDayMap.get(d)!,
    })),
  };
}

function buildShadowingData(
  youtubeLogs: YoutubeLog[],
  mode: "monthly" | "alltime",
): ChartRow[] {
  if (mode === "monthly") {
    const map = new Map<string, number>();
    for (const l of youtubeLogs) {
      const ym = l.completed_at.slice(0, 7);
      map.set(
        ym,
        (map.get(ym) ?? 0) + parseDurToMin(l.youtube_videos?.duration),
      );
    }
    return [...map.keys()]
      .sort()
      .map((ym) => ({ label: fmtMonth(ym), minutes: map.get(ym) ?? 0 }));
  }
  const map = new Map<string, number>();
  for (const l of youtubeLogs) {
    const d = l.completed_at.slice(0, 10);
    map.set(d, (map.get(d) ?? 0) + parseDurToMin(l.youtube_videos?.duration));
  }
  return [...map.keys()]
    .sort()
    .map((d) => ({ label: fmtDate(d), minutes: map.get(d) ?? 0 }));
}

const repeatingConfig: ChartConfig = {
  grammar: { label: "文法", color: "var(--color-primary)" },
  expression: { label: "フレーズ", color: "var(--color-primary-chart-2)" },
};
const speakingConfig: ChartConfig = {
  speaking: { label: "スピーキング", color: "var(--color-primary)" },
};
const ncConfig: ChartConfig = {
  minutes: { label: "学習時間", color: "var(--color-primary)" },
};
const shadowingConfig: ChartConfig = {
  minutes: { label: "視聴時間", color: "var(--color-primary)" },
};

function ReportAreaChart({
  data,
  config,
  xKey,
  yKeys,
  title,
  unit,
}: {
  data: Record<string, unknown>[];
  config: ChartConfig;
  xKey: string;
  yKeys: string[];
  title: string;
  unit?: string;
}) {
  return (
    <Card className="border border-border border border-[var(--color-border-default)]">
      <CardHeader className="pb-1 pt-4 px-5">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-[0.05em]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4 pt-2">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            >
              <defs>
                {yKeys.map((key) => {
                  const color =
                    (config[key]?.color as string | undefined) ??
                    "var(--color-primary)";
                  return (
                    <linearGradient
                      key={key}
                      id={`report-fill-${key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
                tickMargin={8}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
                width={40}
                allowDecimals={false}
                unit={unit}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                }}
              />
              {yKeys.map((key) => {
                const color =
                  (config[key]?.color as string | undefined) ??
                  "var(--color-primary)";
                return (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={config[key]?.label as string | undefined}
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#report-fill-${key})`}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportCharts({
  logs,
  ncLogs,
  youtubeLogs,
}: {
  logs: PracticeLog[];
  ncLogs: NcLog[];
  youtubeLogs: YoutubeLog[];
}) {
  const [mode, setMode] = useState<"monthly" | "alltime">("monthly");
  const monthly = buildMonthlyData(logs, ncLogs);
  const alltime = buildAllTimeData(logs, ncLogs);
  const data = mode === "monthly" ? monthly : alltime;
  const shadowingData = buildShadowingData(youtubeLogs, mode);

  return (
    <Tabs
      value={mode}
      onValueChange={(v) => setMode(v as "monthly" | "alltime")}
    >
      <TabsList>
        <TabsTrigger value="monthly">月次</TabsTrigger>
        <TabsTrigger value="alltime">全期間</TabsTrigger>
      </TabsList>
      <TabsContent value={mode} className="space-y-3 mt-4">
        <ReportAreaChart
          data={data.repeating as Record<string, unknown>[]}
          config={repeatingConfig}
          xKey="label"
          yKeys={["grammar", "expression"]}
          title="リピーティング"
          unit="回"
        />
        <ReportAreaChart
          data={data.speaking as Record<string, unknown>[]}
          config={speakingConfig}
          xKey="label"
          yKeys={["speaking"]}
          title="スピーキング"
          unit="回"
        />
        <ReportAreaChart
          data={data.nativeCamp as Record<string, unknown>[]}
          config={ncConfig}
          xKey="label"
          yKeys={["minutes"]}
          title="Native Camp"
          unit="分"
        />
        <ReportAreaChart
          data={shadowingData as Record<string, unknown>[]}
          config={shadowingConfig}
          xKey="label"
          yKeys={["minutes"]}
          title="シャドーイング"
          unit="分"
        />
      </TabsContent>
    </Tabs>
  );
}
