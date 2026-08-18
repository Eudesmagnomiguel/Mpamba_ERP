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
	Layers,
	X,
	Save,
	AlertCircle
} from 'lucide-react';
import {
	useStockCategories,
	useCreateStockCategory,
	useUpdateStockCategory,
	useDeleteStockCategory
} from '@/hooks/module/stock';
import { CreateCategorySchema, CreateCategoryDto } from '@/shared/dto/stock.dto';
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
import { cn } from '@/lib/utils';
import { useHasPermission } from '@/hooks/core/usePermission';
import { PERMISSIONS } from '@/shared/constants/permission.constants';

export default function CategoriesPage() {
	const [searchTerm, setSearchTerm] = useState('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<any>(null);

	// Permissions
	const canCreate = useHasPermission(PERMISSIONS.STOCK_CATEGORY_CREATE);
	const canUpdate = useHasPermission(PERMISSIONS.STOCK_CATEGORY_UPDATE);
	const canDelete = useHasPermission(PERMISSIONS.STOCK_CATEGORY_DELETE);

	const { data: categoriesData, isLoading, error } = useStockCategories({ search: searchTerm });
	const { mutate: createCategory, isPending: isCreating } = useCreateStockCategory();
	const { mutate: updateCategory, isPending: isUpdating } = useUpdateStockCategory();
	const { mutate: deleteCategory, isPending: isDeleting } = useDeleteStockCategory();

	const categories = categoriesData?.data || [];

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
		setValue
	} = useForm<CreateCategoryDto>({
		resolver: zodResolver(CreateCategorySchema),
		defaultValues: {
			name: '',
			description: '',
		},
	});

	useEffect(() => {
		if (editingCategory) {
			setValue('name', editingCategory.name);
			setValue('description', editingCategory.description || '');
		} else {
			reset({ name: '', description: '' });
		}
	}, [editingCategory, setValue, reset]);

	const handleOpenModal = (category?: any) => {
		setEditingCategory(category || null);
		setIsModalOpen(true);
	};

	const onSubmit = (data: CreateCategoryDto) => {
		if (editingCategory) {
			updateCategory(
				{ id: editingCategory.id, data },
				{
					onSuccess: () => {
						toast.success('Categoria atualizada com sucesso.');
						setIsModalOpen(false);
						setEditingCategory(null);
					},
					onError: (error: any) => {
						toast.error(error?.response?.data?.message || 'Erro ao atualizar categoria.');
					}
				}
			);
		} else {
			createCategory(data, {
				onSuccess: () => {
					toast.success('Categoria criada com sucesso.');
					setIsModalOpen(false);
					reset();
				},
				onError: (error: any) => {
					toast.error(error?.response?.data?.message || 'Erro ao criar categoria.');
				}
			});
		}
	};

	const handleDelete = (id: string) => {
		if (confirm('Tem certeza que deseja excluir esta categoria?')) {
			deleteCategory(id, {
				onSuccess: () => {
					toast.success('Categoria excluída com sucesso.');
				},
				onError: (error: any) => {
					toast.error(error?.response?.data?.message || 'Erro ao excluir categoria.');
				}
			});
		}
	};

	return (
		<div className="space-y-6 animate-in fade-in duration-500">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Categorias de Produtos</h1>
					<p className="text-slate-500 text-sm mt-1">Organize e classifique o seu inventário de forma eficiente.</p>
				</div>
				{canCreate && (
					<Button
						fullWidth={false}
						onClick={() => handleOpenModal()}
						className="bg-primary hover:bg-primary text-white gap-2 h-11 px-6 rounded-sm shadow-lg shadow-primary/20"
					>
						<Plus size={18} />
						Nova Categoria
					</Button>
				)}
			</div>

			{/* Filters */}
			<Card className="border-slate-200/60 rounded-sm shadow-sm bg-white/50 backdrop-blur-sm">
				<CardContent className="px-4 flex items-center gap-4">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
						<input
							placeholder="Pesquisar por nome ou descrição..."
							className="w-full pl-10 h-11 bg-white border border-slate-200 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{isLoading ? (
					Array.from({ length: 8 }).map((_, i) => (
						<div key={i} className="h-32 bg-slate-100 rounded-sm animate-pulse" />
					))
				) : error ? (
					<div className="col-span-full py-20 flex flex-col items-center gap-3 text-rose-500 bg-white rounded-sm border border-slate-200">
						<AlertCircle size={40} />
						<p className="font-medium text-lg">Erro ao carregar categorias</p>
						<p className="text-sm opacity-80">Por favor, tente recarregar a página.</p>
					</div>
				) : categories.length > 0 ? (
					categories.map((category) => (
						<Card key={category.id} className="group border-slate-200 rounded-sm shadow-sm hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white overflow-hidden">
							<CardContent className="p-0">
								<div className="p-5 flex flex-col gap-4">
									<div className="flex items-start justify-between">
										<div className="w-12 h-12 rounded-sm bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center transition-colors shadow-inner">
											<Layers size={24} />
										</div>
										<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
											{canUpdate && (
												<button
													className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-primary rounded-sm hover:bg-primary/5 transition-all"
													onClick={() => handleOpenModal(category)}
													title="Editar"
												>
													<Pencil size={14} />
												</button>
											)}
											{canDelete && (
												<button
													className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-sm hover:bg-rose-50 transition-all"
													onClick={() => handleDelete(category.id)}
													title="Eliminar"
												>
													<Trash2 size={14} />
												</button>
											)}
										</div>
									</div>
									<div>
										<h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{category.name}</h3>
										<p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-8 italic leading-relaxed">
											{category.description || 'Sem descrição detalhada'}
										</p>
									</div>
									<div className="pt-4 border-t border-slate-100 flex items-center justify-between">
										<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {category.id.slice(0, 8)}</span>
										<span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm font-bold">MPAMBA</span>
									</div>
								</div>
							</CardContent>
						</Card>
					))
				) : (
					<div className="col-span-full py-32 flex flex-col items-center gap-4 bg-white rounded-sm border-2 border-dashed border-slate-200">
						<div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
							<Layers size={32} />
						</div>
						<div className="text-center">
							<p className="text-slate-500 font-bold text-lg">Nenhuma categoria encontrada</p>
							<p className="text-slate-400 text-sm mt-1">Comece por adicionar a sua primeira categoria de produtos.</p>
						</div>
						{canCreate && (
							<Button
								fullWidth={false}
								onClick={() => handleOpenModal()}
								className="mt-4 bg-primary text-white rounded-sm"
							>
								Adicionar Agora
							</Button>
						)}
					</div>
				)}
			</div>

			{/* Modal */}
			<Dialog open={isModalOpen} onOpenChange={(open) => {
				setIsModalOpen(open);
				if (!open) setEditingCategory(null);
			}}>
				<DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-sm animate-in zoom-in-95 duration-300">
					<DialogHeader className="p-8 bg-slate-900 text-white relative">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 rounded-sm bg-accent-warm/20 flex items-center justify-center text-accent-warm border border-accent-warm/30">
								<Layers size={28} />
							</div>
							<div>
								<DialogTitle className="text-2xl font-bold tracking-tight">
									{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
								</DialogTitle>
								<DialogDescription className="text-slate-400 text-xs mt-1">
									{editingCategory ? 'Atualize as informações da categoria de stock.' : 'Crie uma nova classificação para os seus produtos.'}
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 bg-white">
						<Controller
							name="name"
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									label="Nome da Categoria"
									placeholder="Ex: Eletrónicos, Higiene, Congelados..."
									error={errors.name?.message}
									disabled={isCreating || isUpdating}
									className="h-12"
								/>
							)}
						/>

						<Controller
							name="description"
							control={control}
							render={({ field }) => (
								<div className="space-y-1.5">
									<label className="text-xs font-bold text-primary uppercase tracking-wider">Descrição Detalhada</label>
									<textarea
										{...field}
										placeholder="Descreva o que esta categoria representa..."
										className="w-full min-h-[120px] p-4 text-sm border border-slate-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none placeholder:text-slate-400 bg-slate-50/30 font-medium"
										disabled={isCreating || isUpdating}
									/>
									{errors.description && (
										<p className="text-[10px] text-rose-600 font-bold mt-1 uppercase">{errors.description.message}</p>
									)}
								</div>
							)}
						/>

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
								{editingCategory ? 'Salvar' : 'Criar Categoria'}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
