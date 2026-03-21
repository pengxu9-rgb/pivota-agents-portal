'use client';

import { X } from 'lucide-react';
import ApiKeyManager from '@/components/portal/ApiKeyManager';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-surface)] shadow-[var(--portal-shadow-overlay)]">
        <div className="flex items-start justify-between border-b border-[var(--portal-border)] px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-[var(--portal-fg)]">API keys</h2>
            <p className="mt-1 text-sm text-[var(--portal-fg-muted)]">
              Manage production and partner credentials without leaving the Overview.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
            aria-label="Close API key manager"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="portal-scrollbar max-h-[calc(86vh-92px)] overflow-y-auto px-6 py-6">
          <ApiKeyManager compact />
        </div>
      </div>
    </div>
  );
}
