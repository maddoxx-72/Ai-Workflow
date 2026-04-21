const express = require("express");
const { authenticate } = require("../middleware/auth");
const aiService = require("../services/ai");
const database = require("../services/database");
const meetService = require("../services/googleMeet");
const taskService = require("../services/tasks");

const meetRouter = express.Router();
meetRouter.use(authenticate);

meetRouter.get("/", async (req, res, next) => {
  try {
    const { daysBack = 30, daysAhead = 30 } = req.query;
    const meetings = await meetService.listMeetings(
      req.user.userId,
      Number(daysBack),
      Number(daysAhead)
    );
    const summaries = database.listMeetingSummaries(req.user.userId);
    const summariesByMeetingId = new Map(
      summaries.map((summary) => [summary.meetingId, summary])
    );

    res.json({
      meetings: meetings.map((meeting) => {
        const storedSummary = summariesByMeetingId.get(meeting.id);

        return {
          ...meeting,
          aiSummary: storedSummary?.summary || null,
          transcriptSource: storedSummary?.transcriptSource || null,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
});

meetRouter.get("/:id/transcript", async (req, res, next) => {
  try {
    const { spaceId } = req.query;
    if (!spaceId) {
      return res.status(400).json({ error: "spaceId query param required" });
    }

    const transcript = await meetService.getMeetingTranscript(req.user.userId, spaceId);
    res.json({ transcript });
  } catch (err) {
    next(err);
  }
});

meetRouter.post("/:id/summarize", async (req, res, next) => {
  try {
    const { transcript, meetingTitle, meetingContext } = req.body;

    if (!transcript && !meetingContext) {
      return res.status(400).json({ error: "transcript or meetingContext is required" });
    }

    const summarySource = transcript ? "transcript" : "metadata";
    const summaryInput = transcript || buildMeetingContextNarrative(meetingContext);
    const summary = await aiService.generateMeetingSummary(summaryInput, meetingTitle);
    const storedSummary = database.saveMeetingSummary({
      userId: req.user.userId,
      meetingId: req.params.id,
      title: meetingTitle || meetingContext?.title,
      summary,
      transcriptSource: summarySource,
    });
    const tasks = taskService.bulkCreateTasks(
      (summary.actionItems || []).map((item) => ({
        title: item.task,
        assignedTo: item.assignedTo,
        dueDate: item.dueDate,
        priority: "medium",
        sourceType: "meeting",
      })),
      req.user.userId
    );

    res.json({
      summary: storedSummary.summary,
      tasksCreated: tasks,
      transcriptSource: storedSummary.transcriptSource,
    });
  } catch (err) {
    next(err);
  }
});

function buildMeetingContextNarrative(meetingContext = {}) {
  const participants = (meetingContext.attendees || meetingContext.participants || []).join(", ");

  return [
    "No transcript was available for this meeting.",
    "Generate the best possible structured summary from the meeting metadata below.",
    "Be explicit about uncertainty and keep action items conservative.",
    `Title: ${meetingContext.title || "Untitled Meeting"}`,
    `Description: ${meetingContext.description || "No description"}`,
    `Attendees: ${participants || "No attendee list available"}`,
    `Start Time: ${meetingContext.startTime || meetingContext.date || "Unknown"}`,
    `End Time: ${meetingContext.endTime || meetingContext.time || "Unknown"}`,
    `Meet Link: ${meetingContext.meetLink || "Unavailable"}`,
  ].join("\n");
}

module.exports = meetRouter;
