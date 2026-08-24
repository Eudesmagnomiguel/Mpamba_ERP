/**
 * @fileoverview Ponto de entrada para ambiente serverless (Vercel)
 * @description Ao contrário de src/server.ts, não abre porta nem agenda
 * temporizadores: a plataforma invoca o app a cada pedido. As verificações
 * periódicas de alertas passam pela rota /api/cron/alerts (Vercel Cron).
 */

import app from '../src/app.js';
import { IntegrationService } from '../src/services/module/integration.service.js';

// Registar os handlers do EventBus. Corre a cada cold start; o init() é
// idempotente, logo instâncias reaproveitadas não duplicam subscrições.
IntegrationService.init();

export default app;
