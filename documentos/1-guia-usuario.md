# Guia do Usuário e Configuração do Ambiente

Este guia descreve os passos necessários para configurar o ambiente de desenvolvimento, instalar as dependências, configurar as variáveis de ambiente e rodar o sistema **Mpamba** localmente.

---

## 🛠️ Pré-requisitos

Antes de iniciar, certifique-se de ter instalado na sua máquina:
1. **Node.js** (versão 18.x ou superior recomendada).
2. **NPM** (geralmente instalado junto ao Node.js).
3. **PostgreSQL** (Banco de dados relacional).
4. **Redis** (Servidor de cache e filas).
5. **Docker** (Opcional, porém altamente recomendado para subir o Postgres e o Redis rapidamente).

---

## 🚀 Passo a Passo de Instalação e Execução

O projeto está dividido em dois módulos independentes na raiz: `mpamba-frontend` e `mpamba-backend`. Você deve configurar ambos.

---

### Módulo 1: Backend (`mpamba-backend`)

#### 1. Instalar as Dependências
Abra o terminal no diretório do backend e execute:
```bash
cd mpamba-backend
npm install
```

#### 2. Configurar o arquivo `.env`
Duplique o arquivo `.env.example` na pasta raiz do backend e renomeie-o para `.env`:
* No Windows (PowerShell):
  ```powershell
  copy .env.example .env
  ```
* No Linux/macOS:
  ```bash
  cp .env.example .env
  ```

Edite o arquivo `.env` recém-criado e preencha as variáveis de ambiente conforme os parâmetros necessários:
* **`PORT`**: Porta em que o backend rodará (ex: `4000`).
* **`DATABASE_URL`**: String de conexão com seu banco PostgreSQL.
  * *Exemplo*: `"postgresql://usuario:senha@localhost:5432/mpamba_db?schema=public"`
* **`REDIS_HOST` e `REDIS_PORT`**: Endereço e porta do seu Redis (padrão: `localhost` e `6379`).
* **`JWT_SECRET` e `JWT_REFRESH_SECRET`**: Chaves seguras para geração de tokens de sessão.
* **Configurações de E-mail (SMTP)**: Necessárias para envio de faturas e notificações.

#### 3. Subir os Serviços Locais (Opcional via Docker)
Se você possui Docker instalado, pode inicializar o PostgreSQL e o Redis usando o arquivo de compose existente:
```bash
npm run docker:up
```

#### 4. Executar Migrações do Banco de Dados (Prisma)
Para criar as tabelas no banco de dados com base no esquema definido:
```bash
npm run db:migrate
```

#### 5. Executar o Seeding do Banco (Opcional)
Se desejar popular o banco de dados com planos, permissões e dados iniciais padrões:
```bash
npm run seed
```

#### 6. Iniciar o Backend
Para executar o backend em modo de desenvolvimento com hot-reload (recarregamento automático):
```bash
npm run dev
```
O backend estará acessível em `http://localhost:4000` (ou na porta definida na sua variável `PORT`).
A documentação Swagger estará disponível em `http://localhost:4000/docs`.

---

### Módulo 2: Frontend (`mpamba-frontend`)

#### 1. Instalar as Dependências
Abra outro terminal no diretório do frontend e execute:
```bash
cd mpamba-frontend
npm install
```

#### 2. Configurar as Variáveis de Ambiente
Crie um arquivo chamado `.env.local` na pasta do frontend:
* Adicione a URL base da API do backend:
  ```env
  NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
  ```

#### 3. Iniciar o Frontend
Para rodar o servidor de desenvolvimento do Next.js:
```bash
npm run dev
```
O frontend estará acessível em `http://localhost:3000`.

---

## 👥 Acesso de Suporte
Se precisar de ajuda ou suporte técnico complementar para execução do sistema, o contacto do desenvolvedor ou suporte do sistema pode ser efetuado através do WhatsApp informado no arquivo `.env` (variável `WHATSAPP_NUMBER`).
