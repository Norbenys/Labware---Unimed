const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// ===================== OBTENER EXÁMENES REPORTADOS DE ÓRDENES EN ESTADO 5 =====================
router.get('/', async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT 
        o.id AS id_orden,
        p.nombres,
        p.apellidos,
        o.fecha,
        o.hora,
        e.nombre AS examen,
        oe.id AS id_orden_examen
      FROM ordenes o
      JOIN pacientes p ON o.id_paciente = p.id
      JOIN orden_examen oe ON o.id = oe.id_orden
      JOIN examenes e ON oe.id_examen = e.id
      WHERE o.id_estado = 5 AND oe.estado_examen = 'reportado'
      ORDER BY o.fecha DESC, o.hora DESC
    `);

    res.json({ success: true, validados: result });
  } catch (err) {
    console.error('❌ Error al obtener los validados:', err);
    res.status(500).json({ success: false, message: 'Error al obtener los validados' });
  }
});

// ===================== RESULTADOS DE UNA ORDEN EXAMEN =====================
router.get('/resultados/:id_orden_examen', async (req, res) => {
  const { id_orden_examen } = req.params;
  try {
    const [resultados] = await db.query(`
      SELECT 
        r.valor,
        r.observacion,
        p.nombre AS nombre_parametro,
        p.unidad_medida,
        rf.general_min,
        rf.general_max
      FROM resultados r
      JOIN parametros p ON r.id_parametro = p.id
      JOIN referencias rf ON p.id_referencia = rf.id
      WHERE r.id_orden_examen = ?
    `, [id_orden_examen]);

    res.json({ success: true, resultados });

  } catch (err) {
    console.error('❌ Error al obtener resultados validados:', err);
    res.status(500).json({ success: false, message: 'Error al obtener resultados' });
  }
});

// ===================== VALIDAR EXAMEN INDIVIDUAL =====================
router.put('/validar/:id', async (req, res) => {
  const { id } = req.params;

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Validar el examen individual
    await connection.query(`UPDATE orden_examen SET estado_examen = 'validado' WHERE id = ?`, [id]);

    // 2. Obtener la orden asociada
    const [[ordenData]] = await connection.query(`SELECT id_orden FROM orden_examen WHERE id = ?`, [id]);
    const id_orden = ordenData?.id_orden;

    if (!id_orden) throw new Error('Orden no encontrada');

    // 3. Verificar si todos los exámenes de esa orden están validados
    const [[pendientes]] = await connection.query(`
      SELECT COUNT(*) AS pendientes FROM orden_examen
      WHERE id_orden = ? AND estado_examen != 'validado'
    `, [id_orden]);

    if (pendientes.pendientes === 0) {
      await connection.query(`UPDATE ordenes SET id_estado = 7 WHERE id = ?`, [id_orden]);
    }

    await connection.commit();
    connection.release();
    res.json({ success: true, message: 'Examen validado correctamente' });

  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('❌ Error al validar examen:', err);
    res.status(500).json({ success: false, message: 'Error al validar el examen' });
  }
});

// ===================== DEVOLVER EXAMEN A ANÁLISIS =====================
router.put('/devolver/:id', async (req, res) => {
  const { id } = req.params; // este es el id_orden_examen

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Eliminar resultados previos de ese examen
    await connection.query(`DELETE FROM resultados WHERE id_orden_examen = ?`, [id]);

    // 2. Cambiar estado del examen a análisis (3)
    await connection.query(`UPDATE orden_examen SET estado_examen = 3 WHERE id = ?`, [id]);

    // 3. Obtener la orden asociada
    const [[ordenData]] = await connection.query(
      `SELECT id_orden FROM orden_examen WHERE id = ?`,
      [id]
    );

    const id_orden = ordenData?.id_orden;
    if (!id_orden) throw new Error('Orden no encontrada');

    // 4. Cambiar estado de la orden a análisis (3)
    await connection.query(
      `UPDATE ordenes SET id_estado = 3 WHERE id = ?`,
      [id_orden]
    );

    await connection.commit();
    connection.release();
    res.json({ success: true, message: 'Examen devuelto a análisis y resultados eliminados.' });

  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('❌ Error al devolver examen:', err);
    res.status(500).json({ success: false, message: 'Error al devolver el examen' });
  }
});

module.exports = router;
