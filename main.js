const { app: electronApp, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const server = express();
const port = 3000;

// ===================== MIDDLEWARES =====================
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

// ===================== IMPORTAR CONTROLADORES =====================
const loginRoutes = require('./src/controllers/loginController');
const doctorRoutes = require('./src/controllers/doctorController');
const patientRoutes = require('./src/controllers/patientController');
const examRoutes = require('./src/controllers/examController');
const orderRoutes = require('./src/controllers/orderController');
const newOrderRoutes = require('./src/controllers/neworderController');
const parameterRoutes = require('./src/controllers/parameterController');
const reportRoutes = require('./src/controllers/reportController');
const validatedRoutes = require('./src/controllers/validatedController');
const userRoutes = require('./src/controllers/userController');
const referenceRoutes = require('./src/controllers/referenceController');
const remissionRoutes = require('./src/controllers/remissionController');
const archiveRoutes = require('./src/controllers/archiveController');
const quoterRoutes = require('./src/controllers/quoterController');
const dashboardRoutes = require('./src/controllers/dashboardController');

// ===================== MONTAR RUTAS BACKEND =====================
server.use('/', loginRoutes); // POST /login
server.use('/api/doctores', doctorRoutes);
server.use('/api/pacientes', patientRoutes);
server.use('/api/examenes', examRoutes);
server.use('/api/ordenes', orderRoutes);
server.use('/api/validados', validatedRoutes);
server.use('/api/nueva-orden', newOrderRoutes);
server.use('/api/parametros', parameterRoutes);
server.use('/api/reportes', reportRoutes);
server.use('/api/usuarios', userRoutes);
server.use('/api/referencias', referenceRoutes);
server.use('/api/remision', remissionRoutes); // ✅ Remisión con subida de PDF
server.use('/api/archivos', archiveRoutes);
server.use('/api/cotizador', quoterRoutes);
server.use('/api/dashboard', dashboardRoutes);

// ===================== SERVIR ARCHIVOS ESTÁTICOS =====================
server.use('/assets', express.static(path.join(__dirname, 'src/assets')));
server.use('/js', express.static(path.join(__dirname, 'src/js')));
server.use('/example', express.static(path.join(__dirname, 'src/views/example'))); // Plantillas de referencia
server.use(express.static(path.join(__dirname, 'src/views'))); // Vistas reales
server.use('/resultados', express.static(path.join(__dirname, 'public/resultados'))); // PDFs remitidos

// ===================== CREAR VENTANA ELECTRON =====================
function createWindow() {
  console.log('⏳ Iniciando servidor Express...');

  server.listen(port, () => {
    console.log(`✅ Servidor backend corriendo en http://localhost:${port}`);

    const win = new BrowserWindow({
      width: 1280,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    // Configurar Content Security Policy
    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://kit.fontawesome.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://code.jquery.com https://buttons.github.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; img-src 'self' data: blob:; font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com; connect-src 'self' http://localhost:*;"
          ]
        }
      });
    });
  

    // Cargar vista de login
    win.loadURL(`http://localhost:${port}/login.html`);
  });
}

// ===================== LANZAR APP =====================
electronApp.whenReady().then(createWindow);

electronApp.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    electronApp.quit();
  }
});

