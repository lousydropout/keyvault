import App from "@/App.tsx";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Footer } from "@/components/footer.tsx";
import { Header } from "@/components/header.tsx";
import "@/index.css";
import { Web3ModalProvider } from "@/provider.tsx";
import { TermsAndConditions } from "@/terms.tsx";
import UpdatePublicKey from "@/UpdatePublicKey.tsx";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Global async error handler for unhandled promise rejections
window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled Promise Rejection:", e.reason);
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/updatePublicKey",
    element: <UpdatePublicKey />,
  },
  {
    path: "/terms",
    element: <TermsAndConditions />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Web3ModalProvider>
        <ErrorBoundary>
          <div className="flex flex-col justify-between min-h-screen mx-4 my-0 p-0 md:w-2/3 xl:1/2 md:mx-auto">
            <Header />
            <ErrorBoundary>
              <RouterProvider router={router} />
            </ErrorBoundary>
            <Footer />
          </div>
        </ErrorBoundary>
      </Web3ModalProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
