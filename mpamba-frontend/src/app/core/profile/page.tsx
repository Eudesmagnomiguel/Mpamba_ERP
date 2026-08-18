'use client';

import { useState } from 'react';
import { User, KeyRound, Loader2, Save, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import Input from '@/components/common/forms/Input';
import Button from '@/components/common/forms/Button';
import { useAuthStore } from '@/store/auth.store';
import { useUpdateProfile } from '@/hooks/core/useAuth';

export default function ProfilePage() {
	const user = useAuthStore((state) => state.user);
	const updateProfileMutation = useUpdateProfile();

	const [name, setName] = useState(user?.name || '');
	const [email, setEmail] = useState(user?.email || '');
	const [username, setUsername] = useState(user?.username || '');

	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	const userInitial = user?.name?.charAt(0)?.toUpperCase();

	const handleSaveInfo = async () => {
		try {
			await updateProfileMutation.mutateAsync({
				name,
				email,
				username: username.trim() || undefined,
			});
			toast.success('Perfil atualizado com sucesso!');
		} catch (err: any) {
			toast.error(err.response?.data?.message || 'Erro ao atualizar perfil.');
		}
	};

	const handleSavePassword = async () => {
		if (!currentPassword || !newPassword) {
			toast.error('Preencha a palavra-passe atual e a nova.');
			return;
		}
		if (newPassword !== confirmPassword) {
			toast.error('A confirmação não coincide com a nova palavra-passe.');
			return;
		}
		try {
			await updateProfileMutation.mutateAsync({ currentPassword, newPassword });
			toast.success('Palavra-passe alterada com sucesso!');
			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
		} catch (err: any) {
			toast.error(err.response?.data?.message || 'Erro ao alterar a palavra-passe.');
		}
	};

	return (
		<div className="max-w-3xl mx-auto space-y-8 pb-16">
			<div>
				<p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Conta</p>
				<h1 className="text-xl font-bold text-slate-900 tracking-tight">Perfil do Utilizador</h1>
				<p className="text-slate-500 text-sm mt-1">Os seus dados pessoais e credenciais de acesso.</p>
			</div>

			{/* ── IDENTIDADE ── */}
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="px-6 py-5 flex items-center gap-4">
					<div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent-warm text-white font-black text-xl flex items-center justify-center shadow-md shadow-primary/20 uppercase shrink-0 select-none ring-4 ring-primary/5">
						{userInitial ?? <User size={22} />}
					</div>
					<div className="min-w-0">
						<p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
						<p className="text-xs text-slate-500 truncate">{user?.email}</p>
						{user?.organization?.name && (
							<div className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
								<ShieldCheck size={11} className="text-primary" />
								{user.role} · {user.organization.name}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* ── DADOS PESSOAIS ── */}
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
					<User size={16} className="text-primary" />
					<h2 className="text-sm font-bold text-slate-800">Dados Pessoais</h2>
				</div>
				<div className="p-6 space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Input label="Nome Completo" value={name} onChange={(e) => setName(e.target.value)} />
						<Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
					</div>
					<Input
						label="Nome de Utilizador (opcional)"
						placeholder="Ex: joao.fernandes"
						value={username}
						onChange={(e) => setUsername(e.target.value.trim().toLowerCase())}
						helperText="Permite entrar na plataforma com este nome, além do email."
					/>

					<div className="flex justify-end pt-2">
						<Button
							type="button"
							fullWidth={false}
							onClick={handleSaveInfo}
							disabled={updateProfileMutation.isPending}
							icon={updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
							iconPosition="end"
						>
							{updateProfileMutation.isPending ? 'A guardar…' : 'Guardar dados'}
						</Button>
					</div>
				</div>
			</div>

			{/* ── SEGURANÇA ── */}
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
					<KeyRound size={16} className="text-primary" />
					<h2 className="text-sm font-bold text-slate-800">Alterar Palavra-passe</h2>
				</div>
				<div className="p-6 space-y-4">
					<Input
						label="Palavra-passe Atual"
						type="password"
						showPasswordToggle
						value={currentPassword}
						onChange={(e) => setCurrentPassword(e.target.value)}
					/>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Input
							label="Nova Palavra-passe"
							type="password"
							showPasswordToggle
							placeholder="Mínimo 6 caracteres"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
						/>
						<Input
							label="Confirmar Nova Palavra-passe"
							type="password"
							showPasswordToggle
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
						/>
					</div>

					<div className="flex justify-end pt-2">
						<Button
							type="button"
							fullWidth={false}
							onClick={handleSavePassword}
							disabled={updateProfileMutation.isPending}
							icon={updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
							iconPosition="end"
						>
							{updateProfileMutation.isPending ? 'A alterar…' : 'Alterar palavra-passe'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
