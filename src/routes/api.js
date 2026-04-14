import { Router } from 'express';
import { pool } from '../db.js';

export const router = Router();

let memoryTasks = [
    { id: 1, title: 'Да настроим CI/CD с Jenkins', status: 'done' },
    { id: 2, title: 'Да разгърнем инфраструктурата с Terraform', status: 'pending' },
    { id: 3, title: 'Да покрием проекта с Unit тестове', status: 'pending' }
];
let memoryNextId = 4;

const isDbReady = () => !!process.env.DATABASE_URL;

router.get('/tasks', async (req, res) => {
    if(!isDbReady()) return res.status(200).json({ success: true, count: memoryTasks.length, data: memoryTasks });

    try {
        const result = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
        res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/tasks/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    
    if(!isDbReady()) {
        const task = memoryTasks.find(t => t.id === id);
        if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
        return res.status(200).json({ success: true, data: task });
    }

    try {
        const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Task not found' });
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/tasks', async (req, res) => {
    const { title, status } = req.body;
    
    if (!title) return res.status(400).json({ success: false, error: 'Title is required' });
    
    if(!isDbReady()) {
        const newTask = { id: memoryNextId++, title, status: status || 'pending' };
        memoryTasks.push(newTask);
        return res.status(201).json({ success: true, data: newTask });
    }

    try {
        const result = await pool.query(
            'INSERT INTO tasks (title, status) VALUES ($1, $2) RETURNING *',
            [title, status || 'pending']
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/tasks/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { title, status } = req.body;

    if(!isDbReady()) {
        const taskIndex = memoryTasks.findIndex(t => t.id === id);
        if (taskIndex === -1) return res.status(404).json({ success: false, error: 'Task not found' });
        memoryTasks[taskIndex] = { ...memoryTasks[taskIndex], ...title && { title }, ...status && { status } };
        return res.status(200).json({ success: true, data: memoryTasks[taskIndex] });
    }

    try {
        const updates = [];
        const values = [];
        let valIndex = 1;

        if (title) { updates.push(`title = $${valIndex++}`); values.push(title); }
        if (status) { updates.push(`status = $${valIndex++}`); values.push(status); }

        if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields to update' });

        values.push(id);
        const result = await pool.query(
            `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${valIndex} RETURNING *`,
            values
        );

        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Task not found' });
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/tasks/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);

    if(!isDbReady()) {
        const taskIndex = memoryTasks.findIndex(t => t.id === id);
        if (taskIndex === -1) return res.status(404).json({ success: false, error: 'Task not found' });
        const deletedTask = memoryTasks.splice(taskIndex, 1);
        return res.status(200).json({ success: true, data: deletedTask[0] });
    }

    try {
        const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Task not found' });
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
