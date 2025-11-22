import React from 'react';
import { Box } from '@mui/material';
import { FleetProvider } from './contexts/FleetContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import VehicleList from './components/VehicleList';
import './App.css';

function App() {
  return (
    <FleetProvider>
      <Box className="app">
        <Header />
        <Box className="appContent">
          <Sidebar />
          <VehicleList />
        </Box>
      </Box>
    </FleetProvider>
  );
}

export default App;
