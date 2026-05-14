const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, getConversations } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/conversations/list', getConversations);
router.get('/:userId', getMessages);
router.post('/', sendMessage);

module.exports = router;
