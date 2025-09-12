// src/components/ui/StepIndicator.tsx
import React from 'react';
import type { FormStep } from '../../types/farmTypes';
import './StepIndicator.css';

interface StepConfig {
  id: FormStep;
  title: string;
  description: string;
  icon: string;
}

interface StepIndicatorProps {
  currentStep: FormStep;
  completedSteps: FormStep[];
  onStepClick?: (step: FormStep) => void;
  className?: string;
}

const STEPS: StepConfig[] = [
  {
    id: 'farm',
    title: 'Fazenda',
    description: 'Informações da fazenda',
    icon: '🏡'
  },
  {
    id: 'user',
    title: 'Proprietário',
    description: 'Dados do usuário',
    icon: '👤'
  },
  {
    id: 'address',
    title: 'Endereço',
    description: 'Localização da fazenda',
    icon: '📍'
  },
  {
    id: 'phones',
    title: 'Contatos',
    description: 'Telefones de contato',
    icon: '📞'
  }
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
  className = ''
}) => {
  const getCurrentStepIndex = () => {
    return STEPS.findIndex(step => step.id === currentStep);
  };

  const getStepStatus = (step: FormStep) => {
    if (completedSteps.includes(step)) {
      return 'completed';
    }
    if (step === currentStep) {
      return 'current';
    }
    return 'pending';
  };

  const isStepClickable = (step: FormStep, index: number) => {
    const currentIndex = getCurrentStepIndex();
    // Permite clicar em etapas anteriores ou na atual
    return onStepClick && index <= currentIndex;
  };

  return (
    <div className={`step-indicator ${className}`}>
      <div className="step-indicator-header">
        <h3>Cadastro de Fazenda</h3>
        <span className="step-counter">
          Etapa {getCurrentStepIndex() + 1} de {STEPS.length}
        </span>
      </div>

      <div className="steps-container">
        {STEPS.map((step, index) => {
          const status = getStepStatus(step.id);
          const isClickable = isStepClickable(step.id, index);
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.id} className="step-wrapper">
              <div
                className={`step-item ${
                  status === 'completed' ? 'step-completed' :
                  status === 'current' ? 'step-current' :
                  'step-pending'
                } ${
                  isClickable ? 'step-clickable' : ''
                }`}
                onClick={() => isClickable && onStepClick?.(step.id)}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onStepClick?.(step.id);
                  }
                }}
              >
                <div className="step-icon">
                  {status === 'completed' ? (
                    <span className="check-icon">✓</span>
                  ) : (
                    <span className="step-emoji">{step.icon}</span>
                  )}
                </div>
                
                <div className="step-content">
                  <div className="step-title">{step.title}</div>
                  <div className="step-description">{step.description}</div>
                </div>

                <div className="step-number">{index + 1}</div>
              </div>

              {!isLast && (
                <div className={`step-connector ${
                  completedSteps.includes(step.id) ? 'connector-completed' : 'connector-pending'
                }`}>
                  <div className="connector-line"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{
            width: `${((getCurrentStepIndex() + 1) / STEPS.length) * 100}%`
          }}
        ></div>
      </div>
    </div>
  );
};

export default StepIndicator;