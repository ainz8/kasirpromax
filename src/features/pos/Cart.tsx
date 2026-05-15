import React from 'react';
import { useCartStore, selectSubtotal, selectTotal, selectProfit, selectItemCount } from './cartStore';
import { formatRp } from '@/utils/currency';

interface CartProps {
  onCheckout?: () => void;
}

export function Cart({ onCheckout }: CartProps) {
  const items = useCartStore(s => s.items);
  const discount = useCartStore(s => s.discount);
  const subtotal = useCartStore(selectSubtotal);
  const total = useCartStore(selectTotal);
  const profit = useCartStore(selectProfit);
  const itemCount = useCartStore(selectItemCount);
  const updateQty = useCartStore(s => s.updateQty);
  const remove = useCartStore(s => s.remove);
  const setDiscount = useCartStore(s => s.setDiscount);
  const openCheckout = useCartStore(s => s.openCheckout);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-800">🛒 Keranjang</h3>
        <div className="text-xs text-gray-600 mt-1">{itemCount} item</div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-2xl mb-2">🛍️</div>
            <div className="text-sm">Keranjang kosong</div>
          </div>
        ) : (
          items.map(item => (
            <div
              key={item.productId}
              className="flex gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{item.productName}</div>
                <div className="text-xs text-gray-600">{item.unit}</div>
                <div className="text-sm font-semibold text-blue-600 mt-1">
                  {formatRp(item.subtotal)}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex gap-1 items-center">
                  <button
                    onClick={() => updateQty(item.productId, item.qty - 1)}
                    className="w-6 h-6 bg-red-100 text-red-600 rounded text-sm font-bold hover:bg-red-200"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={e => updateQty(item.productId, Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-10 h-6 text-center text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => updateQty(item.productId, item.qty + 1)}
                    className="w-6 h-6 bg-green-100 text-green-600 rounded text-sm font-bold hover:bg-green-200"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => remove(item.productId)}
                  className="text-xs text-red-600 font-medium hover:text-red-800"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <>
          <div className="px-4 py-3 border-t border-gray-200 space-y-2 bg-gray-50">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatRp(subtotal)}</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600 flex-1">Diskon:</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={e => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-gray-300 pt-2">
              <span>Total:</span>
              <span className="text-lg text-blue-600">{formatRp(total)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Untung:</span>
              <span>{formatRp(profit)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <div className="px-4 py-3 border-t border-gray-200">
            <button
              onClick={() => openCheckout()}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition"
            >
              💳 Bayar {formatRp(total)}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
