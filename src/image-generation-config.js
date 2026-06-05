export const IMAGE_GENERATION = {
  provider: "LiteLLM",
  baseUrl: "https://litellm.cogmo.com.br",
  imageEndpoint: "https://litellm.cogmo.com.br/v1/images/generations",
  referenceDocs: "https://imagegen.alberton.work/docs",
  referenceDocsTestEndpoint: "https://imagegen.alberton.work/generate",
  model: "gpt-image-2",
  defaultSize: "1536x1024",
  defaultQuality: "medium",
  responseFormat: "b64_json",
  promptPolicy: [
    "Cada imagem exibida deve apontar para uma promptKey registrada em src/tokens.js.",
    "Cada prompt usado para gerar ou recriar uma imagem deve ficar no código.",
    "O prompt deve preservar o terreno ou área externa original do cliente e deixar claro o que será inserido.",
    "As imagens comerciais não substituem projeto técnico, engenharia, licença ou medição em obra."
  ],
  docsSummary: {
    acceptedReferenceImages: ["PNG", "JPEG", "WebP"],
    documentedQualities: ["low", "medium", "high"],
    documentedSizes: ["1024x1024", "1536x1024", "1024x1536", "auto"],
    upstreamFromDocs: "/v1/images/generations"
  }
};



