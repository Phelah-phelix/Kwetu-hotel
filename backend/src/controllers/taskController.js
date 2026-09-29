const prisma = require('../utils/prisma');

// POST /api/tasks  (ADMIN/WORKER — assign a task to a staff member)
async function createTask(req, res, next) {
  try {
    const { assignedToId, roomId, type, priority, notes } = req.body;

    if (!assignedToId || !type) {
      return res.status(400).json({ error: 'assignedToId and type are required' });
    }

    const validTypes = ['CLEANING', 'MAINTENANCE', 'ROOM_SERVICE'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
    }

    const task = await prisma.task.create({
      data: {
        assignedToId,
        roomId: roomId || null,
        type,
        priority: priority || 'MEDIUM',
        notes,
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        room: true,
      },
    });

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/me  (WORKER — their own assigned tasks)
async function getMyTasks(req, res, next) {
  try {
    const tasks = await prisma.task.findMany({
      where: { assignedToId: req.user.id },
      include: { room: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks  (ADMIN/WORKER — every task, for the dashboards)
async function getAllTasks(req, res, next) {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        assignedTo: { select: { id: true, name: true } },
        room: true,
      },
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/tasks/:id/status  (WORKER updates their own task; ADMIN can update any)
async function updateTaskStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // A worker can only update tasks assigned to them; an admin can update any.
    if (req.user.role === 'WORKER' && task.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own tasks' });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { createTask, getMyTasks, getAllTasks, updateTaskStatus };
