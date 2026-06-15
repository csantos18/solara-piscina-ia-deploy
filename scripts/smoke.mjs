import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const port = 4399;
const baseUrl = `http://localhost:${port}`;
const adminToken = "smoke-admin-token";
const runtimeDir = join(tmpdir(), `solara-smoke-${Date.now()}`);

await mkdir(runtimeDir, { recursive: true });

const serverEnv = {
  ...process.env,
  PORT: String(port),
  NODE_ENV: "development",
  ADMIN_TOKEN: adminToken,
  LEADS_FILE_PATH: join(runtimeDir, "leads.jsonl"),
  LEAD_UPLOADS_DIR: join(runtimeDir, "lead-uploads")
};

const server = spawn(process.execPath, ["server.mjs"], {
  cwd: new URL("..", import.meta.url),
  env: serverEnv,
  stdio: ["ignore", "pipe", "pipe"]
});

let output = "";
server.stdout.on("data", (chunk) => { output += chunk.toString(); });
server.stderr.on("data", (chunk) => { output += chunk.toString(); });

async function waitForServer() {
  const started = Date.now();
  while (Date.now() - started < 8000) {
    try {
      const response = await fetch(`${baseUrl}/000000`);
      if (response.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 180));
  }
  throw new Error(`Servidor nao respondeu. Saida: ${output}`);
}

async function expectStatus(path, expected, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  if (response.status !== expected) throw new Error(`${path} retornou ${response.status}; esperado ${expected}.`);
  return response;
}

try {
  await waitForServer();
  await expectStatus("/000000", 200);
  await expectStatus("/111111", 200);
  await expectStatus("/src/tokens.js", 200);
  await expectStatus("/src/image-generation-config.js", 200);
  await expectStatus("/images/qr-token-000000.png", 200);
  await expectStatus("/images/qr-token-111111.png", 200);
  await expectStatus("/badtoken", 404);
  await expectStatus("/admin", 200);
  await expectStatus("/api/products-extra", 404);
  await expectStatus("/api/admin/leads-extra", 404, {
    headers: { "x-admin-token": adminToken }
  });
  const healthResponse = await expectStatus("/api/health", 200);
  const health = await healthResponse.json();
  if (!health.ok || health.service !== "solara-piscina-ia") throw new Error("Health check invalido.");
  if (!health.operational || health.operational.profile !== "demo-file-storage") throw new Error("Health check deve expor perfil operacional.");
  const readinessResponse = await expectStatus("/api/readiness", 503);
  const readiness = await readinessResponse.json();
  if (readiness.ok !== false || readiness.operational?.readyForClientPilot !== false) throw new Error("Readiness deve bloquear piloto real sem Supabase.");
  await expectStatus("/api/products", 404);
  const landingResponse = await expectStatus("/000000", 200);
  const landingHtml = await landingResponse.text();
  if (!landingHtml.includes('data-pool-style="familiar" aria-pressed="true"')) throw new Error("Seletor Familiar deve iniciar ativo e acessivel.");
  if (!landingHtml.includes('data-pool-style="moderna" aria-pressed="false"')) throw new Error("Seletor Moderna deve iniciar inativo e acessivel.");
  if (!landingHtml.includes('data-pool-style="lounge" aria-pressed="false"')) throw new Error("Seletor Area Lounge deve iniciar inativo e acessivel.");
  await expectStatus("/api/leads", 400, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{bad"
  });
  await expectStatus("/api/leads", 400, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: "000000", name: "Lead sem telefone", photos: [] })
  });
  await expectStatus("/api/leads", 400, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: "token-invalido", name: "Lead QA", phone: "+550000000000", photos: [] })
  });
  await expectStatus("/000000", 200);

  const maliciousName = '<img src=x onerror="alert(1)">';
  const validPngDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lVgB6wAAAABJRU5ErkJggg==";
  const leadResponse = await expectStatus("/api/leads", 201, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      token: "000000",
      name: maliciousName,
      phone: "+550000000000",
      photos: [
        {
          name: "vetor.svg",
          type: "image/svg+xml",
          size: 80,
          dataUrl: "data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9ImFsZXJ0KDEpIi8+"
        },
        {
          name: "foto-terreno.png",
          type: "image/png",
          size: 68,
          dataUrl: validPngDataUrl
        }
      ]
    })
  });
  const lead = await leadResponse.json();
  if (lead.record?.photoFilesSaved !== 1) throw new Error("Somente PNG valido deve ser salvo como foto de lead.");

  const adminResponse = await expectStatus("/api/admin/leads", 200, {
    headers: { "x-admin-token": adminToken }
  });
  const admin = await adminResponse.json();
  if (!admin.ok || !Array.isArray(admin.leads)) throw new Error("Admin nao retornou lista de leads.");
  if (!admin.stats?.storageNote) throw new Error("Admin nao retornou nota de storage.");
  const createdLead = admin.leads.find((item) => item.name === maliciousName);
  if (!createdLead?.id) throw new Error("Admin nao retornou ID do lead.");
  if (createdLead.status !== "novo") throw new Error("Lead novo deve iniciar com status comercial novo.");

  const statusResponse = await expectStatus("/api/admin/leads/status", 200, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      "x-admin-token": adminToken
    },
    body: JSON.stringify({ id: createdLead.id, status: "orcado" })
  });
  const statusResult = await statusResponse.json();
  if (statusResult.lead?.status !== "orcado") throw new Error("Status comercial nao foi atualizado para orcado.");

  const updatedAdminResponse = await expectStatus("/api/admin/leads", 200, {
    headers: { "x-admin-token": adminToken }
  });
  const updatedAdmin = await updatedAdminResponse.json();
  const updatedLead = updatedAdmin.leads.find((item) => item.id === createdLead.id);
  if (updatedLead?.status !== "orcado") throw new Error("Admin nao persistiu status comercial atualizado.");
  const storedPhoto = updatedLead.photos.find((photo) => photo.stored && photo.storedAs);
  if (!storedPhoto) throw new Error("Admin nao retornou foto armazenada para abertura.");
  const photoResponse = await expectStatus(`/api/admin/photo?file=${encodeURIComponent(storedPhoto.storedAs)}`, 200, {
    headers: { "x-admin-token": adminToken }
  });
  const photoType = photoResponse.headers.get("content-type") || "";
  if (!photoType.startsWith("image/png")) throw new Error(`Foto protegida retornou content-type invalido: ${photoType}`);

  const imageResponse = await expectStatus("/api/image-generation/request", 200, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: "000000", promptKey: "poolDream" })
  });
  const image = await imageResponse.json();
  if (image.mode !== "dry-run") throw new Error("Endpoint de IA deveria retornar dry-run por padrao.");

  console.log("OK: smoke test local completo passou.");
} finally {
  server.kill();
  await rm(runtimeDir, { recursive: true, force: true });
}
