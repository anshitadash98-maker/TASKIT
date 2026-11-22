const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');
const aiService = require('../services/aiService');

// All AI endpoints require authentication
router.use(authMiddleware);

// GET /api/ai/status - Return AI provider status
router.get('/status', (req, res) => {
  const isGemini = aiService.isGeminiConfigured();
  res.json({
    geminiConfigured: isGemini,
    provider: isGemini ? 'Google Gemini 2.0 Flash' : 'TASKIT Heuristic Engine (Local / Deterministic)'
  });
});

// POST /api/ai/prioritize - Analyze and prioritize user's tasks
router.post('/prioritize', async (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM tasks WHERE user_id = ?').all(req.user.id);
    const result = await aiService.prioritizeTasks(tasks, req.body || {});
    res.json(result);
  } catch (error) {
    console.error('AI Prioritize Error:', error);
    res.status(500).json({ error: 'Failed to prioritize tasks' });
  }
});

// POST /api/ai/plan-day - Generate a realistic daily schedule
router.post('/plan-day', async (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM tasks WHERE user_id = ?').all(req.user.id);
    const result = await aiService.planMyDay(tasks, req.body || {});
    res.json(result);
  } catch (error) {
    console.error('AI Plan Day Error:', error);
    res.status(500).json({ error: 'Failed to generate day plan' });
  }
});

// POST /api/ai/parse-tasks - Extract tasks from natural language input
router.post('/parse-tasks', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text input is required' });
    }
    const result = await aiService.parseNaturalLanguageTasks(text.trim());
    res.json(result);
  } catch (error) {
    console.error('AI Parse Tasks Error:', error);
    res.status(500).json({ error: 'Failed to extract tasks' });
  }
});

// POST /api/ai/chat - Conversational assistant
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const tasks = db.prepare('SELECT * FROM tasks WHERE user_id = ?').all(req.user.id);
    const result = await aiService.chatAssistant(message.trim(), tasks);
    res.json(result);
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Failed to process AI chat message' });
  }
});

// POST /api/ai/apply-priority - User explicitly accepts an AI recommendation
router.post('/apply-priority', (req, res) => {
  try {
    const { taskId, newPriority } = req.body;
    if (!taskId || !newPriority) {
      return res.status(400).json({ error: 'taskId and newPriority are required' });
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (!validPriorities.includes(newPriority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    const existing = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(taskId, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    db.prepare(`
      UPDATE tasks 
      SET priority = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `).run(newPriority, taskId, req.user.id);

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    res.json({ message: 'Priority updated successfully', task: updated });
  } catch (error) {
    console.error('Apply Priority Error:', error);
    res.status(500).json({ error: 'Failed to apply recommended priority' });
  }
});

// POST /api/ai/confirm-tasks - User explicitly confirms parsed tasks to save
router.post('/confirm-tasks', (req, res) => {
  try {
    const { tasks: tasksToSave } = req.body;
    if (!Array.isArray(tasksToSave) || tasksToSave.length === 0) {
      return res.status(400).json({ error: 'Array of tasks is required' });
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const insertStmt = db.prepare(`
      INSERT INTO tasks (id, user_id, title, description, priority, status, category, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const createdTasks = [];

    for (const t of tasksToSave) {
      if (!t.title || !t.title.trim()) continue;

      const taskId = 'tsk_' + crypto.randomBytes(6).toString('hex');
      const priority = validPriorities.includes(t.priority) ? t.priority : 'MEDIUM';
      const category = t.category || 'General';
      const dueDate = t.dueDate || null;
      const desc = t.description || '';

      insertStmt.run(taskId, req.user.id, t.title.trim(), desc.trim(), priority, 'TODO', category, dueDate);
      createdTasks.push(db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId));
    }

    res.status(201).json({
      message: `Successfully created ${createdTasks.length} task${createdTasks.length > 1 ? 's' : ''}`,
      tasks: createdTasks
    });
  } catch (error) {
    console.error('Confirm Tasks Error:', error);
    res.status(500).json({ error: 'Failed to save confirmed tasks' });
  }
});

module.exports = router;
