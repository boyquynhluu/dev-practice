import { createContext, useContext, useEffect } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { syncProgress } from './api/progress.js';
import { TRACKS } from './api/tracks.js';
import { useTheme } from './hooks/useTheme.js';
import HomePage from './pages/HomePage.jsx';
import LessonPage from './pages/LessonPage.jsx';
import RoadmapPage from './pages/RoadmapPage.jsx';
import TrackPage from './pages/TrackPage.jsx';

const ThemeContext = createContext('light');
export const useThemeName = () => useContext(ThemeContext);

export default function App() {
  const [theme, toggleTheme] = useTheme();
  useEffect(() => {
    syncProgress();
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      <header className="topbar">
        <Link to="/" className="brand">⌘ Dev Practice</Link>
        <nav className="topnav">
          {Object.values(TRACKS).map((t) => (
            <NavLink key={t.id} to={`/track/${t.id}`}>{t.icon} {t.name}</NavLink>
          ))}
          <NavLink to="/roadmap">🗺 Roadmap BE</NavLink>
        </nav>
        <button type="button" className="icon-btn" onClick={toggleTheme} title="Đổi giao diện sáng/tối">
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/track/:track" element={<TrackPage />} />
        <Route path="/lesson/:track/:id" element={<LessonPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="*" element={<main className="page"><h1>404</h1><Link to="/">Về trang chủ</Link></main>} />
      </Routes>
    </ThemeContext.Provider>
  );
}
