const { OAuth2Client } = require('google-auth-library');
const {alumnoController, findAlumnoByEmail, createAlumno} = require('./alumnoController');
const {profesorController, findProfesorByEmail, createProfesor} = require('./profesorController');
const { v4: uuidv4 } = require('uuid');

function generadorUUIDBLE() {
  return uuidv4();
}

const CLIENT_ID = '220139447482-166cfpegh696qpitae14epcv96qplh0r.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

const jwt = require('jsonwebtoken');
const alumno = require('../models/alumno');
const JWT_SECRET = 'tu_super_secreto';

const googleSignInController = {
  async signIn (req, res) {
    const { token, cargo } = req.body;
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const email = payload['email'];
      const domain = email.split('@')[1];

      // Opcional: Verificación del dominio del correo
      // if (domain !== 'zaragoza.salesianos.edu') {
      //   return res.status(401).json({ error: 'Dominio del correo no permitido.' });
      // }

      let userId = null; // Inicializamos userId a null para usar más adelante

      if (cargo === 'alumno') {
        const existingAlumno = await findAlumnoByEmail(email);
        if (!existingAlumno) {
          const uuidBLE = generadorUUIDBLE();
          const alumnoData = {
            nombreCompleto: payload['name'],
            correo: payload['email'],
            uuidBLE: uuidBLE,
          };
          const newAlumno = await createAlumno(alumnoData);
          userId = newAlumno.id;
        } else {
          console.log("Ya existe este usuario");
          userId = existingAlumno.id;
        }
      } else if (cargo === 'profesor') {
        const existingProfesor = await findProfesorByEmail(email);
        if (!existingProfesor) {
          const profesorData = {
            nombreCompleto: payload['name'],
            correo: payload['email'],
          };
          const newProfesor = await createProfesor(profesorData);
          userId = newProfesor.id;
        } else {
          console.log("Ya existe este usuario");
          userId = existingProfesor.id;
        }
      }

      // Generas y envías el JWT
      const userJWT = jwt.sign({
        email: email,
        name: payload['name'],
        userId: userId,
        role: cargo
      }, JWT_SECRET);

      res.json({ token: userJWT });
    } catch (error) {
      console.log(error + ' Error verificando el token de Google.');
      res.status(400).json({ error: 'Error verificando el token de Google.' });
    }
  }
};

module.exports = googleSignInController;
