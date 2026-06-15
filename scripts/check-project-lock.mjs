import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const projectRoot = fileURLToPath(new URL("../..", import.meta.url));

const requiredPaths = [
  "README.md",
  "docs/contexto-coordenador/_extraido/contexto-devs-piscinas-ia/landingpage-draft.md",
  "docs/contexto-coordenador/_extraido/contexto-devs-piscinas-ia/proposta-comercial-piscinas-ia.html",
  "docs/contexto-coordenador/contexto-devs-piscinas-ia.rar",
  "solara-piscina-ia-app",
  "pitch-delivery/output/README_ENTREGA_APRESENTACAO.md",
  "pitch-delivery/output/PROMPT_GEMINI_OMNI_VIDEO_ALINHADO.md",
  "pitch-delivery/output/ROTEIRO_VIDEO_PROMOCIONAL.md",
  "pitch-delivery/output/solara-piscina-ia-produto-pitch.pptx",
  "pitch-delivery/output/solara-piscina-ia-video-demo-atual.webm",
  "pitch-delivery/output/solara-piscina-ia-video-demo-atual.mp4"
];

const retiredPaths = [
  "OFFICIAL_DELIVERY_LOCK.md",
  "docs/00_SOLARA_PISCINA_IA_START_HERE.md",
  "docs/PRD_SOLARA_PISCINA_IA.md",
  "docs/55_SOLARA_PISCINA_IA_ALINHAMENTO_TECNICO.md",
  "deliverables",
  "data",
  "outputs",
  "assets",
  "pitch-delivery/package-staging",
  "pitch-delivery/presentation-zip-staging",
  "pitch-delivery/review-pptx-unzip",
  "pitch-delivery/review-slides"
];

const allowedTopLevel = new Set([".git", ".gitignore", ".vscode", "README.md", "PRD_SOLARA_PISCINA_IA.md", "docs", "pitch-delivery", "render.yaml", "solara-piscina-ia-app"]);
const failures = [];

for (const required of requiredPaths) {
  if (!existsSync(join(projectRoot, required))) failures.push(`Required path missing: ${required}`);
}

for (const retired of retiredPaths) {
  if (existsSync(join(projectRoot, retired))) failures.push(`Retired/ambiguous path still present: ${retired}`);
}

for (const entry of readdirSync(projectRoot, { withFileTypes: true })) {
  if (!allowedTopLevel.has(entry.name)) failures.push(`Unexpected top-level item: ${entry.name}`);
}

const activeDocs = [
  "README.md",
  "PRD_SOLARA_PISCINA_IA.md",
  "docs/credenciais-operacionais.md",
  "pitch-delivery/output/README_ENTREGA_APRESENTACAO.md"
];
const activeDocForbidden = [
  "solara-piscina-ia-deploy",
  "deploy-only",
  "Repo publico",
  "Repo privado completo",
  "/api/products",
  "Catalogo publico de upsell",
  "Cadastro simples de produtos/upsell implementado"
];
for (const doc of activeDocs) {
  const text = readFileSync(join(projectRoot, doc), "utf8");
  for (const forbidden of activeDocForbidden) {
    if (text.includes(forbidden)) failures.push(`Active doc ${doc} still has ambiguous/duplicated marker: ${forbidden}`);
  }
}
const landing = readFileSync(join(appRoot, "public/index.html"), "utf8");
for (const marker of ["Token 000000", "111111", "QR Code", "fotos, medidas e preferências", "Preferência de revestimento", "Preview IA futura", "Entrega em até 30 dias", "Último passo", "Tamanho desejado da piscina", "Receber orçamento personalizado", "Depois do orçamento", "IA futura"]) {
  if (!landing.includes(marker)) failures.push(`Landing missing briefing marker: ${marker}`);
}

for (const forbidden of ["[VALOR_MODULO_A]", "[VALOR_MODULO_B]", "[SETUP_CAMPANHA]", "Dois módulos independentes", "Proposta comercial", "Endpoint de imagem", "Prompts de imagem salvos", "Testar chamada dry-run"]) {
  if (landing.includes(forbidden)) failures.push(`Landing still exposes proposal placeholder: ${forbidden}`);
}

const imageConfig = readFileSync(join(appRoot, "src/image-generation-config.js"), "utf8");
const tokenConfig = readFileSync(join(appRoot, "src/tokens.js"), "utf8");
for (const marker of ["litellm.cogmo.com.br", "gpt-image-2"]) {
  if (!imageConfig.includes(marker)) failures.push(`Image config missing marker: ${marker}`);
}
for (const marker of ["prompts", "heroPromptKey", "heroLuxuryAqua", "poolDream", "111111"]) {
  if (!tokenConfig.includes(marker)) failures.push(`Token config missing marker: ${marker}`);
}

const server = readFileSync(join(appRoot, "server.mjs"), "utf8");
for (const marker of ["/000000", "isKnownTokenPath", "fallback-file", "dry-run", "photoFilesSaved", "terrainWidth", "desiredStyle"]) {
  if (!server.includes(marker)) failures.push(`Server missing marker: ${marker}`);
}

const localLeadsPath = join(appRoot, "leads.jsonl");
if (existsSync(localLeadsPath)) {
  const localLeads = readFileSync(localLeadsPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        failures.push("Local leads file has invalid JSONL records.");
        return null;
      }
    })
    .filter(Boolean);
  const smokeFixtures = localLeads.filter((lead) => lead.name === "Smoke Test" && lead.phone === "+15550000000");
  if (smokeFixtures.length) failures.push(`Local admin leads polluted by ${smokeFixtures.length} Smoke Test fixture(s).`);
}
if (failures.length) {
  console.error("Project check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`OK: coordinator briefing, landing focus, token 000000, QR Code, lead form and dry-run endpoint are aligned at ${relative(process.cwd(), projectRoot) || "."}`);

