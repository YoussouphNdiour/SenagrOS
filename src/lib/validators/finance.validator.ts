import { z } from 'zod';

// --- Transaction type & status enums ---

export const transactionTypeEnum = z.enum(['sale', 'purchase', 'expense', 'income']);
export type TransactionType = z.infer<typeof transactionTypeEnum>;

export const transactionStatusEnum = z.enum(['pending', 'completed', 'cancelled']);
export type TransactionStatus = z.infer<typeof transactionStatusEnum>;

export const paymentMethodEnum = z.enum(['cash', 'bank', 'mobile_money']);
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;

export const transactionCategoryEnum = z.enum([
  'vente_produit',
  'vente_betail',
  'prestation',
  'achat_intrant',
  'achat_equipement',
  'achat_semence',
  'main_oeuvre',
  'transport',
  'entretien',
  'energie',
  'loyer',
  'subvention',
  'autre',
]);
export type TransactionCategory = z.infer<typeof transactionCategoryEnum>;

// --- Invoice type & status enums ---

export const invoiceTypeEnum = z.enum(['devis', 'proforma', 'facture']);
export type InvoiceType = z.infer<typeof invoiceTypeEnum>;

export const invoiceStatusEnum = z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']);
export type InvoiceStatus = z.infer<typeof invoiceStatusEnum>;

// --- Labels ---

export const transactionTypeLabels: Record<TransactionType, string> = {
  sale: 'Vente',
  purchase: 'Achat',
  expense: 'Dépense',
  income: 'Revenu',
};

export const transactionStatusLabels: Record<TransactionStatus, string> = {
  pending: 'En attente',
  completed: 'Complété',
  cancelled: 'Annulé',
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Espèces',
  bank: 'Banque',
  mobile_money: 'Mobile Money',
};

export const transactionCategoryLabels: Record<TransactionCategory, string> = {
  vente_produit: 'Vente de produit',
  vente_betail: 'Vente de bétail',
  prestation: 'Prestation de service',
  achat_intrant: 'Achat intrant',
  achat_equipement: 'Achat équipement',
  achat_semence: 'Achat semence',
  main_oeuvre: "Main d'œuvre",
  transport: 'Transport',
  entretien: 'Entretien',
  energie: 'Énergie',
  loyer: 'Loyer',
  subvention: 'Subvention',
  autre: 'Autre',
};

export const invoiceTypeLabels: Record<InvoiceType, string> = {
  devis: 'Devis',
  proforma: 'Pro forma',
  facture: 'Facture',
};

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
};

export const accountLabels: Record<string, string> = {
  caisse: 'Caisse',
  banque: 'Banque',
  ventes: 'Ventes',
  achats: 'Achats',
  charges: 'Charges',
  produits: 'Produits',
};

// --- List transactions schema ---

export const listTransactionsSchema = z.object({
  type: transactionTypeEnum.optional(),
  category: transactionCategoryEnum.optional(),
  status: transactionStatusEnum.optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

// --- Create transaction schema ---

export const createTransactionSchema = z.object({
  type: transactionTypeEnum,
  category: transactionCategoryEnum.optional(),
  description: z.string().min(1, 'La description est requise').max(500),
  amount: z.number().positive('Le montant doit être positif'),
  date: z.string().min(1, 'La date est requise'),
  clientName: z.string().max(255).optional(),
  productName: z.string().max(255).optional(),
  quantity: z.number().positive().optional(),
  unitPrice: z.number().positive().optional(),
  unit: z.string().max(20).optional(),
  paymentMethod: paymentMethodEnum.optional(),
  status: transactionStatusEnum.optional(),
  notes: z.string().optional(),
});

export type CreateTransactionValues = z.input<typeof createTransactionSchema>;

// --- Create sale shortcut schema ---

export const createSaleSchema = z.object({
  productName: z.string().min(1, 'Le produit est requis').max(255),
  quantity: z.number().positive('La quantité doit être positive'),
  unitPrice: z.number().positive('Le prix unitaire doit être positif'),
  unit: z.string().max(20).optional(),
  clientName: z.string().max(255).optional(),
  date: z.string().min(1, 'La date est requise'),
  paymentMethod: paymentMethodEnum.optional(),
  notes: z.string().optional(),
});

export type CreateSaleValues = z.input<typeof createSaleSchema>;

// --- Update transaction schema ---

export const updateTransactionSchema = z.object({
  id: z.string().uuid(),
  type: transactionTypeEnum.optional(),
  category: transactionCategoryEnum.optional(),
  description: z.string().min(1).max(500).optional(),
  amount: z.number().positive().optional(),
  date: z.string().optional(),
  clientName: z.string().max(255).optional(),
  productName: z.string().max(255).optional(),
  quantity: z.number().positive().optional(),
  unitPrice: z.number().positive().optional(),
  unit: z.string().max(20).optional(),
  paymentMethod: paymentMethodEnum.optional(),
  status: transactionStatusEnum.optional(),
  notes: z.string().optional(),
});

// --- Invoice item schema ---

export const invoiceItemSchema = z.object({
  productName: z.string().min(1, 'Le produit est requis'),
  quantity: z.number().positive('La quantité doit être positive'),
  unitPrice: z.number().positive('Le prix unitaire doit être positif'),
  total: z.number(),
});

// --- List invoices schema ---

export const listInvoicesSchema = z.object({
  type: invoiceTypeEnum.optional(),
  status: invoiceStatusEnum.optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

// --- Create invoice schema ---

export const createInvoiceSchema = z.object({
  type: invoiceTypeEnum,
  clientName: z.string().min(1, 'Le client est requis').max(255),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientPhone: z.string().max(30).optional(),
  clientAddress: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Au moins un article est requis'),
  taxAmount: z.number().min(0).optional(),
  issueDate: z.string().min(1, 'La date est requise'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateInvoiceValues = z.input<typeof createInvoiceSchema>;

// --- Update invoice schema ---

export const updateInvoiceSchema = z.object({
  id: z.string().uuid(),
  status: invoiceStatusEnum.optional(),
  paidAt: z.string().optional(),
});

// --- List journal entries schema ---

export const listJournalSchema = z.object({
  category: z.string().optional(),
  account: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

// --- ID schema ---

export const financeIdSchema = z.object({
  id: z.string().uuid(),
});

// --- Helpers ---

export function formatFCFA(amount: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} FCFA`;
}

export function generateInvoiceNumber(type: InvoiceType, sequence: number): string {
  const prefix = type === 'devis' ? 'DEV' : type === 'proforma' ? 'PF' : 'FAC';
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`;
}
