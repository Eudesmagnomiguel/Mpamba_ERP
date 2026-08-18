'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import Input from '@/components/common/forms/Input';
import Select from '@/components/common/forms/Select';
import Button from '@/components/common/forms/Button';
import { useOrganizations } from '@/hooks/module/organization';
import { useUsers } from '@/hooks/core/useUser';
import { CreateNotificationDto, NotificationTargetValue, NotificationTypeValue } from '@/shared/types/notification.types';

interface NotificationFormProps {
    onSubmit: (data: CreateNotificationDto) => void;
    isLoading?: boolean;
}

const TYPE_OPTIONS = [
    { value: 'INFO', label: 'Informação' },
    { value: 'SUCCESS', label: 'Sucesso' },
    { value: 'WARNING', label: 'Aviso' },
    { value: 'SYSTEM', label: 'Sistema' },
];

const TARGET_OPTIONS = [
    { value: 'ALL', label: 'Todos os utilizadores' },
    { value: 'ORGANIZATION', label: 'Uma organização' },
    { value: 'USER', label: 'Um utilizador' },
];

export default function NotificationForm({ onSubmit, isLoading }: NotificationFormProps) {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<NotificationTypeValue>('INFO');
    const [target, setTarget] = useState<NotificationTargetValue>('ALL');
    const [organizationId, setOrganizationId] = useState('');
    const [userId, setUserId] = useState('');

    const { data: orgsData } = useOrganizations({ pageSize: 100 });
    const { data: usersData } = useUsers({ pageSize: 100 });

    const orgOptions = (orgsData?.data || []).map(o => ({ value: o.id, label: o.name }));
    const userOptions = (usersData?.data || []).map(u => ({ value: u.id, label: `${u.name} (${u.email})` }));

    const isValid = title.trim() && message.trim() &&
        (target !== 'ORGANIZATION' || organizationId) &&
        (target !== 'USER' || userId);

    const handleSubmit = () => {
        if (!isValid) return;
        onSubmit({
            title,
            message,
            type,
            target,
            organizationId: target === 'ORGANIZATION' ? organizationId : undefined,
            userId: target === 'USER' ? userId : undefined,
        });
    };

    return (
        <div className="space-y-5 max-w-xl">
            <Input
                label="Título"
                placeholder="Ex: Manutenção agendada"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary">Mensagem</label>
                <textarea
                    className="w-full bg-white border border-slate-200 rounded-sm p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all min-h-[110px] resize-none"
                    placeholder="Escreva a mensagem da notificação…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
            </div>

            <Select
                label="Tipo"
                options={TYPE_OPTIONS}
                value={type}
                onValueChange={(v) => setType(v as NotificationTypeValue)}
            />

            <Select
                label="Enviar para"
                options={TARGET_OPTIONS}
                value={target}
                onValueChange={(v) => {
                    setTarget(v as NotificationTargetValue);
                    setOrganizationId('');
                    setUserId('');
                }}
            />

            {target === 'ORGANIZATION' && (
                <Select
                    label="Organização"
                    placeholder="Selecione uma organização"
                    options={orgOptions}
                    value={organizationId}
                    onValueChange={setOrganizationId}
                />
            )}

            {target === 'USER' && (
                <Select
                    label="Utilizador"
                    placeholder="Selecione um utilizador"
                    options={userOptions}
                    value={userId}
                    onValueChange={setUserId}
                />
            )}

            <Button
                type="button"
                fullWidth={false}
                disabled={!isValid || isLoading}
                onClick={handleSubmit}
                icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                iconPosition="end"
            >
                {isLoading ? 'A enviar…' : 'Enviar notificação'}
            </Button>
        </div>
    );
}
