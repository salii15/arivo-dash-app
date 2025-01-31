import { Dialog } from '@headlessui/react';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

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
  vat_number: string;
  company_registration_number: string;
  
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
    country: '',
    tax_id: '',
    phone: '',
    vat_number: '',
    company_registration_number: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchBillingInfo();
  }, []);

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
          return;
        }
        throw error;
      }

      if (data) {
        setBillingInfo(data);
        setHasBillingInfo(true);
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

      if (hasBillingInfo) {
        const { error } = await supabase
          .from('billing_info')
          .update(billingInfo)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('billing_info')
          .insert([{
            user_id: user.id,
            ...billingInfo
          }]);

        if (error) throw error;
      }

      alert('Billing information updated successfully!');
      setHasBillingInfo(true);
      onClose();
    } catch (error) {
      console.error('Error updating billing info:', error);
      alert('Error updating billing information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}className="relative z-50">
       <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-neutral-900 rounded-lg p-6 text-neutral-200 shadow-xl">
          <Dialog.Title className="text-2xl font-bold mb-6 flex justify-between items-center text-neutral-50">
            {hasBillingInfo ? 'Billing Information' : 'Create Billing Profile'}
            {hasBillingInfo && !isEditing && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            )}
          </Dialog.Title>

          {!hasBillingInfo && (
            <div className="mb-6 p-4 bg-blue-950/30 rounded-lg">
              <p className="text-blue-200">Please create your billing profile to continue.</p>
            </div>
          )}
          
          <div className="grid gap-6">
            {/* Company Information */}
            <div className="grid gap-4">
              <h3 className="text-lg font-semibold text-neutral-100">Company Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-neutral-300">Legal Company Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered bg-neutral-800 text-neutral-200 border-neutral-700 focus:border-blue-500"
                    value={billingInfo.legal_name}
                    onChange={(e) => setBillingInfo({...billingInfo, legal_name: e.target.value})}
                    disabled={hasBillingInfo && !isEditing}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-neutral-300">Tax ID</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered bg-neutral-800 text-neutral-200 border-neutral-700 focus:border-blue-500"
                    value={billingInfo.tax_id}
                    onChange={(e) => setBillingInfo({...billingInfo, tax_id: e.target.value})}
                    disabled={hasBillingInfo && !isEditing}
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="grid gap-4">
              <h3 className="text-lg font-semibold text-neutral-100">Address</h3>
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-neutral-300">Line 1</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered bg-neutral-800 text-neutral-200 border-neutral-700 focus:border-blue-500"
                  value={billingInfo.address1}
                  onChange={(e) => setBillingInfo({...billingInfo, address1: e.target.value})}
                  disabled={hasBillingInfo && !isEditing}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-neutral-300">Line 2</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered bg-neutral-800 text-neutral-200 border-neutral-700 focus:border-blue-500"
                  value={billingInfo.address2}
                  onChange={(e) => setBillingInfo({...billingInfo, address2: e.target.value})}
                  disabled={hasBillingInfo && !isEditing}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">City</label>
                  <input
                    type="text"
                    className="input input-bordered bg-neutral-800 text-neutral-200 border-neutral-700 focus:border-blue-500"
                    value={billingInfo.city}
                    onChange={(e) => setBillingInfo({...billingInfo, city: e.target.value})}
                    disabled={hasBillingInfo && !isEditing}
                  />
                </div>
                <div className="form-control">
                  <label className="label">State/Province</label>
                  <input
                    type="text"
                    className="input input-bordered bg-neutral-800 text-neutral-200 border-neutral-700 focus:border-blue-500"
                    value={billingInfo.state}
                    onChange={(e) => setBillingInfo({...billingInfo, state: e.target.value})}
                    disabled={hasBillingInfo && !isEditing}
                  />
                </div>
                <div className="form-control">
                  <label className="label">Postal Code</label>
                  <input
                    type="text"
                    className="input input-bordered bg-neutral-800 text-neutral-200 border-neutral-700 focus:border-blue-500"
                    value={billingInfo.postal_code}
                    onChange={(e) => setBillingInfo({...billingInfo, postal_code: e.target.value})}
                    disabled={hasBillingInfo && !isEditing}
                  />
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-neutral-300">Country</span>
                </label>
                <select
                  className="select select-bordered bg-neutral-800 text-neutral-200 border-neutral-700 focus:border-blue-500"
                  value={billingInfo.country}
                  onChange={(e) => setBillingInfo({...billingInfo, country: e.target.value})}
                  disabled={hasBillingInfo && !isEditing}
                >
                  <option value="">Select Country</option>
                  <option value="TR">Turkey</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                </select>
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid gap-4">
              <h3 className="text-lg font-semibold text-neutral-100">Additional Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">VAT Number</label>
                  <input
                    type="text"
                    className="input input-bordered bg-neutral-800 text-neutral-200 border-neutral-700 focus:border-blue-500"
                    value={billingInfo.vat_number}
                    onChange={(e) => setBillingInfo({...billingInfo, vat_number: e.target.value})}
                    disabled={hasBillingInfo && !isEditing}
                  />
                </div>
                <div className="form-control">
                  <label className="label">Company Registration Number</label>
                  <input
                    type="text"
                    className="input input-bordered bg-neutral-800 text-neutral-200 border-neutral-700 focus:border-blue-500"
                    value={billingInfo.company_registration_number}
                    onChange={(e) => setBillingInfo({...billingInfo, company_registration_number: e.target.value})}
                    disabled={hasBillingInfo && !isEditing}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            {(!hasBillingInfo || isEditing) && (
              <>
                <button
                  className="btn btn-ghost text-neutral-300 hover:bg-neutral-800"
                  onClick={() => {
                    if (isEditing) {
                      setIsEditing(false);
                      fetchBillingInfo();
                    } else {
                      onClose();
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    await handleBillingUpdate();
                    setIsEditing(false);
                  }}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (hasBillingInfo ? 'Save Changes' : 'Create Billing Profile')}
                </button>
              </>
            )}
            {hasBillingInfo && !isEditing && (
              <button
                className="btn btn-ghost text-neutral-300 hover:bg-neutral-800"
                onClick={onClose}
              >
                <span className="material-icons">close</span>
              </button>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 