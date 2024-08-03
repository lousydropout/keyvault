import React from "react";
import { ChakraProvider } from "@chakra-ui/react";
import ReactDOM from "react-dom";
import { SidePanel } from "./SidePanel";
import "../index.css";

ReactDOM.render(
  <React.StrictMode>
    <ChakraProvider>
      <SidePanel />
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
