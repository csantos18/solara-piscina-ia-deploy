# PRD - Solara Piscina IA

## 1. Visao geral

Solara Piscina IA e uma experiencia comercial por token para venda de piscinas. O cliente recebe um link ou QR Code, visualiza pre-imagens do projeto, entende o antes/depois do terreno e envia fotos, medidas e preferencias para iniciar um orcamento mais qualificado.

A versao atual deve seguir estritamente o material enviado pelo coordenador em `contexto-devs-piscinas-ia`: foco em uma landing page maravilhosa por token, captura de dados para orcamento e preparacao controlada para IA futura. Recursos de CRM completo, pagamento, cadastro de produtos e upsell ficam fora da entrega principal.

Fontes de escopo do coordenador:

- `landingpage-draft.md`;
- `proposta-comercial-piscinas-ia.html`;
- imagens do pacote `contexto-devs-piscinas-ia`.

## 2. Objetivo do produto

Aumentar conversao comercial ao transformar uma abordagem fria de orcamento em uma experiencia visual premium antes da primeira conversa com vendedor.

Objetivos principais:

- gerar desejo visual pela piscina;
- personalizar a experiencia por token do prospect;
- coletar dados suficientes para orientar o orcamento;
- preparar a evolucao para simulacao real por IA;
- permitir acompanhamento basico dos leads recebidos;
- manter upsell apenas como etapa futura depois do orcamento da piscina.

## 3. Publico-alvo

- Clientes interessados em construir piscina residencial.
- Vendedores que precisam qualificar leads antes de contato direto.
- Coordenadores comerciais que precisam acompanhar demonstracoes e leads recebidos.

## 4. Escopo combinado com o coordenador

### 4.1 Entrega principal: landing por token

- Token principal: `/000000`.
- Acesso direto por `base_url/token`.
- Possibilidade de outros tokens em etapa seguinte.
- Hero premium com imagem de piscina.
- Galeria de pre-imagens.
- Comparativo antes/depois com imagem de satelite.
- QR Code apontando para a pagina do token.
- Foco em vender a piscina antes da primeira visita tecnica.

### 4.2 Formulario de orcamento

Campos esperados:

- nome;
- WhatsApp;
- email;
- fotos do terreno;
- largura disponivel;
- comprimento disponivel;
- tamanho desejado da piscina;
- estilo desejado;
- preferencia de revestimento;
- preferencias gerais para melhorar a simulacao futura;
- local/regiao opcional.

### 4.3 Painel administrativo basico

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
- metadados de fotos enviadas;
- abertura protegida de fotos no painel admin.

O status comercial simples pode ajudar a operacao interna, mas nao deve transformar a entrega em CRM completo.

### 4.4 IA visual

Implementado como preparacao controlada:

- prompts rastreaveis;
- configuracao LiteLLM em `src/image-generation-config.js`;
- endpoint `/api/image-generation/request`;
- modo dry-run por padrao.

Nao implementado por padrao:

- chamada real de geracao de imagem;
- consumo automatico de API;
- cobranca por geracao.

### 4.5 Futuro, nao entrega principal

- Upsell de moveis externos, painel solar e outros produtos.
- Cadastro de produtos.
- Pagamento online.
- CRM completo.
- Busca automatizada de enderecos.
- Folder PDF pronto para impressao.
- Modulo de campanhas por regiao, bairro ou ZIP code.

## 5. Links atuais

- Demo principal: `https://solara-piscina-ia.onrender.com/000000`
- Demo secundaria: `https://solara-piscina-ia.onrender.com/111111`
- Painel admin: `https://solara-piscina-ia.onrender.com/admin`
- Repo publico deploy-only: `https://github.com/csantos18/solara-piscina-ia-deploy`
- Repo privado completo: `https://github.com/csantos18/solara-piscina-ia`
- Health check: `https://solara-piscina-ia.onrender.com/api/health`
- Readiness de piloto real: `https://solara-piscina-ia.onrender.com/api/readiness`

Token admin: deve ser configurado por variavel de ambiente `ADMIN_TOKEN` no Render. Nao publicar segredo administrativo em documentacao publica.

## 6. Requisitos funcionais

| ID | Requisito | Status |
| --- | --- | --- |
| RF-01 | Abrir landing pelo token `000000` | Implementado |
| RF-02 | Abrir landing alternativa pelo token `111111` | Implementado como demonstracao adicional |
| RF-03 | Exibir galeria de pre-imagens | Implementado |
| RF-04 | Exibir antes/depois do terreno | Implementado |
| RF-05 | Gerar QR Code do token | Implementado |
| RF-06 | Coletar dados de contato | Implementado |
| RF-07 | Coletar fotos do terreno | Implementado |
| RF-08 | Coletar medidas e preferencias | Implementado |
| RF-09 | Salvar lead no servidor | Implementado em Supabase, com fallback local para desenvolvimento |
| RF-10 | Exibir leads em painel admin | Implementado |
| RF-10.1 | Atualizar status comercial simples do lead | Implementado como apoio interno, nao CRM |
| RF-11 | Exibir metadados e abrir fotos protegidas no admin | Implementado |
| RF-12 | Gerar folder PDF com QR Code | Pendente |
| RF-13 | Cadastrar prospect/token/imagens pelo admin | Pendente |
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
- Textos publicos nao devem prometer engenharia, garantia, prazo de obra ou resultado tecnico sem validacao da empresa.

## 8. Fora do escopo atual

- CRM completo.
- Pagamento online.
- Login administrativo profissional com usuarios, papeis e recuperacao de acesso.
- Banco de dados relacional completo para CRM.
- Storage externo fora do Supabase configurado.
- Garantia operacional de obra em 30 dias.
- Automacao real de busca de endereco.
- Geracao real de imagem ativada por padrao.
- Cadastro de produtos como funcionalidade de entrega principal.
- Upsell como etapa ativa antes do orcamento da piscina.
- Impressao fisica, postagem, midia paga ou compra de bases.

## 9. Riscos e limitacoes

- Render Free pode hibernar e causar demora no primeiro acesso.
- Filesystem do Render Free nao deve ser tratado como armazenamento permanente.
- `/api/readiness` retorna `503` se o app voltar ao modo demo com arquivo local.
- Token admin simples serve para demo/local; em producao deve vir de `ADMIN_TOKEN` e evoluir para login profissional se o piloto virar operacao recorrente.
- Leads e fotos usam Supabase via variaveis de ambiente; para uso real, manter bucket privado e politica de acesso restrita.
- Premissas comerciais, como prazo de 30 dias, precisam validacao da empresa.

## 10. Proximos passos recomendados

1. Revisar a landing publica contra o briefing do coordenador, sem adicionar escopo novo.
2. Validar se a narrativa comercial esta aprovada.
3. Definir se o folder PDF com QR Code ainda entra nesta fase.
4. Definir se o admin precisa cadastrar prospect/token/imagens agora ou em fase posterior.
5. Validar politica de acesso do bucket de fotos.
6. Definir se a IA real sera ativada e com qual custo/limite.
7. Avaliar dominio proprio e plano pago para apresentacao mais estavel.
