jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    query: jest.fn()
  }))
}));

const pool = require('../src/config/db');
const { createSession, createReview, markReviewsAsPosted } = require('../src/models/reviewModel');

describe('reviewModel', () => {
  beforeEach(() => {
    pool.query.mockClear();
  });

  test('createSession inserts a session and returns insertId', async () => {
    pool.query.mockResolvedValue([{ insertId: 42 }]);

    const id = await createSession('owner', 'repo');

    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO sessions (repo_owner, repo_name) VALUES (?, ?)',
      ['owner', 'repo']
    );
    expect(id).toBe(42);
  });

  test('createReview inserts a review and returns insertId', async () => {
    pool.query.mockResolvedValue([{ insertId: 7 }]);

    const id = await createReview(1, 5, 'file.js', 'patch', 'feedback', false);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO reviews'),
      [1, 5, 'file.js', 'patch', 'feedback', false]
    );
    expect(id).toBe(7);
  });

  test('markReviewsAsPosted updates rows for given ids', async () => {
    pool.query.mockResolvedValue([{}]);

    await markReviewsAsPosted([1, 2, 3]);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE reviews SET posted_to_github = TRUE WHERE id IN'),
      [1, 2, 3]
    );
  });

  test('markReviewsAsPosted does nothing when given an empty array', async () => {
    await markReviewsAsPosted([]);

    expect(pool.query).not.toHaveBeenCalled();
  });
});