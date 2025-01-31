import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/utils/supabase';

export default function EmailConfirmation() {
  const router = useRouter();

  useEffect(() => {
    const checkEmailConfirmation = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !user.email_confirmed_at) {
        // E-posta onaylanmamışsa kullanıcıyı bilgilendir
        alert('Please confirm your email address.');
        router.push('/'); // Redirect to home
      }
    };

    checkEmailConfirmation();
  }, [router]);


  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900">
      <div className="bg-base-100 p-10 rounded-lg shadow-xl w-full max-w-md text-gray-800">
        <h1 className="text-3xl font-bold text-center mb-6 text-primary-600">Email Confirmation</h1>
        <p className="text-center mb-4">Please check your email to confirm your address.</p>
        <p className="text-center text-sm text-gray-400">
          If you didn't receive an email, click here to resend.
        </p>
        <div className="mt-6">
          <a href="/signin" className="btn btn-primary w-full">Go to Sign In</a>
        </div>
      </div>
    </div>
  );
} 