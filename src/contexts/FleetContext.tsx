import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';

export type FilterType = 'all' | 'idle' | 'en_route' | 'delivered';

export interface StatisticsData {
  total: number;
  idle: number;
  en_route: number;
  delivered: number;
  average_speed: number;
  timestamp: string;
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  status: string;
  destination: string;
  currentLocation: {
    lat: number;
    lng: number;
  };
  speed: number;
  lastUpdated: string;
  estimatedArrival: string;
  batteryLevel: number;
  fuelLevel: number;
}

interface FleetContextType {
  selectedFilter: FilterType;
  setSelectedFilter: (filter: FilterType) => void;
  // WebSocket properties
  isConnected: boolean;
  lastUpdateTime: Date | null;
  nextUpdateIn: number; // seconds until next update
  wsError: string | null;
  // Data from WebSocket (optional - components can still fetch their own)
  wsVehicles: Vehicle[] | null;
  wsStatistics: StatisticsData | null;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within FleetProvider');
  }
  return context;
};

interface FleetProviderProps {
  children: ReactNode;
}

export const FleetProvider: React.FC<FleetProviderProps> = ({ children }) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [nextUpdateIn, setNextUpdateIn] = useState<number>(180); // 3 minutes in seconds
  const [wsError, setWsError] = useState<string | null>(null);
  const [wsVehicles, setWsVehicles] = useState<Vehicle[] | null>(null);
  const [wsStatistics, setWsStatistics] = useState<StatisticsData | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nextUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  // Countdown timer for next update
  useEffect(() => {
    if (isConnected && nextUpdateIn > 0) {
      const interval = setInterval(() => {
        setNextUpdateIn((prev) => {
          if (prev <= 1) {
            return 180; // Reset to 3 minutes when it reaches 0
          }
          return prev - 1;
        });
      }, 1000);

      nextUpdateIntervalRef.current = interval;

      return () => {
        if (nextUpdateIntervalRef.current) {
          clearInterval(nextUpdateIntervalRef.current);
        }
      };
    }
  }, [isConnected, nextUpdateIn]);

  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket('wss://case-study-26cf.onrender.com');

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setWsError(null);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          console.log('WebSocket message received:', event.data);
          const data = JSON.parse(event.data);

          // Update last update time
          setLastUpdateTime(new Date());
          setNextUpdateIn(180); // Reset countdown to 3 minutes

          // Handle vehicle_update message type
          if (data.type === 'vehicle_update') {
            if (Array.isArray(data.data)) {
              console.log(`Received ${data.data.length} vehicles from WebSocket`);
              setWsVehicles(data.data);
            }
          }

          // Handle statistics message type
          if (data.type === 'statistics' || data.statistics) {
            const stats = data.statistics || data.data;
            if (stats) {
              setWsStatistics(stats);
            }
          }

          // Handle vehicles message type (legacy support)
          if (data.type === 'vehicles' || data.vehicles) {
            const vehicles = data.vehicles || data.data;
            if (Array.isArray(vehicles)) {
              setWsVehicles(vehicles);
            }
          }

          // If no type specified, try to infer from structure
          if (!data.type) {
            if (data.total !== undefined || data.idle !== undefined) {
              // Looks like statistics
              setWsStatistics(data);
            } else if (Array.isArray(data.data)) {
              // Looks like vehicles array
              setWsVehicles(data.data);
            } else if (Array.isArray(data)) {
              // Direct array of vehicles
              setWsVehicles(data);
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          setWsError('Failed to parse message');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsError('WebSocket connection error');
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnecting... Attempt ${reconnectAttempts.current}`);
            connectWebSocket();
          }, reconnectDelay);
        } else {
          setWsError('Max reconnection attempts reached');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setWsError('Failed to create WebSocket connection');
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (nextUpdateIntervalRef.current) {
        clearInterval(nextUpdateIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  const value: FleetContextType = {
    selectedFilter,
    setSelectedFilter,
    isConnected,
    lastUpdateTime,
    nextUpdateIn,
    wsError,
    wsVehicles,
    wsStatistics,
  };

  return (
    <FleetContext.Provider value={value}>
      {children}
    </FleetContext.Provider>
  );
};

