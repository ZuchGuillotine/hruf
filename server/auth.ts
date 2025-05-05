import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { type Express } from "express";
import { users } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { insertUserSchema } from "@db/schema";
import { or } from "drizzle-orm";

// Constants
const DAY_IN_MS = 24 * 60 * 60 * 1000;

// Simplified callback URL determination
const getCallbackURL = () => {
  const baseUrl = process.env.BASE_URL || 
                 (process.env.REPL_SLUG && process.env.REPL_OWNER 
                  ? `https://${process.env.REPL_SLUG.toLowerCase()}.${process.env.REPL_OWNER}.repl.co` 
                  : 'http://0.0.0.0:5000');

  return `${baseUrl}/auth/google/callback`;
};

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
  randomBytes: randomBytes,
};

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      name?: string | null;
      phoneNumber?: string | null;
      subscriptionTier?: string;
      isAdmin?: boolean | null;
      trialEndsAt?: Date | null;
    }
  }
}


// Get the environment-specific callback URL
//const getCallbackURL = (app: Express) => {
//  const isProd = app.get("env") === "production";
//  const customDomain = process.env.CUSTOM_DOMAIN;
//  let callbackURL;

  // Determine callback URL based on environment
//  if (isProd && customDomain) {
//    callbackURL = `https://${customDomain}/auth/google/callback`;
//  } else if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    // For Replit development environment - match exact casing from Google Console
//    const replSlug = process.env.REPL_SLUG.toLowerCase();
//    const replOwner = process.env.REPL_OWNER; // Keep original casing
//    callbackURL = `https://${replSlug}.${replOwner}.repl.co/auth/google/callback`;
//  } else {
    // Local development fallback
//    callbackURL = `http://0.0.0.0:5000/auth/google/callback`;
//  }

  // Log the callback URL determination process
//  console.log('Callback URL Determination:', {
//    isProd,
//    customDomain,
//    replSlug: process.env.REPL_SLUG,
//    replOwner: process.env.REPL_OWNER,
//    resultingURL: callbackURL,
//    authorizedURLs: [
//      `https://${process.env.REPL_SLUG?.toLowerCase()}.${process.env.REPL_OWNER}.repl.co/test/callback`,
//      `https://${process.env.REPL_SLUG?.toLowerCase()}.${process.env.REPL_OWNER}.repl.co/auth/google/callback`
//    ],
//    timestamp: new Date().toISOString()
//  });

//  return callbackURL;
//};

export function setupAuth(app: Express) {
  // Initialize Passport authentication
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport serialization
  passport.serializeUser((user: Express.User, done) => {
    console.log('Serializing user:', { userId: user.id, timestamp: new Date().toISOString() });
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        console.log('User not found during deserialization:', { id, timestamp: new Date().toISOString() });
        return done(null, false);
      }

      console.log('User deserialized:', { userId: user.id, timestamp: new Date().toISOString() });
      done(null, user);
    } catch (err) {
      console.error('Deserialization error:', {
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        timestamp: new Date().toISOString()
      });
      done(err);
    }
  });

  // Google OAuth Strategy Configuration
  const isProd = app.get("env") === "production";
  const GOOGLE_CLIENT_ID = isProd ? process.env.GOOGLE_CLIENT_ID_PROD : process.env.GOOGLE_CLIENT_ID_TEST;
  const GOOGLE_CLIENT_SECRET = isProd ? process.env.GOOGLE_CLIENT_SECRET_PROD : process.env.GOOGLE_CLIENT_SECRET_TEST;
  //const CALLBACK_URL = getCallbackURL(app);
  const CALLBACK_URL = getCallbackURL();

  // Enhanced logging for OAuth configuration
  console.log('Google OAuth Configuration:', {
    environment: app.get("env"),
    callbackUrl: CALLBACK_URL,
    isProd,
    hasClientId: !!GOOGLE_CLIENT_ID,
    hasClientSecret: !!GOOGLE_CLIENT_SECRET,
    envVars: {
      hasReplSlug: !!process.env.REPL_SLUG,
      hasReplOwner: !!process.env.REPL_OWNER,
      hasCustomDomain: !!process.env.CUSTOM_DOMAIN,
      hasBaseUrl: !!process.env.BASE_URL
    },
    timestamp: new Date().toISOString()
  });

  // Validate OAuth configuration
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    const error = new Error('Google OAuth credentials not properly configured');
    console.error('Missing Google OAuth credentials:', {
      environment: isProd ? 'production' : 'development',
      missingClientId: !GOOGLE_CLIENT_ID,
      missingClientSecret: !GOOGLE_CLIENT_SECRET,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }

  passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: getCallbackURL(),
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth callback received:', {
          profileId: profile.id,
          email: profile.emails?.[0]?.value,
          timestamp: new Date().toISOString()
        });

        if (!profile.emails || !profile.emails[0]?.value) {
          console.error('OAuth Error: No email found in Google profile', {
            profileId: profile.id,
            timestamp: new Date().toISOString()
          });
          return done(new Error('No email found in Google profile'), null);
        }

        const email = profile.emails[0].value;

        // Find existing user
        let [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        // If user doesn't exist, create new user
        if (!user) {
          console.log('Creating new user from Google OAuth:', {
            email,
            displayName: profile.displayName,
            timestamp: new Date().toISOString()
          });

          const [newUser] = await db
            .insert(users)
            .values({
              email: email,
              username: profile.displayName?.replace(/\s+/g, '_').toLowerCase() || email.split('@')[0],
              name: profile.displayName || null,
              emailVerified: true, // Google has already verified the email
              password: crypto.randomBytes(32).toString('hex'), // Generate random password
              subscriptionTier: 'free',
              profilePhotoUrl: profile.photos?.[0]?.value || null,
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .returning();

          user = newUser;

          console.log('New user created successfully:', {
            userId: user.id,
            email: user.email,
            timestamp: new Date().toISOString()
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('Google auth error:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        return done(error as Error);
      }
    }
  )
);

  // Add enhanced logging for initial authentication request
  app.get('/auth/google',
    (req, res, next) => {
      console.log('OAuth Initiation Request:', {
        path: req.path,
        headers: {
          host: req.headers.host,
          referer: req.headers.referer,
          origin: req.headers.origin
        },
        environment: {
          isProd: app.get("env") === "production",
          clientIdExists: !!GOOGLE_CLIENT_ID,
          clientSecretExists: !!GOOGLE_CLIENT_SECRET,
          replSlug: process.env.REPL_SLUG,
          replOwner: process.env.REPL_OWNER
        },
        callbackUrl: CALLBACK_URL,
        timestamp: new Date().toISOString()
      });

      const configErrors = [];
      if (!GOOGLE_CLIENT_ID) configErrors.push('Client ID');
      if (!GOOGLE_CLIENT_SECRET) configErrors.push('Client Secret');

      if (configErrors.length > 0) {
        const error = `OAuth configuration error: Missing ${configErrors.join(', ')}`;
        console.error('Google OAuth configuration error:', {
          missing: configErrors,
          environment: isProd ? 'production' : 'development',
          timestamp: new Date().toISOString()
        });
        return res.status(500).send(error);
      }

      next();
    },
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      prompt: 'select_account'
    })
  );

  // Enhanced callback handling
  app.get('/auth/google/callback',
    (req, res, next) => {
      console.log('Received Google OAuth callback:', {
        query: req.query,
        error: req.query.error,
        errorDescription: req.query.error_description,
        code: req.query.code ? 'exists' : 'missing',
        timestamp: new Date().toISOString(),
        requestHost: req.headers.host,
        requestOrigin: req.headers.origin,
        cookies: Object.keys(req.cookies || {}),
        session: req.session ? 'exists' : 'missing',
        sessionId: req.sessionID
      });

      if (req.query.error) {
        console.error('Google OAuth error in callback:', {
          error: req.query.error,
          description: req.query.error_description,
          timestamp: new Date().toISOString()
        });
        return res.redirect('/login?error=' + encodeURIComponent(String(req.query.error)));
      }

      next();
    },
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      res.redirect('/');
    }
  );
  // Local auth routes 
  app.post("/api/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      const { email, username, password, stripeSessionId, purchaseIdentifier } = result.data;
      
      console.log('Registration request:', {
        username,
        email,
        hasStripeSession: !!stripeSessionId,
        hasPurchaseId: !!purchaseIdentifier,
        timestamp: new Date().toISOString()
      });

      // Check if user already exists with either email or username
      const [existingUser] = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.email, email),
            eq(users.username, username)
          )
        )
        .limit(1);

      if (existingUser) {
        if (existingUser.email === email) {
          return res.status(400).send("Email already registered");
        }
        return res.status(400).send("Username already taken");
      }

      // Hash password
      const hashedPassword = await crypto.hash(password);

      // Set up default user values
      let userValues: any = {
        ...result.data,
        password: hashedPassword,
      };
      
      // Check if this user is registering after a payment (has stripeSessionId)
      if (stripeSessionId) {
        try {
          // Import Stripe to get the session
          const Stripe = require('stripe');
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
          
          // Retrieve the checkout session
          const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
          
          if (session.payment_status === 'paid') {
            console.log('Found paid session for new user:', {
              sessionId: stripeSessionId,
              email,
              subscriptionId: session.subscription,
              timestamp: new Date().toISOString()
            });
            
            // Extract subscription information
            userValues.subscriptionTier = 'pro'; // Depends on your pricing, adjust as needed
            
            // If subscription was created, store subscription and customer IDs
            if (session.subscription) {
              // Get subscription details
              const subscription = await stripe.subscriptions.retrieve(session.subscription);
              userValues.stripeSubscriptionId = session.subscription;
              userValues.stripeCustomerId = session.customer;
              
              console.log('Added subscription info to new user:', {
                customerId: session.customer,
                subscriptionId: session.subscription,
                timestamp: new Date().toISOString()
              });
            }
          } else {
            console.log('Stripe session not paid:', {
              sessionId: stripeSessionId,
              status: session.payment_status,
              timestamp: new Date().toISOString()
            });
            
            // Set up trial for users who didn't complete payment
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 28); // 28-day trial
            userValues.trialEndsAt = trialEndDate;
            userValues.subscriptionTier = 'trial';
          }
        } catch (error) {
          console.error('Error processing Stripe session during registration:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            sessionId: stripeSessionId,
            timestamp: new Date().toISOString()
          });
          
          // Default to trial if there's an error processing the session
          const trialEndDate = new Date();
          trialEndDate.setDate(trialEndDate.getDate() + 28); // 28-day trial
          userValues.trialEndsAt = trialEndDate;
          userValues.subscriptionTier = 'trial';
        }
      } else {
        // For regular signups without payment, set up trial period
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 28); // 28-day trial
        userValues.trialEndsAt = trialEndDate;
        userValues.subscriptionTier = 'trial';
      }

      // Create user with appropriate status based on registration path
      const [newUser] = await db
        .insert(users)
        .values(userValues)
        .returning();

      // Send welcome email
      try {
        console.log('Attempting to send welcome email to:', email);
        const { sendWelcomeEmail } = require('./services/emailService');
        await sendWelcomeEmail(email, username);
        console.log('Welcome email sent successfully to:', email);
      } catch (error) {
        console.error('Failed to send welcome email:', error);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          response: error.response?.body
        });
        // Don't block registration if email fails
      }

      req.login(newUser, (err) => {
        if (err) return next(err);
        return res.json({
          message: "Registration successful",
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            name: newUser.name,
            phoneNumber: newUser.phoneNumber,
            subscriptionTier: newUser.subscriptionTier,
          },
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: Express.User, info: IVerifyOptions) => {
      if (err) {
        console.error('Login error:', {
          error: err.message,
          stack: err.stack,
          timestamp: new Date().toISOString()
        });
        return next(err);
      }

      if (!user) {
        return res.status(401).json({ error: info.message });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('Session login error:', {
            error: loginErr.message,
            stack: loginErr.stack,
            timestamp: new Date().toISOString()
          });
          return next(loginErr);
        }

        console.log('User logged in successfully:', {
          userId: user.id,
          email: user.email,
          timestamp: new Date().toISOString()
        });

        return res.json({
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            phoneNumber: user.phoneNumber,
            subscriptionTier: user.subscriptionTier,
          },
          redirectUrl: "/" // Add explicit redirect URL
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    console.log('Logging out user:', {
      userId: req.user?.id,
      email: req.user?.email,
      timestamp: new Date().toISOString()
    });

    req.logout((err) => {
      if (err) {
        console.error('Logout error:', {
          error: err.message,
          stack: err.stack,
          timestamp: new Date().toISOString()
        });
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // User info endpoint
  app.get("/api/user", (req, res) => {
    console.log('User info request:', {
      isAuthenticated: req.isAuthenticated(),
      hasUser: !!req.user,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Debug endpoint to check session
  app.get("/api/debug/session", (req, res) => {
    res.json({
      isAuthenticated: req.isAuthenticated(),
      hasSession: !!req.session,
      sessionID: req.sessionID,
      user: req.user ? {
        id: req.user.id,
        email: req.user.email,
      } : null,
    });
  });
}

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return done(null, false, { message: 'Incorrect email or password' });
    }
    const isValid = await crypto.compare(password, user.password);
    if (!isValid) {
      return done(null, false, { message: 'Incorrect email or password' });
    }
    return done(null, user);
  } catch (error) {
    console.error('Local authentication error:', error);
    done(error);
  }
}));