'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    // Upewnijmy się, że przekierowanie nastąpi natychmiast po załadowaniu
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (isAdmin) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, isAdmin, router]);

  // Zwracamy pusty div podczas ładowania
  return <div></div>;
}