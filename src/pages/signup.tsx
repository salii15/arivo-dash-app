import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FcGoogle } from 'react-icons/fc';
import { Upload } from 'lucide-react';
import { MdEmail, MdLock, MdPerson } from 'react-icons/md';

export default function SignUp() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  
  // Form 1 states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  // Form 2 states
  const [position, setPosition] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [ppUrl, setPpUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-numeric characters
    return phone.replace(/\D/g, '');
  };

  const handleSignUpWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google'
    });
    if (error) console.error('Error signing up with Google:', error.message);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeToTerms) {
      alert('Please agree to terms and conditions');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        }
      }
    });

    if (error) {
      alert(error.message);
    } else if (data.user) {
      setUserId(data.user.id);
      setUserEmail(email);
      setStep(2);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    setSelectedFile(file);
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      let uploadedImageUrl = null;
      
      // Upload image if one was selected
      if (selectedFile) {
        console.log('Starting image upload...');
        
        // Simplify the file name
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        console.log('Uploading file:', fileName);
        
        // Simplified upload call
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(fileName, selectedFile);
          
        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }
        
        console.log('Upload successful:', uploadData);
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(fileName);
          
        console.log('Generated public URL:', publicUrl);
        uploadedImageUrl = publicUrl;
      }
      
      // Save profile data
      const formattedPhone = formatPhoneNumber(phone);
      
      if (!userId || !userEmail) {
        throw new Error('Missing user information. Please try signing up again.');
      }
      
      const { data: userData, error: userError } = await supabase
        .from('user_info')
        .insert([
          {
            user_id: userId,
            email: userEmail,
            position,
            company,
            phone: formattedPhone,
            pp_url: uploadedImageUrl
          }
        ]);

      if (userError) {
        console.error('Database error:', userError);
        throw new Error(`Failed to save profile: ${userError.message}`);
      }
      
      console.log('Profile saved successfully:', userData);
      router.push('/');
      
    } catch (error) {
      console.error('Full error details:', error);
      alert(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatPhoneDisplay = (value: string): string => {
    const phone = value.replace(/\D/g, '');
    if (phone.length < 4) return phone;
    if (phone.length < 7) return `${phone.slice(0, 3)}-${phone.slice(3)}`;
    return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md text-gray-100">
        <h1 className="text-2xl font-bold text-center mb-6 text-primary-500">ARIVO LAB</h1>
        
        {step === 1 ? (
          <form onSubmit={handleSignUp}>
            <button
              type="button"
              onClick={handleSignUpWithGoogle}
              className="w-full flex items-center justify-center gap-2 border border-gray-600 p-2 rounded mb-4 hover:bg-gray-700 transition-colors"
            >
              <FcGoogle /> Google SignUp
            </button>

            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-gray-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-300">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-white"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="rounded border-gray-600 text-primary-500 focus:ring-primary-500"
                  required
                />
                <label className="text-gray-300">I agree to terms and conditions</label>
              </div>

              <button
                type="submit"
                className="w-full bg-primary-500 text-white p-2 rounded hover:bg-primary-600 transition-colors"
              >
                Create Account
              </button>
            </div>

            <p className="text-center mt-4 text-gray-400">
              or <Link href="/signin" className="text-primary-500 hover:text-primary-400">Sign in</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleCompleteProfile}>
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                <label className="cursor-pointer">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center hover:border-primary-500 transition-colors">
                    {isUploading ? (
                      <div className="animate-spin text-primary-500">Loading...</div>
                    ) : previewUrl ? (
                      <img 
                        src={previewUrl} 
                        className="w-full h-full rounded-full object-cover" 
                        alt="Profile Preview" 
                      />
                    ) : (
                      <Upload className="text-gray-400" />
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-gray-300">Your Role</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-white"
                    placeholder="Position"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-gray-300">Brand Name</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-white"
                    placeholder="Company"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-gray-300">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-white"
                    placeholder="555-555-5555"
                    pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-500 text-white p-2 rounded hover:bg-primary-600 transition-colors"
                >
                  Complete Account
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
