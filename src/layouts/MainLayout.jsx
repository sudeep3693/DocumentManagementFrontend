import { useState, useRef, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Breadcrumbs from '../components/Breadcrumbs';

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
    }, 300); // 300ms grace period for "smooth" feel
  }, []);

  // Hover trigger strip (invisible 12px strip on the far left when collapsed)
  const handleTriggerEnter = useCallback(() => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setSidebarOpen(true);
  }, []);

  return (
    <div className="main-layout">
      {/* Invisible hover trigger on far left for re-opening */}
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

      <main className={`main-content ${sidebarOpen ? 'content-expanded' : 'content-collapsed'}`}>
        <Breadcrumbs />
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
