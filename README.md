# Mpamba

Este projeto é composto por dois módulos principais: o frontend e o backend.

## Estrutura do Projeto

- **[mpamba-frontend](mpamba-frontend/)**: Frontend desenvolvido em Next.js.
- **[mpamba-backend](mpamba-backend/)**: Backend/API desenvolvido em Node.js com Express, TypeScript, Prisma (PostgreSQL) e Redis.

## Como Executar

### Frontend
1. Acesse o diretório `mpamba-frontend`.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

### Backend
1. Acesse o diretório `mpamba-backend`.
2. Configure o arquivo `.env` com base no `.env.example`.
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Inicie os serviços de banco de dados e cache (opcional via Docker):
   ```bash
   docker compose up -d
   ```
5. Execute as migrações do Prisma:
   ```bash
   npm run db:migrate
   ```
6. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
