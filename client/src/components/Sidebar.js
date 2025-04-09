import React from 'react';
import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <aside className="sidebar">
      <h2>Содержание</h2>
      <ul>
        <li><Link to="/">Главная</Link></li>
        <li><Link to="/intro">Введение</Link></li>
        <li><Link to="/practice">Практический раздел</Link></li>
        <li><Link to="/support">Вспомогательный раздел</Link></li>
        <li><Link to="/tests">Раздел контроля знаний</Link></li>
      </ul>
    </aside>
  );
}

export default Sidebar;