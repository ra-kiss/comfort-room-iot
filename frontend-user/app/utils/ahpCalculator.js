/**
 * AHP (Analytic Hierarchy Process) Calculator
 * Computes priority weights from pairwise comparisons using the Saaty scale
 */

export const CRITERIA = ['temperature', 'co2', 'humidity', 'sound'];

export const CRITERIA_LABELS = {
  temperature: 'Temperature',
  co2: 'CO2 Level',
  humidity: 'Humidity',
  sound: 'Sound Level'
};

// All pairwise comparisons needed (n*(n-1)/2 = 6 for 4 criteria)
export const COMPARISONS = [
  { a: 'temperature', b: 'co2' },
  { a: 'temperature', b: 'humidity' },
  { a: 'temperature', b: 'sound' },
  { a: 'co2', b: 'humidity' },
  { a: 'co2', b: 'sound' },
  { a: 'humidity', b: 'sound' },
];

/**
 * Builds the pairwise comparison matrix from user inputs
 * @param {Object} comparisons - Object with keys like "temperature_co2" and Saaty scale values
 * @returns {number[][]} - 4x4 comparison matrix
 */
export function buildComparisonMatrix(comparisons) {
  const n = CRITERIA.length;
  const matrix = Array(n).fill(null).map(() => Array(n).fill(1));

  COMPARISONS.forEach(({ a, b }) => {
    const key = `${a}_${b}`;
    const value = comparisons[key] || 1;
    const i = CRITERIA.indexOf(a);
    const j = CRITERIA.indexOf(b);

    matrix[i][j] = value;
    matrix[j][i] = 1 / value; // Reciprocal
  });

  return matrix;
}

/**
 * Calculates priority weights using the geometric mean method (more stable than eigenvalue)
 * @param {number[][]} matrix - Pairwise comparison matrix
 * @returns {number[]} - Normalized weights that sum to 1
 */
export function calculateWeights(matrix) {
  const n = matrix.length;

  // Calculate geometric mean of each row
  const geometricMeans = matrix.map(row => {
    const product = row.reduce((acc, val) => acc * val, 1);
    return Math.pow(product, 1 / n);
  });

  // Normalize to get weights
  const sum = geometricMeans.reduce((acc, val) => acc + val, 0);
  return geometricMeans.map(gm => gm / sum);
}

/**
 * Calculates consistency ratio to check if comparisons are logically consistent
 * @param {number[][]} matrix - Pairwise comparison matrix
 * @param {number[]} weights - Calculated weights
 * @returns {number} - Consistency ratio (should be < 0.1 for acceptable consistency)
 */
export function calculateConsistencyRatio(matrix, weights) {
  const n = matrix.length;

  // Random Index values for matrices of size 1-10
  const RI = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];

  // Calculate weighted sum for each row
  const weightedSums = matrix.map(row =>
    row.reduce((sum, val, j) => sum + val * weights[j], 0)
  );

  // Calculate lambda max
  const lambdaMax = weightedSums.reduce((sum, ws, i) =>
    sum + ws / weights[i], 0) / n;

  // Consistency Index
  const CI = (lambdaMax - n) / (n - 1);

  // Consistency Ratio
  const CR = CI / RI[n];

  return CR;
}

/**
 * Main function to compute AHP weights from pairwise comparisons
 * @param {Object} comparisons - Object with comparison values
 * @returns {Object} - { weights: {criterion: weight}, consistencyRatio: number, isConsistent: boolean }
 */
export function computeAHPWeights(comparisons) {
  const matrix = buildComparisonMatrix(comparisons);
  const weightsArray = calculateWeights(matrix);
  const cr = calculateConsistencyRatio(matrix, weightsArray);

  const weights = {};
  CRITERIA.forEach((criterion, i) => {
    weights[criterion] = weightsArray[i];
  });

  return {
    weights,
    consistencyRatio: cr,
    isConsistent: cr < 0.1
  };
}

// Saaty scale labels for UI
export const SAATY_SCALE_LABELS = {
  9: 'Extremely more important',
  7: 'Very strongly more important',
  5: 'Strongly more important',
  3: 'Moderately more important',
  1: 'Equal importance',
};
