const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(express.json());

// Inicializamos el cliente de Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const obtenerTablaShard = (ciudad) => {
  if (!ciudad) return 'salones';
  
  const ciudadLimpia = ciudad.toLowerCase().trim();
  
  if (ciudadLimpia === 'la paz') return 'salones_lapaz';
  if (ciudadLimpia === 'monterrey') return 'salones_monterrey';
  if (ciudadLimpia === 'guadalajara') return 'salones_guadalajara';
  
  return 'salones'; // Tabla por defecto si es otra ciudad
};

// Endpoint para obtener todos los salones
app.get('/salones', async (req, res) => {
    try {
        // Hacemos consultas en paralelo a todas las bases de datos distribuidas (shards)
        const [shardLaPaz, shardMty, shardGdl, shardBase] = await Promise.all([
            supabase.from('salones_lapaz').select('*'),
            supabase.from('salones_monterrey').select('*'),
            supabase.from('salones_guadalajara').select('*'),
            supabase.from('salones').select('*')
        ]);

        // Juntamos los fragmentos en un solo arreglo plano
        const catalogoCompleto = [
            ...(shardLaPaz.data || []),
            ...(shardMty.data || []),
            ...(shardGdl.data || []),
            ...(shardBase.data || [])
        ];
        
        res.json(catalogoCompleto);
    } catch (error) {
        console.error("Error en consulta cross-shard:", error);
        res.status(500).json({ error: "Error al conectar con los shards de datos" });
    }
});

// Crear un nuevo salón 
app.post('/', async (req, res) => {
  try {
    const { nombre, direccion, ciudad, descripcion, capacidad_max, precio_evento, amenidades, anfitrion_id, imagenes } = req.body;
    
    // El router decide a qué shard pertenece el registro
    const tablaDestino = obtenerTablaShard(ciudad);
    console.log(`[SHARDING] Redireccionando inserción a la tabla: ${tablaDestino}`);

    const { data, error } = await supabase
      .from(tablaDestino)
      .insert([{ nombre, direccion, ciudad, descripcion, capacidad_max, precio_evento, amenidades, anfitrion_id, imagenes }])
      .select();

    if (error) throw error;

    res.status(201).json({ mensaje: `¡Salón registrado en shard ${tablaDestino}!`, salon: data[0] });
  } catch (err) {
    console.error("Error al crear salón en shard:", err);
    res.status(500).json({ error: 'No se pudo registrar el salón en el catálogo distribuido.' });
  }
});

// Actualizar un salón existente
app.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, direccion, ciudad, descripcion, capacidad_max, precio_evento, amenidades, imagenes } = req.body;
    
    // Buscamos el shard correcto basándonos en la ciudad del salón
    const tablaDestino = obtenerTablaShard(ciudad);
    console.log(`[SHARDING] Redireccionando actualización a la tabla: ${tablaDestino}`);

    const { data, error } = await supabase
      .from(tablaDestino)
      .update({ nombre, direccion, ciudad, descripcion, capacidad_max, precio_evento, amenidades, imagenes })
      .eq('id', id)
      .select();

    if (error) throw error;

    res.status(200).json({ mensaje: 'Salón actualizado en su respectivo shard', salon: data[0] });
  } catch (err) {
    console.error("Error al actualizar salón en shard:", err);
    res.status(500).json({ error: 'No se pudo actualizar el salón.' });
  }
});

app.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ciudad } = req.query;
    
    // El router decide a qué shard ir a borrar
    const tablaDestino = obtenerTablaShard(ciudad);
    console.log(`[SHARDING] Eliminando salón de la tabla: ${tablaDestino}`);

    const { error } = await supabase
      .from(tablaDestino)
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({ mensaje: 'Salón eliminado correctamente del shard.' });
  } catch (err) {
    console.error("Error al eliminar salón en shard:", err);
    res.status(500).json({ error: 'No se pudo eliminar el salón.' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Microservicio de Catálogo corriendo en http://localhost:${PORT}`);
});