import { z } from 'zod';

// --- Enums ---

export const productCategoryEnum = z.enum([
  'cereales',
  'legumes',
  'fruits',
  'tubercules',
  'oleagineux',
  'autres',
]);
export type ProductCategory = z.infer<typeof productCategoryEnum>;

export const productCategoryLabels: Record<ProductCategory, string> = {
  cereales: 'Céréales',
  legumes: 'Légumes',
  fruits: 'Fruits',
  tubercules: 'Tubercules',
  oleagineux: 'Oléagineux',
  autres: 'Autres',
};

export const orderStatusEnum = z.enum([
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
]);
export type OrderStatus = z.infer<typeof orderStatusEnum>;

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export const deliveryMethodEnum = z.enum(['pickup', 'delivery']);
export type DeliveryMethod = z.infer<typeof deliveryMethodEnum>;

export const deliveryMethodLabels: Record<DeliveryMethod, string> = {
  pickup: 'Retrait sur place',
  delivery: 'Livraison',
};

// --- Product Schemas ---

export const createProductSchema = z.object({
  name: z.string().min(2, 'Le nom doit comporter au moins 2 caractères'),
  description: z.string().optional(),
  category: productCategoryEnum,
  photoUrl: z.string().url().optional().or(z.literal('')),
  pricePerKg: z.number().positive('Le prix doit être positif'),
  quantityAvailable: z.number().min(0, 'La quantité ne peut pas être négative'),
  unit: z.string().default('kg'),
  location: z.string().optional(),
  isBio: z.boolean().default(false),
  assetId: z.string().uuid().optional(),
});

export type CreateProductValues = z.input<typeof createProductSchema>;

export const updateProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  category: productCategoryEnum.optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  pricePerKg: z.number().positive().optional(),
  quantityAvailable: z.number().min(0).optional(),
  unit: z.string().optional(),
  location: z.string().optional(),
  isBio: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

export type UpdateProductValues = z.input<typeof updateProductSchema>;

export const productIdSchema = z.object({
  productId: z.string().uuid(),
});

export const listProductsSchema = z.object({
  search: z.string().optional(),
  category: productCategoryEnum.optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  bioOnly: z.boolean().optional(),
  inStockOnly: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(25),
});

export type ListProductsValues = z.input<typeof listProductsSchema>;

// --- Order Schemas ---

export const createOrderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive('La quantité doit être positive'),
  deliveryMethod: deliveryMethodEnum.default('pickup'),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateOrderValues = z.input<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: orderStatusEnum,
});

export type UpdateOrderStatusValues = z.input<typeof updateOrderStatusSchema>;

export const listOrdersSchema = z.object({
  status: orderStatusEnum.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(25),
});

export type ListOrdersValues = z.input<typeof listOrdersSchema>;

// --- Helpers ---

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-SN', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
