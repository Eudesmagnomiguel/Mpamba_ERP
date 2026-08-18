/**
 * @fileoverview Utilitários de cache com Redis
 * @description Gerencia operações de cache no Redis
 */

import { redis } from '../../config/redis.config.js';

interface CacheOptions {
    ttl?: number; // Time to live em segundos (padrão: 300s)
    prefix?: string;
}

export class CacheUtils {
    private static readonly DEFAULT_TTL = 300;
    private static readonly DEFAULT_PREFIX = 'cache:';

    private static isRedisConnected(): boolean {
        return redis.isOpen;
    }

    static async get<T>(key: string, prefix?: string): Promise<T | null> {
        try {
            if (!this.isRedisConnected()) {
                return null;
            }
            const prefixedKey = `${prefix || this.DEFAULT_PREFIX}${key}`;
            const value = await redis.get(prefixedKey);
            return value ? JSON.parse(value) as T : null;
        } catch (error) {
            console.error(`[Cache] Erro ao obter ${key}:`, error);
            return null;
        }
    }

    static async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
        try {
            if (!this.isRedisConnected()) {
                return false;
            }
            const ttl = options?.ttl || this.DEFAULT_TTL;
            const prefix = options?.prefix || this.DEFAULT_PREFIX;
            const prefixedKey = `${prefix}${key}`;
            await redis.setEx(prefixedKey, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`[Cache] Erro ao definir ${key}:`, error);
            return false;
        }
    }

    static async delete(key: string, prefix?: string): Promise<boolean> {
        try {
            if (!this.isRedisConnected()) {
                return false;
            }
            const prefixedKey = `${prefix || this.DEFAULT_PREFIX}${key}`;
            const result = await redis.del(prefixedKey);
            return result > 0;
        } catch (error) {
            console.error(`[Cache] Erro ao deletar ${key}:`, error);
            return false;
        }
    }

    static async clearByPrefix(prefix: string): Promise<boolean> {
        try {
            if (!this.isRedisConnected()) {
                return false;
            }
            const keys = await redis.keys(`${prefix}*`);
            if (keys.length === 0) return true;
            await redis.del(keys);
            return true;
        } catch (error) {
            console.error(`[Cache] Erro ao limpar ${prefix}:`, error);
            return false;
        }
    }
}

export default CacheUtils;
