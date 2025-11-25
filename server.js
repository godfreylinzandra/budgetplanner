import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import pkg from "pg";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import budgetRoutes from "./routes/budget_plan.js"; // router contains both budget & transactions

dotenv.config();
const { Pool } = pkg;

const app = express();

app.use(express.json());
// Trust proxy so secure cookies work when behind Render's proxy
app.set("trust proxy", 1);

// CORS - allow the frontend origin (set FRONTEND_ORIGIN in Render environment variables)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5500";
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));

app.use(express.static("docs"));
app.use(session({
  secret: process.env.SESSION_SECRET || "please_change_this_in_prod",
  resave: false,
  saveUninitialized: false,
  cookie: {
    // in production (HTTPS) we want secure cookies and cross-site cookies to be allowed
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  }
}));

// PostgreSQL Pool
// Build DB config and support optional SSL (Render Postgres requires TLS)
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
};

if (process.env.DB_SSL && String(process.env.DB_SSL).toLowerCase() === "true") {
  // allow self-signed certs when connecting to hosted providers that require TLS
  dbConfig.ssl = { rejectUnauthorized: false };
}

const db = new Pool(dbConfig);

// Test database connection
db.connect((err, client, release) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
  } else {
    console.log("✅ Database connected successfully");
    release();
  }
});

// make db accessible to routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Routes
app.use("/auth", authRoutes);

// 🔹 Mount budget_plan router at /api so both budget and transactions paths match frontend
app.use("/api", budgetRoutes);

// Current user session
app.get("/api/session", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
  try {
    const result = await db.query("SELECT id, email FROM users WHERE id=$1", [req.session.userId]);
    res.json({ userId: result.rows[0].id, email: result.rows[0].email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout
app.post("/api/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.json({ ok: true });
  });
});
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend HTML pages
app.get("/:page", (req, res) => {
  const page = req.params.page;
  const allowedPages = ["auth.html", "budget_plan.html"];
  
  if (allowedPages.includes(page)) {
    res.sendFile(path.join(__dirname, "docs", page));
  } else {
    // fallback to auth.html for unknown routes
    res.sendFile(path.join(__dirname, "docs", "auth.html"));
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
