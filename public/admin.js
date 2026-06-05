const login = document.querySelector("#adminLogin");
const tokenInput = document.querySelector("#adminToken");
const statusBox = document.querySelector("#adminStatus");
const statsBox = document.querySelector("#adminStats");
const leadsList = document.querySelector("#leadsList");
const productForm = document.querySelector("#productForm");
const productsList = document.querySelector("#productsList");

const storedToken = sessionStorage.getItem("solaraAdminToken") || "";
if (storedToken) {
  tokenInput.value = storedToken;
  loadAdmin(storedToken);
}

function text(value, fallback = "-") {
  return String(value || "").trim() || fallback;
}

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function renderStats(stats = {}) {
  statsBox.innerHTML = [
    ["Leads", stats.totalLeads ?? 0],
    ["Com fotos", stats.leadsWithPhotos ?? 0],
    ["Fotos salvas", stats.totalPhotosSaved ?? 0],
    ["IA", stats.imageGenerationMode || "dry-run"],
    ["Tokens", Array.isArray(stats.knownTokens) ? stats.knownTokens.join(", ") : "000000"],
    ["Storage", stats.storageNote || "Ambiente local"]
  ].map(([label, value]) => `
    <article>
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `).join("");
}

function photoMarkup(photo, index) {
  const status = photo.stored ? "salva" : "não salva";
  return `
    <li>
      <strong>${text(photo.name, `foto-${index + 1}`)}</strong>
      <span>${status} · ${text(photo.type, "tipo indefinido")} · ${formatBytes(photo.size)}</span>
      ${photo.storedAs ? `<code>${photo.storedAs}</code>` : ""}
      ${photo.note ? `<em>${photo.note}</em>` : ""}
      ${photo.error ? `<em>${photo.error}</em>` : ""}
    </li>
  `;
}

function leadMarkup(lead) {
  return `
    <article class="leadCard">
      <div class="leadCardHead">
        <div>
          <span>${formatDate(lead.receivedAt)}</span>
          <h3>${text(lead.name, "Lead sem nome")}</h3>
        </div>
        <strong>Token ${text(lead.token)}</strong>
      </div>
      <div class="leadGrid">
        <div><span>WhatsApp</span><strong>${text(lead.phone)}</strong></div>
        <div><span>Email</span><strong>${text(lead.email)}</strong></div>
        <div><span>Local</span><strong>${text(lead.address)}</strong></div>
        <div><span>Piscina</span><strong>${text(lead.poolSize)}</strong></div>
        <div><span>Terreno</span><strong>${text([lead.terrainWidth, lead.terrainLength].filter(Boolean).join(" x "))}</strong></div>
        <div><span>Estilo</span><strong>${text(lead.desiredStyle)}</strong></div>
        <div><span>Formato</span><strong>${text(lead.shapePreference)}</strong></div>
        <div><span>Revestimento</span><strong>${text(lead.coatingPreference)}</strong></div>
      </div>
      <p>${text(lead.visualGoal, "Sem objetivo visual informado.")}</p>
      <div class="photoPanel">
        <strong>Fotos enviadas: ${lead.photoFilesSaved || 0}/${lead.photoCount || 0}</strong>
        <ul>${lead.photos?.length ? lead.photos.map(photoMarkup).join("") : "<li><span>Nenhuma foto enviada.</span></li>"}</ul>
      </div>
    </article>
  `;
}

async function loadAdmin(token) {
  statusBox.textContent = "Carregando painel...";
  try {
    const response = await fetch("/api/admin/leads", {
      headers: { "x-admin-token": token }
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || "Falha ao carregar painel.");

    sessionStorage.setItem("solaraAdminToken", token);
    renderStats(result.stats);
    await loadProducts(token);
    leadsList.innerHTML = result.leads.length
      ? result.leads.map(leadMarkup).join("")
      : `<div class="emptyState">Nenhum lead recebido ainda.</div>`;
    statusBox.textContent = `Atualizado em ${formatDate(result.generatedAt)}.`;
  } catch (error) {
    statsBox.innerHTML = "";
    leadsList.innerHTML = `<div class="emptyState">${error.message}</div>`;
    statusBox.textContent = error.message;
  }
}

login.addEventListener("submit", (event) => {
  event.preventDefault();
  loadAdmin(tokenInput.value.trim());
});

function productMarkup(product) {
  return `
    <article class="productCard">
      <div>
        <span>${text(product.category, "Complemento")} · ${text(product.status, "planejado")}</span>
        <h3>${text(product.name, "Produto sem nome")}</h3>
        <p>${text(product.description, "Sem descrição.")}</p>
      </div>
      <strong>${text(product.priceNote, "Sob orçamento")}</strong>
    </article>
  `;
}

async function loadProducts(token) {
  const response = await fetch("/api/admin/products", {
    headers: { "x-admin-token": token }
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error || "Falha ao carregar produtos.");
  productsList.innerHTML = result.products.length
    ? result.products.map(productMarkup).join("")
    : `<div class="emptyState">Nenhum produto cadastrado.</div>`;
}

productForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = tokenInput.value.trim();
  const payload = Object.fromEntries(new FormData(productForm).entries());
  statusBox.textContent = "Salvando produto...";
  try {
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-token": token
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || "Falha ao salvar produto.");
    productForm.reset();
    productsList.innerHTML = result.products.map(productMarkup).join("");
    statusBox.textContent = "Produto salvo no catálogo de upsell.";
  } catch (error) {
    statusBox.textContent = error.message;
  }
});
