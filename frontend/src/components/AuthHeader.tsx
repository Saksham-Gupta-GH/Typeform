'use client';

import React, { useState, useEffect } from 'react';
import { LogOut, User } from 'lucide-react';
import { signOut, verifyToken } from '@/lib/api';
import { usePathname } from 'next/navigation';
import AuthModal from './AuthModal';

export default function AuthHeader({ hideButton = false }: { hideButton?: boolean } = {}) {
  const [user, setUser] = useState<{ name: string; email: string; token: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Load user from localStorage and verify token
    const saved = localStorage.getItem('typeform_user_auth');
    if (saved) {
      try {
        const userData = JSON.parse(saved);
        if (userData.token) {
          // Verify token with backend
          verifyToken(userData.token)
            .then((response) => {
              setUser({ name: response.name, email: response.email, token: userData.token });
            })
            .catch((err) => {
              console.error('Token verification failed:', err);
              localStorage.removeItem('typeform_user_auth');
            })
            .finally(() => setLoading(false));
        }
      } catch (e) {
        console.error('Failed to load user');
        localStorage.removeItem('typeform_user_auth');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
    
    const handleOpenAuth = () => setShowAuthModal(true);
    window.addEventListener('open-auth-modal', handleOpenAuth);
    
    // Listen for auth state changes from other components
    const handleAuthStateChange = () => {
      const saved = localStorage.getItem('typeform_user_auth');
      if (saved) {
        setUser(JSON.parse(saved));
      } else {
        setUser(null);
      }
    };
    window.addEventListener('auth-state-change', handleAuthStateChange);
    
    return () => {
      window.removeEventListener('open-auth-modal', handleOpenAuth);
      window.removeEventListener('auth-state-change', handleAuthStateChange);
    };
  }, []);

  const handleSignIn = (token: string, name: string, email: string) => {
    setUser({ name, email, token });
    localStorage.setItem('typeform_user_auth', JSON.stringify({ name, email, token }));
    window.dispatchEvent(new Event('auth-state-change'));
  };

  const handleSignOut = async () => {
    if (user?.token) {
      try {
        await signOut(user.token);
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    setUser(null);
    localStorage.removeItem('typeform_user_auth');
    window.dispatchEvent(new Event('auth-state-change'));
    
    // Check if we have window and if we are not already on the homepage
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = '/';
    }
  };

  if (loading) {
    return null;
  }

  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignIn={handleSignIn}
      />

      {!hideButton && (
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col hidden sm:flex">
                <span className="text-xs font-medium text-gray-900 leading-tight">{user.name}</span>
                <span className="text-[10px] text-gray-500 leading-tight">{user.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="ml-1 p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-red-600 flex items-center justify-center"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors shadow-sm text-sm"
              >
                <User size={16} />
                Sign In
              </button>
          )}
        </div>
      )}
    </>
  );
}
