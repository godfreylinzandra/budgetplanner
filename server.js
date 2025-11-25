import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import pkg from "pg";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import budgetRoutes from "./routes/budget_plan.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const { Pool } = pkg;

const app = express();

// Needed for secure cookies on Render
app.set("trust proxy", 1);

app.use(express.json());

// --------------------------
// CORS (GitHub Pages origin)
// --------------------------
const FRONTEND = "https://godfreylinzandra.github.io";

app.use(
  cors({
    origin: [FRONTEND, FRONTEND + "/budgetplanner"],
    credentials: true,
  })
);

// --------------------------
// Sessions
// --------------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change_me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only on Render
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// --------------------------
// PostgreSQL Connection
// --------------------------
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
};

if (String(process.env.DB_SSL).toLowerCase() === "true") {
  dbConfig.ssl = { rejectUnauthorized: false };
}

const db = new Pool(dbConfig);

// test DB
db.connect((err, client, release) => {
  if (err) {
    console.error("❌ DB error:", err.message);
  } else {
    console.log("✅ Database connected successfully");
    release();
  }
});

// make DB available for routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// --------------------------
// API Routes
// --------------------------
app.use("/auth", authRoutes);
app.use("/api", budgetRoutes);

// --------------------------
// Serve Frontend (docs/)
// --------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "docs")));

app.get("/:page", (req, res) => {
  const page = req.params.page;
  const allowed = ["auth.html", "budget_plan.html"];

  res.sendFile(
    path.join(__dirname, "docs", allowed.includes(page) ? page : "auth.html")
  );
});

// --------------------------
// Start Server
// --------------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
