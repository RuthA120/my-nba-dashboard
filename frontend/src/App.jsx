import { BrowserRouter, Routes, Route } from "react-router-dom";
import Players from "./pages/Players";
import PlayerProfile from "./pages/PlayerProfile";
import Teams from "./pages/Teams";
import RotyTracker from "./pages/RotyTracker";
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserNameCreation from "./pages/UserNameCreation";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/players-search" element={<Players />} />
        <Route path="/players-search/:id" element={<PlayerProfile />} />
        <Route path="/teams-search" element={<Teams />} />
        <Route path="/roty-tracker" element={<RotyTracker />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/username-creation" element={<UserNameCreation />} />
      </Routes>
    </BrowserRouter>
  );
}
