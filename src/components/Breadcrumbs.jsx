import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // If we're at the root, no breadcrumbs
  if (pathnames.length === 0) return null;

  // Let's hide breadcrumbs on the dashboard exactly, since "Home" implies dashboard
  if (pathnames.length === 1 && pathnames[0] === 'dashboard') return null;
  if (pathnames.length === 2 && pathnames[0] === 'admin' && pathnames[1] === 'dashboard') return null;

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // Determine the 'Home' link based on role logic implicitly via url
  const isRouteAdmin = pathnames[0] === 'admin';
  const homeLink = isRouteAdmin ? '/admin/dashboard' : '/dashboard';

  return (
    <nav className="breadcrumbs" aria-label="breadcrumb">
      <ol style={{ 
        listStyle: 'none', 
        padding: 0, 
        display: 'flex', 
        gap: '8px', 
        alignItems: 'center', 
        marginBottom: '1rem', 
        fontSize: '0.9rem',
        color: '#6c757d' 
      }}>
        <li>
          <Link to={homeLink} style={{ color: '#0d6efd', textDecoration: 'none' }}>
            Home
          </Link>
        </li>
        
        {pathnames.map((value, index) => {
          // If we hit 'dashboard' in the path, skip rendering it as a crumb (since Home takes us there)
          if (value === 'dashboard') return null;

          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          
          let displayName = value;

          // Format the display name cleanly
          if (value === 'user-status') displayName = 'User Status Management';
          else if (value === 'regenerate-tamsuk') displayName = 'Regenerate Document';
          else if (value.length > 20 && !value.includes('-')) displayName = `ID: ${value.slice(0, 8)}...`; // handle typical long mongoid/uuids nicely
          else displayName = capitalize(displayName.replace(/-/g, ' '));

          return (
            <React.Fragment key={to}>
              <li><span style={{ color: '#adb5bd' }}>/</span></li>
              <li>
                {isLast ? (
                  <span style={{ color: '#495057', fontWeight: '500' }}>{displayName}</span>
                ) : (
                  <Link to={to} style={{ color: '#0d6efd', textDecoration: 'none' }}>
                    {displayName}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
