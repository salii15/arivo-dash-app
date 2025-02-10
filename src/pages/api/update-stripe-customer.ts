import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { customer_id, legal_name, email, phone_number, address1, address2, city, state, postal_code, country } = req.body;

    try {
      const customer = await stripe.customers.update(customer_id, {
        name: legal_name,
        email: email,
        phone: phone_number,

        address: {
          line1: address1,
          line2: address2,
          city: city,
          state: state,
          postal_code: postal_code,
          country: country,
        },
        metadata: {
            legal_name,
         
        },
      });

      res.status(200).json(customer);
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({ error: 'Failed to update customer' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 