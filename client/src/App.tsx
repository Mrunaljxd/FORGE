import { useEffect, useState } from "react";
import "./forge.css";
import { Link, Route, Switch, useLocation } from "wouter";
import { ArrowRight, ArrowUpRight, Activity, LogOut, Menu, UserRound, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import {
  AboutPage, AdminDashboardPage, AdminExercisesPage, AdminMealsPage, AdminProgramsPage, AdminUsersPage, CommunityPage,
  ExerciseDetailPage, ExercisesPage, ForgotPasswordPage, HistoryPage, HowItWorksPage, LoginPage,
  MissingPage, NutritionPage, PrivacyPage, ProfilePage, ProgramDetailPage, ProgramsPage,
  ProtectedPage, ProgressPage, TermsPage, WorkoutBuilderPage, WorkoutPage, DashboardPage,
} from "./pages/FeaturePages";

function Brand() { return <Link href="/" className="wordmark" aria-label="FORGE home"><span className="forge-symbol">F</span><span>FORGE</span></Link>; }
function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location, setLocation] = useLocation();
  useEffect(() => setMobileOpen(false), [location]);
  const links = [["/", "Home"], ["/about", "About"], ["/how-it-works", "How it works"], ["/programs", "Programs"], ["/nutrition", "Nutrition"], ["/exercises", "Exercises"]];
  const doLogout = async () => { try { await logout(); } finally { setLocation("/"); window.location.reload(); } };
  return <header className="site-header"><div className="nav-inner"><Brand /><nav className={`desktop-nav ${mobileOpen ? "mobile-open" : ""}`} aria-label="Main navigation">{links.map(([href, label]) => <Link href={href} key={href} className={location === href ? "active" : ""}>{label}</Link>)}<div className="mobile-nav-actions">{user ? <Link href="/dashboard" className="button button-light">My FORGE <ArrowRight size={14} /></Link> : <><Link href="/login">Log in</Link><Link href="/signup" className="button button-light">Get started <ArrowRight size={14} /></Link></>}</div></nav><div className="nav-actions">{user ? <><Link href="/dashboard" className="nav-account"><UserRound size={15} /> My FORGE</Link><button className="nav-logout" onClick={doLogout} aria-label="Log out"><LogOut size={15} /></button></> : <><Link className="nav-login" href="/login">Log in</Link><Link className="button button-light nav-cta" href="/signup">Get started <ArrowRight size={14} /></Link></>}<button className="mobile-toggle" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button></div></div></header>;
}
function SiteFooter() {
  return <footer className="site-footer global-footer"><div className="footer-brand"><Brand /><p>Stronger today. Better forever.</p><span className="footer-note">Fitness built around your life.</span></div><div className="footer-col"><span>EXPLORE</span><Link href="/about">About</Link><Link href="/how-it-works">How it works</Link><Link href="/programs">Programs</Link><Link href="/exercises">Exercise library</Link></div><div className="footer-col"><span>WELLBEING</span><Link href="/nutrition">Nutrition</Link><Link href="/workouts">Choose a workout</Link><Link href="/progress">Progress</Link><Link href="/community">Community</Link></div><div className="footer-col"><span>ACCOUNT</span><Link href="/login">Log in</Link><Link href="/signup">Create account</Link><Link href="/admin/login">Admin</Link></div><div className="footer-bottom"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><span>© {new Date().getFullYear()} FORGE · STRENGTH GIVES YOU FREEDOM.</span></div></footer>;
}
function ResumeAfterAuth() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (loading || !user) return;
    const saved = window.sessionStorage.getItem("forge.returnAfterAuth");
    if (saved && saved.startsWith("/") && !saved.startsWith("//") && !saved.includes("\\")) {
      window.sessionStorage.removeItem("forge.returnAfterAuth");
      setLocation(saved);
    }
  }, [user, loading, setLocation]);
  return null;
}
function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/about" component={AboutPage} />
    <Route path="/how-it-works" component={HowItWorksPage} />
    <Route path="/programs" component={ProgramsPage} />
    <Route path="/programs/:slug">{(params) => <ProgramDetailPage />}</Route>
    <Route path="/nutrition" component={NutritionPage} />
    <Route path="/exercises" component={ExercisesPage} />
    <Route path="/exercises/:slug">{(params) => <ExerciseDetailPage />}</Route>
    <Route path="/workouts" component={WorkoutBuilderPage} />
    <Route path="/login" component={LoginPage} />
    <Route path="/signup" component={LoginPage} />
    <Route path="/forgot-password" component={ForgotPasswordPage} />
    <Route path="/dashboard">{() => <ProtectedPage><DashboardPage /></ProtectedPage>}</Route>
    <Route path="/workout/:id">{(params) => <ProtectedPage><WorkoutPage id={params.id} /></ProtectedPage>}</Route>
    <Route path="/progress">{() => <ProtectedPage><ProgressPage /></ProtectedPage>}</Route>
    <Route path="/profile">{() => <ProtectedPage><ProfilePage /></ProtectedPage>}</Route>
    <Route path="/history">{() => <ProtectedPage><HistoryPage /></ProtectedPage>}</Route>
    <Route path="/admin/login" component={LoginPage} />
    <Route path="/admin">{() => <ProtectedPage admin><AdminDashboardPage /></ProtectedPage>}</Route>
    <Route path="/admin/exercises">{() => <ProtectedPage admin><AdminExercisesPage /></ProtectedPage>}</Route>
    <Route path="/admin/programs">{() => <ProtectedPage admin><AdminProgramsPage /></ProtectedPage>}</Route>
    <Route path="/admin/nutrition">{() => <ProtectedPage admin><AdminMealsPage /></ProtectedPage>}</Route>
    <Route path="/admin/users">{() => <ProtectedPage admin><AdminUsersPage /></ProtectedPage>}</Route>
    <Route path="/privacy" component={PrivacyPage} />
    <Route path="/terms" component={TermsPage} />
    <Route path="/community" component={CommunityPage} />
    <Route><MissingPage /></Route>
  </Switch>;
}
function AppFrame() {
  const [location] = useLocation();
  const showFooter = location !== "/" && !location.startsWith("/workout/") && !location.startsWith("/admin") && location !== "/login" && location !== "/signup" && location !== "/forgot-password";
  return <><ResumeAfterAuth /><SiteHeader /><Router />{showFooter && <SiteFooter />}<Toaster /></>;
}
export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><AppFrame /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
