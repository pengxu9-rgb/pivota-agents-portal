'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to signup page
    router.replace('/signup');
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to registration...</p>
      </div>
    </div>
  );
}














