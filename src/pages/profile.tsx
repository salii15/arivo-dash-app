import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { User, Mail, Building, Briefcase, Phone, Upload, Wallet, Edit } from 'lucide-react';
import { supabase } from '@/utils/supabase';

import DashboardLayout from '@/pages/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { WalletCards, Plus } from "lucide-react";
import  Button  from "@/components/ui/Button";


export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    display_name: '',
    email: '',
    company: '',
    position: '',
    phone: '',
    phone_country_code: '+90',
    date_type: 'US/Europe',
    currency: 'USD/EURO/TRY'
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Get auth user data
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      // Get user_info data
      const { data: userInfo, error } = await supabase
        .from('user_info')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setUserData({
        display_name: user.user_metadata?.display_name || '',
        email: user.email || '',
        company: userInfo?.company || '',
        position: userInfo?.position || '',
        phone: userInfo?.phone || '',
        phone_country_code: userInfo?.phone_country_code || '+90',
        date_type: userInfo?.date_type || 'US/Europe',
        currency: userInfo?.currency || 'USD/EURO/TRY'
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      // Format phone number (remove non-numeric characters and add country code)
      const formattedPhone = userData.phone_country_code + userData.phone.replace(/\D/g, '');

      // Update auth user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { display_name: userData.display_name }
      });

      if (metadataError) throw metadataError;

      // Check if user_info exists
      const { data: existingInfo } = await supabase
        .from('user_info')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const userInfoData = {
        company: userData.company || null,
        position: userData.position || null,
        phone: formattedPhone || null,
        phone_country_code: userData.phone_country_code || '+90',
        date_type: userData.date_type || 'US/Europe',
        currency: userData.currency || 'USD/EURO/TRY'
      };

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

  return (
    <DashboardLayout>
        <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
        <PageHeader 
              title="Profile"
              description="View or edit your profile details"
              bgColor="bg-base-200"
              padding='p-4'
              icon={<WalletCards className="w-5 h-5" />}
            />
            <div className="flex items-center flex-row space-x-4">

            </div>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Profile Pictures Section */}
            <div className="flex gap-6 items-start">
              <div className="text-center space-y-2">
                <div className="avatar placeholder">
                  <div className="w-32 rounded-lg bg-base-300">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <div className="text-xs text-gray-400">Upload</div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="avatar placeholder">
                  <div className="w-32 rounded-lg bg-base-300">
                    <span className="text-3xl">U</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400">Current</div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <User className="w-4 h-4" /> Display Name
                  </span>
                </label>
                <input 
                  type="text" 
                  value={userData.display_name}
                  onChange={(e) => setUserData({...userData, display_name: e.target.value})}
                  className="input input-bordered bg-base-200 text-gray-100"
                  disabled={!isEditing}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email
                  </span>
                </label>
                <input 
                  type="email" 
                  value={userData.email}
                  className="input input-bordered bg-base-200 text-gray-100"
                  disabled={true}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <Building className="w-4 h-4" /> Company
                  </span>
                </label>
                <input 
                  type="text" 
                  value={userData.company}
                  onChange={(e) => setUserData({...userData, company: e.target.value})}
                  className="input input-bordered bg-base-200 text-gray-100"
                  disabled={!isEditing}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Position
                  </span>
                </label>
                <input 
                  type="text" 
                  value={userData.position}
                  onChange={(e) => setUserData({...userData, position: e.target.value})}
                  className="input input-bordered bg-base-200 text-gray-100"
                  disabled={!isEditing}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Phone
                  </span>
                </label>
                <div className="flex gap-2">
                  <select 
                    value={userData.phone_country_code}
                    onChange={(e) => setUserData({...userData, phone_country_code: e.target.value})}
                    className="select select-bordered bg-base-200 text-gray-100 w-28"
                    disabled={!isEditing}
                  >
                    <option value="+90">🇹🇷 +90</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+39">🇮🇹 +39</option>
                  </select>
                  <input 
                    type="tel" 
                    value={userData.phone}
                    onChange={(e) => {
                      const numbers = e.target.value.replace(/\D/g, '');
                      let formatted = numbers;
                      
                      if (userData.phone_country_code === '+90' && numbers.length <= 10) {
                        formatted = numbers.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                      }
                      else if (numbers.length <= 10) {
                        formatted = numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
                      }
                      
                      setUserData({...userData, phone: formatted});
                    }}
                    placeholder="(5XX) XXX-XXXX"
                    className="input input-bordered bg-base-200 text-gray-100 flex-1"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Date Type and Currency */}
              <div className="flex gap-4">
                <div className="form-control flex-1">
                  <label className="label">
                    <span className="label-text">Date Type</span>
                  </label>
                  <select 
                    value={userData.date_type}
                    onChange={(e) => setUserData({...userData, date_type: e.target.value})}
                    className="select select-bordered bg-base-200 text-gray-100"
                    disabled={!isEditing}
                  >
                    <option className="text-gray-100">US/Europe</option>
                    <option className="text-gray-100">Asia/Pacific</option>
                  </select>
                </div>
                <div className="form-control flex-1">
                  <label className="label">
                    <span className="label-text">Currency</span>
                  </label>
                  <select 
                    value={userData.currency}
                    onChange={(e) => setUserData({...userData, currency: e.target.value})}
                    className="select select-bordered bg-base-200 text-gray-100"
                    disabled={!isEditing}
                  >
                    <option className="text-gray-100">USD/EURO/TRY</option>
                    <option className="text-gray-100">GBP/JPY/AUD</option>
                  </select>
                </div>
              </div>

              {/* Billing Details */}
              <div className="form-control">
                <button className="btn btn-outline gap-2">
                  <Wallet className="w-4 h-4" />
                  Billing Details
                </button>
              </div>

              {/* Edit/Update Profile Button */}
              <div className="form-control mt-6">
                {!isEditing ? (
                  <button 
                    className="btn btn-primary gap-2"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      className="btn btn-outline flex-1"
                      onClick={() => {
                        setIsEditing(false);
                        fetchUserData(); // Reset form
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-primary flex-1"
                      onClick={handleUpdate}
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Update Profile'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        </DashboardLayout>
  );
} 

