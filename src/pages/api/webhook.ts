import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { supabase } from '@/utils/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature']!;

  try {
    const event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (!session.metadata || !session.metadata.order_id) {
            throw new Error('Order ID is missing in session metadata.');
        }

        // Update the order in Supabase
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            paid: true,
            payment_status: 'completed',
            payment_id: session.payment_intent as string,
            updated_at: new Date().toISOString(),
          })
          .eq('id', session.metadata.order_id);

        if (updateError) throw updateError;
        break;

      case 'payment_intent.payment_failed':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Başarısız ödemeyi güncelle
        const { error: failedError } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentIntent.metadata?.orderId);

        if (failedError) throw failedError;
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({
      message: 'Webhook error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 