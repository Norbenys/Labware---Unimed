// src/controllers/loginController.js

const express = require('express');
const router = express.Router();
const db = require('../database/connection'); // ✅ SIN .promise()

// Ruta para iniciar sesión
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [results] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [username]);

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
    }

    const user = results[0];

    if (password === user.contraseña) {
      return res.json({
        success: true,
        message: 'Bienvenido.',
        rol: user.id_rol  // ← devolvemos el rol del usuario
      });
    } else {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
    }

  } catch (err) {
    console.error('Error en el login:', err);
    return res.status(500).json({ success: false, message: 'Error en la base de datos.' });
  }
});

module.exports = router;
