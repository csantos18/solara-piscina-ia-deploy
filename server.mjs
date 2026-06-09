import { createServer } from "node:http";
import { readFile, stat, appendFile, mkdir, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { IMAGE_GENERATION } from "./src/image-generation-config.js";
import { TOKENS } from "./src/tokens.js";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(root, "public");
const port = Number(process.env.PORT || 4173);
const maxLeadPhotoBytes = Number(process.env.MAX_LEAD_PHOTO_BYTES || 10 * 1024 * 1024);
const maxLeadPhotos = Number(process.env.MAX_LEAD_PHOTOS || 6);
const maxJsonBodyBytes = Number(process.env.MAX_JSON_BODY_BYTES || 14 * 1024 * 1024);
const productionMode = process.env.NODE_ENV === "production";
const adminToken = String(process.env.ADMIN_TOKEN || (productionMode ? "" : "solara-admin-2026")).trim();
const leadStoreMode = String(process.env.LEAD_STORE_MODE || "file").trim();
const storageMode = String(process.env.STORAGE_MODE || "file").trim();

const securityHeaders = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(self), geolocation=(), microphone=()"
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
const defaultUpsellProducts = [
  {
    id: "deck-premium",
    name: "Deck premium atérmico",
    category: "Acabamento",
    priceNote: "Sob orçamento",
    status: "ativo",
    description: "Complemento para área de circulação ao redor da piscina."
  },
  {
    id: "moveis-externos",
    name: "Móveis externos",
    category: "Pós-orçamento",
    priceNote: "A definir",
    status: "planejado",
    description: "Linha de espreguiçadeiras, mesas e apoio para etapa posterior à venda da piscina."
  },
  {
    id: "painel-solar",
    name: "Painel solar futuro",
    category: "Energia",
    priceNote: "A definir",
    status: "planejado",
    description: "Produto complementar para proposta futura, sem tirar foco do orçamento da piscina."
  }
];
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

      const uploadDir = join(root, "lead-uploads");
      try {
        await writePhotoFile(uploadDir, fileName, buffer);
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

  const response = await fetch(`${url}/rest/v1/${table}?select=payload&order=received_at.desc&limit=200`, {
    headers: {
      "apikey": key,
      "authorization": `Bearer ${key}`,
      "accept": "application/json"
    }
  });
  if (!response.ok) throw new Error(`Falha ao ler leads no Supabase: ${response.status}`);
  const rows = await response.json();
  return Array.isArray(rows) ? rows.map((row) => row.payload).filter(Boolean) : [];
}

async function persistLeadRecord(record) {
  if (leadStoreMode === "supabase") {
    await saveLeadToSupabase(record);
    return { mode: "supabase", message: "Lead registrado no banco de dados." };
  }

  try {
    await appendFile(join(root, "leads.jsonl"), JSON.stringify(record) + "\n", "utf8");
    return { mode: "file", message: "Lead registrado para retorno comercial." };
  } catch (error) {
    if (error.code !== "EPERM" && error.code !== "EACCES") throw error;
    const fallbackPath = process.env.LEADS_FALLBACK_PATH || join(tmpdir(), "solara-piscina-ia-leads.jsonl");
    await appendFile(fallbackPath, JSON.stringify(record) + "\n", "utf8");
    return { mode: "fallback-file", message: "Lead registrado em arquivo fallback para retorno comercial.", fallbackPath };
  }
}

function storageStatusNote() {
  const leadMode = leadStoreMode === "supabase" ? "Supabase" : "arquivo local";
  const photoMode = storageMode === "supabase" ? "Supabase Storage" : "filesystem local";
  return `Leads em ${leadMode}; fotos em ${photoMode}. Render Free pode perder arquivos locais ao reiniciar.`;
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
    imageGenerationMode: process.env.ENABLE_REAL_IMAGE_GENERATION === "1" ? "real" : "dry-run",
    knownTokens: Object.keys(TOKENS)
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

  if (!filePath.startsWith(baseDir)) {
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
  const body = await parseBody(req);
  const receivedAt = new Date().toISOString();
  const photos = await persistLeadPhotos(body.photos, receivedAt);
  const record = {
    receivedAt,
    token: body.token || "000000",
    name: body.name || "",
    phone: body.phone || "",
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
    id: `${record.receivedAt || "lead"}-${index + 1}`,
    receivedAt: record.receivedAt || "",
    token: record.token || "",
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
    text = await readFile(join(root, "leads.jsonl"), "utf8");
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

async function readUpsellProducts() {
  try {
    const text = await readFile(join(root, "upsell-products.json"), "utf8");
    const products = JSON.parse(text);
    return Array.isArray(products) ? products : defaultUpsellProducts;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return defaultUpsellProducts;
  }
}

async function writeUpsellProducts(products) {
  await writeFile(join(root, "upsell-products.json"), JSON.stringify(products, null, 2), "utf8");
}

function normalizeProduct(body) {
  const now = new Date().toISOString();
  const id = safeUploadName(body.id || body.name || `produto-${Date.now()}`).toLowerCase();
  return {
    id,
    name: String(body.name || "Produto sem nome").trim(),
    category: String(body.category || "Complemento").trim(),
    priceNote: String(body.priceNote || "Sob orçamento").trim(),
    status: String(body.status || "planejado").trim(),
    description: String(body.description || "").trim(),
    updatedAt: now
  };
}

async function handleAdminProducts(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method === "GET") {
    const products = await readUpsellProducts();
    json(res, 200, { ok: true, products });
    return;
  }
  if (req.method === "POST") {
    const body = await parseBody(req);
    const products = await readUpsellProducts();
    const product = normalizeProduct(body);
    const next = [product, ...products.filter((item) => item.id !== product.id)];
    await writeUpsellProducts(next);
    json(res, 201, { ok: true, product, products: next });
    return;
  }
  res.writeHead(405, headers());
  res.end("Method not allowed");
}

async function handlePublicProducts(req, res) {
  const products = await readUpsellProducts();
  json(res, 200, {
    ok: true,
    mode: "catalog-preview",
    note: "Catalogo complementar para etapa posterior ao orçamento da piscina.",
    products: products.filter((product) => product.status !== "interno")
  });
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

  const uploadsDir = join(root, "lead-uploads");
  const filePath = normalize(join(root, storedAs));
  if (!filePath.startsWith(uploadsDir)) {
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
    if (req.method === "GET" && req.url === "/api/health") {
      handleHealth(req, res);
      return;
    }
    if (req.method === "POST" && req.url === "/api/leads") {
      await handleLead(req, res);
      return;
    }
    if (req.method === "GET" && req.url.startsWith("/api/admin/leads")) {
      await handleAdminLeads(req, res);
      return;
    }
    if (req.url.startsWith("/api/admin/products")) {
      await handleAdminProducts(req, res);
      return;
    }
    if (req.method === "GET" && req.url.startsWith("/api/admin/photo")) {
      await handleAdminPhoto(req, res);
      return;
    }
    if (req.method === "GET" && req.url.startsWith("/api/products")) {
      await handlePublicProducts(req, res);
      return;
    }
    if (req.method === "POST" && req.url === "/api/image-generation/request") {
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











