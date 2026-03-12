const express = require('express');
const router = express.Router();
const { createFlag, getFlags } = require('../controllers/flagController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, authorize('STUDENT'), createFlag);
router.get('/', protect, authorize('INSTRUCTOR', 'ADMIN'), getFlags);

module.exports = router;
