import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { useDeleteBillingCustomer } from '@/hooks/module/billing';

interface DeleteCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: any;
}

export function DeleteCustomerModal({ isOpen, onClose, customer }: DeleteCustomerModalProps) {
    const { mutate: deleteCustomer, isPending: isDeleting } = useDeleteBillingCustomer();

    const handleDelete = () => {
        if (!customer?.id) return;

        deleteCustomer(customer.id, {
            onSuccess: () => {
                toast.success('Cliente removido com sucesso.');
                onClose();
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || 'Erro ao remover cliente.');
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="rounded-sm sm:max-w-md border-slate-200">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-4">
                        <AlertTriangle size={24} />
                    </div>
                    <DialogTitle className="text-center text-slate-900">Remover Cliente</DialogTitle>
                    <DialogDescription className="text-center">
                        Tem certeza que deseja remover <span className="font-bold text-slate-900">{customer?.name}</span>? 
                        <br />Esta ação é irreversível e pode afetar o histórico de faturas se não houver integridade referencial.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-6 flex sm:justify-center gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="rounded-sm border-slate-200 text-slate-600 hover:bg-slate-50 flex-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="rounded-sm bg-rose-600 hover:bg-rose-700 text-white flex-1 gap-2"
                    >
                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : null}
                        Confirmar Remoção
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
