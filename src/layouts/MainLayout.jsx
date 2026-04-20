import { useState, useRef, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Breadcrumbs from '../components/Breadcrumbs';
import NotificationBell from '../components/NotificationBell';
import UserMenu from '../components/UserMenu';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const leaveTimerRef = useRef(null);

  const handleToggle = useCallback(() => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setSidebarOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setSidebarOpen(false);
    }, 300);
  }, []);

  const handleTriggerEnter = useCallback(() => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setSidebarOpen(true);
  }, []);

  return (
    <div className="main-layout">
      {!sidebarOpen && (
        <div
          className="sidebar-hover-trigger"
          onMouseEnter={handleTriggerEnter}
          aria-hidden="true"
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleToggle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      <div className={`main-content ${sidebarOpen ? 'content-expanded' : 'content-collapsed'}`}>
        {/* Top Bar */}
        <div className="topbar">
          <div className="topbar-left">
            <Breadcrumbs />
          </div>
          <div className="topbar-right">
            <NotificationBell />
            <UserMenu />
          </div>
        </div>

        {/* Page content */}
        <div className="page-wrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
