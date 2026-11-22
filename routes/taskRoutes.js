const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

// Protect all task endpoints
router.use(authMiddleware);

// GET /api/tasks - Retrieve tasks with optional filters
router.get('/', (req, res) => {
  try {
    const { status, priority, category, search, sortBy, sortOrder } = req.query;
    const userId = req.user.id;

    let sql = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [userId];

    if (status && status !== 'ALL') {
      if (status === 'OPEN' || status === 'PENDING') {
        sql += " AND status != 'DONE'";
      } else if (status === 'DONE' || status === 'COMPLETED') {
        sql += " AND status = 'DONE'";
      } else {
        sql += ' AND status = ?';
        params.push(status);
      }
    }

    if (priority && priority !== 'ALL') {
      sql += ' AND priority = ?';
      params.push(priority);
    }

    if (category && category !== 'ALL') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search && search.trim()) {
      sql += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    const orderDir = (sortOrder && sortOrder.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

    if (sortBy === 'dueDate' || sortBy === 'dueDateAsc') {
      sql += ` ORDER BY CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ${orderDir}, created_at DESC`;
    } else if (sortBy === 'priority') {
      sql += ` ORDER BY CASE priority
        WHEN 'URGENT' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
        ELSE 5 END ${orderDir}, created_at DESC`;
    } else {
      sql += ` ORDER BY created_at ${orderDir}`;
    }

    const tasks = db.prepare(sql).all(...params);
    res.json({ tasks });
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ error: 'Failed to retrieve tasks.' });
  }
});

// GET /api/tasks/stats - Dynamic summary statistics calculated from real data
router.get('/stats', (req, res) => {
  try {
    const userId = req.user.id;
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?').get(userId);
    const todoRow = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'TODO'").get(userId);
    const inProgressRow = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'IN_PROGRESS'").get(userId);
    const inReviewRow = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'IN_REVIEW'").get(userId);
    const doneRow = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'DONE'").get(userId);
    const urgentRow = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND priority IN ('URGENT', 'HIGH') AND status != 'DONE'").get(userId);

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueRow = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND due_date < ? AND status != 'DONE'").get(userId, todayStr);

    const total = totalRow.count;
    const completed = doneRow.count;
    const pending = total - completed;
    const overdue = overdueRow.count;

    res.json({
      total,
      completed,
      pending,
      overdue,
      todo: todoRow.count,
      inProgress: inProgressRow.count,
      inReview: inReviewRow.count,
      done: completed,
      urgent: urgentRow.count
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve task stats.' });
  }
});

// GET /api/tasks/:id - Retrieve single task
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    res.json({ task });
  } catch (error) {
    console.error('Get task by id error:', error);
    res.status(500).json({ error: 'Failed to retrieve task.' });
  }
});

// POST /api/tasks - Create new task
router.post('/', (req, res) => {
  try {
    const { title, description, priority, status, category, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const validStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

    const chosenPriority = validPriorities.includes(priority) ? priority : 'MEDIUM';
    const chosenStatus = validStatuses.includes(status) ? status : 'TODO';
    const chosenCategory = category && category.trim() ? category.trim() : 'General';
    const chosenDueDate = dueDate && dueDate.trim() ? dueDate.trim() : null;

    const taskId = 'tsk_' + crypto.randomBytes(6).toString('hex');

    db.prepare(`
      INSERT INTO tasks (id, user_id, title, description, priority, status, category, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      taskId,
      req.user.id,
      title.trim(),
      description ? description.trim() : '',
      chosenPriority,
      chosenStatus,
      chosenCategory,
      chosenDueDate
    );

    const createdTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    res.status(201).json({ message: 'Task created successfully', task: createdTask });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// PUT /api/tasks/:id - Full update of task details
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, category, dueDate } = req.body;

    const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const updatedTitle = title !== undefined ? title.trim() : existing.title;
    if (!updatedTitle) {
      return res.status(400).json({ error: 'Task title cannot be empty.' });
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const validStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

    const updatedPriority = validPriorities.includes(priority) ? priority : existing.priority;
    const updatedStatus = validStatuses.includes(status) ? status : existing.status;
    const updatedCategory = category !== undefined ? category.trim() : existing.category;
    const updatedDueDate = dueDate !== undefined ? dueDate : existing.due_date;
    const updatedDescription = description !== undefined ? description.trim() : existing.description;

    db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, priority = ?, status = ?, category = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      updatedTitle,
      updatedDescription,
      updatedPriority,
      updatedStatus,
      updatedCategory,
      updatedDueDate,
      id,
      req.user.id
    );

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json({ message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// PATCH /api/tasks/:id - Partial update (supports title, description, priority, status, dueDate)
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const { title, description, priority, status, category, dueDate } = req.body;

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const validStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

    const updatedTitle = title !== undefined ? title.trim() : existing.title;
    const updatedDescription = description !== undefined ? description.trim() : existing.description;
    const updatedPriority = priority && validPriorities.includes(priority) ? priority : existing.priority;
    const updatedStatus = status && validStatuses.includes(status) ? status : existing.status;
    const updatedCategory = category !== undefined ? category.trim() : existing.category;
    const updatedDueDate = dueDate !== undefined ? dueDate : existing.due_date;

    db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, priority = ?, status = ?, category = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      updatedTitle,
      updatedDescription,
      updatedPriority,
      updatedStatus,
      updatedCategory,
      updatedDueDate,
      id,
      req.user.id
    );

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json({ message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    console.error('Patch task error:', error);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// PATCH /api/tasks/:id/status - Dedicated status toggle endpoint
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid task status.' });
    }

    const existing = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    db.prepare(`
      UPDATE tasks
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(status, id, req.user.id);

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json({ message: 'Status updated', task: updatedTask });
  } catch (error) {
    console.error('Patch status error:', error);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

module.exports = router;
