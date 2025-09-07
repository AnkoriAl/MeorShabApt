import React from 'react';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { currentUser, logout } = useAuth();

  if (!currentUser) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-40 glass-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400/70 to-purple-500/70 shadow-md mr-3" />
              <h1 className="text-xl font-extrabold tracking-tight ink-900">
                Shabbat Apartment Tracker
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 px-2 py-1 rounded-lg glass">
                <User className="h-5 w-5 text-cyan-300" />
                <span className="text-sm font-medium ink-700">
                  {currentUser.preferredName}
                </span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-300/30">
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-1 text-sm ink-500 hover:ink-900 transition-colors btn-ghost glass px-3 py-1.5 rounded-lg glow"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}