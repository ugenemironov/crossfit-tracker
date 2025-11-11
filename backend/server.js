import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db, { initDatabase } from './database.js';
import { 
  generateOTP, 
  sendOTPEmail, 
  saveOTP, 
  verifyOTP, 
  createToken, 
  authenticateToken 
} from './auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Инициализация БД
initDatabase();

// ==================== AUTH ROUTES ====================

// Запрос OTP кода
app.post('/api/auth/request-otp', async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone required' });
    }

    const code = generateOTP();
    saveOTP(email || null, phone || null, code);

    if (email) {
      await sendOTPEmail(email, code);
    }
    // Для SMS в продакшене добавь Twilio/подобное

    res.json({ 
      message: 'OTP sent', 
      dev_code: process.env.NODE_ENV === 'development' ? code : undefined 
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Верификация OTP и вход/регистрация
app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const { email, phone, code } = req.body;

    if (!verifyOTP(email || null, phone || null, code)) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    // Проверяем, существует ли пользователь
    let user = db.prepare('SELECT * FROM users WHERE email = ? OR phone = ?')
      .get(email || null, phone || null);

    if (!user) {
      // Новый пользователь - создаём с временными данными
      const result = db.prepare(`
        INSERT INTO users (email, phone, name, last_login)
        VALUES (?, ?, ?, datetime('now'))
      `).run(email || null, phone || null, 'New User');

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    } else {
      // Обновляем last_login
      db.prepare('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?').run(user.id);
    }

    const token = createToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        unit_system: user.unit_system,
        timezone: user.timezone,
        needs_onboarding: user.name === 'New User'
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ==================== USER ROUTES ====================

// Получить профиль
// Обновить профиль
app.put('/api/user/profile', authenticateToken, (req, res) => {
  try {
    const { name, unit_system, timezone, birth_date, gender } = req.body;

    console.log('Update profile request:', { userId: req.userId, body: req.body });

    if (!name || !unit_system) {
      return res.status(400).json({ error: 'Name and unit_system are required' });
    }

    if (!['kg', 'lb'].includes(unit_system)) {
      return res.status(400).json({ error: 'unit_system must be kg or lb' });
    }

    const result = db.prepare(`
      UPDATE users 
      SET name = ?, unit_system = ?, timezone = ?, birth_date = ?, gender = ?
      WHERE id = ?
    `).run(
      name.trim(), 
      unit_system, 
      timezone || 'UTC', 
      birth_date || null, 
      gender || null, 
      req.userId
    );

    console.log('Update result:', result);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Обновить профиль
app.put('/api/user/profile', authenticateToken, (req, res) => {
  try {
    const { name, unit_system, timezone, birth_date, gender } = req.body;

    if (!name || !unit_system) {
      return res.status(400).json({ error: 'Name and unit_system are required' });
    }

    if (!['kg', 'lb'].includes(unit_system)) {
      return res.status(400).json({ error: 'unit_system must be kg or lb' });
    }

    db.prepare(`
      UPDATE users 
      SET name = ?, unit_system = ?, timezone = ?, birth_date = ?, gender = ?
      WHERE id = ?
    `).run(name, unit_system, timezone || 'UTC', birth_date || null, gender || null, req.userId);

    res.json({ message: 'Profile updated' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ==================== MOVEMENTS ROUTES ====================

// Получить все движения (стандартные + кастомные пользователя)
app.get('/api/movements', authenticateToken, (req, res) => {
  try {
    const movements = db.prepare(`
      SELECT * FROM movements 
      WHERE is_custom = 0 OR user_id = ?
      ORDER BY name
    `).all(req.userId);

    res.json(movements);
  } catch (error) {
    console.error('Get movements error:', error);
    res.status(500).json({ error: 'Failed to get movements' });
  }
});

// Создать кастомное движение
app.post('/api/movements', authenticateToken, (req, res) => {
  try {
    const { name, category, notes } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = db.prepare(`
      INSERT INTO movements (user_id, name, category, is_custom, notes)
      VALUES (?, ?, ?, 1, ?)
    `).run(req.userId, name.trim(), category || 'Other', notes || null);

    res.json({ id: result.lastInsertRowid, message: 'Movement created' });
  } catch (error) {
    console.error('Create movement error:', error);
    res.status(500).json({ error: 'Failed to create movement' });
  }
});

// ==================== PR RECORDS ROUTES ====================

// Получить все PR записи пользователя
app.get('/api/pr-records', authenticateToken, (req, res) => {
  try {
    const { movement_id } = req.query;

    let query = `
      SELECT pr.*, m.name as movement_name, m.category
      FROM pr_records pr
      JOIN movements m ON pr.movement_id = m.id
      WHERE pr.user_id = ?
    `;
    const params = [req.userId];

    if (movement_id) {
      query += ' AND pr.movement_id = ?';
      params.push(parseInt(movement_id));
    }

    query += ' ORDER BY pr.date DESC, pr.created_at DESC';

    const records = db.prepare(query).all(...params);
    res.json(records);
  } catch (error) {
    console.error('Get PR records error:', error);
    res.status(500).json({ error: 'Failed to get PR records' });
  }
});

// Добавить PR запись
app.post('/api/pr-records', authenticateToken, (req, res) => {
  try {
    const { movement_id, date, rep_scheme, weight, reps, note, media_link, unit, is_pr } = req.body;

    if (!movement_id || !date || !rep_scheme || !unit) {
      return res.status(400).json({ error: 'Missing required fields: movement_id, date, rep_scheme, unit' });
    }

    if (!['kg', 'lb'].includes(unit)) {
      return res.status(400).json({ error: 'unit must be kg or lb' });
    }

    // Рассчитываем est_1RM (формула Epley)
    let est1RM = null;
    if (weight && reps && reps > 0) {
      est1RM = parseFloat((weight * (1 + reps / 30)).toFixed(2));
    } else if (weight && rep_scheme.includes('RM')) {
      const repsNum = parseInt(rep_scheme.match(/\d+/)?.[0] || '1');
      if (repsNum === 1) {
        est1RM = parseFloat(weight);
      } else if (repsNum > 0) {
        est1RM = parseFloat((weight * (1 + repsNum / 30)).toFixed(2));
      }
    }

    const result = db.prepare(`
      INSERT INTO pr_records 
      (user_id, movement_id, date, rep_scheme, weight, reps, est_1rm, note, media_link, unit, is_pr)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId, 
      parseInt(movement_id), 
      date, 
      rep_scheme, 
      weight ? parseFloat(weight) : null, 
      reps ? parseInt(reps) : null, 
      est1RM, 
      note || null, 
      media_link || null, 
      unit, 
      is_pr ? 1 : 0
    );

    res.json({ id: result.lastInsertRowid, message: 'PR record created', est_1rm: est1RM });
  } catch (error) {
    console.error('Create PR record error:', error);
    res.status(500).json({ error: 'Failed to create PR record' });
  }
});

// Обновить PR запись
app.put('/api/pr-records/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { date, rep_scheme, weight, reps, note, media_link, unit, is_pr } = req.body;

    // Проверяем принадлежность записи пользователю
    const record = db.prepare('SELECT * FROM pr_records WHERE id = ? AND user_id = ?')
      .get(parseInt(id), req.userId);
    
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Пересчитываем est_1RM
    let est1RM = null;
    if (weight && reps && reps > 0) {
      est1RM = parseFloat((weight * (1 + reps / 30)).toFixed(2));
    } else if (weight && rep_scheme && rep_scheme.includes('RM')) {
      const repsNum = parseInt(rep_scheme.match(/\d+/)?.[0] || '1');
      if (repsNum === 1) {
        est1RM = parseFloat(weight);
      } else if (repsNum > 0) {
        est1RM = parseFloat((weight * (1 + repsNum / 30)).toFixed(2));
      }
    }

    db.prepare(`
      UPDATE pr_records 
      SET date = ?, rep_scheme = ?, weight = ?, reps = ?, est_1rm = ?, note = ?, media_link = ?, unit = ?, is_pr = ?
      WHERE id = ? AND user_id = ?
    `).run(
      date, 
      rep_scheme, 
      weight ? parseFloat(weight) : null, 
      reps ? parseInt(reps) : null, 
      est1RM, 
      note || null, 
      media_link || null, 
      unit, 
      is_pr ? 1 : 0, 
      parseInt(id), 
      req.userId
    );

    res.json({ message: 'PR record updated' });
  } catch (error) {
    console.error('Update PR record error:', error);
    res.status(500).json({ error: 'Failed to update PR record' });
  }
});

// Удалить PR запись
app.delete('/api/pr-records/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const result = db.prepare('DELETE FROM pr_records WHERE id = ? AND user_id = ?')
      .run(parseInt(id), req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json({ message: 'PR record deleted' });
  } catch (error) {
    console.error('Delete PR record error:', error);
    res.status(500).json({ error: 'Failed to delete PR record' });
  }
});

// Получить статистику по движению (best, last, первый для Δ%)
app.get('/api/movements/:id/stats', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const movementId = parseInt(id);

    const stats = db.prepare(`
      SELECT 
        MAX(est_1rm) as best_1rm,
        (SELECT est_1rm FROM pr_records WHERE movement_id = ? AND user_id = ? AND est_1rm IS NOT NULL ORDER BY date DESC LIMIT 1) as last_1rm,
        (SELECT est_1rm FROM pr_records WHERE movement_id = ? AND user_id = ? AND est_1rm IS NOT NULL ORDER BY date ASC LIMIT 1) as first_1rm,
        COUNT(*) as total_records
      FROM pr_records
      WHERE movement_id = ? AND user_id = ?
    `).get(movementId, req.userId, movementId, req.userId, movementId, req.userId);

    // Рассчитываем процент прогресса
    let delta = 0;
    if (stats.first_1rm && stats.last_1rm && stats.first_1rm > 0) {
      delta = parseFloat(((stats.last_1rm - stats.first_1rm) / stats.first_1rm * 100).toFixed(1));
    }

    res.json({ 
      ...stats, 
      delta_percent: delta,
      best_1rm: stats.best_1rm || 0,
      last_1rm: stats.last_1rm || 0,
      first_1rm: stats.first_1rm || 0
    });
  } catch (error) {
    console.error('Get movement stats error:', error);
    res.status(500).json({ error: 'Failed to get movement stats' });
  }
});

// ==================== WODS ROUTES ====================

// Получить все WOD'ы (стандартные + кастомные)
app.get('/api/wods', authenticateToken, (req, res) => {
  try {
    const wods = db.prepare(`
      SELECT * FROM wods 
      WHERE is_custom = 0 OR user_id = ?
      ORDER BY name
    `).all(req.userId);

    res.json(wods);
  } catch (error) {
    console.error('Get WODs error:', error);
    res.status(500).json({ error: 'Failed to get WODs' });
  }
});

// Создать кастомный WOD
app.post('/api/wods', authenticateToken, (req, res) => {
  try {
    const { name, format, description, prescribed_loads, tags } = req.body;

    if (!name || !format || !description) {
      return res.status(400).json({ error: 'Name, format, and description are required' });
    }

    const result = db.prepare(`
      INSERT INTO wods (user_id, name, format, description, prescribed_loads, tags, is_custom)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(req.userId, name.trim(), format, description, prescribed_loads || null, tags || null);

    res.json({ id: result.lastInsertRowid, message: 'WOD created' });
  } catch (error) {
    console.error('Create WOD error:', error);
    res.status(500).json({ error: 'Failed to create WOD' });
  }
});

// ==================== WOD RESULTS ROUTES ====================

// Получить результаты WOD
app.get('/api/wod-results', authenticateToken, (req, res) => {
  try {
    const { wod_id } = req.query;

    let query = `
      SELECT wr.*, w.name as wod_name, w.format as wod_format
      FROM wod_results wr
      JOIN wods w ON wr.wod_id = w.id
      WHERE wr.user_id = ?
    `;
    const params = [req.userId];

    if (wod_id) {
      query += ' AND wr.wod_id = ?';
      params.push(parseInt(wod_id));
    }

    query += ' ORDER BY wr.date DESC';

    const results = db.prepare(query).all(...params);
    res.json(results);
  } catch (error) {
    console.error('Get WOD results error:', error);
    res.status(500).json({ error: 'Failed to get WOD results' });
  }
});

// Добавить результат WOD
app.post('/api/wod-results', authenticateToken, (req, res) => {
  try {
    const { wod_id, date, format, time_sec, rounds, extra_reps, loads_used, rx_scaled, note, media_link } = req.body;

    if (!wod_id || !date || !format) {
      return res.status(400).json({ error: 'Missing required fields: wod_id, date, format' });
    }

    const result = db.prepare(`
      INSERT INTO wod_results 
      (user_id, wod_id, date, format, time_sec, rounds, extra_reps, loads_used, rx_scaled, note, media_link)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId, 
      parseInt(wod_id), 
      date, 
      format, 
      time_sec ? parseInt(time_sec) : null, 
      rounds ? parseInt(rounds) : null, 
      extra_reps ? parseInt(extra_reps) : null, 
      loads_used || null, 
      rx_scaled || 'Rx', 
      note || null, 
      media_link || null
    );

    res.json({ id: result.lastInsertRowid, message: 'WOD result saved' });
  } catch (error) {
    console.error('Create WOD result error:', error);
    res.status(500).json({ error: 'Failed to save WOD result' });
  }
});

// Обновить результат WOD
app.put('/api/wod-results/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { date, time_sec, rounds, extra_reps, loads_used, rx_scaled, note, media_link } = req.body;

    const record = db.prepare('SELECT * FROM wod_results WHERE id = ? AND user_id = ?')
      .get(parseInt(id), req.userId);
    
    if (!record) {
      return res.status(404).json({ error: 'Result not found' });
    }

    db.prepare(`
      UPDATE wod_results 
      SET date = ?, time_sec = ?, rounds = ?, extra_reps = ?, loads_used = ?, rx_scaled = ?, note = ?, media_link = ?
      WHERE id = ? AND user_id = ?
    `).run(
      date, 
      time_sec ? parseInt(time_sec) : null, 
      rounds ? parseInt(rounds) : null, 
      extra_reps ? parseInt(extra_reps) : null, 
      loads_used || null, 
      rx_scaled || 'Rx', 
      note || null, 
      media_link || null, 
      parseInt(id), 
      req.userId
    );

    res.json({ message: 'WOD result updated' });
  } catch (error) {
    console.error('Update WOD result error:', error);
    res.status(500).json({ error: 'Failed to update WOD result' });
  }
});

// Удалить результат WOD
app.delete('/api/wod-results/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const result = db.prepare('DELETE FROM wod_results WHERE id = ? AND user_id = ?')
      .run(parseInt(id), req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json({ message: 'WOD result deleted' });
  } catch (error) {
    console.error('Delete WOD result error:', error);
    res.status(500).json({ error: 'Failed to delete WOD result' });
  }
});

// Статистика по WOD
app.get('/api/wods/:id/stats', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const wodId = parseInt(id);

    // Получаем формат WOD
    const wod = db.prepare('SELECT format FROM wods WHERE id = ?').get(wodId);
    if (!wod) {
      return res.status(404).json({ error: 'WOD not found' });
    }

    let stats;
    
    if (wod.format === 'For Time') {
      stats = db.prepare(`
        SELECT 
          MIN(time_sec) as best_time,
          (SELECT time_sec FROM wod_results WHERE wod_id = ? AND user_id = ? AND time_sec IS NOT NULL ORDER BY date DESC LIMIT 1) as last_time,
          (SELECT time_sec FROM wod_results WHERE wod_id = ? AND user_id = ? AND time_sec IS NOT NULL ORDER BY date ASC LIMIT 1) as first_time,
          COUNT(*) as total_attempts
        FROM wod_results
        WHERE wod_id = ? AND user_id = ? AND time_sec IS NOT NULL
      `).get(wodId, req.userId, wodId, req.userId, wodId, req.userId);
    } else if (wod.format === 'AMRAP') {
      stats = db.prepare(`
        SELECT 
          MAX(COALESCE(rounds, 0) * 1000 + COALESCE(extra_reps, 0)) as best_score,
          (SELECT COALESCE(rounds, 0) * 1000 + COALESCE(extra_reps, 0) FROM wod_results WHERE wod_id = ? AND user_id = ? ORDER BY date DESC LIMIT 1) as last_score,
          (SELECT COALESCE(rounds, 0) * 1000 + COALESCE(extra_reps, 0) FROM wod_results WHERE wod_id = ? AND user_id = ? ORDER BY date ASC LIMIT 1) as first_score,
          COUNT(*) as total_attempts
        FROM wod_results
        WHERE wod_id = ? AND user_id = ?
      `).get(wodId, req.userId, wodId, req.userId, wodId, req.userId);
    } else {
      stats = { total_attempts: 0 };
    }

    res.json(stats || { total_attempts: 0 });
  } catch (error) {
    console.error('Get WOD stats error:', error);
    res.status(500).json({ error: 'Failed to get WOD stats' });
  }
});

// ==================== PERCENT CALCULATOR ====================

app.get('/api/percent-calculator/:movement_id', authenticateToken, (req, res) => {
  try {
    const { movement_id } = req.params;
    const { base_1rm } = req.query;

    // Получаем лучший 1RM если base_1rm не указан
    let oneRM = base_1rm ? parseFloat(base_1rm) : null;

    if (!oneRM) {
      const stats = db.prepare(`
        SELECT MAX(est_1rm) as best_1rm
        FROM pr_records
        WHERE movement_id = ? AND user_id = ? AND est_1rm IS NOT NULL
      `).get(parseInt(movement_id), req.userId);

      oneRM = stats?.best_1rm;
    }

    if (!oneRM || oneRM <= 0) {
      return res.status(404).json({ error: 'No PR records found for this movement' });
    }

    // Генерируем таблицу от 10% до 95% с шагом 5%
    const table = [];
    for (let percent = 10; percent <= 95; percent += 5) {
      table.push({
        percent,
        weight: parseFloat((oneRM * percent / 100).toFixed(1))
      });
    }

    res.json({ base_1rm: parseFloat(oneRM.toFixed(1)), table });
  } catch (error) {
    console.error('Percent calculator error:', error);
    res.status(500).json({ error: 'Failed to calculate percentages' });
  }
});

// ==================== SEARCH ====================

app.get('/api/search', authenticateToken, (req, res) => {
  try {
    const { q, type } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const query = `%${q.trim()}%`;
    const results = {};

    if (!type || type === 'movements') {
      results.movements = db.prepare(`
        SELECT * FROM movements
        WHERE (is_custom = 0 OR user_id = ?) AND name LIKE ?
        ORDER BY name
        LIMIT 10
      `).all(req.userId, query);
    }

    if (!type || type === 'wods') {
      results.wods = db.prepare(`
        SELECT * FROM wods
        WHERE (is_custom = 0 OR user_id = ?) AND name LIKE ?
        ORDER BY name
        LIMIT 10
      `).all(req.userId, query);
    }

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== ERROR HANDLER ====================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database initialized`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});
