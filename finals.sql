SELECT 
    t.id AS transaction_id,
    t.user_id,
    u.name AS user_name,
    u.email AS user_email,
    t.category,
    t.note,
    t.amount,
    t.date
FROM transactions t
JOIN users u
  ON t.user_id = u.id
ORDER BY t.date DESC;
