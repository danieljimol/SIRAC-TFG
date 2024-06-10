TZ = 'Europe/Madrid';

const express = require('express');
const asignaturaRoutes = require('./routes/asignaturaRoutes');
const alumnoRoutes = require('./routes/alumnoRoutes');
const googleRoutes = require('./routes/googleSignIn');
const horarioRoutes = require('./routes/horarioRoutes');
const asistenciaRoutes = require('./routes/asistenciaRoutes');
const profesorRoutes = require('./routes/profesorRoutes');
const http = require('http');
const { io } = require('./socket');
const app = express();
const server = http.createServer(app);
const bodyParser = require('body-parser');
const configurarCronJobs = require('./controllers/cronJobConfiguration');
const authenticateToken = require('./middlewares/auth');

// Socket.io
// const io = new Server(server);

app.use(express.json());
app.use(bodyParser.json());

app.use('/signin', googleRoutes);

app.use(authenticateToken);

app.use('/asignaturas', asignaturaRoutes);
app.use('/alumnos', alumnoRoutes);
app.use('/horarios', horarioRoutes);
app.use('/asistencia', asistenciaRoutes);
app.use('/profesores', profesorRoutes);

io.attach(server); // Esto asocia Socket.IO con tu servidor HTTP

// Configuración para socket.io
io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado');

  socket.on('disconnect', () => {
    console.log('Un cliente se ha desconectado');
  });

  // Puedes definir más eventos aquí
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = { io };