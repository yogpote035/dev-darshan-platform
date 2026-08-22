# Dev Darshan Live

## Product Store

The application includes a product catalogue, cart, secure server-priced checkout, order history, and product subscriptions. A normal purchase charges the product total once. A ₹1 offer requires explicit consent for the shown recurring amount, has a product-configured introductory period (7 days by default), and is authorized through Razorpay Subscriptions—not a local cron charge.

## Razorpay configuration

Set the following only in your backend environment:

```env
RAZORPAY_KEY_ID=
RAZORPAY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

In Razorpay Dashboard, add a webhook at `https://YOUR_DOMAIN/api/webhooks/razorpay`, use the same webhook secret, and enable payment and subscription lifecycle events. Test the normal payment, offer authorization, recurring charge, cancellation, and webhook retry flows in Razorpay Test Mode before using live credentials.

Never expose the Razorpay secret or webhook secret to the frontend.
