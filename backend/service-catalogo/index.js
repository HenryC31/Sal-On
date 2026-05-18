const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(express.json());

// Inicializamos el cliente de Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Endpoint para obtener todos los salones (REST)
app.get('/salones', async (req, res) => {
    try {
        // Hacemos el SELECT a la tabla que creaste por SQL
        const { data, error } = await supabase
            .from('salones')
            .select('*');

        if (error) throw error;
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Error al conectar con el catálogo de datos" });
    }
});

// Crear un nuevo salón (Para arrendadores)
app.post('/', async (req, res) => {
  try {
    const { nombre, direccion, descripcion, capacidad_max, precio_evento, amenidades, anfitrion_id, imagenes } = req.body;
    const { data, error } = await supabase
      .from('salones')
      .insert([
        { 
          nombre, 
          direccion, 
          descripcion, 
          capacidad_max, 
          precio_evento, 
          amenidades,
          anfitrion_id,
          imagenes
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({ mensaje: '¡Salón registrado con éxito!', salon: data[0] });
  } catch (err) {
    console.error("Error al crear salón:", err);
    res.status(500).json({ error: 'No se pudo registrar el salón en el catálogo.' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Microservicio de Catálogo corriendo en http://localhost:${PORT}`);
});