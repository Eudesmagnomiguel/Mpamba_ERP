import ENV from "./env.utils.js";

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://mpamba-cyan.vercel.app',
    'https://mpamba.vercel.app',
    // Adicionar outros domínios de produção aqui
];

export const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) {
            if (ENV.NODE_ENV === 'development') {
                return callback(null, true);
            }
            return callback(new Error('Origem não permitida pelo CORS'));
        }

        if (allowedOrigins.includes(origin) || ENV.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Origem não permitida pelo CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Organization-Id'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400, // 24 horas
};

export default corsOptions;