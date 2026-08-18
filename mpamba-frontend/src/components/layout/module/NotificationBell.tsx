'use client';

import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    useNotifications,
    useUnreadNotificationCount,
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
} from '@/hooks/core/useNotification';

export default function NotificationBell() {
    const { data: unreadCount = 0 } = useUnreadNotificationCount();
    const { data: notificationsData, isLoading } = useNotifications({ pageSize: 10 });
    const markReadMutation = useMarkNotificationRead();
    const markAllReadMutation = useMarkAllNotificationsRead();

    const notifications = notificationsData?.data || [];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors outline-none"
                aria-label="Notificações"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold rounded-full border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 border-slate-200 rounded-xl shadow-xl shadow-slate-200/80">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Notificações</p>
                    <button
                        onClick={() => markAllReadMutation.mutate()}
                        disabled={unreadCount === 0 || markAllReadMutation.isPending}
                        className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <CheckCheck size={12} />
                        Marcar todas como lidas
                    </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {isLoading ? (
                        <div className="py-10 flex items-center justify-center">
                            <Loader2 size={22} className="text-slate-300 animate-spin" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-xs font-medium text-slate-400">Sem notificações.</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <button
                                key={n.recipientId}
                                onClick={() => !n.readAt && markReadMutation.mutate(n.recipientId)}
                                className={cn(
                                    "w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-2.5",
                                    !n.readAt && "bg-primary/5"
                                )}
                            >
                                {!n.readAt && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                                <div className={cn("flex-1 min-w-0", n.readAt && "pl-4")}>
                                    <p className={cn("text-xs leading-tight", !n.readAt ? "font-bold text-slate-800" : "font-semibold text-slate-600")}>
                                        {n.title}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
