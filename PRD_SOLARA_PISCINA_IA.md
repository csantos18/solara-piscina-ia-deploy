# PRD - Solara Piscina IA

## 1. Visao geral

Solara Piscina IA e uma experiencia comercial por token para venda de piscinas. O cliente recebe um link ou QR Code, visualiza pre-imagens do projeto, entende o antes/depois do terreno e envia fotos, medidas e preferencias para iniciar um orcamento mais qualificado.

A versao atual e um piloto funcional publicado em Render Free, com landing publica, painel administrativo basico, captura de leads em Supabase, upload de fotos em Supabase Storage, catalogo inicial de upsell e endpoint de IA em modo dry-run.

## 2. Objetivo do produto

Aumentar conversao comercial ao transformar uma abordagem fria de orcamento em uma experiencia visual premium antes da primeira conversa com vendedor.

Objetivos principais:

- gerar desejo visual pela piscina;
- personalizar a experiencia por token do prospect;
- coletar dados suficientes para orientar o orcamento;
- preparar a evolucao para simulacao real por IA;
- permitir que vendedor/coordenador acompanhe leads e oportunidades;
- abrir caminho para upsell depois do orcamento principal.

## 3. Publico-alvo

- Clientes interessados em construir piscina residencial.
- Vendedores que precisam qualificar leads antes de contato direto.
- Coordenadores comerciais que precisam acompanhar demonstracoes, leads e status do funil.

## 4. Escopo implementado

### 4.1 Landing por token

- Token principal: `/000000`.
- Token secundario: `/111111`.
- Conteudo visual muda por token.
- Hero premium com imagem de piscina.
- Galeria de pre-imagens.
- Comparativo antes/depois com imagem de satelite.
- QR Code apontando para a pagina do token.
- Secao de fluxo comercial usando imagens do video/demo.

### 4.2 Formulario de orcamento

Campos implementados:

- nome;
- WhatsApp;
- email;
- fotos do terreno;
- largura disponivel;
- comprimento disponivel;
- tamanho desejado da piscina;
- tipo de solo;
- estilo desejado;
- formato preferido;
- profundidade ou uso principal;
- area disponivel aproximada;
- preferencia de revestimento;
- deck e entorno;
- objetivo visual;
- local/regiao opcional;
- preferencia principal opcional.

### 4.3 Painel administrativo

Rota:

```text
/admin
```

Funcionalidades:

- acesso por token administrativo;
- total de leads;
- leads com fotos;
- fotos salvas;
- modo da IA;
- tokens conhecidos;
- observacao de storage;
- listagem de leads;
- dados comerciais do lead;
- status comercial do lead: novo, em analise, orcado, fechado ou perdido;
- metadados de fotos enviadas;
- abertura protegida de fotos no painel admin.

### 4.4 Catalogo de upsell

Funcionalidades:

- cadastro simples de produto complementar no painel admin;
- listagem de produtos no painel;
- API publica de catalogo preview em `/api/products`.

Produtos iniciais:

- Deck premium atermico;
- Moveis externos;
- Painel solar futuro.

### 4.5 IA visual

Implementado:

- prompts rastreaveis em `src/tokens.js`;
- configuracao LiteLLM em `src/image-generation-config.js`;
- endpoint `/api/image-generation/request`;
- modo dry-run por padrao.

Nao implementado por padrao:

- chamada real de geracao de imagem;
- consumo automatico de API;
- cobranca por geracao.

## 5. Links atuais

- Demo principal: `https://solara-piscina-ia.onrender.com/000000`
- Demo secundaria: `https://solara-piscina-ia.onrender.com/111111`
- Painel admin: `https://solara-piscina-ia.onrender.com/admin`
- Catalogo publico: `https://solara-piscina-ia.onrender.com/api/products`
- Repo publico deploy-only: `https://github.com/csantos18/solara-piscina-ia-deploy`
- Repo privado completo: `https://github.com/csantos18/solara-piscina-ia`
- Health check: `https://solara-piscina-ia.onrender.com/api/health`
- Readiness de piloto real: `https://solara-piscina-ia.onrender.com/api/readiness`

Token admin: deve ser configurado por variavel de ambiente `ADMIN_TOKEN` no Render. Nao publicar segredo administrativo em documentacao publica.

## 6. Requisitos funcionais

| ID | Requisito | Status |
| --- | --- | --- |
| RF-01 | Abrir landing pelo token `000000` | Implementado |
| RF-02 | Abrir landing alternativa pelo token `111111` | Implementado |
| RF-03 | Exibir galeria de pre-imagens | Implementado |
| RF-04 | Exibir antes/depois do terreno | Implementado |
| RF-05 | Gerar QR Code do token | Implementado |
| RF-06 | Coletar dados de contato | Implementado |
| RF-07 | Coletar fotos do terreno | Implementado |
| RF-08 | Coletar medidas e preferencias | Implementado |
| RF-09 | Salvar lead no servidor | Implementado em Supabase, com fallback local para desenvolvimento |
| RF-10 | Exibir leads em painel admin | Implementado |
| RF-10.1 | Atualizar status comercial do lead | Implementado |
| RF-11 | Exibir metadados e abrir fotos protegidas no admin | Implementado |
| RF-12 | Cadastrar produtos de upsell | Implementado |
| RF-13 | Expor catalogo publico de upsell | Implementado |
| RF-14 | Gerar payload de IA em dry-run | Implementado |
| RF-15 | Gerar imagem real por IA | Preparado, nao ativado |
| RF-16 | Expor readiness para diferenciar demo de piloto real | Implementado |

## 7. Requisitos nao funcionais

- A experiencia deve parecer premium, visual e comercial.
- O primeiro acesso pode ser mais lento no Render Free.
- O projeto nao deve prometer producao final recorrente sem plano, dominio e autenticacao robusta.
- O codigo deve rodar sem dependencias externas obrigatorias alem do Node.
- O deploy publico nao deve incluir docs sensiveis, pitch interno ou contexto completo do coordenador.
- Cliente real recorrente exige Supabase Free ou equivalente para leads e fotos; Render Free com arquivo local deve permanecer apenas como demo local ou piloto interno.
- `REQUIRE_PERSISTENT_STORAGE=1` deve bloquear recebimento de leads reais quando Supabase nao estiver configurado.

## 8. Fora do escopo atual

- CRM completo.
- Pagamento online.
- Login administrativo profissional com usuarios, papeis e recuperacao de acesso.
- Banco de dados relacional completo para CRM.
- Storage externo fora do Supabase configurado.
- Garantia operacional de obra em 30 dias.
- Automacao real de busca de endereco.
- Geracao real de imagem ativada por padrao.

## 9. Riscos e limitacoes

- Render Free pode hibernar e causar demora no primeiro acesso.
- Filesystem do Render Free nao deve ser tratado como armazenamento permanente.
- `/api/readiness` retorna `503` se o app voltar ao modo demo com arquivo local.
- Token admin simples serve para demo/local; em producao deve vir de `ADMIN_TOKEN` e evoluir para login profissional.
- Leads e fotos usam Supabase via variaveis de ambiente; para uso real, manter bucket privado e politica de acesso restrita.
- Premissas comerciais, como prazo de 30 dias, precisam validacao da empresa.

## 10. Proximos passos recomendados

1. Gravar video curto para coordenador mostrando demo, admin e upsell.
2. Validar se a narrativa comercial esta aprovada.
3. Definir se a IA real sera ativada e com qual custo/limite.
4. Validar regras comerciais para leads e produtos no Supabase.
5. Validar politica de acesso do bucket de fotos.
6. Substituir token simples por login administrativo.
7. Evoluir status comercial com filtros, historico de mudanca e responsavel pelo atendimento.
8. Avaliar dominio proprio e plano pago para apresentacao mais estavel.
