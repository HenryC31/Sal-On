const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const axios = require('axios'); 
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  }
});

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Crear reserva
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

// Obtener todas las reservas activas
app.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reservas')
      .select('salon_id, fecha_evento')
      .in('estado', ['pendiente', 'pagada']);

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al traer reservas activas' });
  }
});

// Procesar el pago y enviar correos
app.patch('/:id/pagar', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Actualizamos el estado a pagada
    await supabase.from('reservas').update({ estado: 'pagada' }).eq('id', id);

    // Traemos la reserva para obtener los IDs
    const { data: reserva } = await supabase.from('reservas').select('*').eq('id', id).single();

    // Traemos el correo del cliente directo de la tabla usuarios en Supabase
    const { data: cliente } = await supabase.from('usuarios').select('correo').eq('id', reserva.cliente_id).single();
    
    // Traemos al dueño del salón consultando al Gateway
    const respuestaCat = await axios.get('http://localhost:3000/api/salones');
    const salon = respuestaCat.data.find(s => s.id === reserva.salon_id);
    
    // Traemos el correo del anfitrión
    const { data: anfitrion } = await supabase.from('usuarios').select('correo').eq('id', salon.anfitrion_id).single();

    // El Cartero entrega los mensajes
    if (cliente && cliente.correo) {
      transporter.sendMail({
        from: '"Sal-ON" <tu_correo@gmail.com>',
        to: cliente.correo,
        subject: `¡Reserva Confirmada en ${reserva.salon_nombre}! 🎉`,
        html: `<h2>¡Pago exitoso!</h2><p>Tu evento está confirmado para el ${reserva.fecha_evento}.</p>`
      }).catch(console.error); // El catch evita que el servidor crashee si falla el correo
    }

    if (anfitrion && anfitrion.correo) {
      transporter.sendMail({
        from: '"Sal-ON" <tu_correo@gmail.com>',
        to: anfitrion.correo,
        subject: `¡Tienes una nueva reserva pagada! 💰`,
        html: `<h2>¡Nuevo evento!</h2><p>Han pagado una reserva para <b>${reserva.salon_nombre}</b> el día ${reserva.fecha_evento}. Revisa tu panel para más detalles.</p>`
      }).catch(console.error);
    }

    res.status(200).json({ mensaje: 'Pago procesado y correos enviados a sus dueños' });
  } catch (err) {
    console.error("Error procesando pago:", err);
    res.status(500).json({ error: 'No se pudo procesar el pago' });
  }
});

// Cancelar la reserva (¡LA RUTA QUE CAUSABA EL 404!)
app.patch('/:id/cancelar', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('reservas').update({ estado: 'cancelada' }).eq('id', id);
    if (error) throw error;
    res.status(200).json({ mensaje: 'Reserva cancelada exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo cancelar la reserva' });
  }
});

// Obtener reservas de un cliente
app.get('/cliente/:cliente_id', async (req, res) => {
  try {
    const { cliente_id } = req.params;
    const { data, error } = await supabase
      .from('reservas')
      .select('*')
      .eq('cliente_id', cliente_id)
      .order('fecha_evento', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al traer tus reservas' });
  }
});

// Obtener reservas de un anfitrión
app.get('/anfitrion/:anfitrion_id', async (req, res) => {
  try {
    const { anfitrion_id } = req.params;
    const respuestaCat = await axios.get('http://localhost:3000/api/salones');
    const misSalones = respuestaCat.data.filter(s => s.anfitrion_id === anfitrion_id);
    if (!misSalones || misSalones.length === 0) return res.status(200).json([]);
    
    const listaIds = misSalones.map(s => s.id);
    const { data: reservas, error } = await supabase
      .from('reservas')
      .select('*')
      .in('salon_id', listaIds)
      .order('fecha_evento', { ascending: false });

    if (error) throw error;
    res.status(200).json(reservas);
  } catch (err) {
    res.status(500).json({ error: 'Error al traer las reservas del anfitrión.' });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Microservicio de Reservas corriendo en http://localhost:${PORT}`);
});