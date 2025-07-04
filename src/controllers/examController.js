const express = require('express');
const router = express.Router();
const db = require('../database/connection'); // Asegúrate que sea el cliente con promesas

// ===================== OBTENER TODOS LOS EXÁMENES =====================
router.get('/examenes', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        e.id, 
        e.nombre, 
        a.nombre AS area, 
        e.precio,
        e.codigo,
        e.indicaciones
      FROM 
        examenes e
      LEFT JOIN 
        area a ON e.id_area = a.id;
    `);

    res.json({ success: true, exams: results });
  } catch (err) {
    console.error('Error al obtener los exámenes:', err);
    res.status(500).json({ success: false, message: 'Error al obtener los exámenes.', error: err });
  }
});

// ===================== AGREGAR NUEVO EXAMEN =====================
router.post('/examen', async (req, res) => {
  try {
    const { nombre, id_area, precio, codigo, indicaciones } = req.body;
    await db.query(`
      INSERT INTO examenes (nombre, id_area, precio, codigo, indicaciones)
      VALUES (?, ?, ?, ?, ?)
    `, [nombre, id_area, precio, codigo, indicaciones]);

    res.json({ success: true, message: 'Examen agregado exitosamente' });
  } catch (err) {
    console.error('Error al insertar el examen:', err);
    res.status(500).json({ success: false, message: 'Error al agregar el examen' });
  }
});

// ===================== OBTENER ÁREAS =====================
router.get('/areas', async (req, res) => {
  try {
    const [results] = await db.query('SELECT id, nombre, prefijo FROM area');
    res.json({ success: true, areas: results });
  } catch (err) {
    console.error('Error al obtener las áreas:', err);
    res.status(500).json({ success: false, message: 'Error al obtener las áreas' });
  }
});

// ===================== OBTENER SIGUIENTE CÓDIGO GLOBAL =====================
router.get('/getNextCode', async (req, res) => {
  try {
    const [result] = await db.query('SELECT MAX(CAST(SUBSTRING(codigo, 3) AS UNSIGNED)) AS lastCode FROM examenes');
    const nextCode = result[0].lastCode ? `EX${(result[0].lastCode + 1).toString().padStart(3, '0')}` : 'EX001';
    res.json({ success: true, nextCode });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener el siguiente código', error: err });
  }
});

// ===================== OBTENER SIGUIENTE CÓDIGO POR ÁREA =====================
router.get('/codigo/:id_area', async (req, res) => {
  const { id_area } = req.params;

  try {
    // 1. Obtener el prefijo del área
    const [areaResult] = await db.query('SELECT prefijo FROM area WHERE id = ?', [id_area]);
    if (areaResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Área no encontrada' });
    }

    const prefijo = areaResult[0].prefijo;

    // 2. Obtener el último número para ese prefijo
    const [codigoResult] = await db.query(`
      SELECT MAX(CAST(SUBSTRING(codigo, ?) AS UNSIGNED)) AS ultimo
      FROM examenes
      WHERE codigo LIKE ?
    `, [prefijo.length + 1, `${prefijo}%`]);

    const siguienteNumero = (codigoResult[0].ultimo || 0) + 1;
    const siguienteCodigo = `${prefijo}${String(siguienteNumero).padStart(3, '0')}`;

    res.json({ success: true, codigo: siguienteCodigo });
  } catch (error) {
    console.error('Error al obtener el siguiente código por área:', error);
    res.status(500).json({ success: false, message: 'Error al generar el código' });
  }
});


router.post('/search', async (req, res) => {
  const { nombre, codigo } = req.body;

  if (!nombre && !codigo) {
    return res.status(400).json({ success: false, message: 'Debe proporcionar nombre o código para buscar.' });
  }

  let query = `
    SELECT 
      e.id, 
      e.nombre, 
      a.nombre AS area, 
      e.precio,
      e.codigo,
      e.indicaciones
    FROM examenes e
    LEFT JOIN area a ON e.id_area = a.id
    WHERE 1=1
  `;
  const params = [];

  if (nombre) {
    query += ' AND e.nombre LIKE ?';
    params.push(`%${nombre}%`);
  }

  if (codigo) {
    query += ' AND e.codigo LIKE ?';
    params.push(`%${codigo}%`);
  }

  try {
    const [rows] = await db.query(query, params);
    res.json({ success: true, examenes: rows });
  } catch (err) {
    console.error('❌ Error al buscar exámenes:', err);
    res.status(500).json({ success: false, message: 'Error al buscar exámenes.' });
  }
});



// ===================== ACTUALIZAR EXAMEN =====================
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    id_area,
    precio,
    codigo,
    indicaciones
  } = req.body;

  try {
    await db.query(`
      UPDATE examenes SET
        nombre = ?,
        id_area = ?,
        precio = ?,
        codigo = ?,
        indicaciones = ?
      WHERE id = ?
    `, [
      nombre,
      id_area,
      precio,
      codigo,
      indicaciones,
      id
    ]);

    res.json({ success: true, message: 'Examen actualizado correctamente.' });
  } catch (err) {
    console.error('Error al actualizar el examen:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar el examen.' });
  }
});

// ===================== OBTENER EXAMEN POR ID =====================
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT 
        e.id,
        e.nombre,
        e.precio,
        e.codigo,
        e.indicaciones,
        e.id_area,
        a.nombre AS area
      FROM examenes e
      JOIN area a ON e.id_area = a.id
      WHERE e.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Examen no encontrado' });
    }

    res.json({ success: true, examen: rows[0] });
  } catch (err) {
    console.error('❌ Error al obtener el examen:', err);
    res.status(500).json({ success: false, message: 'Error al obtener el examen.' });
  }
});


// ===================== ELIMINAR EXAMEN =====================
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM examenes WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Examen no encontrado o ya fue eliminado.' });
    }

    res.json({ success: true, message: 'Examen eliminado correctamente.' });
  } catch (err) {
    console.error('❌ Error al eliminar el examen:', err);
    res.status(500).json({ success: false, message: 'Error al eliminar el examen.' });
  }
});


module.exports = router;
