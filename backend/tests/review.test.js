const request = require('supertest');
const app = require('../app');

// Mock the GitHub and Groq services so tests don't make real API calls
jest.mock('../src/services/githubService');
jest.mock('../src/services/groqService');

// Mock the database model so tests don't write to real MySQL
jest.mock('../src/models/reviewModel');

const { getPullRequestFiles, postComment } = require('../src/services/githubService');
const { analyzeCode } = require('../src/services/groqService');
const { createSession, createReview, markReviewsAsPosted } = require('../src/models/reviewModel');

describe('POST /api/review/:prNumber', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('successfully reviews a PR with valid files', async () => {
    // Arrange: set up what our mocked functions should return
    getPullRequestFiles.mockResolvedValue([
      {
        filename: 'backend/server.js',
        patch: '@@ -1,3 +1,4 @@\n+// test comment\n const express = require("express");'
      }
    ]);

    analyzeCode.mockResolvedValue('This code looks good. No issues found.');

    createSession.mockResolvedValue(1); // fake session ID
    createReview.mockResolvedValue(1);  // fake review ID
    markReviewsAsPosted.mockResolvedValue();

    postComment.mockResolvedValue({
      html_url: 'https://github.com/Utsahsinha9/reviewpilot-ai/pull/1#issuecomment-123'
    });

    // Act: call our actual API endpoint
    const response = await request(app)
      .post('/api/review/1')
      .send();

    // Assert: check the response is correct
    expect(response.status).toBe(200);
    expect(response.body.sessionId).toBe(1);
    expect(response.body.prNumber).toBe('1');
    expect(response.body.filesReviewed).toBe(1);
    expect(response.body.reviews[0].filename).toBe('backend/server.js');
    expect(response.body.reviews[0].feedback).toBe('This code looks good. No issues found.');
    expect(response.body.githubCommentUrl).toBe('https://github.com/Utsahsinha9/reviewpilot-ai/pull/1#issuecomment-123');

    // Assert: check our mocked functions were called correctly
    expect(getPullRequestFiles).toHaveBeenCalledWith('1');
    expect(analyzeCode).toHaveBeenCalledWith('backend/server.js', expect.any(String));
    expect(postComment).toHaveBeenCalledWith('1', expect.any(String));
  });

  test('returns 400 for invalid PR number', async () => {
    const response = await request(app)
      .post('/api/review/abc')
      .send();

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid PR number. Must be a positive integer.');

    // Confirm we never even tried to call GitHub/Groq for an invalid input
    expect(getPullRequestFiles).not.toHaveBeenCalled();
    expect(analyzeCode).not.toHaveBeenCalled();
  });

  test('returns 404 when PR does not exist on GitHub', async () => {
    createSession.mockResolvedValue(1);

    const notFoundError = new Error('Not Found');
    notFoundError.response = { status: 404 };
    getPullRequestFiles.mockRejectedValue(notFoundError);

    const response = await request(app)
      .post('/api/review/9999')
      .send();

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Pull request #9999 not found in Utsahsinha9/reviewpilot-ai.');
  });

  test('continues review when Groq fails for a file, using fallback message', async () => {
    getPullRequestFiles.mockResolvedValue([
      { filename: 'backend/server.js', patch: 'some diff content' }
    ]);

    createSession.mockResolvedValue(1);
    createReview.mockResolvedValue(1);
    markReviewsAsPosted.mockResolvedValue();
    postComment.mockResolvedValue({ html_url: 'https://github.com/fake-url' });

    analyzeCode.mockRejectedValue(new Error('Groq API timeout'));

    const response = await request(app)
      .post('/api/review/1')
      .send();

    expect(response.status).toBe(200);
    expect(response.body.reviews[0].feedback).toBe('⚠️ Could not analyze this file due to an AI service error. Please review manually.');
  });

});