/**
 * Payment service - Razorpay TEST MODE only.
 *
 * This wraps order creation and signature verification. Nothing here ever
 * runs against live Razorpay unless the caller supplies live keys, and this
 * application is only designed to be used with Razorpay's test credentials.
 */

const crypto = require("crypto");

let razorpayClient = null;

function getClient() {
  if (razorpayClient) return razorpayClient;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  // Lazy require so the app still boots if the package or keys are absent.
  // eslint-disable-next-line global-require
  const Razorpay = require("razorpay");
  razorpayClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return razorpayClient;
}

function isConfigured() {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

async function createOrder({ amountInPaise, receipt, notes }) {
  const client = getClient();
  if (!client) {
    const error = new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (test mode) in the backend .env file."
    );
    error.statusCode = 503;
    throw error;
  }

  const order = await client.orders.create({
    amount: Math.round(amountInPaise),
    currency: "INR",
    receipt,
    notes,
  });

  return order;
}

function verifySignature({ orderId, paymentId, signature }) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expected === signature;
}

module.exports = { isConfigured, createOrder, verifySignature };
