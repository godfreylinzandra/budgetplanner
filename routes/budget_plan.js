import express from "express";

const router = express.Router();

// -------------------------------
// GET BUDGET
// -------------------------------
router.get("/budget", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });

  try {
    const result = await req.db.query(
      "SELECT * FROM budget WHERE user_id=$1",
      [req.session.userId]
    );
    res.json(result.rows[0] || { amount: 0, type: "Monthly" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------
// SAVE / UPDATE BUDGET
// -------------------------------
router.post("/budget", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });

  let { amount, type } = req.body;
  amount = parseFloat(amount);

  if (isNaN(amount) || amount <= 0)
    return res.status(400).json({ error: "Invalid amount" });

  try {
    await req.db.query(
      `INSERT INTO budget(user_id, amount, type)
       VALUES($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET amount=$2, type=$3`,
      [req.session.userId, amount, type]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------
// GET TRANSACTIONS
// -------------------------------
router.get("/transactions", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });

  try {
    const result = await req.db.query(
      "SELECT * FROM transactions WHERE user_id=$1 ORDER BY date DESC",
      [req.session.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------
// ADD TRANSACTION
// -------------------------------
router.post("/transactions", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });

  const { amount, type, category, note, date } = req.body;

  if (amount == null || !category) 
    return res.status(400).json({ error: "Missing required fields" });

  try {
    await req.db.query(
      `INSERT INTO transactions(user_id, amount, category, note, date)
       VALUES($1, $2, $3, $4, $5)`,
      [req.session.userId, amount, category, note || null, date || new Date()]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


export default router;
