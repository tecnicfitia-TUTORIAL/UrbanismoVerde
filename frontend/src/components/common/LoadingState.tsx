import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Cargando...', 
  fullScreen = false 
}) => {
  const containerClass = fullScreen 
    ? 'flex flex-col items-center justify-center min-h-screen'
    : 'flex flex-col items-center justify-center py-12';

  return (
    <div className={containerClass}>
      <Loader2 size={48} className="text-primary-600 animate-spin mb-4" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
};

export default LoadingState;
