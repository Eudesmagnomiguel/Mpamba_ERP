import { describe, it, expect } from 'vitest';

// Vitest descobre automaticamente todos os arquivos *.test.ts do diretório /test.
// Este arquivo serve apenas como ponto de entrada para validar o ambiente de testes.

describe('Suíte de Testes Unitários - Mpamba Backend', () => {
    it('deve carregar o ambiente de testes com sucesso', () => {
        expect(true).toBe(true);
    });
});
