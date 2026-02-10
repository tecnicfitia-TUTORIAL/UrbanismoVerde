import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit?: string;
  color: 'green' | 'blue' | 'purple' | 'orange';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

const colorClasses = {
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    icon: 'text-green-600'
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    icon: 'text-blue-600'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    icon: 'text-purple-600'
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-600',
    icon: 'text-orange-600'
  }
};

const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  unit,
  color,
  trend
}) => {
  const colors = colorClasses[color];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`${colors.bg} p-3 rounded-full`}>
            <div className={colors.icon}>
              {icon}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">{label}</p>
            <p className={`text-2xl font-bold ${colors.text} mt-1`}>
              {value}
              {unit && <span className="text-sm ml-1">{unit}</span>}
            </p>
          </div>
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-semibold ${
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.direction === 'up' ? (
              <TrendingUp size={14} className="mr-1" />
            ) : (
              <TrendingDown size={14} className="mr-1" />
            )}
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
