# Lovable Price Studio

Crie uma aplicação web corporativa completa de Gestão de Custos e Precificação ("Cost & Price") utilizando React, Tailwind CSS e ícones do 'lucide-react'. Assuma que o ambiente usa TanStack Start e Supabase (portanto, crie mock data estruturado em memória para simular o banco de dados).

A interface principal deve ser um Painel de Precificação (Dashboard Table) contendo um fluxo completo de cadastro e auditoria de margens.

---

### 1. Tela Principal: Tabela de Precificação (Data Grid)

Uma tabela limpa e responsiva onde cada linha exibe um produto cadastrado com as seguintes colunas:

- **Descrição do Produto** (Nome e subtipo/badge indicando se é "Fabricado" ou "Revenda").

- **Tipo** (Fabricado / Revenda).

- **Custo Total** (Soma automática do custo de insumos/embalagens + mão de obra, ou preço pago + frete + impostos de compra).

- **Taxa Maquininha (%)**: Campo percentual editável na linha.

- **Logística (R$)**: Campo de valor fixo editável na linha.

- **Margem de Lucro (%)**: Campo percentual com formatação condicional (ex: badge verde para margem saudável >= 20%, amarelo para margem baixa).

- **Preço Final de Venda (R$)**: Calculado ativamente usando a fórmula de divisor de markup, mas permitindo ajuste manual do preço praticado.

### 2. Cabeçalho de Controle (Top Bar)

- Título principal: "Gestão de Portfólio e Precificação".

- Barra de busca por nome do produto.

- Filtros rápidos por tipo (Todos, Fabricado, Revenda).

- Botão primário com destaque: "+ Novo Produto" (que abre um modal ou slide-over lateral de cadastro).

### 3. Fluxo de Cadastro Dinâmico (Slide-over / Gaveta Lateral)

Ao clicar em "+ Novo Produto", abra um painel lateral deslizante com um formulário inteligente dividido em etapas:

- **Passo 1: Informações Básicas**

  - Campo de Descrição do Produto.

  - Seletor de Tipo (Botões de alternância / Tabs): `[ ] Produto Fabricado` vs `[ ] Produto Revenda`.

- **Passo 2 (Condicional se Fabricado):**

  - **Ficha Técnica / BOM Dinâmica:** Uma lista onde o usuário pode clicar em "+ Adicionar Insumo/Embalagem" para gerar novas linhas contendo: Nome do Item, Quantidade e Custo Unitário.

  - **Mão de Obra:** Campos numéricos para "Tempo Gasto (minutos)" e "Custo da Mão de Obra (R$ por minuto)".

- **Passo 3 (Condicional se Revenda):**

  - Campos numéricos para: Preço Pago ao Fornecedor, Frete de Aquisição, e Imposto de Compra (Despesa Irrecuperável).

- **Passo 4: Parâmetros de Venda Iniciais**

  - Margem de Lucro Alvo (%), Taxa da Maquininha (%) e Custo de Logística (R$).

### 4. Regras de Negócio e Engenharia Matemática (RIGOROSO)

- O sistema deve calcular o **Custo Total** em tempo real com base no tipo escolhido.

- O **Preço Final de Venda** deve respeitar a fórmula de divisor de markup: Custo Total / (1 - (Margem + Impostos/Taxas)), adicionando as taxas logísticas fixas ao final.

- O design deve seguir um padrão SaaS corporativo de altíssima qualidade (estilo ERP moderno, fontes nítidas, espaçamentos consistentes, sombras suaves e transições fluidas).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://price-craft-70.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b81ebe01-0fc0-493d-beba-474450336bba).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
