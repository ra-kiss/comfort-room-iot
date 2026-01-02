'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  List,
  ListItem,
  ListItemText,
  Grid,
  TextField,
  Alert,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { format, subDays, addHours, parseISO } from 'date-fns';

// Chart component with disconnection highlighting
function SensorChart({ data, dataKey, label, unit, color, optimalRange }) {
  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        {label}
      </Typography>
      <Box sx={{ width: '100%', height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              domain={['auto', 'auto']}
              unit={unit}
            />
            <Tooltip
              formatter={(value) => value != null ? [`${value?.toFixed(1)}${unit}`, label] : ['Disconnected', '']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            {optimalRange && (
              <ReferenceArea
                y1={optimalRange[0]}
                y2={optimalRange[1]}
                fill="#4caf50"
                fillOpacity={0.1}
              />
            )}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

export default function AdminDashboard() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sensorData, setSensorData] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch rooms on mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/rooms');
        if (!response.ok) throw new Error('Failed to fetch rooms');
        const data = await response.json();
        setRooms(data);
        if (data.length > 0) {
          setSelectedRoom(data[0].id);
        }
      } catch (err) {
        setError('Failed to load rooms. Make sure the backend is running on http://localhost:8000');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  // Fetch sensor data when room or date range changes
  useEffect(() => {
    if (!selectedRoom) return;

    const fetchSensorData = async () => {
      try {
        const startISO = new Date(startDate).toISOString();
        const endISO = new Date(endDate + 'T23:59:59').toISOString();
        const url = `http://localhost:8000/api/sensors/${selectedRoom}?start=${startISO}&end=${endISO}&limit=1000`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch sensor data');
        const data = await response.json();

        // Map to chart format
        const mappedData = data.reverse().map((d) => ({
          timestamp: d.timestamp,
          time: format(parseISO(d.timestamp), 'MM/dd HH:mm'),
          temperature: d.temperature,
          co2: d.co2,
          humidity: d.humidity,
          sound: d.sound,
          disconnected: false,
        }));

        setSensorData(mappedData);
      } catch (err) {
        console.error('Failed to fetch sensor data:', err);
        setSensorData([]);
      }
    };

    fetchSensorData();
  }, [selectedRoom, startDate, endDate]);

  // Fetch calendar events when room changes
  useEffect(() => {
    if (!selectedRoom) return;

    const fetchCalendarEvents = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/calendar/${selectedRoom}`);
        if (!response.ok) throw new Error('Failed to fetch calendar events');
        const data = await response.json();

        // Map to display format
        const mappedEvents = data.map((e) => ({
          id: e.id,
          title: e.title,
          start: format(parseISO(e.start_time), 'HH:mm'),
          end: format(parseISO(e.end_time), 'HH:mm'),
          date: format(parseISO(e.start_time), 'yyyy-MM-dd'),
        }));

        setCalendarEvents(mappedEvents);
      } catch (err) {
        console.error('Failed to fetch calendar events:', err);
        setCalendarEvents([]);
      }
    };

    fetchCalendarEvents();
  }, [selectedRoom]);

  // Get current room data
  const currentRoom = rooms.find(r => r.id === selectedRoom);

  // Check for disconnection periods
  const disconnectionCount = sensorData.filter(d => d.disconnected).length;
  const hasDisconnections = disconnectionCount > 0;

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        ComfortRoom Admin Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Monitor sensor data and room facilities
      </Typography>

      {/* Controls Row */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Room</InputLabel>
              <Select
                value={selectedRoom || ''}
                label="Select Room"
                onChange={(e) => setSelectedRoom(e.target.value)}
              >
                {rooms.map((room) => (
                  <MenuItem key={room.id} value={room.id}>
                    {room.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {sensorData.length} data points
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Disconnection Alert */}
      {hasDisconnections && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Sensor disconnections detected: {disconnectionCount} periods with missing data in the selected range.
          Gaps in the charts indicate periods when sensors were offline.
        </Alert>
      )}

      {/* Sensor Charts */}
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Sensor Data Over Time
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SensorChart
            data={sensorData}
            dataKey="temperature"
            label="Temperature"
            unit="°C"
            color="#f44336"
            optimalRange={[20, 24]}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SensorChart
            data={sensorData}
            dataKey="co2"
            label="CO2 Level"
            unit=" ppm"
            color="#2196f3"
            optimalRange={[400, 1000]}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SensorChart
            data={sensorData}
            dataKey="humidity"
            label="Humidity"
            unit="%"
            color="#4caf50"
            optimalRange={[40, 60]}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SensorChart
            data={sensorData}
            dataKey="sound"
            label="Sound Level"
            unit=" dB"
            color="#ff9800"
            optimalRange={[20, 35]}
          />
        </Grid>
      </Grid>

      {/* Room Facilities & Calendar */}
      <Grid container spacing={3}>
        {/* Room Facilities Table */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Room Facilities - {currentRoom?.name}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Facility</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Capacity</TableCell>
                    <TableCell align="center">{currentRoom?.capacity} people</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Projector</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={currentRoom?.has_projector ? 'Available' : 'Not Available'}
                        color={currentRoom?.has_projector ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Whiteboard</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={currentRoom?.has_whiteboard ? 'Available' : 'Not Available'}
                        color={currentRoom?.has_whiteboard ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Accessible</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={currentRoom?.is_accessible ? 'Yes' : 'No'}
                        color={currentRoom?.is_accessible ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Power Outlets</TableCell>
                    <TableCell align="center">{currentRoom?.has_power_outlets || 0}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Calendar Events */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Events - {currentRoom?.name}
            </Typography>
            <List dense>
              {calendarEvents.map((event) => (
                <ListItem key={event.id} divider>
                  <ListItemText
                    primary={event.title}
                    secondary={`${event.date} | ${event.start} - ${event.end}`}
                  />
                </ListItem>
              ))}
              {calendarEvents.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No upcoming events"
                    secondary="This room has no scheduled events"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
