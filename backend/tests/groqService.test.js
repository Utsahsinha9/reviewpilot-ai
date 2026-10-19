jest.mock('axios', () => ({
  create: jest.fn()
}));

const axios = require('axios');

const mockPost = jest.fn();

axios.create.mockReturnValue({
  post: mockPost
});

const { analyzeCode } = require('../src/services/groqService');

describe('groqService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('analyzeCode sends a prompt and returns the review text', async () => {
    mockPost.mockResolvedValue({
      data: {
        choices: [{ message: { content: 'Looks good, no issues.' } }]
      }
    });

    const result = await analyzeCode('test.js', '+ added line');

    expect(mockPost).toHaveBeenCalledWith(
      '/chat/completions',
      expect.objectContaining({
        model: process.env.GROQ_MODEL,
        messages: expect.any(Array)
      })
    );
    expect(result).toBe('Looks good, no issues.');
  });

  test('analyzeCode throws when the Groq API fails', async () => {
    mockPost.mockRejectedValue(new Error('Groq down'));

    await expect(analyzeCode('test.js', 'diff')).rejects.toThrow('Groq down');
  });
});