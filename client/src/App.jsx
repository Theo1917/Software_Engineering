import { Navigate, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";
import DiscussionsPage from "./pages/DiscussionsPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import MyTasksPage from "./pages/MyTasksPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import TasksPage from "./pages/TasksPage";
import TechNewsPage from "./pages/TechNewsPage";
import TaskDetailsPage from "./pages/TaskDetailsPage";
import SubmissionPage from "./pages/SubmissionPage";
import RatingsPage from "./pages/RatingsPage";
import NotificationsPage from "./pages/NotificationsPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import TeamsPage from "./pages/TeamsPage";
import AdvancedSearchPage from "./pages/AdvancedSearchPage";
import TrendingTasksPage from "./pages/TrendingTasksPage";
import SmartRecommendationsPage from "./pages/SmartRecommendationsPage";

export default function App() {
  return (
    <div className="page-shell min-h-screen bg-obsidian text-text">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/task/:taskId" element={<TaskDetailsPage />} />
          <Route
            path="/my-tasks"
            element={
              <ProtectedRoute>
                <MyTasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/task/:taskId/submit"
            element={
              <ProtectedRoute>
                <SubmissionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/task/:taskId/rate"
            element={
              <ProtectedRoute>
                <RatingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/discussions" element={<DiscussionsPage />} />
          <Route path="/tech-news" element={<TechNewsPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPanelPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <TeamsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/search" element={<AdvancedSearchPage />} />
          <Route path="/trending" element={<TrendingTasksPage />} />
          <Route
            path="/recommendations"
            element={
              <ProtectedRoute>
                <SmartRecommendationsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
