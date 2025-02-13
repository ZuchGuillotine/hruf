import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema } from "@db/schema";
import { neonDb as db } from "@db";
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
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "hipaa-compliant-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: app.get("env") === "production",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy
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

  const CALLBACK_URL = app.get("env") === "production"
    ? `${process.env.APP_URL}/auth/google/callback`
    : `${process.env.APP_URL_TEST}/auth/google/callback`;

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
            email: profile.emails?.[0]?.value,
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

  // Passport session setup
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Google OAuth routes
  app.get('/auth/google',
    (req, res, next) => {
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
          prompt: 'select_account'
        })(req, res, next);
      } catch (error) {
        console.error('Google OAuth authentication error:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        next(error);
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
        code: req.query.code,
        scope: req.query.scope,
        authuser: req.query.authuser,
        prompt: req.query.prompt,
        timestamp: new Date().toISOString()
      });

      if (req.query.error) {
        console.error('Google OAuth error in callback:', {
          error: req.query.error,
          description: req.query.error_description,
          timestamp: new Date().toISOString()
        });
      }
      next();
    },
    (req, res, next) => {
      passport.authenticate('google', (err, user, info) => {
        if (err) {
          console.error('Google OAuth error:', {
            error: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
          });
          return res.redirect('/login?error=auth_failed');
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
            return res.redirect('/login?error=login_failed');
          }
          
          console.log('Google OAuth authentication successful:', {
            userId: user.id,
            email: user.email,
            timestamp: new Date().toISOString()
          });
          
          res.redirect('/dashboard');
        });
      })(req, res, next);
    }
  );

  // Local auth routes (unchanged from original)
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
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info.message });

      req.login(user, (err) => {
        if (err) return next(err);
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
    req.logout((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  });
}