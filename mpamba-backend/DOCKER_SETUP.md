# Como subir o Docker e correr as migrações SQL (Prisma)

Guia manual para preparar o ambiente local do `mpamba-backend`: subir os containers (Postgres + Redis) e aplicar o schema da base de dados.

## Pré-requisitos

- Docker Desktop instalado e a correr (ícone da baleia ativo na barra de tarefas).
- Node.js e dependências instaladas: `npm install` na pasta `mpamba-backend`.
- Ficheiro `.env` presente na raiz do projeto (já existe neste repo) com as variáveis:
  - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
  - `DATABASE_URL`
  - `REDIS_HOST`, `REDIS_PORT`

## 1. Subir os containers (Postgres + Redis)

Na pasta `mpamba-backend`, correr:

```bash
docker compose up -d
```

ou, usando o script já definido no `package.json`:

```bash
npm run docker:up
```

Isto lê o `docker-compose.yml` e cria dois containers:

| Serviço  | Imagem       | Container      | Porta |
|----------|--------------|----------------|-------|
| postgres | postgres:15  | postgres_db    | 5432  |
| redis    | redis:7      | redis_cache    | 6379  |

**Na primeira vez**, o Docker precisa de fazer *pull* das imagens `postgres:15` e `redis:7`, o que pode demorar alguns minutos dependendo da rede.

### Verificar se subiu corretamente

```bash
docker compose ps
```

Devem aparecer `postgres_db` e `redis_cache` com estado `Up`/`running`.

```bash
npm run docker:logs
```

para acompanhar os logs em tempo real (Ctrl+C para sair, isto não pára os containers).

## 2. Aplicar as migrações SQL (Prisma)

Com os containers a correr, aplicar as migrações existentes em `prisma/migrations`:

```bash
npx prisma migrate deploy
```

ou:

```bash
npm run db:migrate
```

Isto aplica todas as migrações pendentes contra a base de dados definida em `DATABASE_URL` no `.env`.

> Nota: `prisma migrate deploy` **não** cria novas migrações — usa-se em ambientes já existentes (staging/produção/dev com schema já definido). Para criar uma nova migração a partir de alterações no `schema.prisma`, usar `npx prisma migrate dev --name <nome>` (não incluído nos scripts do `package.json`, correr diretamente).

## 3. (Opcional) Popular a base de dados com dados de teste

```bash
npm run seed
```

## 4. Testar a ligação

```bash
npm run test:db      # testa a ligação ao Postgres
npm run test:redis   # testa a ligação ao Redis
```

## 5. Arrancar a aplicação

```bash
npm run dev
```

---

## Comandos úteis (docker)

| Comando                  | Ação                                              |
|---------------------------|---------------------------------------------------|
| `npm run docker:up`       | Sobe os containers em background (`-d`)           |
| `npm run docker:down`     | Pára e remove os containers                       |
| `npm run docker:rebuild`  | `docker:down` + `docker:up`                       |
| `npm run docker:logs`     | Segue os logs dos containers                      |
| `npm run docker:ps`       | Lista o estado dos containers                     |

---

## Resolução de problemas

### Erro ao fazer `docker compose up`: "no such host" / falha a resolver `registry-1.docker.io`

```
Error failed to resolve reference "docker.io/library/redis:7": ...
dial tcp: lookup registry-1.docker.io: no such host
```

Isto é um **problema de DNS/rede do Docker Desktop**, não do projeto. Normalmente é transitório (VPN, rede corporativa, ou o Docker Desktop ainda a inicializar a rede). Passos para resolver:

1. Confirmar que o Docker Desktop está mesmo a correr (não só o ícone, mas `docker ps` responde sem erro).
2. Tentar novamente passado 1-2 minutos: `docker compose up -d`.
3. Testar a resolução DNS diretamente:
   ```bash
   docker run --rm busybox nslookup registry-1.docker.io
   ```
   Se isto funcionar mas o `docker compose up` continuar a falhar, tentar `docker compose down` seguido de `docker compose up -d` outra vez.
4. Se estiver numa VPN corporativa, experimentar desligar/religar a VPN, ou verificar se o Docker Desktop tem um proxy HTTP/HTTPS mal configurado em **Settings → Resources → Proxies**.
5. Reiniciar o Docker Desktop (clique direito no ícone → Restart) costuma resolver problemas de rede internos do Docker.

### Porta 5432 ou 6379 já em uso

Se já tiveres um Postgres/Redis local a correr fora do Docker nessas portas, o `docker compose up` falha ao mapear a porta. Parar o serviço local ou mudar a porta no `docker-compose.yml` (e ajustar `DATABASE_URL`/`REDIS_PORT` no `.env` em conformidade).

### `prisma migrate deploy` falha a ligar à base de dados

- Confirmar que o container `postgres_db` está `Up` (`docker compose ps`).
- Confirmar que `DATABASE_URL` no `.env` aponta para `localhost:5432` e usa o mesmo user/password/db definidos em `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB`.
- Esperar alguns segundos após o `docker compose up -d` — o Postgres demora um pouco a aceitar ligações na primeira vez que o volume é criado.
