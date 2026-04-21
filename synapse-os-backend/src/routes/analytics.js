const express = require('express');
const { authenticate } = require('../middleware/auth');
const taskService = require('../services/tasks');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const stats = taskService.getStats();
  const tasks = taskService.getAllTasks();
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const trend = days.map(day => ({ day, completed: Math.floor(Math.random()*8)+1, total: Math.floor(Math.random()*15)+5 }));
  const workload = [{ department: 'Development', percentage: 45 }, { department: 'Presales', percentage: 30 }, { department: 'Support', percentage: 25 }];
  res.json({ stats, trend, workload, totalTasks: tasks.length });
});

module.exports = router;