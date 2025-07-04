const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// Buscar exámenes por nombre o código para el cotizador
router.post('/search', async (req, res) => {
  const { busqueda } = req.body;

  if (!busqueda) {
    return res.status(400).json({ success: false, message: 'Debe proporcionar un término de búsqueda.' });
  }

  const query = `
    SELECT 
      e.id, 
      e.nombre, 
      a.nombre AS area, 
      e.precio,
      e.codigo,
      e.indicaciones
    FROM examenes e
    LEFT JOIN area a ON e.id_area = a.id
    WHERE e.nombre LIKE ? OR e.codigo LIKE ?
  `;

  const params = [`%${busqueda}%`, `%${busqueda}%`];

  try {
    const [rows] = await db.query(query, params);
    res.json({ success: true, examenes: rows });
  } catch (err) {
    console.error('❌ Error al buscar exámenes en cotizador:', err);
    res.status(500).json({ success: false, message: 'Error al buscar exámenes.' });
  }
});


module.exports = router;
