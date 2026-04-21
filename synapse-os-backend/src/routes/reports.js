const express = require('express');
const { authenticate } = require('../middleware/auth');
const aiService = require('../services/ai');
const database = require('../services/database');
const gmailService = require('../services/gmail');

const router = express.Router();
router.use(authenticate);

router.post('/format', async (req, res, next) => {
  try {
    const { rawContent } = req.body;
    if (!rawContent) return res.status(400).json({ error: 'rawContent is required' });
    const formatted = await aiService.formatWeeklyReport(rawContent, req.user.name);
    res.json({ report: formatted });
  } catch (err) { next(err); }
});

router.post('/send', async (req, res, next) => {
  try {
    const { rawContent, formattedReport, managerEmail, managerName } = req.body;

    if (!rawContent || !managerEmail) {
      return res.status(400).json({ error: 'rawContent and managerEmail are required' });
    }

    const formatted = isStructuredReport(formattedReport)
      ? formattedReport
      : await aiService.formatWeeklyReport(rawContent, req.user.name);

    const reportBody = `Weekly Report - ${req.user.name}
Week of: ${formatted.weekOf}

${formatted.summary}`;

    await gmailService.sendEmail(req.user.userId, {
      to: managerEmail,
      subject: `Weekly Report: ${req.user.name}`,
      body: reportBody,
    });

    const profileUpdates = {};

    if (managerName !== undefined) {
      profileUpdates.managerName = managerName;
    }

    if (managerEmail !== undefined) {
      profileUpdates.managerEmail = managerEmail;
    }

    const updatedUser =
      Object.keys(profileUpdates).length > 0
        ? database.updateUserProfile(req.user.userId, profileUpdates)
        : database.getUserById(req.user.userId);

    database.saveReport({
      userId: req.user.userId,
      recipientName: managerName || updatedUser?.managerName || '',
      recipientEmail: managerEmail,
      rawContent,
      formattedReport: formatted,
      sentAt: new Date().toISOString(),
    });

    res.json({
      sent: true,
      report: formatted,
      recipient: {
        name: managerName || updatedUser?.managerName || '',
        email: managerEmail,
      },
    });
  } catch (err) { next(err); }
});

function isStructuredReport(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof value.summary === 'string',
  );
}

module.exports = router;
