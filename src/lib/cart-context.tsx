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

export type CouponState = {
  code: string;
  discountAmount: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (productId: string, color: string, size: string) => void;
  setQty: (productId: string, color: string, size: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  /** cupom validado pelo servidor e atualmente aplicado — null = nenhum */
  coupon: CouponState | null;
  /** total já com o desconto do cupom aplicado (nunca menor que 0) */
  total: number;
  couponLoading: boolean;
  couponMessage: string | null;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "chicfit:cart";
const COUPON_STORAGE_KEY = "chicfit:coupon";

function sameLine(
  a: { productId: string; color: string; size: string },
  b: { productId: string; color: string; size: string }
) {
  return a.productId === b.productId && a.color === b.color && a.size === b.size;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratação única do carrinho salvo no localStorage ao montar
      if (raw) setItems(JSON.parse(raw));
      const savedCoupon = window.localStorage.getItem(COUPON_STORAGE_KEY);
      if (savedCoupon) setCouponCode(savedCoupon);
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

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (couponCode) window.localStorage.setItem(COUPON_STORAGE_KEY, couponCode);
      else window.localStorage.removeItem(COUPON_STORAGE_KEY);
    } catch {
      // ignora falha de persistência
    }
  }, [couponCode, hydrated]);

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

  const clear = useCallback(() => {
    setItems([]);
    setCouponCode(null);
    setDiscountAmount(0);
    setCouponMessage(null);
  }, []);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.qty * i.price, 0),
    [items]
  );

  const applyCoupon = useCallback(async (code: string) => {
    if (!code.trim()) return;
    if (items.length === 0) {
      setCouponMessage("Cupom disponível apenas para compras.");
      return;
    }
    setCouponLoading(true);
    setCouponMessage(null);
    try {
      const res = await fetch("/api/cupons/aplicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponCode(data.code);
        setDiscountAmount(data.discountAmount);
        setCouponMessage(null);
      } else {
        setCouponCode(null);
        setDiscountAmount(0);
        setCouponMessage(data.message ?? "Esse cupom não existe ou é inválido.");
      }
    } catch {
      setCouponMessage("Não foi possível validar o cupom agora. Tente novamente.");
    } finally {
      setCouponLoading(false);
    }
  }, [items.length, subtotal]);

  const removeCoupon = useCallback(() => {
    setCouponCode(null);
    setDiscountAmount(0);
    setCouponMessage(null);
  }, []);

  // Ao adicionar/remover produto ou mudar quantidade, o subtotal muda — um
  // cupom já aplicado precisa ser revalidado contra o novo valor (o mínimo
  // de compra pode deixar de ser atingido, ou o desconto percentual muda).
  // Sem isso o carrinho ficaria mostrando um desconto "congelado" e incorreto.
  useEffect(() => {
    if (!hydrated || !couponCode || items.length === 0) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- liga o indicador de carregamento antes de disparar a revalidação assíncrona abaixo
    setCouponLoading(true);
    fetch("/api/cupons/aplicar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, subtotal }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.valid) {
          setDiscountAmount(data.discountAmount);
          setCouponMessage(null);
        } else {
          // o cupom deixou de valer para o carrinho atual (ex: caiu abaixo
          // do valor mínimo) — remove para não deixar um desconto antigo
          setCouponCode(null);
          setDiscountAmount(0);
          setCouponMessage(data.message ?? null);
        }
      })
      .catch(() => {
        // falha de rede pontual: mantém o desconto anterior em vez de
        // zerá-lo por uma instabilidade momentânea
      })
      .finally(() => {
        if (!cancelled) setCouponLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só deve reagir a mudanças de subtotal (qty/itens), não ao próprio couponCode
  }, [subtotal, hydrated]);

  // Carrinho vazio nunca deve exibir um desconto herdado de antes dos itens
  // saírem — em vez de disparar setState só para isso, o valor efetivo é
  // sempre limitado ao subtotal atual (que já é 0 quando o carrinho está vazio).
  const effectiveDiscount = Math.min(discountAmount, subtotal);
  const total = Math.max(0, subtotal - effectiveDiscount);
  const coupon = useMemo<CouponState | null>(
    () => (couponCode ? { code: couponCode, discountAmount: effectiveDiscount } : null),
    [couponCode, effectiveDiscount]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      setQty,
      clear,
      count,
      subtotal,
      coupon,
      total,
      couponLoading,
      couponMessage,
      applyCoupon,
      removeCoupon,
    }),
    [items, addItem, removeItem, setQty, clear, count, subtotal, coupon, total, couponLoading, couponMessage, applyCoupon, removeCoupon]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}
