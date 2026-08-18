'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
    Loader2, 
    ArrowUpCircle, 
    X, 
    Save, 
    Hash, 
    FileText 
} from 'lucide-react';
import { toast } from 'sonner';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from '@/components/ui/dialog';
import { RemoveStockSchema, RemoveStockDto } from '@/shared/dto/stock.dto';
import { useRemoveStock, useStockProducts } from '@/hooks/module/stock';
import Input from '@/components/common/forms/Input';
import Button from '@/components/common/forms/Button';
import FormSelect from '@/components/common/forms/Select';

interface CreateExitModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface FormValues extends RemoveStockDto {
    productId: string;
}

export function CreateExitModal({ isOpen, onClose }: CreateExitModalProps) {
    const { data: productsData } = useStockProducts({ pageSize: 100 });
    const { mutate: removeStock, isPending } = useRemoveStock();

    const products = productsData?.data || [];

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(RemoveStockSchema.extend({
            productId: z.string().min(1, 'Selecione um produto')
        })),
        defaultValues: {
            productId: '',
            quantity: 1,
            reference: '',
            reason: '',
        },
    });

    const onSubmit = (data: FormValues) => {
        removeStock({
            productId: data.productId,
            data: {
                quantity: data.quantity,
                reference: data.reference,
                reason: data.reason
            }
        }, {
            onSuccess: () => {
                toast.success('Saída de stock registada com sucesso.');
                reset();
                onClose();
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || 'Erro ao registar saída de stock.');
            }
        });
    };

    const productOptions = products.map(p => ({
        value: p.id,
        label: `${p.name} (${p.currentQuantity} disponíveis)`
    }));

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                reset();
                onClose();
            }
        }}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-sm animate-in zoom-in-95 duration-300">
                <DialogHeader className="p-6 bg-slate-900 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-sm bg-rose-500/20 flex items-center justify-center text-rose-400">
                            <ArrowUpCircle size={24} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">Nova Saída de Stock</DialogTitle>
                            <DialogDescription className="text-slate-400 text-xs">
                                Registe uma nova saída (venda, quebra, etc.) para abater ao stock.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 bg-white">
                    <div className="space-y-6">
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                        placeholder="Ex: VENDA-001"
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
                                    <label className="block text-xs font-bold text-primary uppercase tracking-wider">Justificativa / Motivo</label>
                                    <textarea
                                        {...field}
                                        placeholder="Descreva o motivo da saída (ex: Venda balcão, Produto expirado...)"
                                        className="min-h-24 w-full rounded-sm border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 disabled:opacity-50 resize-none"
                                        disabled={isPending}
                                    />
                                    {errors.reason && (
                                        <p className="text-xs font-semibold text-red-600 mt-1">{errors.reason.message}</p>
                                    )}
                                </div>
                            )}
                        />
                    </div>

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
                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-sm h-11 shadow-lg shadow-rose-600/20"
                            disabled={isPending}
                            isLoading={isPending}
                        >
                            <Save size={18} className="mr-2" />
                            Registar Saída
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
