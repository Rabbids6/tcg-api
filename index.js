const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connexion directe à ta base TCG PG (ton Internal URL)
const pool = new Pool({
  connectionString: 'postgresql://tcg_pg_user:z0rgTFh1t7vgtUcyZyveWvVRGDdTq2EZ@dpg-d4i3fl9r0fns73ajbep0-a/tcg_pg',
  ssl: { rejectUnauthorized: false }
});

// Route d'accueil pour tester si l'API est en vie
app.get('/', (req, res) => {
  res.json({ message: 'API Maximus TCG en ligne !' });
});

// Inscription
app.post('/auth/register', async (req, res) => {
  const { pseudo, email, mot_de_passe } = req.body;
  if (!pseudo || !email || !mot_de_passe) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  const hash = await bcrypt.hash(mot_de_passe, 10);
  try {
    const result = await pool.query(
      'INSERT INTO utilisateur(pseudo, email, mot_de_passe) VALUES($1, $2, $3) RETURNING id_utilisateur',
      [pseudo, email.toLowerCase(), hash]
    );
    res.json({ success: true, userId: result.rows[0].id_utilisateur });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'Pseudo ou email déjà utilisé' });
  }
});

// Connexion
app.post('/auth/login', async (req, res) => {
  const { email, mot_de_passe } = req.body;
  if (!email || !mot_de_passe) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  try {
    const { rows } = await pool.query('SELECT id_utilisateur, mot_de_passe FROM utilisateur WHERE email = $1', [email.toLowerCase()]);
    if (!rows[0] || !(await bcrypt.compare(mot_de_passe, rows[0].mot_de_passe))) {
      return res.status(401).json({ error: 'Mauvais email ou mot de passe' });
    }
    res.json({ success: true, userId: rows[0].id_utilisateur });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Maximus TCG prête sur port ${PORT}`));
