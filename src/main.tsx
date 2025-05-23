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
import GoatListPage from "./Pages/goat-list-page/GoatListPage"; // ✅ nova importação

import "./index.css"
import '@fortawesome/fontawesome-free/css/all.min.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { path: "", element: <Home /> },
      { path: "fazendas", element: <ListFarms /> },
      { path: "dashboard", element: <AnimalDashboard /> },
      { path: "goatfarms", element: <ListFarms /> },
      { path: "cabras", element: <GoatListPage /> }, // ✅ nova rota
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
