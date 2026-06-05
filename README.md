# Solara Piscina IA App

Landing page por token para venda de piscinas. O token demo `000000` abre a primeira experiencia diretamente em `http://localhost:4173/000000`. O token `111111` demonstra uma segunda pagina com dados e imagem principal diferentes em `http://localhost:4173/111111`.

## Arquivos principais

- `public/index.html` - landing page pública focada em desejo, imagens e pedido de orçamento.
- `public/styles.css` - visual responsivo da landing.
- `public/app.js` - token, galeria, QR Code, formulário, envio de fotos e chamadas dry-run.
- `src/tokens.js` - dados do token, imagens iniciais e prompts de imagem.
- `src/image-generation-config.js` - endpoint LiteLLM e configuracao do modelo.
- `server.mjs` - servidor local, captura de lead, salvamento de fotos e rota de payload de imagem.

## Estado real

- A landing e o foco principal da entrega.
- O token `000000` abre direto a primeira versao.
- As imagens iniciais usam o pacote do coordenador de 28/05/2026 e cada imagem aponta para um prompt no código.
- O formulário registra contato, medidas, preferências e fotos do terreno para orientar o orçamento.
- As fotos enviadas sao salvas em `lead-uploads`; se o Windows bloquear a pasta local, o servidor usa uma pasta temporaria de fallback.
- A geração real de imagens fica desativada por padrão.
- `/api/image-generation/request` retorna payload dry-run sem consumir API. Para chamada real, exige `LITELLM_API_KEY` e `ENABLE_REAL_IMAGE_GENERATION=1`.
- Upsell, pagamento, CRM completo e cadastro de produtos ficam fora desta primeira etapa.

## Rodar

```bash
npm start
```

## Checar

```bash
npm run check
```



