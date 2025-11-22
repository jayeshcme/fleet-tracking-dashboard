import React, { useState, useEffect } from 'react';
import { Box, Paper, Divider, LinearProgress, SvgIconProps, Chip, Typography } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import BarChartIcon from '@mui/icons-material/BarChart';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { useFleet, FilterType } from '../contexts/FleetContext';
import './Sidebar.css';

interface StatisticsData {
  total: number;
  idle: number;
  en_route: number;
  delivered: number;
  average_speed: number;
  timestamp: string;
}

interface StatisticsResponse {
  success: boolean;
  data: StatisticsData;
}

interface FilterItem {
  filterType: FilterType;
  label: string;
  countKey: keyof StatisticsData;
  indicatorClass: string;
}

interface StatisticsItem {
  label: string;
  countKey: keyof StatisticsData;
  icon: React.ComponentType<SvgIconProps>;
}

const filterItems: FilterItem[] = [
  { filterType: 'all', label: 'All', countKey: 'total', indicatorClass: '' },
  { filterType: 'idle', label: 'Idle', countKey: 'idle', indicatorClass: '' },
  { filterType: 'en_route', label: 'En Route', countKey: 'en_route', indicatorClass: 'blue' },
  { filterType: 'delivered', label: 'Delivered', countKey: 'delivered', indicatorClass: 'green' },
];

const statisticsItems: StatisticsItem[] = [
  { label: 'Total Fleet', countKey: 'total', icon: GroupOutlinedIcon },
  { label: 'Avg Speed', countKey: 'average_speed', icon: SpeedOutlinedIcon},
  { label: 'Moving', countKey: 'en_route', icon:  TrendingUpIcon},
  { label: 'Last Update', countKey: 'timestamp', icon: AccessTimeIcon },
];

const Sidebar: React.FC = () => {
  const { 
    selectedFilter, 
    setSelectedFilter, 
    isConnected, 
    lastUpdateTime, 
    nextUpdateIn 
  } = useFleet();
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Format time ago (e.g., "3s ago", "2m ago")
  const formatTimeAgo = (date: Date | null): string => {
    if (!date) return '-';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Format time remaining (e.g., "2m 45s")
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) return `${minutes}m`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Format timestamp to 24-hour format (HH:mm)
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Fetch statistics from the API
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://case-study-26cf.onrender.com/api/statistics');
      
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      
      const data: StatisticsResponse = await response.json();
      
      if (data.success) {
        setStatistics(data.data);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return (
    <Box className="sidebar">
      
      {/* Filters Section */}
      <Paper elevation={1} className="section"> 

        {/* Live Updates Status */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
          <Chip
            icon={isConnected ? <WifiIcon /> : <WifiOffIcon />}
            label={isConnected ? 'Live Updates Active' : 'Live Updates Inactive'}
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
          />
        </Box>

        <Box className="sectionHeader">
          <FilterListIcon className="sectionIcon" />
          <h2>Filter by Status</h2>
        </Box>

        <Divider className="divider" />

        {loading && (
          <LinearProgress />
        )}
        
        {error && (
          <span className="filterStatusName" style={{ color: '#d32f2f' }}>{error}</span>
        )}

        {statistics && (
          <Box className="filterList">
            {filterItems.map((item) => (
              <Box 
                key={item.filterType}
                className={`filterTile ${selectedFilter === item.filterType ? 'selected' : ''}`}
                onClick={() => setSelectedFilter(item.filterType)}
              >
                <span className={`circleIndicator ${item.indicatorClass}`.trim()}></span>
                <Box className="filterTileContent">
                  <span className="filterStatusName">{item.label}</span>
                  <span className="filterCount">( {statistics[item.countKey]} )</span>
                </Box>
              </Box>
            ))}
          </Box>
        )}

      </Paper>

      {/* Statistics Section */}
      <Paper elevation={1} className="section">

        <Box className="sectionHeader">
          <BarChartIcon className="sectionIcon" />
          <h2>Fleet Statistics</h2>
        </Box>

        <Divider className="divider" />

        {loading && (
          <LinearProgress />
        )}

        {error && (
          <span className="filterStatusName" style={{ color: '#d32f2f' }}>{error}</span>
        )}

        {statistics && (
          <Box className="filterList">
            {statisticsItems.map((item) => (
              <Box 
                key={item.label}
                className={`statisticsTile`}
              >
                <div className="statisticsCount">
                  {item.countKey === 'timestamp' 
                    ? formatTimestamp(statistics[item.countKey] as string)
                    : statistics[item.countKey]
                  }
                </div>
                <div className="statisticsTileContent">
                  <item.icon className="statisticsIcon" />
                  <span className="statisticsLabel">{item.label}</span>
                </div>
              </Box>
            ))}
          </Box>
        )}

        {/* Update Status */}
        {lastUpdateTime && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="body2" color="text.secondary" align="center">
              Updated {formatTimeAgo(lastUpdateTime)} | Next update in ~{formatTimeRemaining(nextUpdateIn)}
            </Typography>
          </Box>
        )}

      </Paper>

    </Box>
  );
};

export default Sidebar;

