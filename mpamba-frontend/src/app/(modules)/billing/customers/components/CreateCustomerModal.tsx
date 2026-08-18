import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UserPlus } from 'lucide-react';
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
import { CreateCustomerSchema, type CreateCustomerDto } from '@/shared/dto/billing.dto';
import { useCreateBillingCustomer } from '@/hooks/module/billing';

interface CreateCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateCustomerModal({ isOpen, onClose }: CreateCustomerModalProps) {
    const { mutate: createCustomer, isPending: isCreating } = useCreateBillingCustomer();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<CreateCustomerDto>({
        resolver: zodResolver(CreateCustomerSchema),
        defaultValues: {
            name: '',
            nif: '',
            email: '',
            phone: '',
            address: ''
        }
    });

    const onSubmit = (data: CreateCustomerDto) => {
        createCustomer(data, {
            onSuccess: () => {
                toast.success('Cliente cadastrado com sucesso.');
                reset();
                onClose();
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || 'Erro ao cadastrar cliente.');
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                reset();
                onClose();
            }
        }}>
            <DialogContent className="rounded-sm sm:max-w-lg border-slate-200">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-sm">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-primary">Novo Cliente</DialogTitle>
                            <DialogDescription>
                                Preencha os dados abaixo para registar um novo cliente.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Input 
                                label="Nome Completo / Razão Social" 
                                placeholder="Ex: Mpamba Business Lda" 
                                {...register('name')}
                                error={errors.name?.message}
                                required
                                className="rounded-sm border-slate-200"
                            />
                        </div>
                        <Input 
                            label="NIF (Opcional)" 
                            placeholder="999999999" 
                            {...register('nif')}
                            error={errors.nif?.message}
                            className="rounded-sm border-slate-200"
                        />
                        <Input 
                            label="Email" 
                            type="email"
                            placeholder="cliente@email.ao" 
                            {...register('email')}
                            error={errors.email?.message}
                            className="rounded-sm border-slate-200"
                        />
                        <Input 
                            label="Telefone" 
                            placeholder="+244 9xx xxx xxx" 
                            {...register('phone')}
                            error={errors.phone?.message}
                            className="rounded-sm border-slate-200"
                        />
                        <div className="md:col-span-2">
                            <Input 
                                label="Endereço Completo" 
                                placeholder="Bairro, Rua, Edifício..." 
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
                            disabled={isCreating} 
                            className="bg-primary text-white hover:bg-primary-hover rounded-sm gap-2 h-11 px-8"
                        >
                            {isCreating ? <Loader2 size={16} className="animate-spin" /> : null}
                            Registar Cliente
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
