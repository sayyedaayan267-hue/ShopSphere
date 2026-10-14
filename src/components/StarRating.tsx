import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  reviewCount,
  size = 'md',
  showCount = true,
}) => {
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.3;

  return (
    <div className="flex items-center gap-1.5 select-none">
      <div className="flex items-center text-amber-500">
        {[1, 2, 3, 4, 5].map((i) => {
          const isFilled = i <= fullStars;
          const isHalf = !isFilled && i === fullStars + 1 && hasHalfStar;
          return (
            <span key={i} className="relative inline-block">
              {isHalf ? (
                <div className="relative">
                  <Star className={`${starSize} text-slate-200 fill-slate-200`} />
                  <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
                    <Star className={`${starSize} text-amber-500 fill-amber-500`} />
                  </div>
                </div>
              ) : (
                <Star
                  className={`${starSize} ${
                    isFilled ? 'text-amber-500 fill-amber-500' : 'text-slate-200 fill-slate-200'
                  }`}
                />
              )}
            </span>
          );
        })}
      </div>
      {showCount && (
        <span className="text-xs font-medium text-sky-700 hover:text-amber-600 transition-colors">
          {rating.toFixed(1)} {reviewCount !== undefined && `(${reviewCount.toLocaleString()})`}
        </span>
      )}
    </div>
  );
};
