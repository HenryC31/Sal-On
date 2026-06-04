const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const obtenerTablaShard = (ciudad) => {
    if (!ciudad) return 'salones';
    const ciudadLimpia = ciudad.toLowerCase().trim();
    if (ciudadLimpia === 'la paz') return 'salones_lapaz';
    if (ciudadLimpia === 'monterrey') return 'salones_monterrey';
    if (ciudadLimpia === 'guadalajara') return 'salones_guadalajara';
    return 'salones';
};

app.get('/salones', async (req, res) => {
    try {
        const [shardLaPaz, shardMty, shardGdl, shardBase, resenasData] = await Promise.all([
            supabase.from('salones_lapaz').select('*'),
            supabase.from('salones_monterrey').select('*'),
            supabase.from('salones_guadalajara').select('*'),
            supabase.from('salones').select('*'),
            supabase.from('resenas').select('salon_id, calificacion') 
        ]);

        const salones = [
            ...(shardLaPaz.data || []),
            ...(shardMty.data || []),
            ...(shardGdl.data || []),
            ...(shardBase.data || [])
        ];

        const resenas = resenasData.data || [];

        // Agrupamos las calificaciones por cada salon_id en un diccionario O(N)
        const mapeoCalificaciones = {};
        resenas.forEach(r => {
            if (!mapeoCalificaciones[r.salon_id]) {
                mapeoCalificaciones[r.salon_id] = { suma: 0, conteo: 0 };
            }
            mapeoCalificaciones[r.salon_id].suma += r.calificacion;
            mapeoCalificaciones[r.salon_id].conteo += 1;
        });

        // Acoplamos las propiedades estadísticas dinámicas a cada objeto de salón
        const catalogoProcesado = salones.map(s => {
            const estadisticas = mapeoCalificaciones[s.id];
            return {
                ...s,
                promedio_calificacion: estadisticas ? Number((estadisticas.suma / estadisticas.conteo).toFixed(1)) : 0,
                total_resenas: estadisticas ? estadisticas.conteo : 0
            };
        });

        res.json(catalogoProcesado);
    } catch (error) {
        console.error("Error cross-shard con agregación de valoraciones:", error);
        res.status(500).json({ error: "Error de comunicación en los clústers de base de datos" });
    }
});

// Crear salón
app.post('/', async (req, res) => {
    try {
        const tabla = obtenerTablaShard(req.body.ciudad);
        

        const datosLimpios = { ...req.body };
        delete datosLimpios.estado; 

        const { data, error } = await supabase.from(tabla).insert([datosLimpios]).select();
        
        if (error) throw error;
        res.status(201).json({ salon: data[0] });
    } catch (err) { 
        console.error("Error en Supabase (POST):", err);
        res.status(500).json({ error: err.message }); 
    }
});

// Editar salón
app.put('/:id', async (req, res) => {
    try {
        const tabla = obtenerTablaShard(req.body.ciudad);
    
        const datosLimpios = { ...req.body };
        delete datosLimpios.estado; 

        const { data, error } = await supabase.from(tabla).update(datosLimpios).eq('id', req.params.id).select();
        
        if (error) throw error;
        res.status(200).json({ salon: data[0] });
    } catch (err) { 
        console.error("Error en Supabase (PUT):", err);
        res.status(500).json({ error: err.message }); 
    }
});

// Eliminar Salón
app.delete('/:id', async (req, res) => {
    try {
        const tabla = obtenerTablaShard(req.query.ciudad);
        const { error } = await supabase.from(tabla).delete().eq('id', req.params.id);
        if (error) throw error;
        res.status(200).json({ mensaje: 'Eliminado' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// RUTAS DE RESEÑAS
app.get('/api/resenas/:salon_id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('resenas').select('*').eq('salon_id', req.params.salon_id);
        if (error) throw error;
        res.json(data || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/resenas', async (req, res) => {
    try {
        const { salon_id, id_cliente, calificacion, comentario } = req.body;
        
        const { data: reseñaExistente } = await supabase
            .from('resenas')
            .select('id')
            .eq('salon_id', salon_id)
            .eq('cliente_id', id_cliente);

        if (reseñaExistente && reseñaExistente.length > 0) {
            return res.status(400).json({ error: "Ya has calificado este salón anteriormente." });
        }

        // Si no existe, procedemos a guardarla
        const { error } = await supabase.from('resenas').insert([{ 
            salon_id: salon_id, 
            cliente_id: id_cliente, 
            calificacion: Number(calificacion), 
            comentario 
        }]);
        
        if (error) throw error;
        res.status(201).json({ mensaje: "Reseña guardada" });
    } catch (err) { 
        console.error("Error exacto en Supabase (POST Reseñas):", err);
        res.status(500).json({ error: err.message }); 
    }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Microservicio de Catálogo en el puerto ${PORT}`));
