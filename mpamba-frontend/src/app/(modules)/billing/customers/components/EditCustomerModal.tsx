import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UserCog } from 'lucide-react';
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
import { UpdateCustomerSchema, type UpdateCustomerDto } from '@/shared/dto/billing.dto';
import { useUpdateBillingCustomer } from '@/hooks/module/billing';

interface EditCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: any;
}

export function EditCustomerModal({ isOpen, onClose, customer }: EditCustomerModalProps) {
    const { mutate: updateCustomer, isPending: isUpdating } = useUpdateBillingCustomer();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<UpdateCustomerDto>({
        resolver: zodResolver(UpdateCustomerSchema)
    });

    useEffect(() => {
        if (customer) {
            reset({
                name: customer.name,
                nif: customer.nif || '',
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || '',
                isActive: customer.isActive
            });
        }
    }, [customer, reset]);

    const onSubmit = (data: UpdateCustomerDto) => {
        if (!customer?.id) return;
        updateCustomer({ id: customer.id, data }, {
            onSuccess: () => {
                toast.success('Dados do cliente atualizados.');
                onClose();
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || 'Erro ao atualizar cliente.');
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="rounded-sm sm:max-w-lg border-slate-200">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-sm">
                            <UserCog size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-primary">Editar Cliente</DialogTitle>
                            <DialogDescription>
                                Modifique as informações do cliente selecionado.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Input 
                                label="Nome Completo / Razão Social" 
                                {...register('name')}
                                error={errors.name?.message}
                                required
                                className="rounded-sm border-slate-200"
                            />
                        </div>
                        <Input 
                            label="NIF" 
                            {...register('nif')}
                            error={errors.nif?.message}
                            className="rounded-sm border-slate-200"
                        />
                        <Input 
                            label="Email" 
                            type="email"
                            {...register('email')}
                            error={errors.email?.message}
                            className="rounded-sm border-slate-200"
                        />
                        <Input 
                            label="Telefone" 
                            {...register('phone')}
                            error={errors.phone?.message}
                            className="rounded-sm border-slate-200"
                        />
                        <div className="flex items-end pb-2">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="isActive" 
                                    {...register('isActive')}
                                    className="w-4 h-4 text-primary border-slate-200 rounded-sm focus:ring-primary/20"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Cliente Ativo</label>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <Input 
                                label="Endereço Completo" 
                                {...register('address')}
                                error={errors.address?.message}
                                className="rounded-sm border-slate-200"
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button 
                            variant="ghost" 
                            type="button" 
                            onClick={onClose} 
                            className="rounded-sm text-slate-500 hover:bg-slate-50"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isUpdating} 
                            className="bg-primary text-white hover:bg-primary-hover rounded-sm gap-2 h-11 px-8"
                        >
                            {isUpdating ? <Loader2 size={16} className="animate-spin" /> : null}
                            Guardar Alterações
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
