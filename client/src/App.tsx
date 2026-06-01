import { Route, Switch } from "wouter";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary";
import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import "./lib/i18n";


import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import ModeratorProtectedRoute from "./components/ModeratorProtectedRoute";
import WhatsAppButton from "./components/WhatsAppButton";


// Lazy Loaded Pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Files = lazy(() => import("./pages/Files"));
const Upload = lazy(() => import("./pages/Upload"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Courses = lazy(() => import("./pages/Courses"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const ModeratorPanel = lazy(() => import("./pages/ModeratorPanel"));

function Router() {
  const { user, loading, refresh } = useAuth();
  const [location, navigate] = useLocation();
  const [showSemesterModal, setShowSemesterModal] = useState(false);

  const checkSemesterMutation = trpc.auth.checkSemesterStatus.useMutation({
    onSuccess: () => {
      setShowSemesterModal(false);
      refresh();
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const resetCoursesMutation = trpc.auth.resetMyCourses.useMutation({
    onSuccess: () => {
      setShowSemesterModal(false);
      refresh();
      navigate("/onboarding", { replace: true });
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  useEffect(() => {
    if (loading) return;


    if (!user) return;
    
    // 30-Day Check Logic
    if (!user.isAdmin && user.coursesUpdatedAt) {
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const timePassed = Date.now() - new Date(user.coursesUpdatedAt).getTime();
      const hasCourses = user.enrolledCourses && user.enrolledCourses.length > 0;
      
      if (timePassed > thirtyDays && hasCourses) {
        setShowSemesterModal(true);
      }
    }

    // Admin bypass for student guards
    if (user.isAdmin) return;

    // The redirection logic has been moved to ProtectedRoute.tsx to prevent conflicts and infinite loops.
    // App.tsx now only handles global modals like the 30-day semester check.
  }, [user, loading, location, navigate, refresh]);

  return (
    <>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/admin-login" component={AdminLogin} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/register" component={Register} />
          <Route path="/privacy" component={PrivacyPolicy} />
          
          {/* Protected Routes Middleware */}
          <Route path="/onboarding">
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          </Route>
          <Route path="/my-subjects">
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          </Route>
          <Route path="/files">
            <ProtectedRoute>
              <Files />
            </ProtectedRoute>
          </Route>
          <Route path="/upload">
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          </Route>
          <Route path="/profile">
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </Route>
          <Route path="/leaderboard">
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          </Route>
          <Route path="/courses">
            <ProtectedRoute>
              <Courses />
            </ProtectedRoute>
          </Route>

          <Route path="/admin">
            <AdminProtectedRoute>
              <Admin />
            </AdminProtectedRoute>
          </Route>
          <Route path="/moderator/panel">
            <ModeratorProtectedRoute>
              <ModeratorPanel />
            </ModeratorProtectedRoute>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </Suspense>

      <Dialog open={showSemesterModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-md bg-card/90 backdrop-blur-2xl border-border rounded-[2.5rem] p-10 outline-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center mb-4 text-primary">فحص الفصل الدراسي 🕒</DialogTitle>
            <DialogDescription className="text-center font-bold text-muted-foreground leading-relaxed">
              لقد مر أكثر من 30 يوماً منذ آخر تحديث لموادك. هل ما زلت في نفس الفصل الدراسي أم بدأت فصلاً جديداً؟
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-8">
            <Button
              onClick={() => checkSemesterMutation.mutate()}
              disabled={checkSemesterMutation.isPending}
              variant="outline"
              className="h-14 rounded-2xl font-black border-border hover:bg-muted/50"
            >
              ما زلت في نفس الفصل الدراسي
            </Button>
            <Button
              onClick={() => resetCoursesMutation.mutate()}
              disabled={resetCoursesMutation.isPending}
              className="h-14 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
            >
              بدأت فصلاً جديداً (تصفير المواد)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import MobileBottomNav from "./components/MobileBottomNav";

function AppContent() {
  return (
    <main className="min-h-screen pb-32 md:pb-0 transition-all duration-1000 relative" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Router />
    </main>
  );
}

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;

    // Content Protection Script
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'u' || e.key === 's' || e.key === 'a' || e.key === 'p')) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [i18n.language]);

  return (
    <GlobalErrorBoundary>
        <ThemeProvider defaultTheme="dark" switchable={true}>
          <TooltipProvider>
            <Toaster />
            <AppContent />
            <MobileBottomNav />
            <WhatsAppButton />
          </TooltipProvider>
        </ThemeProvider>
    </GlobalErrorBoundary>
  );
}

export default App;