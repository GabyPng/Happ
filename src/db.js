
const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://gabypaniaguag:<db_password>@happiety.olrm8hw.mongodb.net/?retryWrites=true&w=majority&appName=HappiEty"; // Cambia si usas MongoDB Atlas

const client = new MongoClient(uri);

async function connectToDB() {
  try {
    await client.connect();
    console.log("MongoDB conectado");
    return client.db("happiety"); // Nombre de tu base de datos
  } catch (err) {
    console.error("Error al conectar a MongoDB:", err);
  }
}

module.exports = connectToDB;
