import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { formatRp } from '@/utils/currency';
import { useCartStore } from './cartStore';
import type { Product } from '@/types/product';

interface ProductGridProps {
  onProductAdded?: () => void;
}

export function ProductGrid({ onProductAdded }: ProductGridProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const add = useCartStore(s => s.add);

  const products = useLiveQuery(async () => {
  const rows = await db.products.toArray();

  return rows
    .filter(p => p.isActive === true)
    .sort((a, b) => a.name.localeCompare(b.name));
}, []);

  const categories = React.useMemo(() => {
    if (!products) return [];
    const cats = new Set(products.map(p => p.category));
    return ['Semua', ...Array.from(cats).sort()];
  }, [products]);

  const filtered = React.useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      if (selectedCategory !== 'Semua' && p.category !== selectedCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.barcode ?? '').includes(q);
      }
      return true;
    });
  }, [products, search, selectedCategory]);

  const handleAddProduct = (product: Product) => {
    add(product, 1);
    onProductAdded?.();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Cari produk atau barcode..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {filtered.map(product => (
          <button
            key={product.id}
            onClick={() => handleAddProduct(product)}
            disabled={product.stock <= 0}
            className={`p-3 rounded-lg border-2 text-left transition ${
              product.stock <= 0
                ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                : 'border-blue-300 bg-blue-50 hover:border-blue-500 hover:bg-blue-100 active:scale-95'
            }`}
          >
            <div className="font-semibold text-sm mb-1 truncate">{product.name}</div>
            <div className="text-xs text-gray-600 mb-2">
              {product.stock <= product.minStock! ? (
                <span className="text-red-600 font-semibold">⚠️ Stok: {product.stock}</span>
              ) : (
                <span>Stok: {product.stock}</span>
              )}
            </div>
            <div className="text-sm font-bold text-blue-600">{formatRp(product.sellPrice)}</div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">🔍</div>
          <div>Tidak ada produk ditemukan</div>
        </div>
      )}
    </div>
  );
}
