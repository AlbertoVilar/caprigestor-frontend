// src/main.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import Root from "./routers/Root/root";
import Home from "./Pages/home/Home";
import ListFarms from "./Pages/goatfarms/ListFarms";
import AnimalDashboard from "./Pages/dashboard/Dashboard";
import GoatListPage from "./Pages/goat-list-page/GoatListPage";
import FarmCreatePage from "./Pages/farms-creted/FarmCreatePage";
import FarmEditPage from "./Pages/farms-edited/FarmEditPage";
import GoatEventsPage from "./Pages/goat-events/GoatEventsPage";
import LoginPage from "./Pages/login/LoginPage";
import ForbiddenPage from "./Pages/error/ForbiddenPage";

import PrivateRoute from "./routes/PrivateRoute";
import { AuthProvider } from "./contexts/AuthContext";

import "./index.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "react-toastify/dist/ReactToastify.css";

// ✅ TESTE: Verificar se variáveis do .env estão sendo lidas corretamente
console.log("CLIENT_ID do .env:", import.meta.env.VITE_CLIENT_ID);
console.log("CLIENT_SECRET do .env:", import.meta.env.VITE_CLIENT_SECRET);

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/403",
    element: <ForbiddenPage />,
  },
  {
    path: "/",
    element: <Root />,
    children: [
      { path: "", element: <Home /> },
      {
        path: "fazendas",
        element: (
          <PrivateRoute>
            <ListFarms />
          </PrivateRoute>
        ),
      },
      {
        path: "fazendas/novo",
        element: (
          <PrivateRoute>
            <FarmCreatePage />
          </PrivateRoute>
        ),
      },
      {
        path: "fazendas/:id/editar",
        element: (
          <PrivateRoute>
            <FarmEditPage />
          </PrivateRoute>
        ),
      },
      {
        path: "dashboard",
        element: (
          <PrivateRoute>
            <AnimalDashboard />
          </PrivateRoute>
        ),
      },
      {
        path: "goatfarms",
        element: (
          <PrivateRoute>
            <ListFarms />
          </PrivateRoute>
        ),
      },
      {
        path: "cabras",
        element: (
          <PrivateRoute>
            <GoatListPage />
          </PrivateRoute>
        ),
      },
      {
        path: "cabras/:registrationNumber/eventos",
        element: (
          <PrivateRoute>
            <GoatEventsPage />
          </PrivateRoute>
        ),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
