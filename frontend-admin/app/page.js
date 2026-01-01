'use client';

import { useState, useMemo } from 'react';
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
import { format, subDays, addHours, isWithinInterval } from 'date-fns';

// Mock rooms data
const ROOMS = [
  { id: 1, name: 'Room A101', capacity: 30, hasProjector: true, hasWhiteboard: true, hasAC: true },
  { id: 2, name: 'Room B205', capacity: 25, hasProjector: true, hasWhiteboard: false, hasAC: true },
  { id: 3, name: 'Room C102', capacity: 40, hasProjector: false, hasWhiteboard: true, hasAC: false },
  { id: 4, name: 'Room D301', capacity: 20, hasProjector: true, hasWhiteboard: true, hasAC: true },
];

// Mock calendar events
const generateMockEvents = (roomId) => {
  const events = [
    { id: 1, title: 'Morning Lecture', start: '08:00', end: '10:00', date: format(new Date(), 'yyyy-MM-dd') },
    { id: 2, title: 'Team Meeting', start: '11:00', end: '12:00', date: format(new Date(), 'yyyy-MM-dd') },
    { id: 3, title: 'Afternoon Workshop', start: '14:00', end: '16:00', date: format(new Date(), 'yyyy-MM-dd') },
    { id: 4, title: 'Evening Class', start: '17:00', end: '19:00', date: format(addHours(new Date(), 24), 'yyyy-MM-dd') },
  ];
  return events;
};

// Generate mock sensor data with some disconnection periods
const generateMockSensorData = (startDate, endDate, roomId) => {
  const data = [];
  let current = new Date(startDate);
  const end = new Date(endDate);

  let hourIndex = 0;

  while (current <= end) {
    // Create disconnection gaps at specific intervals (every ~40 hours for 5 hours)
    const isDisconnected = (hourIndex % 40 >= 35);

    if (!isDisconnected) {
      // Add some variation based on time of day
      const hour = current.getHours();
      const isWorkingHours = hour >= 8 && hour <= 18;

      data.push({
        timestamp: current.toISOString(),
        time: format(current, 'MM/dd HH:mm'),
        temperature: 20 + Math.random() * 5 + (isWorkingHours ? 2 : 0) + (roomId * 0.5),
        co2: 400 + Math.random() * 400 + (isWorkingHours ? 300 : 0),
        humidity: 40 + Math.random() * 20,
        sound: 25 + Math.random() * 20 + (isWorkingHours ? 15 : 0),
        disconnected: false,
      });
    } else {
      // Skip this data point entirely to create a gap
      data.push({
        timestamp: current.toISOString(),
        time: format(current, 'MM/dd HH:mm'),
        temperature: undefined,
        co2: undefined,
        humidity: undefined,
        sound: undefined,
        disconnected: true,
      });
    }

    current = addHours(current, 1);
    hourIndex++;
  }

  return data;
};

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
  const [selectedRoom, setSelectedRoom] = useState(1);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Get current room data
  const currentRoom = ROOMS.find(r => r.id === selectedRoom);
  const calendarEvents = useMemo(() => generateMockEvents(selectedRoom), [selectedRoom]);
  const sensorData = useMemo(
    () => generateMockSensorData(startDate, endDate, selectedRoom),
    [startDate, endDate, selectedRoom]
  );

  // Check for disconnection periods
  const disconnectionCount = sensorData.filter(d => d.disconnected).length;
  const hasDisconnections = disconnectionCount > 0;

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
                value={selectedRoom}
                label="Select Room"
                onChange={(e) => setSelectedRoom(e.target.value)}
              >
                {ROOMS.map((room) => (
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
                        label={currentRoom?.hasProjector ? 'Available' : 'Not Available'}
                        color={currentRoom?.hasProjector ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Whiteboard</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={currentRoom?.hasWhiteboard ? 'Available' : 'Not Available'}
                        color={currentRoom?.hasWhiteboard ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Air Conditioning</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={currentRoom?.hasAC ? 'Available' : 'Not Available'}
                        color={currentRoom?.hasAC ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
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
