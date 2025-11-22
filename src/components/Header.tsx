import React from 'react';
import { AppBar, Toolbar, Box } from '@mui/material';
import './Header.css';

const Header: React.FC = () => {
  return (
    <AppBar 
      position="sticky" 
      className="header"
      sx={{ backgroundColor: 'white' }}
    >
      <Toolbar>
        <Box
          component="img"
          src="/images/logo-white.jpg"
          alt="Logo"
          className="logo"
        />
      </Toolbar>
    </AppBar>
  );
};

export default Header;

