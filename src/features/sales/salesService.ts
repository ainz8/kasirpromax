import { db } from '@/db';
import { generateId } from '@/utils/id';
import { calcSubtotal, calcTotal, calcProfit, calcChange } from '@/features/pos/cartService';
import type { CartItem, Transaction, PaymentMethod } from '@/types/transaction';

export interface CheckoutInput {
  items: CartItem[];
  discount: number;
  payMethod: PaymentMethod;
  amountPaid: number;
  customerId?: string;
  notes?: string;
  cashier: string;
}

export interface CheckoutResult {
  transaction: Transaction;
  change: number;
}

export async function checkout(input: CheckoutInput): Promise<CheckoutResult> {
  const { items, discount, payMethod, amountPaid, customerId, notes, cashier } = input;

  if (items.length === 0) throw new Error('Keranjang kosong');

  // Resolve customer name — dilakukan di service, bukan di caller
  let customerName: string | undefined;
  if (customerId) {
    const customer = await db.customers.get(customerId);
    customerName = customer?.name;
    if (!customer) throw new Error('Pelanggan tidak ditemukan');
  }

  const subtotal = calcSubtotal(items);
  const total = calcTotal(subtotal, discount);
  const profit = calcProfit(items);
  const change = calcChange(total, amountPaid);

  if (amountPaid < total) {
    throw new Error(
      `Pembayaran kurang Rp ${(total - amountPaid).toLocaleString('id-ID')}`
    );
  }

  const now = Date.now();
  const transaction: Transaction = {
    id: generateId(),
    date: new Date().toISOString(),
    items,
    customerId,
    customerName, // selalu diisi di sini, bukan "nanti di caller"
    subtotal,
    discount,
    total,
    profit,
    payMethod,
    amountPaid,
    change,
    status: 'completed',
    cashier,
    notes,
    createdAt: now,
    updatedAt: now,
  };

  // Atomik: transaksi + stok deduction dalam satu DB transaction
  await db.transaction('rw', db.transactions, db.products, async () => {
    await db.transactions.add(transaction);

    for (const item of items) {
      const product = await db.products.get(item.productId);
      if (!product) continue; // produk dihapus? skip, jangan throw

      await db.products.update(item.productId, {
        stock: Math.max(0, product.stock - item.qty),
        updatedAt: now,
      });
    }
  });

  return { transaction, change };
}

export async function voidTransaction(
  transactionId: string,
  reason: string // WAJIB — bukan optional
): Promise<void> {
  if (!reason.trim()) throw new Error('Alasan void wajib diisi');

  const trx = await db.transactions.get(transactionId);
  if (!trx) throw new Error('Transaksi tidak ditemukan');
  if (trx.status === 'voided') throw new Error('Transaksi sudah di-void sebelumnya');

  const now = Date.now();

  await db.transaction('rw', db.transactions, db.products, async () => {
    await db.transactions.update(transactionId, {
      status: 'voided',
      voidReason: reason,
      updatedAt: now,
    });

    // Rollback stok
    for (const item of trx.items) {
      const product = await db.products.get(item.productId);
      if (!product) continue;

      await db.products.update(item.productId, {
        stock: product.stock + item.qty,
        updatedAt: now,
      });
    }
  });
}
