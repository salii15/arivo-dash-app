import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { User, Mail, Building, Briefcase, Phone, Upload, Wallet, Edit, Save, CreditCard } from 'lucide-react';
import { supabase } from '@/utils/supabase';

import DashboardLayout from '@/pages/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { WalletCards, Plus } from "lucide-react";
import  Button  from "@/components/ui/Button";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import BillingModal from '@/components/BillingModal';

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
    language: 'English',
    phone_country_code: ''
  });
  const [user, setUser] = useState<any>(null);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'view' | 'edit'>('view');

  const phoneInputStyle = {
    container: "!w-full",
    inputClass: `!w-full !h-12 input input-bordered 
                 !pl-[48px] !rounded-lg
                 focus:!border-primary-500 focus:!ring-primary-500
                 disabled:!bg-base-300 disabled:!text-base-content/50
                 !bg-base-100 ${isEditing ? '!text-primary-600 !border-primary-500' : '!text-base-content'}`,
    buttonClass: "!h-12 !rounded-lg !bg-base-100 !border-primary-500",
    dropdownClass: "!bg-base-100 !text-base-content !rounded-lg"
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Check if user_info exists
        const { data: existingInfo, error: fetchError } = await supabase
          .from('user_info')
          .select('*')
          .eq('user_id', user.id)
          .single(); // Ensure we only get a single record

        if (fetchError && fetchError.code !== 'PGRST116') {
          // Handle other fetch errors
          console.error('Fetch Error:', fetchError);
          return;
        }

        if (existingInfo) {
          // User info found, set to view mode and populate data
          console.log('Mode: view');
          setMode('view');
          setUserData({
            display_name: existingInfo.display_name || '',
            company: existingInfo.company || '',
            position: existingInfo.position || '',
            phone: existingInfo.phone || '',
            date_type: existingInfo.date_type || 'US',
            currency: existingInfo.currency || 'USD',
            pp_url: existingInfo.pp_url || '',
            language: existingInfo.language || 'English',
            phone_country_code: existingInfo.phone_country_code || ''
          });
        } else {
          // No user info found, set to create mode
          console.log('Mode: create');
          setMode('create');
          setUserData({
            display_name: '',
            company: '',
            position: '',
            phone: '',
            date_type: 'US',
            currency: 'USD',
            pp_url: '',
            language: 'English',
            phone_country_code: ''
          });
        }
      }
      setLoading(false); // Ensure loading state is set to false after fetching
    };
    getUser();
  }, []);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      const validCurrencies = ['USD', 'EUR', 'TRY'];
      if (!validCurrencies.includes(userData.currency)) {
        throw new Error('Invalid currency selected');
      }

      const { phone, phone_country_code } = userData;

      const userInfoData = {
        display_name: userData.display_name || null,
        company: userData.company || null,
        position: userData.position || null,
        phone: phone,
        date_type: userData.date_type || 'US',
        currency: userData.currency || 'USD',
        pp_url: userData.pp_url || null,
        language: userData.language || 'English',
        phone_country_code: phone_country_code
      };

      // Check if user_info exists
      const { data: existingInfo, error: fetchError } = await supabase 
        .from('user_info')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Fetch Error:', fetchError);
        throw new Error(`Error fetching user info: ${fetchError.message}`);
      }

      if (existingInfo) {
        // Update existing user_info
        const { error: updateError } = await supabase
          .from('user_info')
          .update(userInfoData)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Update Error:', updateError);
          throw new Error(`Update Error: ${updateError.message}`);
        }
      } else {
        // Insert new user_info
        const { error: insertError } = await supabase
          .from('user_info')
          .insert([{
            user_id: user.id,
            ...userInfoData
          }]);

        if (insertError) {
          console.error('Insert Error:', insertError);
          throw new Error(`Insert Error: ${insertError.message}`);
        }
      }

      alert('Profile updated successfully!');
      setIsEditing(false);
      setMode('view');
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error instanceof Error) {
        alert(`Error updating profile: ${error.message}`);
      } else {
        alert('Error updating profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Phone input handler'ı güncelle
  const handlePhoneChange = (value: string, countryCode: string) => {
    console.log('Phone change value:', value);
    const phoneWithoutCountryCode = value.replace(/^\+\d{1,3}\s/, ''); // Remove country code from the input

    setUserData(prev => ({
        ...prev,
        phone: phoneWithoutCountryCode, // Save phone number without country code
        phone_country_code: countryCode // Save the country code separately
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

  const handleEditProfile = () => {
    setMode('edit');
  };

  // Button text based on mode
  const buttonText = mode === 'create' ? "Create Profile" : mode === 'view' ? "Edit Profile" : "Save Profile";

  const handleCreateProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('No user found. Please log in.');
      return;
    }

    // Create new user info
    const userInfoData = {
      email: user.email, // Kullanıcının e-posta adresini al
      display_name: userData.display_name || null,
      company: userData.company || null,
      position: userData.position || null,
      phone: userData.phone || '',
      date_type: userData.date_type || 'US',
      currency: userData.currency || 'USD',
      pp_url: userData.pp_url || null,
      language: userData.language || 'English',
      phone_country_code: userData.phone_country_code || ''
    };

    const { error: insertError } = await supabase
      .from('user_info')
      .insert([{
        user_id: user.id, // Current logged-in user's user_id
        ...userInfoData
      }]);

    if (insertError) {
      console.error('Insert Error:', insertError);
      alert(`Error creating profile: ${insertError.message}`);
      return;
    }

    alert('Profile created successfully!');
    setIsEditing(false);
  };

  return (
    <DashboardLayout>
      <main className="flex-1 p-8 max-w-4xl mx-auto">
        {/* Profile Image Section */}
        <div className={`p-6 rounded-2xl bg-base-200 ${mode === 'edit' ? 'bg-base-200/50' : ''}`}>

          <div className="flex justify-center mb-8 relative {mode === 'edit'}">
            
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
            {mode === 'edit' && (
              <label className="absolute -bottom-12 left-1/2 -translate-x-1/2 cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <div className="btn btn-primary btn-sm gap-2">
                  <Edit className="w-4 h-4" />
                  Select Image
                </div>
              </label>
            )}
          </div>

          {/* Form Section */}
          <div className={`space-y-6 p-6 rounded-lg ${mode === 'edit' ? 'bg-base-300/50' : ''}`}>
          
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-4 bg-base-300 rounded w-1/4"></div>
                    <div className="h-12 bg-base-300 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Warning Message for Create Mode */}
                {mode === 'create' && (
                  <div className="alert alert-warning mb-4">
                    Complete your profile to access all features.
                  </div>
                )}

                {/* Name & Section */}
                <div className="grid gap-6 mb-8">
                  <div className="form-control">
                    <label className="label text-base-content font-medium mb-2">Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter your name"
                      value={userData.display_name}
                      onChange={(e) => setUserData({...userData, display_name: e.target.value})}  
                      className={`input input-bordered h-12 
                        ${mode === 'edit' 
                          ? 'bg-base-100 text-primary-600 border-primary-500' 
                          : 'bg-base-300 text-base-content'
                        } 
                        disabled:bg-base-300 disabled:text-base-content/50`}
                      disabled={mode !== 'edit'}
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
                      className={`input input-bordered h-12 
                        ${mode === 'edit' 
                          ? 'bg-base-100 text-primary-600 border-primary-500' 
                          : 'bg-base-300 text-base-content/70'
                        } 
                        disabled:bg-base-300 disabled:text-base-content/50`}
                      disabled={mode !== 'edit'}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label text-base-content font-medium mb-2">Position</label>
                    <input 
                      type="text"
                      placeholder="Enter your position"
                      value={userData.position}
                      onChange={(e) => setUserData({...userData, position: e.target.value})}
                      className={`input input-bordered h-12 
                        ${mode === 'edit' 
                          ? 'bg-base-100 text-primary-600 border-primary-500' 
                          : 'bg-base-300 text-base-content/70'
                        } 
                        disabled:bg-base-300 disabled:text-base-content/50`}
                      disabled={mode !== 'edit'}
                    />
                  </div>
                </div>

                {/* Phone & Language (assuming we're adding language as shown in the image) */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="form-control">
                    <label className="label text-base-content font-medium mb-2">Phone Number</label>
                    {mode === 'edit' ? (
                      <PhoneInput
                        country={'tr'}
                        value={userData.phone ? userData.phone.toString() : ''}  // Ensure string conversion
                        onChange={(value: string | undefined, countryCode: string) => handlePhoneChange(value || '', countryCode)}
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
                      className={`select select-bordered h-12 w-full 
                        ${mode === 'edit' 
                          ? 'bg-base-100 text-primary-600 border-primary-500' 
                          : 'bg-base-300 text-base-content'
                        } 
                        disabled:bg-base-300 disabled:text-base-content/50`}
                      disabled={mode !== 'edit'}
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
                      className="select select-bordered h-12 w-full bg-base-100 text-primary-600 border-primary-500 disabled:bg-base-300 disabled:text-base-content/50"
                      disabled={mode !== 'edit'}
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
                      className={`select select-bordered h-12 
                        ${mode === 'edit' 
                          ? 'bg-base-100 text-primary-600 border-primary-500' 
                          : 'bg-base-300 text-base-content'
                        } 
                        disabled:bg-base-300 disabled:text-base-content/50`}
                      disabled={mode !== 'edit'}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="TRY">TRY</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-6">
                  <Button 
                    variant="solid"
                    color="secondary"
                    onClick={() => setIsBillingModalOpen(true)}
                  >
                    Billing Info
                  </Button>
                  {mode === 'view' ? (
                    <Button 
                      variant="solid"
                      color="primary"
                      onClick={handleEditProfile}
                      className="gap-2"
                    >
                      {buttonText}
                    </Button>
                  ) : (
                    <div className="flex gap-3">
                      <Button 
                        variant="solid"
                        color="secondary"
                        onClick={() => {
                          setMode('view');
                          // Reload user data to revert changes
                          const getUser = async () => {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user) {
                              const { data: existingInfo } = await supabase
                                .from('user_info')
                                .select('*')
                                .eq('user_id', user.id)
                                .single();
                              
                              if (existingInfo) {
                                setUserData({
                                  display_name: existingInfo.display_name || '',
                                  company: existingInfo.company || '',
                                  position: existingInfo.position || '',
                                  phone: existingInfo.phone || '',
                                  date_type: existingInfo.date_type || 'US',
                                  currency: existingInfo.currency || 'USD',
                                  pp_url: existingInfo.pp_url || '',
                                  language: existingInfo.language || 'English',
                                  phone_country_code: existingInfo.phone_country_code || ''
                                });
                              }
                            }
                          };
                          getUser();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="solid"
                        color="primary"
                        onClick={handleUpdate}
                        className="gap-2"
                      >
                        {buttonText}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
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

