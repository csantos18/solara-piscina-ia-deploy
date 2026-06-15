const login = document.querySelector("#adminLogin");
const tokenInput = document.querySelector("#adminToken");
const statusBox = document.querySelector("#adminStatus");
const statsBox = document.querySelector("#adminStats");
const leadsList = document.querySelector("#leadsList");

const storedToken = sessionStorage.getItem("solaraAdminToken") || "";
if (storedToken) {
  tokenInput.value = storedToken;
  loadAdmin(storedToken);
}

function text(value, fallback = "-") {
  if (value === 0) return "0";
  return String(value || "").trim() || fallback;
}

function escapeHtml(value) {
  return text(value, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safe(value, fallback = "-") {
  return escapeHtml(text(value, fallback));
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

const leadStatusOptions = [
  ["novo", "Novo"],
  ["em_analise", "Em análise"],
  ["orcado", "Orçado"],
  ["fechado", "Fechado"],
  ["perdido", "Perdido"]
];

function leadStatusLabel(status) {
  return leadStatusOptions.find(([value]) => value === status)?.[1] || "Novo";
}

function leadStatusIcon(status) {
  return status === "novo" ? "+" : "";
}

function leadStatusSelect(lead) {
  const current = lead.status || "novo";
  const options = leadStatusOptions.map(([value, label]) => `
    <option value="${value}"${value === current ? " selected" : ""}>${label}</option>
  `).join("");
  return `
    <label class="leadStatusControl">
      Status comercial
      <select data-lead-status data-lead-id="${safe(lead.id)}" aria-label="Status comercial de ${safe(lead.name, "lead")}">${options}</select>
    </label>
  `;
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
      <strong>${safe(value)}</strong>
    </article>
  `).join("");
}

function photoMarkup(photo, index) {
  const status = photo.stored ? "salva" : "não salva";
  const storedAs = String(photo.storedAs || "");
  return `
    <li>
      <strong>${safe(photo.name, `foto-${index + 1}`)}</strong>
      <span>${status} · ${safe(photo.type, "tipo indefinido")} · ${formatBytes(photo.size)}</span>
      ${storedAs ? `<code>${safe(storedAs)}</code>` : ""}
      ${photo.stored && storedAs ? `<button class="photoOpenButton" type="button" data-photo-file="${safe(storedAs)}">Abrir foto</button>` : ""}
      ${photo.note ? `<em>${safe(photo.note)}</em>` : ""}
      ${photo.error ? `<em>${safe(photo.error)}</em>` : ""}
    </li>
  `;
}

function leadMarkup(lead) {
  return `
    <article class="leadCard">
      <div class="leadCardHead">
        <div>
          <span>${formatDate(lead.receivedAt)}</span>
          <h3>${safe(lead.name, "Lead sem nome")}</h3>
        </div>
        <div class="leadCardActions">
          <div class="leadTokenBlock" aria-label="Token atual ${safe(lead.token)}">
            <span>Token atual</span>
            <strong>${safe(lead.token)}</strong>
          </div>
          <strong class="leadStatusBadge status-${safe(lead.status || "novo")}"><span>${safe(leadStatusIcon(lead.status || "novo"))}</span>${safe(leadStatusLabel(lead.status || "novo"))}</strong>
        </div>
      </div>
      ${leadStatusSelect(lead)}
      <div class="leadGrid">
        <div><span>WhatsApp</span><strong>${safe(lead.phone)}</strong></div>
        <div><span>Email</span><strong>${safe(lead.email)}</strong></div>
        <div><span>Local</span><strong>${safe(lead.address)}</strong></div>
        <div><span>Piscina</span><strong>${safe(lead.poolSize)}</strong></div>
        <div><span>Terreno</span><strong>${safe([lead.terrainWidth, lead.terrainLength].filter(Boolean).join(" x "))}</strong></div>
        <div><span>Estilo</span><strong>${safe(lead.desiredStyle)}</strong></div>
        <div><span>Formato</span><strong>${safe(lead.shapePreference)}</strong></div>
        <div><span>Revestimento</span><strong>${safe(lead.coatingPreference)}</strong></div>
      </div>
      <p>${safe(lead.visualGoal, "Sem objetivo visual informado.")}</p>
      <div class="photoPanel">
        <strong>Fotos enviadas: ${lead.photoFilesSaved || 0}/${lead.photoCount || 0}</strong>
        <ul>${lead.photos?.length ? lead.photos.map(photoMarkup).join("") : "<li><span>Nenhuma foto enviada.</span></li>"}</ul>
      </div>
    </article>
  `;
}

function bindPhotoButtons(token) {
  document.querySelectorAll("[data-photo-file]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      statusBox.textContent = "Abrindo foto do lead...";
      try {
        const response = await fetch(`/api/admin/photo?file=${encodeURIComponent(button.dataset.photoFile)}`, {
          headers: { "x-admin-token": token }
        });
        if (!response.ok) throw new Error("Foto não encontrada ou acesso negado.");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        statusBox.textContent = "Foto aberta em nova aba.";
      } catch (error) {
        statusBox.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    });
  });
}
function bindLeadStatusControls(token) {
  document.querySelectorAll("[data-lead-status]").forEach((select) => {
    select.addEventListener("change", async () => {
      const previous = select.dataset.previous || select.defaultValue || "novo";
      select.disabled = true;
      statusBox.textContent = "Atualizando status comercial...";
      try {
        const response = await fetch("/api/admin/leads/status", {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            "x-admin-token": token
          },
          body: JSON.stringify({ id: select.dataset.leadId, status: select.value })
        });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || "Falha ao atualizar status.");
        await loadAdmin(token);
        statusBox.textContent = `Status atualizado para ${leadStatusLabel(select.value)}.`;
      } catch (error) {
        select.value = previous;
        select.disabled = false;
        statusBox.textContent = error.message;
      }
    });
    select.dataset.previous = select.value;
  });
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
    leadsList.innerHTML = result.leads.length
      ? result.leads.map(leadMarkup).join("")
      : `<div class="emptyState">Nenhum lead recebido ainda.</div>`;
    bindLeadStatusControls(token);
    bindPhotoButtons(token);
    statusBox.textContent = `Atualizado em ${formatDate(result.generatedAt)}.`;
  } catch (error) {
    statsBox.innerHTML = "";
    leadsList.innerHTML = `<div class="emptyState">${safe(error.message)}</div>`;
    statusBox.textContent = error.message;
  }
}

login.addEventListener("submit", (event) => {
  event.preventDefault();
  loadAdmin(tokenInput.value.trim());
});
