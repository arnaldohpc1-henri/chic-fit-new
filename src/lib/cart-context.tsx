"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  color: string;
  size: string;
  price: number;
  image: string;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (productId: string, color: string, size: string) => void;
  setQty: (productId: string, color: string, size: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "chicfit:cart";

function sameLine(
  a: { productId: string; color: string; size: string },
  b: { productId: string; color: string; size: string }
) {
  return a.productId === b.productId && a.color === b.color && a.size === b.size;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratação única do carrinho salvo no localStorage ao montar
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // localStorage indisponível — segue com carrinho vazio
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignora falha de persistência
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, item));
      if (existing) {
        return prev.map((i) =>
          sameLine(i, item) ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const removeItem = useCallback((productId: string, color: string, size: string) => {
    setItems((prev) => prev.filter((i) => !sameLine(i, { productId, color, size })));
  }, []);

  const setQty = useCallback((productId: string, color: string, size: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((i) => (sameLine(i, { productId, color, size }) ? { ...i, qty } : i))
        .filter((i) => i.qty > 0)
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.qty * i.price, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, removeItem, setQty, clear, count, subtotal }),
    [items, addItem, removeItem, setQty, clear, count, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}
