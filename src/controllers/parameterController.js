const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// ===================== OBTENER PARÁMETROS POR EXAMEN =====================
router.get('/:id_examen', async (req, res) => {
  const { id_examen } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.nombre, p.codigo, p.unidad_medida
      FROM parametros p
      WHERE p.id_examen = ?
    `, [id_examen]);

    res.json({ success: true, parametros: rows });
  } catch (err) {
    console.error('Error al obtener parámetros:', err);
    res.status(500).json({ success: false, message: 'Error al cargar parámetros.' });
  }
});

// Ruta: /api/parametros/add
router.post('/add', async (req, res) => {
  const db = require('../database/connection');
  const {
    nombre,
    codigo,
    unidad_medida,
    tipo_resultado,
    id_examen,
    referencias // Contiene todos los campos de la tabla 'referencias'
  } = req.body;

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // 1. Insertar referencia
    const [refResult] = await conn.query(`
      INSERT INTO referencias 
      (general_min, general_max, mujeres_min, mujeres_max, hombres_min, hombres_max,
       ninos_min, ninos_max, neonatos_min, neonatos_max, tipo_resultado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      referencias.general_min,
      referencias.general_max,
      referencias.mujeres_min,
      referencias.mujeres_max,
      referencias.hombres_min,
      referencias.hombres_max,
      referencias.ninos_min,
      referencias.ninos_max,
      referencias.neonatos_min,
      referencias.neonatos_max,
      tipo_resultado
    ]);

    const id_referencia = refResult.insertId;

    // 2. Insertar parámetro
    await conn.query(`
      INSERT INTO parametros (nombre, codigo, unidad_medida, id_examen, id_referencia)
      VALUES (?, ?, ?, ?, ?)
    `, [
      nombre,
      codigo,
      unidad_medida,
      id_examen,
      id_referencia
    ]);

    await conn.commit();
    res.status(200).json({ success: true, message: 'Parámetro registrado correctamente.' });
  } catch (err) {
    await conn.rollback();
    console.error('❌ Error al registrar el parámetro:', err);
    res.status(500).json({ success: false, message: 'Error al registrar el parámetro.' });
  } finally {
    conn.release();
  }
});

// ===================== OBTENER PARÁMETRO CON REFERENCIAS POR ID =====================
router.get('/parametro/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [parametros] = await db.query(`
      SELECT p.id, p.nombre, p.codigo, p.unidad_medida, p.id_examen, p.id_referencia, r.tipo_resultado,
             r.general_min, r.general_max, r.mujeres_min, r.mujeres_max,
             r.hombres_min, r.hombres_max, r.ninos_min, r.ninos_max,
             r.neonatos_min, r.neonatos_max
      FROM parametros p
      JOIN referencias r ON p.id_referencia = r.id
      WHERE p.id = ?
    `, [id]);

    if (parametros.length === 0) {
      return res.status(404).json({ success: false, message: 'Parámetro no encontrado' });
    }

    const p = parametros[0];

    const parametro = {
      id: p.id,
      nombre: p.nombre,
      codigo: p.codigo,
      unidad_medida: p.unidad_medida,
      id_examen: p.id_examen,
      tipo_resultado: p.tipo_resultado,
      referencia: {
        general_min: p.general_min,
        general_max: p.general_max,
        mujeres_min: p.mujeres_min,
        mujeres_max: p.mujeres_max,
        hombres_min: p.hombres_min,
        hombres_max: p.hombres_max,
        ninos_min: p.ninos_min,
        ninos_max: p.ninos_max,
        neonatos_min: p.neonatos_min,
        neonatos_max: p.neonatos_max
      }
    };

    res.json({ success: true, parametro });

  } catch (err) {
    console.error('❌ Error al obtener parámetro:', err);
    res.status(500).json({ success: false, message: 'Error al obtener el parámetro' });
  }
});



// ===================== ACTUALIZAR PARÁMETRO Y REFERENCIA =====================
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    codigo,
    unidad_medida,
    tipo_resultado,
    referencias
  } = req.body;

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // 1. Obtener ID de referencia asociado al parámetro
    const [paramResult] = await conn.query('SELECT id_referencia FROM parametros WHERE id = ?', [id]);
    if (paramResult.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Parámetro no encontrado.' });
    }

    const id_referencia = paramResult[0].id_referencia;

    // 2. Actualizar la tabla `parametros`
    await conn.query(`
      UPDATE parametros 
      SET nombre = ?, codigo = ?, unidad_medida = ?
      WHERE id = ?
    `, [nombre, codigo, unidad_medida, id]);

    // 3. Actualizar la tabla `referencias`
    await conn.query(`
      UPDATE referencias 
      SET 
        general_min = ?, general_max = ?, mujeres_min = ?, mujeres_max = ?, 
        hombres_min = ?, hombres_max = ?, ninos_min = ?, ninos_max = ?, 
        neonatos_min = ?, neonatos_max = ?, tipo_resultado = ?
      WHERE id = ?
    `, [
      referencias.general_min,
      referencias.general_max,
      referencias.mujeres_min,
      referencias.mujeres_max,
      referencias.hombres_min,
      referencias.hombres_max,
      referencias.ninos_min,
      referencias.ninos_max,
      referencias.neonatos_min,
      referencias.neonatos_max,
      tipo_resultado,
      id_referencia
    ]);

    await conn.commit();
    res.json({ success: true, message: 'Parámetro actualizado correctamente.' });

  } catch (err) {
    await conn.rollback();
    console.error('❌ Error al actualizar parámetro:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar el parámetro.' });
  } finally {
    conn.release();
  }
});

// ===================== ELIMINAR PARÁMETRO POR ID (y su referencia) =====================
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar el parámetro y su referencia
    const [parametro] = await db.query('SELECT id_referencia FROM parametros WHERE id = ?', [id]);

    if (parametro.length === 0) {
      return res.status(404).json({ success: false, message: 'El parámetro no existe o ya fue eliminado.' });
    }

    const idReferencia = parametro[0].id_referencia;

    // Eliminar el parámetro
    const [deleteResult] = await db.query('DELETE FROM parametros WHERE id = ?', [id]);

    if (deleteResult.affectedRows === 0) {
      return res.status(500).json({ success: false, message: 'No se pudo eliminar el parámetro.' });
    }

    // Eliminar la referencia asociada (si tiene)
    if (idReferencia) {
      await db.query('DELETE FROM referencias WHERE id = ?', [idReferencia]);
    }

    res.json({ success: true, message: 'Parámetro eliminado correctamente.' });
  } catch (err) {
    console.error('❌ Error al eliminar el parámetro:', err);
    res.status(500).json({ success: false, message: 'Error al eliminar el parámetro.' });
  }
});


module.exports = router;
