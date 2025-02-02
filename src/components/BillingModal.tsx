import { Dialog } from '@headlessui/react';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { FolderKanban, Pencil, Check, X } from 'lucide-react';
import Stripe from 'stripe';
import turkeyStates from '../../public/turkey_states.json'; // Adjust the path as necessary
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface BillingInfo {
  legal_name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  tax_id: string;
  phone: string;
  stripe_customer_id?: string;
}

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BillingModal({ isOpen, onClose }: BillingModalProps) {
  const [loading, setLoading] = useState(false);
  const [hasBillingInfo, setHasBillingInfo] = useState(false);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    legal_name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    tax_id: '',
    phone: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [mode, setMode] = useState<'create' | 'view' | 'edit'>('create');
  const [states, setStates] = useState<{ code: string; name: string }[]>([]);
  const [country, setCountry] = useState<string>('US');

  const phoneInputStyle = {
    container: "!w-full",
    inputClass: `!w-full !h-12 input input-bordered 
                 !pl-[48px] !rounded-lg
                 focus:!border-primary-500 focus:!ring-primary-500
                 disabled:!bg-neutral-600 disabled:!text-neutral-300
                 !bg-neutral-600 ${mode === 'edit' ? '!text-primary-600 !border-primary-500' : '!text-neutral-900'}`,
    buttonClass: "!h-12 !rounded-lg !bg-neutral-600 !border-primary-500",
    dropdownClass: "!bg-neutral-600 !text-neutral-900 !rounded-lg"
  };

  const handlePhoneChange = (value: string, countryCode: string) => {
    setBillingInfo({
      ...billingInfo,
      phone: value
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchBillingInfo();
    }
  }, [isOpen]);

  const fetchBillingInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('billing_info')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // no rows returned
          setHasBillingInfo(false);
          setMode('create');
          return;
        }
        throw error;
      }

      if (data && data.user_id === user.id && Object.keys(data).length > 0) {
        setBillingInfo(data);
        setHasBillingInfo(true);
        setMode('view');
      } else {
        setHasBillingInfo(false);
        setMode('create');
      }
    } catch (error) {
      console.error('Error fetching billing info:', error);
    }
  };

  const handleBillingUpdate = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      // Log the billing info before making the API call
      console.log('Billing Info:', billingInfo);

      // Save billing info to Supabase
      if (hasBillingInfo) {
        const { error } = await supabase
          .from('billing_info')
          .update(billingInfo)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update customer in Stripe via API route
        const response = await fetch('/api/update-stripe-customer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            name: billingInfo.legal_name,
            phone_number: billingInfo.phone,
            address1: billingInfo.address1,
            address2: billingInfo.address2,
            city: billingInfo.city,
            state: billingInfo.state,
            postal_code: billingInfo.postal_code,
            customer_id: billingInfo.stripe_customer_id,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update Stripe customer');
        }
      } else {
        const { error } = await supabase
          .from('billing_info')
          .insert([{
            user_id: user.id,
            ...billingInfo
          }]);

        if (error) throw error;

        // Create a customer in Stripe via API route
        const currency = billingInfo.country === 'US' ? 'USD' : billingInfo.country === 'TR' ? 'TRY' : 'USD';
        const taxIdType = billingInfo.country === 'US' ? 'us_ein' : billingInfo.country === 'TR' ? 'tr_tin' : 'us_ein';

        const requestBody = {
          email: user.email,
          name: billingInfo.legal_name,
          phone_number: billingInfo.phone,
          currency: currency,
          tax_id_type: taxIdType,
          tax_id_value: billingInfo.tax_id,
          address1: billingInfo.address1,
          address2: billingInfo.address2,
          city: billingInfo.city,
          state: billingInfo.state,
          postal_code: billingInfo.postal_code,
          country: billingInfo.country,
        };

        console.log('Request Body for Stripe API:', requestBody); // Log the request body

        const response = await fetch('/api/create-stripe-customer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        // Log the response status and body
        console.log('Stripe API Response Status:', response.status);
        const responseData = await response.json();
        console.log('Stripe API Response Data:', responseData);

        if (!response.ok) {
          throw new Error(`Failed to create Stripe customer: ${responseData.message || 'Unknown error'}`);
        }

        const { customer } = responseData;

        // Update billing_info with Stripe customer ID
        const { error: billingInfoError } = await supabase
          .from('billing_info')
          .update({ stripe_customer_id: customer.id })
          .eq('user_id', user.id);

        if (billingInfoError) throw billingInfoError;

        // Update user_info with Stripe customer ID
        const { error: userInfoError } = await supabase
          .from('user_info')
          .update({ stripe_customer_id: customer.id })
          .eq('user_id', user.id);

        if (userInfoError) throw userInfoError;
      }

      alert('Billing information updated successfully!');
      setHasBillingInfo(true);
      onClose();
      window.location.reload();
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      console.error('Error updating billing info:', error);
      alert(`Error updating billing information: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (value: string) => {
    // Ülke değiştiğinde telefon numarasını sıfırla ve yeni ülkeyi ayarla
    setBillingInfo({ 
      ...billingInfo, 
      country: value, 
      tax_id: '',
      phone: '' // Telefon numarasını sıfırla
    });
    
    if (value === 'US') {
      setStates([
        { code: 'AL', name: 'Alabama' },
        { code: 'AK', name: 'Alaska' },
        { code: 'AZ', name: 'Arizona' },
        { code: 'AR', name: 'Arkansas' },
        { code: 'CA', name: 'California' },
        { code: 'CO', name: 'Colorado' },
        { code: 'CT', name: 'Connecticut' },
        { code: 'DE', name: 'Delaware' },
        { code: 'FL', name: 'Florida' },
        { code: 'GA', name: 'Georgia' },
        { code: 'HI', name: 'Hawaii' },
        { code: 'ID', name: 'Idaho' },
        { code: 'IL', name: 'Illinois' },
        { code: 'IN', name: 'Indiana' },
        { code: 'IA', name: 'Iowa' },
        { code: 'KS', name: 'Kansas' },
        { code: 'KY', name: 'Kentucky' },
        { code: 'LA', name: 'Louisiana' },
        { code: 'ME', name: 'Maine' },
        { code: 'MD', name: 'Maryland' },
        { code: 'MA', name: 'Massachusetts' },
        { code: 'MI', name: 'Michigan' },
        { code: 'MN', name: 'Minnesota' },
        { code: 'MS', name: 'Mississippi' },
        { code: 'MO', name: 'Missouri' },
        { code: 'MT', name: 'Montana' },
        { code: 'NE', name: 'Nebraska' },
        { code: 'NV', name: 'Nevada' },
        { code: 'NH', name: 'New Hampshire' },
        { code: 'NJ', name: 'New Jersey' },
        { code: 'NM', name: 'New Mexico' },
        { code: 'NY', name: 'New York' },
        { code: 'NC', name: 'North Carolina' },
        { code: 'ND', name: 'North Dakota' },
        { code: 'OH', name: 'Ohio' },
        { code: 'OK', name: 'Oklahoma' },
        { code: 'OR', name: 'Oregon' },
        { code: 'PA', name: 'Pennsylvania' },
        { code: 'RI', name: 'Rhode Island' },
        { code: 'SC', name: 'South Carolina' },
        { code: 'SD', name: 'South Dakota' },
        { code: 'TN', name: 'Tennessee' },
        { code: 'TX', name: 'Texas' },
        { code: 'UT', name: 'Utah' },
        { code: 'VT', name: 'Vermont' },
        { code: 'VA', name: 'Virginia' },
        { code: 'WA', name: 'Washington' },
        { code: 'WV', name: 'West Virginia' },
        { code: 'WI', name: 'Wisconsin' },
        { code: 'WY', name: 'Wyoming' },
      ]);
    } else if (value === 'TR') {
      setStates(turkeyStates);
    } else {
      setStates([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box bg-base-200 max-w-2xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <PageHeader 
            title={mode === 'create' ? 'Create Billing Profile' : 'Billing Information'}
            description={mode === 'create' ? 'Please create your billing profile to continue.' : ''}
            bgColor="bg-base-100"
            padding='p-4'
            icon={<FolderKanban className="w-5 h-5" />}
          />
          <Button variant="close" color="primary" onClick={onClose}></Button>
        </div>
        <div className=" overflow-auto max-h-[700px]">
          <div className="grid gap-6">
            {/* Company Information */}
            <div className="grid gap-2 bg-neutral-700 p-2 rounded-lg">
              <h3 className="text-md font-medium text-primary-800 ">Company Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-light text-xs text-primary-600">Legal Company Name</span>
                  </label>
                  <input
                    type="text"
                    className={`input  input-bordered text-sm ${mode === 'edit' ? 'bg-neutral-500 border-2 border-neutral-300/25' : 'bg-neutral-600'} text-neutral-900 border-neutral-700 focus:border-primary-500 disabled:bg-neutral-600 disabled:text-neutral-300`}
                    value={billingInfo.legal_name}
                    onChange={(e) => setBillingInfo({...billingInfo, legal_name: e.target.value})}
                    disabled={mode === 'view'}
                    placeholder={mode === 'view' ? billingInfo.legal_name : ''}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-light text-xs text-primary-600">Tax ID</span>
                  </label>
                  <input
                    type="text"
                    className={`input  input-bordered text-sm ${mode === 'edit' ? 'bg-neutral-500 border-2 border-neutral-300/25' : 'bg-neutral-600'} text-neutral-900 border-neutral-700 focus:border-primary-500 disabled:bg-neutral-600 disabled:text-neutral-300`}
                    value={billingInfo.tax_id}
                    onKeyPress={(e) => {
                      const regex = billingInfo.country === 'US' ? /^[0-9]*$/ : /^[0-9]*$/; // Allow only numbers
                      if (!regex.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const value = e.target.value;
                      let formattedValue = value.replace(/\D/g, ''); // Remove non-digit characters

                      // Format tax ID based on selected country
                      if (billingInfo.country === 'US') {
                        // Allow only 9 digits and format as XX-XXXXXXX
                        if (formattedValue.length > 2) {
                          formattedValue = `${formattedValue.slice(0, 2)}-${formattedValue.slice(2, 9)}`; // Add hyphen after the second digit
                        }
                        formattedValue = formattedValue.slice(0, 10); // Limit to 10 characters (2 + 1 + 7)
                      } else if (billingInfo.country === 'TR') {
                        // Allow only 10 digits for Turkey
                        formattedValue = formattedValue.slice(0, 10); // Limit to 10 digits
                      }

                      setBillingInfo({...billingInfo, tax_id: formattedValue});
                    }}
                    disabled={mode === 'view'}
                    placeholder={mode === 'view' ? billingInfo.tax_id : ''}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-light text-xs text-primary-600">Phone Number</span>
                  </label>
                  <PhoneInput
                    country={billingInfo.country.toLowerCase() as 'tr' | 'us' | 'gb'}
                    value={billingInfo.phone}
                    onChange={(value: string, countryData: any) => handlePhoneChange(value, countryData.countryCode)}
                    containerClass={phoneInputStyle.container}
                    inputClass={`${phoneInputStyle.inputClass} ${mode === 'view' ? '!text-neutral-300' : ''}`}
                    buttonClass={phoneInputStyle.buttonClass}
                    dropdownClass={phoneInputStyle.dropdownClass}
                    disabled={mode === 'view'}
                    countryCodeEditable={false}
                    enableSearch={false}
                    disableCountryCode={false}
                    inputProps={{
                      name: 'phone',
                      required: true,
                      autoFocus: false,
                      defaultValue: mode === 'view' ? billingInfo.phone : '',
                      value: billingInfo.phone,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="grid gap-4 bg-neutral-700 p-2 rounsded-lg overflow-auto">
              <h3 className="text-md font-medium text-primary-800">Address</h3>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-light text-xs text-primary-600">Line 1</span>
                </label>
                <input
                  type="text"
                  className={`input  input-bordered text-sm ${mode === 'edit' ? 'bg-neutral-500 border-2 border-neutral-300/25' : 'bg-neutral-600'} text-neutral-900 border-neutral-700 focus:border-primary-500 disabled:bg-neutral-600 disabled:text-neutral-300`}
                  value={billingInfo.address1}
                  onChange={(e) => setBillingInfo({...billingInfo, address1: e.target.value})}
                  disabled={mode === 'view'}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-light text-xs text-primary-600">Line 2</span>
                </label>
                <input
                  type="text"
                  className={`input  input-bordered text-sm ${mode === 'edit' ? 'bg-neutral-500 border-2 border-neutral-300/25' : 'bg-neutral-600'} text-neutral-900 border-neutral-700 focus:border-primary-500 disabled:bg-neutral-600 disabled:text-neutral-300`}
                  value={billingInfo.address2}
                  onChange={(e) => setBillingInfo({...billingInfo, address2: e.target.value})}
                  disabled={mode === 'view'}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-light text-xs text-primary-600">City</span>
                  </label>
                  <input
                    type="text"
                    className={`input  input-bordered text-sm ${mode === 'edit' ? 'bg-neutral-500 border-2 border-neutral-300/25' : 'bg-neutral-600'} text-neutral-900 border-neutral-700 focus:border-primary-500 disabled:bg-neutral-600 disabled:text-neutral-300`}
                    value={billingInfo.city}
                    onChange={(e) => setBillingInfo({...billingInfo, city: e.target.value})}
                    disabled={mode === 'view'}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-light text-xs text-primary-600">State/Province</span>
                  </label>
                  <select
                    className={`select select-bordered ${mode === 'edit' ? 'bg-neutral-500 border-2 border-neutral-300/25' : 'bg-neutral-600'} text-neutral-900 border-neutral-700 focus:border-primary-500 disabled:bg-neutral-600 disabled:text-neutral-300`}
                    value={mode === 'view' ? 
                      billingInfo.country === 'TR' ? 
                        turkeyStates.find(state => state.code === billingInfo.state)?.name || billingInfo.state 
                        : states.find(state => state.code === billingInfo.state)?.name || billingInfo.state 
                      : billingInfo.state} 
                    onChange={(e) => setBillingInfo({ ...billingInfo, state: e.target.value })}
                    disabled={mode === 'view' || (billingInfo.country !== 'TR' && billingInfo.country !== 'US')}
                  >
                    <option value={mode === 'view' ? 
                      billingInfo.country === 'TR' ? 
                        turkeyStates.find(state => state.code === billingInfo.state)?.name || '' 
                        : states.find(state => state.code === billingInfo.state)?.name || '' 
                      : ''}>
                      {mode === 'view' ? 
                        billingInfo.country === 'TR' ? 
                          turkeyStates.find(state => state.code === billingInfo.state)?.name || 'Select State'
                          : states.find(state => state.code === billingInfo.state)?.name || 'Select State' 
                        : 'Select State'}
                    </option>
                    {mode !== 'view' && states.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-light text-xs text-primary-600">Postal Code</span>
                  </label>
                  <input
                    type="text"
                    className={`input  input-bordered text-sm ${mode === 'edit' ? 'bg-neutral-500 border-2 border-neutral-300/25' : 'bg-neutral-600'} text-neutral-900 border-neutral-700 focus:border-primary-500 disabled:bg-neutral-600 disabled:text-neutral-300`}
                    value={billingInfo.postal_code}
                    onKeyPress={(e) => {
                      const regex = /^[0-9]*$/; // Allow only numbers
                      if (!regex.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
                      let formattedValue = value.slice(0, 5); // Limit to 5 digits

                      setBillingInfo({...billingInfo, postal_code: formattedValue});
                    }}
                    disabled={mode === 'view'}
                    placeholder={mode === 'view' ? billingInfo.postal_code : ''}
                  />
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-light text-xs text-primary-600">Country</span>
                </label>
                <select
                  className={`select select-bordered ${mode === 'edit' ? 'bg-neutral-500 border-2 border-neutral-300/25' : 'bg-neutral-600'} text-neutral-900 border-neutral-700 focus:border-primary-500 disabled:bg-neutral-600 disabled:text-neutral-300`}
                  value={billingInfo.country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    handleCountryChange(e.target.value);
                  }}
                  disabled={mode === 'view'}
                >
                  <option value="">Select Country</option>
                  <option value="TR">Turkey</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                </select>
              </div>
            </div>

          </div>
        </div>
        <div className="modal-action">
          {mode === 'create' && (
            <Button 
              type="button" 
              onClick={async () => {
                await handleBillingUpdate();
                setMode('view');
              }}
              className="btn-primary"
              disabled={loading}
            >
              Create Profile
            </Button>
          )}
          {mode === 'view' && (
            <>
             {/* Not
              <Button
                variant="solid"
                color="primary" 
                onClick={() => setMode('edit')}
              > 
                Edit Profile
              </Button>
               */}
              <p className="text-sm text-gray-500 mt-2">
               Please <a href="/contact" className="text-blue-500 underline">contact us</a> for the change the billing infomations.
              </p>
            </>
          )}
          {mode === 'edit' && (
            <>
              <Button 
                variant="solid"
                color="secondary" 
                onClick={() => {
                  setMode('view');
                  fetchBillingInfo();
                }}
                className="btn-outline"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={async () => {
                  await handleBillingUpdate();
                  setMode('view');
                }}
                className="btn-primary"
                disabled={loading}
              >
                Save Profile
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 