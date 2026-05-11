import { Navigate, Route, Routes } from 'react-router-dom';

import AppLayout from './layouts/AppLayout';
import TokensPage from './pages/TokensPage';
import TokenDetailPage from './pages/TokenDetailPage';
import SignalsPage from './pages/SignalsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/tokens" replace />} />

        <Route path="tokens" element={<TokensPage />} />

        {/* защита от случайного /tokens/signals */}
        <Route path="tokens/signals" element={<Navigate to="/signals" replace />} />

        <Route path="tokens/:symbol" element={<TokenDetailPage />} />
        <Route path="signals" element={<SignalsPage />} />

        <Route path="*" element={<Navigate to="/tokens" replace />} />
      </Route>
    </Routes>
  );
}