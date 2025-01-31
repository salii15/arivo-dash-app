import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email, legal_name, address1, address2, city, state, postal_code, country, phone_number, currency, tax_id_type, tax_id_value } = req.body;

    try {
      const customer = await stripe.customers.create({
        name: legal_name,
        email: email,
        tax_id_data: [{ type: tax_id_type, value: tax_id_value }],
        
        address: {
          line1: address1,
          line2: address2,
          city: city,
          state: state,
          postal_code: postal_code,
          country: country,
        },

        metadata: {
          currency,
          customer_type: 'business',

        },
      });

      res.status(200).json({ customer });
    } catch (error: any) {
      console.error('Error creating Stripe customer:', error);
      console.error('Error details:', (error as any).response?.data);
      res.status(500).json({ error: 'Failed to create customer' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 