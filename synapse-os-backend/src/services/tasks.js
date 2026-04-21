const database = require("./database");

const STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  IN_REVIEW: "in_review",
  COMPLETED: "completed",
};

const PRIORITY = {
  URGENT: "urgent",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

function createTask({ title, description, assignedTo, priority, dueDate, sourceType = "manual", createdBy }) {
  return database.createTask({
    title,
    description,
    assignedTo,
    priority: priority || PRIORITY.MEDIUM,
    status: STATUS.TODO,
    dueDate,
    sourceType,
    createdBy,
  });
}

function getAllTasks({ assignedTo, status } = {}) {
  return database.listTasks({ assignedTo, status });
}

function getTaskById(id) {
  return database.getTaskById(id);
}

function updateTask(id, updates) {
  return database.updateTask(id, updates);
}

function deleteTask(id) {
  return database.deleteTask(id);
}

function getStats() {
  return database.getTaskStats();
}

function bulkCreateTasks(taskArray, createdBy = null) {
  return taskArray.map((task) =>
    createTask({
      ...task,
      createdBy,
    })
  );
}

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getStats,
  bulkCreateTasks,
  STATUS,
  PRIORITY,
};
