const express = require('express');
const router = express.Router();
const orgController = require('../controllers/org.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validateBody } = require('../middlewares/validate');
const { updateOrgSchema } = require('../validators/org.validator');

// Organization details are for Admins only
router.get('/me', authMiddleware, roleMiddleware('admin'), orgController.getOrgDetails);
router.put('/me', authMiddleware, roleMiddleware('admin'), validateBody(updateOrgSchema), orgController.updateOrgDetails);

module.exports = router;
