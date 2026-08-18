'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useUsers } from '@/hooks/core/useUser';
import Input from '@/components/common/forms/Input';
import Button from '@/components/common/forms/Button';
import { Card, CardContent } from '@/components/ui/card';
import { EditUserModal } from './components/EditUserModal';
import { CreateUserModal } from './components/CreateUserModal';
import { DeleteUserModal } from './components/DeleteUserModal';
import { User as UserIcon, MoreVertical, Loader2, AlertCircle, CheckCircle2, Plus, Edit2, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function StockUsersPage() {
	const [searchTerm, setSearchTerm] = useState('');

	// Modals state
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	// Selected user for Edit/Delete
	const [selectedUser, setSelectedUser] = useState<any>(null);

	const { data: usersData, isLoading, error } = useUsers();

	const users = usersData?.data || [];

	const handleOpenCreate = () => {
		setIsCreateOpen(true);
	};

	const handleOpenEdit = (user: any) => {
		setSelectedUser(user);
		setIsEditOpen(true);
	};

	const handleOpenDelete = (user: any) => {
		setSelectedUser(user);
		setIsDeleteOpen(true);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Utilizadores do Módulo</h1>
					<p className="text-slate-500 text-sm mt-1">Gira o acesso e visualize a atividade dos operadores de stock.</p>
				</div>
				<Button fullWidth={false} onClick={handleOpenCreate} className="bg-primary hover:bg-primary text-white gap-2 h-11 px-6 rounded-sm">
					<Plus size={18} />
					Adicionar Utilizador
				</Button>
			</div>

			<Card className="border-slate-200/60 rounded-sm shadow-sm bg-white/50 backdrop-blur-sm">
				<CardContent className="px-4 flex flex-col md:flex-row gap-4">
					<div className="relative flex-1">
						<Input
							placeholder="Pesquisar utilizador..."
							className="h-11 bg-white rounded-sm border-slate-200 focus:ring-primary/20 focus:border-primary transition-all"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
				</CardContent>
			</Card>

			<div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden min-h-100 flex flex-col">
				<div className="overflow-x-auto flex-1">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-slate-50/50 border-b border-slate-200">
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilizador</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Papel</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{isLoading ? (
								<tr>
									<td colSpan={5} className="px-6 py-20 text-center">
										<div className="flex flex-col items-center gap-3">
											<Loader2 size={32} className="text-primary animate-spin" />
											<p className="text-sm font-medium text-slate-500">Carregando utilizadores...</p>
										</div>
									</td>
								</tr>
							) : error ? (
								<tr>
									<td colSpan={5} className="px-6 py-20 text-center">
										<div className="flex flex-col items-center gap-3 text-rose-500">
											<AlertCircle size={32} />
											<p className="text-sm font-medium">Erro ao carregar utilizadores. Tente novamente.</p>
										</div>
									</td>
								</tr>
							) : users.length > 0 ? (
								users.map((user: any) => (
									<tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
													{user.urlImageProfile ? (
														<img src={user.urlImageProfile} alt={user.name} className="w-full h-full object-cover" />
													) : (
														<UserIcon size={20} />
													)}
												</div>
												<div>
													<div className="font-medium text-slate-900">{user.name}</div>
													<div className="text-[10px] text-slate-400 font-mono">Membro desde {new Date(user.createdAt).toLocaleDateString('pt-AO')}</div>
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
											{user.email}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											{user.roles && user.roles.length > 0 ? (
												<div className="flex flex-wrap gap-1">
													{user.roles.map((ur: any) => (
														<span key={ur.roleId} className="text-primary text-[10px] font-black uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-sm">
															{ur.role.name}
														</span>
													))}
												</div>
											) : (
												<span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-sm">
													Sem Papel
												</span>
											)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-center">
											<div className={cn(
												"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold border uppercase tracking-wider",
												user.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"
											)}>
												{user.isActive ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
												{user.isActive ? 'Ativo' : 'Inativo'}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon" className="h-8 w-8 bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-sm">
														<MoreVertical size={16} />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="w-48 p-1 shadow-xl border-slate-200 rounded-sm">
													<DropdownMenuItem onClick={() => handleOpenEdit(user)} className="gap-2 text-slate-600 focus:text-slate-900 focus:bg-slate-50 cursor-pointer rounded-sm">
														<Edit2 size={16} />
														Editar
													</DropdownMenuItem>
													<div className="h-px bg-slate-100 my-1" />
													<DropdownMenuItem
														onClick={() => handleOpenDelete(user)}
														className="gap-2 text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer rounded-sm"
													>
														<Trash2 size={16} />
														Remover
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={5} className="px-6 py-20 text-center">
										<div className="flex flex-col items-center gap-2">
											<div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
												<UserIcon size={24} />
											</div>
											<div className="text-slate-500 font-medium">Nenhum utilizador encontrado</div>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Modals via Components */}
			<CreateUserModal
				isOpen={isCreateOpen}
				onClose={() => setIsCreateOpen(false)}
			/>

			<EditUserModal
				isOpen={isEditOpen}
				onClose={() => setIsEditOpen(false)}
				user={selectedUser}
			/>

			<DeleteUserModal
				isOpen={isDeleteOpen}
				onClose={() => setIsDeleteOpen(false)}
				user={selectedUser}
			/>
		</div>
	);
}
