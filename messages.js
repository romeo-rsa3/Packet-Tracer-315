const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Send message (private or group)
router.post('/send', async (req, res) => {
  const { sender, recipient, group, content, type = 'private' } = req.body;

  if (!content || !sender || (!recipient && !group)) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const msg = new Message({
    sender,
    recipient: type === 'private' ? recipient : undefined,
    group: type === 'group' ? group : undefined,
    content,
    type
  });

  try {
    await msg.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// Get private message history between two users
router.get('/history/private', async (req, res) => {
  const { user1, user2 } = req.query;

  if (!user1 || !user2) {
    return res.status(400).json({ success: false, message: 'Missing user1 or user2' });
  }

  try {
    const messages = await Message.find({
      type: 'private',
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
});

// Get group message history
router.get('/history/group/:groupName', async (req, res) => {
  const { groupName } = req.params;

  try {
    const messages = await Message.find({
      type: 'group',
      group: groupName
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch group messages' });
  }
});

module.exports = router;
