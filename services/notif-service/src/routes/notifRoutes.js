const express = require('express');
const Notification = require('../models/Notification');

const router = express.Router();

// GET /api/notifications
// List notifications for current user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { unread } = req.query;

        const filter = { userId };
        if (unread === 'true') {
            filter.read = false;
        }

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(100); // simple cap

        res.json(notifications);
    } catch (err) {
        console.error('Error fetching notifRoutes.', err);
        res.status(500).json({ error: 'Failed to fetch notifRoutes.' });
    }
});

// PUT /api/notifications/:id/read
// Mark notification as read
router.put('/:id/read', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId },
            { $set: { read: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found.' });
        }

        res.json(notification);
    } catch (err) {
        console.error('Error updating notification.', err);
        res.status(500).json({ error: 'Failed to update notification.' });
    }
});

module.exports = router;
