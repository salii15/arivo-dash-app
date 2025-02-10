import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { credits, price, customerId, email } = req.body;

    let customer;
    if (customerId) {
      customer = customerId;
    } else {
      const newCustomer = await stripe.customers.create({
        email,
      });
      customer = newCustomer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${credits} Credits Package`,
          },
          unit_amount: price * 100, // Convert to cents
        },
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans?canceled=true`,
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 