const pool = require('../config/db');

async function createSession(repoOwner, repoName) {
  const [result] = await pool.query(
    'INSERT INTO sessions (repo_owner, repo_name) VALUES (?, ?)',
    [repoOwner, repoName]
  );
  return result.insertId;
}

async function createReview(sessionId, prNumber, fileName, codePatch, aiFeedback, postedToGithub) {
  const [result] = await pool.query(
    'INSERT INTO reviews (session_id, pr_number, file_name, code_patch, ai_feedback, posted_to_github) VALUES (?, ?, ?, ?, ?, ?)',
    [sessionId, prNumber, fileName, codePatch, aiFeedback, postedToGithub]
  );
  return result.insertId;
}

async function markReviewsAsPosted(reviewIds) {
  if (!reviewIds || reviewIds.length === 0) return;
  await pool.query(
    `UPDATE reviews SET posted_to_github = TRUE WHERE id IN (${reviewIds.map(() => '?').join(',')})`,
    reviewIds
  );
}

module.exports = {
  createSession,
  createReview,
  markReviewsAsPosted
};