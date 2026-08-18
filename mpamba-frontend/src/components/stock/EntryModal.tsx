'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
	Hash,
	FileText,
	Save,
	X,
	ArrowDownCircle,
	Truck,
	Package
} from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription
} from '@/components/ui/dialog';
import { AddStockSchema, AddStockDto } from '@/shared/dto/stock.dto';
import { useAddStock, useStockProducts, useStockSuppliers } from '@/hooks/module/stock';
import Input from '@/components/common/forms/Input';
import Button from '@/components/common/forms/Button';
import FormSelect from '@/components/common/forms/Select';
import { toast } from 'sonner';

interface EntryModalProps {
	isOpen: boolean;
	onClose: () => void;
}

interface FormValues extends AddStockDto {
	productId: string;
}

export default function EntryModal({ isOpen, onClose }: EntryModalProps) {
	const { data: productsData } = useStockProducts({ pageSize: 100 });
	const { data: suppliersData } = useStockSuppliers({ pageSize: 100 });
	const { mutate: addStock, isPending } = useAddStock();

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(AddStockSchema.extend({
			productId: z.string().min(1, 'Selecione um produto')
		})),
		defaultValues: {
			productId: '',
			quantity: 1,
			reference: '',
			reason: '',
			supplierId: null,
		},
	});

	const onSubmit = (data: FormValues) => {
		addStock(
			{
				productId: data.productId,
				data: {
					quantity: data.quantity,
					reference: data.reference,
					reason: data.reason,
					supplierId: data.supplierId === 'none' ? null : data.supplierId
				}
			},
			{
				onSuccess: () => {
					toast.success('Entrada de stock registada com sucesso');
					reset();
					onClose();
				},
				onError: (error: any) => {
					toast.error(error?.response?.data?.message || 'Erro ao registar entrada');
				}
			}
		);
	};

	const productOptions = productsData?.data?.map(p => ({
		value: p.id,
		label: `${p.name} (${p.sku})`
	})) || [];

	const supplierOptions = [
		{ value: 'none', label: 'Sem fornecedor' },
		...(suppliersData?.data?.map(s => ({
			value: s.id,
			label: s.name
		})) || [])
	];

	return (
		<Dialog open={isOpen} onOpenChange={(open) => {
			if (!open) {
				reset();
				onClose();
			}
		}}>
			<DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl rounded-sm animate-in zoom-in-95 duration-300">
				<DialogHeader className="p-6 bg-slate-900 text-white">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-sm bg-emerald-500/20 flex items-center justify-center text-emerald-400">
							<ArrowDownCircle size={24} />
						</div>
						<div>
							<DialogTitle className="text-xl font-bold">Nova Entrada de Stock</DialogTitle>
							<DialogDescription className="text-slate-400 text-xs">
								Registe a entrada de novos produtos no inventário.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 bg-white">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="md:col-span-2">
							<Controller
								name="productId"
								control={control}
								render={({ field }) => (
									<FormSelect
										label="Produto"
										placeholder="Selecione o produto..."
										options={productOptions}
										value={field.value}
										onValueChange={field.onChange}
										error={errors.productId?.message}
										disabled={isPending}
									/>
								)}
							/>
						</div>

						<div className="md:col-span-2">
							<Controller
								name="supplierId"
								control={control}
								render={({ field }) => (
									<FormSelect
										label="Fornecedor (Opcional)"
										placeholder="Selecione o fornecedor..."
										options={supplierOptions}
										value={field.value || 'none'}
										onValueChange={field.onChange}
										disabled={isPending}
									/>
								)}
							/>
						</div>

						<Controller
							name="quantity"
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									type="number"
									label="Quantidade"
									placeholder="0"
									error={errors.quantity?.message}
									disabled={isPending}
									onChange={(e) => field.onChange(Number(e.target.value))}
								/>
							)}
						/>

						<Controller
							name="reference"
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									label="Referência / Doc."
									placeholder="Ex: FT 2024/001"
									error={errors.reference?.message}
									disabled={isPending}
								/>
							)}
						/>
					</div>

					<Controller
						name="reason"
						control={control}
						render={({ field }) => (
							<div className="space-y-1.5">
								<label className="block text-xs font-bold text-primary uppercase tracking-wider">Motivo ou Observação</label>
								<textarea
									{...field}
									placeholder="Ex: Compra de fornecedor, reposição..."
									className="min-h-24 w-full rounded-sm border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 resize-none"
									disabled={isPending}
								/>
								{errors.reason && (
									<p className="text-xs font-semibold text-red-600 mt-1">{errors.reason.message}</p>
								)}
							</div>
						)}
					/>

					<div className="flex items-center gap-3 pt-6 border-t border-slate-100">
						<Button
							type="button"
							variant="secondary"
							onClick={onClose}
							className="flex-1 rounded-sm h-11"
							disabled={isPending}
						>
							<X size={18} className="mr-2" />
							Cancelar
						</Button>
						<Button
							type="submit"
							className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm h-11 shadow-lg shadow-emerald-600/20"
							disabled={isPending}
							isLoading={isPending}
						>
							<Save size={18} className="mr-2" />
							Registar Entrada
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
