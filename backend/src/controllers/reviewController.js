const { getPullRequestFiles, postComment } = require('../services/githubService');
const { analyzeCode } = require('../services/groqService');
const { createSession, createReview, markReviewsAsPosted } = require('../models/reviewModel');

async function reviewPullRequest(req, res) {
  const prNumber = req.params.prNumber;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  // Validate PR number is a positive integer
  if (!/^\d+$/.test(prNumber)) {
    return res.status(400).json({ error: 'Invalid PR number. Must be a positive integer.' });
  }

  let sessionId;
  try {
    sessionId = await createSession(owner, repo);
  } catch (err) {
    console.error('Database error creating session:', err.message);
    return res.status(500).json({ error: 'Failed to create review session. Please try again later.' });
  }

  let files;
  try {
    files = await getPullRequestFiles(prNumber);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: `Pull request #${prNumber} not found in ${owner}/${repo}.` });
    }
    console.error('GitHub API error:', err.message);
    return res.status(502).json({ error: 'Failed to fetch pull request files from GitHub.' });
  }

  if (!files || files.length === 0) {
    return res.status(404).json({ error: 'No files found for this PR.' });
  }

  const reviewResults = [];
  const reviewIds = [];
  let combinedComment = `🤖 **ReviewPilot AI — Automated Code Review**\n\n`;

  for (const file of files) {
    if (!file.patch) {
      continue; // skip binary/renamed files with no diff
    }

    let feedback;
    try {
      feedback = await analyzeCode(file.filename, file.patch);
    } catch (err) {
      console.error(`Groq API error for file ${file.filename}:`, err.message);
      feedback = `⚠️ Could not analyze this file due to an AI service error. Please review manually.`;
    }

    try {
      const reviewId = await createReview(sessionId, prNumber, file.filename, file.patch, feedback, false);
      reviewIds.push(reviewId);
    } catch (err) {
      console.error(`Database error saving review for ${file.filename}:`, err.message);
      // continue anyway - don't fail the whole request over one DB write
    }

    reviewResults.push({ filename: file.filename, feedback });
    combinedComment += `### \`${file.filename}\`\n${feedback}\n\n---\n\n`;
  }

  if (reviewResults.length === 0) {
    return res.status(422).json({ error: 'No reviewable file changes found in this PR (all files may be binary or empty diffs).' });
  }

  let comment;
  try {
    comment = await postComment(prNumber, combinedComment);
  } catch (err) {
    console.error('GitHub API error posting comment:', err.message);
    // Reviews were still generated and saved - return them even if posting the comment failed
    return res.status(207).json({
      sessionId,
      prNumber,
      filesReviewed: reviewResults.length,
      reviews: reviewResults,
      warning: 'Reviews were generated but could not be posted to GitHub.'
    });
  }

  try {
    await markReviewsAsPosted(reviewIds);
  } catch (err) {
    console.error('Database error updating posted_to_github flag:', err.message);
  }

  res.json({
    sessionId,
    prNumber,
    filesReviewed: reviewResults.length,
    reviews: reviewResults,
    githubCommentUrl: comment.html_url
  });
}

module.exports = {
  reviewPullRequest
};