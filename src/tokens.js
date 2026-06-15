const baseImages = [
  {
    id: "pool-dream",
    label: "Piscina moderna com água cristalina",
    src: "/images/pool-project.jpeg",
    promptKey: "poolDream",
    description: "Imagem premium para ativar a sensação de que a piscina já pertence à casa."
  },
  {
    id: "pool-3d",
    label: "Render arquitetônico de alto padrão",
    src: "/images/pool-3d.jpeg",
    promptKey: "pool3d",
    description: "Render arquitetônico para antecipar volume, acabamento e experiência visual."
  },
  {
    id: "top-view",
    label: "Piscina com deck e circulação planejada",
    src: "/images/pool-top-view.jpeg",
    promptKey: "topViewPlan",
    description: "Curadoria com deck, circulação e proporção para o cliente entender o uso do espaço."
  },
  {
    id: "satellite-before",
    label: "Base do terreno para comparação",
    src: "/images/satellite-original.png",
    promptKey: "satelliteOriginal",
    description: "Registro inicial do terreno para reforçar o antes e depois personalizado."
  },
  {
    id: "satellite-after",
    label: "Vista aérea com piscina inserida",
    src: "/images/satellite-pool-after.jpeg",
    promptKey: "topSimulation",
    description: "Antecipação visual da piscina inserida no ambiente do cliente."
  }
];

const basePrompts = {
  heroLuxuryAqua: "Gerar imagem hero 16:9 para landing premium de piscina residencial de alto padrão na Florida, com água azul cristalina, deck sofisticado, casa moderna ao fundo, luz de fim de tarde, sensação de resort particular, composição com espaço limpo para texto à esquerda, estética Luxury Aqua Tech, realista e comercial.",
  poolDream: "Gerar imagem aspiracional de piscina premium em área externa residencial na Florida, com água azul cristalina, deck moderno, paisagismo discreto e sensação clara de desejo comercial.",
  pool3d: "Gerar visualização 3D comercial da piscina para mostrar como o projeto pode ficar, com leitura limpa, deck, profundidade visual e acabamento premium.",
  topViewPlan: "Gerar vista superior de proposta de piscina premium para apresentação comercial, mostrando piscina, deck, circulação, paisagismo leve e leitura clara do espaço.",
  satelliteOriginal: "Preservar a imagem original do terreno ou área externa do cliente como base antes da simulação visual.",
  topSimulation: "Criar simulação visual por cima mostrando como a piscina pode ficar no espaço do cliente, com clareza de proporção, área livre e validação inicial.",
};

function withDescriptions(images, descriptions) {
  return images.map((image) => ({
    ...image,
    description: descriptions[image.id] || image.description
  }));
}

export const TOKENS = {
  "000000": {
    token: "000000",
    brand: "Solara Piscina IA",
    productName: "Piscina Premium com IA Visual",
    city: "Florida",
    region: "Florida",
    address: "Terreno ou área externa do cliente",
    priceRange: "Orçamento sob análise do terreno",
    qrTarget: "/000000",
    heroImage: "/images/pool-project.jpeg",
    heroPromptKey: "heroLuxuryAqua",
    images: baseImages,
    prompts: basePrompts
  },
  "111111": {
    token: "111111",
    brand: "Solara Piscina IA",
    productName: "Piscina Familiar com Área Lounge",
    city: "Florida",
    region: "Projeto demo residencial",
    address: "Quintal familiar com área de lazer",
    priceRange: "Orçamento sob análise do terreno",
    qrTarget: "/111111",
    heroImage: "/images/pool-project.jpeg",
    heroPromptKey: "poolDream",
    images: withDescriptions([
      baseImages[1],
      baseImages[2],
      baseImages[0],
      baseImages[4],
      baseImages[3]
    ], {
      "pool-3d": "Pré-imagem inicial para uma família visualizar piscina com leitura moderna e área rasa.",
      "top-view": "A vista superior ajuda a discutir proporção entre piscina, deck e circulação familiar.",
      "pool-dream": "Referência aspiracional para mostrar lazer, valorização da casa e uso aos finais de semana.",
      "satellite-after": "Simulação por cima para mostrar como o projeto pode ocupar o terreno.",
      "satellite-before": "Imagem base antes da simulação, preservada para comparação do cliente.",
    }),
    prompts: {
      ...basePrompts,
      poolDream: "Gerar imagem de piscina familiar premium com área lounge rasa, água azul clara, deck seguro, espaço para lazer e sensação de casa valorizada.",
      pool3d: "Gerar visualização 3D comercial de piscina familiar com área lounge rasa e acabamento moderno, mostrando área rasa, deck e circulação confortável.",
      topViewPlan: "Gerar vista superior para cliente familiar, destacando piscina, área lounge rasa, deck, circulação e área livre para convivência.",
      topSimulation: "Criar simulação visual por cima mostrando piscina familiar inserida no quintal, com proporção clara e foco em decisão de orçamento."
    }
  }
};
