import { Apple, Bean, Carrot, Leaf, type LucideIcon, Nut, Package, Wheat } from 'lucide-react';
import type { ListingCategory } from '@/lib/validators/storefront.validator';

export const CATEGORY_VISUALS: Record<
  ListingCategory,
  { icon: LucideIcon; className: string; photo: string }
> = {
  cereales: { icon: Wheat, className: 'bg-amber-50 text-amber-700', photo: '/storefront/photos/mil.jpg' },
  legumes: { icon: Carrot, className: 'bg-orange-50 text-orange-700', photo: '/storefront/photos/tomates.jpg' },
  fruits: { icon: Apple, className: 'bg-red-50 text-red-700', photo: '/storefront/photos/mangues.jpg' },
  tubercules: { icon: Bean, className: 'bg-yellow-50 text-yellow-800', photo: '/storefront/photos/patates-douces.jpg' },
  oleagineux: { icon: Nut, className: 'bg-lime-50 text-lime-700', photo: '/storefront/photos/arachide.jpg' },
  produits_transformes: { icon: Package, className: 'bg-purple-50 text-purple-700', photo: '/storefront/photos/bissap.jpg' },
  autres: { icon: Leaf, className: 'bg-green-50 text-green-700', photo: '/storefront/photos/carottes.jpg' },
};
