import { useState } from 'react';
import Landing from './screens/Landing';
import Login from './screens/Login';
import Admin from './screens/Admin';
import Camp from './screens/Camp';
import Warehouse from './screens/Warehouse';
import QueryConsole from './screens/QueryConsole';

// Simple state-based router — no library needed for this demo
// Session persists across hot reloads via sessionStorage

export default function App() {
  const [page, setPage] = useState(
    () => sessionStorage.getItem('dras_page') || 'landing'
  );

  const navigate = (target) => {
    sessionStorage.setItem('dras_page', target);
    setPage(target);
  };

  const logout = () => {
    sessionStorage.clear();
    navigate('landing');
  };

  switch (page) {
    case 'landing':       return <Landing onNavigate={navigate} />;
    case 'login':         return <Login onNavigate={navigate} />;
    case 'admin':         return <Admin onNavigate={navigate} onLogout={logout} />;
    case 'camp':          return <Camp onNavigate={navigate} onLogout={logout} />;
    case 'warehouse':     return <Warehouse onNavigate={navigate} onLogout={logout} />;
    case 'queryconsole':  return <QueryConsole onNavigate={navigate} />;
    default:              return <Landing onNavigate={navigate} />;
  }
}
