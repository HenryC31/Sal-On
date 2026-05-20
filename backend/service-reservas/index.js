const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const axios = require('axios'); 
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// RUTA PRINCIPAL (Crear reserva)
app.post('/', async (req, res) => {
  try {
    const { salon_id, salon_nombre, cliente_id, fecha_evento, monto_total } = req.body;

    const { data: reservasExistentes } = await supabase
      .from('reservas')
      .select('id')
      .eq('salon_id', salon_id)
      .eq('fecha_evento', fecha_evento)
      .in('estado', ['pendiente', 'pagada']);

    if (reservasExistentes && reservasExistentes.length > 0) {
      return res.status(400).json({ error: '¡Ups! Este salón ya está apartado para esa fecha.' });
    }

    const { data, error } = await supabase
      .from('reservas')
      .insert([{ salon_id, salon_nombre, cliente_id, fecha_evento, monto_total, estado: 'pendiente' }])
      .select('id');

    if (error) throw error;
    res.status(201).json({ mensaje: '¡Reservación creada!', reserva_id: data[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar la reserva.' });
  }
});

// Procesar el pago
app.patch('/:id/pagar', async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('reservas').update({ estado: 'pagada' }).eq('id', id);
    res.status(200).json({ mensaje: 'Pago procesado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo procesar el pago' });
  }
});

// Obtener reservas de un cliente
app.get('/cliente/:cliente_id', async (req, res) => {
  try {
    const { cliente_id } = req.params;
    const { data, error } = await supabase
      .from('reservas')
      .select('id, fecha_evento, monto_total, estado, salon_nombre')
      .eq('cliente_id', cliente_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al traer tus reservas' });
  }
});

// Obtener reservas de un anfitrión comunicándose con el Gateway
app.get('/anfitrion/:anfitrion_id', async (req, res) => {
  try {
    const { anfitrion_id } = req.params;

    // Le preguntamos al Gateway por TODOS los salones de la plataforma
    const respuestaCat = await axios.get('http://localhost:3000/api/salones');
    
    // Filtramos los que le pertenecen a este anfitrión
    const misSalones = respuestaCat.data.filter(s => s.anfitrion_id === anfitrion_id);
    if (!misSalones || misSalones.length === 0) return res.status(200).json([]);
    
    const listaIds = misSalones.map(s => s.id);

    // Buscamos las reservas que coincidan con esos IDs
    const { data: reservas, error } = await supabase
      .from('reservas')
      .select('id, fecha_evento, monto_total, estado, salon_nombre, cliente_id')
      .in('salon_id', listaIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(reservas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al traer las reservas del anfitrión.' });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Microservicio de Reservas corriendo en http://localhost:${PORT}`);
});