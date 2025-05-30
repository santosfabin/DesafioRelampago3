# Assistente de Manutenção de Ativos

## Como Executar o Projeto (Desenvolvimento)

Para rodar este projeto em ambiente de desenvolvimento e testar a API com o Postman, siga os passos abaixo:

**Pré-requisitos Essenciais:**

- **Node.js e npm/yarn:** Conforme especificado na seção "Pré-requisitos (Backend)" mais abaixo.
- **PostgreSQL:** Instalado, rodando e acessível.
- **Postman (ou similar):** Ferramenta essencial para interagir e testar os endpoints da API backend.

**Passos de Configuração e Execução:**

1.  **Clonar o Repositório (se ainda não o fez):**

    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    cd <NOME_DA_PASTA_DO_PROJETO>
    ```

2.  **Instalar Dependências (Backend e Frontend):**
    É crucial instalar as dependências em ambas as pastas do projeto. Execute os seguintes comandos:

    ```bash
    # Na pasta backend
    cd backend
    npm install
    # ou yarn install
    ```

    ```bash
    # Na pasta frontend (a partir da raiz do projeto)
    cd ../frontend
    npm install
    # ou yarn install
    ```

3.  **Configurar o Backend e Banco de Dados:**
    a. Volte para a pasta do backend:
    `bash
    cd ../backend # Se você estava na pasta frontend
    `
    b. **Variáveis de Ambiente (`.env`):**
    Crie um arquivo `.env` na raiz da pasta `backend/`. Você pode se basear em um arquivo `backend/.env.example` (se fornecido). Este arquivo é crucial para a conexão com o banco de dados e para a segurança da sessão, que o Postman utilizará indiretamente ao testar endpoints autenticados.
    Exemplo de conteúdo para `backend/.env`:
    `env
    PORT=3001
    DB_USER=seu_usuario_postgres
    DB_HOST=localhost
    DB_NAME=asset_maintenance_db
    DB_PASSWORD=sua_senha_postgres
    DB_PORT=5432
    SESSION_SECRET=coloque_aqui_uma_chave_secreta_bem_forte_e_longa # Importante para segurança da sessão
    ` \* **Acesso para o Postman:** O Postman interagirá com a API na URL baseada na `PORT` (ex: `http://localhost:3001`). A `SESSION_SECRET` é usada pelo backend para assinar os cookies de sessão. O Postman armazenará e enviará esses cookies automaticamente após o login, permitindo testar rotas protegidas. Não há uma configuração "direta" para o Postman no `.env`, mas garantir que o `SESSION_SECRET` esteja configurado é vital para que a autenticação (testada via Postman) funcione.

    c. **Configuração do Banco de Dados PostgreSQL:** - Certifique-se de que o usuário (`DB_USER`), senha (`DB_PASSWORD`) e o banco de dados (`DB_NAME`) especificados no `.env` existam e estejam corretamente configurados no seu PostgreSQL. - Execute o script SQL para criar as tabelas necessárias. Assumindo que o script está em `backend/src/database/create_tables.sql`:
    `bash
        psql -U SEU_USUARIO_POSTGRES_ADMIN -d NOME_DO_SEU_BANCO_DE_DADOS -f src/database/create_tables.sql
        `
    (Substitua `SEU_USUARIO_POSTGRES_ADMIN` e `NOME_DO_SEU_BANCO_DE_DADOS` pelos seus dados de acesso ao PostgreSQL com permissões para criar tabelas e o nome do banco de dados que você definiu em `DB_NAME`).

4.  **Build do Frontend:**
    Para este fluxo de desenvolvimento específico, vamos gerar a build do frontend. Navegue até a pasta do frontend e execute:

    ```bash
    # Se você estava na pasta backend:
    cd ../frontend
    # Se estava na raiz do projeto:
    # cd frontend

    npm run build
    ```

    Isso irá gerar os arquivos estáticos da aplicação React na pasta `frontend/build` (ou `frontend/dist`, dependendo da configuração).

5.  **Rodar o Servidor Backend (Modo de Desenvolvimento):**
    Agora, com o frontend "buildado" e o backend configurado, inicie o servidor backend:

    ```bash
    # Se você estava na pasta frontend:
    cd ../backend
    # Se estava na raiz do projeto:
    # cd backend

    npm run dev
    ```

    Este comando geralmente utiliza `ts-node-dev` ou `nodemon` com `ts-node` para iniciar o servidor com hot-reloading. O backend estará acessível (por padrão) em `http://localhost:3001`.

    Agora você pode usar o **Postman** para enviar requisições para os endpoints da sua API backend (ex: `POST http://localhost:3001/api/auth/login`, `GET http://localhost:3001/api/assets`, etc.) e testar todas as funcionalidades.

---

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
