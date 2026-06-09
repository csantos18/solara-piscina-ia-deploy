const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = required.filter((name) => !String(process.env[name] || "").trim());

if (missing.length) {
  console.error(`Configuracao Supabase pendente: ${missing.join(", ")}`);
  console.error("Preencha as variaveis locais antes de validar a conexao.");
  process.exit(1);
}

const url = String(process.env.SUPABASE_URL).replace(/\/$/, "");
const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY).trim();
if (key === "substitua_pela_secret_key_local" || !key.startsWith("sb_secret_")) {
  console.error("Configuracao Supabase pendente: Secret key nao informada.");
  console.error("Preencha SUPABASE_SERVICE_ROLE_KEY no arquivo local .env.supabase.local antes da validacao.");
  process.exit(1);
}
const table = String(process.env.SUPABASE_LEADS_TABLE || "solara_leads").trim();
const bucket = String(process.env.SUPABASE_STORAGE_BUCKET || "solara-lead-photos").trim();
const writeTest = process.env.SUPABASE_WRITE_TEST === "1";

const authHeaders = {
  apikey: key,
  authorization: `Bearer ${key}`
};

async function readText(response) {
  return response.text().catch(() => "");
}

async function expectOk(label, response) {
  if (response.ok) return response;
  const detail = await readText(response);
  throw new Error(`${label} falhou: ${response.status} ${detail}`.trim());
}

async function checkTable() {
  const response = await fetch(`${url}/rest/v1/${encodeURIComponent(table)}?select=id&limit=1`, {
    headers: { ...authHeaders, accept: "application/json" }
  });
  await expectOk(`Leitura da tabela ${table}`, response);
}

async function checkBucket() {
  const response = await fetch(`${url}/storage/v1/bucket/${encodeURIComponent(bucket)}`, {
    headers: { ...authHeaders, accept: "application/json" }
  });
  await expectOk(`Leitura do bucket ${bucket}`, response);
}

async function writeLeadProbe() {
  const receivedAt = new Date().toISOString();
  const insert = await fetch(`${url}/rest/v1/${encodeURIComponent(table)}`, {
    method: "POST",
    headers: {
      ...authHeaders,
      "content-type": "application/json",
      prefer: "return=representation"
    },
    body: JSON.stringify({
      received_at: receivedAt,
      token: "qa-supabase",
      payload: { source: "scripts/check-supabase.mjs", receivedAt }
    })
  });
  await expectOk("Escrita temporaria de lead", insert);
  const rows = await insert.json();
  const id = rows?.[0]?.id;
  if (id) {
    const cleanup = await fetch(`${url}/rest/v1/${encodeURIComponent(table)}?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: authHeaders
    });
    await expectOk("Limpeza do lead temporario", cleanup);
  }
}

async function writeStorageProbe() {
  const objectPath = `qa/supabase-check-${Date.now()}.txt`;
  const upload = await fetch(`${url}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath.split("/").map(encodeURIComponent).join("/")}`, {
    method: "POST",
    headers: {
      ...authHeaders,
      "content-type": "text/plain",
      "x-upsert": "false"
    },
    body: "solara-supabase-check"
  });
  await expectOk("Escrita temporaria no Storage", upload);

  const remove = await fetch(`${url}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath.split("/").map(encodeURIComponent).join("/")}`, {
    method: "DELETE",
    headers: authHeaders
  });
  await expectOk("Limpeza do objeto temporario", remove);
}

try {
  await checkTable();
  await checkBucket();
  if (writeTest) {
    await writeLeadProbe();
    await writeStorageProbe();
  }
  console.log(`OK: Supabase pronto. tabela=${table}; bucket=${bucket}; writeTest=${writeTest ? "on" : "off"}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
