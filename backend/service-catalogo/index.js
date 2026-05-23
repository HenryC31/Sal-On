const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();

// 1. Configuración de CORS para evitar errores de bloqueo
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());

// 2. Inicialización de Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Función de router para Sharding
const obtenerTablaShard = (ciudad) => {
    if (!ciudad) return 'salones';
    const ciudadLimpia = ciudad.toLowerCase().trim();
    if (ciudadLimpia === 'la paz') return 'salones_lapaz';
    if (ciudadLimpia === 'monterrey') return 'salones_monterrey';
    if (ciudadLimpia === 'guadalajara') return 'salones_guadalajara';
    return 'salones';
};

// --- RUTAS DE SALONES (SHARDING) ---
app.get('/salones', async (req, res) => {
    try {
        const [shardLaPaz, shardMty, shardGdl, shardBase] = await Promise.all([
            supabase.from('salones_lapaz').select('*'),
            supabase.from('salones_monterrey').select('*'),
            supabase.from('salones_guadalajara').select('*'),
            supabase.from('salones').select('*')
        ]);

        const catalogoCompleto = [
            ...(shardLaPaz.data || []),
            ...(shardMty.data || []),
            ...(shardGdl.data || []),
            ...(shardBase.data || [])
        ];
        res.json(catalogoCompleto);
    } catch (error) {
        console.error("Error en consulta cross-shard:", error);
        res.status(500).json({ error: "Error al conectar con los shards" });
    }
});

// --- RUTAS DE RESEÑAS (CORREGIDAS SEGÚN TU TABLA) ---
app.get('/api/resenas/:salon_id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('resenas')
            .select('*')
            .eq('salon_id', req.params.salon_id); // Columna corregida
        
        if (error) throw error;
        res.json(data || []);
    } catch (err) { 
        console.error("Error en GET reseñas:", err);
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/resenas', async (req, res) => {
    try {
        const { salon_id, id_cliente, calificacion, comentario } = req.body;
        
        const { data, error } = await supabase
            .from('resenas')
            .insert([{ 
                "salon_id": salon_id,       // Columna corregida
                "cliente_id": id_cliente,   // Columna corregida
                "calificacion": calificacion, 
                "comentario": comentario 
            }]);
        
        if (error) throw error;
        res.status(201).json({ mensaje: "Reseña guardada" });
    } catch (err) { 
        console.error("Error en POST reseñas:", err);
        res.status(500).json({ error: err.message }); 
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Microservicio de Catálogo corriendo en http://localhost:${PORT}`);
});