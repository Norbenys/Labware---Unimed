const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// ===================== OBTENER EXÁMENES PENDIENTES DE ANÁLISIS =====================
router.get('/', async (req, res) => {
  try {
    const [result] = await db.query(`
     SELECT 
  o.id AS id_orden,
  CONCAT(p.nombres, ' ', p.apellidos) AS paciente,
  o.fecha,
  o.hora,
  e.nombre AS examen,
  oe.id AS id_orden_examen
FROM ordenes o
JOIN pacientes p ON o.id_paciente = p.id
JOIN orden_examen oe ON o.id = oe.id_orden
JOIN examenes e ON oe.id_examen = e.id
WHERE o.id_estado = 3 AND oe.estado_examen = 3
ORDER BY o.fecha DESC, o.hora DESC

    `);

    res.json({ success: true, reportes: result });
  } catch (err) {
    console.error('❌ Error al obtener los reportes:', err);
    res.status(500).json({ success: false, message: 'Error al obtener los reportes' });
  }
});

// ===================== OBTENER PARÁMETROS DE UN EXAMEN ESPECÍFICO =====================
router.get('/parametros/:id_orden_examen', async (req, res) => {
  const { id_orden_examen } = req.params;

  try {
    const [cabecera] = await db.query(`
      SELECT oe.id AS id_orden_examen, e.id AS id_examen, e.nombre AS nombre_examen
      FROM orden_examen oe
      JOIN examenes e ON oe.id_examen = e.id
      WHERE oe.id = ?
    `, [id_orden_examen]);

    if (!cabecera.length) {
      return res.status(404).json({ success: false, message: 'Examen no encontrado' });
    }

    const examen = cabecera[0];

    const [parametros] = await db.query(`
      SELECT 
        p.id AS id_parametro,
        p.nombre AS nombre_parametro,
        p.codigo,
        p.unidad_medida,
        r.general_min,
        r.general_max,
        r.mujeres_min,
        r.mujeres_max,
        r.hombres_min,
        r.hombres_max,
        r.ninos_min,
        r.ninos_max,
        r.neonatos_min,
        r.neonatos_max,
        r.tipo_resultado
      FROM parametros p
      JOIN referencias r ON p.id_referencia = r.id
      WHERE p.id_examen = ?
    `, [examen.id_examen]);

    res.json({
      success: true,
      examen: examen.nombre_examen,
      id_orden_examen: examen.id_orden_examen,
      parametros
    });

  } catch (err) {
    console.error('❌ Error al obtener parámetros del examen:', err);
    res.status(500).json({ success: false, message: 'Error al obtener los parámetros' });
  }
});

// ===================== GUARDAR RESULTADOS INDIVIDUALES =====================
router.post('/guardarResultados', async (req, res) => {
  const { resultados } = req.body;

  if (!Array.isArray(resultados) || resultados.length === 0) {
    return res.status(400).json({ success: false, message: 'No se recibieron resultados' });
  }

  const insertQuery = `
    INSERT INTO resultados (id_orden_examen, id_parametro, valor, observacion)
    VALUES (?, ?, ?, ?)
  `;

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const id_orden_examen = resultados[0].id_orden_examen;

    // Insertar resultados
    for (const r of resultados) {
      await connection.query(insertQuery, [
        r.id_orden_examen,
        r.id_parametro,
        r.valor,
        r.observacion || null
      ]);
    }

    // Obtener el ID de la orden asociada
    const [[ordenData]] = await connection.query(
      `SELECT id_orden FROM orden_examen WHERE id = ? LIMIT 1`,
      [id_orden_examen]
    );

    const id_orden = ordenData?.id_orden;
    if (!id_orden) throw new Error('Orden no encontrada');

    // Cambiar estado del examen individual a 'reportado'
    await connection.query(
      `UPDATE orden_examen SET estado_examen = 'reportado' WHERE id = ?`,
      [id_orden_examen]
    );

    // Verificar si todos los exámenes de la orden están reportados
    const [[pendientes]] = await connection.query(
      `SELECT COUNT(*) AS pendientes FROM orden_examen 
       WHERE id_orden = ? AND estado_examen != 'reportado'`,
      [id_orden]
    );

    if (pendientes.pendientes === 0) {
      // Si todos fueron reportados, actualizar orden a estado 5 (pendiente de validación)
      await connection.query(
        `UPDATE ordenes SET id_estado = 5 WHERE id = ?`,
        [id_orden]
      );
    }

    await connection.commit();
    connection.release();
    res.json({ success: true });

  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('❌ Error al guardar resultados:', err);
    res.status(500).json({ success: false, message: 'Error al guardar resultados' });
  }
});


module.exports = router;
