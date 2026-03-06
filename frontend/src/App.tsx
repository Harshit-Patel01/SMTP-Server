import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Inbox from './pages/Inbox';
import MailDetail from './pages/MailDetail';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-wrap">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/mail/:id" element={<MailDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
