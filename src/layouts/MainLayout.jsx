import { useState, useRef, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Breadcrumbs from '../components/Breadcrumbs';

const COLLAPSE_DELAY_MS = 3000; // auto-close after 3s idle

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const collapseTimerRef = useRef(null);

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  }, []);

  const startCollapseTimer = useCallback(() => {
    clearCollapseTimer();
    collapseTimerRef.current = setTimeout(() => {
      setSidebarOpen(false);
    }, COLLAPSE_DELAY_MS);
  }, [clearCollapseTimer]);

  const handleToggle = useCallback(() => {
    clearCollapseTimer();
    setSidebarOpen((prev) => !prev);
  }, [clearCollapseTimer]);

  const handleMouseEnter = useCallback(() => {
    clearCollapseTimer();
    setSidebarOpen(true);
  }, [clearCollapseTimer]);

  const handleMouseLeave = useCallback(() => {
    startCollapseTimer();
  }, [startCollapseTimer]);

  // Hover trigger strip (invisible 12px strip on the far left when collapsed)
  const handleTriggerEnter = useCallback(() => {
    clearCollapseTimer();
    setSidebarOpen(true);
  }, [clearCollapseTimer]);

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
