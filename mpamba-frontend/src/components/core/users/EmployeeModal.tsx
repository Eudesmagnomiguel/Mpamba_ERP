'use client';

import React, { useEffect, useState } from 'react';
import { Package, Receipt, Wallet, BookOpen, Loader2 } from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { useRoles } from '@/hooks/core/useRole';
import { useCreateUser, useUpdateUser } from '@/hooks/core/useUser';
import { User } from '@/shared/types/models';

interface EmployeeModalProps {
	isOpen: boolean;
	onClose: () => void;
	employee?: User | null;
}

const MODULE_META: Record<string, { label: string; icon: React.ElementType }> = {
	faturacao: { label: 'Faturação', icon: Receipt },
	stock: { label: 'Stock', icon: Package },
	tesouraria: { label: 'Tesouraria', icon: Wallet },
	contabilidade: { label: 'Contabilidade', icon: BookOpen },
};

export default function EmployeeModal({ isOpen, onClose, employee }: EmployeeModalProps) {
	const currentUser = useAuthStore((state) => state.user);
	const orgModuleCodes = currentUser?.modules || [];

	const { data: rolesData, isLoading: isLoadingRoles } = useRoles({ pageSize: 100 });
	const createUser = useCreateUser();
	const updateUser = useUpdateUser();

	const isEditing = !!employee;
	const isPending = createUser.isPending || updateUser.isPending;

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [roleId, setRoleId] = useState('');
	const [selectedModules, setSelectedModules] = useState<string[]>([]);

	useEffect(() => {
		if (!isOpen) return;
		if (employee) {
			setName(employee.name);
			setEmail(employee.email);
			setUsername(employee.username || '');
			setPassword('');
			setRoleId(employee.roles?.[0]?.role?.id || '');
			setSelectedModules(
				employee.hasCustomModuleAccess && employee.moduleAccess ? employee.moduleAccess : orgModuleCodes
			);
		} else {
			setName('');
			setEmail('');
			setUsername('');
			setPassword('');
			setRoleId('');
			setSelectedModules(orgModuleCodes);
		}
	}, [isOpen, employee]);

	const toggleModule = (code: string) => {
		setSelectedModules((prev) =>
			prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (selectedModules.length === 0) {
			toast.error('Selecione pelo menos um módulo para o funcionário.');
			return;
		}

		try {
			if (isEditing) {
				await updateUser.mutateAsync({
					id: employee!.id,
					data: {
						name,
						email,
						username: username.trim() || undefined,
						...(password ? { password } : {}),
						roleIds: roleId ? [roleId] : undefined,
						moduleCodes: selectedModules,
					},
				});
				toast.success('Funcionário atualizado com sucesso!');
			} else {
				await createUser.mutateAsync({
					name,
					email,
					username: username.trim() || undefined,
					password,
					roleIds: roleId ? [roleId] : undefined,
					moduleCodes: selectedModules,
				});
				toast.success('Funcionário cadastrado com sucesso!');
			}
			onClose();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || 'Erro ao guardar o funcionário.');
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md rounded-sm">
				<DialogHeader>
					<DialogTitle className="text-sm text-slate-900 font-bold">
						{isEditing ? 'Editar Funcionário' : 'Cadastrar Funcionário'}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 mt-2">
					<div className="space-y-1.5">
						<label className="text-xs font-semibold text-slate-700">Nome Completo *</label>
						<Input
							required
							placeholder="Ex: João Fernandes"
							className="h-10 border-slate-200 rounded-sm text-sm"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					<div className="space-y-1.5">
						<label className="text-xs font-semibold text-slate-700">Email *</label>
						<Input
							required
							type="email"
							placeholder="funcionario@empresa.ao"
							className="h-10 border-slate-200 rounded-sm text-sm"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>

					<div className="space-y-1.5">
						<label className="text-xs font-semibold text-slate-700">Nome de Utilizador (opcional)</label>
						<Input
							placeholder="Ex: joao.fernandes"
							className="h-10 border-slate-200 rounded-sm text-sm"
							value={username}
							onChange={(e) => setUsername(e.target.value.trim().toLowerCase())}
						/>
						<p className="text-[10px] text-slate-400">Permite entrar na plataforma com este nome, além do email.</p>
					</div>

					<div className="space-y-1.5">
						<label className="text-xs font-semibold text-slate-700">
							{isEditing ? 'Nova Palavra-passe (opcional)' : 'Palavra-passe *'}
						</label>
						<Input
							required={!isEditing}
							type="password"
							minLength={6}
							placeholder={isEditing ? 'Deixe em branco para manter a atual' : 'Mínimo 6 caracteres'}
							className="h-10 border-slate-200 rounded-sm text-sm"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>

					<div className="space-y-1.5">
						<label className="text-xs font-semibold text-slate-700">Função / Cargo</label>
						<Select value={roleId} onValueChange={setRoleId}>
							<SelectTrigger className="h-10 border-slate-200 rounded-sm text-sm">
								<SelectValue placeholder={isLoadingRoles ? 'A carregar...' : 'Selecionar função'} />
							</SelectTrigger>
							<SelectContent>
								{(rolesData?.data || []).map((role) => (
									<SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<label className="text-xs font-semibold text-slate-700">Módulos com Acesso *</label>
						<p className="text-[10px] text-slate-400">
							Define quais módulos aparecem para este funcionário. Não substitui as permissões do papel —
							para definir o que pode fazer dentro de cada módulo, use Papéis &amp; Permissões.
						</p>
						<div className="border border-slate-200 rounded-sm divide-y divide-slate-100">
							{orgModuleCodes.length > 0 ? (
								orgModuleCodes.map((code) => {
									const meta = MODULE_META[code] || { label: code, icon: Package };
									const Icon = meta.icon;
									const checked = selectedModules.includes(code);
									return (
										<label key={code} className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors">
											<div className="flex items-center gap-2.5">
												<Icon size={15} className="text-slate-400" />
												<span className="text-sm font-medium text-slate-700">{meta.label}</span>
											</div>
											<input
												type="checkbox"
												className="w-4 h-4 accent-primary cursor-pointer"
												checked={checked}
												onChange={() => toggleModule(code)}
											/>
										</label>
									);
								})
							) : (
								<p className="text-xs text-slate-400 px-3 py-3">Nenhum módulo ativo na organização.</p>
							)}
						</div>
					</div>

					<DialogFooter className="gap-2 mt-2">
						<Button type="button" variant="outline" onClick={onClose} className="border-slate-200 rounded-sm h-10 text-sm">
							Cancelar
						</Button>
						<Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary text-white rounded-sm h-10 text-sm px-6">
							{isPending ? <Loader2 size={15} className="animate-spin" /> : isEditing ? 'Guardar Alterações' : 'Cadastrar Funcionário'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
