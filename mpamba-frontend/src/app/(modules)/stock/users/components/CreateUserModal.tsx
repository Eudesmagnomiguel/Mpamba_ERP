import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Input from '@/components/common/forms/Input';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useCreateUser } from '@/hooks/core/useUser';
import { useRolesByModule } from '@/hooks/core/useRole';

interface CreateUserModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		roleId: '',
		isActive: 'true'
	});

	const { data: rolesData, isLoading: isLoadingRoles } = useRolesByModule('stock');

	const { mutate: createUser, isPending: isCreating } = useCreateUser();

	const roles = Array.isArray(rolesData) ? rolesData : (rolesData?.data || []);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name || !formData.email || !formData.password) {
			toast.error('Preencha os campos obrigatórios.');
			return;
		}

		const data: any = {
			name: formData.name,
			email: formData.email,
			password: formData.password,
			isActive: formData.isActive === 'true',
		};
		if (formData.roleId) data.roleIds = [formData.roleId];

		createUser(data, {
			onSuccess: () => {
				toast.success('Utilizador criado com sucesso.');
				setFormData({ name: '', email: '', password: '', roleId: '', isActive: 'true' });
				onClose();
			},
			onError: (err: any) => {
				toast.error(err.response?.data?.message || 'Erro ao criar utilizador.');
			}
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="rounded-sm sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Adicionar Utilizador</DialogTitle>
					<DialogDescription>
						Crie um novo utilizador e atribua-lhe permissões no stock.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 py-4">
					<Input
						label="Nome"
						placeholder="Nome do utilizador"
						value={formData.name}
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						required
						className="rounded-sm"
					/>
					<Input
						label="Email"
						type="email"
						placeholder="Email do utilizador"
						value={formData.email}
						onChange={(e) => setFormData({ ...formData, email: e.target.value })}
						required
						className="rounded-sm"
					/>
					<Input
						label="Senha"
						type="password"
						placeholder="Senha (mín. 6 caracteres)"
						value={formData.password}
						onChange={(e) => setFormData({ ...formData, password: e.target.value })}
						required
						className="rounded-sm"
						showPasswordToggle
					/>
					<div className="space-y-1.5">
						<label className="block text-xs font-bold text-foreground">Papel (Role)</label>
						<Select value={formData.roleId} onValueChange={(val) => setFormData({ ...formData, roleId: val })}>
							<SelectTrigger className="w-full rounded-sm border-2 bg-slate-50 px-4 text-sm font-medium text-foreground">
								<SelectValue placeholder="Selecione um papel" />
							</SelectTrigger>
							<SelectContent className="rounded-sm">
								{isLoadingRoles ? (
									<SelectItem value="loading" disabled>Carregando...</SelectItem>
								) : roles.map((role: any) => (
									<SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<label className="block text-xs font-bold text-foreground">Estado</label>
						<Select value={formData.isActive} onValueChange={(val) => setFormData({ ...formData, isActive: val })}>
							<SelectTrigger className="w-full rounded-sm border-2 bg-slate-50 px-4 text-sm font-medium text-foreground">
								<SelectValue placeholder="Selecione o estado" />
							</SelectTrigger>
							<SelectContent className="rounded-sm">
								<SelectItem value="true">Ativo</SelectItem>
								<SelectItem value="false">Inativo</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<DialogFooter className="mt-6">
						<Button type="submit" disabled={isCreating} className="bg-primary text-white hover:bg-primary rounded-sm gap-2">
							{isCreating ? <Loader2 size={16} className="animate-spin" /> : null}
							Criar Utilizador
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
