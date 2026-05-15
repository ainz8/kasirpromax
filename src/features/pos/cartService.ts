import type { CartItem } from '@/types/transaction';
import type { Product } from '@/types/product';

// ── Kalkulasi (pure functions, zero side effects) ────────────

export function calcSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.subtotal, 0);
}

export function calcTotal(subtotal: number, discount: number): number {
  return Math.max(0, subtotal - discount);
}

export function calcProfit(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + (i.unitPrice - i.costPrice) * i.qty, 0);
}

export function calcChange(total: number, amountPaid: number): number {
  return Math.max(0, amountPaid - total);
}

export function suggestPayAmounts(total: number): number[] {
  if (total <= 0) return [];
  const results = new Set<number>([total]);
  const round = [1000, 2000, 5000, 10000, 20000, 50000, 100000];
  for (const r of round) {
    const up = Math.ceil(total / r) * r;
    if (up > total) results.add(up);
    if (results.size >= 5) break;
  }
  return [...results].sort((a, b) => a - b);
}

// ── Mutasi Cart (immutable — return array baru) ───────────────

export function addItem(items: CartItem[], product: Product, qty = 1): CartItem[] {
  const existing = items.find(i => i.productId === product.id);

  if (existing) {
    return items.map(i =>
      i.productId === product.id
        ? { ...i, qty: i.qty + qty, subtotal: (i.qty + qty) * i.unitPrice }
        : i
    );
  }

  return [
    ...items,
    {
      productId: product.id,
      productName: product.name,
      unit: product.unit,
      qty,
      unitPrice: product.sellPrice,
      costPrice: product.buyPrice,
      subtotal: product.sellPrice * qty,
    },
  ];
}

export function setQty(items: CartItem[], productId: string, qty: number): CartItem[] {
  if (qty <= 0) return removeItem(items, productId);
  return items.map(i =>
    i.productId === productId
      ? { ...i, qty, subtotal: i.unitPrice * qty }
      : i
  );
}

export function removeItem(items: CartItem[], productId: string): CartItem[] {
  return items.filter(i => i.productId !== productId);
}

export function clearItems(): CartItem[] {
  return [];
}
