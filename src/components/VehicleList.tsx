import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Divider,
  Link,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { useFleet } from '../contexts/FleetContext';
import VehicleDetailModal from './VehicleDetailModal';
import './VehicleList.css';

interface CurrentLocation {
  lat: number;
  lng: number;
}

interface Vehicle {
  id: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  status: string;
  destination: string;
  currentLocation: CurrentLocation;
  speed: number;
  lastUpdated: string;
  estimatedArrival: string;
  batteryLevel: number;
  fuelLevel: number;
}

interface VehiclesResponse {
  success?: boolean;
  total: number;
  data: Vehicle[];
}

interface VehicleListProps {
  limit?: number;
}

const VehicleList: React.FC<VehicleListProps> = ({ limit = 100 }) => {
  const { selectedFilter, isConnected, wsVehicles } = useFleet();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Handle vehicle number click
  const handleVehicleClick = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedVehicleId(null);
  };

  // Format date and time to dd/mm/yyyy, hh:mm:ss format
  const formatDateTime = (timestamp: string | undefined): string => {
    if (!timestamp) return '-';
    try {
      const date = new Date(timestamp);
      const day = date.getUTCDate().toString().padStart(2, '0');
      const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const year = date.getUTCFullYear();
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      const seconds = date.getUTCSeconds().toString().padStart(2, '0');
      return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
    } catch {
      return timestamp;
    }
  };

  // Format location from lat/lng
  const formatLocation = (location: CurrentLocation | undefined): string => {
    if (!location || location.lat === undefined || location.lng === undefined) {
      return '-';
    }
    return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
  };

  // Format ETA from estimatedArrival timestamp
  const formatETA = (estimatedArrival: string | undefined): string => {
    if (!estimatedArrival) return '-';
    return formatDateTime(estimatedArrival);
  };

  // Get status color
  const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'delivered') return 'success';
    if (statusLower === 'en_route' || statusLower === 'en route') return 'primary';
    if (statusLower === 'idle') return 'default';
    return 'default';
  };

  // Fetch vehicles from API
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedFilter !== 'all') {
        params.append('status', selectedFilter);
      }
      params.append('limit', limit.toString());

      const response = await fetch(
        `https://case-study-26cf.onrender.com/api/vehicles?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }

      const data: VehiclesResponse = await response.json();

      if (data.success === false) {
        throw new Error('API returned unsuccessful response');
      }

      setVehicles(data.data || []);
      setCount(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching vehicles:', err);
      setVehicles([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [selectedFilter, limit]);

  // Filter vehicles based on selected filter
  const getFilteredVehicles = useCallback((vehicleList: Vehicle[]): Vehicle[] => {
    if (selectedFilter === 'all') {
      return vehicleList;
    }
    return vehicleList.filter((vehicle) => vehicle.status === selectedFilter);
  }, [selectedFilter]);

  // Initial API fetch on mount (only if no WebSocket data)
  useEffect(() => {
    if (!wsVehicles || wsVehicles.length === 0) {
      fetchVehicles();
    }
  }, [fetchVehicles, wsVehicles]);

  // Update vehicles when WebSocket data arrives or filter changes
  useEffect(() => {
    if (wsVehicles && wsVehicles.length > 0) {
      // Use WebSocket data and apply filter
      const filtered = getFilteredVehicles(wsVehicles);
      setVehicles(filtered.slice(0, limit));
      setCount(filtered.length);
      setLoading(false);
      setError(null);
    }
  }, [wsVehicles, selectedFilter, limit, getFilteredVehicles]);

  return (
    <Box className="vehicleList">
      <Paper elevation={1} className="vehiclePaper">
        <Box className="vehicleHeader">
          <DirectionsCarIcon className="vehicleIcon" />
          <h2 className="vehicleTitle">
            Vehicles ({count})
          </h2>
          <Chip
            label={isConnected ? 'Live' : 'Offline'}
            color={isConnected ? 'success' : 'default'}
            size="small"
            sx={{ ml: 'auto' }}
            variant="outlined"
          />
        </Box>
        <Divider className="vehicleDivider" />

        {loading && <LinearProgress />}

        {error && (
          <Typography variant="body2" color="error" sx={{ p: 2 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && (
          <TableContainer className="tableContainer">
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Driver</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Speed</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>ETA</TableCell>
                  <TableCell>Last Update</TableCell>
                  <TableCell>Location</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No vehicles found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <Link
                          component="button"
                          variant="body2"
                          onClick={() => handleVehicleClick(vehicle.id)}
                          sx={{
                            cursor: 'pointer',
                            textDecoration: 'none',
                            color: 'primary.main',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          {vehicle.vehicleNumber || '-'}
                        </Link>
                      </TableCell>
                      <TableCell>{vehicle.driverName || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          className="statusChip"
                          label={vehicle.status.replace('_', ' ').toUpperCase() || '-'}
                          variant="outlined"
                          size="small"
                          color={getStatusColor(vehicle.status || '')}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          className="speedChip"
                          label={vehicle.speed !== undefined && vehicle.speed !== null
                            ? `${vehicle.speed} mph`
                            : '-'}
                          size="small"
                          color="default"
                        />
                      </TableCell>
                      <TableCell>{vehicle.destination || '-'}</TableCell>
                      <TableCell>{formatETA(vehicle.estimatedArrival)}</TableCell>
                      <TableCell>
                        {vehicle.lastUpdated
                          ? formatDateTime(vehicle.lastUpdated)
                          : '-'}
                      </TableCell>
                      <TableCell>{formatLocation(vehicle.currentLocation)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      <VehicleDetailModal
        open={modalOpen}
        vehicleId={selectedVehicleId}
        onClose={handleCloseModal}
      />
    </Box>
  );
};

export default VehicleList;

