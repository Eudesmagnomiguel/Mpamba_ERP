import PDFDocument from 'pdfkit';

// ─── Types ──────────────────────────────────────────────────────────────────

export type BillingDocumentType = 'FATURA' | 'PROFORMA' | 'NOTA_CREDITO' | 'RECIBO';

/** A4 para impressoras de escritório; THERMAL para impressoras de recibo (80mm) no posto de vendas. */
export type PdfFormat = 'A4' | 'THERMAL';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  vatRate?: number; // IVA %, default 14
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
  city?: string;
  country?: string;
  phone?: string | null;
  fax?: string;
  email?: string;
  bankName?: string;
  bankAccount?: string;
  iban?: string;
  logoPath?: string;   // path to logo image file
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
  FATURA: 'FATURA',
  PROFORMA: 'FATURA PROFORMA',
  NOTA_CREDITO: 'NOTA DE CRÉDITO',
  RECIBO: 'RECIBO DE QUITAÇÃO',
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

      const W = doc.page.width;
      const H = doc.page.height;
      const ML = 40;
      const MR = W - 40;

      // ── 1. Top accent bar ────────────────────────────────────────────────
      let primaryColor = COLORS.primary;
      if (docData.type === 'NOTA_CREDITO') primaryColor = COLORS.RED;
      doc.rect(0, 0, W, 6).fill(primaryColor);

      // ── 2. Header ────────────────────────────────────────────────────────
      let y = 20;

      if (docData.organization.logoPath) {
        try {
          doc.image(docData.organization.logoPath, ML, y, { height: 55 });
        } catch (_) {}
      }

      const companyX = docData.organization.logoPath ? ML + 110 : ML;
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(13)
        .text(docData.organization.name, companyX, y + 2, { width: 250 });

      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8);
      let cy = y + 18;
      doc.text(`NIF: ${docData.organization.nif || '—'}`, companyX, cy);
      cy += 11;
      doc.text(docData.organization.address || '—', companyX, cy);
      cy += 11;
      if (docData.organization.city) { doc.text(docData.organization.city, companyX, cy); cy += 11; }
      if (docData.organization.phone) { doc.text(`Tel: ${docData.organization.phone}`, companyX, cy); cy += 11; }
      if (docData.organization.email) { doc.text(docData.organization.email, companyX, cy); cy += 11; }

      // Document Label (right)
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(docData.type === 'RECIBO' ? 20 : 26)
        .text(DOCUMENT_LABELS[docData.type], MR - 250, y, { width: 250, align: 'right' });

      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8)
        .text(docData.number || 'RASCUNHO', MR - 150, y + 30, { width: 150, align: 'right' });

      if (docData.series) {
        const seriesText = typeof docData.series === 'object' 
          ? `${docData.series.prefix}/${docData.series.year}` 
          : docData.series;
        doc.text(seriesText, MR - 150, y + 41, { width: 150, align: 'right' });
      }

      // ── 3. Divider ───────────────────────────────────────────────────────
      y = 90;
      doc.rect(ML, y, W - ML * 2, 1).fill(COLORS.border);

      // ── 4. Meta row ──────────────────────────────────────────────
      y += 8;
      const metaItems = [
        { label: 'V/Nº Contrib.', value: docData.customerNif || '—' },
        { label: 'Moeda',         value: docData.currency },
        { label: 'Câmbio',        value: docData.exchangeRate ? fmt(docData.exchangeRate) : '—' },
        { label: 'Data',          value: fmtDate(docData.date) },
      ];

      const metaW = (W - ML * 2) / metaItems.length;
      metaItems.forEach((m, i) => {
        const mx = ML + i * metaW;
        doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7).text(m.label, mx, y);
        doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(8.5).text(m.value, mx, y + 10);
      });

      y += 30;
      doc.rect(ML, y, W - ML * 2, 1).fill(COLORS.border);

      y += 8;
      const metaItems2 = [
        { label: 'Desconto Comercial', value: fmt(docData.discountTotal || 0) },
        { label: 'Desconto Adicional', value: '0,00' },
        { label: docData.type === 'RECIBO' ? 'Forma Pagamento' : 'Vencimento', value: docData.type === 'RECIBO' ? (docData.paymentMethod || '—') : fmtDate(docData.dueDate) },
        { label: 'Condição Pagamento', value: docData.paymentCondition || '—' },
      ];
      metaItems2.forEach((m, i) => {
        const mx = ML + i * metaW;
        doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7).text(m.label, mx, y);
        doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(8.5).text(m.value, mx, y + 10);
      });

      y += 32;

      // ── 5. Customer box ──────────────────────────────────────────────────
      doc.rect(ML, y, W - ML * 2, 1).fill(COLORS.border);
      y += 6;

      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7).text('Cliente', ML, y);
      y += 10;

      doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(9)
        .text(docData.customerName, ML, y, { width: 320 });
      y += 12;

      doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted);
      if (docData.customerNif) { doc.text(`NIF: ${docData.customerNif}`, ML, y); y += 10; }
      if (docData.customerAddress) { doc.text(docData.customerAddress, ML, y); y += 10; }
      if (docData.customerCity) { doc.text(docData.customerCity, ML, y); y += 10; }
      if (docData.customerEmail) { doc.text(docData.customerEmail, ML, y); y += 10; }

      y += 8;

      if (docData.type === 'RECIBO') {
        // Receipt Specific Body
        y += 20;
        doc.rect(ML, y, W - ML * 2, 60).fill(COLORS.rowAlt);
        doc.fillColor(COLORS.text).font('Helvetica').fontSize(10);
        doc.text(
          `Recebemos de ${docData.customerName} a quantia de ${fmt(docData.total)} ${docData.currency} (${numberToWords(docData.total)}), referente à liquidação total/parcial da Fatura ${docData.invoiceNumber || '—'}.`,
          ML + 10, y + 15, { width: W - ML * 2 - 20, lineGap: 5 }
        );
        y += 80;
      } else {
        // Items table (for Invoice, Proforma, Credit Note)
        const COL = { artigo: ML, desc: ML + 45, qty: ML + 290, unit: ML + 330, disc: ML + 390, iva: ML + 430, total: ML + 460 };
        const tableRight = MR;

        doc.rect(ML, y, W - ML * 2, 18).fill(primaryColor);
        doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(7.5);
        doc.text('Artigo', COL.artigo, y + 5);
        doc.text('Descrição', COL.desc, y + 5);
        doc.text('Qtd.', COL.qty, y + 5, { width: 38, align: 'right' });
        doc.text('Pr. Unit.', COL.unit, y + 5, { width: 58, align: 'right' });
        doc.text('Desc.', COL.disc, y + 5, { width: 38, align: 'right' });
        doc.text('IVA', COL.iva, y + 5, { width: 28, align: 'right' });
        doc.text('Valor', COL.total, y + 5, { width: tableRight - COL.total, align: 'right' });

        y += 18;
        doc.font('Helvetica').fontSize(8).fillColor(COLORS.text);

        (docData.items || []).forEach((item, idx) => {
          const rowH = 22;
          if (idx % 2 === 0) doc.rect(ML, y, W - ML * 2, rowH).fill(COLORS.rowAlt);
          const cy2 = y + 6;
          doc.fillColor(COLORS.text);
          doc.text(String(idx + 1).padStart(4, '0'), COL.artigo, cy2);
          doc.text(item.description, COL.desc, cy2, { width: 238 });
          doc.text(String(item.quantity), COL.qty, cy2, { width: 38, align: 'right' });
          doc.text(fmt(item.unitPrice), COL.unit, cy2, { width: 58, align: 'right' });
          doc.text(fmt(item.discount), COL.disc, cy2, { width: 38, align: 'right' });
          doc.text(`${item.vatRate ?? 14},00`, COL.iva, cy2, { width: 28, align: 'right' });
          doc.text(fmt(item.total), COL.total, cy2, { width: tableRight - COL.total, align: 'right' });
          doc.rect(ML, y + rowH - 1, W - ML * 2, 0.5).fill(COLORS.border);
          y += rowH;
        });
        y += 12;
      }

      // ── 8. Bottom section: Totals ─────────────
      const bottomY = y;
      const leftColW  = 230;
      const rightColX = ML + leftColW + 10;
      const rightColW = W - ML * 2 - leftColW - 10;

      if (docData.type !== 'RECIBO') {
        // Tax Summary
        doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(8).text('Quadro Resumo de Impostos', ML, bottomY);
        const txH = bottomY + 14;
        doc.rect(ML, txH, leftColW, 16).fill(primaryColor);
        doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(7.5);
        doc.text('Taxa/Valor', ML + 2, txH + 4);
        doc.text('Incid./Qtd.', ML + 65, txH + 4, { width: 80, align: 'right' });
        doc.text('Total', ML + 148, txH + 4, { width: leftColW - 150, align: 'right' });

        const vatGroups: Record<string, { incidence: number; total: number }> = {};
        (docData.items || []).forEach((item) => {
          const rate = `${item.vatRate ?? 14},00`;
          if (!vatGroups[rate]) vatGroups[rate] = { incidence: 0, total: 0 };
          vatGroups[rate].incidence += item.total;
          vatGroups[rate].total += item.total * ((item.vatRate ?? 14) / 100);
        });

        let taxY = txH + 16;
        Object.entries(vatGroups).forEach(([rate, g], i) => {
          if (i % 2 === 0) doc.rect(ML, taxY, leftColW, 14).fill(COLORS.rowAlt);
          doc.fillColor(COLORS.text).font('Helvetica').fontSize(7.5);
          doc.text(`IVA (${rate})`, ML + 2, taxY + 3);
          doc.text(fmt(g.incidence), ML + 65, taxY + 3, { width: 80, align: 'right' });
          doc.text(fmt(g.total), ML + 148, taxY + 3, { width: leftColW - 150, align: 'right' });
          taxY += 14;
        });

        if (docData.type === 'NOTA_CREDITO' && docData.cancelReason) {
            taxY += 10;
            doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(8).text('Motivo de Retificação', ML, taxY);
            taxY += 12;
            doc.fillColor(COLORS.text).font('Helvetica').fontSize(8).text(docData.cancelReason, ML, taxY, { width: leftColW });
        }
      }

      // Totals
      let tY = bottomY;
      const tRows = docData.type === 'RECIBO' ? [] : [
        { label: 'Mercadoria/Serviços', value: fmt(docData.subtotal) },
        { label: 'Desconto Comercial',  value: fmt(docData.discountTotal || 0) },
        { label: 'IVA',                 value: fmt(docData.taxTotal) },
      ];

      tRows.forEach((row, i) => {
        if (i % 2 === 0) doc.rect(rightColX, tY, rightColW, 14).fill(COLORS.rowAlt);
        doc.fillColor(COLORS.text).font('Helvetica').fontSize(7.5);
        doc.text(row.label, rightColX + 4, tY + 3);
        doc.text(row.value, rightColX + 4, tY + 3, { width: rightColW - 4, align: 'right' });
        tY += 14;
      });

      tY += 2;
      doc.rect(rightColX, tY, rightColW, 26).fill(primaryColor);
      doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(10)
        .text(`Total ( ${docData.currency} )`, rightColX + 4, tY + 7);
      doc.fontSize(12).text(`${fmt(docData.total)}`, rightColX + 4, tY + 6, { width: rightColW - 6, align: 'right' });

      tY += 32;
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7)
        .text(`Total (${docData.currency}): ${numberToWords(docData.total)}`, rightColX, tY, { width: rightColW });

      // ── 9. Bank details ──────────────────────────────────────────────────
      let bankY = tY + 30;
      if (docData.organization.bankAccount || docData.organization.iban) {
        doc.rect(ML, bankY, W - ML * 2, 0.5).fill(COLORS.border);
        let bY = bankY + 8;
        doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(8).text('COORDENADAS BANCÁRIAS', ML, bY);
        bY += 12;
        doc.fillColor(COLORS.text).font('Helvetica').fontSize(8);
        if (docData.organization.bankName) { doc.text(docData.organization.bankName, ML, bY); bY += 10; }
        if (docData.organization.bankAccount) { doc.text(`Conta Nº ${docData.organization.bankAccount}`, ML, bY); bY += 10; }
        if (docData.organization.iban) { doc.text(`IBAN: ${docData.organization.iban}`, ML, bY); }
        bankY = bY + 16;
      }

      // ── 9.5 Notes / observações (parametrização da organização) ──────────
      if (docData.notes) {
        let noteY = bankY + 8;
        doc.fillColor(COLORS.muted).font('Helvetica-Oblique').fontSize(7.5)
          .text(docData.notes, ML, noteY, { width: W - ML * 2, align: 'left' });
      }

      // ── 10. Footer ───────────────────────────────────────────────────────
      const footerY = H - 36;
      doc.rect(0, footerY - 4, W, 0.5).fill(COLORS.border);
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7);
      if (docData.softwareValidation) doc.text(`Processado por programa validado n.º ${docData.softwareValidation}`, ML, footerY);
      doc.text('Documento processado por computador.', 0, footerY + 20, { width: W, align: 'center' });
      doc.rect(0, H - 6, W, 6).fill(primaryColor);

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