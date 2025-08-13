import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
// import App from './App.jsx'; // 초 심플 카운터
import App from './App2.jsx'; // 분리형 컴포넌트 카운터

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);