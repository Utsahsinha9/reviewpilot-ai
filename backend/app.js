require('dotenv').config();

const express = require('express');
const cors = require('cors');
const reviewRoutes = require('./src/routes/reviewRoutes');
const apiLimiter = require('./src/middleware/rateLimiter');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'ReviewPilot AI backend is running' });
});

app.use('/api', apiLimiter, reviewRoutes);

module.exports = app;