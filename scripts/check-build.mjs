import { readFile } from "node:fs/promises";
import { TOKENS } from "../src/tokens.js";
import { IMAGE_GENERATION } from "../src/image-generation-config.js";

const requiredFiles = [
  "public/index.html",
  "public/styles.css",
  "public/app.js",
  "src/tokens.js",
  "src/image-generation-config.js"
];

const publicApp = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
if (!publicApp.includes("/images/qr-token-${tokenData.token}.png")) throw new Error("QR Code local por token não configurado.");
if (!publicApp.includes("copyTokenLink")) throw new Error("Botao claro para copiar link do token nao configurado.");
if (publicApp.includes("api.qrserver.com")) throw new Error("QR Code não deve depender de serviço externo.");
if (!publicApp.includes("updateUploadStatus")) throw new Error("Upload interativo sem status no app público.");
if (!publicApp.includes("styleProfiles")) throw new Error("Perfis Familiar/Moderna/Área Lounge não configurados no app público.");
for (const marker of ["Convivência, segurança", "Linhas limpas", "Área Lounge", "Resort em casa"]) {
  if (!publicApp.includes(marker)) throw new Error(`Narrativa de estilo ausente no app público: ${marker}`);
}

for (const file of requiredFiles) {
  const text = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
  if (text.includes("`r`n")) {
    throw new Error(`Arquivo contém sequência literal quebrada: ${file}`);
  }
}

const demo = TOKENS["000000"];
if (!demo) throw new Error("Token demo 000000 não encontrado.");
if (!TOKENS["111111"]) throw new Error("Token demo 111111 não encontrado para provar variação por cliente.");
if (!IMAGE_GENERATION.imageEndpoint.includes("litellm.cogmo.com.br")) {
  throw new Error("Endpoint LiteLLM não configurado.");
}

for (const [token, config] of Object.entries(TOKENS)) {
  if (!config.heroImage) throw new Error(`Token sem imagem principal: ${token}`);
  if (!config.heroPromptKey || !config.prompts[config.heroPromptKey]) {
    throw new Error(`Imagem principal sem prompt registrado no token ${token}.`);
  }
  if (config.images.length !== 6) {
    throw new Error(`A galeria do token ${token} deve usar 6 imagens iniciais; atual: ${config.images.length}.`);
  }
  for (const image of config.images) {
    if (!config.prompts[image.promptKey]) {
      throw new Error(`Imagem sem prompt registrado no token ${token}: ${image.id}`);
    }
    if (!image.originalFile || !image.source?.includes("28/05/2026")) {
      throw new Error(`Imagem sem origem do pacote de 28/05/2026 registrada no token ${token}: ${image.id}`);
    }
  }
}

console.log("OK: landing page, token 000000, endpoint e prompts estão configurados.");


