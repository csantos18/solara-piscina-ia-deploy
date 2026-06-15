import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { TOKENS } from "../src/tokens.js";

const port = 4197;
const baseUrl = `http://localhost:${port}`;
const adminToken = "check-smoke-admin-token";
const runtimeDir = join(tmpdir(), `solara-check-smoke-${Date.now()}`);
await mkdir(runtimeDir, { recursive: true });

const server = spawn(process.execPath, ["server.mjs"], {
  cwd: new URL("..", import.meta.url),
  env: {
    ...process.env,
    PORT: String(port),
    ADMIN_TOKEN: adminToken,
    LEADS_FILE_PATH: join(runtimeDir, "leads.jsonl"),
    LEAD_UPLOADS_DIR: join(runtimeDir, "lead-uploads")
  },
  stdio: ["ignore", "pipe", "pipe"]
});

let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });

async function waitForServer() {
  const started = Date.now();
  while (Date.now() - started < 8000) {
    try {
      const response = await fetch(`${baseUrl}/000000`);
      if (response.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 180));
  }
  throw new Error(`Servidor não respondeu em ${baseUrl}. Saida: ${serverOutput}`);
}

async function assertResponse(path, expectedStatus) {
  const response = await fetch(`${baseUrl}${path}`);
  if (response.status !== expectedStatus) throw new Error(`${path} retornou ${response.status}; esperado ${expectedStatus}.`);
  return response;
}

async function assertJson(path, body, expectedStatus, validaté) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-admin-token": adminToken },
    body: JSON.stringify(body)
  });
  if (response.status !== expectedStatus) throw new Error(`${path} retornou ${response.status}; esperado ${expectedStatus}.`);
  const data = await response.json();
  validaté(data);
}

try {
  await waitForServer();

  const landingResponse = await assertResponse("/000000", 200);
  const landingText = await landingResponse.text();
  for (const marker of [
    "Solara Piscina IA",
    "Token 000000",
    "QR Code",
    "Receber orçamento personalizado",
    "Envie fotos do seu terreno",
    "Preview IA futura",
    "Entrega em até 30 dias",
    "Pré-imagens por token",
    "Depois do orçamento",
    "IA futura",
    "cadastro de produtos"
  ]) {
    if (!landingText.includes(marker)) throw new Error(`/000000 não contem marcador obrigatorio: ${marker}`);
  }

  for (const forbidden of ["[VALOR_MODULO_A]", "[VALOR_MODULO_B]", "[SETUP_CAMPANHA]", "Dois módulos independentes", "Proposta comercial", "Endpoint de imagem", "Prompts de imagem salvos", "Testar chamada dry-run"]) {
    if (landingText.includes(forbidden)) throw new Error(`Landing ainda expoe placeholder comercial: ${forbidden}`);
  }

  await assertResponse("/111111", 200);
  await assertResponse("/badtoken", 404);
  await assertResponse("/rota-reservada-1", 410);
  await assertResponse("/src/tokens.js", 404);
  await assertResponse("/src/image-generation-config.js", 404);
  await assertResponse("/styles.css", 200);
  await assertResponse("/app.js", 200);
  await assertResponse("/images/qr-token-000000.png", 200);
  await assertResponse("/images/qr-token-111111.png", 200);

  const demo = TOKENS["000000"];
  if (demo.images.length !== 6) throw new Error(`Esperado 6 imagens do pacote do coordenador; atual: ${demo.images.length}.`);
  for (const image of demo.images) {
    if (!image.originalFile || !image.source?.includes("28/05/2026")) throw new Error(`Imagem sem origem registrada: ${image.id}`);
    const response = await assertResponse(image.src, 200);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) throw new Error(`${image.src} retornou content-type invalido: ${contentType}`);
  }

  await assertJson("/api/image-generation/request", { token: "000000", promptKey: "poolDream" }, 200, (data) => {
    if (!data.ok || data.mode !== "dry-run") throw new Error("Dry-run de imagem não retornou ok/mode esperado.");
    if (!data.endpoint?.includes("litellm.cogmo.com.br")) throw new Error("Endpoint LiteLLM ausente no dry-run.");
    if (data.payload?.metadata?.promptKey !== "poolDream") throw new Error("PromptKey incorreto no payload dry-run.");
  });

  await assertJson("/api/image-generation/request", { token: "000000", promptKey: "nãoExiste" }, 400, (data) => {
    if (data.ok !== false) throw new Error("Prompt invalido deveria retornar ok=false.");
  });

  await assertJson("/api/leads", { token: "000000", name: "Smoke Test", phone: "+15550000000", interest: "Piscina completa", availableArea: "10m x 7m", poolSize: "7m x 3m", depthPreference: "Família e lazer", shapePreference: "Retangular moderna", coatingPreference: "Azul cristalino", deckPreference: "Deck moderno", visualGoal: "Visual de resort para receber amigos", photoCount: 2, terrainWidth: "10m", terrainLength: "7m", soilType: "Terra / grama", desiredStyle: "Resort", photos: [{ name: "terreno-frente.jpg", type: "image/jpeg", size: 12, dataUrl: "data:image/jpeg;base64,AAECAwQFBgcICQ==" }, { name: "terreno-fundo.png", type: "image/png", size: 10, dataUrl: "data:image/png;base64,AAECAwQFBg==" }] }, 201, (data) => {
    if (!data.ok) throw new Error("Lead não retornou ok=true.");
    if (data.record?.token !== "000000") throw new Error("Token do lead incorreto.");
    if (data.record?.poolSize !== "7m x 3m") throw new Error("Medidas do lead não foram persistidas.");
    if (data.record?.terrainWidth !== "10m" || data.record?.terrainLength !== "7m") throw new Error("Dimensoes do terreno não foram persistidas.");
    if (data.record?.desiredStyle !== "Resort") throw new Error("Estilo desejádo não foi persistido.");
    if (data.record?.coatingPreference !== "Azul cristalino") throw new Error("Preferencia de revestimento não foi persistida.");
    if (data.record?.photoCount !== 2 || data.record?.photos?.length !== 2) throw new Error("Fotos do lead não foram persistidas.");
    if (data.record?.photoFilesSaved !== 2) throw new Error("Arquivos das fotos não foram salvos.");
  });

  console.log("OK: smoke test completo da landing focada passou.");
} finally {
  server.kill();
  await rm(runtimeDir, { recursive: true, force: true });
}




