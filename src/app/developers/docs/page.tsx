export default async function DevelopersDocsPage() {
  const res = await fetch('https://web-production-fedb.up.railway.app/agent/docs/overview', { cache: 'no-store' });
  if (!res.ok) {
    return <div className="p-6">Failed to load docs overview</div>;
  }
  const data = await res.json();
  const sections: { id: string; title: string; path: string }[] = data.sections || [];
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Developers Documentation</h1>
      <ul className="space-y-2 list-disc pl-6">
        {sections.map((s) => (
          <li key={s.id}>
            <a className="text-blue-600 hover:underline" href={s.path} target="_blank" rel="noreferrer">
              {s.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}




















