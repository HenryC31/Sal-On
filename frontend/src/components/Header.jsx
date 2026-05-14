import { Link } from 'react-router-dom';
import './Header.css';

const Header = ({ user }) => {
  return (
    <header className="main-header">
      <div className="header-content">
        <Link to="/" className="logo-section">
          <img src="/logo.png" alt="Sal-ON Logo" className="logo-image" />
        </Link>
        
        <div className="header-banner">
          Tienes fiesta? Tenemos Sal-ON!!
        </div>

        <nav className="header-nav">
          {user ? (
            <div className="user-menu">
              <Link to="/perfil" className="nav-link">Mi Cuenta</Link>
              <button className="btn-logout">Salir</button>
            </div>
          ) : (
            <Link to="/login" className="nav-link">Iniciar sesión</Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;