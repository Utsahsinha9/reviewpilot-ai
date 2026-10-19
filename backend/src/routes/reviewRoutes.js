const express = require('express');
const router = express.Router();
const { reviewPullRequest } = require('../controllers/reviewController');

router.post('/review/:prNumber', reviewPullRequest);

module.exports = router;