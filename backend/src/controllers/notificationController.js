const jsonService = require('../services/jsonService');

const getUserNotifications = (req, res) => {
  try {
    const allNotifs = jsonService.readData('notifications');
    const userNotifs = allNotifs.filter(n => n.userId === req.user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(userNotifs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const markAsRead = (req, res) => {
  try {
    const notification = jsonService.findById('notifications', req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    if (notification.userId !== req.user.id) return res.status(403).json({ message: 'Access denied' });
    
    jsonService.update('notifications', req.params.id, { read: true });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const markAllAsRead = (req, res) => {
  try {
    const allNotifs = jsonService.readData('notifications');
    allNotifs.forEach(n => {
      if (n.userId === req.user.id && !n.read) {
        n.read = true;
      }
    });
    jsonService.writeData('notifications', allNotifs);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getUserNotifications, markAsRead, markAllAsRead };
