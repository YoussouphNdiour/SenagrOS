import { describe, expect, it } from 'vitest';
import {
  transactionTypeEnum,
  transactionStatusEnum,
  paymentMethodEnum,
  transactionCategoryEnum,
  invoiceTypeEnum,
  invoiceStatusEnum,
  createTransactionSchema,
  createSaleSchema,
  updateTransactionSchema,
  createInvoiceSchema,
  listTransactionsSchema,
  listInvoicesSchema,
  listJournalSchema,
  financeIdSchema,
  transactionTypeLabels,
  transactionCategoryLabels,
  invoiceTypeLabels,
  invoiceStatusLabels,
  paymentMethodLabels,
  formatFCFA,
  generateInvoiceNumber,
} from './finance.validator';

// --- Enums ---

describe('transactionTypeEnum', () => {
  it('accepts valid types', () => {
    expect(transactionTypeEnum.parse('sale')).toBe('sale');
    expect(transactionTypeEnum.parse('purchase')).toBe('purchase');
    expect(transactionTypeEnum.parse('expense')).toBe('expense');
    expect(transactionTypeEnum.parse('income')).toBe('income');
  });

  it('rejects invalid type', () => {
    expect(() => transactionTypeEnum.parse('invalid')).toThrow();
  });
});

describe('invoiceTypeEnum', () => {
  it('accepts valid types', () => {
    expect(invoiceTypeEnum.parse('devis')).toBe('devis');
    expect(invoiceTypeEnum.parse('proforma')).toBe('proforma');
    expect(invoiceTypeEnum.parse('facture')).toBe('facture');
  });

  it('rejects invalid type', () => {
    expect(() => invoiceTypeEnum.parse('quote')).toThrow();
  });
});

describe('invoiceStatusEnum', () => {
  it('accepts all statuses', () => {
    for (const s of ['draft', 'sent', 'paid', 'overdue', 'cancelled']) {
      expect(invoiceStatusEnum.parse(s)).toBe(s);
    }
  });
});

describe('paymentMethodEnum', () => {
  it('accepts all methods', () => {
    expect(paymentMethodEnum.parse('cash')).toBe('cash');
    expect(paymentMethodEnum.parse('bank')).toBe('bank');
    expect(paymentMethodEnum.parse('mobile_money')).toBe('mobile_money');
  });
});

// --- Labels ---

describe('labels', () => {
  it('has labels for all transaction types', () => {
    for (const t of transactionTypeEnum.options) {
      expect(transactionTypeLabels[t]).toBeDefined();
    }
  });

  it('has labels for all transaction categories', () => {
    for (const c of transactionCategoryEnum.options) {
      expect(transactionCategoryLabels[c]).toBeDefined();
    }
  });

  it('has labels for all invoice types', () => {
    for (const t of invoiceTypeEnum.options) {
      expect(invoiceTypeLabels[t]).toBeDefined();
    }
  });

  it('has labels for all invoice statuses', () => {
    for (const s of invoiceStatusEnum.options) {
      expect(invoiceStatusLabels[s]).toBeDefined();
    }
  });

  it('has labels for all payment methods', () => {
    for (const m of paymentMethodEnum.options) {
      expect(paymentMethodLabels[m]).toBeDefined();
    }
  });
});

// --- createTransactionSchema ---

describe('createTransactionSchema', () => {
  it('creates a valid sale transaction', () => {
    const result = createTransactionSchema.parse({
      type: 'sale',
      description: 'Vente haricots verts',
      amount: 150000,
      date: '2026-09-01',
      clientName: 'Auchan Dakar',
      productName: 'Haricots verts',
      quantity: 500,
      unitPrice: 300,
      unit: 'kg',
      paymentMethod: 'bank',
    });
    expect(result.type).toBe('sale');
    expect(result.amount).toBe(150000);
    expect(result.clientName).toBe('Auchan Dakar');
  });

  it('rejects missing description', () => {
    expect(() =>
      createTransactionSchema.parse({
        type: 'sale',
        description: '',
        amount: 100,
        date: '2026-09-01',
      }),
    ).toThrow();
  });

  it('rejects negative amount', () => {
    expect(() =>
      createTransactionSchema.parse({
        type: 'expense',
        description: 'Achat engrais',
        amount: -500,
        date: '2026-09-01',
      }),
    ).toThrow();
  });
});

// --- createSaleSchema ---

describe('createSaleSchema', () => {
  it('creates a valid sale with product details', () => {
    const result = createSaleSchema.parse({
      productName: 'Tomates',
      quantity: 200,
      unitPrice: 500,
      unit: 'kg',
      clientName: 'Marché Sandaga',
      date: '2026-09-03',
      paymentMethod: 'cash',
    });
    expect(result.productName).toBe('Tomates');
    expect(result.quantity).toBe(200);
    expect(result.unitPrice).toBe(500);
  });

  it('calculates total correctly', () => {
    const sale = createSaleSchema.parse({
      productName: 'Oignons',
      quantity: 100,
      unitPrice: 250,
      date: '2026-09-03',
    });
    expect(sale.quantity * sale.unitPrice).toBe(25000);
  });

  it('rejects missing product name', () => {
    expect(() =>
      createSaleSchema.parse({
        productName: '',
        quantity: 10,
        unitPrice: 100,
        date: '2026-09-03',
      }),
    ).toThrow();
  });
});

// --- createInvoiceSchema ---

describe('createInvoiceSchema', () => {
  it('creates a valid facture with items', () => {
    const result = createInvoiceSchema.parse({
      type: 'facture',
      clientName: 'SARL AgriPlus',
      clientEmail: 'contact@agriplus.sn',
      issueDate: '2026-09-01',
      dueDate: '2026-10-01',
      items: [
        { productName: 'Haricots verts', quantity: 500, unitPrice: 300, total: 150000 },
        { productName: 'Tomates', quantity: 200, unitPrice: 500, total: 100000 },
      ],
      taxAmount: 0,
    });
    expect(result.type).toBe('facture');
    expect(result.items).toHaveLength(2);
    expect(result.items[0].total + result.items[1].total).toBe(250000);
  });

  it('rejects empty items array', () => {
    expect(() =>
      createInvoiceSchema.parse({
        type: 'devis',
        clientName: 'Client Test',
        issueDate: '2026-09-01',
        items: [],
      }),
    ).toThrow();
  });

  it('rejects missing client name', () => {
    expect(() =>
      createInvoiceSchema.parse({
        type: 'proforma',
        clientName: '',
        issueDate: '2026-09-01',
        items: [{ productName: 'Test', quantity: 1, unitPrice: 100, total: 100 }],
      }),
    ).toThrow();
  });
});

// --- List schemas ---

describe('listTransactionsSchema', () => {
  it('applies defaults', () => {
    const result = listTransactionsSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
  });

  it('accepts all optional filters', () => {
    const result = listTransactionsSchema.parse({
      type: 'sale',
      category: 'vente_produit',
      status: 'completed',
      search: 'haricot',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      page: 2,
      limit: 50,
    });
    expect(result.type).toBe('sale');
    expect(result.page).toBe(2);
  });
});

describe('listInvoicesSchema', () => {
  it('applies defaults', () => {
    const result = listInvoicesSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
  });
});

describe('listJournalSchema', () => {
  it('applies defaults', () => {
    const result = listJournalSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
  });
});

// --- financeIdSchema ---

describe('financeIdSchema', () => {
  it('accepts valid UUID', () => {
    const result = financeIdSchema.parse({ id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' });
    expect(result.id).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  });

  it('rejects invalid UUID', () => {
    expect(() => financeIdSchema.parse({ id: 'not-a-uuid' })).toThrow();
  });
});

// --- Helpers ---

describe('formatFCFA', () => {
  it('formats zero', () => {
    expect(formatFCFA(0)).toContain('0');
    expect(formatFCFA(0)).toContain('FCFA');
  });

  it('formats large amounts with separators', () => {
    const formatted = formatFCFA(1500000);
    expect(formatted).toContain('FCFA');
    // Should contain the number in some format
    expect(formatted).toMatch(/1[\s\u00a0.]?500[\s\u00a0.]?000/);
  });

  it('formats small amounts', () => {
    expect(formatFCFA(250)).toContain('250');
  });
});

describe('generateInvoiceNumber', () => {
  it('generates devis number', () => {
    const num = generateInvoiceNumber('devis', 1);
    expect(num).toMatch(/^DEV-\d{4}-0001$/);
  });

  it('generates proforma number', () => {
    const num = generateInvoiceNumber('proforma', 42);
    expect(num).toMatch(/^PF-\d{4}-0042$/);
  });

  it('generates facture number', () => {
    const num = generateInvoiceNumber('facture', 123);
    expect(num).toMatch(/^FAC-\d{4}-0123$/);
  });
});

// --- Scenario: Campagne Hivernage 2026 ---

describe('Scenario: Hivernage 2026 — Ventes haricots verts SCL', () => {
  it('validates a complete sale workflow', () => {
    // 1. Create a sale of 500kg haricots verts at 300 FCFA/kg
    const sale = createSaleSchema.parse({
      productName: 'Haricots verts Euforia',
      quantity: 500,
      unitPrice: 300,
      unit: 'kg',
      clientName: 'Export SN',
      date: '2026-07-15',
      paymentMethod: 'bank',
    });
    const totalVente = sale.quantity * sale.unitPrice;
    expect(totalVente).toBe(150000);

    // 2. Create a facture for this sale
    const facture = createInvoiceSchema.parse({
      type: 'facture',
      clientName: 'Export SN',
      clientEmail: 'export@sn.com',
      issueDate: '2026-07-15',
      dueDate: '2026-08-15',
      items: [
        {
          productName: 'Haricots verts Euforia',
          quantity: 500,
          unitPrice: 300,
          total: 150000,
        },
      ],
      taxAmount: 0,
    });
    expect(facture.items[0].total).toBe(150000);

    // 3. Record an expense for intrant purchase
    const achat = createTransactionSchema.parse({
      type: 'purchase',
      category: 'achat_intrant',
      description: 'Achat Decis Expert 10L',
      amount: 45000,
      date: '2026-06-20',
      paymentMethod: 'cash',
    });
    expect(achat.amount).toBe(45000);

    // 4. Calculate net profit
    const netProfit = totalVente - achat.amount;
    expect(netProfit).toBe(105000);
    expect(formatFCFA(netProfit)).toContain('FCFA');
  });
});
