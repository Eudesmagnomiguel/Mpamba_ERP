import React, { useState, useEffect } from 'react';
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
import { useUpdateUser } from '@/hooks/core/useUser';
import { useRolesByModule } from '@/hooks/core/useRole';

interface EditUserModalProps {
	isOpen: boolean;
	onClose: () => void;
	user: any;
}

export function EditUserModal({ isOpen, onClose, user }: EditUserModalProps) {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		roleId: '',
		isActive: 'true'
	});

	const { data: rolesData, isLoading: isLoadingRoles } = useRolesByModule('stock');
	const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();

	const roles = Array.isArray(rolesData) ? rolesData : (rolesData?.data || []);

	useEffect(() => {
		if (user) {
			const role = user.roles && user.roles.length > 0 ? user.roles[0].roleId : '';
			setFormData({
				name: user.name,
				email: user.email,
				password: '',
				roleId: role,
				isActive: String(Boolean(user.isActive))
			});
		}
	}, [user]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) return;
		if (!formData.name || !formData.email) {
			toast.error('Preencha os campos obrigatórios.');
			return;
		}

		const data: any = {
			name: formData.name,
			email: formData.email,
			isActive: formData.isActive === 'true',
		};
		if (formData.password) data.password = formData.password;
		if (formData.roleId) data.roleIds = [formData.roleId];

		updateUser({ id: user.id, data }, {
			onSuccess: () => {
				toast.success('Utilizador atualizado com sucesso.');
				onClose();
			},
			onError: (err: any) => {
				toast.error(err.response?.data?.message || 'Erro ao atualizar utilizador.');
			}
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="rounded-sm sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Editar Utilizador</DialogTitle>
					<DialogDescription>
						Atualize os dados e acessos deste utilizador.
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
						label="Nova Senha (opcional)"
						type="password"
						placeholder="Deixe em branco para manter a atual"
						value={formData.password}
						onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
								<SelectItem value="none">Nenhum papel</SelectItem>
								{isLoadingRoles ? (
									<SelectItem value="loading" disabled>Carregando...</SelectItem>
								) : roles.map((r: any) => (
									<SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
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
						<Button type="submit" disabled={isUpdating} className="bg-primary text-white hover:bg-primary rounded-sm gap-2">
							{isUpdating ? <Loader2 size={16} className="animate-spin" /> : null}
							Guardar Alterações
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
