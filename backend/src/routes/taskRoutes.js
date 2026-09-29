const express = require('express');
const router = express.Router();
const { createTask, getMyTasks, getAllTasks, updateTaskStatus } = require('../controllers/taskController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/', verifyToken, requireRole('ADMIN', 'WORKER'), createTask);
router.get('/me', verifyToken, requireRole('WORKER'), getMyTasks);
router.get('/', verifyToken, requireRole('ADMIN', 'WORKER'), getAllTasks);
router.patch('/:id/status', verifyToken, requireRole('ADMIN', 'WORKER'), updateTaskStatus);

module.exports = router;
