
const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://gabypaniaguag:<db_password>@happiety.olrm8hw.mongodb.net/?retryWrites=true&w=majority&appName=HappiEty"; 
const client = new MongoClient(uri);

async function connectToDB() {
  try {
    await client.connect();
    console.log("MongoDB conectado");
    return client.db("happiety"); git 
  } catch (err) {
    console.error("Error al conectar a MongoDB:", err);
  }
}

module.exports = connectToDB;
