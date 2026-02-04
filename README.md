# Luxehairplug - Hair Styling Booking Website

A beautiful booking website with Stripe payment integration for collecting $20 deposits.

## Quick Start

### 1. Install Dependencies
```bash
cd luxehairplug
npm install
```

### 2. Set Up Stripe

1. Create a free Stripe account at [stripe.com](https://stripe.com)
2. Go to [Stripe Dashboard > Developers > API keys](https://dashboard.stripe.com/apikeys)
3. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)
4. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)

### 3. Configure API Keys

**Backend (.env file):**
```bash
# Edit the .env file
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
```

**Frontend (index.html):**
Find this line near the bottom of `index.html` and replace with your publishable key:
```javascript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_actual_publishable_key_here';
```

### 4. Run the Server
```bash
npm start
```

### 5. Open in Browser
Visit: **http://localhost:3000**

---

## How It Works

1. Customer fills out the booking form (name, phone, service, date)
2. They can choose to:
   - **Pay $20 Deposit** - Opens payment modal with Stripe
   - **Request Only** - Sends booking without payment
3. After successful payment:
   - Customer sees confirmation with remaining balance
   - Payment details are logged on the server
   - Metadata includes all booking info (name, phone, service, date)

---

## Stripe Test Cards

Use these card numbers for testing:

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 9995 | Insufficient funds |

Use any future expiry date (e.g., 12/34) and any 3-digit CVC.

---

## Going Live (Real Payments)

1. Complete Stripe account verification at [dashboard.stripe.com](https://dashboard.stripe.com)
2. Switch from test keys to live keys:
   - Replace `sk_test_...` with `sk_live_...` in `.env`
   - Replace `pk_test_...` with `pk_live_...` in `index.html`
3. Deploy to a hosting service (see below)

---

## Deployment Options

### Option 1: Railway (Recommended - Free tier available)
1. Push code to GitHub
2. Connect repo at [railway.app](https://railway.app)
3. Add environment variable: `STRIPE_SECRET_KEY`
4. Deploy!

### Option 2: Render
1. Push code to GitHub
2. Create new Web Service at [render.com](https://render.com)
3. Add environment variable: `STRIPE_SECRET_KEY`
4. Deploy!

### Option 3: Heroku
```bash
heroku create luxehairplug
heroku config:set STRIPE_SECRET_KEY=sk_live_your_key
git push heroku main
```

---

## Files Overview

```
luxehairplug/
├── index.html      # Main website (frontend)
├── server.js       # Express server with Stripe (backend)
├── package.json    # Dependencies
├── .env            # Your secret keys (DO NOT SHARE)
├── .env.example    # Example environment file
├── .gitignore      # Protects .env from being committed
└── README.md       # This file
```

---

## Viewing Payments

All successful payments appear in your [Stripe Dashboard](https://dashboard.stripe.com/payments) with:
- Customer name & phone
- Service booked
- Appointment date
- Instagram handle (if provided)

---

## Support

For Stripe issues: [stripe.com/support](https://stripe.com/support)

Made with love for Luxehairplug
