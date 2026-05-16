import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = ({ user, onLogout }) => {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <header className="main-header">
      <div className="header-content">
        <Link to="/" className="logo-section" onClick={() => setMenuAbierto(false)}>
          <img src="/logo.png" alt="Sal-ON Logo" className="logo-image" />
        </Link>
        
        <div className="header-banner">
          ¿Tienes fiesta? ¡Tenemos Sal-ON!
        </div>

        <nav className="header-nav">
          {user ? (
            <div className="user-profile-container">
              {/* Foto de perfil generada en vivo con el nombre del usuario logueado */}
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre_completo)}&background=fff&color=a855f7&rounded=true`} 
                alt="Perfil" 
                className="profile-pic"
                onClick={() => setMenuAbierto(!menuAbierto)}
              />
              
              {/* Menú desplegable interactivo */}
              {menuAbierto && (
                <div className="dropdown-menu">
                  <Link to="/perfil" className="dropdown-item" onClick={() => setMenuAbierto(false)}>
                    Mi perfil
                  </Link>
                  <button 
                    className="dropdown-item btn-salir" 
                    onClick={() => {
                      setMenuAbierto(false);
                      onLogout(); // Llama a la función de App.jsx para limpiar la sesión
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-login">Iniciar sesión</Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;