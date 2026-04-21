const express = require('express');
const { authenticate } = require('../middleware/auth');
const driveService = require('../services/googleDrive');
const aiService = require('../services/ai');

const router = express.Router();
router.use(authenticate);

router.get('/files', async (req, res, next) => {
  try {
    const files = await driveService.listAllFiles(req.user.userId);
    res.json({ files });
  } catch (err) { next(err); }
});

router.get('/search', async (req, res, next) => {
  try {
    const { q, maxResults = 10 } = req.query;
    if (!q) return res.status(400).json({ error: 'q query param required' });
    const files = await driveService.searchFiles(req.user.userId, q, Number(maxResults));
    res.json({ files });
  } catch (err) { next(err); }
});

router.post('/execute', async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });
    const intent = await aiService.parseDriveQuery(query);
    const files = await driveService.searchFiles(req.user.userId, intent.searchQuery);
    let shareResult = null;
    if ((intent.action === 'share' || intent.action === 'send') && files.length > 0) {
      shareResult = await driveService.getShareableLink(req.user.userId, files[0].id);
    }
    res.json({ intent, files, shareResult });
  } catch (err) { next(err); }
});

module.exports = router;