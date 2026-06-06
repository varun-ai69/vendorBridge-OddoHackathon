const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateBody } = require('../middlewares/validate');
const {
  registerOrgSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema
} = require('../validators/auth.validator');

router.post('/register-org', validateBody(registerOrgSchema), authController.registerOrg);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/refresh-token', validateBody(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout); // Logout can be called by all roles
router.post('/forgot-password', validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);

// Authenticated Routes
router.put('/change-password', authMiddleware, validateBody(changePasswordSchema), authController.changePassword);
router.get('/me', authMiddleware, authController.getMe);
router.put('/me', authMiddleware, validateBody(updateProfileSchema), authController.updateMe);

module.exports = router;
