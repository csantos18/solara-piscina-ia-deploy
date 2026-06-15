const baseImages = [
  {
    id: "pool-dream",
    label: "Piscina moderna com água cristalina",
    src: "/images/pool-project.jpeg",
    originalFile: "contexto-devs-piscinas-ia/imagens/projeto piscina.jpeg",
    source: "pacote do coordenador - 28/05/2026",
    promptKey: "poolDream",
    description: "Imagem premium para ativar a sensação de que a piscina já pertence à casa."
  },
  {
    id: "pool-3d",
    label: "Render arquitetônico de alto padrão",
    src: "/images/pool-3d.jpeg",
    originalFile: "contexto-devs-piscinas-ia/imagens/piscina 3d.jpeg",
    source: "pacote do coordenador - 28/05/2026",
    promptKey: "pool3d",
    description: "Render arquitetônico para antecipar volume, acabamento e experiência visual."
  },
  {
    id: "top-view",
    label: "Piscina com deck e circulação planejada",
    src: "/images/pool-top-view.jpeg",
    originalFile: "contexto-devs-piscinas-ia/imagens/piscina vista de cima.jpeg",
    source: "pacote do coordenador - 28/05/2026",
    promptKey: "topViewPlan",
    description: "Curadoria com deck, circulação e proporção para o cliente entender o uso do espaço."
  },
  {
    id: "satellite-before",
    label: "Base do terreno para comparação",
    src: "/images/satellite-original.png",
    originalFile: "contexto-devs-piscinas-ia/imagens/imaem original de satélite.png",
    source: "pacote do coordenador - 28/05/2026",
    promptKey: "satelliteOriginal",
    description: "Registro inicial do terreno para reforçar o antes e depois personalizado."
  },
  {
    id: "satellite-after",
    label: "Vista aérea com piscina inserida",
    src: "/images/satellite-pool-after.jpeg",
    originalFile: "contexto-devs-piscinas-ia/imagens/imagem original de satélite com a piscina inserida.jpeg",
    source: "pacote do coordenador - 28/05/2026",
    promptKey: "topSimulation",
    description: "Antecipação visual da piscina inserida no ambiente do cliente."
  },
  {
    id: "solar-upsell",
    label: "Ambiente futuro com energia solar",
    src: "/images/pool-solar-upsell.jpeg",
    originalFile: "contexto-devs-piscinas-ia/imagens/projeto piscina e painel solar.jpeg",
    source: "pacote do coordenador - 28/05/2026",
    promptKey: "futureUpsell",
    description: "Cenário futuro para complementos depois do orçamento, sem tirar o foco da piscina."
  }
];

const basePrompts = {
  heroLuxuryAqua: "Gerar imagem hero 16:9 para landing premium de piscina residencial de alto padrão na Florida, com água azul cristalina, deck sofisticado, casa moderna ao fundo, luz de fim de tarde, sensação de resort particular, composição com espaço limpo para texto à esquerda, estética Luxury Aqua Tech, realista e comercial.",
  poolDream: "Gerar imagem aspiracional de piscina premium em área externa residencial na Florida, com água azul cristalina, deck moderno, paisagismo discreto e sensação clara de desejo comercial.",
  pool3d: "Gerar visualização 3D comercial da piscina para mostrar como o projeto pode ficar, com leitura limpa, deck, profundidade visual e acabamento premium.",
  topViewPlan: "Gerar vista superior de proposta de piscina premium para apresentação comercial, mostrando piscina, deck, circulação, paisagismo leve e leitura clara do espaço.",
  satelliteOriginal: "Preservar a imagem original do terreno ou área externa do cliente como base antes da simulação visual.",
  topSimulation: "Criar simulação visual por cima mostrando como a piscina pode ficar no espaço do cliente, com clareza de proporção, área livre e validação inicial.",
  futureUpsell: "Mostrar potencial futuro de upsell após orçamento e pagamento, incluindo móveis externos, painel solar e produtos complementares sem tirar o foco da piscina."
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
    buildTimeClaim: "Piscina geralmente vendida com promessa comercial de 30 dias, pendente de validação da empresa",
    priceRange: "Orçamento sob análise do terreno",
    qrTarget: "/000000",
    heroImage: "/images/pool-project.jpeg",
    heroPromptKey: "heroLuxuryAqua",
    imageSourcePackage: "contexto-devs-piscinas-ia.rar recebido em 28/05/2026",
    images: baseImages,
    prompts: basePrompts
  },
  "111111": {
    token: "111111",
    brand: "Solara Piscina IA",
    productName: "Piscina Familiar com Prainha",
    city: "Florida",
    region: "Projeto demo residencial",
    address: "Quintal familiar com área de lazer",
    buildTimeClaim: "Prazo comercial de 30 dias precisa de confirmação antes da proposta final",
    priceRange: "Orçamento sob análise do terreno",
    qrTarget: "/111111",
    heroImage: "/images/pool-3d.jpeg",
    heroPromptKey: "pool3d",
    imageSourcePackage: "contexto-devs-piscinas-ia.rar recebido em 28/05/2026",
    images: withDescriptions([
      baseImages[1],
      baseImages[2],
      baseImages[0],
      baseImages[4],
      baseImages[3],
      baseImages[5]
    ], {
      "pool-3d": "Pré-imagem inicial para uma família visualizar piscina com leitura moderna e área rasa.",
      "top-view": "A vista superior ajuda a discutir proporção entre piscina, deck e circulação familiar.",
      "pool-dream": "Referência aspiracional para mostrar lazer, valorização da casa e uso aos finais de semana.",
      "satellite-after": "Simulação por cima para mostrar como o projeto pode ocupar o terreno.",
      "satellite-before": "Imagem base antes da simulação, preservada para comparação do cliente.",
      "solar-upsell": "Complementos entram depois do orçamento; a venda principal continua sendo a piscina."
    }),
    prompts: {
      ...basePrompts,
      poolDream: "Gerar imagem de piscina familiar premium com prainha, água azul clara, deck seguro, espaço para lazer e sensação de casa valorizada.",
      pool3d: "Gerar visualização 3D comercial de piscina familiar com prainha e acabamento moderno, mostrando área rasa, deck e circulação confortável.",
      topViewPlan: "Gerar vista superior para cliente familiar, destacando piscina, prainha, deck, circulação e área livre para convivência.",
      topSimulation: "Criar simulação visual por cima mostrando piscina familiar inserida no quintal, com proporção clara e foco em decisão de orçamento."
    }
  }
};
