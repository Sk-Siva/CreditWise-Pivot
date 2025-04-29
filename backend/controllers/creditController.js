const db = require('../db');

exports.getCreditBalance = (req, res) => {
  const userId = req.params.userId;
  const sql = 'SELECT * FROM user_credits WHERE user_id = ?';
  db.query(sql, [userId], (err, results) => {

    if (err || results.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(results[0]);
  });
};

exports.useCreditsForAction = (req, res) => {
  const { userId, actionName, fieldsCount } = req.body;
 
  const actionSql = 'SELECT credit_cost FROM credit_actions WHERE action_name = ?';

  db.query(actionSql, [actionName], (err, actionResult) => {
    if (err || actionResult.length === 0) return res.status(400).json({ error: 'Invalid action' });
    let creditCost;
    if (actionName == "select_field") {
      creditCost = actionResult[0].credit_cost * fieldsCount
    } else {
      creditCost = actionResult[0].credit_cost;
    }

    const userSql = 'SELECT * FROM user_credits WHERE user_id = ?';
    db.query(userSql, [userId], (err2, userResult) => {
      if (err2 || userResult.length === 0) return res.status(404).json({ error: 'User not found' });

      const { current_credits, total_credits } = userResult[0];

      if (current_credits < creditCost) {
        return res.status(400).json({ error: 'Insufficient credits' });
      }

      const newCredits = current_credits - creditCost;

      const updateSql = 'UPDATE user_credits SET current_credits = ? WHERE user_id = ?';
      db.query(updateSql, [newCredits, userId], (err3) => {
        if (err3) return res.status(500).json({ error: 'Failed to update credits' });

        const insertHistory = `
          INSERT INTO credit_history (user_id, action, credits_changed, description)
          VALUES (?, ?, ?, ?)`;
        db.query(insertHistory, [userId, actionName, -creditCost, `Used for ${actionName}`]);
        res.json({ message: `${creditCost} Credits have been reduced for the action.`, remaining: newCredits });
      });
    });
  });
};

exports.buyCredits = (req, res) => {
  const { userId, planId } = req.body;
  const planSql = 'SELECT * FROM credit_plans WHERE id = ?';
  db.query(planSql, [planId], (err, planResult) => {
    if (err || planResult.length === 0) return res.status(400).json({ error: 'Invalid plan' });

    const { credits, price } = planResult[0];

    const updateCreditsSql = `
      UPDATE user_credits
      SET current_credits = current_credits + ?, total_credits = total_credits + ?
      WHERE user_id = ?`;
    db.query(updateCreditsSql, [credits, credits, userId], (err2) => {
      if (err2) return res.status(500).json({ error: 'Failed to update credits' });

      const insertPurchase = `
        INSERT INTO purchases (user_id, plan_id, credits_added, amount_paid)
        VALUES (?, ?, ?, ?)`;
      db.query(insertPurchase, [userId, planId, credits, price]);

      const insertHistory = `
        INSERT INTO credit_history (user_id, action, credits_changed, description)
        VALUES (?, 'buy_credits', ?, ?)`;
      db.query(insertHistory, [userId, credits, `Bought ${credits} credits`]);

      res.json({ message: `Added ${credits} credits successfully` });
    });
  });
};

exports.getCreditPlans = (req, res) => {
  const sql = 'SELECT * FROM credit_plans';
  db.query(sql, (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(results);
  });
}