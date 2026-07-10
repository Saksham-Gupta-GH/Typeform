import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-black">Typeform Clone Dashboard</h1>
        <p className="mb-4 text-gray-700">Manage your forms here.</p>
        
        <div className="flex gap-4">
          <Link href="/builder/new" className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition">
            Create New Form
          </Link>
        </div>
      </div>
    </main>
  );
}


