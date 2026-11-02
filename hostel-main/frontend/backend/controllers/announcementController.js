const { getMemoryStore, saveMemoryStore, query, isPostgresConnected } = require('../config/db');

// CREATE ANNOUNCEMENT (Warden)
const createAnnouncement = async (req, res) => {
  try {
    const { title, description, category, priority_flag, is_scheduled, scheduled_for } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    const store = getMemoryStore();
    const pCategory = category || 'General';
    const isPriority = priority_flag === 'true' || priority_flag === true;
    const isSched = is_scheduled === 'true' || is_scheduled === true;
    const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const wardenId = req.user ? req.user.profileId : null;

    let newAnnouncement = null;

    if (isPostgresConnected()) {
      try {
        const aInsert = await query(
          `INSERT INTO announcements (created_by_warden_id, title, description, category, attachment_url, is_scheduled, scheduled_for, priority_flag)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [wardenId, title, description, pCategory, attachmentUrl, isSched, scheduled_for || null, isPriority]
        );
        newAnnouncement = aInsert.rows[0];
      } catch (dbErr) {
        console.error('[DB createAnnouncement Error]', dbErr.message);
      }
    }

    if (!newAnnouncement) {
      newAnnouncement = {
        id: Date.now(),
        created_by_warden_id: wardenId || 1,
        title,
        description,
        category: pCategory,
        attachment_url: attachmentUrl,
        priority_flag: isPriority,
        is_scheduled: isSched,
        scheduled_for: scheduled_for || null,
        created_at: new Date().toISOString()
      };
    }

    store.announcements.unshift(newAnnouncement);

    // Notify Students if Important/Emergency
    if (newAnnouncement.priority_flag) {
      store.users.filter(u => u.role === 'STUDENT').forEach(stUser => {
        if (isPostgresConnected()) {
          query(
            `INSERT INTO notifications (user_id, title, message, type, is_read)
             VALUES ($1, $2, $3, 'INFO', false)`,
            [stUser.id, `📢 Announcement: ${title}`, description.slice(0, 100) + '...']
          ).catch(() => {});
        }
        store.notifications.push({
          id: Date.now() + Math.random() * 10,
          user_id: stUser.id,
          title: `📢 Announcement: ${title}`,
          message: description.slice(0, 100) + '...',
          type: 'INFO',
          is_read: false,
          created_at: new Date().toISOString()
        });
      });
    }

    saveMemoryStore();
    res.status(201).json({ message: 'Announcement published successfully!', announcement: newAnnouncement });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create announcement.' });
  }
};

// GET ANNOUNCEMENTS
const getAnnouncements = (req, res) => {
  const store = getMemoryStore();
  res.json(store.announcements);
};

// DELETE ANNOUNCEMENT
const deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  const store = getMemoryStore();
  const index = store.announcements.findIndex(a => String(a.id) === String(id));

  if (index === -1) return res.status(404).json({ error: 'Announcement not found.' });

  if (isPostgresConnected()) {
    try {
      await query('DELETE FROM announcements WHERE id = $1', [id]);
    } catch (e) {
      console.error('[DB deleteAnnouncement Error]', e.message);
    }
  }

  store.announcements.splice(index, 1);
  saveMemoryStore();

  res.json({ message: 'Announcement deleted.' });
};

module.exports = {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement
};
