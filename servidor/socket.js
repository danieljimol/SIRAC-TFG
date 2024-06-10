// socket.js
const { Server } = require("socket.io");
const io = new Server(); // No inicialices con el servidor aquí

module.exports = { io };
