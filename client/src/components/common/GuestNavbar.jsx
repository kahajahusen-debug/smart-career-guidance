import React from 'react';
import PublicNavbar from '../public/PublicNavbar';

export default function GuestNavbar({ activePage, onNavigate }) {
  return (
    <PublicNavbar
      activeSection={activePage === 'home' ? 'home' : ''}
      onNavigate={onNavigate}
    />
  );
}
