import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Navbar } from "@/components/layout/Navbar";
import { LoginPage } from "@/pages/LoginPage";
import { LandingPage } from "@/pages/LandingPage";
import { ParametersPage } from "@/pages/ParametersPage";
import { SummaryPage } from "@/pages/SummaryPage";
import { TablesPage } from "@/pages/TablesPage";
import { ComparisonPage } from "@/pages/ComparisonPage";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthGuard />}>
          <Route
            path="/"
            element={
              <Layout>
                <LandingPage />
              </Layout>
            }
          />
          <Route
            path="/parameters"
            element={
              <Layout>
                <ParametersPage />
              </Layout>
            }
          />
          <Route
            path="/summary"
            element={
              <Layout>
                <SummaryPage />
              </Layout>
            }
          />
          <Route
            path="/tables"
            element={
              <Layout>
                <TablesPage />
              </Layout>
            }
          />
          <Route
            path="/compare"
            element={
              <Layout>
                <ComparisonPage />
              </Layout>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
