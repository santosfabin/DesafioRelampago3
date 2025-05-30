# Assistente de Manutenção de Ativos

## Visão Geral

O Assistente de Manutenção de Ativos é uma aplicação web full-stack projetada para ajudar usuários a gerenciar o ciclo de vida de manutenção de seus ativos importantes, como veículos, equipamentos e máquinas. Ele fornece uma plataforma centralizada para registrar ativos, agendar e rastrear manutenções (tanto realizadas quanto futuras), e visualizar um painel com informações relevantes sobre o estado dos ativos e suas próximas manutenções.

## Funcionalidades

- **Autenticação de Usuário:**
  - Cadastro de novas contas de usuário.
  - Login seguro com email e senha.
  - Gerenciamento de sessão via cookies HTTP-only.
  - Logout.
  - Página de perfil para o usuário atualizar seus dados (nome, email, senha) e excluir sua conta.
- **Gerenciamento de Ativos:**
  - CRUD completo para ativos (Criar, Ler, Atualizar, Deletar).
  - Campos: Nome, Descrição, Nível de Importância (1-5).
  - Listagem de ativos com funcionalidade de ordenação por colunas.
- **Gerenciamento de Manutenções:**
  - CRUD completo para registros de manutenção, associados a um ativo específico.
  - Campos: Serviço realizado, Descrição (opcional), Data da realização (`performed_at`), Status (`ativa`, `realizada`, `adiada`, `cancelada`).
  - Previsão para próxima manutenção:
    - Por data (`next_due_date`).
    - OU Por uso (`next_due_usage_limit`, `next_due_usage_current`, `usage_unit` como 'km', 'horas', 'ciclos').
    - Interface de formulário com seleção mutuamente exclusiva para tipo de previsão.
  - Listagem do histórico de manutenções de um ativo com ordenação.
- **Painel Principal (Landing Page):**
  - Visão geral e navegação rápida.
  - Destaque para "Ativos Importantes" (baseado no nível de importância).
  - Destaque para "Manutenções Próximas e Urgentes" (calculado no frontend com base nas datas e limites de uso).

## Estrutura do Projeto

O projeto é dividido em duas partes principais:

- `backend/`: Contém a API RESTful e a lógica de negócios.
- `frontend/`: Contém a interface do usuário desenvolvida em React.

## Tecnologias Utilizadas

- **Linguagem Principal:** TypeScript
- **Banco de Dados:** PostgreSQL

---

## Backend

### Visão Geral do Backend

O backend é uma API RESTful construída com Node.js e Express.js, utilizando TypeScript. Ele é responsável por gerenciar os dados de usuários, ativos e manutenções, interagir com o banco de dados PostgreSQL e lidar com a autenticação e autorização.

### Pré-requisitos (Backend)

- Node.js (v18.x ou superior recomendado)
- npm (v9.x ou superior) ou yarn (v1.22.x ou superior)
- PostgreSQL (v12 ou superior recomendado) instalado e rodando.

### Configuração e Instalação (Backend)

1.  Navegue até a pasta do backend:
    ```bash
    cd backend
    ```
2.  Instale as dependências:
    ```bash
    npm install
    # OU
    # yarn install
    ```
3.  **Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz da pasta `backend/` (baseado em um `.env.example` se fornecido). Exemplo:
    ```env
    PORT=3001
    DB_USER=postgres_user
    DB_HOST=localhost
    DB_NAME=asset_maintenance_db
    DB_PASSWORD=postgres_password
    DB_PORT=5432
    # SESSION_SECRET=your_very_strong_session_secret # Necessário para assinar cookies de sessão
    ```
4.  **Configuração do Banco de Dados:**
    - Certifique-se de que o usuário e o banco de dados especificados no `.env` existam no seu PostgreSQL.
    - Execute o script SQL para criar as tabelas (localizado em `backend/src/database/create_tables.sql`):
      ```bash
      psql -U SEU_USUARIO_POSTGRES -d NOME_DO_SEU_BANCO -f src/database/create_tables.sql
      ```

### Rodando o Servidor Backend

- **Modo de Desenvolvimento (com hot-reloading):**

  ```bash
  npm run dev
  # OU
  # yarn dev
  ```

  _(Este comando geralmente utiliza `ts-node-dev` ou `nodemon` com `ts-node`)_

- **Build para Produção:**
  ```bash
  npm run build
  ```
- **Rodar em Produção (após o build):**
  ```bash
  npm start
  ```

### Estrutura de Pastas do Backend (Sugestão)
