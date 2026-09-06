import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import ClientProfile from './pages/ClientProfile';
import Settings from './pages/Settings';
import Automations from './pages/Automations';
import AutomationBuilder from './pages/AutomationBuilder';
import EmailTemplates from './pages/EmailTemplates';
import EmailTemplateEditor from './pages/EmailTemplateEditor';
import FollowUps from './pages/FollowUps';

function App() {
  const pathname = window.location.pathname;
  const basename = (pathname === '/lead' || pathname.startsWith('/lead/')) ? '/lead' : '/';
  return (
    <Router basename={basename}>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<Layout />}>
             <Route path="/" element={<Dashboard />} />
             <Route path="/dashboard" element={<Dashboard />} />
             <Route path="/leads" element={<Leads />} />
             <Route path="/clients/:id" element={<ClientProfile />} />
             <Route path="/settings" element={<Settings />} /> 
             <Route path="/automations" element={<Automations />} />
             <Route path="/automations/new" element={<AutomationBuilder />} />
             <Route path="/automations/:id/edit" element={<AutomationBuilder />} />
             <Route path="/templates" element={<EmailTemplates />} />
             <Route path="/templates/new" element={<EmailTemplateEditor />} />
             <Route path="/templates/:id/edit" element={<EmailTemplateEditor />} />
             <Route path="/followups" element={<FollowUps />} />
             {/* Redirect any legacy inbox/sent/emails to leads */}
             <Route path="/inbox" element={<Navigate to="/leads" replace />} />
             <Route path="/sent" element={<Navigate to="/leads" replace />} />
             <Route path="/emails" element={<Navigate to="/leads" replace />} />
             <Route path="*" element={<Navigate to="/leads" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
