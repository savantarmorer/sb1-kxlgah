import React from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export const Rating: React.FC<RatingProps> = ({ label, value, onChange }) => {
  return (
    <div className="rating">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`p-1 ${value >= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            <Star className="w-6 h-6" />
          </button>
        ))}
      </div>
    </div>
  );
}; 