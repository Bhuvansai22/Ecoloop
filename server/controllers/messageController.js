const Message = require('../models/Message');

/**
 * GET /api/messages/:userId
 * Get chat history with a specific user
 */
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    }).sort('createdAt');

    // Mark messages as read
    await Message.updateMany(
      { sender: userId, receiver: currentUserId, read: false },
      { read: true }
    );

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/messages
 * Send a message to a user
 */
const sendMessage = async (req, res) => {
  try {
    const { receiver, text } = req.body;
    const sender = req.user._id;

    const message = await Message.create({
      sender,
      receiver,
      text,
    });

    const populatedMessage = await message.populate('sender receiver', 'name avatar');

    // Emit via socket
    const io = req.app.get('io');
    if (io) {
      io.to(receiver.toString()).emit('receiveMessage', populatedMessage);
      io.to(sender.toString()).emit('receiveMessage', populatedMessage); // To update sender's own UI across tabs
    }

    res.status(201).json({ message: populatedMessage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/messages/conversations/list
 * Get list of users the current user has chatted with
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all messages involving the user
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    }).populate('sender receiver', 'name companyName avatar');

    const conversationsMap = new Map();

    messages.forEach(msg => {
      const otherUser = msg.sender._id.toString() === userId.toString() ? msg.receiver : msg.sender;
      if (!otherUser) return;
      
      const otherUserId = otherUser._id.toString();
      
      if (!conversationsMap.has(otherUserId) || new Date(msg.createdAt) > new Date(conversationsMap.get(otherUserId).lastMessage.createdAt)) {
        conversationsMap.set(otherUserId, {
          user: otherUser,
          lastMessage: msg,
          unreadCount: msg.receiver._id.toString() === userId.toString() && !msg.read ? 1 : 0
        });
      } else if (msg.receiver._id.toString() === userId.toString() && !msg.read) {
        conversationsMap.get(otherUserId).unreadCount += 1;
      }
    });

    const conversations = Array.from(conversationsMap.values()).sort((a, b) => 
      new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
    );

    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMessages, sendMessage, getConversations };
