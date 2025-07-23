require('dotenv').config();
const mongoose = require('mongoose');

class DatabaseConnection {
    constructor() {
        this.isConnected = false;
    }

    async connect() {
        try {
            // Configuración de conexión optimizada
            const options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                bufferCommands: false
            };

            // Conectar usando Mongoose
            await mongoose.connect(process.env.MONGO_URI, options);
            this.isConnected = true;

            console.log('✅ Conectado exitosamente a MongoDB Atlas');
            console.log(`📍 Base de datos: ${mongoose.connection.name}`);

            // Configurar eventos de conexión
            this.setupConnectionEvents();

            return mongoose.connection;
        } catch (error) {
            console.error('❌ Error conectando a MongoDB:', error.message);
            process.exit(1);
        }
    }

    setupConnectionEvents() {
        mongoose.connection.on('connected', () => {
            console.log('🔗 Mongoose conectado a MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.error('🚨 Error de conexión MongoDB:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('🔌 Mongoose desconectado');
            this.isConnected = false;
        });

        // Manejo de cierre graceful
        process.on('SIGINT', async () => {
            await this.disconnect();
            process.exit(0);
        });
    }

    async disconnect() {
        if (this.isConnected) {
            await mongoose.connection.close();
            console.log('👋 Conexión cerrada correctamente');
        }
    }

    getHealth() {
        return {
            connected: this.isConnected,
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            name: mongoose.connection.name
        };
    }
}

module.exports = new DatabaseConnection();