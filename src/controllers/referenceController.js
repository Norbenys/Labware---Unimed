const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// ===================== AGREGAR NUEVA REFERENCIA =====================
router.post('/', async (req, res) => {
  const {
    generalMin,
    generalMax,
    mujeresMin,
    mujeresMax,
    hombresMin,
    hombresMax,
    ninosMin,
    ninosMax,
    neonatosMin,
    neonatosMax
  } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO referencias (
        general_min, general_max,
        mujeres_min, mujeres_max,
        hombres_min, hombres_max,
        ninos_min, ninos_max,
        neonatos_min, neonatos_max
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      generalMin, generalMax,
      mujeresMin, mujeresMax,
      hombresMin, hombresMax,
      ninosMin, ninosMax,
      neonatosMin, neonatosMax
    ]);

    res.status(201).json({
      success: true,
      message: '✅ Referencia creada correctamente',
      idReferencia: result.insertId
    });
  } catch (err) {
    console.error('❌ Error al crear referencia:', err);
    res.status(500).json({
      success: false,
      message: '❌ Error al crear referencia'
    });
  }
});

module.exports = router;
