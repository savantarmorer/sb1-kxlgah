import React from 'react';
import { Routes as RouterRoutes, Route } from 'react-router-dom';

// Import your page components here
import { InventoryPage } from './routes/InventoryPage';

export default function Routes() {
  return (
    <RouterRoutes>
      <Route path="/inventory" element={<InventoryPage />} />
      {/* Add other routes here */}
    </RouterRoutes>
  );
} 