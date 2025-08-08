import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Users, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Sparkles,
  Heart,
  Crown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useGenderColors } from '../../hooks/useGenderColors';
import ThemeToggle from '../ui/ThemeToggle';
import GenderColorsToggle from '../ui/GenderColorsToggle';
import { AnimatePresence } from 'framer-motion';

/**
 * Layout ultra moderne avec design glassmorphism
 * Navigation fluide et animations élégantes
 */
const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { showGenderColors } = useGenderColors();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
  };

  const navigationItems = [
    { name: 'Accueil', href: '/', icon: Home, color: 'from-blue-500 to-blue-600' },
    { name: 'Arbres', href: '/dashboard', icon: Users, color: 'from-green-500 to-green-600' },
    { name: 'Profil', href: '/profile', icon: User, color: 'from-purple-500 to-purple-600' },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Fond avec gradient animé */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
        {/* Motifs de fond animés */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-r from-pink-400 to-red-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-20 left-40 w-72 h-72 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
      </div>

      {/* Navigation principale */}
      <nav className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo et titre */}
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  GeneaTree
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Arbres généalogiques modernes
                </p>
              </div>
            </motion.div>

            {/* Navigation desktop */}
            <div className="hidden md:flex items-center gap-6">
              {navigationItems.map((item, index) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className="group relative px-4 py-2 rounded-xl transition-all duration-200 hover:bg-white/20 backdrop-blur-sm"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-gradient-to-r ${item.color} text-white`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {item.name}
                    </span>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Contrôles et profil */}
            <div className="flex items-center gap-4">
              {/* Toggles */}
              <div className="hidden md:flex items-center gap-2">
                <ThemeToggle />
                <GenderColorsToggle />
              </div>

              {/* Profil utilisateur */}
              {user && (
                <motion.div 
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={handleLogout}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors group"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Se déconnecter"
                  >
                    <LogOut className="w-4 h-4 text-red-600 group-hover:text-red-700" />
                  </motion.button>
                </motion.div>
              )}

              {/* Menu mobile */}
              <motion.button
                className="md:hidden p-2 hover:bg-white/20 rounded-xl transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden absolute top-full left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-white/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-4 py-6 space-y-4">
                {/* Navigation mobile */}
                <div className="space-y-2">
                  {navigationItems.map((item, index) => (
                    <motion.a
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${item.color} text-white`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {item.name}
                      </span>
                    </motion.a>
                  ))}
                </div>

                {/* Toggles mobile */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Paramètres
                  </span>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <GenderColorsToggle />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Contenu principal */}
      <main className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer moderne */}
      <footer className="relative z-10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    GeneaTree
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Créez et partagez vos arbres généalogiques
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>© 2024 GeneaTree</span>
                <span>•</span>
                <span>Propulsé par React & Node.js</span>
                <span>•</span>
                <span>Design moderne</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;