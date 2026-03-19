const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>{text}</p>
    </div>
  );
};

export default LoadingSpinner;
