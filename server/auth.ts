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
      : `https://${process.env.REPLIT_HOSTNAME || '0.0.0.0:5000'}/auth/google/callback`;

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
      

  // Modified registration endpoint to properly handle login after signup
  app.post("/api/register", async (req, res, next) => {
    try {
      console.log('Starting registration process:', {
        email: req.body.email,
        bodyKeys: Object.keys(req.body),
        timestamp: new Date().toISOString()
      });

      // Check if there's a valid body
      if (!req.body || !req.body.email || !req.body.password) {
        return res.status(400).json({ 
          message: "Invalid input: Missing required fields",
          details: "Email and password are required" 
        });
      }

      const { email, username, password } = req.body;

      // Check if user already exists with either email or username
      const [existingUser] = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.email, email),
            username ? eq(users.username, username) : undefined
          )
        )
        .limit(1);

      if (existingUser) {
        if (existingUser.email === email) {
          return res.status(400).json({ message: "Email already registered" });
        }
        return res.status(400).json({ message: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await crypto.hash(password);

      // Create user with basic validation
      const userData = {
        email,
        username: username || email.split('@')[0],
        password: hashedPassword,
        emailVerified: true, // Auto-verify for now
      };

      // Create user
      const [newUser] = await db
        .insert(users)
        .values(userData)
        .returning();

      console.log('User created successfully:', {
        userId: newUser.id,
        email: newUser.email,
        timestamp: new Date().toISOString()
      });

      // Regenerate session to prevent session fixation attacks
      await new Promise<void>((resolveRegen) => {
        req.session.regenerate(function(err) {
          if (err) {
            console.error('Session regeneration error:', {
              error: err instanceof Error ? err.message : String(err),
              timestamp: new Date().toISOString()
            });
          }
          resolveRegen();
        });
      });

      // Log the user in directly - simplified approach
      await new Promise<void>((resolveLogin) => {
        req.login(newUser, { session: true }, (loginErr) => {
          if (loginErr) {
            console.error('Auto-login error after registration:', {
              error: loginErr instanceof Error ? loginErr.message : String(loginErr),
              stack: loginErr instanceof Error ? loginErr.stack : undefined,
              timestamp: new Date().toISOString()
            });
          }
          
          // Make sure passport data is in the session
          if (!req.session.passport) {
            req.session.passport = { user: newUser.id };
          }
          
          console.log('Login completed, saving session:', { 
            userId: newUser.id,
            hasPassport: !!req.session.passport,
            timestamp: new Date().toISOString()
          });
          
          resolveLogin();
        });
      });
      
      // Force session save and wait for completion
      await new Promise<void>((resolveSave, rejectSave) => {
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', {
              error: saveErr instanceof Error ? saveErr.message : String(saveErr),
              stack: saveErr instanceof Error ? saveErr.stack : undefined,
              timestamp: new Date().toISOString()
            });
            // Continue despite error
          }
          
          console.log('Session saved after registration:', {
            userId: newUser.id,
            isAuthenticated: req.isAuthenticated(),
            hasSession: !!req.session,
            sessionID: req.sessionID,
            passport: req.session.passport,
            timestamp: new Date().toISOString()
          });
          
          resolveSave();
        });
      });

      // Final authentication check
      const isAuthSuccess = req.isAuthenticated();
      console.log('Final auth check:', {
        isAuthenticated: isAuthSuccess,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        status: 'success',
        message: isAuthSuccess ? "Registration and authentication successful" : "Registration successful but authentication may require login",
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email
        },
        authenticated: isAuthSuccess,
        sessionID: req.sessionID
      });
      
    } catch (error) {
      console.error('Error in registration process:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  });

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

          // Redirect to dashboard with success message
          res.redirect('/dashboard?login=success');
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