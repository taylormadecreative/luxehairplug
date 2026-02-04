require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Deposit amount in cents ($20.00)
const DEPOSIT_AMOUNT = 2000;

// Service prices for validation
const servicePrices = {
    'wig-install': { name: 'Wig Install', price: 50 },
    'wig-install-style': { name: 'Wig Install + Style', price: 60 },
    'qw-middle-side': { name: 'Quick Weave Middle/Side Part', price: 70 },
    'qw-fulani': { name: 'Fulani Quick Weave', price: 85 },
    'island-small': { name: 'Island Twist Small', price: 115 },
    'island-medium': { name: 'Island Twist Medium', price: 100 },
    'softlocs-small': { name: 'Soft Locs Small', price: 130 },
    'softlocs-medium': { name: 'Soft Locs Medium', price: 100 },
    'knotless-xs': { name: 'Knotless Xtra Small', price: 180 },
    'knotless-small': { name: 'Knotless Small', price: 130 },
    'knotless-medium': { name: 'Knotless Medium', price: 115 },
    'knotless-large': { name: 'Knotless Large', price: 90 },
    'knotless-bob': { name: 'Knotless Bob', price: 100 },
    'stitch-small-freestyle': { name: 'Stitch Braids Small Freestyle', price: 115 },
    'stitch-freestyle': { name: 'Stitch Braids Freestyle', price: 105 },
    'stitch-fulani': { name: 'Fulani Braids', price: 115 },
    'stitch-2braids': { name: '2 Braids', price: 40 },
    'natural-cornrows': { name: "Men's Cornrows", price: 45 },
    'natural-plaits': { name: 'Plaits', price: 60 },
    'natural-twist': { name: 'Twist', price: 45 },
    'locs-starter': { name: 'Starter Locs', price: 65 },
    'locs-retwist': { name: 'Retwist', price: 45 },
    'locs-twostrand': { name: 'Two Strand', price: 65 },
    'locs-barrels': { name: 'Barrels', price: 75 }
};

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname)));

// Parse JSON for most routes
app.use((req, res, next) => {
    if (req.originalUrl === '/webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Create Payment Intent endpoint
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { booking } = req.body;

        // Validate booking data
        if (!booking || !booking.service || !booking.name || !booking.phone || !booking.date) {
            return res.status(400).json({ error: 'Missing required booking information' });
        }

        // Validate service exists
        const service = servicePrices[booking.service];
        if (!service) {
            return res.status(400).json({ error: 'Invalid service selected' });
        }

        // Create Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: DEPOSIT_AMOUNT,
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                customer_name: booking.name,
                customer_phone: booking.phone,
                customer_instagram: booking.instagram || '',
                service_id: booking.service,
                service_name: service.name,
                service_price: service.price.toString(),
                appointment_date: booking.date,
                notes: booking.notes || '',
                deposit_amount: (DEPOSIT_AMOUNT / 100).toString(),
                remaining_balance: (service.price - DEPOSIT_AMOUNT / 100).toString()
            },
            description: `Luxehairplug Deposit - ${service.name} for ${booking.name}`,
            receipt_email: booking.email || undefined
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook endpoint for Stripe events
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('Payment succeeded!');
            console.log('Customer:', paymentIntent.metadata.customer_name);
            console.log('Phone:', paymentIntent.metadata.customer_phone);
            console.log('Service:', paymentIntent.metadata.service_name);
            console.log('Date:', paymentIntent.metadata.appointment_date);
            console.log('Amount:', `$${paymentIntent.amount / 100}`);

            // Here you could:
            // - Send a confirmation text/email
            // - Add to a Google Sheet or database
            // - Send notification to your phone
            break;

        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log('Payment failed:', failedPayment.last_payment_error?.message);
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
});

// Get booking details by payment intent (for confirmation page)
app.get('/booking/:paymentIntentId', async (req, res) => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(req.params.paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            res.json({
                success: true,
                booking: paymentIntent.metadata
            });
        } else {
            res.json({
                success: false,
                status: paymentIntent.status
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ========================================
    Luxehairplug Server Running!
    ========================================

    Local:    http://localhost:${PORT}

    Stripe:   ${process.env.STRIPE_SECRET_KEY ? 'Configured' : 'NOT CONFIGURED - Add STRIPE_SECRET_KEY to .env'}
    Webhook:  ${process.env.STRIPE_WEBHOOK_SECRET ? 'Configured' : 'Not configured (optional for testing)'}

    ========================================
    `);
});
