import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import './Auth.css';

const Registro = () => {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('cliente'); 
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const respuesta = await axios.post('http://localhost:3000/api/usuarios/registro', {
        nombre_completo: nombreCompleto,
        telefono: telefono,
        correo: email,
        password: password,
        rol: rol
      });

      if (respuesta.status === 201 || respuesta.status === 200) {
        // Alerta de éxito
        Swal.fire({
          icon: 'success',
          title: '¡Registro Exitoso!',
          text: 'Tu cuenta ha sido creada. Ya puedes iniciar sesión.',
          confirmButtonColor: '#a855f7'
        }).then(() => {
          navigate('/login'); 
        });
      }
    } catch (error) {
      console.error("Error al registrar:", error);
      
      // Alerta de error
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error.response?.data?.error || 'Hubo un problema al crear la cuenta. Revisa el servidor.',
        confirmButtonColor: '#a855f7'
      });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">¡Únete a Sal-ON!</h2>
        <p className="auth-subtitle">Crea tu cuenta y comienza a organizar</p>

        <form onSubmit={handleSubmit} className="auth-form">
          
          <div className="input-group">
            <label>¿Qué deseas hacer en la plataforma?</label>
            <div className="role-selector">
              <button 
                type="button" 
                className={`role-btn ${rol === 'cliente' ? 'active' : ''}`}
                onClick={() => setRol('cliente')}
              >
                🎉 Quiero Rentar
              </button>
              <button 
                type="button" 
                className={`role-btn ${rol === 'arrendador' ? 'active' : ''}`}
                onClick={() => setRol('arrendador')}
              >
                🏢 Soy Anfitrión
              </button>
            </div>
          </div>

          <div className="input-group">
            <label>Nombre Completo</label>
            <input 
              type="text" 
              placeholder="Ej. Henry Castro" 
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Teléfono Celular</label>
            <input 
              type="tel" 
              placeholder="Ej. 6121234567" 
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required
            />
          </div>

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
              placeholder="Crea una contraseña segura" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-auth">Crear Cuenta</button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login" className="auth-link">Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default Registro;