import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inbox from './pages/Inbox';
import Leads from './pages/Leads';
import ClientProfile from './pages/ClientProfile';
import Calls from './pages/Calls';
import Emails from './pages/Emails';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import Messenger from './pages/Messenger';
import Sent from './pages/Sent';


function App() {
  const basename = window.location.pathname.startsWith('/lead') ? '/lead' : '/';
  return (
    <Router basename={basename}>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<Layout />}>
             <Route path="/" element={<Dashboard />} />
             <Route path="/dashboard" element={<Dashboard />} />
             <Route path="/inbox" element={<Inbox />} />
             <Route path="/leads" element={<Leads />} />
             <Route path="/clients/:id" element={<ClientProfile />} />
             <Route path="/calls" element={<Calls />} />
             <Route path="/emails" element={<Emails />} />
             <Route path="/calendar" element={<Calendar />} /> 
             <Route path="/settings" element={<Settings />} /> 
             <Route path="/messenger" element={<Messenger />} /> 
             <Route path="/sent" element={<Sent />} /> 
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
