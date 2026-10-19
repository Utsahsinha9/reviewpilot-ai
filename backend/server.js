// test comment for PR
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { getPullRequests } = require('./src/services/githubService');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'ReviewPilot AI backend is running' });
});

app.get('/test-github', async (req, res) => {
  try {
    const prs = await getPullRequests();
    res.json(prs);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});