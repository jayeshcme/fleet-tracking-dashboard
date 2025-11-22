import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  LinearProgress,
  IconButton,
  Divider,
  Chip,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NavigationIcon from '@mui/icons-material/Navigation';
import BatteryIcon from '@mui/icons-material/BatteryStd';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import './VehicleDetailModal.css';

interface CurrentLocation {
  lat: number;
  lng: number;
}

interface VehicleDetails {
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
  // Add any additional fields from API response
  [key: string]: any;
}

interface VehicleDetailModalProps {
  open: boolean;
  vehicleId: string | null;
  onClose: () => void;
}

const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({ open, vehicleId, onClose }) => {
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get status color (matching VehicleList logic)
  const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'delivered') return 'success';
    if (statusLower === 'en_route' || statusLower === 'en route') return 'primary';
    if (statusLower === 'idle') return 'default';
    return 'default';
  };

  // Format location from lat/lng
  const formatLocation = (location: CurrentLocation | undefined): string => {
    if (!location || location.lat === undefined || location.lng === undefined) {
      return '-';
    }
    return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
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

  // Get progress bar color based on percentage
  const getProgressColor = (percentage: number): string => {
    if (percentage <= 30) return '#d32f2f'; // Red
    if (percentage <= 60) return '#ed6c02'; // Orange
    return '#2e7d32'; // Green
  };

  const fetchVehicleDetails = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://case-study-26cf.onrender.com/api/vehicles/${id}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch vehicle details');
      }

      const data = await response.json();

      if (data.success === false) {
        throw new Error('API returned unsuccessful response');
      }

      setVehicleDetails(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching vehicle details:', err);
      setVehicleDetails(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && vehicleId) {
      fetchVehicleDetails(vehicleId);
    } else {
      // Reset state when modal closes
      setVehicleDetails(null);
      setError(null);
    }
  }, [open, vehicleId, fetchVehicleDetails]);

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle className="modalHeader">
        <div className="modalHeaderContent">
          <div className="modalHeaderLeft">
            <div className="modalHeaderTitle">
              <DirectionsCarIcon color="primary" />
              <div className="modalTitle">
                {vehicleDetails?.vehicleNumber || 'Vehicle Details'}
              </div>
            </div>
            <div className="modalHeaderSubtitle">
              <PersonIcon fontSize="small" color="action" />
              <div className="modalSubtitle">
                {vehicleDetails?.driverName || '-'}
              </div>
            </div>
          </div>
          <IconButton
            onClick={handleClose}
            className="modalCloseButton"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </div>
      </DialogTitle>
      <Divider />
      {loading && <LinearProgress />}
      <DialogContent>
        {error && (
          <div className="errorMessage">
            {error}
          </div>
        )}
        {vehicleDetails && !loading && (
          <div className="modalBody">
            <div className="modalGrid">
                <div className="modalStack">
                  <div className="modalStackHeader">
                    <CheckCircleIcon className="modalStackIcon" fontSize="small" />
                    <div className="modalStackLabel">
                      Status
                    </div>
                  </div>
                  <div className="modalStackValue">
                    <Chip
                      label={vehicleDetails.status?.replace('_', ' ').toUpperCase() || '-'}
                      variant="outlined"
                      size="small"
                      color={getStatusColor(vehicleDetails.status || '')}
                    />
                  </div>
                </div>
                <div className="modalStack">
                  <div className="modalStackHeader">
                    <SpeedOutlinedIcon className="modalStackIcon" fontSize="small" />
                    <div className="modalStackLabel">
                      Current Speed
                    </div>
                  </div>
                  <div className="modalStackValue">
                    <Chip
                      label={
                        vehicleDetails.speed !== undefined && vehicleDetails.speed !== null
                          ? `${vehicleDetails.speed} mph`
                          : '-'
                      }
                      size="small"
                      color="default"
                    />
                  </div>
                </div>
                <div className="modalStack">
                  <div className="modalStackHeader">
                    <PersonIcon className="modalStackIcon" fontSize="small" />
                    <div className="modalStackLabel">
                      Driver
                    </div>
                  </div>
                  <div className="modalStackValue">
                    {vehicleDetails.driverName || '-'}
                  </div>
                </div>
                <div className="modalStack">
                  <div className="modalStackHeader">
                    <PhoneIcon className="modalStackIcon" fontSize="small" />
                    <div className="modalStackLabel">
                      Phone
                    </div>
                  </div>
                  <div className="modalStackValue">
                    {vehicleDetails.driverPhone || '-'}
                  </div>
                </div>
                <div className="modalStack">
                  <div className="modalStackHeader">
                    <LocationOnIcon className="modalStackIcon" fontSize="small" />
                    <div className="modalStackLabel">
                      Destination
                    </div>
                  </div>
                  <div className="modalStackValue">
                    {vehicleDetails.destination || '-'}
                  </div>
                </div>
                <div className="modalStack">
                  <div className="modalStackHeader">
                    <NavigationIcon className="modalStackIcon" fontSize="small" />
                    <div className="modalStackLabel">
                      Location
                    </div>
                  </div>
                  <div className="modalStackValue">
                    {formatLocation(vehicleDetails.currentLocation)}
                  </div>
                </div>
                <div className="modalStack">
                  <div className="modalStackHeader">
                    <BatteryIcon className="modalStackIcon" fontSize="small" />
                    <div className="modalStackLabel">
                      Battery Level
                    </div>
                  </div>
                  <div className="modalStackValue">
                    <div className="progressContainer">
                      <LinearProgress
                        variant="determinate"
                        value={vehicleDetails.batteryLevel || 0}
                        className="progressBar"
                        sx={{
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getProgressColor(vehicleDetails.batteryLevel || 0),
                          },
                        }}
                      />
                      <div className="progressLabel">
                        {vehicleDetails.batteryLevel !== undefined && vehicleDetails.batteryLevel !== null
                          ? `${vehicleDetails.batteryLevel}%`
                          : '-'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modalStack">
                  <div className="modalStackHeader">
                    <LocalGasStationIcon className="modalStackIcon" fontSize="small" />
                    <div className="modalStackLabel">
                      Fuel Level
                    </div>
                  </div>
                  <div className="modalStackValue">
                    <div className="progressContainer">
                      <LinearProgress
                        variant="determinate"
                        value={vehicleDetails.fuelLevel || 0}
                        className="progressBar"
                        sx={{
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getProgressColor(vehicleDetails.fuelLevel || 0),
                          },
                        }}
                      />
                      <div className="progressLabel">
                        {vehicleDetails.fuelLevel !== undefined && vehicleDetails.fuelLevel !== null
                          ? `${vehicleDetails.fuelLevel}%`
                          : '-'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modalStack">
                  <div className="modalStackHeader">
                    <AccessTimeIcon className="modalStackIcon" fontSize="small" />
                    <div className="modalStackLabel">
                      Last Updated
                    </div>
                  </div>
                  <div className="modalStackValue">
                    {vehicleDetails.lastUpdated
                      ? formatDateTime(vehicleDetails.lastUpdated)
                      : '-'}
                  </div>
                </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VehicleDetailModal;

