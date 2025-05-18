import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function LoadingPlaceholder() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-300 rounded w-3/4"></div>
          <div className="h-40 bg-gray-300 rounded"></div>
          <div className="h-6 bg-gray-300 rounded w-1/2"></div>
        </div>
      </CardContent>
    </Card>
  );
}