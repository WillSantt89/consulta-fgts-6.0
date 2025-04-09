import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  negative?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  trendUp, 
  negative = false 
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-700">{title}</h3>
        {icon}
      </div>
      <div className="flex items-end">
        <span className="text-3xl font-bold text-gray-800">{value}</span>
        <span className="ml-2 text-xs text-gray-500">{description}</span>
      </div>
      {trend && (
        <div className={`flex items-center mt-2 text-xs ${
          trendUp 
            ? negative ? 'text-red-600' : 'text-green-600' 
            : negative ? 'text-green-600' : 'text-red-600'
        }`}>
          {trendUp ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />} {trend}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
