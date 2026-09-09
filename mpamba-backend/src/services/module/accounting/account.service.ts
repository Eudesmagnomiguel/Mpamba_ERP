import { prisma } from '../../../config/prisma.config.js';
import { BaseAccountingService } from './base.service.js';
import {
	DEFAULT_ACCOUNTS,
	ANCHOR_ACCOUNT_CODES,
	PGC_CLASS_LABELS,
	PGC_DECREE,
	accountClassOf,
	parentCodeOf,
	compareAccountCodes,
	type AccountSide,
} from './default-accounts.constants.js';
import { ACCOUNT_CODE_PATTERN } from '../../../shared/dto/accounting.dto.js';

export class AccountingAccountService extends BaseAccountingService {
	/**
	 * Garante que o plano de contas do PGC-Angola está semeado na organização.
	 *
	 * É idempotente e corre conta a conta em vez de «só se a organização não
	 * tiver nenhuma»: assim uma organização que ficou a meio do plano — ou que
	 * vem da estrutura antiga, remapeada pela migração
	 * `align_chart_of_accounts_pgc_angola` — recebe as contas que faltam e as
	 * ligações de hierarquia sem intervenção manual.
	 *
	 * Não toca no `name` nem no `isActive` das contas que já existem: renomear
	 * uma conta (ex.: 43.1 para o banco concreto) ou desativar uma que não se usa
	 * são decisões da organização. Uma conta do plano que seja apagada volta a
	 * aparecer nesta sincronização — para a esconder, desative-a.
	 */
	async ensureDefaultAccounts(orgId: string) {
		const existing = await prisma.accountingAccount.findMany({
			where: { organizationId: orgId },
			select: { id: true, code: true, class: true, side: true, parentId: true },
		});
		const byCode = new Map(existing.map((account) => [account.code, account]));

		const missing = DEFAULT_ACCOUNTS.filter((template) => !byCode.has(template.code));
		if (missing.length > 0) {
			await prisma.accountingAccount.createMany({
				data: missing.map((template) => ({
					code: template.code,
					name: template.name,
					class: accountClassOf(template.code),
					side: template.side,
					organizationId: orgId,
				})),
				skipDuplicates: true,
			});
		}

		const needsClassOrSideFix = DEFAULT_ACCOUNTS.some((template) => {
			const account = byCode.get(template.code);
			return !!account && (account.side !== template.side || account.class !== accountClassOf(template.code));
		});
		const needsParentFix = DEFAULT_ACCOUNTS.some((template) => {
			const account = byCode.get(template.code);
			if (!account) return false;
			const parentCode = parentCodeOf(template.code);
			const parent = parentCode ? byCode.get(parentCode) : undefined;
			return !!parent && account.parentId !== parent.id;
		});

		if (missing.length === 0 && !needsClassOrSideFix && !needsParentFix) return;

		await this.syncPlanStructure(orgId);
	}

	/**
	 * Segunda passagem da sincronização: alinha `class`, `side` e `parentId` das
	 * contas do plano. Agrupa as contas por valor a escrever para fazer um punhado
	 * de `updateMany` em vez de um update por conta (o plano tem ~250 contas).
	 */
	private async syncPlanStructure(orgId: string) {
		const accounts = await prisma.accountingAccount.findMany({
			where: { organizationId: orgId },
			select: { id: true, code: true, class: true, side: true, parentId: true },
		});
		const byCode = new Map(accounts.map((account) => [account.code, account]));

		const codesBySide = new Map<AccountSide, string[]>();
		const codesByParent = new Map<string, string[]>();

		for (const template of DEFAULT_ACCOUNTS) {
			const account = byCode.get(template.code);
			if (!account) continue;

			if (account.side !== template.side || account.class !== accountClassOf(template.code)) {
				const list = codesBySide.get(template.side) ?? [];
				list.push(template.code);
				codesBySide.set(template.side, list);
			}

			const parentCode = parentCodeOf(template.code);
			const parent = parentCode ? byCode.get(parentCode) : undefined;
			if (parent && account.parentId !== parent.id) {
				const list = codesByParent.get(parent.id) ?? [];
				list.push(template.code);
				codesByParent.set(parent.id, list);
			}
		}

		for (const [side, codes] of codesBySide) {
			// Todos os códigos de um mesmo `side` podem ter classes diferentes, por
			// isso a classe vai por grupo de classe dentro do grupo de `side`.
			const codesByClass = new Map<number, string[]>();
			for (const code of codes) {
				const list = codesByClass.get(accountClassOf(code)) ?? [];
				list.push(code);
				codesByClass.set(accountClassOf(code), list);
			}
			for (const [accountClass, classCodes] of codesByClass) {
				await prisma.accountingAccount.updateMany({
					where: { organizationId: orgId, code: { in: classCodes } },
					data: { side, class: accountClass },
				});
			}
		}

		for (const [parentId, codes] of codesByParent) {
			await prisma.accountingAccount.updateMany({
				where: { organizationId: orgId, code: { in: codes } },
				data: { parentId },
			});
		}
	}

	async listAccounts() {
		const orgId = this.orgId;
		await this.ensureDefaultAccounts(orgId);

		const accounts = await prisma.accountingAccount.findMany({
			where: { organizationId: orgId },
		});

		// A ordenação é feita aqui e não em SQL porque `ORDER BY code` é textual e
		// colocaria 75.2.11 antes de 75.2.9, e 68.10 antes de 68.9.
		return accounts.sort((a, b) => compareAccountCodes(a.code, b.code));
	}

	/**
	 * O plano de contas do PGC para consulta, agrupado por classe.
	 *
	 * É a lista oficial do decreto e não o plano da organização — não lê a base
	 * de dados e é igual para todas as organizações. Serve o ecrã de consulta,
	 * onde se procura uma conta pelo código ou pelo nome antes de a usar num
	 * lançamento.
	 */
	getPgcReference() {
		const classes = Object.keys(PGC_CLASS_LABELS)
			.map(Number)
			.sort((a, b) => a - b)
			.map((accountClass) => ({
				class: accountClass,
				label: PGC_CLASS_LABELS[accountClass]!,
				accounts: DEFAULT_ACCOUNTS.filter((template) => accountClassOf(template.code) === accountClass).map((template) => ({
					code: template.code,
					name: template.name,
					side: template.side,
					parentCode: parentCodeOf(template.code) ?? null,
					// Profundidade na hierarquia: 34 → 0, 34.5 → 1, 34.5.3 → 2.
					level: template.code.split('.').length - 1,
					note: template.note ?? null,
					isAnchor: Object.values(ANCHOR_ACCOUNT_CODES).includes(template.code as any),
				})),
			}));

		return {
			decree: PGC_DECREE,
			totalAccounts: DEFAULT_ACCOUNTS.length,
			classes,
		};
	}

	async getAccountById(id: string) {
		const orgId = this.orgId;
		const account = await prisma.accountingAccount.findFirst({ where: { id, organizationId: orgId } });
		if (!account) throw new Error('Conta contabilística não encontrada');
		return account;
	}

	async createAccount(data: { code: string; name: string; class: number; side: AccountSide; parentId?: string | null }) {
		const orgId = this.orgId;

		if (!ACCOUNT_CODE_PATTERN.test(data.code)) {
			throw new Error('Código inválido. Use a numeração do PGC (ex.: 43, 43.1, 34.5.3), começando pela classe 1 a 8');
		}
		if (data.class !== accountClassOf(data.code)) {
			throw new Error(`O código ${data.code} pertence à classe ${accountClassOf(data.code)} e não à classe ${data.class}`);
		}

		const duplicate = await prisma.accountingAccount.findFirst({ where: { organizationId: orgId, code: data.code } });
		if (duplicate) throw new Error(`Já existe uma conta com o código ${data.code}`);

		// Se não vier mãe explícita, liga à conta que o código indica (34.5.3 → 34.5).
		let parentId = data.parentId ?? null;
		if (!parentId) {
			const parentCode = parentCodeOf(data.code);
			if (parentCode) {
				const parent = await prisma.accountingAccount.findFirst({ where: { organizationId: orgId, code: parentCode } });
				if (!parent) throw new Error(`A conta ${parentCode}, que agrega ${data.code}, ainda não existe`);
				parentId = parent.id;
			}
		}

		return prisma.accountingAccount.create({
			data: {
				code: data.code,
				name: data.name,
				class: data.class,
				side: data.side,
				parentId,
				organizationId: orgId,
			},
		});
	}

	async updateAccount(id: string, data: { name?: string; isActive?: boolean }) {
		const orgId = this.orgId;
		const account = await prisma.accountingAccount.findFirst({ where: { id, organizationId: orgId } });
		if (!account) throw new Error('Conta contabilística não encontrada');

		return prisma.accountingAccount.update({
			where: { id },
			data: {
				...(data.name !== undefined && { name: data.name }),
				...(data.isActive !== undefined && { isActive: data.isActive }),
			},
		});
	}

	async deleteAccount(id: string) {
		const orgId = this.orgId;
		const account = await prisma.accountingAccount.findFirst({ where: { id, organizationId: orgId } });
		if (!account) throw new Error('Conta contabilística não encontrada');

		if (Object.values(ANCHOR_ACCOUNT_CODES).includes(account.code as any)) {
			throw new Error('Esta conta é usada pelos lançamentos automáticos e não pode ser eliminada');
		}

		const linesCount = await prisma.journalEntryLine.count({ where: { accountId: id } });
		if (linesCount > 0) {
			throw new Error('Esta conta já tem lançamentos associados e não pode ser eliminada');
		}

		const childrenCount = await prisma.accountingAccount.count({ where: { parentId: id } });
		if (childrenCount > 0) {
			throw new Error('Esta conta agrega sub-contas. Elimine primeiro as sub-contas');
		}

		await prisma.accountingAccount.delete({ where: { id } });
	}
}

export const accountingAccountService = new AccountingAccountService();
