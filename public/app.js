const baseImages = [
  {
    id: "pool-dream",
    label: "Piscina moderna com agua cristalina",
    src: "/images/pool-project.jpeg",
    description: "Imagem premium para ativar a sensacao de que a piscina ja pertence a casa."
  },
  {
    id: "pool-3d",
    label: "Render arquitetonico de alto padrao",
    src: "/images/pool-3d.jpeg",
    description: "Render arquitetonico para antecipar volume, acabamento e experiencia visual."
  },
  {
    id: "top-view",
    label: "Piscina com deck e circulacao planejada",
    src: "/images/pool-top-view.jpeg",
    description: "Vista superior para entender piscina, deck, circulacao e proporcao do espaco."
  },
  {
    id: "satellite-before",
    label: "Base do terreno para comparacao",
    src: "/images/satellite-original.png",
    description: "Registro inicial do terreno para reforcar o antes e depois personalizado."
  },
  {
    id: "satellite-after",
    label: "Vista aerea com piscina inserida",
    src: "/images/satellite-pool-after.jpeg",
    description: "Antecipacao visual da piscina inserida no ambiente do cliente."
  }
];

const TOKENS = {
  "000000": {
    token: "000000",
    productName: "Piscina Premium com IA Visual",
    region: "Florida",
    heroImage: "/images/pool-project.jpeg",
    images: baseImages
  },
  "111111": {
    token: "111111",
    productName: "Piscina Familiar com Área Lounge",
    region: "Projeto demo residencial",
    heroImage: "/images/pool-project.jpeg",
    images: [baseImages[1], baseImages[2], baseImages[0], baseImages[4], baseImages[3]].map((image) => ({
      ...image,
      description: {
        "pool-3d": "Pre-imagem inicial para uma familia visualizar piscina com leitura moderna e area rasa.",
        "top-view": "A vista superior ajuda a discutir proporcao entre piscina, deck e circulacao familiar.",
        "pool-dream": "Referencia aspiracional para mostrar lazer, valorizacao da casa e uso aos finais de semana.",
        "satellite-after": "Simulacao por cima para mostrar como o projeto pode ocupar o terreno.",
        "satellite-before": "Imagem base antes da simulacao, preservada para comparacao do cliente."
      }[image.id] || image.description
    }))
  }
};

const pathToken = window.location.pathname.replace("/", "").trim();
const activeToken = pathToken || "000000";
const tokenData = TOKENS[activeToken] || TOKENS["000000"];
const absoluteTokenUrl = `${window.location.origin}/${tokenData.token}`;

document.querySelector("#tokenBadge").textContent = `Token ${tokenData.token}`;
document.querySelector("#productName").textContent = tokenData.productName;
document.querySelector("#regionName").textContent = tokenData.region;
document.querySelector("#mainVisual").src = tokenData.heroImage || tokenData.images[0].src;
const tokenLinkLabel = document.querySelector("#qrTarget");
tokenLinkLabel.textContent = "Link do token";
tokenLinkLabel.title = absoluteTokenUrl;
document.querySelector("#tokenCardNumber").textContent = tokenData.token;
document.querySelector("#qrImage").src = `/images/qr-token-${tokenData.token}.png`;
const copyTokenLink = document.querySelector("#copyTokenLink");
const tokenCopyStatus = document.querySelector("#tokenCopyStatus");
const tokenCopyDefaultLabel = copyTokenLink?.textContent || "Copiar link do token";
let tokenCopyTimer;
copyTokenLink?.addEventListener("click", async () => {
  window.clearTimeout(tokenCopyTimer);
  try {
    await navigator.clipboard.writeText(absoluteTokenUrl);
    copyTokenLink.textContent = "Copiado!";
    copyTokenLink.classList.add("isCopied");
    tokenCopyStatus.textContent = "Link copiado com sucesso.";
    tokenCopyTimer = window.setTimeout(() => {
      copyTokenLink.textContent = tokenCopyDefaultLabel;
      copyTokenLink.classList.remove("isCopied");
      tokenCopyStatus.textContent = "";
    }, 2000);
  } catch {
    tokenCopyStatus.textContent = absoluteTokenUrl;
  }
});

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
const styleNarrative = document.querySelector("#styleNarrative");
const styleProfiles = {
  familiar: {
    title: "Familiar",
    subtitle: "Convivência, segurança e uso diário.",
    body: "A curadoria prioriza área rasa, leitura de circulação, crianças por perto e uma piscina fácil de imaginar na rotina da casa.",
    cta: "Ideal para transformar o quintal em ponto de encontro da família.",
    order: ["pool-3d", "top-view", "pool-dream", "satellite-after", "satellite-before"],
    badges: ["Uso diário", "Área rasa", "Circulação", "Antes e depois", "Terreno atual"],
    descriptions: {
      "pool-3d": "Mostra volume, borda e área rasa com leitura clara para uso familiar e acompanhamento de crianças.",
      "top-view": "Ajuda a entender circulação, deck e espaço livre para brincar, sentar e receber sem apertar o quintal.",
      "pool-dream": "Traduz o desejo da família: lazer em casa, fim de semana resolvido e piscina como centro da convivência.",
      "satellite-after": "Mostra como a piscina pode ocupar o terreno sem perder passagem, deck e area de apoio.",
      "satellite-before": "Preserva a base atual para comparar o que muda antes de avançar para visita técnica."
    }
  },
  moderna: {
    title: "Moderna",
    subtitle: "Linhas limpas, acabamento premium e valorização da casa.",
    body: "A curadoria prioriza impacto visual, revestimento claro, iluminação e uma leitura mais arquitetônica para vender desejo e valor percebido.",
    cta: "Ideal para quem quer uma piscina com aparência sofisticada desde a primeira imagem.",
    order: ["pool-dream", "pool-3d", "satellite-after", "top-view", "satellite-before"],
    badges: ["Visual premium", "Render", "Implantação", "Layout", "Base real"],
    descriptions: {
      "pool-dream": "Abre com a imagem mais aspiracional para vender acabamento, agua cristalina e sensacao de casa valorizada.",
      "pool-3d": "Reforça linhas retas, bordas, proporção e acabamento para uma conversa mais arquitetônica.",
      "satellite-after": "Mostra a piscina inserida no terreno como uma melhoria visual de alto impacto.",
      "top-view": "Organiza deck, espelho d'água e circulação com foco em composição limpa e moderna.",
      "satellite-before": "Mantém o ponto de partida real para comparar o salto visual da proposta."
    }
  },
  lounge: {
    title: "Área Lounge",
    subtitle: "Deck, descanso, paisagismo e receber amigos.",
    body: "A curadoria prioriza implantação, espreguiçadeiras, deck, área de permanência e clima de resort residencial.",
    cta: "Ideal para vender a piscina como experiência social, não apenas como obra.",
    order: ["top-view", "satellite-after", "pool-dream", "pool-3d", "satellite-before"],
    badges: ["Deck", "Resort em casa", "Convivência", "Ambiente", "Antes"],
    descriptions: {
      "top-view": "Começa pela vista superior para discutir deck, espreguiçadeiras, mesa, caminho e área de descanso.",
      "satellite-after": "Mostra a piscina como núcleo de uma área externa completa para receber amigos.",
      "pool-dream": "Traz a emoção do lounge pronto: água, sol, acabamento e clima de feriado em casa.",
      "pool-3d": "Ajuda a visualizar profundidade, borda e volumes que sustentam a experiencia de lounge.",
      "satellite-before": "Mostra o terreno original para deixar claro o potencial de transformacao da area externa."
    }
  }
};

function selectedProfile(style = "familiar") {
  return styleProfiles[style] || styleProfiles.familiar;
}

function orderedImages(style = "familiar") {
  const order = selectedProfile(style).order;
  return [...tokenData.images].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}

function renderStyleNarrative(style = "familiar") {
  if (!styleNarrative) return;
  const profile = selectedProfile(style);
  styleNarrative.innerHTML = `
    <div>
      <span>${escapeHtml(profile.title)}</span>
      <strong>${escapeHtml(profile.subtitle)}</strong>
      <p>${escapeHtml(profile.body)}</p>
    </div>
    <em>${escapeHtml(profile.cta)}</em>
  `;
}

function renderGallery(style = "familiar") {
  gallery.classList.add("isRefreshing");
  const profile = selectedProfile(style);
  const images = orderedImages(style);
  renderStyleNarrative(style);
  window.setTimeout(() => {
    gallery.innerHTML = images.map((image, index) => {
      const badge = profile.badges[index] || profile.title;
      const description = profile.descriptions[image.id] || image.description || "Referência visual para ajudar o cliente a imaginar a piscina pronta.";
      return `
        <article class="shot" tabindex="0">
          <div class="shotMedia">
            <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.label)}" loading="lazy">
            <span class="dreamMode">${escapeHtml(badge)}</span>
          </div>
          <div>
            <h3>${escapeHtml(image.label)}</h3>
            <p>${escapeHtml(description)}</p>
          </div>
        </article>
      `;
    }).join("");
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
