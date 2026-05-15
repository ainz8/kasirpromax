import React, { useState, useEffect } from 'react';
import { useCartStore, selectTotal, selectChange } from './cartStore';
import { suggestPayAmounts } from './cartService';
import { checkout as checkoutService } from '@/features/sales/salesService';
import { useToast } from '@/hooks/useToast';
import { formatRp } from '@/utils/currency';
import type { PaymentMethod } from '@/types/transaction';

const PAYMENT_METHODS: PaymentMethod[] = ['TUNAI', 'TRANSFER', 'QRIS', 'KREDIT'];

export function CheckoutModal() {
  const isOpen = useCartStore(s => s.isCheckoutOpen);
  const items = useCartStore(s => s.items);
  const discount = useCartStore(s => s.discount);
  const total = useCartStore(selectTotal);
  const change = useCartStore(selectChange);
  const payMethod = useCartStore(s => s.payMethod);
  const amountPaid = useCartStore(s => s.amountPaid);

  const setPayMethod = useCartStore(s => s.setPayMethod);
  const setAmountPaid = useCartStore(s => s.setAmountPaid);
  const closeCheckout = useCartStore(s => s.closeCheckout);
  const clear = useCartStore(s => s.clear);

  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();
  const suggestions = React.useMemo(() => suggestPayAmounts(total), [total]);

  const isAmountValid = amountPaid >= total;

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }

    if (!isAmountValid) {
      toast.error('Pembayaran kurang');
      return;
    }

    setIsProcessing(true);
    try {
      // Get cashier name from app settings
      const cashierName = 'Kasir'; // TODO: get from appStore.settings.cashierName

      await checkoutService({
        items,
        discount,
        payMethod,
        amountPaid,
        cashier: cashierName,
      });

      toast.success(
        `Transaksi berhasil! Kembalian: ${formatRp(change)}`
      );
      clear();
      closeCheckout();
    } catch (err) {
  const message =
    err instanceof Error ? err.message : 'Checkout gagal';

  toast.error(message);
} finally {
  setIsProcessing(false);
}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 px-4 py-4 border-b border-gray-200 bg-white flex justify-between items-center">
          <h2 className="font-bold text-lg">💳 Pembayaran</h2>
          <button
            onClick={() => closeCheckout()}
            className="text-2xl text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Total Display */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Total Pembayaran:</div>
            <div className="text-3xl font-bold text-blue-600">{formatRp(total)}</div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(method => (
                <button
                  key={method}
                  onClick={() => setPayMethod(method)}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition ${
                    payMethod === method
                      ? 'bg-blue-600 text-white border-2 border-blue-600'
                      : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Paid */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Jumlah Bayar (Rp)
            </label>
            <input
              type="number"
              min="0"
              value={amountPaid}
              onChange={e => setAmountPaid(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-lg font-semibold focus:outline-none focus:border-blue-500"
              placeholder="0"
            />
          </div>

          {/* Quick Amount Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Saran nominal:</label>
              <div className="grid grid-cols-3 gap-2">
                {suggestions.map(amount => (
                  <button
                    key={amount}
                    onClick={() => setAmountPaid(amount)}
                    className={`px-2 py-1 text-xs font-medium rounded transition ${
                      amountPaid === amount
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {formatRp(amount)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Change Display */}
          <div
            className={`p-3 rounded-lg font-semibold text-center ${
              isAmountValid
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {isAmountValid ? (
              <div>
                <div className="text-xs text-green-600 mb-1">Kembalian:</div>
                <div className="text-2xl">{formatRp(change)}</div>
              </div>
            ) : (
              <div>
                <div className="text-xs mb-1">Pembayaran kurang:</div>
                <div className="text-2xl">{formatRp(total - amountPaid)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-4 py-3 border-t border-gray-200 bg-gray-50 flex gap-2">
          <button
            onClick={() => closeCheckout()}
            className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition"
            disabled={isProcessing}
          >
            Batal
          </button>
          <button
            onClick={handleCheckout}
            disabled={!isAmountValid || isProcessing}
            className={`flex-1 px-4 py-3 font-semibold rounded-lg transition ${
              isAmountValid && !isProcessing
                ? 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? '⏳ Proses...' : `✓ Bayar ${formatRp(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
