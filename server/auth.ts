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

export function setupAuth(app: Express) {
  // Initialize Passport authentication
  app.use(passport.initialize());
  app.use(passport.session());

  // User serialization for session storage
  passport.serializeUser((user: Express.User, done) => {
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
        return done(null, false);
      }

      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Local authentication strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (emailOrUsername, password, done) => {
        try {
          const [user] = await db
            .select()
            .from(users)
            .where(
              or(
                eq(users.email, emailOrUsername),
                eq(users.username, emailOrUsername)
              )
            )
            .limit(1);

          if (!user) {
            return done(null, false, { message: "Invalid credentials." });
          }

          const isMatch = await crypto.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Invalid credentials." });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Google OAuth Strategy
  const GOOGLE_CLIENT_ID = app.get("env") === "production"
    ? process.env.GOOGLE_CLIENT_ID_PROD
    : process.env.GOOGLE_CLIENT_ID_TEST;

  const GOOGLE_CLIENT_SECRET = app.get("env") === "production"
    ? process.env.GOOGLE_CLIENT_SECRET_PROD
    : process.env.GOOGLE_CLIENT_SECRET_TEST;

  // Get the most appropriate callback URL based on environment
  const CALLBACK_URL = app.get("env") === "production"
    ? `https://stacktracker.io/auth/google/callback`
    : process.env.REPL_SLUG && process.env.REPL_OWNER
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/auth/google/callback`
      : `http://0.0.0.0:5000/auth/google/callback`;

  console.log('Initializing Google OAuth with:', {
    callbackUrl: CALLBACK_URL,
    environment: app.get("env"),
    hasClientId: !!GOOGLE_CLIENT_ID,
    hasClientSecret: !!GOOGLE_CLIENT_SECRET,
    clientIdTest: !!process.env.GOOGLE_CLIENT_ID_TEST,
    clientIdProd: !!process.env.GOOGLE_CLIENT_ID_PROD,
    clientSecretTest: !!process.env.GOOGLE_CLIENT_SECRET_TEST,
    clientSecretProd: !!process.env.GOOGLE_CLIENT_SECRET_PROD,
    replSlug: process.env.REPL_SLUG,
    replOwner: process.env.REPL_OWNER,
    appUrl: process.env.APP_URL,
    timestamp: new Date().toISOString()
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID!,
        clientSecret: GOOGLE_CLIENT_SECRET!,
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

  // Google OAuth routes
  app.get('/auth/google',
    (req, res, next) => {
      // Check if Google credentials are properly configured
      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        console.error('Google OAuth credentials missing:', {
          hasClientId: !!GOOGLE_CLIENT_ID,
          hasClientSecret: !!GOOGLE_CLIENT_SECRET,
          timestamp: new Date().toISOString()
        });
        return res.status(500).send('OAuth configuration error. Please check server logs.');
      }

      console.log('Starting Google OAuth flow:', {
        callbackUrl: CALLBACK_URL,
        environment: app.get("env"),
        clientIdExists: !!GOOGLE_CLIENT_ID,
        clientSecretExists: !!GOOGLE_CLIENT_SECRET,
        timestamp: new Date().toISOString(),
        repl: {
          slug: process.env.REPL_SLUG,
          owner: process.env.REPL_OWNER,
          id: process.env.REPL_ID
        }
      });
      next();
    },
    (req, res, next) => {
      try {
        passport.authenticate('google', { 
          scope: ['profile', 'email'],
          prompt: 'select_account',
          accessType: 'offline',
          // Add state parameter for CSRF protection
          state: Math.random().toString(36).substring(2, 15)
        })(req, res, next);
      } catch (error) {
        console.error('Google OAuth authentication error:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        return res.redirect('/login?error=google_auth_error');
      }
    }
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

          // Ensure client-side routing handles the redirect properly
          res.redirect('/dashboard');
          
          console.log('Google OAuth authentication successful:', {
            userId: user.id,
            email: user.email,
            redirectUrl: '/dashboard',
            timestamp: new Date().toISOString()
          });
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