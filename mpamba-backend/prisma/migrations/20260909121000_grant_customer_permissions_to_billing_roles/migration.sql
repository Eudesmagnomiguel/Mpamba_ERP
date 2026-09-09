-- As rotas de clientes passaram a exigir as permissoes customer:* em vez das de
-- faturacao (ver src/routes/module/billing/customer.routes.ts). Os perfis
-- pre-configurados ja concediam customer:*, mas um papel criado antes disso --
-- ou um papel personalizado -- pode ter apenas as permissoes de faturacao com
-- que a gestao de clientes funcionava ate aqui.
--
-- Para que ninguem perca acesso que ja tinha, concede-se a permissao customer:*
-- a todo o papel que tenha a permissao de faturacao equivalente.
-- Nao remove nada e e idempotente (ON CONFLICT DO NOTHING).

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT rp."roleId", target.id
FROM "RolePermission" rp
JOIN "Permission" source ON source.id = rp."permissionId"
JOIN "Permission" target ON target.code = (
  CASE source.code
    WHEN 'invoice:view'   THEN 'customer:view'
    WHEN 'invoice:create' THEN 'customer:create'
    WHEN 'invoice:update' THEN 'customer:update'
    WHEN 'invoice:cancel' THEN 'customer:delete'
  END
)
WHERE source.code IN ('invoice:view', 'invoice:create', 'invoice:update', 'invoice:cancel')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
