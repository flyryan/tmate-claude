import React from 'react';

export const LoadingDots: React.FC = () => {
  return (
    <div className="flex gap-1.5">
      <div className="w-2 h-2 rounded-full bg-current loading-dot" />
      <div className="w-2 h-2 rounded-full bg-current loading-dot" />
      <div className="w-2 h-2 rounded-full bg-current loading-dot" />
    </div>
  );
};
