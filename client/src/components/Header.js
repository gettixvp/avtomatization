import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header({ isLoggedIn, setIsLoggedIn, isAdmin }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-content">
        <div>
          <h1>Иностранный язык</h1>
          <p>общеобразовательный компонент</p>
        </div>
        <nav className="auth-nav">
          {isLoggedIn ? (
            <>
              {isAdmin && <Link to="/admin">Админ-панель</Link>}
              <button onClick={handleLogout}>Выйти</button>
            </>
          ) : (
            <>
              <Link to="/login">Войти</Link>
              <Link to="/register">Регистрация</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;