import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: user } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single();

      if (!user) {
        setError("This email is not registered in our system");
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-zinc-800 p-8 bg-zinc-900/50 backdrop-blur-sm">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            ARIVO LAB
          </h2>
          <h1 className="text-2xl mt-8">Reset Password</h1>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="text-center text-green-500">
              Password reset email sent. Please check your inbox.
            </div>
            <Link href="/signin" className="btn btn-primary w-full">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-white">Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered input-primary w-full bg-transparent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center">
              <Link href="/signin" className="link text-white hover:text-primary">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 