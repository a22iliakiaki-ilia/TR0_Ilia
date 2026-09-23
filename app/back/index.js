const express = require('express');
const path = require('path');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { randomUUID } = require('crypto');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 4000;
const QUESTIONS_PER_QUIZ = 10;
const SESSION_TTL_MS = 60 * 60 * 1000; 



const uploadDir = path.join(__dirname, 'public', 'img');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `image_${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});


const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quiz',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const sessions = {};

setInterval(() => {
  const now = Date.now();
  for (const id of Object.keys(sessions)) {
    if (now - sessions[id].createdAt > SESSION_TTL_MS) delete sessions[id];
  }
}, 10 * 60 * 1000).unref();

async function getRandomQuestions(count) {
  const [preguntas] = await pool.query(
    'SELECT id, pregunta, imagen FROM preguntas ORDER BY RAND() LIMIT ?',
    [count]
  );
  if (preguntas.length === 0) return [];

  const ids = preguntas.map((p) => p.id);
  const [respostas] = await pool.query(
    'SELECT pregunta_id, `text` FROM respostas WHERE pregunta_id IN (?) ORDER BY pregunta_id, ordre',
    [ids]
  );

  const byQuestion = new Map();
  for (const r of respostas) {
    if (!byQuestion.has(r.pregunta_id)) byQuestion.set(r.pregunta_id, []);
    byQuestion.get(r.pregunta_id).push(r.text);
  }

  return preguntas.map((p) => ({
    id: p.id,
    pregunta: p.pregunta,
    imatge: p.imagen,
    respostes: byQuestion.get(p.id) || [],
  }));
}

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/all', async (req, res) => {
  try {
    const preguntes = await getRandomQuestions(QUESTIONS_PER_QUIZ);
    if (preguntes.length === 0) {
      return res.status(404).json({ error: 'no questions found' });
    }

    const session_id = randomUUID();
    sessions[session_id] = {
      questionIds: preguntes.map((q) => q.id),
      createdAt: Date.now(),
    };

    res.json({ session_id, preguntes });
  } catch (err) {
    console.error('Error en /all:', err.message);
    res.status(500).json({ error: 'database error' });
  }
});

app.get('/ids', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id FROM preguntas ORDER BY id');
    res.json(rows.map((r) => r.id));
  } catch (err) {
    console.error('Error en /ids:', err.message);
    res.status(500).json({ error: 'database error' });
  }
});

app.delete('/question/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM preguntas WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'question not found' });
    }
    res.json({ message: 'question deleted successfully' });
  } catch (err) {
    console.error('Error en /question/:id:', err.message);
    res.status(500).json({ error: 'database error' });
  }
});

app.post('/question', upload.single('imagen'), async (req, res) => {
  const { pregunta, respostes, correctOption } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'imagen is required' });
  }

  let respostesArr;
  try {
    respostesArr = JSON.parse(respostes);
  } catch {
    return res.status(400).json({ error: 'respostes must be valid JSON array' });
  }

  if (!pregunta || !Array.isArray(respostesArr) || respostesArr.length === 0) {
    return res.status(400).json({ error: 'pregunta and respostes are required' });
  }

  const correctIndex = parseInt(correctOption, 10) - 1;
  if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= respostesArr.length) {
    return res.status(400).json({ error: 'correctOption must be between 1 and ' + respostesArr.length });
  }

  const imagenPath = `/img/${req.file.filename}`;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO preguntas (pregunta, imagen) VALUES (?, ?)',
      [pregunta, imagenPath]
    );
    const preguntaId = result.insertId;

    const respostaInserts = respostesArr.map((text, index) => [
      preguntaId,
      text,
      index === correctIndex,
      index
    ]);

    await conn.query(
      'INSERT INTO respostas (pregunta_id, `text`, es_correcta, ordre) VALUES ?',
      [respostaInserts]
    );

    await conn.commit();
    res.status(201).json({ message: 'question created successfully', preguntaId, imagen: imagenPath });
  } catch (err) {
    await conn.rollback();
    console.error('Error en /question:', err.message);
    res.status(500).json({ error: 'database error' });
  } finally {
    conn.release();
  }
});

app.put('/question/:id', async (req, res) => {
  const { id } = req.params;
  const { pregunta, imagen, respostes } = req.body;

  if (!pregunta || !Array.isArray(respostes) || respostes.length === 0) {
    return res.status(400).json({ error: 'pregunta and respostes are required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'UPDATE preguntas SET pregunta = ?, imagen = ? WHERE id = ?',
      [pregunta, imagen || null, id]
    );
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'question not found' });
    }

    await conn.query('DELETE FROM respostas WHERE pregunta_id = ?', [id]);

    const respostaInserts = respostes.map((text, index) => [id, text, index]);
    await conn.query(
      'INSERT INTO respostas (pregunta_id, `text`, ordre) VALUES ?',
      [respostaInserts]
    );

    await conn.commit();
    res.json({ message: 'question updated successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('Error en /question/:id:', err.message);
    res.status(500).json({ error: 'database error' });
  } finally {
    conn.release();
  }
});

app.get('/question/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [preguntas] = await pool.query(
      'SELECT id, pregunta, imagen FROM preguntas WHERE id = ?',
      [id]
    );
    if (preguntas.length === 0) {
      return res.status(404).json({ error: 'question not found' });
    }

    const pregunta = preguntas[0];
    const [respostas] = await pool.query(
      'SELECT `text` FROM respostas WHERE pregunta_id = ? ORDER BY ordre',
      [id]
    );

    res.json({
      id: pregunta.id,
      pregunta: pregunta.pregunta,
      imatge: pregunta.imagen,
      respostes: respostas.map((r) => r.text),
    });
  } catch (err) {
    console.error('Error en /question/:id:', err.message);
    res.status(500).json({ error: 'database error' });
  }
});

app.get('/questions', async (req, res) => {
  try {
    const [preguntas] = await pool.query(
      'SELECT id, pregunta, imagen FROM preguntas'
    );

    const questions = await Promise.all(
      preguntas.map(async (pregunta) => {
        const [respostas] = await pool.query(
          'SELECT `text` FROM respostas WHERE pregunta_id = ? ORDER BY ordre',
          [pregunta.id]
        );
        return {
          id: pregunta.id,
          pregunta: pregunta.pregunta,
          imatge: pregunta.imagen,
          respostes: respostas.map((r) => r.text),
        };
      })
    );

    res.json(questions);
  } catch (err) {
    console.error('Error en /questions:', err.message);
    res.status(500).json({ error: 'database error' });
  }
});

app.post('/check-correctes', async (req, res) => {
  const { session_id, user_respost } = req.body || {};

  if (
    !session_id ||
    typeof user_respost !== 'object' ||
    user_respost === null ||
    Array.isArray(user_respost)
  ) {
    return res
      .status(400)
      .json({ error: 'user_respost and session_id are required' });
  }

  const session = sessions[session_id];
  if (!session) {
    return res.status(400).json({ error: 'invalid or expired session' });
  }

  try {
    const [correctes] = await pool.query(
      'SELECT pregunta_id, ordre FROM respostas WHERE es_correcta = TRUE AND pregunta_id IN (?)',
      [session.questionIds]
    );

    const total = session.questionIds.length;
    let score = 0;

    for (const c of correctes) {
      const userAnswer = user_respost[c.pregunta_id];
      if (Number.isInteger(userAnswer) && userAnswer === c.ordre) {
        score++;
      }
    }

    const nota = total > 0 ? Math.round((score / total) * 100) / 10 : 0;

    delete sessions[session_id]; 

    res.json({ score, total, nota });
  } catch (err) {
    console.error('Error en /check-correctes:', err.message);
    res.status(500).json({ error: 'database error' });
  }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


async function waitForDatabase(retries = 30, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query('SELECT 1');
      console.log('Conectado a la base de datos');
      return;
    } catch (err) {
      console.log(
        `BD no disponible (intento ${attempt}/${retries}): ${err.code || err.message}`
      );
      if (attempt === retries) {
        console.error('No se pudo conectar a la base de datos, saliendo.');
        process.exit(1);
      }
      await sleep(delayMs);
    }
  }
}

(async () => {
  await waitForDatabase();

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
})();