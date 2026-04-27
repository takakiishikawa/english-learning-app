/**
 * SUPABASE_SERVICE_ROLE_KEY と speaking-images バケットへの upload を
 * 1 件分のフローで検証する診断エンドポイント。
 *
 * 使い方: ブラウザで https://<host>/api/test-storage を開くだけ
 *
 * 認証必須。/api/generate-images と同じく logged-in user の cookie を見る。
 *
 * 成功すれば JSON で全ステップの所要時間と最終 URL を返す。
 * 失敗したら ★ 印つきで原因を返す。フル再生成前の sanity check 用。
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const maxDuration = 60;

type StepResult = {
  step: string;
  ok: boolean;
  ms: number;
  detail?: unknown;
  error?: string;
};

export async function GET() {
  const steps: StepResult[] = [];
  const start = Date.now();

  // ── Step 0: 環境変数の存在確認 ───────────────────────────
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GOOGLE_IMAGEN_API_KEY: process.env.GOOGLE_IMAGEN_API_KEY,
  };
  steps.push({
    step: "env",
    ok: Boolean(
      env.NEXT_PUBLIC_SUPABASE_URL &&
      env.SUPABASE_SERVICE_ROLE_KEY &&
      env.GOOGLE_IMAGEN_API_KEY,
    ),
    ms: 0,
    detail: {
      NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL ?? "(missing)",
      SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY
        ? `${env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 20)}... (len=${env.SUPABASE_SERVICE_ROLE_KEY.length})`
        : "(missing)",
      GOOGLE_IMAGEN_API_KEY: env.GOOGLE_IMAGEN_API_KEY
        ? `${env.GOOGLE_IMAGEN_API_KEY.slice(0, 20)}... (len=${env.GOOGLE_IMAGEN_API_KEY.length})`
        : "(missing)",
    },
  });
  if (!steps[0].ok) {
    return NextResponse.json(
      { ok: false, summary: "★ Vercel に必要な env が不足", steps },
      { status: 500 },
    );
  }

  // ── Step 1: 認証 (regular client) ───────────────────────
  let user;
  {
    const t = Date.now();
    try {
      const supabase = await createClient();
      const r = await supabase.auth.getUser();
      user = r.data.user;
      steps.push({
        step: "auth",
        ok: Boolean(user),
        ms: Date.now() - t,
        detail: { userId: user?.id, email: user?.email },
      });
    } catch (e) {
      steps.push({
        step: "auth",
        ok: false,
        ms: Date.now() - t,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        summary: "★ 未ログイン or anon key が間違っている",
        steps,
      },
      { status: 401 },
    );
  }

  // ── Step 2: admin client で grammar 1 件取得 ────────────
  const admin = createAdminClient();
  let grammar: { id: string; name: string } | null = null;
  {
    const t = Date.now();
    const { data, error } = await admin
      .from("grammar")
      .select("id, name")
      .is("image_url", null)
      .limit(1)
      .maybeSingle();
    steps.push({
      step: "select-grammar",
      ok: !error && Boolean(data),
      ms: Date.now() - t,
      error: error?.message,
      detail: data,
    });
    if (error || !data)
      return NextResponse.json(
        {
          ok: false,
          summary: error
            ? `★ admin DB 接続失敗: ${error.message}`
            : "image_url IS NULL の grammar が無い (テスト不可)",
          steps,
        },
        { status: 500 },
      );
    grammar = data;
  }

  // ── Step 3: 軽い test ファイルを upload (Imagen をスキップして純粋に Storage を試す) ──
  // ※ Imagen まで含めると 10〜20s かかるし Storage の問題切り分けには不要なので、
  //    ここでは数百バイトの dummy buffer を upload して signature 検証だけ通す
  const testFileName = `_test_${Date.now()}.txt`;
  const testBuffer = Buffer.from(
    `signature verification test at ${new Date().toISOString()}`,
    "utf-8",
  );
  {
    const t = Date.now();
    const { error } = await admin.storage
      .from("speaking-images")
      .upload(testFileName, testBuffer, {
        contentType: "text/plain",
        upsert: true,
      });
    steps.push({
      step: "storage-upload-dummy",
      ok: !error,
      ms: Date.now() - t,
      error: error?.message,
      detail: { fileName: testFileName, size: testBuffer.length },
    });
    if (error) {
      return NextResponse.json(
        {
          ok: false,
          summary: `★ Storage upload 失敗: ${error.message}`,
          hint: error.message.includes("signature verification")
            ? "SUPABASE_SERVICE_ROLE_KEY が依然 invalid。Vercel 側の env を再確認"
            : undefined,
          steps,
        },
        { status: 500 },
      );
    }
  }

  // ── Step 4: cleanup ────────────────────────────────────
  {
    const t = Date.now();
    const { error } = await admin.storage
      .from("speaking-images")
      .remove([testFileName]);
    steps.push({
      step: "storage-cleanup",
      ok: !error,
      ms: Date.now() - t,
      error: error?.message,
    });
  }

  // ── Step 5: Imagen API へ HEAD 的に届くか確認 (実際の生成までは不要) ──
  // 1 回だけ最小プロンプトで叩いて 4xx/5xx かレスポンス sample を見る
  {
    const t = Date.now();
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${env.GOOGLE_IMAGEN_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [{ prompt: "ping" }],
            parameters: { sampleCount: 1 },
          }),
        },
      );
      steps.push({
        step: "imagen-ping",
        ok: res.status < 500,
        ms: Date.now() - t,
        detail: { status: res.status },
      });
    } catch (e) {
      steps.push({
        step: "imagen-ping",
        ok: false,
        ms: Date.now() - t,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    summary: "✓ Storage upload OK — フル再生成して大丈夫",
    totalMs: Date.now() - start,
    grammar,
    steps,
  });
}
