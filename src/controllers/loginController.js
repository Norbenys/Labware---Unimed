// src/controllers/loginController.js

const express = require('express');
const router = express.Router();
const db = require('../database/connection'); // ✅ SIN .promise()

// Ruta para iniciar sesión
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Intentando login para usuario:', username);

  try {
    const [results] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [username]);
    console.log('Resultados de la consulta:', results);

    if (results.length === 0) {
      console.log('Usuario no encontrado:', username);
      return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
    }

    const user = results[0];
    console.log('Usuario encontrado:', user);
    console.log('Contraseña recibida:', password, 'Contraseña en BD:', user.contraseña);

    if (password === user.contraseña) {
      console.log('Login exitoso para:', username);
      return res.json({
        success: true,
        message: 'Bienvenido.',
        rol: user.id_rol,  // ← devolvemos el rol del usuario
        nombre: user.nombres, // ← corregido a 'nombres'
        apellido: user.apellidos // ← corregido a 'apellidos'
      });
    } else {
      console.log('Contraseña incorrecta para:', username);
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
    }

  } catch (err) {
    console.error('Error en el login:', err);
    return res.status(500).json({ success: false, message: 'Error en la base de datos.' });
  }
});

module.exports = router;
