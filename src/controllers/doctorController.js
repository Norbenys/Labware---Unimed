const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// ===================== OBTENER DOCTORES =====================
router.get('/', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        d.id, 
        d.nombres, 
        d.apellidos, 
        e.nombre AS especialidad, 
        d.correo,
        d.telefono
      FROM 
        doctores d
      LEFT JOIN 
        especialidad e ON d.id_especialidad = e.id;
    `);
    res.json({ success: true, doctors: results });
  } catch (err) {
    console.error('Error al obtener los doctores:', err);
    res.status(500).json({ success: false, message: 'Error al obtener los doctores', error: err });
  }
});

// ===================== OBTENER ESPECIALIDADES =====================
router.get('/especialidades', async (req, res) => {
  try {
    const [results] = await db.query('SELECT id, nombre FROM especialidad');
    res.json({ success: true, especialidades: results });
  } catch (err) {
    console.error('Error al obtener especialidades:', err);
    res.status(500).json({ success: false, message: 'Error al obtener especialidades' });
  }
});


// ===================== AGREGAR NUEVO DOCTOR =====================
router.post('/add', async (req, res) => {
  const {
    cedula,
    nombres,
    apellidos,
    fecha_nacimiento,
    telefono,
    correo,
    id_especialidad
  } = req.body;

  try {
    await db.query(`
      INSERT INTO doctores 
        (cedula, nombres, apellidos, fecha_nacimiento, telefono, correo, id_especialidad)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [cedula, nombres, apellidos, fecha_nacimiento, telefono, correo, id_especialidad]);

    res.json({ success: true, message: 'Doctor agregado correctamente.' });
  } catch (err) {
    console.error('❌ Error al agregar el doctor:', err);
    res.status(500).json({ success: false, message: 'Error al agregar el doctor.' });
  }
});

// ===================== OBTENER UN DOCTOR POR ID =====================
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
        id_especialidad
      FROM doctores
      WHERE id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor no encontrado' });
    }

    res.json({ success: true, doctor: rows[0] });

  } catch (err) {
    console.error('Error al obtener el doctor:', err);
    res.status(500).json({ success: false, message: 'Error al obtener el doctor.' });
  }
});

// ===================== ACTUALIZAR DOCTOR =====================
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const {
    cedula,
    nombres,
    apellidos,
    fecha_nacimiento,
    telefono,
    correo,
    id_especialidad
  } = req.body;

  try {
    await db.query(`
      UPDATE doctores SET
        cedula = ?,
        nombres = ?,
        apellidos = ?,
        fecha_nacimiento = ?,
        telefono = ?,
        correo = ?,
        id_especialidad = ?
      WHERE id = ?
    `, [
      cedula,
      nombres,
      apellidos,
      fecha_nacimiento,
      telefono,
      correo,
      id_especialidad,
      id
    ]);

    res.json({ success: true, message: 'Doctor actualizado correctamente.' });
  } catch (err) {
    console.error('Error al actualizar el doctor:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar el doctor.' });
  }
});

// ===================== ELIMINAR DOCTOR POR ID (con async/await) =====================
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM doctores WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'El doctor no existe o ya fue eliminado.' });
    }

    res.json({ success: true, message: 'Doctor eliminado correctamente.' });
  } catch (err) {
    console.error('❌ Error al eliminar el doctor:', err);
    res.status(500).json({ success: false, message: 'Error al eliminar el doctor.' });
  }
});

// ===================== BUSCAR DOCTOR POR NOMBRE O APELLIDO =====================
router.post('/buscarNombre', async (req, res) => {
  const { nombre } = req.body;
  if (!nombre || nombre.length < 3) {
    return res.json({ success: false, message: 'Debes escribir al menos 3 letras.' });
  }
  try {
    const [results] = await db.query(`
      SELECT 
        id, nombres AS nombre, apellidos AS apellido, 
        (SELECT nombre FROM especialidad WHERE id = d.id_especialidad) AS especialidad
      FROM doctores d
      WHERE LOWER(nombres) LIKE ? OR LOWER(apellidos) LIKE ?
      LIMIT 10
    `, [`%${nombre.toLowerCase()}%`, `%${nombre.toLowerCase()}%`]);
    res.json({ success: true, doctores: results });
  } catch (err) {
    console.error('Error al buscar doctor por nombre:', err);
    res.status(500).json({ success: false, message: 'Error al buscar doctor.' });
  }
});

module.exports = router;
