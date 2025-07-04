const mysql = require('mysql2/promise'); // Usamos la versión con soporte a async/await

// Pool de conexiones a la base de datos
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bdd_labware_unimed',
  port: 3306
});

module.exports = db;
