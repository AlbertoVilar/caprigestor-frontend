import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Root from "./routes/Root/root";
// PUBLIC
import Home from "./Pages/home/Home";
import BlogListPage from "./Pages/blog/BlogListPage";
import BlogArticlePage from "./Pages/blog/BlogArticlePage";
import ListFarms from "./Pages/goatfarms/ListFarms";
import GoatListPage from "./Pages/goat-list-page/GoatListPage";
import AllGoatsPage from "./Pages/all-goats/AllGoatsPage";
import AnimalDashboard from "./Pages/dashboard/Dashboard";
// PRIVATE
import FarmCreatePage from "./Pages/farms-creted/FarmCreatePage";
import FarmEditPage from "./Pages/farms-edited/FarmEditPage";
import GoatEventsPage from "./Pages/goat-events/GoatEventsPage";
import GoatCreatePage from "./Pages/goat/GoatCreatePage";

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
import Logout from "./routes/PrivateRoute";

// Pages for Lactation and Reproduction
import LactationPage from "./Pages/lactation/LactationPage";
import MilkProductionPage from "./Pages/lactation/MilkProductionPage";
import ReproductionPage from "./Pages/reproduction/ReproductionPage";
import LactationActivePage from "./Pages/lactation/LactationActivePage";
import LactationDetailPage from "./Pages/lactation/LactationDetailPage";
import LactationSummaryPage from "./Pages/lactation/LactationSummaryPage";
import PregnancyDetailPage from "./Pages/reproduction/PregnancyDetailPage";
import ReproductionEventsPage from "./Pages/reproduction/ReproductionEventsPage";
import AdminArticleListPage from "./Pages/editor/articles/AdminArticleListPage";
import AdminArticleFormPage from "./Pages/editor/articles/AdminArticleFormPage";

import HealthPage from "./Pages/health/HealthPage";
import HealthEventFormPage from "./Pages/health/HealthEventFormPage";
import HealthEventDetailPage from "./Pages/health/HealthEventDetailPage";

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
      { path: "cabras", element: <GoatListPage /> },
      { path: "goats", element: <GoatListPage /> },
      { path: "blog", element: <BlogListPage /> },
      { path: "blog/:slug", element: <BlogArticlePage /> },
      {
        path: "goats/new", element: (
          <PrivateRoute roles={[RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
            <GoatCreatePage />
          </PrivateRoute>
        )
      },
      { path: "dashboard", element: <AnimalDashboard /> },
      { path: "registro", element: <FarmCreatePage /> }, // Rota pública para registro

      // Rotas Privadas (exceto /fazendas/novo que agora é pública)
      {
        path: "fazendas/novo",
        element: <FarmCreatePage />,
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
          <PrivateRoute roles={[RoleEnum.ROLE_FARM_OWNER, RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
            <GoatEventsPage />
          </PrivateRoute>
        ),
      },
      // Rotas de Lactação e Reprodução
      {
        path: "app/goatfarms/:farmId/goats/:goatId/lactations",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_FARM_OWNER, RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
            <LactationPage />
          </PrivateRoute>
        ),
      },
      {
        path: "app/goatfarms/:farmId/goats/:goatId/milk-productions",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_FARM_OWNER, RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
            <MilkProductionPage />
          </PrivateRoute>
        ),
      },
      {
        path: "app/goatfarms/:farmId/goats/:goatId/reproduction",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_FARM_OWNER, RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
            <ReproductionPage />
          </PrivateRoute>
        ),
      },
      {
        path: "app/goatfarms/:farmId/goats/:goatId/lactations/active",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_FARM_OWNER, RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
            <LactationActivePage />
          </PrivateRoute>
        ),
      },
      {
        path: "app/goatfarms/:farmId/goats/:goatId/lactations/:lactationId",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_FARM_OWNER, RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
            <LactationDetailPage />
          </PrivateRoute>
        ),
      },
      {
        path: "app/goatfarms/:farmId/goats/:goatId/lactations/:lactationId/summary",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_FARM_OWNER, RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
            <LactationSummaryPage />
          </PrivateRoute>
        ),
      },
      {
        path: "app/goatfarms/:farmId/goats/:goatId/reproduction/pregnancies/:pregnancyId",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_FARM_OWNER, RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
            <PregnancyDetailPage />
          </PrivateRoute>
        ),
      },
      {
        path: "app/goatfarms/:farmId/goats/:goatId/reproduction/events",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_FARM_OWNER, RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
            <ReproductionEventsPage />
          </PrivateRoute>
        ),
      },
      // Rotas de Saúde
      {
        path: "app/goatfarms/:farmId/goats/:goatId/health",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_FARM_OWNER, RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
            <HealthPage />
          </PrivateRoute>
        ),
      },
      {
        path: "app/goatfarms/:farmId/goats/:goatId/health/new",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_FARM_OWNER, RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
            <HealthEventFormPage />
          </PrivateRoute>
        ),
      },
      {
        path: "app/goatfarms/:farmId/goats/:goatId/health/:eventId",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_FARM_OWNER, RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
            <HealthEventDetailPage />
          </PrivateRoute>
        ),
      },
      {
        path: "app/goatfarms/:farmId/goats/:goatId/health/:eventId/edit",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_FARM_OWNER, RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
            <HealthEventFormPage />
          </PrivateRoute>
        ),
      },
      {
        path: "app/editor/articles",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_ADMIN]}>
            <AdminArticleListPage />
          </PrivateRoute>
        ),
      },
      {
        path: "app/editor/articles/new",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_ADMIN]}>
            <AdminArticleFormPage />
          </PrivateRoute>
        ),
      },
      {
        path: "app/editor/articles/:id/edit",
        element: (
          <PrivateRoute roles={[RoleEnum.ROLE_ADMIN]}>
            <AdminArticleFormPage />
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
