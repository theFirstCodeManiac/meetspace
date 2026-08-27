import React, { useState } from 'react';
import { usePWA, DevicePlatform } from '../../context/PWAContext';
import {
  Download,
  Smartphone,
  Monitor,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Sparkles,
  Zap,
  ShieldCheck,
  Video,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const InstallAppModal: React.FC = () => {
  const {
    isModalOpen,
    isInstalled,
    isInstallable,
    platform,
    browser,
    closeInstallModal,
    installApp,
    downloadDesktopShortcut,
  } = usePWA();

  const [activeTab, setActiveTab] = useState<'recommended' | 'ios' | 'android' | 'desktop'>('recommended');
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isModalOpen || isInstalled) return null;

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      const success = await installApp();
      if (!success) {
        // If native prompt wasn't triggered or was cancelled, switch to manual guide tab
        if (platform === 'ios') setActiveTab('ios');
        else if (platform === 'android') setActiveTab('android');
        else setActiveTab('desktop');
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const handleClose = () => {
    closeInstallModal(dontShowAgain);
  };

  return (
    <AnimatePresence>
      <div
        id="pwa-install-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-modal-title"
      >
        <motion.div
          id="pwa-install-modal-card"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header Banner */}
          <div className="relative p-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white overflow-hidden shrink-0">
            {/* Background glowing shapes */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-12 translate-x-12 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-xl translate-y-8 -translate-x-8 pointer-events-none" />

            <button
              id="pwa-modal-close-btn"
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-inner flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold tracking-wide uppercase">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Progressive Web App
              </div>
            </div>

            <h2 id="pwa-modal-title" className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Install MeetSpace App
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100/90 mt-1 max-w-sm">
              Get the standalone desktop & mobile experience with instant access, fullscreen video calls, and offline resilience.
            </p>
          </div>

          {/* Platform Tabs */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 pt-2 shrink-0">
            <button
              id="pwa-tab-recommended"
              onClick={() => setActiveTab('recommended')}
              className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'recommended'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Quick Install</span>
            </button>
            <button
              id="pwa-tab-desktop"
              onClick={() => setActiveTab('desktop')}
              className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'desktop'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop / PC</span>
            </button>
            <button
              id="pwa-tab-ios"
              onClick={() => setActiveTab('ios')}
              className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ios'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iOS / iPhone</span>
            </button>
            <button
              id="pwa-tab-android"
              onClick={() => setActiveTab('android')}
              className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'android'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android</span>
            </button>
          </div>

          {/* Modal Body Content */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
            {activeTab === 'recommended' && (
              <div className="space-y-4">
                {/* Benefits List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs block">1-Click Launch</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Launch directly from your dock or home screen without browser tabs.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0">
                      <Monitor className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs block">Fullscreen Calls</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Immersive edge-to-edge video stage with zero address bar distraction.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs block">Fast & Secure</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Hardware-accelerated WebRTC media and encrypted signaling.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0">
                      <Download className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs block">Lightweight</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">No bulky 200MB installer. Installs in 1 second using PWA technology.</span>
                    </div>
                  </div>
                </div>

                {/* Main Action Button */}
                <div className="pt-2">
                  <button
                    id="pwa-primary-install-btn"
                    onClick={handleInstallClick}
                    disabled={isInstalling}
                    className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isInstalling ? 'Opening Installer...' : 'Install MeetSpace Now'}</span>
                  </button>

                  <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                    Works on Chrome, Edge, Safari, Android, Mac & Windows.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'desktop' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  You can install MeetSpace on your Windows PC, Mac, or Linux computer using the browser app menu or by downloading a desktop launcher shortcut:
                </p>

                {/* Step Instructions */}
                <div className="space-y-2">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block text-xs">Address Bar Install Icon</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">In Chrome or Edge, look for the <strong className="text-indigo-400">Install MeetSpace</strong> icon on the right side of the address bar.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block text-xs">Or Browser Menu</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Click <strong>Menu (⋮) &rarr; Save and share &rarr; Install MeetSpace</strong> or <strong>Create Shortcut (Open as window)</strong>.</span>
                    </div>
                  </div>
                </div>

                {/* Instant Shortcut Download Buttons */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 block mb-2">
                    Download Launchers & Shortcuts:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      id="download-win-shortcut-btn"
                      onClick={() => downloadDesktopShortcut('url')}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Laptop className="w-4 h-4 text-indigo-500" />
                      <span>Windows Shortcut (.url)</span>
                    </button>

                    <button
                      id="download-html-launcher-btn"
                      onClick={() => downloadDesktopShortcut('html')}
                      className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Universal App Launcher (.html)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ios' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  To install on iPhone or iPad using Safari:
                </p>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Share className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block text-xs">Step 1: Tap the Share Button</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Tap the Share icon at the bottom of the Safari browser screen.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <PlusSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block text-xs">Step 2: Add to Home Screen</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Scroll down the action sheet and tap <strong className="text-indigo-400">"Add to Home Screen"</strong>.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block text-xs">Step 3: Tap "Add"</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">MeetSpace will now appear as an app icon on your iOS home screen!</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'android' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  To install on Android phones or tablets using Chrome or Samsung Internet:
                </p>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block text-xs">Tap "Install App" Prompt</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Tap the button below to launch Android's native installation banner.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block text-xs">Or Browser Menu (⋮)</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Tap Chrome's 3-dot menu and select <strong className="text-indigo-400">"Install app"</strong> or <strong className="text-indigo-400">"Add to Home screen"</strong>.</span>
                    </div>
                  </div>
                </div>

                <button
                  id="android-pwa-install-trigger"
                  onClick={handleInstallClick}
                  className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Install on Android Device</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between gap-2 shrink-0">
            <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-500 dark:text-slate-400 select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
              />
              <span>Don't show again</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                id="pwa-modal-later-btn"
                onClick={handleClose}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
