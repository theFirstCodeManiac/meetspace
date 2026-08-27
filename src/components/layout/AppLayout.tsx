import React from 'react';
import { Navbar } from './Navbar';
import { useNavigation } from '../../context/NavigationContext';
import { usePWA } from '../../context/PWAContext';
import { Download } from 'lucide-react';

export interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { currentRoute } = useNavigation();
  const { openInstallModal, isInstalled } = usePWA();

  // In active meeting room or ended page, navbar and footer are omitted for full-screen immersive video stage
  const isFullRoom = currentRoute === 'meeting-room' || currentRoute === 'meeting-ended';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-indigo-500 selection:text-white">
      {!isFullRoom && <Navbar />}
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {!isFullRoom && (
        <footer 
          id="main-footer"
          className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-6 px-4 sm:px-6 lg:px-8 mt-auto"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">MeetSpace Video Conferencing</span>
              <span>•</span>
              <span>Encrypted WebRTC Media & WebSocket Signaling</span>
            </div>
            <div className="flex items-center gap-4">
              {!isInstalled && (
                <button
                  id="footer-download-app-btn"
                  onClick={openInstallModal}
                  className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download App (PWA)</span>
                </button>
              )}
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                STUN/TURN Operational
              </span>
              <span>•</span>
              <span>v1.0.0</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

