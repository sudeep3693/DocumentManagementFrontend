const STEPS = [
  { key: 'COMPANY_INFO', label: 'Company Info' },
  { key: 'COMPANY_DOCUMENT_INFO', label: 'Documents' },
  { key: 'ADDRESS_INFO', label: 'Address' },
  { key: 'AUTHORIZED_PERSON_INFO', label: 'Authorized Person' },
  { key: 'COMPLETED', label: 'Credentials' },
];

const StepIndicator = ({ currentStep }) => {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="step-indicator">
      {STEPS.map((step, index) => {
        let status = 'upcoming';
        if (index < currentIndex) status = 'completed';
        else if (index === currentIndex) status = 'active';

        return (
          <div key={step.key} className={`step-item ${status}`}>
            <div className="step-circle">
              {status === 'completed' ? '✓' : index + 1}
            </div>
            <span className="step-label">{step.label}</span>
            {index < STEPS.length - 1 && <div className="step-line" />}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
