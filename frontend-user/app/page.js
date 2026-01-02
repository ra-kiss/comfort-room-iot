'use client';

import { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Slider,
  Box,
  Paper,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  CRITERIA,
  CRITERIA_LABELS,
  COMPARISONS,
  computeAHPWeights,
} from './utils/ahpCalculator';

// Saaty scale marks for the comparison sliders
const saatyMarks = [
  { value: 1/9, label: '9' },
  { value: 1/7, label: '7' },
  { value: 1/5, label: '5' },
  { value: 1/3, label: '3' },
  { value: 1, label: '1' },
  { value: 3, label: '3' },
  { value: 5, label: '5' },
  { value: 7, label: '7' },
  { value: 9, label: '9' },
];

// Convert slider position (0-16) to Saaty value
function sliderToSaaty(pos) {
  const values = [1/9, 1/7, 1/5, 1/3, 1, 3, 5, 7, 9];
  return values[pos] || 1;
}

// Convert Saaty value to slider position
function saatyToSlider(value) {
  const values = [1/9, 1/7, 1/5, 1/3, 1, 3, 5, 7, 9];
  const idx = values.findIndex(v => Math.abs(v - value) < 0.01);
  return idx >= 0 ? idx : 4;
}

function PairwiseSlider({ criterionA, criterionB, value, onChange }) {
  const labelA = CRITERIA_LABELS[criterionA];
  const labelB = CRITERIA_LABELS[criterionB];
  const sliderPos = saatyToSlider(value);

  const getImportanceText = () => {
    if (value === 1) return 'Equal importance';
    if (value > 1) return `${labelA} is ${value}x more important`;
    return `${labelB} is ${Math.round(1/value)}x more important`;
  };

  return (
    <Box sx={{ mb: 3, px: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" fontWeight="bold" color="primary">
          {labelA}
        </Typography>
        <Typography variant="body2" fontWeight="bold" color="secondary">
          {labelB}
        </Typography>
      </Box>
      <Slider
        value={sliderPos}
        onChange={(e, newVal) => onChange(sliderToSaaty(newVal))}
        min={0}
        max={8}
        step={1}
        marks={[
          { value: 0, label: '9' },
          { value: 2, label: '5' },
          { value: 4, label: '1' },
          { value: 6, label: '5' },
          { value: 8, label: '9' },
        ]}
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
        {getImportanceText()}
      </Typography>
    </Box>
  );
}

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ paddingTop: 16 }}>
      {value === index && children}
    </div>
  );
}

export default function Home() {
  const [tabValue, setTabValue] = useState(0);

  // Desired profile state
  const [desiredProfile, setDesiredProfile] = useState({
    temperature: 22,
    co2: 600,
    humidity: 50,
    sound: 35,
  });

  // Pairwise comparisons state (Saaty values)
  const [comparisons, setComparisons] = useState({
    temperature_co2: 1,
    temperature_humidity: 1,
    temperature_sound: 1,
    co2_humidity: 1,
    co2_sound: 1,
    humidity_sound: 1,
  });

  // Room requirements state
  const [requirements, setRequirements] = useState({
    minCapacity: 10,
    needsProjector: false,
    needsWhiteboard: false,
  });

  // Results state
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Compute AHP weights whenever comparisons change
  const ahpResult = useMemo(() => computeAHPWeights(comparisons), [comparisons]);

  const handleComparisonChange = (key, value) => {
    setComparisons(prev => ({ ...prev, [key]: value }));
  };

  const handleDesiredProfileChange = (key, value) => {
    setDesiredProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleFindRooms = async () => {
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weights: ahpResult.weights,
          desired_profile: desiredProfile,
          requirements: {
            min_capacity: requirements.minCapacity,
            needs_projector: requirements.needsProjector,
            needs_whiteboard: requirements.needsWhiteboard,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Map backend response to frontend format
      const mappedRooms = data.map((room) => ({
        id: room.room_id,
        name: room.room_name,
        score: room.score,
        capacity: room.facilities.capacity,
        hasProjector: room.facilities.has_projector,
        hasWhiteboard: room.facilities.has_whiteboard,
      }));

      setResults({
        rooms: mappedRooms,
        weights: ahpResult.weights,
        desiredProfile,
        requirements,
      });
    } catch (error) {
      console.error('Failed to fetch room recommendations:', error);
      alert('Failed to fetch recommendations. Make sure the backend is running on http://localhost:8000');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        ComfortRoom
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Find the most comfortable room based on your preferences
      </Typography>

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label="Room Finder" />
        <Tab label="API Documentation" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        {/* Section 1: Desired Profile */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Desired Profile
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Set your ideal room conditions. Rooms closer to these values will score higher.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>Temperature: {desiredProfile.temperature}°C</Typography>
            <Slider
              value={desiredProfile.temperature}
              onChange={(e, v) => handleDesiredProfileChange('temperature', v)}
              min={16}
              max={28}
              step={1}
              marks={[
                { value: 16, label: '16°C' },
                { value: 22, label: '22°C' },
                { value: 28, label: '28°C' },
              ]}
              valueLabelDisplay="auto"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>CO2 Level: {desiredProfile.co2} ppm</Typography>
            <Slider
              value={desiredProfile.co2}
              onChange={(e, v) => handleDesiredProfileChange('co2', v)}
              min={400}
              max={1500}
              step={50}
              marks={[
                { value: 400, label: '400' },
                { value: 800, label: '800' },
                { value: 1200, label: '1200' },
                { value: 1500, label: '1500' },
              ]}
              valueLabelDisplay="auto"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>Humidity: {desiredProfile.humidity}%</Typography>
            <Slider
              value={desiredProfile.humidity}
              onChange={(e, v) => handleDesiredProfileChange('humidity', v)}
              min={20}
              max={80}
              step={5}
              marks={[
                { value: 20, label: '20%' },
                { value: 50, label: '50%' },
                { value: 80, label: '80%' },
              ]}
              valueLabelDisplay="auto"
            />
          </Box>

          <Box>
            <Typography gutterBottom>Sound Level: {desiredProfile.sound} dB</Typography>
            <Slider
              value={desiredProfile.sound}
              onChange={(e, v) => handleDesiredProfileChange('sound', v)}
              min={20}
              max={70}
              step={5}
              marks={[
                { value: 20, label: '20dB' },
                { value: 35, label: '35dB' },
                { value: 50, label: '50dB' },
                { value: 70, label: '70dB' },
              ]}
              valueLabelDisplay="auto"
            />
          </Box>
        </Paper>

        {/* Section 2: AHP Pairwise Comparisons */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Criteria Importance (Saaty Scale)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Compare how important each criterion is relative to others. Slide towards a criterion to make it more important.
          </Typography>

          {COMPARISONS.map(({ a, b }) => (
            <PairwiseSlider
              key={`${a}_${b}`}
              criterionA={a}
              criterionB={b}
              value={comparisons[`${a}_${b}`]}
              onChange={(v) => handleComparisonChange(`${a}_${b}`, v)}
            />
          ))}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Computed Weights:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {CRITERIA.map((c) => (
              <Chip
                key={c}
                label={`${CRITERIA_LABELS[c]}: ${(ahpResult.weights[c] * 100).toFixed(1)}%`}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>

          {!ahpResult.isConsistent && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Your comparisons may be inconsistent (CR: {ahpResult.consistencyRatio.toFixed(2)}).
              Try adjusting your preferences to be more logically consistent.
            </Alert>
          )}
        </Paper>

        {/* Section 3: Room Requirements */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Room Requirements
          </Typography>

          <TextField
            label="Minimum Capacity"
            type="number"
            value={requirements.minCapacity}
            onChange={(e) => setRequirements(prev => ({ ...prev, minCapacity: parseInt(e.target.value) || 0 }))}
            size="small"
            sx={{ mb: 2, mr: 2 }}
          />

          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={requirements.needsProjector}
                  onChange={(e) => setRequirements(prev => ({ ...prev, needsProjector: e.target.checked }))}
                />
              }
              label="Needs Projector"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={requirements.needsWhiteboard}
                  onChange={(e) => setRequirements(prev => ({ ...prev, needsWhiteboard: e.target.checked }))}
                />
              }
              label="Needs Whiteboard"
            />
          </Box>
        </Paper>

        {/* Find Rooms Button */}
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleFindRooms}
          disabled={loading}
          sx={{ mb: 3 }}
        >
          {loading ? 'Finding Rooms...' : 'Find Rooms'}
        </Button>

        {/* Results Section */}
        {results && (
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recommended Rooms
            </Typography>
            <List>
              {results.rooms.map((room, index) => (
                <ListItem key={room.id} divider={index < results.rooms.length - 1}>
                  <ListItemIcon>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      #{index + 1}
                    </Typography>
                  </ListItemIcon>
                  <ListItemText
                    disableTypography
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {room.name}
                        </Typography>
                        <Chip label={`Score: ${room.score}`} color="success" size="small" />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Capacity: {room.capacity} |{' '}
                        {room.hasProjector ? 'Projector' : 'No Projector'} |{' '}
                        {room.hasWhiteboard ? 'Whiteboard' : 'No Whiteboard'}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper elevation={2} sx={{ p: 2, height: '70vh' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            API documentation will be available when the backend is running.
          </Typography>
          <iframe
            src="http://localhost:8000/docs"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Swagger API Documentation"
          />
        </Paper>
      </TabPanel>
    </Container>
  );
}
