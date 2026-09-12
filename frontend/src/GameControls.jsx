import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from './App.jsx';

function GameControls({ onSessionEnd }) {
  const [canStart, setCanStart] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [endsAt, setEndsAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const canStartRes = await axios.get(`${API_URL}/api/can_start/`);
        setCanStart(canStartRes.data.can_start);

        const statusRes = await axios.get(`${API_URL}/api/session_status/`);
        if (statusRes.data.active) {
          setSessionActive(true);
          setEndsAt(statusRes.data.ends_at);
        }
      } catch (error) {
        console.error('Ошибка загрузки статуса:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  useEffect(() => {
    if (!endsAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const end = new Date(endsAt);
      const diff = Math.max(0, Math.floor((end - now) / 1000));

      if (diff === 0) {
        setTimeLeft('⏰ Сессия завершена!');
        setSessionActive(false);
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setTimeLeft(`⏳ Осталось: ${minutes} мин ${seconds} сек`);
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt]);

  const startGame = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/start_session/`);
      setSessionActive(true);
      setEndsAt(response.data.ends_at);
      setMessage('✅ Игра запущена на 1 час!');
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      setMessage('❌ Ошибка: ' + (error.response?.data?.error || 'Неизвестная ошибка'));
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const endGame = async () => {
    if (!window.confirm('Вы уверены, что хотите завершить игру? Будут подведены итоги.')) return;

    try {
      const response = await axios.post(`${API_URL}/api/end_session/`);
      setSessionActive(false);
      setEndsAt(null);
      setTimeLeft('');
      
      // Передаём результаты наверх в App.jsx
      if (onSessionEnd) {
        onSessionEnd(response.data.results, response.data.winner);
      }
    } catch (error) {
      // Если сессия уже завершилась — показываем результаты из ошибки
      if (error.response && error.response.status === 403) {
        const data = error.response.data;
        if (data.results && data.winner) {
          if (onSessionEnd) {
            onSessionEnd(data.results, data.winner);
          }
          return;
        }
      }
      
      setMessage('❌ Ошибка завершения: ' + (error.response?.data?.error || 'Неизвестная ошибка'));
      setTimeout(() => setMessage(''), 5000);
    }
  };

  if (loading) {
    return <div style={{ padding: '10px', color: '#888' }}>Загрузка...</div>;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      background: 'rgba(0,0,0,0.75)',
      padding: '12px 24px',
      borderRadius: '12px',
      backdropFilter: 'blur(4px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      flexWrap: 'wrap',
      minWidth: '280px',
      maxWidth: '90vw',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      {message && (
        <div style={{
          padding: '8px 16px',
          marginBottom: '0',
          background: message.startsWith('✅') ? '#2e7d32' : '#c62828',
          color: 'white',
          borderRadius: '8px',
          fontSize: '14px',
          width: '100%',
          textAlign: 'center',
        }}>
          {message}
        </div>
      )}

      {sessionActive ? (
        <>
          <div style={{ padding: '8px 16px', background: '#4caf50', color: 'white', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' }}>
            🎮 Игра активна
          </div>
          <div style={{ padding: '8px 16px', background: '#fff3e0', borderRadius: '8px', fontWeight: 'bold', color: '#e65100', fontSize: '14px' }}>
            {timeLeft || '⏳ Обновление...'}
          </div>
          <button
            onClick={endGame}
            style={{
              padding: '8px 20px',
              background: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            ⏹ Завершить
          </button>
        </>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {canStart ? (
            <button
              onClick={startGame}
              style={{
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #ff9800, #f57c00)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(255, 152, 0, 0.4)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              🚀 Запустить игру
            </button>
          ) : (
            <div style={{
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#bbb',
              fontSize: '16px',
              border: '1px dashed #555',
            }}>
              ⏳ Ожидайте запуска...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GameControls;