import redis from '../src/config/redis.config.js';

redis.on('error', (err) => {
    console.error('❌ Erro no Redis Client:', err);
});

async function testRedisConnection() {
    try {
        await redis.connect();
        console.log('✅ Conexão com Redis estabelecida com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao conectar ao Redis:', error);
        process.exit(1);
    } finally {
        await redis.quit();
    }
}

testRedisConnection();
