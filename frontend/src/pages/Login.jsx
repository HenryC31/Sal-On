import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2'; 
import './Auth.css';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const respuesta = await axios.post('http://localhost:3000/api/usuarios/login', {
        correo: email,
        password: password
      });

      if (respuesta.status === 200) {
        Swal.fire({
          icon: 'success',
          title: 'Login Exitoso',
          text: `Bienvenido de vuelta, ${respuesta.data.usuario.nombre_completo}`,
          confirmButtonColor: '#a855f7'
        });
        
        localStorage.setItem('salonUser', JSON.stringify(respuesta.data.usuario));
        onLoginSuccess(respuesta.data.usuario);
        const rolUsuario = respuesta.data.usuario.rol;
        
        if (rolUsuario === 'arrendador' || rolUsuario === 'admin') {
          navigate('/panel-anfitrion');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error.response?.data?.error || 'Hubo un problema al conectar con el servidor',
        confirmButtonColor: '#a855f7'
      });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">¡Bienvenido a Sal-ON!</h2>
        <p className="auth-subtitle">Ingresa tus datos para continuar</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="ejemplo@correo.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              placeholder="********" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-auth">Iniciar Sesión</button>
        </form>

        <p className="auth-footer">
          ¿No tienes cuenta? <Link to="/registro" className="auth-link">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;