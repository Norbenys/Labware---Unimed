const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// ===================== ENDPOINT DE PRUEBA =====================
router.get('/test', (req, res) => {
  console.log('🔍 Dashboard test endpoint llamado');
  res.json({ success: true, message: 'Dashboard controller funcionando' });
});

// ===================== ESTADÍSTICAS GENERALES DEL DASHBOARD =====================
router.get('/stats', async (req, res) => {
  console.log('🔍 Dashboard stats endpoint llamado');
  try {
    // Estadísticas de órdenes por estado
    const [ordenesPorEstado] = await db.query(`
      SELECT 
        e.nombre AS estado,
        COUNT(o.id) AS cantidad
      FROM estado e
      LEFT JOIN ordenes o ON e.id = o.id_estado
      GROUP BY e.id, e.nombre
      ORDER BY e.id
    `);

    // Órdenes de hoy
    const [ordenesHoy] = await db.query(`
      SELECT COUNT(*) AS total
      FROM ordenes 
      WHERE DATE(fecha) = CURDATE()
    `);

    // Órdenes pendientes (estado < 3)
    const [ordenesPendientes] = await db.query(`
      SELECT COUNT(*) AS total
      FROM ordenes 
      WHERE id_estado < 3
    `);

    // Órdenes en análisis (estado 3)
    const [ordenesAnalisis] = await db.query(`
      SELECT COUNT(*) AS total
      FROM ordenes 
      WHERE id_estado = 3
    `);

    // Órdenes validadas (estado 5)
    const [ordenesValidadas] = await db.query(`
      SELECT COUNT(*) AS total
      FROM ordenes 
      WHERE id_estado = 5
    `);

    // Órdenes remitidas (estado 7)
    const [ordenesRemitidas] = await db.query(`
      SELECT COUNT(*) AS total
      FROM ordenes 
      WHERE id_estado = 7
    `);

    // Órdenes entregadas (estado 8 y 9)
    const [ordenesEntregadas] = await db.query(`
      SELECT COUNT(*) AS total
      FROM ordenes 
      WHERE id_estado IN (8, 9)
    `);

    // Exámenes más solicitados
    const [examenesPopulares] = await db.query(`
      SELECT 
        e.nombre AS examen,
        COUNT(oe.id) AS cantidad
      FROM examenes e
      JOIN orden_examen oe ON e.id = oe.id_examen
      GROUP BY e.id, e.nombre
      ORDER BY cantidad DESC
      LIMIT 5
    `);

    // Órdenes de los últimos 7 días
    const [ordenesUltimos7Dias] = await db.query(`
      SELECT 
        DATE(fecha) AS fecha,
        COUNT(*) AS cantidad
      FROM ordenes 
      WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(fecha)
      ORDER BY fecha
    `);

    // Pacientes nuevos este mes
    const [pacientesNuevos] = await db.query(`
      SELECT COUNT(*) AS total
      FROM pacientes 
      WHERE MONTH(fecha_registro) = MONTH(CURDATE()) 
      AND YEAR(fecha_registro) = YEAR(CURDATE())
    `);

    console.log('✅ Dashboard stats calculadas correctamente');

    res.json({
      success: true,
      stats: {
        ordenesPorEstado,
        ordenesHoy: ordenesHoy[0]?.total || 0,
        ordenesPendientes: ordenesPendientes[0]?.total || 0,
        ordenesAnalisis: ordenesAnalisis[0]?.total || 0,
        ordenesValidadas: ordenesValidadas[0]?.total || 0,
        ordenesRemitidas: ordenesRemitidas[0]?.total || 0,
        ordenesEntregadas: ordenesEntregadas[0]?.total || 0,
        examenesPopulares,
        ordenesUltimos7Dias,
        pacientesNuevos: pacientesNuevos[0]?.total || 0
      }
    });
  } catch (err) {
    console.error('❌ Error al obtener estadísticas del dashboard:', err);
    res.status(500).json({ success: false, message: 'Error al obtener las estadísticas' });
  }
});

// ===================== ÓRDENES RECIENTES =====================
router.get('/ordenes-recientes', async (req, res) => {
  console.log('🔍 Dashboard órdenes recientes endpoint llamado');
  try {
    const [ordenes] = await db.query(`
      SELECT 
        o.id AS id_orden,
        CONCAT(p.nombres, ' ', p.apellidos) AS paciente,
        o.fecha,
        o.hora,
        e.nombre AS estado
      FROM ordenes o
      JOIN pacientes p ON o.id_paciente = p.id
      JOIN estado e ON o.id_estado = e.id
      ORDER BY o.fecha DESC, o.hora DESC
      LIMIT 10
    `);

    console.log('✅ Órdenes recientes obtenidas:', ordenes.length);
    res.json({ success: true, ordenes });
  } catch (err) {
    console.error('❌ Error al obtener órdenes recientes:', err);
    res.status(500).json({ success: false, message: 'Error al obtener las órdenes recientes' });
  }
});

// ===================== EXÁMENES PENDIENTES =====================
router.get('/examenes-pendientes', async (req, res) => {
  console.log('🔍 Dashboard exámenes pendientes endpoint llamado');
  try {
    const [examenes] = await db.query(`
      SELECT 
        o.id AS id_orden,
        CONCAT(p.nombres, ' ', p.apellidos) AS paciente,
        e.nombre AS examen,
        o.fecha,
        oe.id AS id_orden_examen
      FROM ordenes o
      JOIN pacientes p ON o.id_paciente = p.id
      JOIN orden_examen oe ON o.id = oe.id_orden
      JOIN examenes e ON oe.id_examen = e.id
      WHERE o.id_estado = 3 AND oe.estado_examen = 3
      ORDER BY o.fecha ASC, o.hora ASC
      LIMIT 8
    `);

    console.log('✅ Exámenes pendientes obtenidos:', examenes.length);
    res.json({ success: true, examenes });
  } catch (err) {
    console.error('❌ Error al obtener exámenes pendientes:', err);
    res.status(500).json({ success: false, message: 'Error al obtener los exámenes pendientes' });
  }
});

module.exports = router; 