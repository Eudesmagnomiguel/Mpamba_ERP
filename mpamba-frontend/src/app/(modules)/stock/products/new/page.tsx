'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';

import Button from '@/components/common/forms/Button';
import Input from '@/components/common/forms/Input';
import FormSelect from '@/components/common/forms/Select';
import { Button as UiButton } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateStockProduct, useStockCategories } from '@/hooks/module/stock';
import { useMySubscription } from '@/hooks/core/useSubscription';
import { CreateProductSchema, CreateProductDto } from '@/shared/dto/stock.dto';

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

export default function NewProductPage() {
	const router = useRouter();
	const { mutate: createProduct, isPending } = useCreateStockProduct();
	const { data: subscription, isLoading: isSubscriptionLoading } = useMySubscription();
	const { data: categoriesData } = useStockCategories({ pageSize: 100 });

	const isSubscriptionActive = subscription?.status === 'ACTIVE';
	const categories = categoriesData?.data || [];

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<CreateProductDto>({
		resolver: zodResolver(CreateProductSchema),
		defaultValues: {
			name: '',
			sku: '',
			unit: 'UN',
			price: 0,
			quantity: 0,
			minStock: 0,
			maxStock: undefined,
			expiryDate: null,
			description: '',
			categoryId: null,
		},
	});

	const onSubmit = (data: CreateProductDto) => {
		if (!isSubscriptionActive) {
			toast.error('A sua subscrição não está ativa. Ative ou renove o plano para criar produtos.');
			return;
		}

		createProduct(
			{
				...data,
				categoryId: data.categoryId === 'none' ? null : data.categoryId,
			},
			{
				onSuccess: (product) => {
					toast.success('Produto criado com sucesso.');
					router.push(`/stock/products/${product.id}`);
				},
				onError: (error: any) => {
					const message = error?.response?.data?.message;
					toast.error(message || 'Não foi possível criar o produto.');
				},
			}
		);
	};

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-500">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="flex items-start gap-4">
					<UiButton
						variant="ghost"
						size="icon"
						onClick={() => router.back()}
						className="rounded-sm bg-white border text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm"
					>
						<ArrowLeft size={20} />
					</UiButton>
					<div>
						<h1 className="text-2xl font-bold tracking-tight text-slate-900">Novo Produto</h1>
						<p className="mt-1 text-sm text-slate-500">
							Registe um novo item no catálogo do stock, com a quantidade inicial e os limites de stock.
						</p>
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-7xl">
				{!isSubscriptionLoading && !isSubscriptionActive ? (
					<div className="mb-6 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-3">
						<div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
						A sua subscrição está {subscription?.status?.toLowerCase() || 'indisponível'}. Criação de produtos está bloqueada até a subscrição ser reativada.
					</div>
				) : null}

				<Card className="border-slate-200/60 bg-white shadow-sm rounded-sm overflow-hidden">
					<CardHeader className="border-b border-slate-100 bg-slate-50/30">
						<CardTitle className="text-lg font-bold text-slate-900">Dados do Produto</CardTitle>
						<CardDescription>Preencha os campos obrigatórios para criar o item no catálogo.</CardDescription>
					</CardHeader>
					<CardContent className="p-8">
						<form id="new-product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
									name="quantity"
									control={control}
									render={({ field }) => (
										<Input
											{...field}
											value={field.value ?? ''}
											type="number"
											label="Quantidade Inicial"
											placeholder="Ex: 100"
											error={errors.quantity?.message}
											disabled={isPending}
											onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
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
									name="expiryDate"
									control={control}
									render={({ field }) => (
										<Input
											{...field}
											value={field.value ?? ''}
											type="date"
											label="Data de Validade"
											helperText="Deixe vazio se o produto não expira."
											error={errors.expiryDate?.message}
											disabled={isPending}
											onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
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
								<UiButton asChild variant="outline" className="h-11 border-slate-200 px-6 text-slate-600 hover:bg-slate-50 rounded-sm shadow-sm sm:w-auto">
									<Link href="/stock/products">Cancelar</Link>
								</UiButton>
								<Button
									fullWidth={false}
									type="submit"
									disabled={isPending || isSubscriptionLoading || !isSubscriptionActive}
									className="h-11 gap-2 bg-primary px-8 text-white hover:bg-primary rounded-sm shadow-lg shadow-primary/20"
								>
									{isPending ? <Loader2 size={18} className="animate-spin" /> : <PackagePlus size={18} />}
									{isPending ? 'A guardar...' : !isSubscriptionActive ? 'Subscrição inativa' : 'Criar Produto'}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}