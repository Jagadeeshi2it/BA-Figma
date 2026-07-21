import React from 'react';
import { X } from 'lucide-react';

// Lightweight right-side overlay sheet used by the change-allocation flow pages to list
// the products / bins behind the footer's "Product 1/2" and "Source Bin 1/1" counters.
// Kept dependency-free (no Radix portal) so it stays confined to the page that opened it
// — including inside the tablet-simulator frame — and dismisses on backdrop tap.

interface SideSheetProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function SideSheet({ open, title, subtitle, onClose, children }: SideSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <style>{`
        @keyframes sheet-slide-in {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes sheet-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
      {/* Backdrop — tap anywhere outside to dismiss */}
      <div
        className="absolute inset-0 bg-black/40"
        style={{ animation: 'sheet-fade-in 0.2s ease-out' }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="absolute right-0 top-0 h-full w-[380px] max-w-[85vw] bg-white shadow-[-8px_0px_30px_rgba(0,0,0,0.2)] flex flex-col"
        style={{ animation: 'sheet-slide-in 0.25s ease-out' }}
      >
        <div className="flex items-center justify-between pl-5 pr-2 min-h-[60px] border-b border-[#e5e7eb] shrink-0">
          <div>
            <h3 className="text-[16px] font-semibold text-[#020817]">{title}</h3>
            {subtitle && <p className="text-[12px] text-[#64748b]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[4px] hover:bg-gray-100 cursor-pointer bg-transparent border-none"
          >
            <X className="w-5 h-5 text-[#4a5565]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
