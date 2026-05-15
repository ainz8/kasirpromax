import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';

import AppShell from './components/AppShell';
import Toast from './components/Toast';

import { useAppStore } from './store/appStore';

import { InventoryView } from './features/inventory';
import { POSView } from './features/pos';

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-gray-500 mt-2">Belum diimplementasi</p>
    </div>
  );
}

function App() {
  const view = useAppStore((s) => s.view);
  const toasts = useAppStore((s) => s.toasts);

  const renderView = () => {
    switch (view) {
      case 'pos':
        return <POSView />;

      case 'inventory':
        return <InventoryView />;

      case 'history':
        return <PlaceholderView title="📋 Riwayat" />;

      case 'reports':
        return <PlaceholderView title="📊 Laporan" />;

      case 'settings':
        return <PlaceholderView title="⚙️ Setting" />;

      default:
        return <POSView />;
    }
  };

  return (
    <AppShell>
      {renderView()}

      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
          />
        ))}
      </div>
    </AppShell>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
