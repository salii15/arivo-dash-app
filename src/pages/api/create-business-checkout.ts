import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { amount, customer_id, order_id, metadata } = req.body;

    if (!amount || !customer_id) {
      return res.status(400).json({ 
        message: 'Missing required parameters' 
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customer_id,
      payment_method_types: ['card'],
      mode: 'payment',
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto',    // Müşteri adını güncellemeye izin ver
        shipping: 'auto' // Teslimat bilgilerini güncellemeye izin ver
      },
      tax_id_collection: {
        enabled: true,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: metadata.title || 'Order Payment',
              tax_code: 'txcd_10000000', // Genel vergi kodu
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        order_id: order_id,
        order_number: metadata.order_number,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/orders?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/orders?canceled=true`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe API Error:', error);
    res.status(500).json({ 
      message: 'Error creating checkout session',
      details: (error as Error).message 
    });
  }
} 