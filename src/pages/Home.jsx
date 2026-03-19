import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="page-center">
      <div className="home-container">
        <h1>📄 DocMan</h1>
        <p className="subtitle">Multi-Tenant Document Management System</p>
        <p className="home-desc">
          Manage your clients, documents, and team members — all in one place.
        </p>
        <div className="home-actions">
          <Link to="/login" className="btn btn-primary">Login</Link>
          <Link to="/register" className="btn btn-outline">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
