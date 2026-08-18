import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
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
import { useDeleteUser } from '@/hooks/core/useUser';

interface DeleteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
}

export function DeleteUserModal({ isOpen, onClose, user }: DeleteUserModalProps) {
    const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

    const handleDelete = () => {
        if (!user) return;
        deleteUser(user.id, {
            onSuccess: () => {
                toast.success('Utilizador removido com sucesso.');
                onClose();
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || 'Erro ao remover utilizador.');
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="rounded-sm sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-rose-600 flex items-center gap-2">
                        <AlertCircle size={20} />
                        Remover Utilizador
                    </DialogTitle>
                    <DialogDescription className="py-4">
                        Tem certeza que deseja remover o utilizador <strong className="text-slate-900">{user?.name}</strong>?
                        Esta ação não pode ser desfeita.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" onClick={handleDelete} disabled={isDeleting} className="bg-rose-600 text-white hover:bg-rose-700 rounded-sm gap-2">
                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : null}
                        Sim, Remover
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
