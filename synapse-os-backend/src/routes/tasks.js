const express = require("express");
const { authenticate } = require("../middleware/auth");
const taskService = require("../services/tasks");
const aiService = require("../services/ai");
const whatsappService = require("../services/whatsapp");

const router = express.Router();
router.use(authenticate);

// GET /api/tasks - list all tasks (with optional filters)
router.get("/", (req, res, next) => {
  try {
    const { assignedTo, status } = req.query;
    const tasks = taskService.getAllTasks({ assignedTo, status });
    const stats = taskService.getStats();
    res.json({ tasks, stats });
  } catch (err) { next(err); }
});

// POST /api/tasks - create a task manually
router.post("/", (req, res, next) => {
  try {
    const { title, description, assignedTo, priority, dueDate } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });

    const task = taskService.createTask({
      title, description, assignedTo, priority, dueDate,
      sourceType: "manual", createdBy: req.user.userId,
    });
    res.status(201).json({ task });
  } catch (err) { next(err); }
});

// PATCH /api/tasks/:id - update status, priority, etc.
router.patch("/:id", (req, res, next) => {
  try {
    const task = taskService.updateTask(req.params.id, req.body);

    // Fire WhatsApp automation if task was just completed
    if (req.body.status === "completed" && req.body.managerPhone) {
      whatsappService.notifyTaskCompleted({
        task,
        managerPhone: req.body.managerPhone,
        completedByName: req.user.name,
      }).catch(console.error); // non-blocking
    }

    res.json({ task });
  } catch (err) { next(err); }
});

// DELETE /api/tasks/:id
router.delete("/:id", (req, res, next) => {
  try {
    const result = taskService.deleteTask(req.params.id);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/tasks/extract-from-email - AI extracts tasks from email text
router.post("/extract-from-email", async (req, res, next) => {
  try {
    const { emailContent, participants } = req.body;
    if (!emailContent) return res.status(400).json({ error: "emailContent is required" });

    const extracted = await aiService.extractTasksFromEmail(emailContent, participants);
    const created = taskService.bulkCreateTasks(extracted, req.user.userId);

    // Fire WhatsApp alert for each assigned task
    for (const task of created) {
      if (task.assignedTo && req.body.assigneePhones?.[task.assignedTo]) {
        whatsappService.notifyTaskAssigned({
          task,
          assigneePhone: req.body.assigneePhones[task.assignedTo],
          assigneeName: task.assignedTo,
        }).catch(console.error);
      }
    }

    res.status(201).json({ extracted: created, count: created.length });
  } catch (err) { next(err); }
});

module.exports = router;
