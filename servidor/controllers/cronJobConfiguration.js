const cron = require('node-cron');
const { Horario } = require('../models');
const { registrarAusencias } = require('./asistenciaController');

async function configurarCronJobs() {
  try {
    // Obtener todos los horarios de las clases
    const horarios = await Horario.findAll();

    horarios.forEach(horario => {
      // Convertir horaFin (e.g., '19:30:00') a cron format ('29 19 * * 1-5')
      let [hora, minuto] = horario.horaFin.split(':');

      // Asegurarse de que el minuto es válido
      let minutoCron = parseInt(minuto) - 1;
      if (minutoCron < 0) {
        minutoCron = 59;
        hora = parseInt(hora) - 1;
      }
      
      // Determinar el día de la semana para cron (cron usa 0-6 para Dom-Sab)
      const diasCron = {
        'lunes': '1',
        'martes': '2',
        'miércoles': '3',
        'jueves': '4',
        'viernes': '5',
        'sábado': '6',
        'domingo': '0'
      };

      const diaDeLaSemanaCron = diasCron[horario.diaDeLaSemana];

      // Crear el cron job
      cron.schedule(`${minutoCron} ${hora} * * ${diaDeLaSemanaCron}`, () => {
        console.log(`Registrando ausencias para la clase de ${horario.asignaturaId} el ${horario.diaDeLaSemana} a las ${horario.horaFin}`);
        registrarAusencias(horario.asignaturaId, new Date());
      }, {
        scheduled: true,
        timezone: "Europe/Madrid"  // Asegúrate de establecer la zona horaria correcta
      });
    });
  } catch (error) {
    console.error('Error configurando cron jobs:', error);
  }
}

// Llamar a la función al iniciar la aplicación
configurarCronJobs();
