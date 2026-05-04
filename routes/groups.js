const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Guruh yaratish
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const group = new Group({
      name,
      description,
      admin: req.user.id,
      members: [...members, req.user.id]
    });
    await group.save();
    const populated = await group.populate('members', 'username email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ msg: 'Server xatosi' });
  }
});

// Mening guruhlarim
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate('members', 'username email')
      .populate('admin', 'username');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ msg: 'Server xatosi' });
  }
});

// Guruh xabarlarini olish
router.get('/:groupId/messages', auth, async (req, res) => {
  try {
    const messages = await Message.find({ roomId: `group_${req.params.groupId}` })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: 'Server xatosi' });
  }
});

// Guruhga xabar yuborish
router.post('/:groupId/messages', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ msg: 'Guruh topilmadi' });

    const message = new Message({
      sender: req.user.id,
      receiver: req.params.groupId,
      roomId: `group_${req.params.groupId}`,
      text,
      type: 'text'
    });
    await message.save();
    const populated = await message.populate('sender', 'username avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ msg: 'Server xatosi' });
  }
});

// A'zo qo'shish
router.post('/:groupId/members', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ msg: 'Guruh topilmadi' });
    if (group.admin.toString() !== req.user.id) return res.status(403).json({ msg: 'Ruxsat yo\'q' });

    const { userId } = req.body;
    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }
    const populated = await group.populate('members', 'username email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ msg: 'Server xatosi' });
  }
});

module.exports = router;