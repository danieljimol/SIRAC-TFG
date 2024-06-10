process.env.TZ = 'Europe/Madrid';

// Muestra la fecha y hora actuales
console.log("Fecha y hora actuales:", new Date().toString());

// Muestra la fecha y hora actuales en UTC
console.log("Fecha y hora actuales en UTC:", new Date());

// Muestra la zona horaria configurada en el entorno
console.log("Zona horaria configurada (TZ):", process.env.TZ || "No especificada (usa la zona horaria del sistema)");
