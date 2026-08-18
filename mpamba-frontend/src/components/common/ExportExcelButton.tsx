'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { downloadBlob, fileDateSuffix, getDownloadErrorMessage } from '@/shared/utils/download.utils';

interface ExportExcelButtonProps {
	/** Busca o ficheiro na API. Recebe os filtros já aplicados pela página. */
	fetchFile: () => Promise<Blob>;
	/** Nome do ficheiro sem extensão nem data — ambas são acrescentadas aqui. */
	filename: string;
	label?: string;
	/** Desliga o botão quando a página ainda não tem filtros válidos. */
	disabled?: boolean;
	variant?: 'default' | 'outline' | 'secondary' | 'ghost';
	className?: string;
}

/**
 * Botão de exportação para Excel.
 *
 * Centraliza o que é igual em todos os relatórios: estado de carregamento,
 * download do Blob e leitura da mensagem de erro (que num pedido `blob` não
 * está acessível pelo tratamento normal de erros da API).
 */
export function ExportExcelButton({
	fetchFile,
	filename,
	label = 'Exportar Excel',
	disabled = false,
	variant = 'outline',
	className,
}: ExportExcelButtonProps) {
	const [isExporting, setIsExporting] = useState(false);

	const handleExport = async () => {
		setIsExporting(true);
		try {
			const blob = await fetchFile();
			downloadBlob(blob, `${filename}-${fileDateSuffix()}.xlsx`);
			toast.success('Relatório exportado com sucesso.');
		} catch (error) {
			toast.error(await getDownloadErrorMessage(error, 'Erro ao exportar o relatório.'));
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<Button
			variant={variant}
			onClick={handleExport}
			disabled={disabled || isExporting}
			className={cn('gap-2', className)}
		>
			{isExporting ? (
				<Loader2 size={16} className="animate-spin" />
			) : (
				<FileSpreadsheet size={16} />
			)}
			{isExporting ? 'A exportar…' : label}
		</Button>
	);
}

export default ExportExcelButton;
