import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LoginForm] handleSubmit called, isSignup:', isSignup);
    setIsLoading(true);
    setError('');

    try {
      let success = false;
      if (isSignup) {
        if (!preferredName.trim()) {
          setError('Preferred name is required');
          return;
        }
        console.log('[LoginForm] calling signup...');
        success = await signup(email, password, preferredName);
        console.log('[LoginForm] signup result:', success);
        if (!success) {
          setError('Signup failed. Email may already be in use.');
        }
      } else {
        console.log('[LoginForm] calling login...');
        success = await login(email, password);
        console.log('[LoginForm] login result:', success);
        if (!success) {
          setError('Invalid email or password');
        }
      }
    } catch (err) {
      console.error('[LoginForm] exception:', err);
      setError(isSignup ? 'Signup failed. Please try again.' : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-400/70 to-purple-500/70 shadow-lg mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold ink-900">
            {isSignup ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-sm ink-500">
            Shabbat Apartment Program Tracking
          </p>
        </div>
        <div className="glass-strong rounded-2xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-ink-900 placeholder-ink-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-ink-900 placeholder-ink-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {isSignup && (
            <div>
              <label htmlFor="preferredName" className="sr-only">
                Preferred Name
              </label>
              <input
                id="preferredName"
                name="preferredName"
                type="text"
                required
                className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-ink-900 placeholder-ink-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50"
                placeholder="Preferred Name"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
              />
            </div>
          )}
          
          {error && (
            <div className="text-red-300 text-sm text-center glass rounded-lg p-3 border border-red-400/30">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary rounded-lg glow disabled:opacity-50 disabled:cursor-not-allowed py-2 px-4 text-sm font-medium"
            >
              {isLoading ? (isSignup ? 'Creating account...' : 'Signing in...') : (isSignup ? 'Create account' : 'Sign in')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
                setEmail('');
                setPassword('');
                setPreferredName('');
              }}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}