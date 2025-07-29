require('dotenv').config();
const mongoose = require('mongoose');

// ============= CONEXIÓN SIMPLE A MONGODB =============
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
        console.log(`📍 Base de datos: ${conn.connection.name}`);
        return conn;
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error.message);
        process.exit(1);
    }
};

// ============= EVENTOS DE CONEXIÓN =============
mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose conectado a MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('🚨 Error de conexión MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose desconectado');
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('👋 Conexión cerrada correctamente');
    process.exit(0);
});

module.exports = connectDB;