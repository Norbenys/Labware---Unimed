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
  // Variables para cada estadística
  let ordenesPorEstado = [], ordenesHoy = [{total: 0}], ordenesPendientes = [{total: 0}], ordenesAnalisis = [{total: 0}], ordenesValidadas = [{total: 0}], ordenesRemitidas = [{total: 0}], ordenesEntregadas = [{total: 0}], examenesPopulares = [], ordenesUltimos7Dias = [];
  try {
    // Estadísticas de órdenes por estado
    try {
      console.log('Consultando órdenes por estado');
      [ordenesPorEstado] = await db.query(`
        SELECT 
          e.nombre AS estado,
          COUNT(o.id) AS cantidad
        FROM estado e
        LEFT JOIN ordenes o ON e.id = o.id_estado
        GROUP BY e.id, e.nombre
        ORDER BY e.id
      `);
    } catch (err) {
      console.error('❌ Error en ordenesPorEstado:', err);
    }
    // Órdenes Hoy (solo estado 1 y 2)
    try {
      console.log('Consultando órdenes hoy (estado 1 y 2)');
      [ordenesHoy] = await db.query(`
        SELECT COUNT(*) AS total
        FROM ordenes 
        WHERE id_estado IN (1, 2)
      `);
    } catch (err) {
      console.error('❌ Error en ordenesHoy:', err);
    }
    // Órdenes pendientes (estado < 3)
    try {
      console.log('Consultando órdenes pendientes');
      [ordenesPendientes] = await db.query(`
        SELECT COUNT(*) AS total
        FROM ordenes 
        WHERE id_estado < 3
      `);
    } catch (err) {
      console.error('❌ Error en ordenesPendientes:', err);
    }
    // Órdenes en análisis (estado 3)
    try {
      console.log('Consultando órdenes en análisis');
      [ordenesAnalisis] = await db.query(`
        SELECT COUNT(*) AS total
        FROM ordenes 
        WHERE id_estado = 3
      `);
    } catch (err) {
      console.error('❌ Error en ordenesAnalisis:', err);
    }
    // Órdenes validadas (estado 7)
    try {
      console.log('Consultando órdenes validadas');
      [ordenesValidadas] = await db.query(`
        SELECT COUNT(*) AS total
        FROM ordenes 
        WHERE id_estado = 7
      `);
    } catch (err) {
      console.error('❌ Error en ordenesValidadas:', err);
    }
    // Órdenes remitidas (estado 7)
    try {
      console.log('Consultando órdenes remitidas');
      [ordenesRemitidas] = await db.query(`
        SELECT COUNT(*) AS total
        FROM ordenes 
        WHERE id_estado = 7
      `);
    } catch (err) {
      console.error('❌ Error en ordenesRemitidas:', err);
    }
    // Órdenes entregadas (estado 8)
    try {
      console.log('Consultando órdenes entregadas');
      [ordenesEntregadas] = await db.query(`
        SELECT COUNT(*) AS total
        FROM ordenes 
        WHERE id_estado = 8
      `);
    } catch (err) {
      console.error('❌ Error en ordenesEntregadas:', err);
    }
    // Exámenes más solicitados
    try {
      console.log('Consultando exámenes más solicitados');
      [examenesPopulares] = await db.query(`
        SELECT 
          e.codigo AS codigo,
          e.nombre AS examen,
          COUNT(oe.id) AS cantidad
        FROM examenes e
        JOIN orden_examen oe ON e.id = oe.id_examen
        GROUP BY e.id, e.codigo, e.nombre
        ORDER BY cantidad DESC
        LIMIT 5
      `);
    } catch (err) {
      console.error('❌ Error en examenesPopulares:', err);
    }
    // Órdenes de los últimos 7 días
    try {
      console.log('Consultando órdenes de los últimos 7 días');
      [ordenesUltimos7Dias] = await db.query(`
        SELECT 
          DATE(fecha) AS fecha,
          COUNT(*) AS cantidad
        FROM ordenes 
        WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(fecha)
        ORDER BY fecha
      `);
    } catch (err) {
      console.error('❌ Error en ordenesUltimos7Dias:', err);
    }
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
        ordenesUltimos7Dias
      }
    });
  } catch (err) {
    console.error('❌ Error general al obtener estadísticas del dashboard:', err);
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