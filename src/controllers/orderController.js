const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// ===================== OBTENER ÓRDENES =====================
router.post('/', async (req, res) => {
  try {
    const [results] = await db.query(`
    SELECT 
  o.id AS id_orden,
  CONCAT(p.nombres, ' ', p.apellidos) AS paciente,
  o.fecha,
  o.hora,
  e.nombre AS estado
FROM ordenes o
LEFT JOIN pacientes p ON o.id_paciente = p.id
LEFT JOIN estado e ON o.id_estado = e.id
WHERE o.id_estado < 3
ORDER BY o.id DESC;

    `);

    res.json({ success: true, ordenes: results });
  } catch (err) {
    console.error('Error al obtener órdenes:', err);
    res.status(500).json({ success: false, message: 'Error al obtener las órdenes.' });
  }
});

// ===================== OBTENER ESTADOS (solo hasta 3) =====================
router.get('/estados', async (req, res) => {
  try {
    const [results] = await db.query('SELECT id, nombre FROM estado WHERE id <= 3');
    res.json({ success: true, estados: results });
  } catch (err) {
    console.error('Error al obtener los estados:', err);
    res.status(500).json({ success: false, message: 'Error al obtener los estados.' });
  }
});


// =================== Obtener una orden por ID ===================
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(`
      SELECT 
        o.id AS id_orden,
        CONCAT(p.nombres, ' ', p.apellidos) AS paciente,
        o.fecha,
        o.hora,
        e.nombre AS estado
      FROM ordenes o
      LEFT JOIN pacientes p ON o.id_paciente = p.id
      LEFT JOIN estado e ON o.id_estado = e.id
      WHERE o.id = ?
    `, [id]);

    if (result.length === 0) {
      return res.json({ success: false, message: 'Orden no encontrada.' });
    }

    res.json({ success: true, orden: result[0] });
  } catch (error) {
    console.error('Error al obtener la orden por ID:', error);
    res.status(500).json({ success: false, message: 'Error al obtener la orden.' });
  }
});

// ===================== ACTUALIZAR ESTADO DE ORDEN =====================
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body; // debe venir el nombre del estado

  try {
    // Buscar ID del estado por su nombre
    const [estadoRes] = await db.query('SELECT id FROM estado WHERE nombre = ?', [estado]);

    if (estadoRes.length === 0) {
      return res.status(400).json({ success: false, message: 'Estado no válido.' });
    }

    const id_estado = estadoRes[0].id;

    // Actualizar orden
    await db.query('UPDATE ordenes SET id_estado = ? WHERE id = ?', [id_estado, id]);

    // Si el nuevo estado es 3 (Análisis), actualizar todos los exámenes asociados
    if (id_estado === 3) {
      await db.query('UPDATE orden_examen SET estado_examen = 3 WHERE id_orden = ?', [id]);
    }

    res.json({ success: true, message: 'Orden actualizada correctamente.' });
  } catch (err) {
    console.error('Error al actualizar la orden:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar la orden.' });
  }
});

// ===================== ELIMINAR ORDEN Y EXÁMENES ASOCIADOS =====================
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Paso 1: Eliminar exámenes asociados a la orden
    await db.query('DELETE FROM orden_examen WHERE id_orden = ?', [id]);

    // Paso 2: Eliminar la orden
    const [result] = await db.query('DELETE FROM ordenes WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'La orden no existe o ya fue eliminada.' });
    }

    res.json({ success: true, message: 'Orden eliminada correctamente.' });
  } catch (err) {
    console.error('❌ Error al eliminar la orden:', err);
    res.status(500).json({ success: false, message: 'Error al eliminar la orden.' });
  }
});



module.exports = router;
