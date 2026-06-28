
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="rounded-md bg-blue-500 w-8 h-8 flex items-center justify-center">
              <span className="text-white font-medium">BI</span>
            </div>
            <span className="font-medium text-gray-900">Business Insight</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`text-sm ${location.pathname === '/' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Home
            </Link>
            <Link 
              to="/onboarding" 
              className={`text-sm ${location.pathname === '/onboarding' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Create Plan
            </Link>
            <Link 
              to="/dashboard" 
              className={`text-sm ${location.pathname === '/dashboard' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Dashboard
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <button className="text-sm px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors">
              Sign In
            </button>
            <button className="text-sm px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors">
              Register
            </button>
          </div>
        </div>
      </header>
      
      {!isHome && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Home</Link>
            <ChevronRight size={14} className="mx-2" />
            <span className="font-medium text-gray-900">{location.pathname.substring(1).charAt(0).toUpperCase() + location.pathname.slice(2)}</span>
          </div>
        </div>
      )}
      
      <main className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="page-container"
        >
          {children}
        </motion.div>
      </main>
      
      <footer className="bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Business Insight</h3>
              <p className="text-sm text-gray-500">Generate comprehensive business plans powered by AI and expert analysis.</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-sm text-gray-500 hover:text-gray-700">Features</Link></li>
                <li><Link to="/" className="text-sm text-gray-500 hover:text-gray-700">Pricing</Link></li>
                <li><Link to="/" className="text-sm text-gray-500 hover:text-gray-700">Case Studies</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-sm text-gray-500 hover:text-gray-700">About</Link></li>
                <li><Link to="/" className="text-sm text-gray-500 hover:text-gray-700">Blog</Link></li>
                <li><Link to="/" className="text-sm text-gray-500 hover:text-gray-700">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-sm text-gray-500 hover:text-gray-700">Privacy Policy</Link></li>
                <li><Link to="/" className="text-sm text-gray-500 hover:text-gray-700">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-400 text-center">© {new Date().getFullYear()} Business Insight. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
