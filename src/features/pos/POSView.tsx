import React from 'react';
import { ProductGrid } from './ProductGrid';
import { Cart } from './Cart';
import { CheckoutModal } from './CheckoutModal';

export function POSView() {
  const [gridRefresh, setGridRefresh] = React.useState(0);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Product Grid - Main Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <ProductGrid key={gridRefresh} />
        </div>
      </div>

      {/* Cart Sidebar - Right */}
      <div className="w-full lg:w-80 min-h-0">
        <div className="h-full flex flex-col">
          <Cart onCheckout={() => setGridRefresh(g => g + 1)} />
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal />
    </div>
  );
}
