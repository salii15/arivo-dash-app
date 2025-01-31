import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../utils/stripe'; // Stripe instance'ınızı içe aktarın

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const orderData = req.body;

        try {
            // Mevcut müşteri bilgilerini çekin
            const customer = await stripe.customers.retrieve(orderData.billingInfo.customer_id);

            // Checkout session'ı oluşturun
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: orderData.billingInfo.currency,
                            product_data: {
                                name: orderData.title,
                                description: 'Business Invoice for ' + orderData.title,
                            },
                            unit_amount: orderData.amount * 100,
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${req.headers.origin}/cancel`,
                customer: customer.id, // Mevcut müşteri ID'sini kullanın
                metadata: {
                    order_id: orderData.orderId,
                },
            });

            res.status(200).json({ url: session.url });
        } catch (error) {
            console.error('Error creating checkout session:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
