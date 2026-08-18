import 'dotenv/config';
import { createClient } from 'redis';
import type { RedisClientOptions } from 'redis';

const redisConfig: RedisClientOptions = {
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    password: process.env.REDIS_PASSWORD || undefined,
};

export const redis = createClient(redisConfig);

// Conectar automaticamente ao Redis
// redis.connect().catch((error) => {
//     console.error('❌ Erro ao conectar ao Redis:', error);
//     console.warn('⚠️  Cache desabilitado. Requisições continuarão funcionando sem cache.');
// });

// Tratadores de eventos
// redis.on('connect', () => {
//     console.log('✅ Conectado ao Redis com sucesso');
// });

// redis.on('error', (error) => {
//     console.error('❌ Erro no Redis:', error);
// });

// redis.on('disconnect', () => {
//     console.warn('⚠️  Desconectado do Redis');
// });

export default redis;
