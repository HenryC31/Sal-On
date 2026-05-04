const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// Rutas "Distribuidas"
// Cuando el front pida /salones, el gateway le pregunta al microservicio de catálogo
app.get('/api/salones', async (req, res) => {
    try {
        const response = await axios.get('http://localhost:3001/salones');
        res.json(response.data);
    } catch (error) {
        res.status(500).send("Error conectando al servicio de catálogo");
    }
});

// Cuando el front pida /reservar, el gateway le pregunta al microservicio de reservas
app.post('/api/reservar', async (req, res) => {
    try {
        const response = await axios.post('http://localhost:3002/reservar', req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).send("Error conectando al servicio de reservas");
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Gateway corriendo en http://localhost:${PORT}`);
});