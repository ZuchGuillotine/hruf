import Stripe from "stripe";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { log } from "../vite";

// Check for Stripe API key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Define subscription plans
export const PLANS = {
  FREE: {
    id: "free",
    name: "Free Tier",
    features: ["Basic supplement tracking", "AI health query assistant (5/day)", "Manual health data logging"],
    tier: "free",
  },
  MONTHLY: {
    id: "monthly",
    name: "Premium Monthly",
    price: 2199, // $21.99 in cents
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID,
    features: ["Unlimited AI health queries", "Lab upload and analysis", "Advanced health data analytics"],
    tier: "premium",
  },
  ANNUAL: {
    id: "annual",
    name: "Premium Annual",
    price: 18471, // $184.71 in cents (30% discount compared to monthly)
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID,
    features: ["Unlimited AI health queries", "Lab upload and analysis", "Advanced health data analytics"],
    tier: "premium",
  },
};

/**
 * Create a checkout session for subscription
 */
export const createCheckoutSession = async ({
  planId,
  isAnnual = false,
  successUrl = `${process.env.PUBLIC_URL || ""}/auth`,
  cancelUrl = `${process.env.PUBLIC_URL || ""}/`,
}: {
  planId: string;
  isAnnual?: boolean;
  successUrl?: string;
  cancelUrl?: string;
}) => {
  try {
    // Get plan details based on ID
    let selectedPlan = PLANS.MONTHLY;
    if (planId === "annual" || isAnnual) {
      selectedPlan = PLANS.ANNUAL;
    }

    // Make sure we have the price ID
    if (!selectedPlan.priceId) {
      if (isAnnual) {
        throw new Error("Missing STRIPE_ANNUAL_PRICE_ID environment variable");
      } else {
        throw new Error("Missing STRIPE_MONTHLY_PRICE_ID environment variable");
      }
    }

    // Add purchase identifier to success URL for post-payment account creation
    const purchaseId = `purchase_${Date.now()}`;
    const fullSuccessUrl = `${successUrl}?session_id={CHECKOUT_SESSION_ID}&purchase_id=${purchaseId}`;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: fullSuccessUrl,
      cancel_url: cancelUrl,
      client_reference_id: purchaseId,
      customer_email: undefined, // We don't know the email yet, user will register after payment
      allow_promotion_codes: true,
      metadata: {
        planId,
        isAnnual: isAnnual ? "true" : "false",
        purchaseId,
      },
    });

    return { 
      url: session.url,
      sessionId: session.id,
      purchaseId,
    };
  } catch (error) {
    log(`Stripe checkout session creation error: ${error}`, "express");
    throw error;
  }
};

/**
 * Handle Stripe webhook events
 */
export const handleStripeWebhook = async (
  signature: string,
  rawBody: string | Buffer
) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable");
  }

  try {
    // Verify and construct the event
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );

    // Handle specific events
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        log(`Unhandled Stripe event: ${event.type}`, "express");
    }

    return { received: true };
  } catch (error) {
    log(`Stripe webhook error: ${error}`, "express");
    throw error;
  }
};

/**
 * Handle checkout.session.completed event
 * This is fired when a customer completes the checkout process
 * For our flow, the user hasn't created an account yet, so we'll just log this
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  log(`Checkout completed: ${session.id}`, "express");
  // The user will register with this session ID, linking their account to their payment
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    // Find user with this customer ID
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
    
    if (!user) {
      log(`No user found with Stripe customer ID: ${customerId}`, "express");
      return;
    }

    // Update user's subscription status based on subscription details
    let subscriptionTier = "free";
    
    if (subscription.status === "active" || subscription.status === "trialing") {
      subscriptionTier = "premium";
    }
    
    // Update user record
    await db.update(users)
      .set({
        stripeSubscriptionId: subscription.id,
        subscriptionTier,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
      
    log(`Updated subscription for user ${user.id} to ${subscriptionTier}`, "express");
  } catch (error) {
    log(`Error updating subscription: ${error}`, "express");
  }
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    // Find user with this customer ID
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
    
    if (!user) {
      log(`No user found with Stripe customer ID: ${customerId}`, "express");
      return;
    }
    
    // Update user's subscription status to free
    await db.update(users)
      .set({
        subscriptionTier: "free",
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
      
    log(`Subscription canceled for user ${user.id}`, "express");
  } catch (error) {
    log(`Error handling subscription deletion: ${error}`, "express");
  }
}

/**
 * Update a user record with Stripe customer and subscription data
 */
export async function updateUserStripeInfo(
  userId: number,
  stripeData: { 
    customerId: string;
    subscriptionId?: string;
    subscriptionTier?: string;
  }
) {
  try {
    await db.update(users)
      .set({
        stripeCustomerId: stripeData.customerId,
        stripeSubscriptionId: stripeData.subscriptionId || null,
        subscriptionTier: stripeData.subscriptionTier || "free",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
      
    return await db.select().from(users).where(eq(users.id, userId)).limit(1);
  } catch (error) {
    log(`Error updating user Stripe info: ${error}`, "express");
    throw error;
  }
}

/**
 * Retrieve subscription details for a user
 */
export async function getSubscriptionDetails(userId: number) {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user || !user.stripeSubscriptionId) {
      return { 
        status: "free",
        subscription: null
      };
    }
    
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    
    return {
      status: user.subscriptionTier,
      subscription
    };
  } catch (error) {
    log(`Error retrieving subscription details: ${error}`, "express");
    throw error;
  }
}