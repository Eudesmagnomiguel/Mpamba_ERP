'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, PackagePlus, ArrowDownCircle } from 'lucide-react';
import { toast } from 'sonner';

import Button from '@/components/common/forms/Button';
import Input from '@/components/common/forms/Input';
import FormSelect from '@/components/common/forms/Select';
import { Button as UiButton } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMySubscription } from '@/hooks/core/useSubscription';
import { useStockProduct, useUpdateStockProduct, useStockCategories, useAddStock } from '@/hooks/module/stock';
import { UpdateProductSchema, UpdateProductDto } from '@/shared/dto/stock.dto';

const unitOptions = [
	{ value: 'UN', label: 'Unidade' },
	{ value: 'CX', label: 'Caixa' },
	{ value: 'KG', label: 'Quilograma' },
	{ value: 'G', label: 'Grama' },
	{ value: 'L', label: 'Litro' },
	{ value: 'ML', label: 'Mililitro' },
	{ value: 'MT', label: 'Metro' },
	{ value: 'M2', label: 'Metro quadrado' },
	{ value: 'PCT', label: 'Pacote' },
];

export default function EditProductPage() {
	const router = useRouter();
	const params = useParams<{ id: string }>();
	const productId = Array.isArray(params?.id) ? params.id[0] : params?.id;

	const { data: product, isLoading, isError } = useStockProduct(productId || '');
	const { mutate: updateProduct, isPending } = useUpdateStockProduct();
	const { mutate: addStock, isPending: isAddingStock } = useAddStock();
	const { data: subscription, isLoading: isSubscriptionLoading } = useMySubscription();
	const { data: categoriesData } = useStockCategories({ pageSize: 100 });

	const isSubscriptionActive = subscription?.status === 'ACTIVE';
	const categories = categoriesData?.data || [];

	const [addQuantity, setAddQuantity] = useState('');
	const [addReason, setAddReason] = useState('');

	const handleAddStock = () => {
		if (!productId) return;
		const quantity = parseFloat(addQuantity);
		if (!quantity || quantity <= 0) {
			toast.error('Informe uma quantidade válida, maior que 0.');
			return;
		}

		addStock(
			{ productId, data: { quantity, reason: addReason || undefined } },
			{
				onSuccess: () => {
					toast.success(`${quantity} ${product?.unit ?? ''} adicionado(s) ao stock.`.trim());
					setAddQuantity('');
					setAddReason('');
				},
				onError: (error: any) => {
					toast.error(error?.response?.data?.message || 'Não foi possível adicionar a quantidade.');
				},
			}
		);
	};

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<UpdateProductDto>({
		resolver: zodResolver(UpdateProductSchema),
		defaultValues: {
			name: '',
			sku: '',
			unit: 'UN',
			price: 0,
			minStock: 0,
			maxStock: undefined,
			description: '',
			categoryId: null,
			isActive: true,
		},
	});

	useEffect(() => {
		if (product) {
			reset({
				name: product.name,
				sku: product.sku,
				unit: product.unit,
				price: product.price ?? 0,
				minStock: product.minStock ?? 0,
				maxStock: product.maxStock ?? undefined,
				description: product.description ?? '',
				categoryId: product.categoryId ?? null,
				isActive: product.isActive,
			});
		}
	}, [product, reset]);

	const onSubmit = (data: UpdateProductDto) => {
		if (!isSubscriptionActive) {
			toast.error('A sua subscrição não está ativa. Ative ou renove o plano para atualizar produtos.');
			return;
		}

		if (!productId) {
			toast.error('Não foi possível identificar o produto.');
			return;
		}

		updateProduct(
			{
				id: productId,
				data: {
					...data,
					categoryId: data.categoryId === 'none' ? null : data.categoryId,
				},
			},
			{
				onSuccess: () => {
					toast.success('Produto atualizado com sucesso.');
					router.push(`/stock/products/${productId}`);
				},
				onError: (error: any) => {
					const message = error?.response?.data?.message;
					toast.error(message || 'Não foi possível atualizar o produto.');
				},
			}
		);
	};

	if (isLoading) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center text-slate-500 animate-in fade-in duration-500">
				<div className="flex items-center gap-3 rounded-sm border border-slate-200 bg-white px-5 py-4 shadow-sm">
					<Loader2 className="animate-spin text-primary" size={20} />
					<span className="text-sm font-medium">A carregar produto...</span>
				</div>
			</div>
		);
	}

	if (isError || !product) {
		return (
			<div className="space-y-4 rounded-sm border border-rose-200 bg-rose-50 p-6 text-rose-700 animate-in zoom-in-95 duration-300">
				<p className="font-semibold">Não foi possível carregar o produto.</p>
				<UiButton asChild variant="outline" className="rounded-sm border-rose-200 text-rose-700 hover:bg-rose-100 shadow-sm">
					<Link href="/stock/products">Voltar à lista</Link>
				</UiButton>
			</div>
		);
	}

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-500">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="flex items-start gap-4">
					<UiButton
						variant="ghost"
						size="icon"
						onClick={() => router.back()}
						className="rounded-sm border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm"
					>
						<ArrowLeft size={20} />
					</UiButton>
					<div>
						<h1 className="text-2xl font-bold tracking-tight text-slate-900">Editar Produto</h1>
						<p className="mt-1 text-sm text-slate-500">
							Atualize os dados do produto, SKU, unidade, preço e estado.
						</p>
					</div>
				</div>

				<div className="flex gap-2">
					<UiButton asChild variant="outline" className="h-11 rounded-sm border-slate-200 px-6 text-slate-600 hover:bg-slate-50 shadow-sm">
						<Link href={`/stock/products/${product.id}`}>Cancelar</Link>
					</UiButton>
					<Button
						fullWidth={false}
						type="submit"
						form="edit-product-form"
						disabled={isPending || isSubscriptionLoading || !isSubscriptionActive}
						className="h-11 gap-2 rounded-sm bg-primary px-8 text-white hover:bg-primary shadow-lg shadow-primary/20"
					>
						{isPending ? <Loader2 size={18} className="animate-spin" /> : <PackagePlus size={18} />}
						{isPending ? 'A guardar...' : !isSubscriptionActive ? 'Subscrição inativa' : 'Atualizar'}
					</Button>
				</div>
			</div>

			<div className="mx-auto max-w-7xl">
				{!isSubscriptionLoading && !isSubscriptionActive ? (
					<div className="mb-6 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-3">
						<div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
						A sua subscrição está {subscription?.status?.toLowerCase() || 'indisponível'}. A atualização de produtos está bloqueada até a subscrição ser reativada.
					</div>
				) : null}

				<Card className="mb-6 rounded-sm border-slate-200/60 bg-white shadow-sm overflow-hidden">
					<CardHeader className="border-b border-slate-100 bg-slate-50/30">
						<CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
							<ArrowDownCircle size={18} className="text-emerald-600" />
							Adicionar Quantidade ao Stock
						</CardTitle>
						<CardDescription>
							Stock atual: <span className="font-bold text-slate-700">{product.currentQuantity} {product.unit}</span>. Isto regista uma entrada de stock, mantendo o histórico de movimentos.
						</CardDescription>
					</CardHeader>
					<CardContent className="p-8">
						<div className="grid grid-cols-1 gap-6 md:grid-cols-[repeat(2,minmax(0,1fr))_auto] md:items-end">
							<Input
								type="number"
								label="Quantidade a Adicionar"
								placeholder="Ex: 50"
								value={addQuantity}
								disabled={isAddingStock}
								onChange={(e) => setAddQuantity(e.target.value)}
							/>
							<Input
								label="Motivo / Referência (opcional)"
								placeholder="Ex: Compra de fornecedor, reposição..."
								value={addReason}
								disabled={isAddingStock}
								onChange={(e) => setAddReason(e.target.value)}
							/>
							<Button
								type="button"
								fullWidth={false}
								onClick={handleAddStock}
								disabled={isAddingStock || !addQuantity}
								className="h-11 gap-2 rounded-sm bg-emerald-600 px-8 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
							>
								{isAddingStock ? <Loader2 size={18} className="animate-spin" /> : <ArrowDownCircle size={18} />}
								{isAddingStock ? 'A adicionar...' : 'Adicionar'}
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-sm border-slate-200/60 bg-white shadow-sm overflow-hidden">
					<CardHeader className="border-b border-slate-100 bg-slate-50/30">
						<CardTitle className="text-lg font-bold text-slate-900">Dados do Produto</CardTitle>
						<CardDescription>Altere os campos necessários e guarde as mudanças.</CardDescription>
					</CardHeader>
					<CardContent className="p-8">
						<form id="edit-product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
								<Controller
									name="name"
									control={control}
									render={({ field }) => (
										<Input
											{...field}
											label="Nome do Produto"
											placeholder="Ex: Arroz Agulha 1kg"
											error={errors.name?.message}
											disabled={isPending}
										/>
									)}
								/>

								<Controller
									name="sku"
									control={control}
									render={({ field }) => (
										<Input
											{...field}
											label="SKU / Código"
											placeholder="Ex: ALIM-001"
											error={errors.sku?.message}
											disabled={isPending}
											onChange={(e) => field.onChange(e.target.value.toUpperCase())}
										/>
									)}
								/>

								<Controller
									name="categoryId"
									control={control}
									render={({ field }) => (
										<FormSelect
											label="Categoria"
											placeholder="Selecione a categoria"
											value={field.value || undefined}
											onValueChange={field.onChange}
											error={errors.categoryId?.message}
											disabled={isPending}
											options={[
												{ value: 'none', label: 'Sem categoria' },
												...categories.map(cat => ({ value: cat.id, label: cat.name }))
											]}
										/>
									)}
								/>

								<Controller
									name="unit"
									control={control}
									render={({ field }) => (
										<FormSelect
											label="Unidade de Medida"
											placeholder="Selecione a unidade"
											value={field.value}
											onValueChange={field.onChange}
											error={errors.unit?.message}
											disabled={isPending}
											options={unitOptions}
										/>
									)}
								/>

								<Controller
									name="price"
									control={control}
									render={({ field }) => (
										<Input
											{...field}
											type="number"
											label="Preço de Venda (AOA)"
											placeholder="Ex: 1200"
											error={errors.price?.message}
											disabled={isPending}
											onChange={(e) => field.onChange(parseFloat(e.target.value))}
										/>
									)}
								/>

								<Controller
									name="minStock"
									control={control}
									render={({ field }) => (
										<Input
											{...field}
											value={field.value ?? ''}
											type="number"
											label="Stock Mínimo"
											placeholder="Ex: 20"
											error={errors.minStock?.message}
											disabled={isPending}
											onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
										/>
									)}
								/>

								<Controller
									name="maxStock"
									control={control}
									render={({ field }) => (
										<Input
											{...field}
											value={field.value ?? ''}
											type="number"
											label="Stock Máximo"
											placeholder="Ex: 200"
											error={errors.maxStock?.message}
											disabled={isPending}
											onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
										/>
									)}
								/>

								<Controller
									name="isActive"
									control={control}
									render={({ field }) => (
										<FormSelect
											label="Estado do Produto"
											placeholder="Selecione o estado"
											value={field.value ? 'true' : 'false'}
											onValueChange={(val) => field.onChange(val === 'true')}
											error={errors.isActive?.message}
											disabled={isPending}
											options={[
												{ value: 'true', label: 'Ativo - Disponível para venda' },
												{ value: 'false', label: 'Inativo - Indisponível' },
											]}
										/>
									)}
								/>
							</div>

							<Controller
								name="description"
								control={control}
								render={({ field }) => (
									<div className="space-y-1.5">
										<label className="block text-xs font-bold text-primary uppercase tracking-wider">Descrição</label>
										<textarea
											{...field}
											placeholder="Descreva o produto, apresentação, embalagem ou observações relevantes."
											className="min-h-32 w-full rounded-sm border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 resize-none"
											disabled={isPending}
										/>
										{errors.description && (
											<p className="text-xs font-semibold text-red-600 mt-1">{errors.description.message}</p>
										)}
									</div>
								)}
							/>

							<div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
								<UiButton asChild variant="outline" className="h-11 rounded-sm border-slate-200 px-6 text-slate-600 hover:bg-slate-50 shadow-sm sm:w-auto">
									<Link href={`/stock/products/${product.id}`}>Voltar</Link>
								</UiButton>
								<Button
									fullWidth={false}
									type="submit"
									disabled={isPending || isSubscriptionLoading || !isSubscriptionActive}
									className="h-11 gap-2 rounded-sm bg-primary px-8 text-white hover:bg-primary shadow-lg shadow-primary/20"
								>
									{isPending ? <Loader2 size={18} className="animate-spin" /> : <PackagePlus size={18} />}
									{isPending ? 'A guardar...' : !isSubscriptionActive ? 'Subscrição inativa' : 'Atualizar Produto'}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}