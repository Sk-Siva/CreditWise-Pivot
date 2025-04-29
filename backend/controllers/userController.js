const db = require('../db');

exports.registerUser = (req, res) => {
  const { name, email } = req.body;

  const checkUserSql = `SELECT * FROM users WHERE email = ? AND name = ?`;
  db.query(checkUserSql, [email, name], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error during user check' });

    if (result.length > 0) {
      return res.status(400).json({ message: 'Already a user' });
    }

    const insertUserSql = 'INSERT INTO users (name, email) VALUES (?, ?)';
    db.query(insertUserSql, [name, email], (err2, result2) => {
      if (err2) return res.status(500).json({ error: 'Registration failed' });

      const userId = result2.insertId;

      const initCreditSql = 'INSERT INTO user_credits (user_id, current_credits, total_credits) VALUES (?, 100, 100)';
      db.query(initCreditSql, [userId], (err3) => {
        if (err3) return res.status(500).json({ error: 'Credit setup failed' });
        res.json({ message: 'User registered with 100 credits' });
      });
    });
  });
};

exports.loginUser = (req, res) => {
  const { email } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ error: 'Invalid emails' });
    }
    res.json({ message: 'Login successful', user: results[0] });
  });
};