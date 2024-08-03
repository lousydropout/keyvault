import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { Web3ModalProvider } from "./provider.tsx";
import { Header } from "./components/header.tsx";
import { Footer } from "./components/footer.tsx";
import { TermsAndConditions } from "./terms.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/terms",
    element: <TermsAndConditions />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Web3ModalProvider>
      <div className="flex flex-col justify-between min-h-screen mx-4 my-0 p-0 md:w-1/2 md:mx-auto">
        <Header />
        <RouterProvider router={router} />
        <Footer />
      </div>
    </Web3ModalProvider>
  </React.StrictMode>
);
