import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Breadcrumbs from '../components/Breadcrumbs';

const MainLayout = () => {
  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-content">
        <Breadcrumbs />
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
