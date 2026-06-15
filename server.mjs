import { createServer } from "node:http";
import { readFile, stat, appendFile, mkdir, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize, sep } from "node:path";
import { timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { IMAGE_GENERATION } from "./src/image-generation-config.js";
import { TOKENS } from "./src/tokens.js";

const root = normalize(fileURLToPath(new URL(".", import.meta.url))).replace(/[\\/]$/, "");
const publicDir = join(root, "public");
const port = Number(process.env.PORT || 4173);
const maxLeadPhotoBytes = Number(process.env.MAX_LEAD_PHOTO_BYTES || 10 * 1024 * 1024);
const maxLeadPhotos = Number(process.env.MAX_LEAD_PHOTOS || 6);
const maxJsonBodyBytes = Number(process.env.MAX_JSON_BODY_BYTES || 14 * 1024 * 1024);
const productionMode = process.env.NODE_ENV === "production";
const adminToken = String(process.env.ADMIN_TOKEN || "").trim();
const leadStoreMode = String(process.env.LEAD_STORE_MODE || "file").trim();
const storageMode = String(process.env.STORAGE_MODE || "file").trim();
const persistentStorageRequired = process.env.REQUIRE_PERSISTENT_STORAGE === "1";
const leadFilePath = process.env.LEADS_FILE_PATH || join(root, "leads.jsonl");
const leadUploadsDir = process.env.LEAD_UPLOADS_DIR || join(root, "lead-uploads");
const validStorageModes = new Set(["file", "supabase"]);
const leadStatuses = new Set(["novo", "em_analise", "orcado", "fechado", "perdido"]);

const securityHeaders = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(self), geolocation=(), microphone=()",
  "content-security-policy": [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'"
  ].join("; ")
};

function headers(extra = {}) {
  return productionMode
    ? { ...securityHeaders, "strict-transport-security": "max-age=31536000; includeSubDomains", ...extra }
    : { ...securityHeaders, ...extra };
}

function secureEquals(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && timingSafeEqual(left, right);
}
const rotasReservadas = new Set([
  "/rota-reservada-1",
  "/rota-reservada-2",
  "/rota-reservada-3",
  "/rota-reservada-4",
  "/rota-reservada-5"
]);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const allowedLeadPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function isPathInside(filePath, baseDir) {
  return filePath === baseDir || filePath.startsWith(baseDir + sep);
}

function json(res, status, body) {
  res.writeHead(status, headers({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }));
  res.end(JSON.stringify(body, null, 2));
}

async function parseBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxJsonBodyBytes) {
      const error = new Error("Payload acima do limite permitido.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("JSON invalido no corpo da requisicao.");
    error.statusCode = 400;
    throw error;
  }
}
function safeUploadName(name) {
  const clean = String(name || "foto-terreno")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return clean || "foto-terreno";
}

function parseImageDataUrl(photo) {
  const match = String(photo.dataUrl || "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=]+)$/);
  if (!match) throw new Error("Formato de foto invalido.");
  if (!allowedLeadPhotoTypes.has(match[1])) throw new Error("Tipo de foto nao permitido.");
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > maxLeadPhotoBytes) throw new Error("Foto acima do limite permitido.");
  return { type: match[1], buffer };
}

function supabaseConfig() {
  return {
    url: String(process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    key: String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim(),
    bucket: String(process.env.SUPABASE_STORAGE_BUCKET || "solara-lead-photos").trim()
  };
}

function hasSupabaseCredentials() {
  const { url, key } = supabaseConfig();
  return Boolean(url && key && key !== "substitua_pela_secret_key_local");
}

function operationalReadiness() {
  const issues = [];
  const warnings = [];
  const supabaseConfigured = hasSupabaseCredentials();
  const persistentStorageActive = leadStoreMode === "supabase" && storageMode === "supabase" && supabaseConfigured;

  if (!validStorageModes.has(leadStoreMode)) issues.push(`LEAD_STORE_MODE invalido: ${leadStoreMode}`);
  if (!validStorageModes.has(storageMode)) issues.push(`STORAGE_MODE invalido: ${storageMode}`);
  if (productionMode && !adminToken) issues.push("ADMIN_TOKEN nao configurado em producao.");
  if (leadStoreMode === "supabase" && !supabaseConfigured) issues.push("Supabase nao configurado para leads.");
  if (storageMode === "supabase" && !supabaseConfigured) issues.push("Supabase Storage nao configurado para fotos.");
  if (!persistentStorageActive) warnings.push("Persistencia definitiva nao ativa: usar apenas como demo ou piloto interno.");
  if (persistentStorageRequired && !persistentStorageActive) issues.push("REQUIRE_PERSISTENT_STORAGE=1 exige LEAD_STORE_MODE=supabase e STORAGE_MODE=supabase com credenciais validas.");

  return {
    readyForClientPilot: issues.length === 0 && persistentStorageActive,
    profile: persistentStorageActive ? "real-free-pilot" : "demo-file-storage",
    persistentStorageActive,
    persistentStorageRequired,
    supabaseConfigured,
    issues,
    warnings
  };
}

function supabaseObjectUrl(bucket, objectPath) {
  return `${supabaseConfig().url}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath.split("/").map(encodeURIComponent).join("/")}`;
}

async function savePhotoToSupabaseStorage(fileName, type, buffer) {
  const { url, key, bucket } = supabaseConfig();
  if (!url || !key) throw new Error("Supabase Storage nao configurado para fotos.");
  const objectPath = `leads/${fileName}`;
  const response = await fetch(supabaseObjectUrl(bucket, objectPath), {
    method: "POST",
    headers: {
      "apikey": key,
      "authorization": `Bearer ${key}`,
      "content-type": type || "application/octet-stream",
      "x-upsert": "false"
    },
    body: buffer
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Falha ao salvar foto no Supabase Storage: ${response.status} ${detail}`.trim());
  }
  return { bucket, objectPath, storedAs: `supabase://${bucket}/${objectPath}` };
}
async function writePhotoFile(directory, fileName, buffer) {
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, fileName), buffer);
}

async function persistLeadPhotos(photos, receivedAt) {
  const list = Array.isArray(photos) ? photos.slice(0, maxLeadPhotos) : [];
  const saved = [];
  const stamp = receivedAt.replace(/[:.]/g, "-");

  for (const [index, photo] of list.entries()) {
    const originalName = safeUploadName(photo?.name);
    const metadata = {
      name: originalName,
      type: String(photo?.type || ""),
      size: Number(photo?.size || 0),
      stored: false
    };

    if (!photo?.dataUrl) {
      saved.push({ ...metadata, note: "Arquivo não enviado; apenas metadados recebidos." });
      continue;
    }

    try {
      const { type, buffer } = parseImageDataUrl(photo);
      const fileName = `${stamp}-${index + 1}-${originalName}`;

      if (storageMode === "supabase") {
        const stored = await savePhotoToSupabaseStorage(fileName, type, buffer);
        saved.push({ ...metadata, type, size: buffer.length, stored: true, storageMode: "supabase", ...stored });
        continue;
      }

      try {
        await writePhotoFile(leadUploadsDir, fileName, buffer);
        saved.push({ ...metadata, type, size: buffer.length, stored: true, storageMode: "file", storedAs: `lead-uploads/${fileName}` });
      } catch (error) {
        if (error.code !== "EPERM" && error.code !== "EACCES") throw error;
        const fallbackDir = process.env.LEAD_UPLOADS_FALLBACK_DIR || join(tmpdir(), "solara-piscina-ia-uploads");
        await writePhotoFile(fallbackDir, fileName, buffer);
        saved.push({ ...metadata, type, size: buffer.length, stored: true, storageMode: "fallback-file", storedAs: join(fallbackDir, fileName) });
      }
    } catch (error) {
      saved.push({ ...metadata, stored: false, error: error.message });
    }
  }

  return saved;
}

async function saveLeadToSupabase(record) {
  const url = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const table = String(process.env.SUPABASE_LEADS_TABLE || "solara_leads").trim();
  if (!url || !key) throw new Error("Supabase nao configurado para persistencia de leads.");

  const response = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "apikey": key,
      "authorization": `Bearer ${key}`,
      "content-type": "application/json",
      "prefer": "return=minimal"
    },
    body: JSON.stringify({
      received_at: record.receivedAt,
      token: record.token,
      payload: record
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Falha ao salvar lead no Supabase: ${response.status} ${detail}`.trim());
  }
}

async function readLeadsFromSupabase() {
  const url = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const table = String(process.env.SUPABASE_LEADS_TABLE || "solara_leads").trim();
  if (!url || !key) throw new Error("Supabase nao configurado para leitura de leads.");

  const response = await fetch(`${url}/rest/v1/${table}?select=id,payload&order=received_at.desc&limit=200`, {
    headers: {
      "apikey": key,
      "authorization": `Bearer ${key}`,
      "accept": "application/json"
    }
  });
  if (!response.ok) throw new Error(`Falha ao ler leads no Supabase: ${response.status}`);
  const rows = await response.json();
  return Array.isArray(rows) ? rows.map((row) => ({
    ...(row.payload || {}),
    storageRecordId: String(row.id || ""),
    status: normalizeLeadStatus(row.payload?.status)
  })).filter((record) => record.receivedAt) : [];
}

async function persistLeadRecord(record) {
  if (leadStoreMode === "supabase") {
    await saveLeadToSupabase(record);
    return { mode: "supabase", message: "Lead registrado no banco de dados." };
  }

  try {
    await appendFile(leadFilePath, JSON.stringify(record) + "\n", "utf8");
    return { mode: "file", message: "Lead registrado para retorno comercial." };
  } catch (error) {
    if (error.code !== "EPERM" && error.code !== "EACCES") throw error;
    const fallbackPath = process.env.LEADS_FALLBACK_PATH || join(tmpdir(), "solara-piscina-ia-leads.jsonl");
    await appendFile(fallbackPath, JSON.stringify(record) + "\n", "utf8");
    return { mode: "fallback-file", message: "Lead registrado em arquivo fallback para retorno comercial.", fallbackPath };
  }
}

function storageStatusNote() {
  const readiness = operationalReadiness();
  if (readiness.persistentStorageActive) return "Leads em Supabase; fotos em Supabase Storage. Perfil gratuito pronto para piloto controlado.";
  return "Leads/fotos em arquivo local. Render Free pode perder arquivos locais ao reiniciar; usar somente como demo.";
}

function normalizeLeadStatus(status) {
  const value = String(status || "novo").trim().toLowerCase();
  return leadStatuses.has(value) ? value : "novo";
}

function leadRecordId(record, index) {
  return String(record.leadId || record.storageRecordId || `${record.receivedAt || "lead"}-${index + 1}`);
}
function handleHealth(req, res) {
  json(res, 200, {
    ok: true,
    service: "solara-piscina-ia",
    generatedAt: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    environment: productionMode ? "production" : "development",
    storage: {
      leads: leadStoreMode,
      photos: storageMode,
      note: storageStatusNote()
    },
    operational: operationalReadiness(),
    imageGenerationMode: process.env.ENABLE_REAL_IMAGE_GENERATION === "1" ? "real" : "dry-run",
    knownTokens: Object.keys(TOKENS)
  });
}

function handleReadiness(req, res) {
  const readiness = operationalReadiness();
  json(res, readiness.readyForClientPilot ? 200 : 503, {
    ok: readiness.readyForClientPilot,
    service: "solara-piscina-ia",
    generatedAt: new Date().toISOString(),
    storage: {
      leads: leadStoreMode,
      photos: storageMode,
      note: storageStatusNote()
    },
    operational: readiness
  });
}
async function serveFile(req, res) {
  const rawPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);

  if (rotasReservadas.has(rawPath.toLowerCase())) {
    res.writeHead(410, headers({ "content-type": "text/plain; charset=utf-8" }));
    res.end("Use /000000 para a demo principal Solara Piscina IA.");
    return;
  }

  const isKnownTokenPath = Object.hasOwn(TOKENS, rawPath.slice(1));
  const requestedPath = rawPath === "/" || isKnownTokenPath ? "/index.html" : rawPath === "/admin" ? "/admin.html" : rawPath;

  if (/^\/[A-Za-z0-9_-]+$/.test(rawPath) && !isKnownTokenPath && rawPath !== "/admin") {
    res.writeHead(404, headers({ "content-type": "text/plain; charset=utf-8" }));
    res.end("Token não encontrado. Use /000000 para a demo principal.");
    return;
  }
  const baseDir = requestedPath.startsWith("/src/") ? root : publicDir;
  const filePath = normalize(join(baseDir, requestedPath));

  if (!isPathInside(filePath, baseDir)) {
    res.writeHead(403, headers());
    res.end("Forbidden");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error("Not a file");
    res.writeHead(200, headers({ "content-type": mime[extname(filePath)] || "application/octet-stream" }));
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, headers({ "content-type": "text/plain; charset=utf-8" }));
    res.end("Not found");
  }
}

async function handleLead(req, res) {
  const readiness = operationalReadiness();
  if (persistentStorageRequired && !readiness.readyForClientPilot) {
    json(res, 503, { ok: false, error: "Persistencia definitiva nao configurada para receber leads reais.", operational: readiness });
    return;
  }
  if (!validStorageModes.has(leadStoreMode) || !validStorageModes.has(storageMode)) {
    json(res, 500, { ok: false, error: "Modo de armazenamento invalido.", operational: readiness });
    return;
  }
  const body = await parseBody(req);
  const token = String(body.token || "000000").trim();
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  if (!Object.hasOwn(TOKENS, token)) {
    json(res, 400, { ok: false, error: "Token do projeto nao encontrado." });
    return;
  }
  if (!name || !phone) {
    json(res, 400, { ok: false, error: "Nome e WhatsApp sao obrigatorios." });
    return;
  }
  const receivedAt = new Date().toISOString();
  const photos = await persistLeadPhotos(body.photos, receivedAt);
  const record = {
    leadId: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    receivedAt,
    token,
    status: "novo",
    name,
    phone,
    email: body.email || "",
    address: body.address || "",
    interest: body.interest || "",
    availableArea: body.availableArea || "",
    terrainWidth: body.terrainWidth || "",
    terrainLength: body.terrainLength || "",
    poolSize: body.poolSize || "",
    soilType: body.soilType || "",
    desiredStyle: body.desiredStyle || "",
    depthPreference: body.depthPreference || "",
    shapePreference: body.shapePreference || "",
    coatingPreference: body.coatingPreference || "",
    deckPreference: body.deckPreference || "",
    visualGoal: body.visualGoal || "",
    photoCount: photos.length,
    photoFilesSaved: photos.filter((photo) => photo.stored).length,
    photos,
    source: "solara-piscina-ia-app"
  };
  const saved = await persistLeadRecord(record);
  json(res, 201, { ok: true, ...saved, record });
}

async function handleImageRequest(req, res) {
  const body = await parseBody(req);
  const token = body.token || "000000";
  const tokenConfig = TOKENS[token] || TOKENS["000000"];
  const promptKey = body.promptKey || "poolDream";
  const prompt = tokenConfig.prompts[promptKey];

  if (!prompt) {
    json(res, 400, { ok: false, error: "Prompt não encontrado para este token.", token, promptKey });
    return;
  }

  const payload = {
    model: IMAGE_GENERATION.model,
    prompt,
    size: IMAGE_GENERATION.defaultSize,
    quality: IMAGE_GENERATION.defaultQuality,
    response_format: IMAGE_GENERATION.responseFormat,
    metadata: {
      token,
      promptKey,
      prospectAddress: tokenConfig.address,
      generatedBy: "solara-piscina-ia-app"
    }
  };

  if (!process.env.LITELLM_API_KEY || process.env.ENABLE_REAL_IMAGE_GENERATION !== "1") {
    json(res, 200, {
      ok: true,
      mode: "dry-run",
      reason: "Defina LITELLM_API_KEY e ENABLE_REAL_IMAGE_GENERATION=1 para enviar ao endpoint real.",
      endpoint: IMAGE_GENERATION.imageEndpoint,
      payload
    });
    return;
  }

  const apiResponse = await fetch(IMAGE_GENERATION.imageEndpoint, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${process.env.LITELLM_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await apiResponse.json().catch(() => ({}));
  json(res, apiResponse.ok ? 200 : apiResponse.status, {
    ok: apiResponse.ok,
    endpoint: IMAGE_GENERATION.imageEndpoint,
    promptKey,
    prompt,
    data
  });
}

function adminTokenFrom(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const headerToken = req.headers["x-admin-token"] || "";
  const auth = req.headers.authorization || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return String(headerToken || bearer || url.searchParams.get("token") || "").trim();
}

function requireAdmin(req, res) {
  if (!adminToken) {
    json(res, 503, { ok: false, error: "ADMIN_TOKEN nao configurado no ambiente." });
    return false;
  }
  if (!secureEquals(adminTokenFrom(req), adminToken)) {
    json(res, 401, { ok: false, error: "Token administrativo invalido." });
    return false;
  }
  return true;
}

function leadPublicSummary(record, index) {
  return {
    id: leadRecordId(record, index),
    receivedAt: record.receivedAt || "",
    token: record.token || "",
    status: normalizeLeadStatus(record.status),
    name: record.name || "",
    phone: record.phone || "",
    email: record.email || "",
    address: record.address || "",
    interest: record.interest || "",
    availableArea: record.availableArea || "",
    terrainWidth: record.terrainWidth || "",
    terrainLength: record.terrainLength || "",
    poolSize: record.poolSize || "",
    soilType: record.soilType || "",
    desiredStyle: record.desiredStyle || "",
    depthPreference: record.depthPreference || "",
    shapePreference: record.shapePreference || "",
    coatingPreference: record.coatingPreference || "",
    deckPreference: record.deckPreference || "",
    visualGoal: record.visualGoal || "",
    photoCount: Number(record.photoCount || 0),
    photoFilesSaved: Number(record.photoFilesSaved || 0),
    photos: Array.isArray(record.photos) ? record.photos.map((photo) => ({
      name: photo.name || "foto-terreno",
      type: photo.type || "",
      size: Number(photo.size || 0),
      stored: Boolean(photo.stored),
      storageMode: photo.storageMode || "",
      storedAs: photo.storedAs || "",
      note: photo.note || "",
      error: photo.error || ""
    })) : []
  };
}

async function readLeadRecords() {
  if (leadStoreMode === "supabase") return readLeadsFromSupabase();
  let text = "";
  try {
    text = await readFile(leadFilePath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

async function handleAdminLeads(req, res) {
  if (!requireAdmin(req, res)) return;
  const records = await readLeadRecords();
  const leads = records.map(leadPublicSummary).reverse();
  json(res, 200, {
    ok: true,
    generatedAt: new Date().toISOString(),
    stats: {
      totalLeads: leads.length,
      leadsWithPhotos: leads.filter((lead) => lead.photoFilesSaved > 0).length,
      totalPhotosSaved: leads.reduce((sum, lead) => sum + lead.photoFilesSaved, 0),
      knownTokens: Object.keys(TOKENS),
      imageGenerationMode: process.env.ENABLE_REAL_IMAGE_GENERATION === "1" ? "real" : "dry-run",
      storageNote: storageStatusNote()
    },
    leads
  });
}

async function saveLeadStatusToSupabase(id, status) {
  const url = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const table = String(process.env.SUPABASE_LEADS_TABLE || "solara_leads").trim();
  if (!url || !key) throw new Error("Supabase nao configurado para atualizar lead.");

  const records = await readLeadsFromSupabase();
  const record = records.find((item, index) => leadRecordId(item, index) === id);
  if (!record?.storageRecordId) {
    const error = new Error("Lead nao encontrado para atualizacao.");
    error.statusCode = 404;
    throw error;
  }

  const payload = { ...record, status };
  delete payload.storageRecordId;

  const response = await fetch(`${url}/rest/v1/${table}?id=eq.${encodeURIComponent(record.storageRecordId)}`, {
    method: "PATCH",
    headers: {
      "apikey": key,
      "authorization": `Bearer ${key}`,
      "content-type": "application/json",
      "prefer": "return=minimal"
    },
    body: JSON.stringify({ payload })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Falha ao atualizar status no Supabase: ${response.status} ${detail}`.trim());
  }

  return payload;
}

async function saveLeadStatusToFile(id, status) {
  const records = await readLeadRecords();
  let updated = null;
  const nextRecords = records.map((record, index) => {
    if (leadRecordId(record, index) !== id) return record;
    updated = { ...record, status };
    return updated;
  });

  if (!updated) {
    const error = new Error("Lead nao encontrado para atualizacao.");
    error.statusCode = 404;
    throw error;
  }

  await writeFile(leadFilePath, nextRecords.map((record) => JSON.stringify(record)).join("\n") + "\n", "utf8");
  return updated;
}

async function handleAdminLeadStatus(req, res) {
  if (!requireAdmin(req, res)) return;
  const body = await parseBody(req);
  const id = String(body.id || "").trim();
  const requestedStatus = String(body.status || "").trim().toLowerCase();
  const status = normalizeLeadStatus(requestedStatus);

  if (!id) {
    json(res, 400, { ok: false, error: "ID do lead e obrigatorio." });
    return;
  }
  if (!leadStatuses.has(requestedStatus)) {
    json(res, 400, { ok: false, error: "Status comercial invalido." });
    return;
  }

  const updated = leadStoreMode === "supabase"
    ? await saveLeadStatusToSupabase(id, status)
    : await saveLeadStatusToFile(id, status);

  json(res, 200, { ok: true, lead: leadPublicSummary(updated, 0) });
}

async function serveSupabasePhoto(storedAs, res) {
  const { key, bucket } = supabaseConfig();
  const prefix = `supabase://${bucket}/`;
  if (!key || !storedAs.startsWith(prefix)) {
    res.writeHead(400, headers({ "content-type": "text/plain; charset=utf-8" }));
    res.end("Arquivo externo invalido.");
    return;
  }

  const objectPath = storedAs.slice(prefix.length);
  const response = await fetch(supabaseObjectUrl(bucket, objectPath), {
    headers: {
      "apikey": key,
      "authorization": `Bearer ${key}`
    }
  });

  if (!response.ok) {
    res.writeHead(response.status === 404 ? 404 : 502, headers({ "content-type": "text/plain; charset=utf-8" }));
    res.end("Foto nao encontrada no storage externo.");
    return;
  }

  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const buffer = Buffer.from(await response.arrayBuffer());
  res.writeHead(200, headers({ "content-type": contentType }));
  res.end(buffer);
}
async function handleAdminPhoto(req, res) {
  if (!requireAdmin(req, res)) return;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const storedAs = String(url.searchParams.get("file") || "").replaceAll("\\", "/");
  if (storedAs.startsWith("supabase://")) return serveSupabasePhoto(storedAs, res);
  if (!storedAs.startsWith("lead-uploads/")) {
    res.writeHead(400, headers({ "content-type": "text/plain; charset=utf-8" }));
    res.end("Arquivo invalido.");
    return;
  }

  const uploadsDir = normalize(leadUploadsDir);
  const relativePhotoPath = storedAs.slice("lead-uploads/".length);
  const filePath = normalize(join(uploadsDir, relativePhotoPath));
  if (!isPathInside(filePath, uploadsDir)) {
    res.writeHead(403, headers({ "content-type": "text/plain; charset=utf-8" }));
    res.end("Forbidden");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error("Not a file");
    res.writeHead(200, headers({ "content-type": mime[extname(filePath)] || "application/octet-stream" }));
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, headers({ "content-type": "text/plain; charset=utf-8" }));
    res.end("Foto nao encontrada neste ambiente.");
  }
}
createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

    if (req.method === "GET" && pathname === "/api/health") {
      handleHealth(req, res);
      return;
    }
    if (req.method === "GET" && pathname === "/api/readiness") {
      handleReadiness(req, res);
      return;
    }
    if (req.method === "POST" && pathname === "/api/leads") {
      await handleLead(req, res);
      return;
    }
    if (req.method === "GET" && pathname === "/api/admin/leads") {
      await handleAdminLeads(req, res);
      return;
    }
    if (req.method === "PATCH" && pathname === "/api/admin/leads/status") {
      await handleAdminLeadStatus(req, res);
      return;
    }
    if (req.method === "GET" && pathname === "/api/admin/photo") {
      await handleAdminPhoto(req, res);
      return;
    }
    if (req.method === "POST" && pathname === "/api/image-generation/request") {
      await handleImageRequest(req, res);
      return;
    }
    if (req.method === "GET") {
      await serveFile(req, res);
      return;
    }
    res.writeHead(405, headers());
    res.end("Method not allowed");
  } catch (error) {
    const status = Number(error.statusCode || 500);
    json(res, status, { ok: false, error: error.message });
  }
}).listen(port, () => {
  console.log(`Solara Piscina IA rodando em http://localhost:${port}/000000`);
});
