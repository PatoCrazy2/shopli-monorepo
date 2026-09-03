import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey && process.env.NODE_ENV === "production") {
  console.warn("⚠️ Advertencia: STRIPE_SECRET_KEY no está definida en las variables de entorno.");
}

export const stripe = new Stripe(stripeSecretKey || "sk_test_placeholder", {
  typescript: true,
  appInfo: {
    name: "ShopLI POS",
    version: "1.0.0",
  },
});
