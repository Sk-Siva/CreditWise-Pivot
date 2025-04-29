import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Home from './components/Home';
import BuyCredits from './components/BuyCredits';
import UserContext from './userContext';
import './styles/styles.css';

function App() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  return (
    <UserContext.Provider value={{ userId, setUserId }}>
      <Router>
        <div className="mainApp">
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={userId ? <Home /> : <Navigate to="/login" />}
            />
            <Route
            path="/buy"
            element={userId ? <BuyCredits/> : <Navigate to="/login" />}
          />
          </Routes>
        </div>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
