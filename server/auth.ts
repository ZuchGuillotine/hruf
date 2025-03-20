import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { type Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users } from "@db/schema";
import { insertUserSchema } from "@db/schema";
import { db } from "@db";
import { eq, or } from "drizzle-orm";

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
};

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      name?: string | null;
      phoneNumber?: string | null;
      isPro?: boolean | null;
      isAdmin?: boolean | null;
    }
  }
}

// Get the most appropriate callback URL based on environment
const getCallbackURL = (app: Express) => {
  const isProd = app.get("env") === "production";
  const customDomain = process.env.CUSTOM_DOMAIN;
  let callbackURL;

  // Determine callback URL based on environment
  if (isProd && customDomain) {
    callbackURL = `https://${customDomain}/auth/google/callback`;
  } else if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    // For Replit development environment - match exact casing from Google Console
    const replSlug = process.env.REPL_SLUG.toLowerCase();
    const replOwner = process.env.REPL_OWNER; // Keep original casing
    callbackURL = `https://${replSlug}.${replOwner}.repl.co/auth/google/callback`;
  } else {
    // Local development fallback
    callbackURL = `http://0.0.0.0:5000/auth/google/callback`;
  }

  // Log the callback URL determination process
  console.log('Callback URL Determination:', {
    isProd,
    customDomain,
    replSlug: process.env.REPL_SLUG,
    replOwner: process.env.REPL_OWNER,
    resultingURL: callbackURL,
    authorizedURLs: [
      `https://${process.env.REPL_SLUG?.toLowerCase()}.${process.env.REPL_OWNER}.repl.co/test/callback`,
      `https://${process.env.REPL_SLUG?.toLowerCase()}.${process.env.REPL_OWNER}.repl.co/auth/google/callback`
    ],
    timestamp: new Date().toISOString()
  });

  return callbackURL;
};

export function setupAuth(app: Express) {
  // Initialize Passport authentication
  app.use(passport.initialize());
  app.use(passport.session());

  // User serialization for session storage
  passport.serializeUser((user: Express.User, done) => {
    console.log('Serializing user:', { userId: user.id, timestamp: new Date().toISOString() });
    done(null, user.id);
  });

  // User deserialization from session
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
  const CALLBACK_URL = getCallbackURL(app);

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
      hasCustomDomain: !!process.env.CUSTOM_DOMAIN
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
        callbackURL: CALLBACK_URL,
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('Google OAuth callback received:', {
            profileId: profile.id,
            displayName: profile.displayName,
            email: profile.emails?.[0]?.value,
            emailVerified: profile.emails?.[0]?.verified,
            provider: profile.provider,
            timestamp: new Date().toISOString()
          });

          // Check if user exists
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, profile.emails![0].value))
            .limit(1);

          if (existingUser) {
            console.log('Existing user found:', {
              userId: existingUser.id,
              email: existingUser.email,
              timestamp: new Date().toISOString()
            });
            return done(null, existingUser);
          }

          console.log('Creating new user from Google profile');
          // Create new user
          const [newUser] = await db
            .insert(users)
            .values({
              email: profile.emails![0].value,
              username: profile.emails![0].value.split('@')[0],
              password: await crypto.hash(randomBytes(32).toString('hex')),
              name: profile.displayName,
              emailVerified: true,
            })
            .returning();

          console.log('New user created:', {
            userId: newUser.id,
            email: newUser.email,
            timestamp: new Date().toISOString()
          });

          return done(null, newUser);
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

  // Google OAuth routes with enhanced error handling and logging
  app.get('/auth/google',
    (req, res, next) => {
      const configErrors = [];
      if (!GOOGLE_CLIENT_ID) configErrors.push('Client ID');
      if (!GOOGLE_CLIENT_SECRET) configErrors.push('Client Secret');

      console.log('OAuth Initiation Request:', {
        path: req.path,
        headers: {
          host: req.headers.host,
          referer: req.headers.referer
        },
        timestamp: new Date().toISOString()
      });

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
      prompt: 'select_account',
      accessType: 'offline',
      state: Math.random().toString(36).substring(2, 15)
    })
  );

  app.get('/auth/google/callback',
    (req, res, next) => {
      console.log('Received Google OAuth callback:', {
        query: req.query,
        error: req.query.error,
        errorDescription: req.query.error_description,
        state: req.query.state,
        code: req.query.code ? 'exists' : 'missing',
        scope: req.query.scope,
        authuser: req.query.authuser,
        prompt: req.query.prompt,
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

      if (!req.query.code) {
        console.error('Google OAuth callback missing code parameter');
        return res.redirect('/login?error=missing_auth_code');
      }

      next();
    },
    (req, res, next) => {
      passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }, (err, user, info) => {
        if (err) {
          console.error('Google OAuth error:', {
            error: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
          });
          return res.redirect('/login?error=' + encodeURIComponent('auth_failed: ' + err.message));
        }

        if (!user) {
          console.error('Google OAuth authentication failed:', {
            info,
            timestamp: new Date().toISOString()
          });
          return res.redirect('/login?error=no_user');
        }

        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error('Login error:', {
              error: loginErr.message,
              stack: loginErr.stack,
              timestamp: new Date().toISOString()
            });
            return res.redirect('/login?error=' + encodeURIComponent('login_failed: ' + loginErr.message));
          }

          console.log('Google OAuth authentication successful:', {
            userId: user.id,
            email: user.email,
            timestamp: new Date().toISOString()
          });

          // Send HTML that will redirect using client-side routing
          res.send(`
            <html>
              <head>
                <script>
                  window.location.replace('/dashboard');
                </script>
              </head>
              <body>
                Redirecting to dashboard...
              </body>
            </html>
          `);
        });
      })(req, res, next);
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

      const { email, username, password } = result.data;

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

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          ...result.data,
          password: hashedPassword,
        })
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
            isPro: newUser.isPro,
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
            isPro: user.isPro,
          },
          redirectUrl: "/dashboard" // Add explicit redirect URL
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