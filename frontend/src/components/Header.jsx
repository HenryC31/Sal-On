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
              
              <img 
                src={user.foto_url || `https://ui-avatars.com/api/?name=${user.nombre_completo?.replace(' ', '+')}&background=fff&color=a855f7&rounded=true`} 
                alt="Avatar de usuario"
                style={{ 
                  width: '45px', 
                  height: '45px', 
                  borderRadius: '50%', 
                  objectFit: 'cover', 
                  border: '2px solid white',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  cursor: 'pointer'
                }}
                className="profile-pic"
                onClick={() => setMenuAbierto(!menuAbierto)}
              />
              {/* Menú desplegable interactivo */}
              {menuAbierto && (
                <div className="dropdown-menu">
 
                  {(user.rol === 'arrendador' || user.rol === 'admin') && (
                    <Link to="/panel-anfitrion" className="dropdown-item" onClick={() => setMenuAbierto(false)}>
                      Panel de Anfitrión
                    </Link>
                  )}

                  <Link to="/perfil" className="dropdown-item" onClick={() => setMenuAbierto(false)}>
                    Mi perfil
                  </Link>
                  <button 
                    className="dropdown-item btn-salir" 
                    onClick={() => {
                      setMenuAbierto(false);
                      onLogout();
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