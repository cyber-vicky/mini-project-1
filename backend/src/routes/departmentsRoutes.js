const express = require('express');
const router = express.Router();
const { getDepartments, getDepartmentMembers } = require('../controllers/departmentsController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, roleMiddleware(['ADMIN', 'OFFICER']), getDepartments);
router.get('/:id/members', authMiddleware, roleMiddleware(['ADMIN', 'OFFICER']), getDepartmentMembers);

module.exports = router;
