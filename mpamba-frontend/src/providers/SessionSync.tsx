'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import authService from '@/services/core/auth.services';
import { useAuthStore } from '@/store/auth.store';

/**
 * Mantém o utilizador guardado no cliente alinhado com o servidor.
 *
 * Os módulos e as permissões são resolvidos no servidor e só chegavam ao
 * cliente na resposta do login. Quando o backoffice altera a subscrição de uma
 * empresa, a sessão já aberta continuava com a lista antiga até o utilizador
 * sair e voltar a entrar. Aqui refrescamos o perfil ao abrir a aplicação e
 * sempre que a janela volta a ganhar foco.
 */
export function SessionSync() {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const updateUser = useAuthStore((state) => state.updateUser);

	const { data } = useQuery({
		queryKey: ['auth-profile'],
		queryFn: () => authService.me(),
		enabled: isAuthenticated,
		// O default global é `false`; aqui interessa mesmo revalidar ao voltar
		// à janela, que é quando o utilizador reage a uma mudança de plano.
		refetchOnWindowFocus: true,
		staleTime: 30 * 1000,
	});

	useEffect(() => {
		if (data) {
			updateUser(data);
		}
	}, [data, updateUser]);

	return null;
}
