import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../components/Toast';
import { BackgammonPage } from '../games/backgammon/BackgammonPage';
import { CheckersPage } from '../games/checkers/CheckersPage';
import { ConnectFourPage } from '../games/connect-four/ConnectFourPage';
import { Home } from '../pages/Home';
import { SettingsProvider } from './settings';

/** On GitHub Pages the app lives under /three-classics-lite/; in dev and tests it's at the root. */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <BrowserRouter basename={basename}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/connect-four" element={<ConnectFourPage />} />
            <Route path="/checkers" element={<CheckersPage />} />
            <Route path="/backgammon" element={<BackgammonPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </SettingsProvider>
  );
}
