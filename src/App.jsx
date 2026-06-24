import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

import AppLayout from '@/components/layout/AppLayout';
import Feed from '@/pages/Feed';
import Messages from '@/pages/Messages';
import Schools from '@/pages/Schools';
import Classroom from '@/pages/Classroom';
import CourseDetail from '@/pages/CourseDetail';
import Communities from '@/pages/Communities';
import CommunityDetail from '@/pages/CommunityDetail';
import Marketplace from '@/pages/Marketplace';
import AITutor from '@/pages/AITutor';
import Notifications from '@/pages/Notifications';
import Profile from '@/pages/Profile';
import Leaderboard from '@/pages/Leaderboard';
import Reels from '@/pages/Reels';
import CampusGroups from '@/pages/CampusGroups';
import CampusGroupDetail from '@/pages/CampusGroupDetail';
import Planner from '@/pages/Planner';
import Settings from '@/pages/Settings';
import SavedPosts from '@/pages/SavedPosts';
import About from '@/pages/About';
import Contact from '@/pages/Contact';

import AdminLayout from '@/components/admin/AdminLayout';
import AdminOverview from '@/pages/admin/AdminOverview';
import AdminCommission from '@/pages/admin/AdminCommission';
import AdminAds from '@/pages/admin/AdminAds';
import AdminAdvertisers from '@/pages/admin/AdminAdvertisers';
import AdminWallet from '@/pages/admin/AdminWallet';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminNotifications from '@/pages/admin/AdminNotifications';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminWithdrawals from '@/pages/admin/AdminWithdrawals';
import AdminReports from '@/pages/admin/AdminReports';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminMarketplace from '@/pages/admin/AdminMarketplace';
import AdminReelsModeration from '@/pages/admin/AdminReelsModeration';
import SchoolDetail from '@/pages/SchoolDetail';
import AdvertiserPortal from '@/pages/advertiser/AdvertiserPortal';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl gradient-brand flex items-center justify-center shadow-2xl animate-float">
            <span className="text-white font-black text-3xl">S</span>
          </div>
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Loading StudentOS...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Feed />} />
          <Route path="/schools" element={<Schools />} />
          <Route path="/schools/:id" element={<SchoolDetail />} />
          <Route path="/classroom" element={<Classroom />} />
          <Route path="/classroom/:id" element={<CourseDetail />} />
          <Route path="/communities" element={<Communities />} />
          <Route path="/communities/:id" element={<CommunityDetail />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/ai-tutor" element={<AITutor />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile/:email" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/campus" element={<CampusGroups />} />
          <Route path="/campus/:id" element={<CampusGroupDetail />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/saved" element={<SavedPosts />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Route>
      </Route>

      {/* Admin routes — admin role only */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} adminOnly />}>
        <Route element={<AdminLayout user={user} />}>
          <Route path="/admin" element={<AdminOverview />} />
          <Route path="/admin/commission" element={<AdminCommission />} />
          <Route path="/admin/ads" element={<AdminAds />} />
          <Route path="/admin/advertisers" element={<AdminAdvertisers />} />
          <Route path="/admin/wallet" element={<AdminWallet />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/marketplace" element={<AdminMarketplace />} />
          <Route path="/admin/reels" element={<AdminReelsModeration />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
        </Route>
      </Route>

      {/* Advertiser Portal — self-contained with its own auth */}
      <Route path="/advertiser/*" element={<AdvertiserPortal />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;