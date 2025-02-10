import DashboardLayout from '@/pages/DashboardLayout';
import PlanCard from '../components/PlanCard';
import { useState } from 'react';

const plans = [
  {
    name: 'Starter',
    monthlyPrice: 39,
    yearlyPrice: 390,
    features: ['500 Credits', '5 Products', '10.000 views/mo', '3D Viewer', 'Augmented Reality', 'Integration', 'Basic Support'],
    stripePriceId: {
      monthly: 'price_1Qo59QP6o6wFrWDILI3kdMXh',
      yearly: 'price_1Qo5YqP6o6wFrWDIg4pYp4BO'
    }
  },
  {
    name: 'Pro',
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: ['2000 Credits', '15 Products', '30.000 views/mo', '3D Viewer', 'Augmented Reality', 'Integration', 'Basic Support'],
    isPopular: true,
    stripePriceId: {
      monthly: 'price_1Qo5AZP6o6wFrWDIIqOFLp2s',
      yearly: 'price_1Qo5ZcP6o6wFrWDIbPKBnwKa'
    }
  },
  {
    name: 'Business',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    features: ['5000 Credits', '30 Products', '100.000 views/mo', '3D Viewer', 'Augmented Reality', 'Integration', '3D Configurator', 'Animation Features', 'Basic Support'],
    stripePriceId: {
      monthly: 'price_1Qo5B6P6o6wFrWDIoCHpRKZS',
      yearly: 'price_1Qo5XtP6o6wFrWDINfTPtAVQ'
    }
  },
  {
    name: 'Custom',
    features: ['5 Product', '10.000 views/mo', '3D Viewer', 'Augmented Reality', 'Integration', 'Basic Support'],
  },
];

const creditPackages = [
    { credits: 100, price: 20, savings: 0 },
    { credits: 500, price: 90, savings: 10 },
    { credits: 1000, price: 160, savings: 20 },
    { credits: 5000, price: 700, savings: 30 }
  ];

export default function Pricing() {
  const [extraCredits, setExtraCredits] = useState(100);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const creditOptions = [100, 500, 1000, 5000];

  const [selectedCredits, setSelectedCredits] = useState(creditPackages[0]);


  const handleSubscribe = (planName: string) => {
    console.log(`Selected plan: ${planName}, Billing period: ${billingPeriod}`);
  };

  return (
    <DashboardLayout>
      <main className="bg-base-300 p-6">
        <h1 className="text-4xl font-bold mb-6 text-center text-base-content-light">Pricing Plans</h1>
        
        <div className="flex justify-center items-center gap-4 mb-6">
          <span className="text-base-content">Monthly</span>
          <input 
            type="checkbox" 
            className="toggle toggle-primary" 
            checked={billingPeriod === 'yearly'}
            onChange={(e) => setBillingPeriod(e.target.checked ? 'yearly' : 'monthly')}
          />
          <span className="text-base-content">Yearly</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <PlanCard 
              key={plan.name} 
              plan={plan} 
              billingPeriod={billingPeriod}
              onSubscribe={() => handleSubscribe(plan.name)}
            />
          ))}
        </div>
        <div className="mt-12 bg-base-200 rounded-xl p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Add Extra Credits</h2>
            <span className="px-4 py-2 bg-primary-600 rounded-full text-sm font-medium text-primary">
              Save up to 30%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="3"
                  value={creditPackages.indexOf(selectedCredits)}
                  onChange={(e) => setSelectedCredits(creditPackages[Number(e.target.value)])}
                  className="range range-primary w-full"
                  step="1"
                />
                <div className="flex justify-between px-2 mt-2">
                  {creditPackages.map((pkg) => (
                    <div 
                      key={pkg.credits}
                      className={`flex flex-col items-center ${
                        selectedCredits.credits === pkg.credits 
                          ? 'text-primary' 
                          : 'text-gray-400'
                      }`}
                    >
                      <span className="text-sm font-medium">{pkg.credits}</span>
                      <div className="w-1 h-1 rounded-full bg-current mt-1" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-base-300 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400">Selected Package</span>
                  <span className="text-2xl font-bold text-white">
                    {selectedCredits.credits} Credits
                  </span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400">Price</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">
                      ${selectedCredits.price}
                    </span>
                    {selectedCredits.savings > 0 && (
                      <span className="text-primary-600 text-sm ml-2">
                        Save {selectedCredits.savings}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-base-300 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Package Benefits
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-primary mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Never expires
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-primary mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Use across all features
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-primary mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Shareable with team
                </li>
              </ul>

              <button className="btn btn-primary w-full mt-6">
                Purchase {selectedCredits.credits} Credits
              </button>
            </div>
          </div>
        </div>
      </div>
      </main>
    </DashboardLayout>    
  );
} 