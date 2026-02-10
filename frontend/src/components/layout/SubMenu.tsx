import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SubMenuItem } from '../../types';

interface SubMenuProps {
  items: SubMenuItem[];
  parentActive: boolean;
  onItemClick: (item: SubMenuItem) => void;
}

const SubMenu: React.FC<SubMenuProps> = ({ items, parentActive, onItemClick }) => {
  const [isExpanded, setIsExpanded] = useState(parentActive);

  React.useEffect(() => {
    if (parentActive) {
      setIsExpanded(true);
    }
  }, [parentActive]);

  if (!items || items.length === 0) return null;

  return (
    <div className="overflow-hidden">
      {isExpanded && (
        <div className="animate-slide-down">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick(item)}
              className={`
                w-full flex items-center pl-12 pr-4 py-2 text-sm transition-colors
                ${item.active 
                  ? 'bg-primary-50 text-primary-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
                }
              `}
              title={item.label}
            >
              <span className="mr-2 text-gray-400">
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.count !== undefined && (
                <span className={`
                  ml-2 px-2 py-0.5 rounded-full text-xs font-semibold
                  ${item.active 
                    ? 'bg-primary-200 text-primary-800' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubMenu;
