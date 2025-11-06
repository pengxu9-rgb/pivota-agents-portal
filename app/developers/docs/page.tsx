'use client';

export default function DeveloperDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <iframe 
        src="https://web-production-fedb.up.railway.app/docs"
        className="w-full h-screen border-0"
        title="API Documentation"
      />
    </div>
  );
}
