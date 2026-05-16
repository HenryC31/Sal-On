require('dotenv').config();
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

    //Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    //Insertar en la base de datos de Supabase
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
      // Si el código es 23505, significa que el correo ya existe
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

    // Buscar al usuario por correo en Supabase
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('correo', correo)
      .single(); // single() porque el correo es UNIQUE

    // Si hay error o no encuentra al usuario
    if (error || !usuario) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    // Comparar la contraseña ingresada con el Hash guardado
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    
    if (!passwordValida) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    // Login exitoso: Quitamos el password_hash por seguridad antes de mandar los datos al Front
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

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Microservicio de Usuarios corriendo en http://localhost:${PORT}`);
});