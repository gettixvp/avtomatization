import React from 'react';

function Home({ content }) {
  return (
    <div className="card">
      <h2>Главная</h2>
      <p>На данном сайте представлен ЭУМК по предмету "Иностранный язык" для 10-11 классов</p>
      {content.filter(item => item.section === 'home').map(item => (
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

export default Home;