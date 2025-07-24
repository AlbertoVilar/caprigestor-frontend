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

import "./index.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "react-toastify/dist/ReactToastify.css";

const router = createBrowserRouter([
  // Página de login (fora do layout Root, sem sidebar e header)
  {
    path: "/login",
    element: <LoginPage />,
  },
  // Páginas com layout padrão Root (com sidebar, header etc.)
  {
    path: "/",
    element: <Root />,
    children: [
      { path: "", element: <Home /> },
      { path: "fazendas", element: <ListFarms /> },
      { path: "fazendas/novo", element: <FarmCreatePage /> },
      { path: "fazendas/:id/editar", element: <FarmEditPage /> },
      { path: "dashboard", element: <AnimalDashboard /> },
      { path: "goatfarms", element: <ListFarms /> },
      { path: "cabras", element: <GoatListPage /> },
      { path: "cabras/:registrationNumber/eventos", element: <GoatEventsPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
