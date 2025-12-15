const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Inscription (pseudo + email + mdp)
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    try {
    const result = await pool.query(
        'INSERT INTO users(username, email, password) VALUES($1, $2, $3) RETURNING id',
        [username, email.toLowerCase(), hash]
    );
    res.json({ success: true, userId: result.rows[0].id });
    } catch (e) {
        res.status(400).json({ error: 'Pseudo ou email déjà utilisé' });
    }
});

// Connexion
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const { rows } = await pool.query('SELECT id, password FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!rows[0] || !(await bcrypt.compare(password, rows[0].password))) {
        return res.status(401).json({ error: 'Mauvais identifiants' });
    }
    res.json({ success: true, userId: rows[0].id, username: rows[0].username });
});

app.listen(process.env.PORT || 3000);