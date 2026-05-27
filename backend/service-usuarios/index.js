const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Ruta para registrar usuarios
app.post('/registro', async (req, res) => {
  try {
    const { nombre_completo, telefono, correo, password, rol } = req.body;

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        { 
          nombre_completo, 
          telefono, 
          correo, 
          password_hash, 
          rol 
        }
      ]);

    if (error) {
      console.error("Error de Supabase:", error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'El correo ya está registrado.' });
      }
      return res.status(400).json({ error: 'Error al registrar usuario.' });
    }

    res.status(201).json({ mensaje: '¡Usuario registrado con éxito!' });

  } catch (err) {
    console.error("Error del servidor:", err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Ruta para iniciar sesión
app.post('/login', async (req, res) => {
  try {
    const { correo, password } = req.body;

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('correo', correo)
      .single();

    if (error || !usuario) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    
    if (!passwordValida) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    delete usuario.password_hash;
    
    res.status(200).json({ 
      mensaje: 'Login exitoso', 
      usuario: usuario 
    });

  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Actualizar datos del perfil (¡CORREGIDO Y OPTIMIZADO!)
app.put('/actualizar', async (req, res) => {
  try {
    const { id, nombre_completo, correo, telefono, foto_url, password } = req.body;

    // Creamos el payload base con los datos limpios
    const camposActualizar = { 
      nombre_completo, 
      correo, 
      telefono, 
      foto_url 
    };

    // Si el usuario ingresó una nueva contraseña desde el Front, la encriptamos antes de subirla
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      camposActualizar.password_hash = await bcrypt.hash(password, salt);
    }

    const { data, error } = await supabase
      .from('usuarios')
      .update(camposActualizar)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'El correo ya está en uso.' });
      throw error;
    }

    delete data.password_hash; // Seguridad: no devolvemos el hash
    res.status(200).json({ mensaje: 'Perfil actualizado', usuario: data });
  } catch (err) {
    console.error("Error al actualizar perfil:", err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Microservicio de Usuarios corriendo en http://localhost:${PORT}`);
});