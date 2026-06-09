# Checklist Tecnico-Comercial Premium

## Experiencia comercial

- [x] Landing premium publicada.
- [x] Hero com proposta clara: visualizar piscina antes da visita tecnica.
- [x] Fluxo narrativo: ideia, IA, projeto visual, visita tecnica.
- [x] CTA para envio de fotos/medidas/orcamento.
- [x] Galeria de pre-imagens por token.
- [x] Dois tokens demonstraveis: `000000` e `111111`.

## Captacao de lead

- [x] Formulario captura nome e telefone obrigatorios.
- [x] Captura email, endereco, medidas, estilo, formato, profundidade e revestimento.
- [x] Upload de fotos funcionando.
- [x] Lead com foto foi testado em producao.
- [x] Erro de foto invalida nao derruba o sistema.

## Admin

- [x] Painel admin publicado.
- [x] Admin protegido por `ADMIN_TOKEN`.
- [x] Admin sem token retorna bloqueio.
- [x] Admin autenticado lista leads.
- [x] Foto de lead abre pela rota admin autenticada.
- [x] Path traversal em foto admin bloqueado.
- [x] Cadastro de produtos/upsell disponivel.

## Robustez tecnica

- [x] `/000000` retorna 200.
- [x] `/111111` retorna 200.
- [x] `/badtoken` retorna 404.
- [x] Rota reservada retorna 410.
- [x] Metodo errado retorna 405.
- [x] JSON invalido retorna 400 sem derrubar Node.
- [x] Payload grande retorna 413.
- [x] Headers basicos de seguranca ativos.
- [x] Smoke test local passa.

## Persistencia

- [x] Modo arquivo funciona para demo.
- [x] Projeto preparado para Supabase Free.
- [x] Schema SQL versionado em `scripts/supabase-schema.sql`.
- [x] Script `npm run check:supabase` criado.
- [ ] Criar projeto Supabase Free.
- [ ] Executar schema no SQL Editor.
- [ ] Criar bucket privado `solara-lead-photos`.
- [ ] Configurar credenciais no Render.
- [ ] Ativar `LEAD_STORE_MODE=supabase` e `STORAGE_MODE=supabase`.
- [ ] Rodar QA real com Supabase ativo.

## Criterios para plano pago

Migrar para plano pago quando qualquer item abaixo acontecer:

- Coordenador aprovar piloto para uso recorrente.
- Houver campanha com trafego real.
- Leads/fotos passarem a ser informacao comercial sensivel recorrente.
- Necessidade de evitar hibernacao do Render Free.
- Necessidade de SLA, dominio proprio, backup e suporte operacional.
