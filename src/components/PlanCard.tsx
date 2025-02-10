import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/utils/supabase';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Plan {
  name: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  features: string[];
  isPopular?: boolean;
  stripePriceId: {
    monthly?: string;
    yearly?: string;
  };
}

interface PlanCardProps {
  plan: {
    name: string;
    monthlyPrice?: number;
    yearlyPrice?: number;
    features: string[];
    isPopular?: boolean;
    stripePriceId?: {
      monthly?: string;
      yearly?: string;
    };
  };
  billingPeriod: 'monthly' | 'yearly';
  onSubscribe: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, billingPeriod, onSubscribe }) => {
  const [isAnnual, setIsAnnual] = useState(false);
  const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

  const renderPrice = () => {
    if (!price) {
      return <p className="text-xl">Contact us for pricing</p>;
    }

    if (billingPeriod === 'yearly' && plan.monthlyPrice) {
      const annualMonthlyPrice = plan.monthlyPrice * 12;
      return (
        <div className="text-center space-y-1">
          <p className="text-lg line-through text-base-content/70">
            ${annualMonthlyPrice}/year
          </p>
          <p className="text-3xl font-bold text-base-content">
            ${price}
            <span className="text-sm font-normal">/year</span>
          </p>
        </div>
      );
    }

    return (
      <p className="text-3xl font-bold text-base-content">
        ${price}
        <span className="text-sm font-normal">/{billingPeriod === 'monthly' ? 'mo' : 'year'}</span>
      </p>
    );
  };

  const handleSubscribe = async () => {
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      // Get user's email from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get stripe_customer_id from billing_info
      const { data: billingInfo, error: billingError } = await supabase
        .from('billing_info')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single();

      if (billingError) {
        console.error('Error fetching billing info:', billingError);
      }

      const priceId = plan.stripePriceId?.[billingPeriod === 'monthly' ? 'monthly' : 'yearly'];

      if (!priceId) {
        throw new Error('No price ID available for this billing period');
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          billingPeriod,
          email: user.email,
          stripeId: billingInfo?.stripe_customer_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
      }

      const session = await response.json();
      console.log('Checkout Session:', session); // Debug log

      if (!session.sessionId) {
        throw new Error('No sessionId received from server');
      }

      const result = await stripe.redirectToCheckout({
        sessionId: session.sessionId,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Error:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className={`
      card backdrop-blur-sm
      transition-all duration-300 ease-in-out
      rounded-lg shadow-lg p-6 flex flex-col justify-between
      ${plan.isPopular 
        ? 'bg-base-300/70 border-2 border-primary-500 scale-105 shadow-xl shadow-primary-500/20' 
        : 'bg-base-300/50 border border-secondary-700 hover:border-primary-500 hover:scale-102'}
    `}>
      {plan.isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="px-4 py-1 bg-primary-500 text-xs font-semibold rounded-full text-secondary-900 shadow-lg">
            MOST POPULAR
          </span>
        </div>
      )}
      <div className="space-y-6">
        <h2 className="text-4xl font-bold text-base-content-light text-center">{plan.name}</h2>
        <div className="text-center">
          {renderPrice()}
        </div>

        <div className="space-y-4">
          <h3 className="text-base-content-dim font-medium">Top Features</h3>
          <ul className="space-y-3">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-base-content">
                <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <button className={`
          w-full py-3 px-4 rounded-lg font-medium
          transition-all duration-200
          ${plan.name === 'Custom'
            ? 'bg-secondary-700 hover:bg-secondary-600 text-base-content'
            : 'bg-primary-500 hover:bg-primary-600 text-secondary-900'}
        `} onClick={handleSubscribe}>
          {plan.name === 'Custom' ? 'Contact Us' : 'Subscribe'}
        </button>
      </div>
    </div>
  );
};

export default PlanCard;
