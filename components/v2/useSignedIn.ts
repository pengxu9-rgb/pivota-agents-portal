'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

/** Same guard the legacy pages use: no stored session token → /login. Returns true once checked. */
export function useSignedIn() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!window.localStorage.getItem('agent_token')) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [router]);

  return ready;
}
