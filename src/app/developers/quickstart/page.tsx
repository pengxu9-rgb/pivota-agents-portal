import React from 'react';

export default async function QuickstartPage() {
  const res = await fetch('https://web-production-fedb.up.railway.app/agent/docs/quickstart.md', { cache: 'no-store' });
  const md = res.ok ? await res.text() : '# Quickstart\n\nFailed to load docs.';
  // Lightweight markdown: render preformatted for now; can replace with react-markdown later
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Quickstart</h1>
      <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded border">{md}</pre>
    </div>
  );
}


















