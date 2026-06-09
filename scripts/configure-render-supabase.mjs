import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const serviceId = process.env.RENDER_SERVICE_ID || "srv-d8hgqgdckfvc73e0m6ig";
const renderHost = "https://api.render.com/v1";

const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = required.filter((name) => !String(process.env[name] || "").trim());

if (missing.length) {
  console.error(`Configuracao Supabase pendente: ${missing.join(", ")}`);
  console.error("Valide a conexao Supabase antes de configurar o Render.");
  process.exit(1);
}

async function renderApiKey() {
  if (process.env.RENDER_API_KEY) return process.env.RENDER_API_KEY.trim();
  const configPath = join(homedir(), ".render", "cli.yaml");
  const config = await readFile(configPath, "utf8").catch(() => "");
  const match = config.match(/^\s*key:\s*(\S+)/m);
  return match?.[1] || "";
}

const apiKey = await renderApiKey();
if (!apiKey) {
  console.error("Configuracao Render pendente: chave de API nao encontrada.");
  process.exit(1);
}

const envVars = {
  LEAD_STORE_MODE: "supabase",
  STORAGE_MODE: "supabase",
  SUPABASE_URL: String(process.env.SUPABASE_URL).replace(/\/$/, ""),
  SUPABASE_SERVICE_ROLE_KEY: String(process.env.SUPABASE_SERVICE_ROLE_KEY).trim(),
  SUPABASE_STORAGE_BUCKET: String(process.env.SUPABASE_STORAGE_BUCKET || "solara-lead-photos").trim(),
  SUPABASE_LEADS_TABLE: String(process.env.SUPABASE_LEADS_TABLE || "solara_leads").trim()
};

async function updateEnvVar(key, value) {
  const response = await fetch(`${renderHost}/services/${serviceId}/env-vars/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${apiKey}`,
      accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify({ value })
  });

  if (response.status === 404) {
    return createEnvVar(key, value);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Falha ao atualizar ${key}: ${response.status} ${detail}`.trim());
  }
}

async function createEnvVar(key, value) {
  const response = await fetch(`${renderHost}/services/${serviceId}/env-vars`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify([{ key, value }])
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Falha ao criar ${key}: ${response.status} ${detail}`.trim());
  }
}

for (const [key, value] of Object.entries(envVars)) {
  await updateEnvVar(key, value);
  const safeValue = key.includes("KEY") ? "[secret]" : value;
  console.log(`OK: ${key}=${safeValue}`);
}

console.log("OK: Render configurado para Supabase. Acione novo deploy e rode QA de lead com foto.");
