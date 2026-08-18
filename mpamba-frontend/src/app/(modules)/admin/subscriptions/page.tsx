
'use client';
 
import { useState } from 'react';
import { 
	Search, 
	MoreHorizontal, 
	CreditCard, 
	Calendar,
	Clock,
	Loader2,
	PauseCircle,
	PlayCircle,
	CalendarPlus,
	Ban,
	ExternalLink,
	Check,
	Zap,
	Send,
	History,
	ChevronDown,
	RefreshCw,
	ArrowUpRight,
	AlarmClockOff,
	Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
	useSubscriptions,
	useSuspendSubscription,
	useResumeSubscription,
	useCancelSubscription,
	useExtendSubscription,
	useExpireSubscription,
	useChangeSubscriptionPlan
} from '@/hooks/core/useSubscription';
import { usePlans } from '@/hooks/core/usePlan';
import { 
	useAllSubscriptionRequests, 
	useApproveSubscriptionRequest, 
	useRejectSubscriptionRequest 
} from '@/hooks/core/useSubscriptionRequest';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
	DropdownMenu, 
	DropdownMenuContent, 
	DropdownMenuItem, 
	DropdownMenuTrigger,
	DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import Button from '@/components/common/forms/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 
export default function SubscriptionsPage() {
	const [activeTab, setActiveTab] = useState('subscriptions');
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('ALL');
	
	const [selectedSub, setSelectedSub] = useState<any>(null);
	const [selectedRequest, setSelectedRequest] = useState<any>(null);
	const [isSuspendOpen, setIsSuspendOpen] = useState(false);
	const [isCancelOpen, setIsCancelOpen] = useState(false);
	const [isExtendOpen, setIsExtendOpen] = useState(false);
	const [isExpireOpen, setIsExpireOpen] = useState(false);
	const [isApproveOpen, setIsApproveOpen] = useState(false);
	const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
	const [actionReason, setActionReason] = useState('');
	const [extendMonths, setExtendMonths] = useState(1);
	const [newPlanId, setNewPlanId] = useState('');
	// Track which request row is loading (by id)
	const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null);

	const { data: subsData, isLoading: isSubsLoading } = useSubscriptions({
		status: statusFilter !== 'ALL' ? statusFilter as any : undefined
	});

	const { data: requestsData, isLoading: isRequestsLoading } = useAllSubscriptionRequests();
	const { data: plansData } = usePlans({ pageSize: 100 });

	const suspendMutation = useSuspendSubscription();
	const resumeMutation = useResumeSubscription();
	const cancelMutation = useCancelSubscription();
	const extendMutation = useExtendSubscription();
	const expireMutation = useExpireSubscription();
	const changePlanMutation = useChangeSubscriptionPlan();
	const approveMutation = useApproveSubscriptionRequest();
	const rejectMutation = useRejectSubscriptionRequest();
 
	const handleSuspend = async () => {
		if (!selectedSub) return;
		try {
			await suspendMutation.mutateAsync({ 
				organizationId: selectedSub.organizationId, 
				data: { reason: actionReason || "Suspensão administrativa" } 
			});
			toast.success("Subscrição suspensa com sucesso!");
			setIsSuspendOpen(false);
			setActionReason('');
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Erro ao suspender subscrição.");
		}
	};
 
	const handleResume = async (orgId: string) => {
		try {
			await resumeMutation.mutateAsync(orgId);
			toast.success("Subscrição reativada com sucesso!");
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Erro ao reativar subscrição.");
		}
	};

	const handleExtend = async () => {
		if (!selectedSub) return;
		try {
			await extendMutation.mutateAsync({
				organizationId: selectedSub.organizationId,
				data: { months: extendMonths }
			});
			toast.success(`Subscrição estendida por ${extendMonths} mês(es) e ativada!`);
			setIsExtendOpen(false);
			setExtendMonths(1);
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Erro ao estender subscrição.");
		}
	};

	const handleExpire = async () => {
		if (!selectedSub) return;
		try {
			await expireMutation.mutateAsync(selectedSub.organizationId);
			toast.success("Subscrição marcada como expirada.");
			setIsExpireOpen(false);
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Erro ao marcar subscrição como expirada.");
		}
	};

	const handleChangePlan = async () => {
		if (!selectedSub || !newPlanId) return;
		try {
			await changePlanMutation.mutateAsync({
				organizationId: selectedSub.organizationId,
				data: { planId: newPlanId }
			});
			toast.success("Plano da subscrição alterado com sucesso!");
			setIsChangePlanOpen(false);
			setNewPlanId('');
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Erro ao mudar o plano da subscrição.");
		}
	};

	const handleCancel = async () => {
		if (!selectedSub) return;
		try {
			await cancelMutation.mutateAsync({
				organizationId: selectedSub.organizationId,
				data: { reason: actionReason || "Cancelamento administrativo" }
			});
			toast.success("Subscrição cancelada com sucesso!");
			setIsCancelOpen(false);
			setActionReason('');
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Erro ao cancelar subscrição.");
		}
	};
 
	const handleApproveRequest = async () => {
		if (!selectedRequest) return;
		setLoadingRequestId(selectedRequest.id);
		try {
			await approveMutation.mutateAsync({
				id: selectedRequest.id,
				adminResponse: actionReason
			});
			toast.success("Pedido aprovado! A subscrição da organização foi ativada.");
			setIsApproveOpen(false);
			setActionReason('');
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Erro ao aprovar pedido.");
		} finally {
			setLoadingRequestId(null);
		}
	};
 
	// Open modal and track which row triggered it
	const openApproveModal = (req: any) => {
		setSelectedRequest(req);
		setIsApproveOpen(true);
	};
 
	const filteredSubs = subsData?.data?.filter(sub => 
		sub.organization?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		sub.plan?.name.toLowerCase().includes(searchTerm.toLowerCase())
	) || [];
 
	const filteredRequests = (requestsData || []).filter(req => 
		req.organization?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		req.plan?.name.toLowerCase().includes(searchTerm.toLowerCase())
	);
 
	const pendingCount = (requestsData || []).filter(r => r.status === 'PENDING').length;
 
	return (
		<div className="space-y-8 pb-16">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
				<div>
					<p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Plataforma</p>
					<h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Subscrições</h1>
					<p className="text-slate-500 text-sm mt-1">Gerir planos, acessos e pedidos de todas as organizações.</p>
				</div>
				
				{pendingCount > 0 && (
					<div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 shadow-sm">
						<div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
						<span className="text-xs font-semibold">
							{pendingCount} pedido{pendingCount > 1 ? 's' : ''} aguarda{pendingCount === 1 ? '' : 'm'} aprovação
						</span>
					</div>
				)}
			</div>
 
			<Tabs defaultValue="subscriptions" className="w-full" onValueChange={setActiveTab}>
				{/* Tabs + Filters bar */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
					<TabsList className="bg-slate-100 p-1 rounded-lg w-full md:w-auto h-auto gap-0.5">
						<TabsTrigger 
							value="subscriptions" 
							className="text-xs font-semibold px-5 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 transition-all"
						>
							Subscrições
						</TabsTrigger>
						<TabsTrigger 
							value="requests" 
							className="text-xs font-semibold px-5 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 transition-all relative"
						>
							Pedidos
							{pendingCount > 0 && (
								<span className="ml-2 inline-flex items-center justify-center h-4 min-w-4 px-1 bg-rose-500 text-white rounded-full text-[9px] font-bold">
									{pendingCount}
								</span>
							)}
						</TabsTrigger>
					</TabsList>
 
					<div className="flex items-center gap-3 w-full md:w-auto">
						{/* Search */}
						<div className="relative flex-1 md:w-72 group">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={14} />
							<input 
								type="text" 
								placeholder="Buscar organização ou plano…" 
								className="w-full h-9 bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 outline-none transition-all shadow-sm"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
						
						{/* Status filter — only on subscriptions tab */}
						{activeTab === 'subscriptions' && (
							<div className="relative">
								<select 
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
									className="h-9 appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 text-xs font-medium text-slate-600 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 transition-all cursor-pointer shadow-sm"
								>
									<option value="ALL">Todos os estados</option>
									<option value="ACTIVE">Ativas</option>
									<option value="SUSPENDED">Suspensas</option>
									<option value="EXPIRED">Expiradas</option>
									<option value="CANCELLED">Canceladas</option>
								</select>
								<ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
							</div>
						)}
					</div>
				</div>
 
				{/* ── SUBSCRIPTIONS TAB ── */}
				<TabsContent value="subscriptions" className="mt-0">
					<div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
						<div className="overflow-x-auto">
							<table className="w-full text-left">
								<thead>
									<tr className="border-b border-slate-100">
										<th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Organização</th>
										<th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Plano Atual</th>
										<th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Início / Expiração</th>
										<th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">Auto-renovar</th>
										<th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
										<th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Ações</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-50">
									{isSubsLoading ? (
										<tr>
											<td colSpan={6} className="px-6 py-24 text-center">
												<Loader2 size={28} className="text-slate-300 animate-spin mx-auto" />
											</td>
										</tr>
									) : filteredSubs.length === 0 ? (
										<tr>
											<td colSpan={6} className="px-6 py-24 text-center">
												<CreditCard size={36} className="mx-auto text-slate-200 mb-3" />
												<p className="text-sm font-medium text-slate-400">Nenhuma subscrição encontrada</p>
											</td>
										</tr>
									) : (
										filteredSubs.map((sub) => (
											<tr key={sub.id} className="hover:bg-slate-50/70 transition-colors group">
												{/* Org */}
												<td className="px-6 py-4">
													<div className="flex items-center gap-3">
														<div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
															{sub.organization?.name.charAt(0).toUpperCase()}
														</div>
														<div>
															<p className="text-sm font-semibold text-slate-800 leading-tight">{sub.organization?.name}</p>
															<p className="text-[11px] text-slate-400 mt-0.5">{sub.organization?.email}</p>
														</div>
													</div>
												</td>
 
												{/* Plan — white card style */}
												<td className="px-6 py-4">
													<div className="inline-flex items-center gap-2.5 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
														<div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
														<div>
															<p className="text-xs font-semibold text-slate-800 leading-none">{sub.plan?.name}</p>
															<p className="text-[10px] text-slate-400 mt-0.5 font-medium">{(sub.plan?.price || 0).toLocaleString()} AOA</p>
														</div>
													</div>
												</td>
 
												{/* Dates */}
												<td className="px-6 py-4">
													<div className="space-y-1">
														<div className="flex items-center gap-1.5 text-[11px] text-slate-500">
															<Calendar size={11} className="text-emerald-500 shrink-0" />
															{sub.startDate ? format(new Date(sub.startDate), 'dd MMM yyyy') : '—'}
														</div>
														<div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
															<Clock size={11} className={cn("shrink-0", sub.status === 'EXPIRED' ? "text-rose-400" : "text-amber-400")} />
															{sub.endDate ? format(new Date(sub.endDate), 'dd MMM yyyy') : '—'}
														</div>
													</div>
												</td>
 
												{/* Auto-renew */}
												<td className="px-6 py-4 text-center">
													<span className={cn(
														"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
														sub.autoRenew 
															? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
															: "bg-slate-100 text-slate-400"
													)}>
														{sub.autoRenew && <RefreshCw size={9} />}
														{sub.autoRenew ? 'Sim' : 'Não'}
													</span>
												</td>
 
												{/* Status */}
												<td className="px-6 py-4">
													<span className={cn(
														"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border",
														sub.status === 'ACTIVE'    && "bg-emerald-50 text-emerald-700 border-emerald-100",
														sub.status === 'SUSPENDED' && "bg-amber-50 text-amber-700 border-amber-100",
														sub.status === 'EXPIRED'   && "bg-rose-50 text-rose-600 border-rose-100",
														sub.status === 'CANCELLED' && "bg-slate-100 text-slate-500 border-slate-200"
													)}>
														<span className={cn(
															"w-1.5 h-1.5 rounded-full",
															sub.status === 'ACTIVE'    && "bg-emerald-400",
															sub.status === 'SUSPENDED' && "bg-amber-400",
															sub.status === 'EXPIRED'   && "bg-rose-400",
															sub.status === 'CANCELLED' && "bg-slate-400"
														)} />
														{sub.status === 'ACTIVE'    && 'Ativa'}
														{sub.status === 'SUSPENDED' && 'Suspensa'}
														{sub.status === 'EXPIRED'   && 'Expirada'}
														{sub.status === 'CANCELLED' && 'Cancelada'}
													</span>
												</td>
 
												{/* Actions */}
												<td className="px-6 py-4 text-right">
													<DropdownMenu>
														<DropdownMenuTrigger className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all outline-none border border-transparent hover:border-slate-200">
															<MoreHorizontal size={16} />
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end" className="w-52 p-1.5 border-slate-200 rounded-xl shadow-xl shadow-slate-200/80">
															<DropdownMenuItem className="flex items-center gap-2.5 text-xs font-medium text-slate-600 px-3 py-2.5 rounded-lg cursor-pointer">
																<ExternalLink size={13} className="text-slate-400" /> Ver organização
															</DropdownMenuItem>
															
															<DropdownMenuSeparator className="bg-slate-100 my-1" />
															
															{sub.status === 'ACTIVE' ? (
																<DropdownMenuItem
																	onClick={() => { setSelectedSub(sub); setIsSuspendOpen(true); }}
																	className="flex items-center gap-2.5 text-xs font-medium text-amber-600 px-3 py-2.5 rounded-lg cursor-pointer"
																>
																	<PauseCircle size={13} /> Suspender acesso
																</DropdownMenuItem>
															) : sub.status === 'EXPIRED' ? (
																<DropdownMenuItem
																	onClick={() => { setSelectedSub(sub); setExtendMonths(1); setIsExtendOpen(true); }}
																	className="flex items-center gap-2.5 text-xs font-medium text-emerald-600 px-3 py-2.5 rounded-lg cursor-pointer"
																>
																	<PlayCircle size={13} /> Renovar / Ativar
																</DropdownMenuItem>
															) : (
																<DropdownMenuItem
																	onClick={() => handleResume(sub.organizationId)}
																	className="flex items-center gap-2.5 text-xs font-medium text-emerald-600 px-3 py-2.5 rounded-lg cursor-pointer"
																>
																	<PlayCircle size={13} /> Reativar acesso
																</DropdownMenuItem>
															)}

															<DropdownMenuItem
																onClick={() => { setSelectedSub(sub); setExtendMonths(1); setIsExtendOpen(true); }}
																className="flex items-center gap-2.5 text-xs font-medium text-blue-600 px-3 py-2.5 rounded-lg cursor-pointer"
															>
																<CalendarPlus size={13} /> Estender prazo
															</DropdownMenuItem>

															<DropdownMenuItem
																onClick={() => { setSelectedSub(sub); setNewPlanId(sub.planId || ''); setIsChangePlanOpen(true); }}
																className="flex items-center gap-2.5 text-xs font-medium text-violet-600 px-3 py-2.5 rounded-lg cursor-pointer"
															>
																<Layers size={13} /> Trocar plano
															</DropdownMenuItem>

															{sub.status !== 'EXPIRED' && (
																<DropdownMenuItem
																	onClick={() => { setSelectedSub(sub); setIsExpireOpen(true); }}
																	className="flex items-center gap-2.5 text-xs font-medium text-orange-600 px-3 py-2.5 rounded-lg cursor-pointer"
																>
																	<AlarmClockOff size={13} /> Marcar como expirada
																</DropdownMenuItem>
															)}

															<DropdownMenuSeparator className="bg-slate-100 my-1" />

															<DropdownMenuItem
																onClick={() => { setSelectedSub(sub); setIsCancelOpen(true); }}
																className="flex items-center gap-2.5 text-xs font-medium text-rose-600 px-3 py-2.5 rounded-lg cursor-pointer"
															>
																<Ban size={13} /> Cancelar subscrição
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>
				</TabsContent>
 
				{/* ── REQUESTS TAB ── */}
				<TabsContent value="requests" className="mt-0">
					<div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
						<div className="overflow-x-auto">
							<table className="w-full text-left">
								<thead>
									<tr className="border-b border-slate-100">
										<th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Organização</th>
										<th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tipo</th>
										<th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Plano Alvo</th>
										<th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Referência</th>
										<th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Data</th>
										<th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
										<th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Ação</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-50">
									{isRequestsLoading ? (
										<tr>
											<td colSpan={7} className="px-6 py-24 text-center">
												<Loader2 size={28} className="text-slate-300 animate-spin mx-auto" />
											</td>
										</tr>
									) : filteredRequests.length === 0 ? (
										<tr>
											<td colSpan={7} className="px-6 py-24 text-center">
												<History size={36} className="mx-auto text-slate-200 mb-3" />
												<p className="text-sm font-medium text-slate-400">Nenhum pedido encontrado</p>
											</td>
										</tr>
									) : (
										filteredRequests.map((req: any) => {
											const isThisRowLoading = loadingRequestId === req.id;
											return (
												<tr key={req.id} className="hover:bg-slate-50/70 transition-colors group">
													{/* Org */}
													<td className="px-6 py-4">
														<div className="flex items-center gap-3">
															<div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
																{req.organization?.name.charAt(0).toUpperCase()}
															</div>
															<div>
																<p className="text-sm font-semibold text-slate-800">{req.organization?.name}</p>
																<p className="text-[11px] text-slate-400 mt-0.5">{req.organization?.email}</p>
															</div>
														</div>
													</td>
 
													{/* Type */}
													<td className="px-6 py-4">
														<span className={cn(
															"inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md border",
															req.type === 'RENEWAL' 
																? "bg-blue-50 text-blue-600 border-blue-100" 
																: "bg-violet-50 text-violet-600 border-violet-100"
														)}>
															{req.type === 'RENEWAL' ? <RefreshCw size={10} /> : <ArrowUpRight size={10} />}
															{req.type === 'RENEWAL' ? 'Renovação' : 'Upgrade'}
														</span>
													</td>
 
													{/* Target plan — white card */}
													<td className="px-6 py-4">
														<div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
															<div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
															<span className="text-xs font-semibold text-slate-700">{req.plan?.name}</span>
														</div>
													</td>

													{/* Payment reference */}
													<td className="px-6 py-4">
														{req.paymentReference ? (
															<span className="text-xs font-mono font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
																{req.paymentReference}
															</span>
														) : (
															<span className="text-[11px] text-slate-400 font-medium">—</span>
														)}
													</td>

													{/* Date */}
													<td className="px-6 py-4 text-[11px] text-slate-500">
														{format(new Date(req.createdAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}
													</td>
 
													{/* Status */}
													<td className="px-6 py-4">
														<span className={cn(
															"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border",
															req.status === 'PENDING'  && "bg-amber-50 text-amber-700 border-amber-100",
															req.status === 'APPROVED' && "bg-emerald-50 text-emerald-700 border-emerald-100",
															req.status === 'REJECTED' && "bg-rose-50 text-rose-600 border-rose-100"
														)}>
															<span className={cn(
																"w-1.5 h-1.5 rounded-full",
																req.status === 'PENDING'  && "bg-amber-400",
																req.status === 'APPROVED' && "bg-emerald-400",
																req.status === 'REJECTED' && "bg-rose-400"
															)} />
															{req.status === 'PENDING'  && 'Pendente'}
															{req.status === 'APPROVED' && 'Processado'}
															{req.status === 'REJECTED' && 'Recusado'}
														</span>
													</td>
 
													{/* Action — per-row loader */}
													<td className="px-6 py-4 text-right">
														{req.status === 'PENDING' ? (
															<button 
																onClick={() => openApproveModal(req)}
																disabled={isThisRowLoading}
																className={cn(
																	"inline-flex items-center gap-2 h-8 px-4 rounded-lg text-[11px] font-semibold transition-all shadow-sm",
																	isThisRowLoading
																		? "bg-emerald-100 text-emerald-400 cursor-not-allowed"
																		: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:shadow-emerald-300"
																)}
															>
																{isThisRowLoading ? (
																	<>
																		<Loader2 size={12} className="animate-spin" />
																		A processar…
																	</>
																) : (
																	<>
																		<Check size={12} />
																		Ativar Assinatura
																	</>
																)}
															</button>
														) : (
															<span className="text-[11px] text-slate-400 font-medium">
																{req.status === 'APPROVED' ? 'Ativado' : 'Encerrado'}
															</span>
														)}
													</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>
					</div>
				</TabsContent>
			</Tabs>
 
			{/* ── APPROVAL MODAL ── */}
			<Dialog open={isApproveOpen} onOpenChange={(open) => { setIsApproveOpen(open); if (!open) setActionReason(''); }}>
				<DialogContent className="sm:max-w-[440px] rounded-2xl border-slate-200 shadow-2xl p-0 overflow-hidden">
					{/* Modal header stripe */}
					<div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
					<div className="p-6">
						<DialogHeader className="mb-5">
							<DialogTitle className="text-base font-bold text-slate-900">Aprovar pedido de subscrição</DialogTitle>
							<DialogDescription className="text-sm text-slate-500 mt-1.5 leading-relaxed">
								A subscrição do plano{' '}
								<span className="font-semibold text-slate-700">{selectedRequest?.plan?.name}</span>{' '}
								será ativada diretamente para a{' '}
								<span className="font-semibold text-slate-700">{selectedRequest?.organization?.name}</span>.
							</DialogDescription>
						</DialogHeader>
 
						<div className="space-y-4">
							<div>
								<label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
									Mensagem ao cliente <span className="text-slate-400 font-normal normal-case tracking-normal">(opcional)</span>
								</label>
								<textarea 
									className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all min-h-[100px] resize-none"
									placeholder="Ex: O seu pedido foi aprovado. O novo plano já está ativo na sua organização."
									value={actionReason}
									onChange={(e) => setActionReason(e.target.value)}
								/>
							</div>
						</div>
 
						<DialogFooter className="mt-6 gap-2.5 flex-row justify-end">
							<button 
								onClick={() => setIsApproveOpen(false)}
								className="h-9 px-5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
							>
								Cancelar
							</button>
							<button 
								onClick={handleApproveRequest}
								disabled={approveMutation.isPending}
								className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shadow-sm"
							>
								{approveMutation.isPending ? (
									<><Loader2 size={14} className="animate-spin" /> A processar…</>
								) : (
									<><Send size={14} /> Ativar Assinatura</>
								)}
							</button>
						</DialogFooter>
					</div>
				</DialogContent>
			</Dialog>
 
			{/* ── SUSPEND MODAL ── */}
			<Dialog open={isSuspendOpen} onOpenChange={(open) => { setIsSuspendOpen(open); if (!open) setActionReason(''); }}>
				<DialogContent className="sm:max-w-[440px] rounded-2xl border-slate-200 shadow-2xl p-0 overflow-hidden">
					<div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-amber-500" />
					<div className="p-6">
						<DialogHeader className="mb-5">
							<DialogTitle className="text-base font-bold text-slate-900">Suspender acesso</DialogTitle>
							<DialogDescription className="text-sm text-slate-500 mt-1.5 leading-relaxed">
								A organização <span className="font-semibold text-slate-700">{selectedSub?.organization?.name}</span> perderá o acesso de escrita imediatamente.
							</DialogDescription>
						</DialogHeader>
 
						<div>
							<label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Motivo da suspensão</label>
							<textarea 
								className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none transition-all min-h-[100px] resize-none"
								placeholder="Descreva o motivo desta suspensão…"
								value={actionReason}
								onChange={(e) => setActionReason(e.target.value)}
							/>
						</div>
 
						<DialogFooter className="mt-6 gap-2.5 flex-row justify-end">
							<button 
								onClick={() => setIsSuspendOpen(false)}
								className="h-9 px-5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
							>
								Cancelar
							</button>
							<button 
								onClick={handleSuspend}
								disabled={suspendMutation.isPending}
								className="h-9 px-5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shadow-sm"
							>
								{suspendMutation.isPending ? (
									<><Loader2 size={14} className="animate-spin" /> A suspender…</>
								) : (
									<><PauseCircle size={14} /> Confirmar suspensão</>
								)}
							</button>
						</DialogFooter>
					</div>
				</DialogContent>
			</Dialog>

			{/* ── EXTEND MODAL ── */}
			<Dialog open={isExtendOpen} onOpenChange={(open) => { setIsExtendOpen(open); if (!open) setExtendMonths(1); }}>
				<DialogContent className="sm:max-w-[440px] rounded-2xl border-slate-200 shadow-2xl p-0 overflow-hidden">
					<div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-blue-600" />
					<div className="p-6">
						<DialogHeader className="mb-5">
							<DialogTitle className="text-base font-bold text-slate-900">Estender / Renovar subscrição</DialogTitle>
							<DialogDescription className="text-sm text-slate-500 mt-1.5 leading-relaxed">
								A subscrição de <span className="font-semibold text-slate-700">{selectedSub?.organization?.name}</span> será ativada e a data de expiração estendida.
							</DialogDescription>
						</DialogHeader>

						<div>
							<label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Número de meses</label>
							<input
								type="number"
								min={1}
								max={60}
								value={extendMonths}
								onChange={(e) => setExtendMonths(Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))}
								className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
							/>
						</div>

						<DialogFooter className="mt-6 gap-2.5 flex-row justify-end">
							<button
								onClick={() => setIsExtendOpen(false)}
								className="h-9 px-5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
							>
								Cancelar
							</button>
							<button
								onClick={handleExtend}
								disabled={extendMutation.isPending}
								className="h-9 px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shadow-sm"
							>
								{extendMutation.isPending ? (
									<><Loader2 size={14} className="animate-spin" /> A estender…</>
								) : (
									<><CalendarPlus size={14} /> Confirmar</>
								)}
							</button>
						</DialogFooter>
					</div>
				</DialogContent>
			</Dialog>

			{/* ── CHANGE PLAN MODAL ── */}
			<Dialog open={isChangePlanOpen} onOpenChange={(open) => { setIsChangePlanOpen(open); if (!open) setNewPlanId(''); }}>
				<DialogContent className="sm:max-w-[440px] rounded-2xl border-slate-200 shadow-2xl p-0 overflow-hidden">
					<div className="h-1.5 w-full bg-gradient-to-r from-violet-400 to-violet-600" />
					<div className="p-6">
						<DialogHeader className="mb-5">
							<DialogTitle className="text-base font-bold text-slate-900">Trocar plano da subscrição</DialogTitle>
							<DialogDescription className="text-sm text-slate-500 mt-1.5 leading-relaxed">
								A subscrição de <span className="font-semibold text-slate-700">{selectedSub?.organization?.name}</span> passará para o novo plano e os módulos da organização serão atualizados de imediato.
							</DialogDescription>
						</DialogHeader>

						<div>
							<label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Novo plano</label>
							<div className="relative">
								<select
									value={newPlanId}
									onChange={(e) => setNewPlanId(e.target.value)}
									className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none transition-all cursor-pointer"
								>
									<option value="" disabled>Selecione um plano</option>
									{(plansData?.data || []).map((plan) => (
										<option key={plan.id} value={plan.id}>
											{plan.name} — {(plan.price || 0).toLocaleString()} AOA
										</option>
									))}
								</select>
								<ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
							</div>
						</div>

						<DialogFooter className="mt-6 gap-2.5 flex-row justify-end">
							<button
								onClick={() => setIsChangePlanOpen(false)}
								className="h-9 px-5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
							>
								Cancelar
							</button>
							<button
								onClick={handleChangePlan}
								disabled={changePlanMutation.isPending || !newPlanId}
								className="h-9 px-5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shadow-sm"
							>
								{changePlanMutation.isPending ? (
									<><Loader2 size={14} className="animate-spin" /> A processar…</>
								) : (
									<><Layers size={14} /> Confirmar troca</>
								)}
							</button>
						</DialogFooter>
					</div>
				</DialogContent>
			</Dialog>

			{/* ── EXPIRE MODAL ── */}
			<Dialog open={isExpireOpen} onOpenChange={setIsExpireOpen}>
				<DialogContent className="sm:max-w-[440px] rounded-2xl border-slate-200 shadow-2xl p-0 overflow-hidden">
					<div className="h-1.5 w-full bg-gradient-to-r from-orange-400 to-orange-500" />
					<div className="p-6">
						<DialogHeader className="mb-5">
							<DialogTitle className="text-base font-bold text-slate-900">Marcar como expirada</DialogTitle>
							<DialogDescription className="text-sm text-slate-500 mt-1.5 leading-relaxed">
								A subscrição de <span className="font-semibold text-slate-700">{selectedSub?.organization?.name}</span> será marcada como expirada imediatamente, revogando o acesso.
							</DialogDescription>
						</DialogHeader>

						<DialogFooter className="mt-6 gap-2.5 flex-row justify-end">
							<button
								onClick={() => setIsExpireOpen(false)}
								className="h-9 px-5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
							>
								Cancelar
							</button>
							<button
								onClick={handleExpire}
								disabled={expireMutation.isPending}
								className="h-9 px-5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shadow-sm"
							>
								{expireMutation.isPending ? (
									<><Loader2 size={14} className="animate-spin" /> A processar…</>
								) : (
									<><AlarmClockOff size={14} /> Confirmar</>
								)}
							</button>
						</DialogFooter>
					</div>
				</DialogContent>
			</Dialog>

			{/* ── CANCEL MODAL ── */}
			<Dialog open={isCancelOpen} onOpenChange={(open) => { setIsCancelOpen(open); if (!open) setActionReason(''); }}>
				<DialogContent className="sm:max-w-[440px] rounded-2xl border-slate-200 shadow-2xl p-0 overflow-hidden">
					<div className="h-1.5 w-full bg-gradient-to-r from-rose-400 to-rose-600" />
					<div className="p-6">
						<DialogHeader className="mb-5">
							<DialogTitle className="text-base font-bold text-slate-900">Cancelar subscrição</DialogTitle>
							<DialogDescription className="text-sm text-slate-500 mt-1.5 leading-relaxed">
								A subscrição de <span className="font-semibold text-slate-700">{selectedSub?.organization?.name}</span> será cancelada e todos os módulos desativados. Esta ação não é reversível automaticamente.
							</DialogDescription>
						</DialogHeader>

						<div>
							<label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Motivo do cancelamento</label>
							<textarea
								className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none transition-all min-h-[100px] resize-none"
								placeholder="Descreva o motivo deste cancelamento…"
								value={actionReason}
								onChange={(e) => setActionReason(e.target.value)}
							/>
						</div>

						<DialogFooter className="mt-6 gap-2.5 flex-row justify-end">
							<button
								onClick={() => setIsCancelOpen(false)}
								className="h-9 px-5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
							>
								Voltar
							</button>
							<button
								onClick={handleCancel}
								disabled={cancelMutation.isPending}
								className="h-9 px-5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shadow-sm"
							>
								{cancelMutation.isPending ? (
									<><Loader2 size={14} className="animate-spin" /> A cancelar…</>
								) : (
									<><Ban size={14} /> Confirmar cancelamento</>
								)}
							</button>
						</DialogFooter>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
 