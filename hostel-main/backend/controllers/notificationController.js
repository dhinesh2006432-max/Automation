const { getMemoryStore, saveMemoryStore } = require('../config/db');

// GET USER NOTIFICATIONS
const getNotifications = (req, res) => {
  const store = getMemoryStore();
  const userId = req.user.id;
  const role = req.user.role;

  const notifications = store.notifications.filter(n => 
    n.user_id === userId || (role && n.role_target === role)
  );
  const unreadCount = notifications.filter(n => !n.is_read).length;

  res.json({
    notifications,
    unreadCount
  });
};

// MARK NOTIFICATION AS READ
const markAsRead = (req, res) => {
  const { id } = req.params;
  const store = getMemoryStore();

  if (id === 'all') {
    store.notifications.forEach(n => {
      if (n.user_id === req.user.id) n.is_read = true;
    });
  } else {
    const notif = store.notifications.find(n => n.id === parseInt(id, 10) && n.user_id === req.user.id);
    if (notif) notif.is_read = true;
  }

  saveMemoryStore();
  res.json({ message: 'Notifications updated.' });
};

module.exports = {
  getNotifications,
  markAsRead
};
