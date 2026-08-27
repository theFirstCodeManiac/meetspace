import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type DevicePlatform = 'ios' | 'android' | 'windows' | 'mac' | 'linux' | 'other';
export type BrowserType = 'chrome' | 'edge' | 'safari' | 'firefox' | 'opera' | 'samsung' | 'other';

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isModalOpen: boolean;
  platform: DevicePlatform;
  browser: BrowserType;
  openInstallModal: () => void;
  closeInstallModal: (dontAskAgain?: boolean) => void;
  installApp: () => Promise<boolean>;
  downloadDesktopShortcut: (format?: 'html' | 'url' | 'desktop') => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

const DISMISSED_KEY = 'meetspace_pwa_install_dismissed';

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [platform, setPlatform] = useState<DevicePlatform>('other');
  const [browser, setBrowser] = useState<BrowserType>('other');
  const { success, info } = useToast();

  // Detect Platform & Browser
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    
    // Platform detection
    if (/iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else if (/win/.test(userAgent) || /windows/.test(userAgent)) {
      setPlatform('windows');
    } else if (/mac/.test(userAgent)) {
      setPlatform('mac');
    } else if (/linux/.test(userAgent)) {
      setPlatform('linux');
    } else {
      setPlatform('other');
    }

    // Browser detection
    if (/edg\//.test(userAgent)) {
      setBrowser('edge');
    } else if (/samsungbrowser/.test(userAgent)) {
      setBrowser('samsung');
    } else if (/opr\/|opera/.test(userAgent)) {
      setBrowser('opera');
    } else if (/chrome|crios/.test(userAgent) && !/edg\//.test(userAgent)) {
      setBrowser('chrome');
    } else if (/safari/.test(userAgent) && !/chrome|crios/.test(userAgent)) {
      setBrowser('safari');
    } else if (/firefox|fxios/.test(userAgent)) {
      setBrowser('firefox');
    } else {
      setBrowser('other');
    }

    // Check if already in standalone display mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
    }
  }, []);

  // Listen to beforeinstallprompt & appinstalled
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);

      // Auto-open modal after a polite delay if not previously dismissed
      const isDismissed = localStorage.getItem(DISMISSED_KEY);
      if (!isDismissed) {
        const timer = setTimeout(() => {
          setIsModalOpen(true);
        }, 2200);
        return () => clearTimeout(timer);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsModalOpen(false);
      success('MeetSpace Installed!', 'You can now launch MeetSpace directly from your home screen or desktop.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // If beforeinstallprompt didn't trigger (e.g. iOS or already loaded), still show download modal once for visitors if not dismissed
    const fallbackTimer = setTimeout(() => {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      const isDismissed = localStorage.getItem(DISMISSED_KEY);

      if (!isStandalone && !isDismissed) {
        setIsModalOpen(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(fallbackTimer);
    };
  }, [success]);

  const openInstallModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeInstallModal = useCallback((dontAskAgain = false) => {
    setIsModalOpen(false);
    if (dontAskAgain) {
      localStorage.setItem(DISMISSED_KEY, 'true');
    }
  }, []);

  // Main install trigger
  const installApp = useCallback(async (): Promise<boolean> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          success('Installing MeetSpace App', 'Adding MeetSpace to your device applications.');
          setDeferredPrompt(null);
          setIsInstallable(false);
          setIsModalOpen(false);
          return true;
        } else {
          info('Installation postponed', 'You can install MeetSpace anytime from the header menu.');
          return false;
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }
    return false;
  }, [deferredPrompt, success, info]);

  // Generate & trigger downloadable desktop / mobile shortcut file
  const downloadDesktopShortcut = useCallback((format: 'html' | 'url' | 'desktop' = 'html') => {
    const currentUrl = window.location.origin;
    const appName = 'MeetSpace Video Conferencing';

    if (format === 'url') {
      // Windows Internet Shortcut
      const fileContent = `[InternetShortcut]\nURL=${currentUrl}/\nIconIndex=0\nIconFile=${currentUrl}/favicon.svg\n`;
      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'MeetSpace-App.url';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('Desktop Shortcut Downloaded', 'Double-click MeetSpace-App.url on your desktop to launch.');
    } else if (format === 'desktop') {
      // Linux Desktop Entry
      const fileContent = `[Desktop Entry]\nVersion=1.0\nName=${appName}\nComment=Enterprise-grade WebRTC Video Conferencing\nExec=xdg-open ${currentUrl}\nIcon=${currentUrl}/icon-192.svg\nTerminal=false\nType=Application\nCategories=Network;AudioVideo;\n`;
      const blob = new Blob([fileContent], { type: 'application/x-desktop;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'meetspace.desktop';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('Linux Shortcut Downloaded', 'Placed meetspace.desktop ready for your desktop launcher.');
    } else {
      // Universal Standalone Web App HTML Launcher
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${appName} Launcher</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      background: #090d16;
      color: #f8fafc;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }
    .card {
      background: #1e293b;
      padding: 2.5rem;
      border-radius: 1.5rem;
      border: 1px solid #334155;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      max-width: 420px;
    }
    .btn {
      background: #4f46e5;
      color: white;
      text-decoration: none;
      padding: 0.85rem 1.75rem;
      border-radius: 0.75rem;
      font-weight: 600;
      display: inline-block;
      margin-top: 1.5rem;
      box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
    }
    .btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 3rem; margin-bottom: 0.5rem;">🎥</div>
    <h2 style="margin: 0 0 0.5rem 0;">Launching ${appName}</h2>
    <p style="color: #94a3b8; font-size: 0.9rem;">Redirecting to your secure video conferencing workspace...</p>
    <a href="${currentUrl}" class="btn" id="launchBtn">Open MeetSpace Now</a>
  </div>
  <script>
    // Open in standalone popup or redirect
    window.location.href = "${currentUrl}";
  </script>
</body>
</html>`;
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'Launch-MeetSpace.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('App Launcher Downloaded', 'Keep Launch-MeetSpace.html on your desktop for 1-click launch.');
    }
  }, [success]);

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isModalOpen,
        platform,
        browser,
        openInstallModal,
        closeInstallModal,
        installApp,
        downloadDesktopShortcut,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = (): PWAContextType => {
  const ctx = useContext(PWAContext);
  if (!ctx) throw new Error('usePWA must be used within PWAProvider');
  return ctx;
};
