const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
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

// RUTA PRINCIPAL
app.post('/', async (req, res) => {
  try {
    const { salon_id, cliente_id, fecha_evento, monto_total } = req.body;

    const { data: reservasExistentes, error: errorBusqueda } = await supabase
      .from('reservas')
      .select('id')
      .eq('salon_id', salon_id)
      .eq('fecha_evento', fecha_evento)
      .in('estado', ['pendiente', 'pagada']);

    if (errorBusqueda) throw errorBusqueda;

    if (reservasExistentes && reservasExistentes.length > 0) {
      return res.status(400).json({ error: '¡Ups! Este salón ya está apartado para esa fecha.' });
    }

    const { data, error: errorInsert } = await supabase
      .from('reservas')
      .insert([{ salon_id, cliente_id, fecha_evento, monto_total, estado: 'pendiente' }])
      .select('id');

    if (errorInsert) throw errorInsert;

    res.status(201).json({ mensaje: '¡Reservación creada!', reserva_id: data[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar la reserva.' });
  }
});

// Procesar el pago
app.patch('/:id/pagar', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('reservas')
      .update({ estado: 'pagada' })
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ mensaje: 'Pago procesado exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo procesar el pago' });
  }
});

// Obtener reservas de un cliente específico
app.get('/cliente/:cliente_id', async (req, res) => {
  try {
    const { cliente_id } = req.params;
    const { data, error } = await supabase
      .from('reservas')
      .select(`
        id,
        fecha_evento,
        monto_total,
        estado,
        salones ( nombre )
      `)
      .eq('cliente_id', cliente_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Mapeamos los datos para que el Front reciba "salon_nombre"
    const reservasFormateadas = data.map(res => ({
      id: res.id,
      fecha_evento: res.fecha_evento,
      monto_total: res.monto_total,
      estado: res.estado,
      salon_nombre: res.salones ? res.salones.nombre : 'Salón Desconocido'
    }));

    res.status(200).json(reservasFormateadas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al traer tus reservas' });
  }
});

// Cancelar una reservación (Cambiar estado a 'cancelada')
app.patch('/:id/cancelar', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('reservas')
      .update({ estado: 'cancelada' })
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ mensaje: 'Reservación cancelada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo cancelar' });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Microservicio de Reservas corriendo en http://localhost:${PORT}`);
});