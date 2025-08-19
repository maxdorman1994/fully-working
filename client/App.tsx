import "./global.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Journal from "./pages/Journal";
import Gallery from "./pages/Gallery";
import MunroBagging from "./pages/MunroBagging";
import CastlesLochs from "./pages/CastlesLochs";
import HintsTips from "./pages/HintsTips";
import Wishlist from "./pages/Wishlist";
import Milestones from "./pages/Milestones";
import Map from "./pages/Map";
import Debug from "./pages/Debug";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/munro-bagging" element={<MunroBagging />} />
            <Route path="/castles-lochs" element={<CastlesLochs />} />
            <Route path="/hints-tips" element={<HintsTips />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/milestones" element={<Milestones />} />
            <Route path="/map" element={<Map />} />
            <Route path="/debug" element={<Debug />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
