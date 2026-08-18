'use client';

import { Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import NotificationForm from '@/components/admin/notifications/NotificationForm';
import { useSendNotification } from '@/hooks/core/useNotification';
import { CreateNotificationDto } from '@/shared/types/notification.types';

export default function AdminNotificationsPage() {
    const sendMutation = useSendNotification();

    const handleSubmit = async (data: CreateNotificationDto) => {
        try {
            await sendMutation.mutateAsync(data);
            toast.success('Notificação enviada com sucesso!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erro ao enviar notificação.');
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
                    <Megaphone size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enviar Notificação</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Envie uma notificação para todos os utilizadores, uma organização, ou um utilizador específico.</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm">
                <NotificationForm onSubmit={handleSubmit} isLoading={sendMutation.isPending} />
            </div>
        </div>
    );
}
