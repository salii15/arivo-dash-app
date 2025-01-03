import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { User, Mail, Building, Briefcase, Phone, Upload, Wallet, Edit } from 'lucide-react';
import { supabase } from '@/utils/supabase';

import DashboardLayout from '@/pages/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { WalletCards, Plus } from "lucide-react";
import  Button  from "@/components/ui/Button";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import BillingModal from '@/components/BillingModal';

// Add these styles somewhere in your CSS or create a new CSS file
const phoneInputStyle = {
  container: "!w-full",
  inputClass: `!w-full !h-12 input input-bordered 
               !pl-[48px] !rounded-lg
               focus:!border-primary focus:!ring-primary
               disabled:!bg-base-300 disabled:!text-base-content/50
               !bg-base-300 !text-base-content`,
  buttonClass: "!h-12 !rounded-lg !bg-base-300",
  dropdownClass: "!bg-base-300 !text-base-content !rounded-lg"
};

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    display_name: '',
    company: '',
    position: '',
    phone: '',
    date_type: 'US',
    currency: 'USD',
    pp_url: '',
    language: 'English'
  });
  const [user, setUser] = useState<any>(null);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      const { data: userInfo, error } = await supabase
        .from('user_info')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const phoneValue = userInfo?.phone || '';
      console.log('Fetched phone value:', phoneValue);

      setUserData({
        display_name: userInfo?.display_name || '',
        company: userInfo?.company || '',
        position: userInfo?.position || '',
        phone: phoneValue,
        date_type: userInfo?.date_type || 'US',
        currency: userInfo?.currency || 'USD',
        pp_url: userInfo?.pp_url || '',
        language: userInfo?.language || 'English'
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData(prev => ({
        ...prev,
        phone: ''
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      const userInfoData = {
        display_name: userData.display_name || null,
        company: userData.company || null,
        position: userData.position || null,
        phone: userData.phone || null,
        date_type: 'US',
        currency: 'USD',
        pp_url: userData.pp_url || null,
        language: userData.language || 'English'
      };

      // Check if user_info exists
      const { data: existingInfo } = await supabase 
        .from('user_info')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingInfo) {
        // Update existing user_info
        const { error: updateError } = await supabase
          .from('user_info')
          .update(userInfoData)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // Insert new user_info
        const { error: insertError } = await supabase
          .from('user_info')
          .insert([{
            user_id: user.id,
            ...userInfoData
          }]);

        if (insertError) throw insertError;
      }

      alert('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error instanceof Error) {
        alert(`Error updating profile: ${error.message}`);
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        alert(`Database Error: ${error.message}`);
      } else {
        alert('Error updating profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Phone input handler'ı güncelle
  const handlePhoneChange = (value: string) => {
    console.log('Phone change value:', value);
    setUserData(prev => ({
      ...prev,
      phone: value ? value.toString() : ''  // Ensure string conversion
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Upload image to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      // Update user_info with new pp_url
      const { error: updateError } = await supabase
        .from('user_info')
        .update({ pp_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state with new pp_url
      setUserData(prev => ({ ...prev, pp_url: publicUrl }));
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="flex-1 p-8 max-w-4xl mx-auto">
        {/* Profile Image Section */}
        <div className="flex justify-center mb-8 relative">
          <div className="w-32 h-32 rounded-full bg-base-200 flex items-center justify-center overflow-hidden">
            {userData.pp_url ? (
              <img 
                src={userData.pp_url} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <Upload className="w-8 h-8 text-gray-400" />
            )}
          </div>
          {isEditing && (
            <label className="absolute bottom-0 right-0 cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <div className="bg-primary text-white p-2 rounded-full">
                <Edit className="w-4 h-4" />
              </div>
            </label>
          )}
        </div>

        {/* Form Section */}
        <div className="space-y-6">
          {/* Name & Section */}
          <div className="grid gap-6 mb-8">
            <div className="form-control">
              <label className="label text-base-content font-medium mb-2">Name</label>
              <input 
                type="text" 
                placeholder="Enter your name"
                value={userData.display_name}
                onChange={(e) => setUserData({...userData, display_name: e.target.value})}  
                className="input input-bordered h-12 bg-base-300 text-base-content disabled:bg-base-300 disabled:text-base-content/50"
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Company & Position */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="form-control">
              <label className="label text-base-content font-medium mb-2">Company</label> 
              <input 
                type="text"
                placeholder="Enter your company name"
                value={userData.company}
                onChange={(e) => setUserData({...userData, company: e.target.value})}
                className="input input-bordered border-primary-500  bg-base-200 text-base-content h-12"
                disabled={!isEditing}
              />
            </div>

            <div className="form-control">
              <label className="label text-base-content font-medium mb-2">Position</label>
              <input 
                type="text"
                placeholder="Enter your position"
                value={userData.position}
                onChange={(e) => setUserData({...userData, position: e.target.value})}
                className="input input-bordered border-primary-500  bg-base-200 text-gray-900 h-12"
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Phone & Language (assuming we're adding language as shown in the image) */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="form-control">
              <label className="label text-base-content font-medium mb-2">Phone Number</label>
              {isEditing ? (
                <PhoneInput
                  country={'tr'}
                  value={userData.phone ? userData.phone.toString() : ''}  // Ensure string conversion
                  onChange={handlePhoneChange}
                  containerClass={phoneInputStyle.container}
                  inputClass={phoneInputStyle.inputClass}
                  buttonClass={phoneInputStyle.buttonClass}
                  dropdownClass={phoneInputStyle.dropdownClass}
                  disabled={false}
                  inputProps={{
                    name: 'phone',
                    required: true,
                    autoFocus: false
                  }}
                />
              ) : (
                <input 
                  type="text"
                  value={userData.phone || ''}
                  className="input input-bordered h-12 bg-base-300 text-base-content disabled:bg-base-300 disabled:text-base-content/50"
                  disabled={true}
                />
              )}
            </div>

            <div className="form-control">
              <label className="label text-base-content font-medium mb-2">Language</label>
              <select 
                value={userData.language}
                onChange={(e) => setUserData({...userData, language: e.target.value})}
                className="select select-bordered h-12 w-full bg-base-300 text-base-content disabled:bg-base-300 disabled:text-base-content/50"
                disabled={!isEditing}
              >
                <option value="English">English</option>
                <option value="Turkish">Turkish</option>
              </select>
            </div>
          </div>

          {/* Date & Currency Type */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="form-control">
              <label className="label text-base-content font-medium mb-2">Date Type</label>
              <select 
                value={userData.date_type}
                onChange={(e) => setUserData({...userData, date_type: e.target.value})}
                className="select select-bordered h-12 w-full bg-base-300 text-base-content disabled:bg-base-300 disabled:text-base-content/50"
                disabled={!isEditing}
              >
                <option value="US">US</option>
                <option value="EU">EU</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label text-base-content font-medium mb-2">Currency Type</label>
              <select 
                value={userData.currency}
                onChange={(e) => setUserData({...userData, currency: e.target.value})}
                className="select select-bordered bg-white text-gray-900 h-12 w-full"
                disabled={!isEditing}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="TRY">TRY</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-6">
            <button 
              className="btn btn-primary h-12 text-white"
              onClick={() => {
                if (isEditing) {
                  handleUpdate(); // Save changes
                } else {
                  setIsEditing(true); // Enter edit mode
                }
              }}
            >
              {isEditing ? 'Save Profile' : 'Edit Profile'}
            </button>
            <button 
              className="btn btn-primary h-12 text-white"
              onClick={() => setIsBillingModalOpen(true)}
            >
              Billing Settings
            </button>
          </div>
        </div>
      </main>
      <BillingModal 
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
      />
    </DashboardLayout>
  );
} 

