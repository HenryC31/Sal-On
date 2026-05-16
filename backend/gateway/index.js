const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// Rutas Distribuidas
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

// Cuando el front pida /usuarios, el gateway le pregunta al microservicio de usuarios
app.use('/api/usuarios', async (req, res) => {
  try {
    // Redirigimos la petición tal cual viene del Frontend hacia el microservicio
    const response = await axios({
      method: req.method,
      url: `http://localhost:3003${req.url}`,
      data: req.body,
      headers: req.headers
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Error en el Gateway al contactar usuarios' });
  }
});

// Cuando el front pida /reservas, el gateway le pregunta al microservicio de reservas
app.use('/api/reservas', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `http://localhost:3002${req.url}`,
      data: req.body,
      headers: req.headers
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Error en el Gateway al contactar reservas' });
  }
});

app.listen(PORT, () => {
    console.log(`Gateway corriendo en http://localhost:${PORT}`);
});