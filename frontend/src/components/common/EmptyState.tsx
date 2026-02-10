import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-gray-400 mb-4 opacity-50">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 mb-6 max-w-md">
        {description}
      </p>
      {primaryAction && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={primaryAction.onClick}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            {primaryAction.label}
          </button>
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
