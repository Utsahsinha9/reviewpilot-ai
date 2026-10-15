const axios = require('axios');
require('dotenv').config();

const GITHUB_API_BASE = 'https://api.github.com';

const githubClient = axios.create({
  baseURL: GITHUB_API_BASE,
  headers: {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json'
  }
});

// Fetch all open pull requests for the configured repo
async function getPullRequests() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  const response = await githubClient.get(`/repos/${owner}/${repo}/pulls`);
  return response.data;
}

// Fetch the list of changed files (with diffs/patches) for a specific PR
async function getPullRequestFiles(prNumber) {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  const response = await githubClient.get(
    `/repos/${owner}/${repo}/pulls/${prNumber}/files`
  );
  return response.data;
}

// Post a comment on a pull request (GitHub treats PR comments as issue comments)
async function postComment(prNumber, commentBody) {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  const response = await githubClient.post(
    `/repos/${owner}/${repo}/issues/${prNumber}/comments`,
    { body: commentBody }
  );
  return response.data;
}

module.exports = {
  getPullRequests,
  getPullRequestFiles,
  postComment
};