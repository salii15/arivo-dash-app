import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/router';
import { Upload } from 'lucide-react';

export default function CompleteForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    position: '',
    company: '',
    phone: '',
    pp_url: ''
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(`${Date.now()}-${file.name}`, file);
      
      if (data) {
        setFormData({...formData, pp_url: data.path});
      }
    }
  };

  const handleCompleteProfile = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        alert("Please sign in again to complete your profile");
        router.push('/signin');
        return;
      }

      const { error } = await supabase
        .from('user_info')
        .insert({
          user_id: session.user.id,
          position: formData.position,
          company: formData.company,
          phone: formData.phone,
          pp_url: formData.pp_url || 'default_url'
        });

      if (error) throw error;

      alert('Registration completed successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Complete profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-gray-800 p-8">
        <h1 className="text-2xl mb-12">Complete Your Profile</h1>
        
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-center mb-6">
            Add these datas to complete your profile
          </h3>

          <div className="form-control">
            <label className="label justify-center p-4 border-2 border-dashed rounded-lg border-gray-700 cursor-pointer hover:border-primary">
              <Upload className="w-8 h-8 mb-2" />
              <span className="label-text text-white text-center">
                Upload brand logo
                <br />
                if not set default_url
              </span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileUpload}
              />
            </label>
            {profileImage && (
              <p className="text-sm text-center mt-2 text-green-500">
                Image selected: {profileImage.name}
              </p>
            )}
          </div>

          {/* Position Input */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-white">Your Role</span>
            </label>
            <input
              type="text"
              placeholder="Position"
              className="input input-bordered input-primary w-full bg-transparent"
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: e.target.value})}
            />
          </div>

          {/* Company Input */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-white">Brand Name</span>
            </label>
            <input
              type="text"
              placeholder="Company"
              className="input input-bordered input-primary w-full bg-transparent"
              value={formData.company}
              onChange={(e) => setFormData({...formData, company: e.target.value})}
            />
          </div>

          {/* Phone Input */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-white">Phone Number</span>
            </label>
            <input
              type="tel"
              placeholder="Phone"
              className="input input-bordered input-primary w-full bg-transparent"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={handleCompleteProfile}
            disabled={loading}
          >
            {loading ? 'Completing Profile...' : 'Complete Account'}
          </button>
        </div>
      </div>
    </div>
  );
} 