const express = require('express');
const { authenticate } = require('../middleware/auth');
const whatsappService = require('../services/whatsapp');

const router = express.Router();
router.use(authenticate);

router.post('/send', async (req, res, next) => {
  try {
    const { to, body } = req.body;
    if (!to || !body) return res.status(400).json({ error: 'to and body are required' });

    const result = await whatsappService.sendWhatsApp(to, body);
    res.json({ sent: true, result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
