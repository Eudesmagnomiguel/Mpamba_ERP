import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';
import rateLimit from 'express-rate-limit';

// Extrai o IP real do cliente (considerando proxies)
function getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];

    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0]!.trim();
    }

    return req.ip || req.socket?.remoteAddress || '0.0.0.0';
}

// Rate limit global - requests por IP
export const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por 15 minutos
    message: {
        status: 'error',
        message: 'Too many requests. Please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => getClientIp(req),
});

// Rate limit para autenticação - mais restritivo
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas por 15 minutos
    message: {
        status: 'error',
        message: 'Demasiadas tentativas a partir deste dispositivo. Tente novamente dentro de 15 minutos.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Não contar requests bem-sucedidos
    // Uma falha nossa (base de dados em baixo → 503) não é tentativa inválida do
    // utilizador. Tratamos 5xx como "bem-sucedido" para que não conte na quota,
    // senão uma indisponibilidade da BD bloqueia o IP por 15 minutos.
    requestWasSuccessful: (_req, res) => res.statusCode < 400 || res.statusCode >= 500,
    keyGenerator: (req: Request) => getClientIp(req),
});

// Rate limit para criação de recursos
export const createResourceLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 30, // 30 criações por minuto
    message: {
        status: 'error',
        message: 'Limite de criação de recursos atingido.',
        retryAfter: '1 minuto'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Gera um ID único para token JWT (previne replay attacks)
export function generateJti(): string {
    return uuidv4();
}

// Valida força do segredo JWT
export function validateJwtSecret(secret: string): boolean {
    if (!secret || secret.length < 32) {
        console.warn('⚠️  JWT_SECRET must be at least 32 characters long for adequate security');
        return false;
    }
    return true;
}

export default {
    globalRateLimiter,
    authRateLimiter,
    generateJti,
    validateJwtSecret
};