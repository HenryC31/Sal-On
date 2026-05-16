require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Ruta principal para crear una reserva
app.post('/', async (req, res) => {
  try {
    const { salon_id, cliente_id, fecha_evento, monto_total } = req.body;

    // Verificar disponibilidad: Buscamos si ya hay un evento ese día en ese salón
    const { data: reservasExistentes, error: errorBusqueda } = await supabase
      .from('reservas')
      .select('id')
      .eq('salon_id', salon_id)
      .eq('fecha_evento', fecha_evento)
      .in('estado', ['pendiente' , 'pagada']);

    if (errorBusqueda) throw errorBusqueda;

    if (reservasExistentes && reservasExistentes.length > 0) {
      return res.status(400).json({ error: '¡Ups! Este salón ya está apartado para esa fecha.' });
    }

    // Si está libre, insertamos la nueva reservación
    const { data, error: errorInsert } = await supabase
      .from('reservas')
      .insert([
        { 
          salon_id: salon_id, 
          cliente_id: cliente_id, 
          fecha_evento: fecha_evento, 
          monto_total: monto_total,
          estado: 'pendiente' 
        }
      ]);

    if (errorInsert) throw errorInsert;

    res.status(201).json({ mensaje: '¡Reservación confirmada!' });

  } catch (err) {
    console.error("Error en el microservicio de reservas:", err);
    res.status(500).json({ error: 'Error interno al procesar la reserva.' });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Microservicio de Reservas corriendo en http://localhost:${PORT}`);
});