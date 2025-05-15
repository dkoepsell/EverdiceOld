import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Characters from "@/pages/characters";
import Campaigns from "@/pages/campaigns";
import DiceRoller from "@/pages/dice-roller";
import AuthPage from "@/pages/auth-page";
import TestPage from "@/pages/test-page";
import HowItWorks from "@/pages/how-it-works";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Switch>
          <ProtectedRoute path="/" component={Dashboard} />
          <ProtectedRoute path="/characters" component={Characters} />
          <ProtectedRoute path="/campaigns" component={Campaigns} />
          <ProtectedRoute path="/dice-roller" component={DiceRoller} />
          <ProtectedRoute path="/test" component={TestPage} />
          <Route path="/how-it-works" component={HowItWorks} />
          <Route path="/auth" component={AuthPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
