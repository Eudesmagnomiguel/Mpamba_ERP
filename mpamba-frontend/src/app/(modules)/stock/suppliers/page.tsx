'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	Plus,
	Search,
	Loader2,
	Pencil,
	Trash2,
	Truck,
	X,
	Save,
	Mail,
	Phone,
	MapPin,
	Hash,
	AlertCircle,
	ExternalLink
} from 'lucide-react';
import {
	useStockSuppliers,
	useCreateStockSupplier,
	useUpdateStockSupplier,
	useDeleteStockSupplier
} from '@/hooks/module/stock';
import { CreateSupplierSchema, CreateSupplierDto } from '@/shared/dto/stock.dto';
import Button from '@/components/common/forms/Button';
import Input from '@/components/common/forms/Input';
import { Card, CardContent } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useHasPermission } from '@/hooks/core/usePermission';
import { PERMISSIONS } from '@/shared/constants/permission.constants';

export default function SuppliersPage() {
	const [searchTerm, setSearchTerm] = useState('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingSupplier, setEditingSupplier] = useState<any>(null);

	// Permissions
	const canCreate = useHasPermission(PERMISSIONS.STOCK_SUPPLIER_CREATE);
	const canUpdate = useHasPermission(PERMISSIONS.STOCK_SUPPLIER_UPDATE);
	const canDelete = useHasPermission(PERMISSIONS.STOCK_SUPPLIER_DELETE);

	const { data: suppliersData, isLoading, error } = useStockSuppliers({ search: searchTerm });
	const { mutate: createSupplier, isPending: isCreating } = useCreateStockSupplier();
	const { mutate: updateSupplier, isPending: isUpdating } = useUpdateStockSupplier();
	const { mutate: deleteSupplier, isPending: isDeleting } = useDeleteStockSupplier();

	const suppliers = suppliersData?.data || [];

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
		setValue
	} = useForm<CreateSupplierDto>({
		resolver: zodResolver(CreateSupplierSchema),
		defaultValues: {
			name: '',
			nif: '',
			email: '',
			phone: '',
			address: '',
		},
	});

	useEffect(() => {
		if (editingSupplier) {
			setValue('name', editingSupplier.name);
			setValue('nif', editingSupplier.nif || '');
			setValue('email', editingSupplier.email || '');
			setValue('phone', editingSupplier.phone || '');
			setValue('address', editingSupplier.address || '');
		} else {
			reset({ name: '', nif: '', email: '', phone: '', address: '' });
		}
	}, [editingSupplier, setValue, reset]);

	const handleOpenModal = (supplier?: any) => {
		setEditingSupplier(supplier || null);
		setIsModalOpen(true);
	};

	const onSubmit = (data: CreateSupplierDto) => {
		if (editingSupplier) {
			updateSupplier(
				{ id: editingSupplier.id, data },
				{
					onSuccess: () => {
						toast.success('Fornecedor atualizado com sucesso.');
						setIsModalOpen(false);
						setEditingSupplier(null);
					},
					onError: (error: any) => {
						toast.error(error?.response?.data?.message || 'Erro ao atualizar fornecedor.');
					}
				}
			);
		} else {
			createSupplier(data, {
				onSuccess: () => {
					toast.success('Fornecedor criado com sucesso.');
					setIsModalOpen(false);
					reset();
				},
				onError: (error: any) => {
					toast.error(error?.response?.data?.message || 'Erro ao criar fornecedor.');
				}
			});
		}
	};

	const handleDelete = (id: string) => {
		if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
			deleteSupplier(id, {
				onSuccess: () => {
					toast.success('Fornecedor excluído com sucesso.');
				},
				onError: (error: any) => {
					toast.error(error?.response?.data?.message || 'Erro ao excluir fornecedor.');
				}
			});
		}
	};

	return (
		<div className="space-y-6 animate-in fade-in duration-500">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Fornecedores</h1>
					<p className="text-slate-500 text-sm mt-1">Controle e mantenha o contacto com os seus parceiros comerciais.</p>
				</div>
				{canCreate && (
					<Button
						fullWidth={false}
						onClick={() => handleOpenModal()}
						className="bg-primary hover:bg-primary text-white gap-2 h-11 px-6 rounded-sm shadow-lg shadow-primary/20"
					>
						<Plus size={18} />
						Novo Fornecedor
					</Button>
				)}
			</div>

			{/* Filters */}
			<Card className="border-slate-200/60 rounded-sm shadow-sm bg-white/50 backdrop-blur-sm">
				<CardContent className="px-4 flex items-center gap-4">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
						<input
							placeholder="Pesquisar fornecedores por nome, NIF ou contacto..."
							className="w-full pl-10 h-11 bg-white border border-slate-200 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{isLoading ? (
					Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="h-48 bg-slate-100 rounded-sm animate-pulse" />
					))
				) : error ? (
					<div className="col-span-full py-20 flex flex-col items-center gap-3 text-rose-500 bg-white rounded-sm border border-slate-200">
						<AlertCircle size={40} />
						<p className="font-medium text-lg">Erro ao carregar fornecedores</p>
						<p className="text-sm opacity-80">Por favor, tente recarregar a página.</p>
					</div>
				) : suppliers.length > 0 ? (
					suppliers.map((supplier) => (
						<Card key={supplier.id} className="group border-slate-200 rounded-sm shadow-sm hover:border-primary/30 hover:shadow-xl transition-all duration-300 bg-white overflow-hidden">
							<CardContent className="p-0">
								<div className="p-6 flex flex-col gap-6">
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-4">
											<div className="w-14 h-14 rounded-sm bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center transition-colors shadow-inner border border-slate-100">
												<Truck size={28} />
											</div>
											<div>
												<h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">{supplier.name}</h3>
												<div className="flex items-center gap-2 mt-1">
													<span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm font-bold tracking-wider">NIF: {supplier.nif || '---'}</span>
													<span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-sm font-bold uppercase">Ativo</span>
												</div>
											</div>
										</div>
										<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
											{canUpdate && (
												<button
													className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-primary rounded-sm hover:bg-primary/5 transition-all"
													onClick={() => handleOpenModal(supplier)}
												>
													<Pencil size={16} />
												</button>
											)}
											{canDelete && (
												<button
													className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-sm hover:bg-rose-50 transition-all"
													onClick={() => handleDelete(supplier.id)}
												>
													<Trash2 size={16} />
												</button>
											)}
										</div>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 pt-6 border-t border-slate-100">
										<div className="space-y-3">
											<div className="flex items-center gap-3 text-sm text-slate-600">
												<div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
													<Mail size={14} />
												</div>
												<span className="truncate font-medium">{supplier.email || 'Sem email'}</span>
											</div>
											<div className="flex items-center gap-3 text-sm text-slate-600">
												<div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
													<Phone size={14} />
												</div>
												<span className="font-medium">{supplier.phone || 'Sem telefone'}</span>
											</div>
										</div>
										<div className="space-y-3">
											<div className="flex items-start gap-3 text-sm text-slate-600">
												<div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
													<MapPin size={14} />
												</div>
												<span className="line-clamp-2 leading-relaxed font-medium">{supplier.address || 'Sem endereço registado'}</span>
											</div>
										</div>
									</div>

									<div className="pt-2 flex justify-end">
										<button className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1 hover:underline">
											Ver Histórico de Compras
											<ExternalLink size={10} />
										</button>
									</div>
								</div>
							</CardContent>
						</Card>
					))
				) : (
					<div className="col-span-full py-32 flex flex-col items-center gap-4 bg-white rounded-sm border-2 border-dashed border-slate-200">
						<div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
							<Truck size={32} />
						</div>
						<div className="text-center">
							<p className="text-slate-500 font-bold text-lg">Nenhum fornecedor registado</p>
							<p className="text-slate-400 text-sm mt-1">Mantenha o seu cadastro de fornecedores sempre atualizado.</p>
						</div>
						{canCreate && (
							<Button
								fullWidth={false}
								onClick={() => handleOpenModal()}
								className="mt-4 bg-primary text-white rounded-sm"
							>
								Registar Fornecedor
							</Button>
						)}
					</div>
				)}
			</div>

			{/* Modal */}
			<Dialog open={isModalOpen} onOpenChange={(open) => {
				setIsModalOpen(open);
				if (!open) setEditingSupplier(null);
			}}>
				<DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl rounded-sm animate-in zoom-in-95 duration-300">
					<DialogHeader className="p-8 bg-slate-900 text-white">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 rounded-sm bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
								<Truck size={28} />
							</div>
							<div>
								<DialogTitle className="text-2xl font-bold tracking-tight">
									{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
								</DialogTitle>
								<DialogDescription className="text-slate-400 text-xs mt-1">
									{editingSupplier ? 'Atualize os dados de contacto e faturação do parceiro.' : 'Registe um novo parceiro de fornecimento no sistema.'}
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 bg-white">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
							<div className="sm:col-span-2">
								<Controller
									name="name"
									control={control}
									render={({ field }) => (
										<Input
											{...field}
											label="Nome / Razão Social"
											placeholder="Ex: Distribuidora Central de Angola, Lda"
											error={errors.name?.message}
											disabled={isCreating || isUpdating}
										/>
									)}
								/>
							</div>

							<Controller
								name="nif"
								control={control}
								render={({ field }) => (
									<Input
										{...field}
										label="NIF (Número de Identificação Fiscal)"
										placeholder="Ex: 5401122334"
										error={errors.nif?.message}
										disabled={isCreating || isUpdating}
									/>
								)}
							/>

							<Controller
								name="phone"
								control={control}
								render={({ field }) => (
									<Input
										{...field}
										label="Telefone de Contacto"
										placeholder="Ex: +244 923 000 000"
										error={errors.phone?.message}
										disabled={isCreating || isUpdating}
									/>
								)}
							/>

							<div className="sm:col-span-2">
								<Controller
									name="email"
									control={control}
									render={({ field }) => (
										<Input
											{...field}
											type="email"
											label="Endereço de Email"
											placeholder="Ex: comercial@fornecedor.ao"
											error={errors.email?.message}
											disabled={isCreating || isUpdating}
										/>
									)}
								/>
							</div>

							<div className="sm:col-span-2">
								<Controller
									name="address"
									control={control}
									render={({ field }) => (
										<div className="space-y-1.5">
											<label className="text-xs font-bold text-primary uppercase tracking-wider">Endereço Completo</label>
											<textarea
												{...field}
												placeholder="Ex: Rua Direita da Samba, Luanda, Angola"
												className="w-full min-h-[100px] p-4 text-sm border border-slate-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none placeholder:text-slate-400 bg-slate-50/30 font-medium"
												disabled={isCreating || isUpdating}
											/>
											{errors.address && (
												<p className="text-[10px] text-rose-600 font-bold mt-1 uppercase">{errors.address.message}</p>
											)}
										</div>
									)}
								/>
							</div>
						</div>

						<div className="flex items-center gap-3 pt-6 border-t border-slate-100">
							<Button
								type="button"
								variant="secondary"
								onClick={() => setIsModalOpen(false)}
								className="flex-1 rounded-sm h-12"
								disabled={isCreating || isUpdating}
							>
								<X size={18} className="mr-2" />
								Cancelar
							</Button>
							<Button
								type="submit"
								className="flex-1 bg-primary hover:bg-primary text-white rounded-sm h-12 shadow-lg shadow-primary/20"
								disabled={isCreating || isUpdating}
								isLoading={isCreating || isUpdating}
							>
								<Save size={18} className="mr-2" />
								{editingSupplier ? 'Salvar Alterações' : 'Registar Fornecedor'}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
