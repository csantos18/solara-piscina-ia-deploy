import { TOKENS } from "/src/tokens.js";

const pathToken = window.location.pathname.replace("/", "").trim();
const activeToken = pathToken || "000000";
const tokenData = TOKENS[activeToken] || TOKENS["000000"];
const absoluteTokenUrl = `${window.location.origin}/${tokenData.token}`;

document.querySelector("#tokenBadge").textContent = `Token ${tokenData.token}`;
document.querySelector("#productName").textContent = tokenData.productName;
document.querySelector("#regionName").textContent = tokenData.region;
document.querySelector("#mainVisual").src = tokenData.heroImage || tokenData.images[0].src;
document.querySelector("#qrTarget").textContent = absoluteTokenUrl;
document.querySelector("#qrImage").src = `/images/qr-token-${tokenData.token}.png`;

const heroEyebrow = document.querySelector("#heroEyebrow");
const heroPreview = document.querySelector("#heroPreview");
const previewToken = document.querySelector("#previewToken");
const previewStage = document.querySelector("#previewStage");
heroEyebrow.textContent = `Landing visual por token /${tokenData.token}`;
heroPreview?.setAttribute("aria-label", `Prévia visual do token ${tokenData.token}`);
previewToken.textContent = tokenData.token;
previewStage.textContent = tokenData.productName;

const previewMain = tokenData.images.find((image) => image.id === "pool-dream") || tokenData.images[0];
const previewThumbs = [
  tokenData.images.find((image) => image.id === "pool-3d") || tokenData.images[1],
  tokenData.images.find((image) => image.id === "top-view") || tokenData.images[2],
  tokenData.images.find((image) => image.id === "satellite-after") || tokenData.images[3]
].filter(Boolean);
const previewMainImage = document.querySelector("#previewMainImage");
if (previewMainImage && previewMain) {
  previewMainImage.src = previewMain.src;
  previewMainImage.alt = previewMain.label;
}
["#previewThumbOne", "#previewThumbTwo", "#previewThumbThree"].forEach((selector, index) => {
  const element = document.querySelector(selector);
  const image = previewThumbs[index];
  if (element && image) {
    element.src = image.src;
    element.alt = image.label;
  }
});
const compareRange = document.querySelector("#compareRange");
const afterWrap = document.querySelector("#afterWrap");
const compareHandle = document.querySelector("#compareHandle");

compareRange?.addEventListener("input", () => {
  const value = `${compareRange.value}%`;
  afterWrap.style.width = value;
  compareHandle.style.left = value;
});

const gallery = document.querySelector("#gallery");
const styleButtons = document.querySelectorAll("[data-pool-style]");
const dreamModes = ["Dia claro", "Pôr do sol", "Noite com luzes", "Revestimento claro", "Paisagismo", "Vista aérea"];
const stylePriority = {
  familiar: ["pool-3d", "pool-dream", "top-view", "satellite-after", "solar-upsell", "satellite-before"],
  moderna: ["pool-dream", "pool-3d", "solar-upsell", "top-view", "satellite-after", "satellite-before"],
  lounge: ["top-view", "pool-dream", "pool-3d", "satellite-after", "solar-upsell", "satellite-before"]
};

function orderedImages(style = "familiar") {
  const order = stylePriority[style] || stylePriority.familiar;
  return [...tokenData.images].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}

function renderGallery(style = "familiar") {
  gallery.classList.add("isRefreshing");
  const images = orderedImages(style);
  window.setTimeout(() => {
    gallery.innerHTML = images.map((image, index) => `
      <article class="shot" tabindex="0">
        <div class="shotMedia">
          <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.label)}" loading="lazy">
          <span class="dreamMode">${escapeHtml(dreamModes[index % dreamModes.length])}</span>
        </div>
        <div>
          <h3>${escapeHtml(image.label)}</h3>
          <p>${escapeHtml(image.description || "Referência visual para ajudar o cliente a imaginar a piscina pronta.")}</p>
        </div>
      </article>
    `).join("");
    gallery.classList.remove("isRefreshing");
  }, 120);
}

styleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    styleButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("isActive", selected);
      item.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    renderGallery(button.dataset.poolStyle);
  });
});
renderGallery("familiar");

const leadForm = document.querySelector("#leadForm");
const formStatus = document.querySelector("#formStatus");
const uploadBox = document.querySelector("#uploadBox");
const uploadStatus = document.querySelector("#uploadStatus");
const photoInput = document.querySelector("#photoInput");
const uploadPreview = document.querySelector("#uploadPreview");
const startSimulation = document.querySelector("#startSimulation");
const leadFields = document.querySelector("#leadFields");

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function selectedPhotos() {
  const formData = new FormData(leadForm);
  return formData.getAll("photos").filter((file) => file instanceof File && file.name);
}

function updateUploadStatus() {
  const photos = selectedPhotos();
  uploadStatus.textContent = photos.length
    ? `${photos.length} foto${photos.length > 1 ? "s" : ""} pronta${photos.length > 1 ? "s" : ""} para orientar sua simulação.`
    : "Nenhuma foto selecionada.";
  if (!uploadPreview) return;
  uploadPreview.innerHTML = photos.slice(0, 4).map((file) => `
    <figure>
      <img src="${URL.createObjectURL(file)}" alt="Prévia enviada: ${escapeHtml(file.name)}">
      <figcaption>${escapeHtml(file.name)}</figcaption>
    </figure>
  `).join("");
}

startSimulation?.addEventListener("click", () => {
  leadForm.classList.add("isActive");
  formStatus.textContent = "Simulação iniciada. Envie fotos, medidas e preferências para aproximar a piscina do seu terreno real.";
  leadFields?.querySelector("input, select, textarea")?.focus({ preventScroll: true });
  leadFields?.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelectorAll('input[type="file"][name="photos"]').forEach((input) => {
  input.addEventListener("change", updateUploadStatus);
});

uploadBox?.addEventListener("dragover", (event) => {
  event.preventDefault();
  uploadBox.classList.add("isDragging");
});

uploadBox?.addEventListener("dragleave", () => {
  uploadBox.classList.remove("isDragging");
});

uploadBox?.addEventListener("drop", (event) => {
  event.preventDefault();
  uploadBox.classList.remove("isDragging");
  if (photoInput && event.dataTransfer?.files?.length) {
    photoInput.files = event.dataTransfer.files;
    updateUploadStatus();
  }
});

function fileToPayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: reader.result
      });
    });
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

leadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(leadForm);
  const payload = Object.fromEntries([...formData.entries()].filter(([, value]) => !(value instanceof File)));
  const photos = selectedPhotos();

  payload.token = tokenData.token;
  payload.photoCount = photos.length;
  formStatus.textContent = photos.length ? "Preparando fotos do terreno..." : "Registrando interesse...";

  try {
    payload.photos = await Promise.all(photos.map(fileToPayload));
    formStatus.textContent = "Registrando interesse...";

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (result.ok) {
      leadForm.reset();
      updateUploadStatus();
      const saved = result.record?.photoFilesSaved || 0;
      formStatus.classList.add("emotionalSuccess");
      formStatus.textContent = saved
        ? "Seu espaço de lazer começa aqui. Recebemos suas fotos para preparar a próxima visão do projeto."
        : "Seu espaço de lazer começa aqui. A equipe comercial pode retornar com o orçamento.";
    } else {
      formStatus.textContent = "Não foi possível registrar agora. Tente novamente.";
    }
  } catch {
    formStatus.textContent = "Não foi possível preparar ou registrar as fotos agora. Tente novamente.";
  }
});


document.querySelectorAll("[data-flow-compare]").forEach((compare) => {
  const range = compare.querySelector("[data-flow-range]");
  const before = compare.querySelector("[data-flow-before]");
  const handle = compare.querySelector("[data-flow-handle]");

  function updateFlowCompare() {
    const value = `${range.value}%`;
    before.style.width = value;
    handle.style.left = value;
  }

  range?.addEventListener("input", updateFlowCompare);
  updateFlowCompare();
});






document.querySelectorAll(".button").forEach((button) => {
  button.addEventListener("click", () => {
    button.classList.add("isLoading");
    window.setTimeout(() => button.classList.remove("isLoading"), 720);
  });
});

