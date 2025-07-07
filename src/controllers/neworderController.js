const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// =============================
//  CREAR ORDEN
// =============================

router.post('/addOrder', async (req, res) => {
  const { id_paciente, id_doctor } = req.body;

  if (!id_paciente) {
    return res.status(400).json({ success: false, message: 'ID de paciente requerido' });
  }

  try {
    const [result] = await db.query(`
      INSERT INTO ordenes (id_paciente, fecha, hora, id_estado, id_doctor)
      VALUES (?, CURDATE(), CURTIME(), ?, ?)
    `, [id_paciente, 1, (id_doctor && id_doctor !== 'null') ? id_doctor : null]);

    console.log("✅ Orden insertada con ID:", result.insertId);

    res.json({ success: true, id_orden: result.insertId });

  } catch (error) {
    console.error('❌ Error al crear la orden:', error.sqlMessage || error.message);
    res.status(500).json({ success: false, message: 'Error al crear la orden.' });
  }
});


// ===================== ✅ Asociar exámenes a la orden =====================
router.post('/addExamenes', async (req, res) => {
  const { id_orden, examenes } = req.body;

  console.log('📥 Recibido en /addExamenes:');
  console.log('🧾 ID Orden:', id_orden);
  console.log('📋 Exámenes:', examenes);

  if (!id_orden || !Array.isArray(examenes) || examenes.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Debes enviar el ID de la orden y al menos un examen.'
    });
  }

  try {
    for (let id_examen of examenes) {
      console.log('💾 Insertando examen ID:', id_examen);
      const [result] = await db.query(
        'INSERT INTO orden_examen (id_orden, id_examen) VALUES (?, ?)',
        [id_orden, id_examen]
      );
      console.log('✔️ Insertado:', result);
    }

    res.json({ success: true, message: 'Exámenes asociados correctamente a la orden.' });
  } catch (error) {
    console.error('❌ Error al asociar exámenes:', error.sqlMessage || error.message);
    res.status(500).json({
      success: false,
      message: 'Error al asociar los exámenes a la orden.'
    });
  }
});


module.exports = router;
