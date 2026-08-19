import { LanguageProvider } from './lib/LanguageContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Contact = lazy(() => import('./pages/Contact'));
const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Rewards = lazy(() => import('./pages/Rewards'));
const Favourites = lazy(() => import('./pages/Favourites'));
const AIStudio = lazy(() => import('./pages/AIStudio'));
import ScrollToTop from './components/ScrollToTop';
import AnalyticsTracker from './components/AnalyticsTracker';

export default function App() {
  return (
    <LanguageProvider>
    <Router>
      <ScrollToTop />
      <AnalyticsTracker />
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center">
  <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
</div>}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="services" element={<Services />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="contact" element={<Contact />} />
          <Route path="admin" element={<Admin />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="favourites" element={<Favourites />} />
          <Route path="ai-studio" element={<AIStudio />} />
        </Route>
      </Routes>
      </Suspense>
    </Router>
    </LanguageProvider>
  );
}
