'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export const ProtectedRoute = ({ 
  children, 
  allowedRoles,
  redirectTo = '/connexion'
}: ProtectedRouteProps) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Wait a bit for store to hydrate from localStorage
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!isAuthenticated) {
        const currentPath = window.location.pathname;
        router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      // Check role-based access
      if (allowedRoles && allowedRoles.length > 0) {
        if (!user || !allowedRoles.includes(user.role)) {
          // Redirect to appropriate dashboard based on user role
          const fallbackRoute = user?.role === 'ADMIN' ? '/admin' : '/compte';
          router.push(fallbackRoute);
          return;
        }
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [isAuthenticated, user, allowedRoles, redirectTo, router]);

  // Show loading state
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Vérification en cours...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if user doesn't have permission
  if (!isAuthenticated || (allowedRoles && user && !allowedRoles.includes(user.role))) {
    return null; // Will redirect before this renders
  }

  return <>{children}</>;
};
