const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const multer = require('multer');
const path = require('path');

// ===================== MULTER: CONFIGURACIÓN PARA GUARDAR PDF =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/resultados'));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const nombre = file.originalname.replace('.pdf', '');
    cb(null, `${nombre}_${timestamp}.pdf`);
  }
});
const upload = multer({ storage });

// ===================== RUTA PARA SUBIR PDF Y RETORNAR LINK =====================
router.post('/upload', upload.single('archivo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No se subió ningún archivo.' });
  }

  const url = `${req.protocol}://${req.get('host')}/resultados/${req.file.filename}`;
  res.json({ success: true, url });
});

// ===================== OBTENER ÓRDENES LISTAS PARA REMISIÓN (completas) =====================
router.get('/', async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT 
        o.id AS id_orden,
        p.nombres,
        p.apellidos,
        o.fecha,
        o.hora
      FROM ordenes o
      JOIN pacientes p ON o.id_paciente = p.id
      WHERE o.id_estado = 7
      AND NOT EXISTS (
        SELECT 1 FROM orden_examen oe
        WHERE oe.id_orden = o.id AND oe.estado_examen != 'validado'
      )
      ORDER BY o.fecha DESC, o.hora DESC
    `);

    res.json({ success: true, remitidos: result });
  } catch (err) {
    console.error('❌ Error al obtener los remitidos:', err);
    res.status(500).json({ success: false, message: 'Error al obtener los remitidos' });
  }
});

// ===================== OBTENER DETALLE COMPLETO DE ORDEN =====================
router.get('/:id_orden', async (req, res) => {
  const { id_orden } = req.params;
  try {
    const [resultados] = await db.query(`
      SELECT 
        o.id AS id_orden,
        o.fecha,
        o.hora,
        p.nombres,
        p.apellidos,
        p.cedula,
        p.edad,
        p.correo,
        p.telefono,
        s.descripcion AS sexo,
        p.diagnostico,
        e.nombre AS examen,
        pa.nombre AS parametro,
        pa.codigo,
        pa.unidad_medida,
        r.valor,
        r.observacion,
        ref.general_min,
        ref.general_max,
        ref.tipo_resultado
      FROM ordenes o
      JOIN pacientes p ON o.id_paciente = p.id
      JOIN sexo s ON p.id_sexo = s.id
      JOIN orden_examen oe ON oe.id_orden = o.id
      JOIN examenes e ON e.id = oe.id_examen
      JOIN parametros pa ON pa.id_examen = e.id
      JOIN resultados r ON r.id_orden_examen = oe.id AND r.id_parametro = pa.id
      JOIN referencias ref ON pa.id_referencia = ref.id
      WHERE o.id_estado = 7 AND o.id = ?
    `, [id_orden]);

    res.json({ success: true, data: resultados });
  } catch (error) {
    console.error('❌ Error en remisión:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos de remisión' });
  }
});

// ===================== MARCAR ORDEN COMO ENTREGADA (estado 8) =====================
router.put('/entregar/:id_orden', async (req, res) => {
  const { id_orden } = req.params;
  try {
    const [update] = await db.query(
      `UPDATE ordenes SET id_estado = 8 WHERE id = ?`,
      [id_orden]
    );

    if (update.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada.' });
    }

    res.json({ success: true, message: 'Orden marcada como entregada.' });
  } catch (error) {
    console.error('❌ Error al marcar como entregada:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor.' });
  }
});

module.exports = router;
