// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Root from "./routers/Root/root";
import Home from "./Pages/home/Home";

// PÚBLICAS (somente leitura)
import ListFarms from "./Pages/goatfarms/ListFarms";
import GoatListPage from "./Pages/goat-list-page/GoatListPage";
import AnimalDashboard from "./Pages/dashboard/Dashboard"; // detalhes + genealogia

// PRIVADAS (gestão)
import FarmCreatePage from "./Pages/farms-creted/FarmCreatePage";
import FarmEditPage from "./Pages/farms-edited/FarmEditPage";
import GoatEventsPage from "./Pages/goat-events/GoatEventsPage";

import LoginPage from "./Pages/login/LoginPage";
import ForbiddenPage from "./Pages/error/ForbiddenPage";

import PrivateRoute from "./routes/PrivateRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { RoleEnum } from "./Models/auth";
import Logout from "./routes/logout/Logout";

import "./index.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "react-toastify/dist/ReactToastify.css";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/403", element: <ForbiddenPage /> },

  {
    path: "/",
    element: <Root />,
    children: [
      // ====== PÚBLICO (somente leitura) ======
      { index: true, element: <Home /> },
      { path: "fazendas", element: <ListFarms /> },   // ✅ público
      { path: "goatfarms", element: <ListFarms /> },  // ✅ público (alias)
      { path: "cabras", element: <GoatListPage /> },  // ✅ público
      { path: "dashboard", element: <AnimalDashboard /> }, // ✅ público (detalhes+genealogia)

      // ====== PRIVADO (gestão) ======
      // Operador (do próprio capril) OU Admin
      {
        path: "fazendas/novo",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
            <FarmCreatePage />
          </PrivateRoute>
        ),
      },
      {
        path: "fazendas/:id/editar",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
            <FarmEditPage />
          </PrivateRoute>
        ),
      },
      {
        path: "cabras/:registrationNumber/eventos",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
            <GoatEventsPage />
          </PrivateRoute>
        ),
      },

      // Logout por link
      { path: "logout", element: <Logout /> },
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
