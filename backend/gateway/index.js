const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
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

// Cuando el front pida /usuarios, el gateway le pregunta al microservicio de usuarios
app.use('/api/usuarios', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `http://localhost:3003${req.url}`,
      data: req.body,
      headers: req.headers
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Error en Gateway Usuarios' });
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
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Error en Gateway Reservas' });
  }
});

// Cuando el front envíe un POST a /salones, el gateway lo manda al microservicio de catálogo
app.post('/api/salones', async (req, res) => {
    try {
        const response = await axios.post('http://localhost:3001/', req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Error creando salón en el catálogo' });
    }
});

// Cuando el front envíe un PUT a /salones/:id, el gateway lo manda al catálogo
app.put('/api/salones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.put(`http://localhost:3001/${id}`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Error actualizando el salón' });
    }
});

app.use('/api/resenas', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `http://localhost:3001/api/resenas${req.url}`,
      data: req.body,
      headers: req.headers
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Error en Gateway Reseñas' });
  }
});

app.delete('/api/salones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.delete(`http://localhost:3001/${id}`, { params: req.query });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Error eliminando salón' });
    }
});

app.listen(PORT, () => {
    console.log(`Gateway corriendo en http://localhost:${PORT}`);
});