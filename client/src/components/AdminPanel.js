import React, { useState } from 'react';

function AdminPanel({ fetchContent }) {
  const [section, setSection] = useState('home');
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [image, setImage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('https://dasdad-t7xs.onrender.com/api/content', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ section, text, link, image })
    });
    fetchContent();
    setText('');
    setLink('');
    setImage('');
  };

  return (
    <div className="card">
      <h2>Добавить контент</h2>
      <form onSubmit={handleSubmit}>
        <select value={section} onChange={(e) => setSection(e.target.value)}>
          <option value="home">Главная</option>
          <option value="intro">Введение</option>
          <option value="practice">Практический раздел</option>
          <option value="support">Вспомогательный раздел</option>
          <option value="tests">Раздел контроля знаний</option>
        </select>
        <input 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder="Текст" 
          required 
        />
        <input 
          value={link} 
          onChange={(e) => setLink(e.target.value)} 
          placeholder="Ссылка (опционально)" 
        />
        <input 
          value={image} 
          onChange={(e) => setImage(e.target.value)} 
          placeholder="URL изображения (опционально)" 
        />
        <button type="submit">Добавить</button>
      </form>
    </div>
  );
}

export default AdminPanel;