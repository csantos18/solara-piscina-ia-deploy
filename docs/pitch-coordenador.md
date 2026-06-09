# Pitch Executivo - Solara Piscina IA

## Decisao solicitada

Aprovar a continuidade do Solara Piscina IA como piloto premium de venda visual para piscinas, iniciando em infraestrutura gratuita controlada e migrando para plano pago somente apos validacao comercial.

## Problema comercial

A venda de piscina exige imaginacao do cliente. Antes da visita tecnica, muitos interessados ainda nao conseguem visualizar proporcao, acabamento, estilo e impacto da piscina no proprio terreno. Isso torna o orcamento mais frio, aumenta indecisao e exige mais esforco do comercial para explicar valor.

## Solucao proposta

Criar uma experiencia visual personalizada por token, onde o cliente acessa uma pagina exclusiva, ve pre-imagens aspiracionais, entende o antes/depois e envia fotos, medidas e preferencias. O comercial recebe tudo no painel admin e chega na conversa com contexto real.

## Fluxo do cliente

1. Cliente recebe um link/token.
2. Visualiza uma landing premium com imagens do projeto.
3. Entende a jornada: ideia, IA preparando projeto, resultado visual e visita tecnica.
4. Envia fotos, medidas e preferencias.
5. Comercial acessa o admin e recebe lead qualificado com fotos.
6. Visita tecnica/orcamento comecam com mais contexto e menor friccao.

## Valor para a operacao

- Aumenta percepcao premium da empresa.
- Ajuda o cliente a desejar o projeto antes do orcamento.
- Qualifica o lead com fotos, medidas e preferencias.
- Reduz conversa improdutiva antes da visita tecnica.
- Cria argumento de inovacao sem investimento alto inicial.

## Custo e risco

Fase atual recomendada: Render Free + Supabase Free.

- Custo inicial baixo.
- Sem compromisso com plano pago antes da aprovacao.
- Dados persistidos no Supabase Free quando ativado.
- Se o piloto for aprovado, migrar para Render pago e Supabase Pro.

## Status atual

- Landing publicada no Render.
- Tokens `000000` e `111111` funcionando.
- Formulario com envio de lead e fotos funcionando.
- Painel admin protegido por token funcionando.
- Rotas de erro testadas.
- Projeto preparado para Supabase Free com schema e script de validacao.

## Limites assumidos

- IA real de imagem ainda fica em dry-run para controlar custo.
- Infraestrutura gratuita serve para piloto, nao para campanha em escala.
- Plano pago deve entrar apos aprovacao para estabilidade, storage e continuidade operacional.

## Criterio de aprovacao do piloto

Aprovar se a demonstracao provar que o cliente consegue entender o valor visual, enviar informacoes reais e que o comercial consegue receber um lead mais qualificado para visita tecnica/orcamento.

## Proxima decisao

Aprovar o piloto com Supabase Free para persistencia real de leads/fotos. Depois de validacao comercial, aprovar migracao para planos pagos e dominio proprio.
