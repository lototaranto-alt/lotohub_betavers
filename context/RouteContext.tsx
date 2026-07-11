import React, { createContext, useContext, useState, ReactNode } from 'react';

type Poi = any; // Può essere raffinato se esiste un tipo POI

interface RouteContextType {
  routePois: Poi[];
  routeEvents: Poi[]; // Separato per Whitelabel
  routeName: string;
  setRouteName: (name: string) => void;
  addPoiToRoute: (poi: Poi) => void;
  removePoiFromRoute: (poiId: string) => void;
  isPoiInRoute: (poiId: string) => boolean;
  addEventToRoute: (event: Poi) => void;
  removeEventFromRoute: (eventId: string) => void;
  isEventInRoute: (eventId: string) => boolean;
  clearRoute: () => void;
  isRouteActive: boolean;
  setIsRouteActive: (active: boolean) => void;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export function RouteProvider({ children }: { children: ReactNode }) {
  const [routePois, setRoutePois] = useState<Poi[]>([]);
  const [routeEvents, setRouteEvents] = useState<Poi[]>([]);
  const [routeName, setRouteName] = useState<string>('Il Tuo Itinerario');
  const [isRouteActive, setIsRouteActive] = useState<boolean>(false);

  const addPoiToRoute = (poi: Poi) => {
    setRoutePois((prev) => {
      if (prev.find((p) => p.id === poi.id)) return prev;
      return [...prev, poi];
    });
  };

  const removePoiFromRoute = (poiId: string) => {
    setRoutePois((prev) => prev.filter((p) => p.id !== poiId));
  };

  const isPoiInRoute = (poiId: string) => {
    return routePois.some((p) => p.id === poiId);
  };

  const addEventToRoute = (event: Poi) => {
    setRouteEvents((prev) => {
      if (prev.find((e) => e.id === event.id)) return prev;
      return [...prev, event];
    });
  };

  const removeEventFromRoute = (eventId: string) => {
    setRouteEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const isEventInRoute = (eventId: string) => {
    return routeEvents.some((e) => e.id === eventId);
  };

  const clearRoute = () => {
    setRoutePois([]);
    setRouteEvents([]);
  };

  return (
    <RouteContext.Provider
      value={{
        routePois,
        routeEvents,
        routeName,
        setRouteName,
        addPoiToRoute,
        removePoiFromRoute,
        isPoiInRoute,
        addEventToRoute,
        removeEventFromRoute,
        isEventInRoute,
        clearRoute,
        isRouteActive,
        setIsRouteActive,
      }}
    >
      {children}
    </RouteContext.Provider>
  );
}

export function useRouteBuilder() {
  const context = useContext(RouteContext);
  if (context === undefined) {
    throw new Error('useRouteBuilder must be used within a RouteProvider');
  }
  return context;
}
