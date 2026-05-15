import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';

export function useProducts(opts: { search?: string; category?: string } = {}) {
  const products = useLiveQuery(async () => {
    const rows = await db.products.toArray();

    return rows
      .filter(p => p.isActive === true)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filtered = (products ?? []).filter(p => {
    if (
      opts.category &&
      opts.category !== 'Semua' &&
      p.category !== opts.category
    ) {
      return false;
    }

    if (opts.search) {
      const q = opts.search.toLowerCase();

      return (
        p.name.toLowerCase().includes(q) ||
        (p.barcode ?? '').includes(q)
      );
    }

    return true;
  });

  return {
    products: filtered,
    allProducts: products ?? [],
    isLoading: products === undefined,
  };
}
