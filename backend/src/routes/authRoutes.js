const express = require('express');
const router = express.Router();
const {
  registerCitizen,
  loginCitizen,
  loginMunicipal,
  getMe,
  updateProfile,
  forgotPassword,
  verifyResetToken,
  resetPassword
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { forgotPasswordLimiter, resetPasswordLimiter } = require('../middleware/rateLimiter');

router.post('/citizen/register', registerCitizen);
router.post('/citizen/login', loginCitizen);
router.post('/municipal/login', loginMunicipal);
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Password recovery endpoints
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.get('/verify-reset-token/:token', verifyResetToken);
router.post('/reset-password', resetPasswordLimiter, resetPassword);

module.exports = router;
