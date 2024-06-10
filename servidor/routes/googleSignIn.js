const express = require('express');
const googleSignInController = require('../controllers/googleSignInController');
const router = express.Router();

router.post('/verify-google-token', googleSignInController.signIn);

module.exports = router;