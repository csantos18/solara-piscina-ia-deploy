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
document.querySelector("#qrImage").src =
  `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(absoluteTokenUrl)}`;

const compareRange = document.querySelector("#compareRange");
const afterWrap = document.querySelector("#afterWrap");
const compareHandle = document.querySelector("#compareHandle");

compareRange?.addEventListener("input", () => {
  const value = `${compareRange.value}%`;
  afterWrap.style.width = value;
  compareHandle.style.left = value;
});

const gallery = document.querySelector("#gallery");
gallery.innerHTML = tokenData.images.map((image) => `
  <article class="shot">
    <img src="${image.src}" alt="${image.label}">
    <div>
      <h3>${image.label}</h3>
      <p>${image.description || "Referência visual para ajudar o cliente a imaginar a piscina pronta."}</p>
    </div>
  </article>
`).join("");

const leadForm = document.querySelector("#leadForm");
const formStatus = document.querySelector("#formStatus");
const uploadBox = document.querySelector("#uploadBox");
const uploadStatus = document.querySelector("#uploadStatus");
const photoInput = document.querySelector("#photoInput");
const startSimulation = document.querySelector("#startSimulation");
const leadFields = document.querySelector("#leadFields");

function selectedPhotos() {
  const formData = new FormData(leadForm);
  return formData.getAll("photos").filter((file) => file instanceof File && file.name);
}

function updateUploadStatus() {
  const photos = selectedPhotos();
  uploadStatus.textContent = photos.length
    ? `${photos.length} foto${photos.length > 1 ? "s" : ""} pronta${photos.length > 1 ? "s" : ""} para orientar sua simulação.`
    : "Nenhuma foto selecionada.";
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
      formStatus.textContent = saved
        ? "Interesse registrado com fotos do terreno. A equipe comercial pode retornar com o orçamento."
        : "Interesse registrado. A equipe comercial pode retornar com o orçamento.";
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
