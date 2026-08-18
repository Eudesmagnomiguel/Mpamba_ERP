/**
 * @fileoverview Middleware de cache
 * @description Middleware para cachear requisições GET
 */

import type { Request, Response, NextFunction } from 'express';
import { CacheUtils } from '../shared/utils/cache.utils.js';

interface CachedResponse {
    statusCode: number;
    body: any;
    timestamp: number;
}

export const cacheMiddleware = (ttl: number = 300, prefix: string = 'cache:') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Apenas cachear GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const scope = req.user ? `${req.user.organizationId ?? 'global'}:` : '';
        const cacheKey = `${prefix}${scope}${req.originalUrl}`;

        try {
            // Verificar cache
            const cachedData = await CacheUtils.get<CachedResponse>(cacheKey, '');
            if (cachedData) {
                return res.status(cachedData.statusCode).json(cachedData.body);
            }

            // Interceptar response para cachear
            const originalJson = res.json.bind(res);
            res.json = function(body: any) {
                const cachedResponse: CachedResponse = {
                    statusCode: res.statusCode,
                    body,
                    timestamp: Date.now()
                };
                CacheUtils.set(cacheKey, cachedResponse, { ttl, prefix: '' }).catch(console.error);
                return originalJson(body);
            };

            next();
        } catch (error) {
            console.error('[Cache Middleware] Erro:', error);
            next();
        }
    };
};

/**
 * Middleware para limpar cache após modificações
 */
export const clearCacheMiddleware = (prefix: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const originalSend = res.send.bind(res);
        let cacheCleared = false;

        const clearCacheOnce = async () => {
            if (cacheCleared) return;
            cacheCleared = true;
            await CacheUtils.clearByPrefix(prefix);
        };

        res.send = function(data: any) {
            // Se a requisição foi bem-sucedida (2xx), limpar cache
            if (res.statusCode >= 200 && res.statusCode < 300) {
                clearCacheOnce()
                    .catch(console.error)
                    .finally(() => originalSend(data));
                return res;
            }
            return originalSend(data);
        };

        next();
    };
};

export default cacheMiddleware;
