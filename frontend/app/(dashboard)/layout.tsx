'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppLoadingScreen } from '@/components/states/AppLoadingScreen';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Keep rendering children behind the loading screen once auth succeeds,
  // but don't render children if there's no user and we're not loading.
  if (!loading && !user) {
    return null; // Will redirect
  }

  return (
    <>
      {showLoadingScreen && (
        <AppLoadingScreen 
          isLoading={loading} 
          onComplete={() => setShowLoadingScreen(false)} 
        />
      )}
      
      {!loading && user && (
        <div className="min-h-screen flex selection:bg-indigo-100 selection:text-indigo-900 bg-transparent">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300">
            <Navbar onMenuClick={() => setSidebarOpen(true)} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 overflow-y-auto w-full max-w-7xl mx-auto">
              {children}
            </main>
          </div>
        </div>
      )}
    </>
  );
}
