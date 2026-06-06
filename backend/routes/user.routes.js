const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validateBody } = require('../middlewares/validate');
const { 
  inviteUserSchema, 
  updateUserSchema, 
  statusUserSchema, 
  resetPasswordSchema 
} = require('../validators/user.validator');

// All endpoints in this file require the user to be logged in and have the 'admin' role
router.use(authMiddleware, roleMiddleware('admin'));

router.post('/invite', validateBody(inviteUserSchema), userController.inviteUser);
router.get('/', userController.listUsers);
router.get('/:userId', userController.getUser);
router.put('/:userId', validateBody(updateUserSchema), userController.updateUser);
router.patch('/:userId/status', validateBody(statusUserSchema), userController.updateStatus);
router.post('/:userId/reset-password', validateBody(resetPasswordSchema), userController.resetPassword);
router.delete('/:userId', userController.deleteUser);

module.exports = router;
