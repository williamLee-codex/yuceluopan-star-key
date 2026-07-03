import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { PointsProvider } from "@/contexts/PointsContext";
import { NicknameProvider } from "@/contexts/NicknameContext";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PointsProvider>
        <NicknameProvider>
          <TooltipProvider>
            <div className="min-h-[100dvh] bg-[#0D0D0D] dark w-full flex justify-center overflow-x-hidden">
              <div className="w-full max-w-[430px] bg-[#0D0D0D] min-h-screen relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <Router />
                </WouterRouter>
                <Toaster />
              </div>
            </div>
          </TooltipProvider>
        </NicknameProvider>
      </PointsProvider>
    </QueryClientProvider>
  );
}

export default App;
