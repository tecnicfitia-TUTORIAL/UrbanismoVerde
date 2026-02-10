import React from 'react';
import { ChevronRight } from 'lucide-react';
import { BreadcrumbItem } from '../../types';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight size={16} className="text-gray-400" />
          )}
          {item.path && index < items.length - 1 ? (
            <button
              onClick={() => {
                if (item.path) {
                  // Navigation will be handled by parent component
                }
              }}
              className="flex items-center space-x-1 hover:text-primary-600 transition-colors"
              title={item.label}
            >
              {item.icon && <span className="text-gray-400">{item.icon}</span>}
              <span className="truncate max-w-[150px]">{item.label}</span>
            </button>
          ) : (
            <span className="flex items-center space-x-1 font-medium text-gray-900">
              {item.icon && <span>{item.icon}</span>}
              <span className="truncate max-w-[150px]">{item.label}</span>
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
