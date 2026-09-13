import React, { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import WorldMap from './WorldMap.jsx'
import Village from './Village.jsx'
import Login from './Login.jsx'
import GameControls from './GameControls'
import WelcomeScreen from './WelcomeScreen'
import LobbyScreen from './LobbyScreen'
import './App.css'
import ResultsScreen from './ResultsScreen'

export const API_URL = import.meta.env.VITE_API_URL || ''

axios.defaults.withCredentials = true
axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'
axios.defaults.withXSRFToken = true

const SKRYT_CHEREZ = 5000

function App() {
  // 🎵 Музыка
  const audioRef = useRef(null)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [isUserInteracted, setIsUserInteracted] = useState(false)

  useEffect(() => {
    const handleFirstClick = (e) => {
      if (e.target.closest('button[data-music-toggle]')) return
      if (audioRef.current && !isMusicPlaying && !isUserInteracted) {
        audioRef.current.play()
          .then(() => {
            setIsMusicPlaying(true)
            setIsUserInteracted(true)
          })
          .catch(() => {})
      }
    }
    document.addEventListener('click', handleFirstClick)
    return () => document.removeEventListener('click', handleFirstClick)
  }, [isMusicPlaying, isUserInteracted])

  const toggleMusic = (e) => {
    e.stopPropagation()
    if (!audioRef.current) return
    if (isMusicPlaying) {
      audioRef.current.pause()
      setIsMusicPlaying(false)
    } else {
      audioRef.current.play()
        .then(() => {
          setIsMusicPlaying(true)
          setIsUserInteracted(true)
        })
        .catch((err) => console.log('Ошибка воспроизведения:', err))
    }
  }

  // 🔄 Восстанавливаем экран из URL при загрузке
  const getInitialScreen = () => {
    const params = new URLSearchParams(window.location.search)
    const saved = params.get('screen')
    if (saved === 'map' || saved === 'village') return saved
    return 'welcome'
  }

  // Состояния
  const [screen, setScreen] = useState(getInitialScreen)
  const [me, setMe] = useState(null)
  const [tribe, setTribe] = useState(null)
  const [settlements, setSettlements] = useState([])
  const [settlementsError, setSettlementsError] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sessionResults, setSessionResults] = useState(null)
  const [sessionWinner, setSessionWinner] = useState(null)

  // 💾 Сохраняем экран в URL при изменении
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (screen === 'map' || screen === 'village') {
      params.set('screen', screen)
      window.history.replaceState({}, '', '?' + params.toString())
    } else {
      params.delete('screen')
      window.history.replaceState({}, '', '?' + params.toString())
    }
  }, [screen])

  const pokazat = useCallback((text) => {
    setMessage(text)
    setTimeout(() => setMessage(''), SKRYT_CHEREZ)
  }, [])

  const fetchMe = useCallback(() => {
    return axios.get(`${API_URL}/api/me/`)
      .then((r) => { setMe(r.data); return r.data })
      .catch((e) => { console.error('Ошибка запроса /api/me/:', e); setMe(null); return null })
  }, [])

  const fetchTribe = useCallback(() => {
    return axios.get(`${API_URL}/api/tribe/`)
      .then((r) => setTribe(r.data))
      .catch((e) => {
        if (e.response?.status === 403 && e.response?.data?.results) {
          setSessionResults(e.response.data.results)
          setSessionWinner(e.response.data.winner)
        }
        console.error('Ошибка загрузки племени:', e)
      })
  }, [])

  const fetchSettlements = useCallback(() => {
    return axios.get(`${API_URL}/api/settlements/`)
      .then((r) => { setSettlements(Array.isArray(r.data) ? r.data : []); setSettlementsError('') })
      .catch((e) => {
        console.error('Ошибка загрузки поселений:', e)
        setSettlements([])
        setSettlementsError('Список поселений не загрузился - сервер не отвечает')
      })
  }, [])

  useEffect(() => {
    fetchMe().then((m) => {
      if (m && m.google_configured && !m.authenticated) {
        setLoading(false)
        return
      }
      if (m && m.authenticated) {
        if (screen !== 'map' && screen !== 'village') {
          setScreen('lobby')
        }
        return Promise.all([fetchTribe(), fetchSettlements()])
      }
      setLoading(false)
    }).finally(() => setLoading(false))
  }, [fetchMe, fetchTribe, fetchSettlements])

  const sendAction = (url, successMessage) => {
    axios.post(`${API_URL}${url}`)
      .then((r) => { pokazat(r.data.message || successMessage); fetchTribe() })
      .catch((e) => pokazat('Ошибка: ' + (e.response?.data?.error || e.message)))
  }

  const claim = (slot) => {
    axios.post(`${API_URL}/api/settlements/claim/`, { slot })
      .then((r) => { pokazat(r.data.message || 'Поселение основано'); fetchSettlements(); fetchTribe() })
      .catch((e) => pokazat('Ошибка: ' + (e.response?.data?.error || e.message)))
  }

  // 🔑 ИСПРАВЛЕННЫЙ handleLogin с window.location.replace()
  const handleLogin = () => {
    if (me && me.login_url) {
      window.location.replace(me.login_url)
      return
    }
    
    axios.get(`${API_URL}/api/me/`)
      .then((response) => {
        const data = response.data
        if (data.login_url) {
          window.location.replace(data.login_url)
        } else {
          console.error('login_url не найден в ответе:', data)
          alert('Ошибка: login_url не найден. Проверьте настройки Google OAuth.')
        }
      })
      .catch((error) => {
        console.error('Ошибка загрузки /api/me/:', error)
        alert('Ошибка подключения к серверу. Проверьте, что бэкенд запущен.')
      })
  }

  const handleStartGame = () => {
    setScreen('map')
  }

  // 🚪 Обработчик выхода из окна результатов
  const handleExitResults = () => {
    window.location.href = '/'
  }

  // 🎵 Элементы (объявлены ДО return)
  const audioElement = (
    <audio ref={audioRef} loop src="/music/Prehistoric_Dawn.mp3" />
  )

  const musicButton = (
    <button
      data-music-toggle
      onClick={toggleMusic}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px 16px',
        borderRadius: '30px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        zIndex: 10000,
        fontSize: '20px',
        backdropFilter: 'blur(4px)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
      }}
      title={isMusicPlaying ? 'Выключить музыку' : 'Включить музыку'}
    >
      {isMusicPlaying ? '🔊' : '🔇'}
    </button>
  )

  // Загрузка
  if (loading) {
    return <div className="app__status">Загрузка...</div>
  }

  // Если me ещё не загружен — показываем загрузку
  if (!me) {
    return <div className="app__status">Загрузка...</div>
  }

  // 🏆 Экран результатов (если сессия завершилась)
  if (sessionResults) {
    return (
      <>
        {audioElement}
        <ResultsScreen 
          results={sessionResults} 
          winner={sessionWinner} 
          onExit={handleExitResults} 
        />
      </>
    )
  }

  // Экран входа (если пользователь не авторизован)
  if (!me.authenticated) {
    return (
      <>
        {audioElement}
        <WelcomeScreen onLogin={handleLogin} />
        {musicButton}
      </>
    )
  }

  // Экран лобби (диспозиция)
  if (screen === 'lobby') {
    return (
      <>
        {audioElement}
        <LobbyScreen onStart={handleStartGame} />
        {musicButton}
      </>
    )
  }

  // Кто вошёл (для карты и деревни)
  const who = me && me.authenticated ? (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      background: 'rgba(0,0,0,0.7)',
      padding: '8px 16px',
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backdropFilter: 'blur(4px)',
    }}>
      <span>{me.tribe_name || me.username}</span>
      <a href={me.logout_url} style={{ color: '#ff6b6b', textDecoration: 'none' }}>Выйти</a>
    </div>
  ) : null

  // Экран деревни
  if (screen === 'village') {
    return (
      <>
        {audioElement}
        <Village tribe={tribe} message={message} onAction={sendAction} onBack={() => setScreen('map')} />
        {who}
        <GameControls onSessionEnd={(results, winner) => {
          setSessionResults(results)
          setSessionWinner(winner)
        }} />
        {musicButton}
      </>
    )
  }

  // Экран карты (по умолчанию)
  return (
    <>
      {audioElement}
      <WorldMap settlements={settlements} onClaim={claim} onOpen={() => setScreen('village')} />
      {who}
      <GameControls onSessionEnd={(results, winner) => {
        setSessionResults(results)
        setSessionWinner(winner)
      }} />
      {(message || settlementsError) && (
        <div className="app__toast">{message || settlementsError}</div>
      )}
      {musicButton}
    </>
  )
}

export default App