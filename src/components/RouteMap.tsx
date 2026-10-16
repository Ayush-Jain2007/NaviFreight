import React from 'react';
import { Port } from '../types';
import { ShippingRouteCard } from './ShippingRouteCard';

interface RouteMapProps {
  originPort?: Port;
  destPort?: Port;
  distanceNM?: number;
  estVoyageDays?: number;
}

export const RouteMap: React.FC<RouteMapProps> = () => {
  return (
    <div className="w-full">
      <ShippingRouteCard />
    </div>
  );
};
