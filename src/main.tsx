import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Root from "./routes/Root/root";
// PUBLIC
import Home from "./Pages/home/Home";
import ListFarms from "./Pages/goatfarms/ListFarms";
import GoatListPage from "./Pages/goat-list-page/GoatListPage";
import AllGoatsPage from "./Pages/all-goats/AllGoatsPage";
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

import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "react-toastify/dist/ReactToastify.css";
 // ✅ 1. Importa a nova página de cadastro
import SignupPage from "./Pages/signup-page/SignupPage";
import GoatFarmRegistrationPage from "./Pages/goat-farm-registration/GoatFarmRegistrationPage";
import Logout from "./routes/PrivateRoute.tsx";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> }, // ✅ 2. Adiciona a nova rota pública
  { path: "/logout", element: <Logout /> }, // ✅ 3. Adiciona rota de logout
  { path: "/403", element: <ForbiddenPage /> },
  {
    path: "/",
    element: <Root />,
    children: [
      { index: true, element: <Home /> },

      // Rotas Públicas
      { path: "fazendas", element: <ListFarms /> },
      { path: "goatfarms", element: <ListFarms /> },
      
      // Rotas Públicas - Visualização de cabras e dashboard (leitura apenas)
      { path: "cabras", element: <AllGoatsPage /> },
      { path: "cabras/:farmId", element: <GoatListPage /> },
      { path: "dashboard", element: <AnimalDashboard /> },

      // Rotas Privadas (agora incluindo /fazendas/novo)
      {
        path: "fazendas/novo",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
            <FarmCreatePage />
          </PrivateRoute>
        ),
      },
      {
        path: "goat-farm-registration",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
            <GoatFarmRegistrationPage />
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
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);