'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CodePanel({
  code,
  language,
}: {
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
          {language ?? 'Code'}
        </span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="portal-scrollbar overflow-x-auto px-4 py-4 text-sm leading-6 text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
