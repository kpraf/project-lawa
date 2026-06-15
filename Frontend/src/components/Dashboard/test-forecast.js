// Test file to check for compilation issues
import { transformForecastData, fetchForecastData } from './helpers.js';
import forecastData from '../../data/water_forecast.json';

console.log('Forecast data available:', Object.keys(forecastData).length, 'stations');
console.log('Transform function available:', typeof transformForecastData);
console.log('Fetch function available:', typeof fetchForecastData);
