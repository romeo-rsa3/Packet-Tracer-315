const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

router.post('/send', async (req, res) => {
  const { sender, recipient, content } = req.body;
  const msg = new Message({ sender, recipient, content });
  await msg.save();
  res.json({ success: true });
});

router.get('/history', async (req, res) => {
  const { user1, user2 } = req.query;
  const messages = await Message.find({
    $or: [
      { sender: user1, recipient: user2 },
      { sender: user2, recipient: user1 }
    ]
  }).sort({ timestamp: 1 });
  res.json(messages);
});

module.exports = router;
