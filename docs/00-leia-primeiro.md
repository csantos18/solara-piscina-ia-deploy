# Solara Piscina IA - Leia Primeiro

Esta pasta e a versao publica enxuta para deploy.

Use este repositorio somente para:

1. rodar a demo publicada;
2. revisar o codigo que vai para o Render;
3. configurar variaveis de ambiente;
4. validar health check, lead, upload e painel admin.

## Links

- Demo principal: `https://solara-piscina-ia.onrender.com/000000`
- Demo secundaria: `https://solara-piscina-ia.onrender.com/111111`
- Painel admin: `https://solara-piscina-ia.onrender.com/admin`
- Health check: `https://solara-piscina-ia.onrender.com/api/health`
- Readiness de piloto real: `https://solara-piscina-ia.onrender.com/api/readiness`

## Documentos validos

- `README.md` - visao operacional do deploy.
- `PRD_SOLARA_PISCINA_IA.md` - escopo e limites do produto.
- `docs/credenciais-operacionais.md` - regras para credenciais e segredos.

## Regra de limpeza

Este repositorio nao deve conter pitch interno, arquivos de auditoria, backups, leads locais, uploads locais, screenshots de QA ou credenciais reais.

## Regra de operacao real

Render Free pode hospedar a aplicacao para validacao. Para cliente real recorrente, o armazenamento deve estar em Supabase Free ou equivalente, com `LEAD_STORE_MODE=supabase`, `STORAGE_MODE=supabase` e `REQUIRE_PERSISTENT_STORAGE=1`.

Enquanto o projeto estiver em arquivo local, `/api/readiness` deve retornar bloqueio operacional para piloto real.
