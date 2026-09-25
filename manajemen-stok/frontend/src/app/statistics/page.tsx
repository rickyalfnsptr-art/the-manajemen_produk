'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StatisticsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-medium">
      Memuat Dashboard...
    </div>
  );
}
