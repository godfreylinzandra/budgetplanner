// routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";

const router = express.Router();

// ----- REGISTER -----
router.post("/register", async (req, res) => {
  console.log("💡 Register request received");
  console.log("Payload:", req.body);

  const { name, email, password, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const check = await req.db.query("SELECT id FROM users WHERE email=$1", [email]);
    if (check.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await req.db.query(
      `INSERT INTO users(name, email, password, address)
       VALUES($1, $2, $3, $4)
       RETURNING id, name, email, address`,
      [name, email, hashedPassword, address || null]
    );

    req.session.userId = result.rows[0].id;

    res.json({ ok: true, user: result.rows[0] });

  } catch (err) {
    console.error("❌ Registration error:", err.message);
    console.error("Full error details:", err);
    res.status(500).json({ message: "Server error during registration", details: err.message });
  }
});


// ----- LOGIN -----
router.post("/login", async (req, res) => {
  console.log("💡 Login request:", req.body);

  if (!req.db) return res.status(500).json({ message: "Server DB not available" });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  try {
    const result = await req.db.query("SELECT * FROM users WHERE email=$1", [email]);
    const user = result.rows[0];

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    req.session.userId = user.id;
    console.log("✅ Login successful:", user.email);
    res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    console.error("Full error details:", err);
    res.status(500).json({ message: "Server error during login", details: err.message });
  }
});

// ----- LOGOUT -----
router.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("❌ Logout failed:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    console.log("✅ Logout successful");
    res.json({ ok: true });
  });
});

// ----- GET CURRENT USER -----
router.get("/me", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });

  try {
    const result = await req.db.query("SELECT id, name, email FROM users WHERE id=$1", [req.session.userId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Fetch current user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
