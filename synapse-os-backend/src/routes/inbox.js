const express = require("express");
const { authenticate } = require("../middleware/auth");
const gmailService = require("../services/gmail");
const aiService = require("../services/ai");

const router = express.Router();
router.use(authenticate);

// GET /api/inbox - list emails
router.get("/", async (req, res, next) => {
  try {
    const { maxResults = 20, query = "" } = req.query;
    const emails = await gmailService.listEmails(req.user.userId, Number(maxResults), query);
    res.json({ emails, count: emails.length });
  } catch (err) { next(err); }
});

// GET /api/inbox/:id - single email
router.get("/:id", async (req, res, next) => {
  try {
    const email = await gmailService.getEmailById(req.user.userId, req.params.id);
    res.json({ email });
  } catch (err) { next(err); }
});

// POST /api/inbox/send - send an email
router.post("/send", async (req, res, next) => {
  try {
    const { to, subject, body, replyToMessageId } = req.body;
    if (!to || !subject || !body) return res.status(400).json({ error: "to, subject, and body are required" });
    const result = await gmailService.sendEmail(req.user.userId, { to, subject, body, replyToMessageId });
    res.json({ sent: true, result });
  } catch (err) { next(err); }
});

// POST /api/inbox/draft-reply - AI drafts a reply
router.post("/draft-reply", async (req, res, next) => {
  try {
    const { emailThread, replyIntent } = req.body;
    if (!emailThread || !replyIntent) return res.status(400).json({ error: "emailThread and replyIntent are required" });
    const draft = await aiService.draftEmailReply(emailThread, replyIntent);
    res.json({ draft });
  } catch (err) { next(err); }
});

module.exports = router;
