import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (
    product: Product,
    variantId: string,
    color: string,
    colorHex: string,
    size: string,
    image: string,
    quantity?: number
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

/**
 * Build a stable, deterministic cart-line ID from the three attributes
 * that make a line unique: product + variant (color) + size.
 * We do NOT use Date.now() so that re-adding the same combo always
 * matches the existing row and increments its quantity instead of
 * creating a duplicate.
 */
function buildCartItemId(productId: string, variantId: string, size: string) {
  return `${productId}__${variantId}__${size}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, variantId, color, colorHex, size, image, quantity = 1) => {
        const { items } = get();

        // A cart line is uniquely identified by product + variant + size.
        const lineId = buildCartItemId(product.id, variantId, size);
        const existingItem = items.find((item) => item.id === lineId);

        if (existingItem) {
          // Same product + color variant + size → increase quantity
          set({
            items: items.map((item) =>
              item.id === lineId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
            isOpen: true,
          });
        } else {
          // Brand-new combination → add as a new cart line
          const newItem: CartItem = {
            id: lineId,
            productId: product.id,
            product,
            variantId,
            color,
            colorHex,
            size,
            quantity,
            price: product.price,
            image,
          };
          set({ items: [...items, newItem], isOpen: true });
        }
      },

      removeItem: (itemId) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== itemId) })),

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((total, item) => total + item.price * item.quantity, 0),
    }),
    { name: 'cr-cart' }
  )
);
