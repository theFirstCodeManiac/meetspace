/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { AppLayout } from './components/layout/AppLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ScheduledMeetingsPage } from './pages/ScheduledMeetingsPage';
import { MeetingHistoryPage } from './pages/MeetingHistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { MeetingRoomPreview } from './pages/MeetingRoomPreview';
import { MeetingRoomPage } from './pages/MeetingRoomPage';
import { MeetingEndedPage } from './pages/MeetingEndedPage';
import { WebRTCProvider } from './context/WebRTCContext';

const AppRoutes: React.FC = () => {
  const { currentRoute, meetingCodeParam, joinConfig } = useNavigation();

  switch (currentRoute) {
    case 'login':
      return <LoginPage />;
    case 'register':
      return <RegisterPage />;
    case 'forgot-password':
      return <ForgotPasswordPage />;
    case 'reset-password':
      return <ResetPasswordPage />;
    case 'dashboard':
      return <DashboardPage />;
    case 'scheduled-meetings':
      return <ScheduledMeetingsPage />;
    case 'meeting-history':
      return <MeetingHistoryPage />;
    case 'profile-settings':
      return <ProfilePage />;
    case 'room-preview':
      return <MeetingRoomPreview />;
    case 'meeting-room':
      return (
        <WebRTCProvider
          meetingCode={meetingCodeParam || 'eng-sync-dev'}
          initialAudio={joinConfig.initialAudio}
          initialVideo={joinConfig.initialVideo}
          guestName={joinConfig.guestName}
        >
          <MeetingRoomPage />
        </WebRTCProvider>
      );
    case 'meeting-ended':
      return <MeetingEndedPage />;
    case 'landing':
    default:
      return <LandingPage />;
  }
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <NavigationProvider>
            <AppLayout>
              <AppRoutes />
            </AppLayout>
          </NavigationProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
