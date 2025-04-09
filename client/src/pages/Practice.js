import React from 'react';

function Practice({ content }) {
  return (
    <div className="card">
      <h2>Практический раздел</h2>
      {content.filter(item => item.section === 'practice').map(item => (
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

export default Practice;