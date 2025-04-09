import React from 'react';

function Intro({ content }) {
  return (
    <div className="card">
      <h2>Введение</h2>
      {content.filter(item => item.section === 'intro').map(item => (
        <div key={item.id} className="content-item">
          {item.image && <img src={item.image} alt={item.text} />}
          {item.link ? (
            <a href={item.link} target="_blank" rel="noopener noreferrer">{item.text}</a>
          ) : (
            <p>{item.text}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default Intro;