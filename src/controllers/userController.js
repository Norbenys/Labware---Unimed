// src/controllers/userController.js

const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// ===================== OBTENER USUARIOS =====================
router.get('/users', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        u.id, 
        u.nombres, 
        u.apellidos, 
        u.telefono, 
        u.correo, 
        r.nombre AS rol
      FROM usuarios u
      LEFT JOIN rol r ON u.id_rol = r.id;
    `);
    res.json({ success: true, users: results });
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ success: false, message: 'Error al obtener los usuarios.' });
  }
});

// ===================== OBTENER TÍTULOS =====================
router.get('/titles', async (req, res) => {
  try {
    const [results] = await db.query('SELECT id, nombre FROM titulo');
    res.json({ success: true, titles: results });
  } catch (err) {
    console.error(' Error al obtener los títulos:', err);
    res.status(500).json({ success: false, message: 'Error al obtener los títulos.' });
  }
});

// ===================== OBTENER ROLES =====================
router.get('/roles', async (req, res) => {
  try {
    const [results] = await db.query('SELECT id, nombre FROM rol');
    res.json({ success: true, roles: results });
  } catch (err) {
    console.error('Error al obtener los roles:', err);
    res.status(500).json({ success: false, message: 'Error al obtener los roles.' });
  }
});

// ===================== AGREGAR NUEVO USUARIO =====================
router.post('/addUser', async (req, res) => {
  const { cedula, nombres, apellidos, fecha_nacimiento, telefono, email, titulo, usuario, password, rol } = req.body;

  try {
    await db.query(`
      INSERT INTO usuarios 
        (cedula, nombres, apellidos, fecha_nacimiento, telefono, correo, id_titulo, usuario, contraseña, id_rol) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [cedula, nombres, apellidos, fecha_nacimiento, telefono, email, titulo, usuario, password, rol]);

    res.json({ success: true, message: 'Usuario agregado exitosamente.' });
  } catch (err) {
    console.error('Error al insertar el usuario:', err);
    res.status(500).json({ success: false, message: 'Error al agregar el usuario.' });
  }
});

// ===================== OBTENER UN USUARIO POR ID =====================
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT 
        id,
        cedula,
        nombres,
        apellidos,
        fecha_nacimiento,
        telefono,
        correo,
        id_titulo,
        usuario,
        contraseña,
        id_rol
      FROM usuarios
      WHERE id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.json({ success: true, usuario: rows[0] });

  } catch (err) {
    console.error('Error al obtener el usuario:', err);
    res.status(500).json({ success: false, message: 'Error al obtener el usuario.' });
  }
});

// ===================== ACTUALIZAR USUARIO =====================
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const {
    cedula,
    nombres,
    apellidos,
    fecha_nacimiento,
    telefono,
    correo,
    id_titulo,
    usuario,
    contraseña,
    id_rol
  } = req.body;

  try {
    await db.query(`
      UPDATE usuarios SET
        cedula = ?,
        nombres = ?,
        apellidos = ?,
        fecha_nacimiento = ?,
        telefono = ?,
        correo = ?,
        id_titulo = ?,
        usuario = ?,
        contraseña = ?,
        id_rol = ?
      WHERE id = ?
    `, [
      cedula,
      nombres,
      apellidos,
      fecha_nacimiento,
      telefono,
      correo,
      id_titulo,
      usuario,
      contraseña,
      id_rol,
      id
    ]);

    res.json({ success: true, message: 'Usuario actualizado correctamente.' });
  } catch (err) {
    console.error('Error al actualizar el usuario:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar el usuario.' });
  }
});

// ===================== ELIMINAR USUARIO POR ID (con async/await) =====================
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM usuarios WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'El usuario no existe o ya fue eliminado.' });
    }

    res.json({ success: true, message: 'Usuario eliminado correctamente.' });
  } catch (err) {
    console.error('❌ Error al eliminar el usuario:', err);
    res.status(500).json({ success: false, message: 'Error al eliminar el usuario.' });
  }
});

module.exports = router;
