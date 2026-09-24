import React, { useState } from 'react';
import Navbar from './components/common/Navbar';
import HomePage from './pages/HomePage';

export default function App() {
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <div className="app-container">
      <Navbar 
        activeCategory={activeCategory} 
        onSelectCategory={setActiveCategory} 
      />
      <main>
        <HomePage activeCategory={activeCategory} />
      </main>
      <footer style={{
        marginTop: 64,
        paddingTop: 24,
        borderTop: '1px solid #E2E8F0',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: '#64748B'
      }}>
        Smart Career Guidance System &copy; 2026. Built with React (Vite) & Python FastAPI.
      </footer>
    </div>
  );
}
