import PDFDocument from 'pdfkit';

// ─── Types ──────────────────────────────────────────────────────────────────

export type BillingDocumentType = 'FATURA' | 'PROFORMA' | 'NOTA_CREDITO' | 'RECIBO';

/** A4 para impressoras de escritório; THERMAL para impressoras de recibo (80mm) no posto de vendas. */
export type PdfFormat = 'A4' | 'THERMAL';

interface InvoiceItem {
  code?: string | null;         // código do artigo/serviço (coluna "Artigo")
  description: string;
  quantity: number;
  unit?: string | null;         // unidade, ex.: "UN"
  unitPrice: number;
  discount: number;
  total: number;
  vatRate?: number;             // IVA %
  taxRate?: number;             // nome do campo em base de dados
  taxExemptionCode?: string | null;
  taxExemptionReason?: string | null;
}

interface TaxRetention {
  entity: string;      // e.g. "RIR - Rendimentos Profissionais"
  baseAmount: number;
  rate: number;        // e.g. 6.50
  value: number;
}

interface Organization {
  name: string;
  nif: string | null;
  address: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  phone?: string | null;
  fax?: string | null;
  email?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  iban?: string | null;
  logoPath?: string | null;    // caminho local para o ficheiro do logótipo
  logoUrl?: string | null;     // alternativa: caminho/URL guardado na organização
  agtValidationNumber?: string | null;
  taxExemptionCode?: string | null;
  taxExemptionReason?: string | null;
  retentionEntity?: string | null;
  retentionRate?: number | null;
}

export interface BillingDocument {
  type: BillingDocumentType;
  number: string | null;          // e.g. "FT2726S12937N/65"
  series?: string | { prefix: string; year: number } | null;
  date: string | Date;
  dueDate?: string | Date | null;
  status?: string;
  currency: string;        // e.g. "AKZ"
  exchangeRate?: number;

  organization: Organization;

  customerName: string;
  customerNif?: string | null;
  customerAddress?: string | null;
  customerCity?: string | null;
  customerCountry?: string | null;
  customerEmail?: string | null;

  items: InvoiceItem[];

  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;

  retentions?: TaxRetention[];
  requisition?: string | null;
  postalCode?: string | null;
  customerPostalCode?: string | null;
  // Retenção guardada na própria factura (tem precedência sobre a da organização)
  retentionEntity?: string | null;
  retentionRate?: number | null;
  retentionBase?: number | null;
  retentionValue?: number | null;
  copyLabel?: string | null;      // "Original" | "Duplicado" | ...
  paymentCondition?: string | null;
  notes?: string | null;
  softwareValidation?: string | null;
  serviceDate?: string | Date | null;

  // Specific fields
  cancelReason?: string | null;   // for credit notes
  paymentMethod?: string | null;  // for receipts
  reference?: string | null;      // for receipts
  invoiceNumber?: string | null;  // for receipts/credit notes
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('pt-AO');
};

/** Data no formato usado nas facturas fiscais angolanas: 2025-02-09. */
const fmtIso = (d: string | Date | null | undefined) => {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toISOString().slice(0, 10);
};

/** Hora do carregamento, como no bloco "Carga" do modelo: 18:37. */
const fmtTime = (d: string | Date | null | undefined) => {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
};

const COLORS = {
  primary:   '#2B4C7E',   // deep blue
  accent:    '#4A90D9',
  text:      '#222222',
  muted:     '#666666',
  border:    '#CCCCCC',
  rowAlt:    '#F5F8FC',
  white:     '#FFFFFF',
  totalBg:   '#2B4C7E',
  RED:       '#B00020',   // for cancelled/negative
};

const DOCUMENT_LABELS: Record<BillingDocumentType, string> = {
  FATURA: 'Factura',
  PROFORMA: 'Factura Proforma',
  NOTA_CREDITO: 'Nota de Crédito',
  RECIBO: 'Recibo',
};

// ─── Service ─────────────────────────────────────────────────────────────────

export class PDFService {

  async generateInvoicePDF(data: any, format: PdfFormat = 'A4'): Promise<Buffer> {
    return this.generateDocumentPDF({ ...data, type: 'FATURA' }, format);
  }

  async generateProformaPDF(data: any, format: PdfFormat = 'A4'): Promise<Buffer> {
    return this.generateDocumentPDF({ ...data, type: 'PROFORMA' }, format);
  }

  async generateCreditNotePDF(data: any, format: PdfFormat = 'A4'): Promise<Buffer> {
    return this.generateDocumentPDF({ ...data, type: 'NOTA_CREDITO' }, format);
  }

  async generateReceiptPDF(data: any, format: PdfFormat = 'A4'): Promise<Buffer> {
    return this.generateDocumentPDF({ ...data, type: 'RECIBO' }, format);
  }

  async generateDocumentPDF(docData: BillingDocument, format: PdfFormat = 'A4'): Promise<Buffer> {
    if (format === 'THERMAL') return this.generateThermalDocumentPDF(docData);
    return this.generateAgtA4PDF(docData);
  }

  /**
   * Layout A4 no formato fiscal angolano (AGT), seguindo o modelo de referência
   * em docs/factura_modelo.pdf: monocromático, emitente à esquerda, destinatário
   * à direita, grelha de metadados, tabela de linhas, Quadro Resumo de Impostos,
   * Quadro de Retenção, resumo de totais, blocos Carga/Descarga e coordenadas
   * bancárias.
   *
   * As coordenadas são absolutas para que a folha saia sempre com o mesmo
   * desenho independentemente do conteúdo, como nos programas de facturação
   * certificados.
   */
  /**
   * Converte o logótipo guardado na organização em algo que o pdfkit aceite:
   * um data URI passa a Buffer, um URL http(s) é descarregado com timeout curto
   * e um caminho local segue como está. Falhar a obter o logótipo nunca impede
   * a emissão da factura.
   */
  private async resolveLogo(org: Organization): Promise<Buffer | string | null> {
    const source = org.logoPath || org.logoUrl || null;
    if (!source) return null;

    const dataUri = source.match(/^data:image\/[a-z+]+;base64,(.+)$/i);
    if (dataUri?.[1]) return Buffer.from(dataUri[1], 'base64');

    if (/^https?:\/\//i.test(source)) {
      try {
        const response = await fetch(source, { signal: AbortSignal.timeout(3000) });
        if (!response.ok) return null;
        return Buffer.from(await response.arrayBuffer());
      } catch (_) {
        return null;
      }
    }

    return source;
  }

  private async generateAgtA4PDF(docData: BillingDocument): Promise<Buffer> {
    const logo = await this.resolveLogo(docData.organization);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 0,
        size: 'A4',
        info: {
          Title: `${DOCUMENT_LABELS[docData.type]} ${docData.number || 'Rascunho'}`,
          Author: docData.organization.name,
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const org = docData.organization;
      const isReceipt = docData.type === 'RECIBO';

      // ── Geometria da folha ────────────────────────────────────────────────
      const ML = 62;            // margem esquerda
      const MR = 566;           // limite direito do conteúdo
      const CW = MR - ML;       // largura útil
      const SUMMARY_X = 393;    // início da coluna de totais
      const LEFT_BLOCK_R = 368; // limite direito dos quadros da esquerda

      // Colunas da tabela de linhas (valores numéricos alinhados à direita)
      const COL = {
        code: ML,
        desc: 157,
        descW: 180,
        qtyR: 344,
        unit: 352,
        priceR: 440,
        discR: 474,
        vatCode: 482,
        vatR: 518,
        valueR: MR,
      };

      const ITEMS_TOP = 332;
      const ITEMS_LIMIT = 478;  // abaixo disto, as linhas passam para nova página

      // ── Utilitários de desenho ───────────────────────────────────────────
      const rule = (y: number, x1 = ML, x2 = MR, w = 0.4, color = COLORS.text) => {
        doc.moveTo(x1, y).lineTo(x2, y).lineWidth(w).strokeColor(color).stroke();
      };

      const label = (text: string, x: number, y: number, opts: Record<string, unknown> = {}) => {
        doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(7.5).text(text, x, y, opts);
      };

      const value = (text: string, x: number, y: number, opts: Record<string, unknown> = {}) => {
        doc.fillColor(COLORS.text).font('Helvetica').fontSize(7.5).text(text, x, y, opts);
      };

      const numRight = (text: string, right: number, y: number, width = 90) => {
        doc.fillColor(COLORS.text).font('Helvetica').fontSize(7.5)
          .text(text, right - width, y, { width, align: 'right' });
      };

      // ── Dados derivados ──────────────────────────────────────────────────
      const items = docData.items || [];
      const rateOf = (it: InvoiceItem) => it.vatRate ?? it.taxRate ?? 0;

      // Agrupamento por taxa de IVA para o Quadro Resumo de Impostos
      const vatGroups = new Map<number, {
        incidence: number;
        total: number;
        code?: string | null;
        reason?: string | null;
      }>();
      items.forEach((it) => {
        const r = rateOf(it);
        const g = vatGroups.get(r)
          || { incidence: 0, total: 0, code: it.taxExemptionCode, reason: it.taxExemptionReason };
        g.incidence += it.total;
        g.total += it.total * (r / 100);
        if (!g.code) g.code = it.taxExemptionCode;
        if (!g.reason) g.reason = it.taxExemptionReason;
        vatGroups.set(r, g);
      });

      // Retenção na fonte: a guardada na factura tem precedência; caso não
      // exista, aplica-se a parametrização da organização à base tributável.
      const retentionRate = docData.retentionRate ?? org.retentionRate ?? null;
      const retentionEntity = docData.retentionEntity || org.retentionEntity || null;
      const retentionBase = docData.retentionBase ?? docData.subtotal;
      const retentionValue = docData.retentionValue
        ?? (retentionRate ? (retentionBase * retentionRate) / 100 : null);

      // ── Paginação das linhas ─────────────────────────────────────────────
      const rowHeightOf = (it: InvoiceItem) => {
        const h = doc.font('Helvetica').fontSize(7.5)
          .heightOfString(it.description || '', { width: COL.descW });
        return Math.max(13, h + 5);
      };

      const pages: InvoiceItem[][] = [];
      if (isReceipt || items.length === 0) {
        pages.push([]);
      } else {
        let current: InvoiceItem[] = [];
        let cursor = ITEMS_TOP;
        items.forEach((it) => {
          const h = rowHeightOf(it);
          if (cursor + h > ITEMS_LIMIT && current.length > 0) {
            pages.push(current);
            current = [];
            cursor = ITEMS_TOP;
          }
          current.push(it);
          cursor += h;
        });
        pages.push(current);
      }
      const pageCount = pages.length;

      // ── Secções ──────────────────────────────────────────────────────────

      /** Logótipo, emitente à esquerda e destinatário à direita. */
      const drawHeader = (pageIndex: number) => {
        doc.fillColor(COLORS.text).font('Helvetica').fontSize(7.5)
          .text(`Pág.  ${pageIndex + 1}/${pageCount}`, MR - 90, 24, { width: 90, align: 'right' });

        let y = 30;
        if (logo) {
          try {
            doc.image(logo, ML, 18, { height: 72 });
            y = 100;
          } catch (_) {
            // Logótipo inacessível: a factura segue sem imagem em vez de falhar.
          }
        }

        doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.text)
          .text(org.name.toUpperCase(), ML, y, { width: 250 });
        y += 12;

        doc.font('Helvetica').fontSize(7.5);
        const emitterLines = [
          org.nif ? `Contribuinte N.º: ${org.nif}` : null,
          org.address || null,
          org.city || null,
          org.postalCode || null,
          (org.phone || org.fax) ? `Telef. ${org.phone || ''}  Fax. ${org.fax || ''}` : null,
          org.email || null,
        ].filter(Boolean) as string[];

        emitterLines.forEach((line) => {
          doc.text(line, ML, y, { width: 250 });
          y += 12;
        });

        // Destinatário
        let cy = 146;
        value('Exmo.(s) Sr.(s)', 320, cy);
        cy += 14;
        doc.font('Helvetica').fontSize(7.5)
          .text(docData.customerName.toUpperCase(), 320, cy, { width: 246 });
        cy += 12;
        if (docData.customerAddress) {
          doc.text(docData.customerAddress, 320, cy, { width: 246 });
          cy += 12;
        }
        cy += 12;
        if (docData.customerCity) { doc.text(docData.customerCity, 320, cy); cy += 12; }
        if (docData.customerPostalCode) { doc.text(docData.customerPostalCode, 320, cy); }
      };

      /** Título do documento e marca de via ("Original"). */
      const drawTitle = () => {
        const seriesText = typeof docData.series === 'object' && docData.series
          ? `${docData.series.prefix}/${docData.series.year}`
          : (docData.series || '');
        const heading = [DOCUMENT_LABELS[docData.type], docData.number || seriesText || 'RASCUNHO']
          .filter(Boolean).join(' ');

        doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(12.5).text(heading, ML, 232);
        doc.font('Helvetica-Bold').fontSize(7.5)
          .text(docData.copyLabel || 'Original', MR - 90, 240, { width: 90, align: 'right' });
        rule(252, ML, MR, 0.8);
      };

      /** Grelha de metadados: duas linhas de campos, com régua por célula. */
      const drawMetaGrid = () => {
        const cols = [ML, ML + 100, ML + 200, ML + 305, ML + 410];
        const cellW = 95;

        const row = (y: number, cells: Array<{ label: string; value: string } | null>) => {
          cells.forEach((cell, i) => {
            if (!cell) return;
            const x = cols[i] as number;
            label(cell.label, x, y);
            value(cell.value, x, y + 11);
            rule(y + 22, x, x + cellW, 0.4, COLORS.border);
          });
        };

        row(258, [
          { label: 'V/N.º Contrib.', value: docData.customerNif || '' },
          { label: 'Requisição', value: docData.requisition || '' },
          { label: 'Moeda', value: docData.currency },
          { label: 'Câmbio', value: docData.exchangeRate ? fmt(docData.exchangeRate) : '' },
          { label: 'Data', value: fmtIso(docData.date) },
        ]);

        row(288, [
          { label: 'Desconto Comercial', value: fmt(docData.discountTotal || 0) },
          { label: 'Desconto Adicional', value: fmt(0) },
          {
            label: isReceipt ? 'Forma Pagamento' : 'Vencimento',
            value: isReceipt ? (docData.paymentMethod || '') : fmtIso(docData.dueDate),
          },
          { label: 'Condição Pagamento', value: docData.paymentCondition || '' },
          null,
        ]);
      };

      /** Cabeçalho da tabela de linhas. */
      const drawItemsHeader = () => {
        const y = 316;
        label('Artigo', COL.code, y);
        label('Descrição', COL.desc, y);
        label('Qtd.', COL.qtyR - 40, y, { width: 40, align: 'right' });
        label('Un.', COL.unit, y);
        label('Pr. Unitário', COL.priceR - 70, y, { width: 70, align: 'right' });
        label('Desc.', COL.discR - 35, y, { width: 35, align: 'right' });
        label('IVA', COL.vatR - 36, y, { width: 36, align: 'right' });
        label('Valor', COL.valueR - 46, y, { width: 46, align: 'right' });
        rule(328, ML, MR, 0.8);
      };

      /** Linhas do documento. */
      const drawItems = (pageItems: InvoiceItem[]) => {
        let y = ITEMS_TOP;
        pageItems.forEach((it, idx) => {
          const h = rowHeightOf(it);
          value(it.code || String(idx + 1).padStart(4, '0'), COL.code, y);
          value(it.description, COL.desc, y, { width: COL.descW });
          numRight(fmt(it.quantity), COL.qtyR, y, 40);
          value(it.unit || 'UN', COL.unit, y);
          numRight(fmt(it.unitPrice), COL.priceR, y, 70);
          numRight(fmt(it.discount || 0), COL.discR, y, 35);
          if (it.taxExemptionCode) {
            doc.fillColor(COLORS.text).font('Helvetica').fontSize(7)
              .text(`(${it.taxExemptionCode})`, COL.vatCode, y);
          }
          numRight(fmt(rateOf(it)), COL.vatR, y, 20);
          numRight(fmt(it.total), COL.valueR, y, 46);
          y += h;
        });
      };

      /** Corpo do recibo, em vez da tabela de linhas. */
      const drawReceiptBody = () => {
        doc.fillColor(COLORS.text).font('Helvetica').fontSize(9).text(
          `Recebemos de ${docData.customerName} a quantia de ${fmt(docData.total)} ${docData.currency} `
          + `(${numberToWords(docData.total)}), referente à liquidação da factura `
          + `${docData.invoiceNumber || '—'}.`,
          ML, ITEMS_TOP, { width: CW, lineGap: 4 }
        );
      };

      /** Menção legal a meio da folha, exigida pela AGT. */
      const drawLegalNote = () => {
        rule(486, ML, MR, 0.4, COLORS.border);
        const validation = org.agtValidationNumber || docData.softwareValidation;
        const parts = [
          validation
            ? `Processado por programa validado n.º ${validation}`
            : 'Documento processado por computador',
          `Os bens e/ou serviços foram colocados à disposição na data ${fmtIso(docData.serviceDate || docData.date)}`,
          `© ${org.name}`,
        ];
        doc.fillColor(COLORS.muted).font('Helvetica').fontSize(6.5)
          .text(`${parts.join(' | ')} /`, ML, 492, { width: CW });
        rule(504, ML, MR, 0.4, COLORS.border);
      };

      /** Quadro Resumo de Impostos e Quadro de Retenção (coluna esquerda). */
      const drawTaxBlocks = () => {
        let y = 518;
        doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(7.5)
          .text('Quadro Resumo de Impostos', ML, y);
        y += 14;

        label('Taxa/Valor', ML, y);
        label('Incid./Qtd.', 192, y, { width: 60, align: 'right' });
        label('Total', 236, y, { width: 40, align: 'right' });
        label('Motivo Isenção', 294, y);
        y += 11;
        rule(y, ML, LEFT_BLOCK_R, 0.4);
        y += 4;

        if (vatGroups.size === 0) {
          value('—', ML, y);
          y += 13;
        }
        vatGroups.forEach((g, rate) => {
          value(`IVA (${fmt(rate)})`, ML, y);
          const code = g.code || org.taxExemptionCode;
          if (code) value(`(${code})`, 127, y);
          numRight(fmt(g.incidence), 252, y, 60);
          numRight(fmt(g.total), 288, y, 40);
          const reason = g.reason || (rate === 0 ? org.taxExemptionReason : null);
          if (reason) {
            doc.fillColor(COLORS.text).font('Helvetica').fontSize(7)
              .text(reason, 294, y, { width: 96, lineBreak: false });
          }
          y += 13;
        });

        y = Math.max(y + 18, 584);
        doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(7.5)
          .text('Quadro de Retenção', ML, y);
        y += 14;
        label('Entidade', ML, y);
        label('Inc.', 192, y, { width: 60, align: 'right' });
        label('%', 248, y, { width: 40, align: 'right' });
        label('Valor', LEFT_BLOCK_R - 60, y, { width: 60, align: 'right' });
        y += 11;
        rule(y, ML, LEFT_BLOCK_R, 0.4);
        y += 4;

        if (retentionEntity && retentionValue !== null) {
          value(retentionEntity, ML, y, { width: 130 });
          numRight(fmt(retentionBase), 252, y, 60);
          numRight(fmt(retentionRate as number), 288, y, 40);
          numRight(fmt(retentionValue), LEFT_BLOCK_R, y, 60);
        } else {
          value('Sem retenção na fonte', ML, y, { width: 200 });
        }
      };

      /** Resumo de totais (coluna direita) e total geral. */
      const drawTotals = () => {
        // Posições medidas no modelo de referência: primeira linha a 512pt,
        // passo de 11,3pt, "Acerto" destacado a 600 e total geral a 640.
        let y = 512;
        const rows: Array<[string, number]> = [
          ['Mercadoria/Serviços', docData.subtotal],
          ['Desconto Comercial', docData.discountTotal || 0],
          ['Desconto Adicional', 0],
          ['Portes', 0],
          ['Outros Serviços', 0],
          ['Adiantamentos', 0],
          ['IEC/Outras Contribuições', 0],
        ];

        rows.forEach(([lbl, val]) => {
          value(lbl, SUMMARY_X, y);
          numRight(fmt(val), MR, y, 90);
          rule(y + 10, SUMMARY_X, MR, 0.3, COLORS.border);
          y += 11.3;
        });

        // "Acerto" fica destacado das restantes linhas, imediatamente acima do
        // bloco do total, como no modelo.
        value('Acerto', SUMMARY_X, 600);
        numRight(fmt(0), MR, 600, 90);
        rule(611, SUMMARY_X, MR, 0.3, COLORS.border);

        rule(632, SUMMARY_X, MR, 0.8);
        doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(12.5)
          .text(`Total ( ${docData.currency} )`, SUMMARY_X, 640);
        doc.font('Helvetica-Bold').fontSize(12.5)
          .text(fmt(docData.total), MR - 130, 640, { width: 130, align: 'right' });
      };

      /** Blocos Carga / Descarga, com as moradas do emitente e do cliente. */
      const drawLogistics = () => {
        const y0 = 664;
        const cols: Array<{ x: number; title: string; lines: Array<string | null> }> = [
          {
            x: ML,
            title: 'Carga',
            lines: [
              `N/ Morada - ${fmtIso(docData.date)} / ${fmtTime(docData.date)}`,
              org.address || null,
              null,
              org.city || null,
              org.postalCode || null,
              org.country || 'Angola',
            ],
          },
          {
            x: 216,
            title: 'Descarga',
            lines: [
              'V/ Morada',
              docData.customerAddress || null,
              null,
              docData.customerCity || null,
              docData.customerPostalCode || null,
              docData.customerCountry || 'Angola',
            ],
          },
        ];

        cols.forEach((col) => {
          let y = y0;
          doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(7.5).text(col.title, col.x, y);
          y += 11;
          rule(y, col.x, col.x + 150, 0.4);
          y += 4;
          col.lines.forEach((line) => {
            if (line) value(line, col.x, y, { width: 150 });
            y += 11;
          });
        });
      };

      /** Coordenadas bancárias e nota de rodapé da organização. */
      const drawBankDetails = () => {
        let y = 752;
        if (org.bankAccount || org.iban) {
          const bank = org.bankName ? ` ${org.bankName.toUpperCase()}` : '';
          doc.fillColor(COLORS.text).font('Helvetica').fontSize(8.5)
            .text(`COORDENADAS BANCÁRIAS${bank}:`, ML, y, { underline: true });
          y += 13;
          doc.fontSize(8.5);
          if (org.bankAccount) { doc.text(`CONTA Nº ${org.bankAccount}`, ML, y); y += 13; }
          if (org.iban) { doc.text(`IBAN: ${org.iban}`, ML, y); y += 13; }
        }

        if (docData.notes) {
          doc.fillColor(COLORS.muted).font('Helvetica-Oblique').fontSize(6.5)
            .text(docData.notes, ML, Math.max(y + 4, 802), { width: CW });
        }
      };

      // ── Montagem das páginas ─────────────────────────────────────────────
      pages.forEach((pageItems, index) => {
        if (index > 0) doc.addPage();

        drawHeader(index);
        drawTitle();
        drawMetaGrid();

        if (isReceipt) {
          drawReceiptBody();
        } else {
          drawItemsHeader();
          drawItems(pageItems);
        }

        if (index === pageCount - 1) {
          drawLegalNote();
          if (!isReceipt) drawTaxBlocks();
          drawTotals();
          drawLogistics();
          drawBankDetails();
        } else {
          doc.fillColor(COLORS.muted).font('Helvetica-Oblique').fontSize(7)
            .text('continua na página seguinte…', ML, ITEMS_LIMIT + 6, { width: CW, align: 'right' });
        }
      });

      doc.end();
    });
  }

  /**
   * Recibo compacto para impressoras térmicas de 80mm (posto de vendas).
   * A altura da página é estimada a partir do número de linhas de conteúdo,
   * já que o rolo térmico é contínuo — não existe um "A4" de referência.
   */
  private async generateThermalDocumentPDF(docData: BillingDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const W = 227; // ~80mm a 72dpi
      const ML = 10;
      const MR = W - 10;
      const contentW = MR - ML;

      const itemCount = docData.type === 'RECIBO' ? 0 : (docData.items || []).length;
      const estimatedItemLines = itemCount * 2; // descrição + linha de qtd/preço/total
      const baseLines = docData.type === 'RECIBO' ? 26 : 22;
      const H = 90 + (baseLines + estimatedItemLines) * 12;

      const doc = new PDFDocument({
        margin: 0,
        size: [W, H],
        info: {
          Title: `${DOCUMENT_LABELS[docData.type]} ${docData.number || 'Rascunho'}`,
          Author: docData.organization.name,
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      let y = 12;
      const center = (text: string, opts: any = {}) =>
        doc.text(text, ML, y, { width: contentW, align: 'center', ...opts });
      const divider = () => { doc.rect(ML, y, contentW, 0.5).fill(COLORS.border); y += 6; };

      // ── Cabeçalho ────────────────────────────────────────────────────────
      doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(10);
      center(docData.organization.name);
      y += 12;

      doc.font('Helvetica').fontSize(7).fillColor(COLORS.muted);
      if (docData.organization.nif) { center(`NIF: ${docData.organization.nif}`); y += 9; }
      if (docData.organization.address) { center(docData.organization.address); y += 9; }
      if (docData.organization.phone) { center(`Tel: ${docData.organization.phone}`); y += 9; }

      y += 4;
      divider();

      // ── Tipo de documento + meta ──────────────────────────────────────────
      doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(9);
      center(DOCUMENT_LABELS[docData.type]);
      y += 13;

      doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.text);
      doc.text(`Nº: ${docData.number || 'RASCUNHO'}`, ML, y); y += 10;
      doc.text(`Data: ${fmtDate(docData.date)}`, ML, y); y += 10;
      if (docData.type === 'RECIBO' && docData.invoiceNumber) {
        doc.text(`Ref. Fatura: ${docData.invoiceNumber}`, ML, y); y += 10;
      }

      y += 2;
      divider();

      // ── Cliente ───────────────────────────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.text);
      doc.text(docData.customerName || 'Consumidor Final', ML, y, { width: contentW });
      y += 11;
      if (docData.customerNif) {
        doc.font('Helvetica').fontSize(7).fillColor(COLORS.muted);
        doc.text(`NIF: ${docData.customerNif}`, ML, y); y += 10;
      }

      y += 2;
      divider();

      // ── Corpo ─────────────────────────────────────────────────────────────
      if (docData.type === 'RECIBO') {
        doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.text)
          .text(
            `Recebemos de ${docData.customerName} a quantia de ${fmt(docData.total)} ${docData.currency}, referente à liquidação da Fatura ${docData.invoiceNumber || '—'}.`,
            ML, y, { width: contentW, lineGap: 3 }
          );
        y += 40;
        if (docData.paymentMethod) {
          doc.font('Helvetica-Bold').fontSize(7.5).text(`Forma de Pagamento: ${docData.paymentMethod}`, ML, y);
          y += 12;
        }
      } else {
        (docData.items || []).forEach((item) => {
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLORS.text)
            .text(item.description, ML, y, { width: contentW });
          y += 10;
          doc.font('Helvetica').fontSize(7).fillColor(COLORS.muted)
            .text(`${item.quantity} x ${fmt(item.unitPrice)}`, ML, y, { width: contentW - 60 });
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLORS.text)
            .text(fmt(item.total), ML, y, { width: contentW, align: 'right' });
          y += 12;
        });
      }

      y += 2;
      divider();

      // ── Totais ────────────────────────────────────────────────────────────
      if (docData.type !== 'RECIBO') {
        doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.text);
        doc.text('Subtotal', ML, y); doc.text(fmt(docData.subtotal), ML, y, { width: contentW, align: 'right' });
        y += 11;
        if (docData.discountTotal) {
          doc.text('Desconto', ML, y); doc.text(fmt(docData.discountTotal), ML, y, { width: contentW, align: 'right' });
          y += 11;
        }
        doc.text('IVA', ML, y); doc.text(fmt(docData.taxTotal), ML, y, { width: contentW, align: 'right' });
        y += 11;
      }

      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.text);
      doc.text(`TOTAL (${docData.currency})`, ML, y);
      doc.text(fmt(docData.total), ML, y, { width: contentW, align: 'right' });
      y += 16;

      doc.font('Helvetica-Oblique').fontSize(6.5).fillColor(COLORS.muted);
      center(numberToWords(docData.total));
      y += 16;

      divider();

      // ── Rodapé ────────────────────────────────────────────────────────────
      doc.font('Helvetica').fontSize(7).fillColor(COLORS.muted);
      center('Obrigado pela preferência!');
      y += 10;
      if (docData.softwareValidation) {
        doc.font('Helvetica').fontSize(6).fillColor(COLORS.muted);
        center(`Processado por programa validado n.º ${docData.softwareValidation}`);
        y += 9;
      }
      doc.font('Helvetica').fontSize(6).fillColor(COLORS.muted);
      center('Documento processado por computador.');

      doc.end();
    });
  }
}

function numberToWords(value: number): string {
  const intPart  = Math.floor(value);
  const centPart = Math.round((value - intPart) * 100);
  const units = ['', 'UM', 'DOIS', 'TRÊS', 'QUATRO', 'CINCO', 'SEIS', 'SETE', 'OITO', 'NOVE', 'DEZ', 'ONZE', 'DOZE', 'TREZE', 'CATORZE', 'QUINZE', 'DEZASSEIS', 'DEZASSETE', 'DEZOITO', 'DEZANOVE'];
  const tens   = ['', '', 'VINTE', 'TRINTA', 'QUARENTA', 'CINQUENTA', 'SESSENTA', 'SETENTA', 'OITENTA', 'NOVENTA'];
  const hundreds = ['', 'CEM', 'DUZENTOS', 'TREZENTOS', 'QUATROCENTOS', 'QUINHENTOS', 'SEISCENTOS', 'SETECENTOS', 'OITOCENTOS', 'NOVECENTOS'];

  function below1000(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'CEM';
    const h = Math.floor(n / 100);
    const rem = n % 100;
    const hStr = h > 0 ? (h === 1 ? 'CENTO' : hundreds[h]) : '';
    let remStr = '';
    if (rem < 20) { remStr = units[rem] || ''; } 
    else { const t = Math.floor(rem / 10); const u = rem % 10; remStr = tens[t] + (u > 0 ? ` E ${units[u]}` : ''); }
    return [hStr, remStr].filter(Boolean).join(' E ');
  }

  const thousands = Math.floor(intPart / 1000);
  const remainder = intPart % 1000;
  let result = '';
  if (thousands > 0) result += below1000(thousands) + (thousands === 1 ? ' MIL' : ' MIL');
  if (remainder > 0) result += (result ? ', ' : '') + below1000(remainder);
  if (result === '') result = 'ZERO';
  result += ' KWANZAS';
  if (centPart > 0) result += ` E ${below1000(centPart)} CÊNTIMOS`;
  return result;
}

export const pdfService = new PDFService();