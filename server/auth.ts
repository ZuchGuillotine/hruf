import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users } from "@db/schema";
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
    const suppliedPasswordBuf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;
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
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          console.log("Attempting authentication for:", email);

          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user) {
            console.log("No user found for:", email);
            return done(null, false, { message: "Invalid credentials" });
          }

          const isMatch = await crypto.compare(password, user.password);
          if (!isMatch) {
            console.log("Password mismatch for user:", email);
            return done(null, false, { message: "Invalid credentials" });
          }

          console.log("Authentication successful for:", email, "isAdmin:", user.isAdmin);

          return done(null, {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            phoneNumber: user.phoneNumber,
            isPro: user.isPro,
            isAdmin: user.isAdmin,
          });
        } catch (err) {
          console.error("Authentication error:", err);
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    console.log("Serializing user:", user.username, "isAdmin:", user.isAdmin);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log("Deserializing user ID:", id);

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        console.log("No user found for ID:", id);
        return done(null, false);
      }

      console.log("User deserialized successfully:", user.username, "isAdmin:", user.isAdmin);

      done(null, {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        isPro: user.isPro,
        isAdmin: user.isAdmin,
      });
    } catch (err) {
      console.error("Deserialization error:", err);
      done(err);
    }
  });

  // Authentication endpoints
  app.post("/api/login", (req, res, next) => {
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: IVerifyOptions) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }

      if (!user) {
        console.log("Authentication failed:", info.message);
        return res.status(401).json({ error: info.message || "Authentication failed" });
      }

      req.login(user, (err) => {
        if (err) {
          console.error("Session creation error:", err);
          return next(err);
        }

        console.log("User logged in successfully:", user.username, "isAdmin:", user.isAdmin);
        return res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    const username = req.user?.username;
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      console.log("User logged out successfully:", username);
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Error handling middleware
  app.use((err: Error, req: any, res: any, next: any) => {
    console.error("Auth error:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: "Authentication error occurred" });
  });
}

// Create default admin if none exists
async function createDefaultAdmin() {
  try {
    const [adminExists] = await db
      .select()
      .from(users)
      .where(eq(users.isAdmin, true))
      .limit(1);

    if (!adminExists) {
      const password = await crypto.hash("admin123"); // Default password
      await db.insert(users).values({
        username: "admin",
        email: "admin@example.com",
        password,
        isAdmin: true,
        emailVerified: true,
      });
      console.log("Created default admin user");
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
  }
}

// Create admin user if none exists
createDefaultAdmin().catch(console.error);