const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// ===================== ÓRDENES ENTREGADAS (estado 8 y 9) =====================
router.get('/', async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT 
        o.id AS id_orden,
          p.cedula,
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
      WHERE o.id_estado IN (8, 9) AND oe.estado_examen = 'validado'
      ORDER BY o.fecha DESC, o.hora DESC
    `);

    res.json({ success: true, archivos: result });
  } catch (err) {
    console.error('❌ Error al obtener archivos:', err);
    res.status(500).json({ success: false, message: 'Error al obtener los archivos' });
  }
});

// ===================== RESULTADOS VALIDADOS DE UN EXAMEN =====================
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
    console.error('❌ Error al obtener resultados archivados:', err);
    res.status(500).json({ success: false, message: 'Error al obtener los resultados del archivo' });
  }
});

module.exports = router;
