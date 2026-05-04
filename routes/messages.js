const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Faqat rasm fayllari!'));
  }
});

// Xabarlarni olish
router.get('/:roomId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: 'Server xatosi' });
  }
});

// Matn xabar yuborish
router.post('/', auth, async (req, res) => {
  try {
    const { receiver, roomId, text } = req.body;
    const message = new Message({ sender: req.user.id, receiver, roomId, text, type: 'text' });
    await message.save();
    const populated = await message.populate('sender', 'username avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ msg: 'Server xatosi' });
  }
});

// Rasm yuborish
router.post('/image', auth, upload.single('image'), async (req, res) => {
  try {
    const { receiver, roomId } = req.body;
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    const message = new Message({ sender: req.user.id, receiver, roomId, text: imageUrl, type: 'image' });
    await message.save();
    const populated = await message.populate('sender', 'username avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ msg: 'Server xatosi' });
  }
});

// Xabarni tahrirlash
router.put('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ msg: 'Xabar topilmadi' });
    if (message.sender.toString() !== req.user.id) return res.status(403).json({ msg: 'Ruxsat yoq' });
    if (message.type === 'image') return res.status(400).json({ msg: 'Rasmni tahrirlash mumkin emas' });
    message.text = req.body.text;
    message.edited = true;
    await message.save();
    const populated = await message.populate('sender', 'username avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ msg: 'Server xatosi' });
  }
});

// Xabarni ochirish
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ msg: 'Xabar topilmadi' });
    if (message.sender.toString() !== req.user.id) return res.status(403).json({ msg: 'Ruxsat yoq' });
    await Message.findByIdAndDelete(req.params.messageId);
    res.json({ msg: 'Xabar ochirildi', messageId: req.params.messageId });
  } catch (err) {
    res.status(500).json({ msg: 'Server xatosi' });
  }
});

module.exports = router;