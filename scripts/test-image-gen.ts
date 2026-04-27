/**
 * 1件だけ /api/generate-images の処理フローをローカルで再現して
 * SUPABASE_SERVICE_ROLE_KEY が有効か検証するスクリプト
 *
 * 実行: npx tsx scripts/test-image-gen.ts
 *
 * .env.local から環境変数を読み込み、実際に Imagen API → Supabase Storage
 * upload → grammar.image_url 更新までを 1 件分実行する。
 *
 * 出力には URL と key 先頭 20 文字しか出さないので秘密は流出しない。
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ── .env.local を最小限のパーサで読み込む ──────────────────────
function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error(`✗ .env.local not found at ${envPath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, "utf-8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const IMAGEN_API_KEY = process.env.GOOGLE_IMAGEN_API_KEY;

function abbr(s: string | undefined, n = 20): string {
  if (!s) return "(undefined)";
  return `${s.slice(0, n)}... (len=${s.length})`;
}

console.log("Environment:");
console.log("  NEXT_PUBLIC_SUPABASE_URL  :", SUPABASE_URL ?? "(undefined)");
console.log("  SUPABASE_SERVICE_ROLE_KEY :", abbr(SERVICE_ROLE_KEY));
console.log("  GOOGLE_IMAGEN_API_KEY     :", abbr(IMAGEN_API_KEY));
console.log();

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !IMAGEN_API_KEY) {
  console.error("✗ 必要な環境変数が揃っていません");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  db: { schema: "nativego" },
  auth: { autoRefreshToken: false, persistSession: false },
});

async function step1_pickGrammar() {
  console.log("[1/4] image_url IS NULL の grammar を 1 件取得");
  const { data, error } = await admin
    .from("grammar")
    .select("id, name")
    .is("image_url", null)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`grammar 取得失敗: ${error.message}`);
  if (!data) throw new Error("image_url IS NULL の grammar が無い");
  console.log(`      → id=${data.id}, name="${data.name}"`);
  return data as { id: string; name: string };
}

async function step2_imagen(name: string): Promise<Buffer> {
  console.log("[2/4] Imagen API 呼び出し");
  const prompt = `Four sequential illustration panels arranged in a 2x2 grid, showing a wordless visual story that demonstrates the concept: ${name}.

Panel 1 (top-left): Establish the scene and introduce the characters.
Panel 2 (top-right): A situation arises naturally.
Panel 3 (bottom-left): Characters interact or react to the situation.
Panel 4 (bottom-right): The story reaches a resolution.

The setting is everyday urban life. Characters are consistent across all 4 panels. Clear visible borders separate each panel.

ABSOLUTELY NO text, NO letters, NO numbers, NO words, NO speech bubbles, NO thought bubbles, NO signs with writing, NO captions, NO labels of any kind anywhere in the image. Pure visual storytelling only.

Warm, simple illustration style. Clean lines. Not photorealistic.`;

  const t0 = Date.now();
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${IMAGEN_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1 },
      }),
    },
  );
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`      → status=${res.status}, ${elapsed}s`);

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Imagen API ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    predictions?: { bytesBase64Encoded?: string; mimeType?: string }[];
  };
  const pred = data.predictions?.[0];
  if (!pred?.bytesBase64Encoded) {
    throw new Error(
      `Imagen response に bytesBase64Encoded なし: ${JSON.stringify(data).slice(0, 300)}`,
    );
  }
  const buffer = Buffer.from(pred.bytesBase64Encoded, "base64");
  console.log(`      → image size: ${(buffer.length / 1024).toFixed(0)} KB`);
  return buffer;
}

async function step3_upload(grammarId: string, buffer: Buffer): Promise<string> {
  console.log("[3/4] Supabase Storage に upload");
  // 本番のパス規則 ${user.id}/${grammar.id}.png に合わせる代わりに、
  // テスト時はユーザー無しで grammar.id 直下に置く (force=true 相当)
  const fileName = `_test_${grammarId}.png`;

  const t0 = Date.now();
  const { error } = await admin.storage
    .from("speaking-images")
    .upload(fileName, buffer, { contentType: "image/png", upsert: true });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  if (error) {
    throw new Error(
      `★ Storage upload 失敗 (${elapsed}s): ${error.message}\n  これが「signature verification failed」なら SERVICE_ROLE_KEY が依然 invalid`,
    );
  }
  console.log(`      → upload OK (${elapsed}s)`);

  const { data } = admin.storage
    .from("speaking-images")
    .getPublicUrl(fileName);
  console.log(`      → public URL: ${data.publicUrl}`);
  return data.publicUrl;
}

async function step4_cleanup(grammarId: string) {
  console.log("[4/4] テスト用ファイルを削除");
  const fileName = `_test_${grammarId}.png`;
  const { error } = await admin.storage
    .from("speaking-images")
    .remove([fileName]);
  if (error) {
    console.warn(`      ⚠ cleanup 失敗(無害): ${error.message}`);
  } else {
    console.log(`      → 削除 OK`);
  }
}

async function main() {
  try {
    const grammar = await step1_pickGrammar();
    const buffer = await step2_imagen(grammar.name);
    const url = await step3_upload(grammar.id, buffer);
    await step4_cleanup(grammar.id);

    console.log();
    console.log("════════════════════════════════════════");
    console.log("✓ ALL OK — SERVICE_ROLE_KEY は有効、フル再生成して大丈夫");
    console.log("════════════════════════════════════════");
    console.log("verified URL:", url);
  } catch (e) {
    console.log();
    console.log("════════════════════════════════════════");
    console.error("✗ FAILED");
    console.error(e instanceof Error ? e.message : e);
    console.log("════════════════════════════════════════");
    process.exit(1);
  }
}

main();
