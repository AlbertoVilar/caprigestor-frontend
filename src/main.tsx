import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Root from "./routes/Root/root";
// PUBLIC
import Home from "./Pages/home/Home"; // ✅ Importado o componente Home
import ListFarms from "./Pages/goatfarms/ListFarms";
import GoatListPage from "./Pages/goat-list-page/GoatListPage";
import AnimalDashboard from "./Pages/dashboard/Dashboard";
// PRIVATE
import FarmCreatePage from "./Pages/farms-creted/FarmCreatePage";
import FarmEditPage from "./Pages/farms-edited/FarmEditPage";
import GoatEventsPage from "./Pages/goat-events/GoatEventsPage";

import LoginPage from "./Pages/login/LoginPage";
import ForbiddenPage from "./Pages/error/ForbiddenPage";

import { AuthProvider } from "./contexts/AuthContext";
import { RoleEnum } from "./Models/auth";
import PrivateRoute from "./Components/private_route/PrivateRoute";
// ❌ O import do Logout foi removido, pois não é mais necessário

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
      // ✅ A rota principal agora renderiza o componente Home
      { index: true, element: <Home /> },

      // Públicas
      { path: "fazendas", element: <ListFarms /> },
      { path: "goatfarms", element: <ListFarms /> },
      { path: "cabras", element: <GoatListPage /> },
      { path: "dashboard", element: <AnimalDashboard /> },

      // Privadas (gestão)
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
      // ❌ Rota /logout removida daqui
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