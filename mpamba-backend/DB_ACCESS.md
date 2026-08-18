# Dados de acesso à base de dados (ambiente local)

Credenciais do Postgres a correr via Docker (`postgres_db`), definidas em `.env`.

| Campo         | Valor                 |
|---------------|-----------------------|
| Host          | `localhost`           |
| Porta         | `5432`                |
| Utilizador    | `mpamba`              |
| Password      | `mpamba_dev_password` |
| Base de dados | `mpamba_db`           |

**Connection string (DATABASE_URL):**
```
postgresql://mpamba:mpamba_dev_password@localhost:5432/mpamba_db?schema=public
```

> Estas credenciais são apenas para desenvolvimento local. Não usar em staging/produção nem partilhar publicamente.

## Redis

| Campo    | Valor       |
|----------|-------------|
| Host     | `localhost` |
| Porta    | `6379`      |
| Password | (vazio)     |

---

## Como aceder aos dados

### 1. Prisma Studio (interface visual, recomendado)
```bash
npx prisma studio
```
Abre em `http://localhost:5555`. Permite ver, inserir, editar e apagar registos sem escrever SQL.

### 2. `psql` dentro do container Docker
```bash
docker exec -it postgres_db psql -U mpamba -d mpamba_db
```
Comandos úteis dentro do `psql`:
```sql
\dt                          -- lista as tabelas
\d "NomeDaTabela"            -- descreve uma tabela
SELECT * FROM "User" LIMIT 10;
\q                            -- sair
```

### 3. Cliente gráfico externo (DBeaver, TablePlus, pgAdmin, Beekeeper Studio, etc.)
Usar os dados de acesso da tabela acima (host `localhost`, porta `5432`).

Ver também [DOCKER_SETUP.md](./DOCKER_SETUP.md) para instruções de como subir os containers e aplicar as migrações.
