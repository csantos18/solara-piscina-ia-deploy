# Solara Piscina IA Deploy

Versao publica enxuta da demo Solara Piscina IA, preparada para Render Free Web Service.

## Links publicados

- Demo principal: `https://solara-piscina-ia.onrender.com/000000`
- Demo secundaria: `https://solara-piscina-ia.onrender.com/111111`
- Painel admin: `https://solara-piscina-ia.onrender.com/admin`
- Catalogo publico de upsell: `https://solara-piscina-ia.onrender.com/api/products`

Token admin demo atual: `solara-admin-2026`.

## Arquivos principais

- `public/index.html` - landing page por token focada em desejo, imagens e pedido de orcamento.
- `public/admin.html` - painel comercial protegido por token.
- `public/app.js` - token, galeria, QR Code, formulario, upload de fotos e envio de lead.
- `public/admin.js` - leitura de leads e cadastro de produtos/upsell no painel.
- `public/styles.css` - visual responsivo da landing e do admin.
- `src/tokens.js` - dados dos tokens, imagens iniciais e prompts de imagem.
- `src/image-generation-config.js` - endpoint LiteLLM e configuracao do modelo.
- `server.mjs` - servidor Node, rotas publicas, leads, admin, produtos e dry-run de imagem.
- `render.yaml` - configuracao do Render Free Web Service.

## Estado real

- A landing publica esta online no Render.
- O token `000000` abre a primeira experiencia.
- O token `111111` demonstra uma segunda pagina com dados e imagem principal diferentes.
- O formulario registra contato, medidas, preferencias e fotos do terreno.
- O painel admin lista leads, fotos/metadados e status operacional.
- O painel admin permite cadastrar produtos complementares/upsell.
- O catalogo inicial inclui deck premium, moveis externos e painel solar futuro.
- A geracao real de imagens fica desativada por padrao.
- `/api/image-generation/request` retorna payload dry-run sem consumir API. Para chamada real, exige `LITELLM_API_KEY` e `ENABLE_REAL_IMAGE_GENERATION=1`.

## Limites conhecidos

- Render Free pode dormir e demorar no primeiro acesso.
- Leads, fotos e produtos gravados em arquivo nao sao armazenamento definitivo em producao.
- Para producao, conectar banco de dados, storage externo e login administrativo real.
- Pagamento online e CRM completo ainda nao foram implementados.
- O prazo de 30 dias deve continuar como premissa comercial a validar pela empresa.

## Rodar local

```bash
npm start
```

Abrir:

```text
http://localhost:4173/000000
http://localhost:4173/111111
http://localhost:4173/admin
```

## Checar

```bash
npm run check
```

No PowerShell, se `npm` for bloqueado por politica de script:

```bash
npm.cmd run check
```
