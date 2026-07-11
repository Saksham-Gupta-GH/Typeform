'use client';

import React, { useState } from 'react';
import { X, Mail } from 'lucide-react';
import { signIn, signInWithGoogle } from '@/lib/api';
import { GoogleLogin } from '@react-oauth/google';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (token: string, name: string, email: string) => void;
}

export default function AuthModal({ isOpen, onClose, onSignIn }: AuthModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    // Simulate Google Sign-In for prototype
    onSignIn('mock_google_token', 'Google User', 'user@gmail.com');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!name.trim() || !email.trim()) {
        setError('Please enter name and email');
        return;
      }

      const response = await signIn(name.trim(), email.trim());
      onSignIn(response.token, response.name, response.email);
      setName('');
      setEmail('');
      setShowEmailForm(false);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-end p-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-10 pb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center font-serif">Welcome to Typeform Clone</h2>
          <p className="text-sm text-gray-500 text-center mb-8">Sign in to create beautiful forms and surveys.</p>

          {!showEmailForm ? (
            <div className="space-y-4">
              <div className="flex justify-center w-full bg-white">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    try {
                      setError('');
                      setLoading(true);
                      if (!credentialResponse.credential) throw new Error("No credential received");
                      const response = await signInWithGoogle(credentialResponse.credential);
                      onSignIn(response.token, response.name, response.email);
                      onClose();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Google sign in failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onError={() => {
                    setError('Google Login Failed');
                  }}
                  useOneTap
                  width="100%"
                />
              </div>
              
              <button 
                onClick={() => setShowEmailForm(true)}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                <Mail size={18} />
                Sign in with Email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-all"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-all"
                  disabled={loading}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Signing in...' : 'Continue'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailForm(false);
                    setError('');
                  }}
                  className="w-full mt-3 px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Back to all sign in options
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
