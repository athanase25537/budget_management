export const DEFAULT_CATEGORY_ICON = 'tag';

export const CATEGORY_ICON_OPTIONS = [
  { value: 'tag', label: 'Général', className: 'pi pi-tag' },
  { value: 'shopping-cart', label: 'Alimentation', className: 'pi pi-shopping-cart' },
  { value: 'shopping-bag', label: 'Courses', className: 'pi pi-shopping-bag' },
  { value: 'car', label: 'Transport', className: 'pi pi-car' },
  { value: 'home', label: 'Logement', className: 'pi pi-home' },
  { value: 'bolt', label: 'Factures', className: 'pi pi-bolt' },
  { value: 'heart', label: 'Santé', className: 'pi pi-heart' },
  { value: 'briefcase', label: 'Travail', className: 'pi pi-briefcase' },
  { value: 'book', label: 'Études', className: 'pi pi-book' },
  // "coffee" is a persisted identifier. PrimeIcons 8 has no coffee glyph.
  { value: 'coffee', label: 'Sorties', className: 'pi pi-ticket' },
  { value: 'gift', label: 'Cadeaux', className: 'pi pi-gift' },
  { value: 'mobile', label: 'Téléphone', className: 'pi pi-mobile' },
  { value: 'star', label: 'Loisirs', className: 'pi pi-star' },
  { value: 'globe', label: 'Voyage', className: 'pi pi-globe' },
  { value: 'users', label: 'Famille', className: 'pi pi-users' },
  { value: 'credit-card', label: 'Crédit', className: 'pi pi-credit-card' },
  { value: 'wrench', label: 'Entretien', className: 'pi pi-wrench' },
  { value: 'truck', label: 'Livraison', className: 'pi pi-truck' },
  { value: 'camera', label: 'Photo', className: 'pi pi-camera' },
  { value: 'ellipsis-h', label: 'Autres', className: 'pi pi-ellipsis-h' },
] as const;

export function categoryIconClass(value: string | null | undefined): string {
  return CATEGORY_ICON_OPTIONS.find((option) => option.value === value)?.className ?? 'pi pi-tag';
}
