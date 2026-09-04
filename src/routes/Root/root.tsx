// src/routers/Root/root.tsx
import { useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../../Components/navigation/Navbar";
import Footer from "../../Components/footer-compoent/Footer";
import { FarmAlertsProvider } from "../../contexts/alerts/FarmAlertsContext";
import { resolveFarmContextId } from "../../utils/appRoutes";
import { useAuth } from "../../contexts/AuthContext";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "../../index.css";

export default function Root() {
  const { isAuthenticated } = useAuth();
  const { pathname, search } = useLocation();
  const farmId = useMemo(
    () => resolveFarmContextId(pathname, search),
    [pathname, search]
  );

  return (
    <FarmAlertsProvider farmId={farmId} enabled={isAuthenticated}>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <div className="content">
            <Outlet />
          </div>

          <Footer />

          <ToastContainer position="top-right" autoClose={3000} />
        </main>
      </div>
    </FarmAlertsProvider>
  );
}
