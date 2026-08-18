# Guia de Deploy (Hospedagem em Produção)

Este guia descreve como colocar o sistema **Mpamba** em produção: backend (Express + Prisma + PostgreSQL + Redis) no **Railway** e frontend (Next.js) na **Vercel**.

---

## 🧭 Visão Geral da Arquitetura de Deploy

| Componente | Onde hospedar | Motivo |
|---|---|---|
| Backend (Express/Prisma) | **Railway** | Roda como servidor Node persistente — evita problemas de cold start e esgotamento de conexões que ocorrem em ambientes serverless. |
| PostgreSQL | **Railway** (plugin gerido) | Já modelado como serviço separado no `docker-compose.yml`; mapeia diretamente para um serviço gerido do Railway. |
| Redis | **Railway** (plugin gerido) | Mesmo motivo do Postgres — conexão persistente, sem necessidade de adaptar o código. |
| Frontend (Next.js) | **Vercel** | Deploy otimizado para Next.js, CDN global, integração automática com Git. |

> ⚠️ Não recomendado: hospedar o backend na Vercel. Funções serverless têm timeout curto (10s no free tier) e não sustentam conexões persistentes com Prisma/Redis.

---

## 🚂 Parte 1 — Backend + Banco de Dados no Railway

### 1. Criar conta e projeto
1. Acesse [railway.app](https://railway.app) e crie uma conta (pode entrar com GitHub).
2. Clique em **New Project**.

### 2. Adicionar o PostgreSQL
1. Dentro do projeto, clique em **New** → **Database** → **Add PostgreSQL**.
2. O Railway cria automaticamente a variável `DATABASE_URL` para esse serviço.

### 3. Adicionar o Redis
1. Clique em **New** → **Database** → **Add Redis**.
2. O Railway cria automaticamente as variáveis de conexão do Redis (ex: `REDIS_URL`, `REDISHOST`, `REDISPORT`, `REDISPASSWORD`).

> Nota: o projeto usa `REDIS_HOST`, `REDIS_PORT` e `REDIS_PASSWORD` separados (ver `mpamba-backend/redis.config.ts`). Se o Railway expuser apenas `REDIS_URL`, será preciso mapear manualmente as variáveis (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`) a partir dela, ou ajustar `redis.config.ts` para aceitar uma única `REDIS_URL`.

### 4. Adicionar o serviço do Backend
1. Clique em **New** → **GitHub Repo** e selecione o repositório do Mpamba.
2. Em **Settings** do serviço criado:
   - **Root Directory**: `mpamba-backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`

### 5. Configurar variáveis de ambiente do Backend
Em **Variables**, adicione (usando os valores gerados pelos plugins do Postgres/Redis quando possível):

```
PORT=4000
NODE_ENV=production

DATABASE_URL=${{Postgres.DATABASE_URL}}

REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}

JWT_SECRET=<gerar uma string aleatória forte>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<gerar outra string aleatória forte>
JWT_REFRESH_EXPIRES_IN=30m

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<email de envio>
EMAIL_PASS=<senha ou app password>

RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX=100

WHATSAPP_NUMBER=<numero de suporte>
```

> As referências `${{Postgres.DATABASE_URL}}` e `${{Redis.REDISHOST}}` são a sintaxe do Railway para referenciar variáveis de outro serviço do mesmo projeto — ele preenche automaticamente ao vincular os serviços.

### 6. Rodar as migrações do Prisma em produção
Após o primeiro deploy, rode as migrações contra o banco de produção. Opções:
- Usar o terminal do Railway (**Settings** → **Deploy Logs** → aba de shell, se disponível), ou
- Rodar localmente apontando para o `DATABASE_URL` de produção:
  ```bash
  cd mpamba-backend
  DATABASE_URL="<url_de_producao>" npm run db:migrate
  ```

### 7. (Opcional) Popular dados iniciais
```bash
DATABASE_URL="<url_de_producao>" npm run seed
```

### 8. Gerar domínio público
1. No serviço do backend, vá em **Settings** → **Networking** → **Generate Domain**.
2. Anote a URL gerada (ex: `https://mpamba-backend.up.railway.app`) — será usada no frontend.

---

## ▲ Parte 2 — Frontend no Vercel

### 1. Importar o projeto
1. Acesse [vercel.com](https://vercel.com) e crie uma conta.
2. Clique em **Add New** → **Project** e selecione o repositório do Mpamba.
3. Em **Root Directory**, selecione `mpamba-frontend`.

### 2. Configurar variáveis de ambiente
Em **Settings** → **Environment Variables**, adicione:

```
NEXT_PUBLIC_API_BASE_URL=https://mpamba-backend.up.railway.app/api
```

### 3. Deploy
Clique em **Deploy**. A Vercel detecta automaticamente o Next.js e usa `npm run build` / `npm run start` por padrão.

### 4. Deploys automáticos
Por padrão, qualquer push na branch principal do repositório dispara um novo deploy automaticamente, tanto na Vercel quanto no Railway (se configurado com "Auto Deploy" ativo).

---

## ✅ Checklist final

- [ ] Postgres e Redis criados no Railway e vinculados ao serviço do backend.
- [ ] Variáveis de ambiente do backend configuradas (JWT, SMTP, rate limit).
- [ ] Migrações do Prisma executadas contra o banco de produção.
- [ ] Seed executado (se necessário para planos/permissões iniciais).
- [ ] Domínio público do backend gerado e testado (`/docs` deve abrir o Swagger).
- [ ] `NEXT_PUBLIC_API_BASE_URL` do frontend apontando para o domínio do backend.
- [ ] CORS no backend (`mpamba-backend/src/app.ts`) liberado para o domínio da Vercel.

---

## 🔒 Notas de Segurança

- Nunca reutilizar os segredos (`JWT_SECRET`, `JWT_REFRESH_SECRET`) do ambiente local em produção — gerar novos valores aleatórios.
- Não commitar o `.env` de produção no repositório.
- Restringir CORS no backend apenas ao domínio real do frontend em produção, evitando `*` ou `localhost`.
