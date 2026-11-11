const express = require('express');
const router = express.Router();
const {
  createIssue,
  getCitizenIssues,
  getIssueById,
  getAllIssues,
  getMapIssues,
  updateIssueStatus,
  assignIssue,
  verifyIssue,
  updateIssue,
  addRemark,
  deleteIssue
} = require('../controllers/issueController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Citizen Routes
router.post('/', authMiddleware, roleMiddleware(['citizen']), upload.array('media', 3), createIssue);
router.get('/my-issues', authMiddleware, roleMiddleware(['citizen']), getCitizenIssues);
router.post('/:id/verify', authMiddleware, roleMiddleware(['citizen']), verifyIssue);

// Municipal Routes
router.get('/map', authMiddleware, roleMiddleware(['ADMIN', 'OFFICER', 'WORKER']), getMapIssues);
router.get('/all', authMiddleware, roleMiddleware(['ADMIN', 'OFFICER', 'WORKER']), getAllIssues);
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN']), updateIssue);
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN', 'OFFICER']), deleteIssue);
router.post('/:id/status', authMiddleware, roleMiddleware(['ADMIN', 'OFFICER', 'WORKER']), upload.array('proof', 3), updateIssueStatus);
router.post('/:id/assign', authMiddleware, roleMiddleware(['ADMIN', 'OFFICER']), assignIssue);
router.post('/:id/remarks', authMiddleware, roleMiddleware(['ADMIN', 'OFFICER', 'WORKER']), addRemark);

// Common
router.get('/:id', authMiddleware, getIssueById);

module.exports = router;
