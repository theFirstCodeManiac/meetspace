import React, { createContext, useContext, useState, useEffect } from 'react';
import { Route } from '../types';

export interface JoinMediaConfig {
  initialAudio?: boolean;
  initialVideo?: boolean;
  guestName?: string;
}

interface NavigationContextType {
  currentRoute: Route;
  meetingCode?: string;
  meetingCodeParam?: string;
  joinConfig: JoinMediaConfig;
  setJoinConfig: (config: JoinMediaConfig) => void;
  navigate: (route: Route, param?: string, config?: JoinMediaConfig) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [joinConfig, setJoinConfig] = useState<JoinMediaConfig>({
    initialAudio: true,
    initialVideo: true,
  });

  const [currentRoute, setCurrentRoute] = useState<Route>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash.startsWith('room/')) return 'meeting-room';
    if (hash.startsWith('meet/')) return 'room-preview';
    if (hash === 'meeting-ended') return 'meeting-ended';
    if (hash === 'login') return 'login';
    if (hash === 'register') return 'register';
    if (hash === 'forgot-password') return 'forgot-password';
    if (hash === 'reset-password') return 'reset-password';
    if (hash === 'dashboard') return 'dashboard';
    if (hash === 'scheduled-meetings') return 'scheduled-meetings';
    if (hash === 'meeting-history') return 'meeting-history';
    if (hash === 'profile-settings') return 'profile-settings';
    return 'landing';
  });

  const [meetingCodeParam, setMeetingCodeParam] = useState<string | undefined>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash.startsWith('room/')) {
      return hash.replace('room/', '');
    }
    if (hash.startsWith('meet/')) {
      return hash.replace('meet/', '');
    }
    return undefined;
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('room/')) {
        const code = hash.replace('room/', '');
        setMeetingCodeParam(code);
        setCurrentRoute('meeting-room');
      } else if (hash.startsWith('meet/')) {
        const code = hash.replace('meet/', '');
        setMeetingCodeParam(code);
        setCurrentRoute('room-preview');
      } else if (hash) {
        setCurrentRoute(hash as Route);
      } else {
        setCurrentRoute('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (route: Route, param?: string, config?: JoinMediaConfig) => {
    if (config) {
      setJoinConfig(config);
    }

    if (route === 'room-preview' && param) {
      setMeetingCodeParam(param);
      window.location.hash = `meet/${param}`;
    } else if (route === 'meeting-room' && param) {
      setMeetingCodeParam(param);
      window.location.hash = `room/${param}`;
    } else if (route === 'meeting-ended') {
      window.location.hash = 'meeting-ended';
    } else {
      setMeetingCodeParam(undefined);
      window.location.hash = route === 'landing' ? '' : route;
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <NavigationContext.Provider
      value={{
        currentRoute,
        meetingCode: meetingCodeParam,
        meetingCodeParam,
        joinConfig,
        setJoinConfig,
        navigate,
        goBack,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
};

