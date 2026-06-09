import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const port = 4399;
const baseUrl = `http://localhost:${port}`;
const adminToken = "solara-admin-2026";
const runtimeDir = join(tmpdir(), `solara-smoke-${Date.now()}`);

await mkdir(runtimeDir, { recursive: true });

const server = spawn(process.execPath, ["server.mjs"], {
  cwd: new URL("..", import.meta.url),
  env: {
    ...process.env,
    PORT: String(port),
    NODE_ENV: "development",
    LEADS_FILE_PATH: join(runtimeDir, "leads.jsonl"),
    LEAD_UPLOADS_DIR: join(runtimeDir, "lead-uploads")
  },
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
  await expectStatus("/badtoken", 404);
  await expectStatus("/admin", 200);
  await expectStatus("/api/products-extra", 404);
  await expectStatus("/api/admin/leads-extra", 404, {
    headers: { "x-admin-token": adminToken }
  });
  const healthResponse = await expectStatus("/api/health", 200);
  const health = await healthResponse.json();
  if (!health.ok || health.service !== "solara-piscina-ia") throw new Error("Health check invalido.");
  await expectStatus("/api/products", 200);
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
  const leadResponse = await expectStatus("/api/leads", 201, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      token: "000000",
      name: maliciousName,
      phone: "+550000000000",
      photos: [{
        name: "vetor.svg",
        type: "image/svg+xml",
        size: 80,
        dataUrl: "data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9ImFsZXJ0KDEpIi8+"
      }]
    })
  });
  const lead = await leadResponse.json();
  if (lead.record?.photoFilesSaved !== 0) throw new Error("SVG nao deve ser salvo como foto de lead.");

  const adminResponse = await expectStatus("/api/admin/leads", 200, {
    headers: { "x-admin-token": adminToken }
  });
  const admin = await adminResponse.json();
  if (!admin.ok || !Array.isArray(admin.leads)) throw new Error("Admin nao retornou lista de leads.");
  if (!admin.stats?.storageNote) throw new Error("Admin nao retornou nota de storage.");

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
