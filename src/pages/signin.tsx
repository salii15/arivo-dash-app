import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FcGoogle } from 'react-icons/fc';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          alert('Invalid email or password. Please try again.');
        } else {
          alert(error.message);
        }
        return;
      }

      router.push('/');
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred during sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const handleForgotPassword = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    setLoading(true);
    setError(null);
  
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
  
      if (error) throw error;
  
      alert("Password reset email sent. Please check your inbox.");
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
    
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        console.error('Google sign in error:', error);
        alert('Google ile giriş yapılırken bir hata oluştu.');
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }

    } catch (error) {
      console.error('Unexpected error:', error);
      alert('Beklenmeyen bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-zinc-800 p-8 bg-zinc-900/50 backdrop-blur-sm">
        <h1 className="text-2xl mb-12">Sign In</h1>
        
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            ARIVO LAB
          </h2>
        </div>

        <div className="space-y-6">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-white">e-mail</span>
            </label>
            <input
              type="email"
              className="input input-bordered input-primary w-full bg-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-zinc-300">password</span>
            </label>
            <input
              type="password"
              className="input input-bordered input-primary w-full bg-zinc-800/50 border-zinc-700 focus:border-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="label cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-primary mr-2"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="label-text text-white">remember me</span>
            </label>
            <Link href="/forgot-password" className="link text-white hover:text-primary">
              Forgot password?
            </Link>
          </div>

          <button
            onClick={handleSignIn}
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <button
            onClick={handleGoogleSignIn}
            className="btn w-full bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600"
          >
            <FcGoogle className="w-5 h-5 mr-2" />
            {loading ? "Processing..." : "Login with Google"}
          </button>

          <p className="text-center">
            <Link href="/signup" className="link text-white hover:text-primary">
              or create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
