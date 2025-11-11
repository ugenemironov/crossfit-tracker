// Временная in-memory база данных для тестирования

const users = [];
const otpCodes = [];
const movements = [];
const prRecords = [];
const wods = [];
const wodResults = [];

let nextId = {
  users: 1,
  otpCodes: 1,
  movements: 1,
  prRecords: 1,
  wods: 1,
  wodResults: 1
};

export function initDatabase() {
  console.log('📊 Initializing in-memory database...');
  
  const defaultMovements = [
    ['Back Squat', 'Powerlifting'],
    ['Front Squat', 'Weightlifting'],
    ['Deadlift', 'Powerlifting'],
    ['Bench Press', 'Powerlifting'],
    ['Overhead Press', 'Barbell'],
    ['Push Press', 'Barbell'],
    ['Push Jerk', 'Weightlifting'],
    ['Split Jerk', 'Weightlifting'],
    ['Clean', 'Weightlifting'],
    ['Power Clean', 'Weightlifting'],
    ['Snatch', 'Weightlifting'],
    ['Power Snatch', 'Weightlifting'],
    ['Overhead Squat', 'Weightlifting'],
    ['Thruster', 'Barbell'],
    ['Strict Pull-Up', 'Gymnastics']
  ];

  defaultMovements.forEach(([name, category]) => {
    movements.push({
      id: nextId.movements++,
      name,
      category,
      is_custom: 0,
      user_id: null,
      created_at: new Date().toISOString()
    });
  });

  const defaultWODs = [
    ['Fran', 'For Time', '21-15-9: Thrusters, Pull-Ups', '95/65 lb'],
    ['Grace', 'For Time', '30 Clean & Jerks', '135/95 lb'],
    ['Isabel', 'For Time', '30 Snatches', '135/95 lb'],
    ['Karen', 'For Time', '150 Wall Balls', '20/14 lb'],
    ['Diane', 'For Time', '21-15-9: Deadlifts, HSPU', '225/155 lb'],
    ['Helen', 'For Time', '3 Rounds: 400m, 21 KB, 12 PU', '53/35 lb'],
    ['Jackie', 'For Time', '1000m Row, 50 Thrusters, 30 PU', '45/35 lb'],
    ['Cindy', 'AMRAP', '20min: 5 PU, 10 Push, 15 Squat', 'BW'],
    ['DT', 'For Time', '5 Rounds: 12 DL, 9 HPC, 6 PJ', '155/105 lb'],
    ['Murph', 'For Time', '1mi, 100 PU, 200 Push, 300 Sq, 1mi', '20/14 vest']
  ];

  defaultWODs.forEach(([name, format, description, prescribed_loads]) => {
    wods.push({
      id: nextId.wods++,
      name,
      format,
      description,
      prescribed_loads,
      tags: `FORMAT:${format}`,
      is_custom: 0,
      user_id: null,
      created_at: new Date().toISOString()
    });
  });

  console.log(`✅ Database initialized: ${movements.length} movements, ${wods.length} WODs`);
}

const db = {
  prepare: (sql) => ({
    run: (...params) => {
      if (sql.includes('INSERT INTO users')) {
        const user = {
          id: nextId.users++,
          email: params[0],
          phone: params[1],
          name: params[2],
          unit_system: 'kg',
          timezone: 'UTC',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        };
        users.push(user);
        console.log('✅ User created:', user);
        return { lastInsertRowid: user.id };
      }
      
      if (sql.includes('INSERT INTO otp_codes')) {
        const otp = {
          id: nextId.otpCodes++,
          email: params[0],
          phone: params[1],
          code: params[2],
          expires_at: params[3],
          used: 0,
          created_at: new Date().toISOString()
        };
        otpCodes.push(otp);
        return { lastInsertRowid: otp.id };
      }

      if (sql.includes('INSERT INTO movements')) {
        const movement = {
          id: nextId.movements++,
          user_id: params[0],
          name: params[1],
          category: params[2],
          is_custom: 1,
          notes: params[3],
          created_at: new Date().toISOString()
        };
        movements.push(movement);
        return { lastInsertRowid: movement.id };
      }

      if (sql.includes('INSERT INTO pr_records')) {
        const record = {
          id: nextId.prRecords++,
          user_id: params[0],
          movement_id: params[1],
          date: params[2],
          rep_scheme: params[3],
          weight: params[4],
          reps: params[5],
          est_1rm: params[6],
          note: params[7],
          media_link: params[8],
          unit: params[9],
          is_pr: params[10],
          created_at: new Date().toISOString()
        };
        prRecords.push(record);
        return { lastInsertRowid: record.id };
      }

      if (sql.includes('INSERT INTO wods') && sql.includes('is_custom')) {
        const wod = {
          id: nextId.wods++,
          user_id: params[0],
          name: params[1],
          format: params[2],
          description: params[3],
          prescribed_loads: params[4],
          tags: params[5],
          is_custom: 1,
          created_at: new Date().toISOString()
        };
        wods.push(wod);
        return { lastInsertRowid: wod.id };
      }

      if (sql.includes('INSERT INTO wod_results')) {
        const result = {
          id: nextId.wodResults++,
          user_id: params[0],
          wod_id: params[1],
          date: params[2],
          format: params[3],
          time_sec: params[4],
          rounds: params[5],
          extra_reps: params[6],
          loads_used: params[7],
          rx_scaled: params[8],
          note: params[9],
          media_link: params[10],
          created_at: new Date().toISOString()
        };
        wodResults.push(result);
        return { lastInsertRowid: result.id };
      }

      if (sql.includes('UPDATE users')) {
        const userId = params[params.length - 1];
        console.log('Updating user with ID:', userId);
        console.log('Update params:', params);
        
        const user = users.find(u => u.id === userId);
        
        if (user) {
          if (sql.includes('name =')) {
            user.name = params[0] || user.name;
            user.unit_system = params[1] || user.unit_system;
            user.timezone = params[2] || user.timezone || 'UTC';
            user.birth_date = params[3] || user.birth_date || null;
            user.gender = params[4] || user.gender || null;
            console.log('✅ User profile updated:', user);
          }
          if (sql.includes('last_login')) {
            user.last_login = new Date().toISOString();
          }
          return { changes: 1 };
        } else {
          console.error('❌ User not found for update:', userId);
          return { changes: 0 };
        }
      }

      if (sql.includes('UPDATE pr_records')) {
        const recordId = params[params.length - 2];
        const record = prRecords.find(r => r.id === recordId);
        if (record) {
          record.date = params[0];
          record.rep_scheme = params[1];
          record.weight = params[2];
          record.reps = params[3];
          record.est_1rm = params[4];
          record.note = params[5];
          record.media_link = params[6];
          record.unit = params[7];
          record.is_pr = params[8];
        }
        return { changes: 1 };
      }

      if (sql.includes('UPDATE wod_results')) {
        const resultId = params[params.length - 2];
        const result = wodResults.find(r => r.id === resultId);
        if (result) {
          result.date = params[0];
          result.time_sec = params[1];
          result.rounds = params[2];
          result.extra_reps = params[3];
          result.loads_used = params[4];
          result.rx_scaled = params[5];
          result.note = params[6];
          result.media_link = params[7];
        }
        return { changes: 1 };
      }

      if (sql.includes('UPDATE otp_codes')) {
        const id = params[0];
        const otp = otpCodes.find(o => o.id === id);
        if (otp) otp.used = 1;
        return { changes: 1 };
      }

      if (sql.includes('DELETE FROM pr_records')) {
        const recordId = params[0];
        const index = prRecords.findIndex(r => r.id === recordId);
        if (index > -1) {
          prRecords.splice(index, 1);
          return { changes: 1 };
        }
        return { changes: 0 };
      }

      if (sql.includes('DELETE FROM wod_results')) {
        const resultId = params[0];
        const index = wodResults.findIndex(r => r.id === resultId);
        if (index > -1) {
          wodResults.splice(index, 1);
          return { changes: 1 };
        }
        return { changes: 0 };
      }

      if (sql.includes('DELETE FROM otp_codes')) {
        const now = params[0];
        const before = otpCodes.length;
        otpCodes.splice(0, otpCodes.length, ...otpCodes.filter(o => o.expires_at > now));
        return { changes: before - otpCodes.length };
      }

      return { lastInsertRowid: 0, changes: 0 };
    },

    get: (...params) => {
      if (sql.includes('SELECT * FROM users WHERE email')) {
        const user = users.find(u => u.email === params[0] || u.phone === params[1]);
        console.log('Finding user by email/phone:', params[0], params[1], '→', user ? 'FOUND' : 'NOT FOUND');
        return user || null;
      }

      if (sql.includes('SELECT * FROM users WHERE id')) {
        const user = users.find(u => u.id === params[0]);
        console.log('Finding user by id:', params[0], '→', user ? 'FOUND' : 'NOT FOUND');
        return user || null;
      }

      if (sql.includes('SELECT id, email')) {
        const user = users.find(u => u.id === params[0]);
        console.log('Finding user profile by id:', params[0], '→', user ? 'FOUND' : 'NOT FOUND');
        return user || null;
      }

      if (sql.includes('SELECT id FROM users WHERE id')) {
        const user = users.find(u => u.id === params[0]);
        console.log('Auth check - Finding user by id:', params[0], '→', user ? 'FOUND' : 'NOT FOUND');
        console.log('Total users in DB:', users.length);
        return user ? { id: user.id } : null;
      }

      if (sql.includes('SELECT * FROM otp_codes')) {
        const [email, phone, code, now] = params;
        return otpCodes.find(o => 
          (o.email === email || o.phone === phone) && 
          o.code === code && 
          o.used === 0 && 
          o.expires_at > now
        ) || null;
      }

      if (sql.includes('COUNT(*) as count FROM otp_codes')) {
        const [fiveMin, email, phone] = params;
        const count = otpCodes.filter(o => 
          o.created_at > fiveMin && 
          (o.email === email || o.phone === phone)
        ).length;
        return { count };
      }

      if (sql.includes('SELECT * FROM pr_records WHERE id')) {
        const recordId = params[0];
        return prRecords.find(r => r.id === recordId && r.user_id === params[1]) || null;
      }

      if (sql.includes('SELECT * FROM wod_results WHERE id')) {
        const resultId = params[0];
        return wodResults.find(r => r.id === resultId && r.user_id === params[1]) || null;
      }

      if (sql.includes('SELECT format FROM wods WHERE id')) {
        const wod = wods.find(w => w.id === params[0]);
        return wod ? { format: wod.format } : null;
      }

      if (sql.includes('MAX(est_1rm) as best_1rm FROM pr_records')) {
        const userId = params[0];
        const userRecords = prRecords.filter(r => r.user_id === userId && r.est_1rm);
        return userRecords.length > 0 
          ? { best_1rm: Math.max(...userRecords.map(r => r.est_1rm)) }
          : { best_1rm: null };
      }

      console.log('⚠️ Unhandled GET query:', sql.substring(0, 50));
      return null;
    },

    all: (...params) => {
      if (sql.includes('FROM movements')) {
        const userId = params[0];
        return movements.filter(m => m.is_custom === 0 || m.user_id === userId);
      }

      if (sql.includes('FROM wods')) {
        const userId = params[0];
        return wods.filter(w => w.is_custom === 0 || w.user_id === userId);
      }

      if (sql.includes('FROM pr_records pr JOIN movements m')) {
        const userId = params[0];
        const movementId = params[1];
        let records = prRecords.filter(r => r.user_id === userId);
        if (movementId) {
          records = records.filter(r => r.movement_id === movementId);
        }
        return records.map(r => {
          const movement = movements.find(m => m.id === r.movement_id);
          return {
            ...r,
            movement_name: movement?.name,
            category: movement?.category
          };
        });
      }

      if (sql.includes('FROM wod_results wr JOIN wods w')) {
        const userId = params[0];
        const wodId = params[1];
        let results = wodResults.filter(r => r.user_id === userId);
        if (wodId) {
          results = results.filter(r => r.wod_id === wodId);
        }
        return results.map(r => {
          const wod = wods.find(w => w.id === r.wod_id);
          return {
            ...r,
            wod_name: wod?.name,
            wod_format: wod?.format
          };
        });
      }

      if (sql.includes('WHERE (is_custom = 0 OR user_id = ?) AND name LIKE')) {
        const userId = params[0];
        const query = params[1].replace(/%/g, '');
        if (sql.includes('FROM movements')) {
          return movements
            .filter(m => (m.is_custom === 0 || m.user_id === userId) && m.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 10);
        }
        if (sql.includes('FROM wods')) {
          return wods
            .filter(w => (w.is_custom === 0 || w.user_id === userId) && w.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 10);
        }
      }

      return [];
    }
  })
};

export default db;
