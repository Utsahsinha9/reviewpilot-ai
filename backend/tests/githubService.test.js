jest.mock('axios', () => ({
  create: jest.fn()
}));

const axios = require('axios');

const mockGet = jest.fn();
const mockPost = jest.fn();

axios.create.mockReturnValue({
  get: mockGet,
  post: mockPost
});

const { getPullRequests, getPullRequestFiles, postComment } = require('../src/services/githubService');

describe('githubService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getPullRequests calls the correct endpoint and returns data', async () => {
    mockGet.mockResolvedValue({ data: [{ id: 1, title: 'Test PR' }] });

    const result = await getPullRequests();

    expect(mockGet).toHaveBeenCalledWith(
      `/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/pulls`
    );
    expect(result).toEqual([{ id: 1, title: 'Test PR' }]);
  });

  test('getPullRequestFiles calls the correct endpoint with PR number', async () => {
    mockGet.mockResolvedValue({ data: [{ filename: 'test.js' }] });

    const result = await getPullRequestFiles(5);

    expect(mockGet).toHaveBeenCalledWith(
      `/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/pulls/5/files`
    );
    expect(result).toEqual([{ filename: 'test.js' }]);
  });

  test('postComment calls the correct endpoint with the comment body', async () => {
    mockPost.mockResolvedValue({ data: { id: 123, body: 'Nice work' } });

    const result = await postComment(5, 'Nice work');

    expect(mockPost).toHaveBeenCalledWith(
      `/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/issues/5/comments`,
      { body: 'Nice work' }
    );
    expect(result).toEqual({ id: 123, body: 'Nice work' });
  });

  test('getPullRequests propagates errors from the API', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    await expect(getPullRequests()).rejects.toThrow('Network error');
  });
});