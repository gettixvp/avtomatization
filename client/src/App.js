import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Register from './components/Register';
import AdminPanel from './components/AdminPanel';
import Home from './pages/Home';
import Intro from './pages/Intro';
import Practice from './pages/Practice';
import Support from './pages/Support';
import Tests from './pages/Tests';
import './styles.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [content, setContent] = useState([]);

  useEffect(() => {
    fetchContent();
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      try {
        const decoded = jwtDecode(token);
        setIsAdmin(decoded.email === 'svaleriya695@gmail.com');
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
  }, []);

  const fetchContent = async () => {
    const res = await fetch('https://dasdad-t7xs.onrender.com/api/content');
    const data = await res.json();
    setContent(data);
  };

  return (
    <BrowserRouter>
      <div className="app">
        <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} isAdmin={isAdmin} />
        <div className="container">
          <Sidebar />
          <main className="content">
            <Routes>
              <Route path="/" element={<Home content={content} />} />
              <Route path="/intro" element={<Intro content={content} />} />
              <Route path="/practice" element={<Practice content={content} />} />
              <Route path="/support" element={<Support content={content} />} />
              <Route path="/tests" element={<Tests content={content} />} />
              <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
              <Route path="/register" element={<Register />} />
              {isAdmin && (
                <Route 
                  path="/admin" 
                  element={<AdminPanel fetchContent={fetchContent} />} 
                />
              )}
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;