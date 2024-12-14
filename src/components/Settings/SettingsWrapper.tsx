import React, { Suspense } from 'react';
import LoadingScreen from '../LoadingScreen';
import UserProgress from '../UserProfile/UserProgress';
import UserProfile from '../UserProfile/ProfileDashboard';
import Settings from './Settings';

export default function SettingsWrapper() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <div className="space-y-6">
        <UserProgress />
        <UserProfile />
        <Settings />
      </div>
    </Suspense>
  );
} 