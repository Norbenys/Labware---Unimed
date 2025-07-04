const express = require('express');
const router = express.Router();
const db = require('../database/connection'); // Conexión con promesas

// ===================== OBTENER TODOS LOS PACIENTES =====================
router.get('/patients', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        p.id, 
        p.cedula,
        p.nombres, 
        p.apellidos, 
        s.descripcion AS sexo,
        p.edad
      FROM pacientes p
      LEFT JOIN sexo s ON p.id_sexo = s.id
    `);
    res.json({ success: true, patients: results });
  } catch (err) {
    console.error('❌ Error al obtener los pacientes:', err);
    res.status(500).json({ success: false, message: 'Error al obtener los pacientes' });
  }
});

// ===================== OBTENER LISTA DE SEXOS =====================
router.get('/sexos', async (req, res) => {
  try {
    const [results] = await db.query('SELECT id, descripcion FROM sexo');
    res.json({ success: true, sexos: results });
  } catch (err) {
    console.error('❌ Error al obtener los sexos:', err);
    res.status(500).json({ success: false, message: 'Error al obtener los sexos' });
  }
});

// ===================== AGREGAR NUEVO PACIENTE =====================
router.post('/addPatient', async (req, res) => {
  const {
    cedula,
    nombres,
    apellidos,
    fecha_nacimiento,
    telefono,
    correo,
    id_sexo,
    diagnostico
  } = req.body;

  try {
    // Calcular edad
    const nacimiento = new Date(fecha_nacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;

    // Guardar paciente y obtener ID
    const [result] = await db.query(`
      INSERT INTO pacientes 
      (cedula, nombres, apellidos, fecha_nacimiento, telefono, correo, id_sexo, diagnostico, edad)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cedula, nombres, apellidos, fecha_nacimiento,
      telefono, correo, id_sexo, diagnostico, edad
    ]);

    // ✅ Devolver ID insertado
    res.json({ success: true, message: 'Paciente agregado exitosamente.', id_paciente: result.insertId });

  } catch (err) {
    console.error('❌ Error al insertar el paciente:', err);
    res.status(500).json({ success: false, message: 'Error al agregar el paciente.' });
  }
});

// ===================== OBTENER UN PACIENTE POR ID =====================
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT 
        p.id, p.cedula, p.nombres, p.apellidos,
        p.fecha_nacimiento, p.telefono, p.correo,
        p.id_sexo, s.descripcion AS sexo, p.diagnostico, p.edad
      FROM pacientes p
      LEFT JOIN sexo s ON p.id_sexo = s.id
      WHERE p.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }

    res.json({ success: true, paciente: rows[0] });
  } catch (err) {
    console.error('❌ Error al obtener el paciente:', err);
    res.status(500).json({ success: false, message: 'Error al obtener el paciente.' });
  }
});

// ===================== ACTUALIZAR PACIENTE =====================
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const {
    cedula,
    nombres,
    apellidos,
    fecha_nacimiento,
    telefono,
    correo,
    id_sexo,
    diagnostico
  } = req.body;

  try {
    const nacimiento = new Date(fecha_nacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;

    await db.query(`
      UPDATE pacientes SET
        cedula = ?, nombres = ?, apellidos = ?,
        fecha_nacimiento = ?, telefono = ?, correo = ?,
        id_sexo = ?, diagnostico = ?, edad = ?
      WHERE id = ?
    `, [
      cedula, nombres, apellidos, fecha_nacimiento,
      telefono, correo, id_sexo, diagnostico, edad, id
    ]);

    res.json({ success: true, message: 'Paciente actualizado correctamente.' });
  } catch (err) {
    console.error('❌ Error al actualizar el paciente:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar el paciente.' });
  }
});

// ===================== ELIMINAR PACIENTE =====================
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM pacientes WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'El paciente no existe o ya fue eliminado.' });
    }

    res.json({ success: true, message: 'Paciente eliminado correctamente.' });
  } catch (err) {
    console.error('❌ Error al eliminar el paciente:', err);
    res.status(500).json({ success: false, message: 'Error al eliminar el paciente.' });
  }
});

// ===================== BUSCAR PACIENTE POR CÉDULA =====================
router.post('/buscarCedula', async (req, res) => {
  const { cedula } = req.body;
  if (!cedula) {
    return res.status(400).json({ success: false, message: 'Cédula no enviada.' });
  }

  try {
    const [result] = await db.query(`
      SELECT id, cedula, nombres, apellidos, fecha_nacimiento, 
             telefono, correo, id_sexo AS sexo, diagnostico
      FROM pacientes
      WHERE cedula = ?
    `, [cedula]);

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado.' });
    }

    res.json({ success: true, paciente: result[0] });
  } catch (err) {
    console.error('❌ Error al buscar paciente:', err);
    res.status(500).json({ success: false, message: 'Error en servidor.' });
  }
});

// ===================== BUSCAR PACIENTE POR FECHA =====================
router.post('/buscarPorFecha', async (req, res) => {
  const { fecha_nacimiento } = req.body;

  if (!fecha_nacimiento) {
    return res.status(400).json({ success: false, message: 'Fecha no enviada.' });
  }

  try {
    const [result] = await db.query(`
      SELECT p.id, p.cedula, p.nombres, p.apellidos, p.fecha_nacimiento, 
             p.telefono, p.correo, p.id_sexo AS sexo, s.descripcion AS sexo_descripcion, p.diagnostico
      FROM pacientes p
      LEFT JOIN sexo s ON p.id_sexo = s.id
      WHERE p.fecha_nacimiento = ?
    `, [fecha_nacimiento]);

    res.json({ success: true, pacientes: result });
  } catch (err) {
    console.error('❌ Error al buscar pacientes por fecha:', err);
    res.status(500).json({ success: false, message: 'Error en servidor.' });
  }
});

module.exports = router;
