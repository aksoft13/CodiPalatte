require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// =====================
// WEATHER ROUTE (Public)
// =====================

function wttrCodeToKr(code) {
  const c = parseInt(code);
  if (c === 113) return { icon: '☀️', condition: '맑음' };
  if (c === 116) return { icon: '⛅', condition: '구름 조금' };
  if ([119, 122].includes(c)) return { icon: '☁️', condition: '흐림' };
  if ([143, 248, 260].includes(c)) return { icon: '🌫️', condition: '안개' };
  if (c === 200) return { icon: '⛈️', condition: '천둥 가능' };
  if ([176, 263, 266, 281, 284, 293, 296].includes(c)) return { icon: '🌦️', condition: '가벼운 비' };
  if ([299, 302, 305, 308, 353, 356, 359].includes(c)) return { icon: '🌧️', condition: '비' };
  if ([386, 389, 392, 395].includes(c)) return { icon: '⛈️', condition: '천둥번개' };
  if ([179, 317, 320, 323, 326, 329, 332, 362, 365].includes(c)) return { icon: '🌨️', condition: '눈' };
  if ([227, 230, 335, 338, 350, 368, 371, 374, 377].includes(c)) return { icon: '❄️', condition: '폭설' };
  return { icon: '🌤️', condition: '흐림' };
}

function omCodeToKr(code) {
  if (code === 0) return { icon: '☀️', condition: '맑음' };
  if (code <= 2) return { icon: '⛅', condition: '구름 조금' };
  if (code === 3) return { icon: '☁️', condition: '흐림' };
  if (code <= 48) return { icon: '🌫️', condition: '안개' };
  if (code <= 55) return { icon: '🌦️', condition: '가벼운 비' };
  if (code <= 65) return { icon: '🌧️', condition: '비' };
  if (code <= 77) return { icon: '🌨️', condition: '눈' };
  if (code <= 82) return { icon: '🌧️', condition: '비' };
  if (code <= 86) return { icon: '🌨️', condition: '눈' };
  return { icon: '⛈️', condition: '천둥번개' };
}

app.get('/api/weather', async (_req, res) => {
  try {
    const [wttrRes, omRes] = await Promise.all([
      fetch('https://wttr.in/Seoul?format=j1', { timeout: 6000, headers: { 'Accept': 'application/json', 'User-Agent': 'curl/7.68.0' } }),
      fetch('https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FSeoul&forecast_days=7', { timeout: 6000 }),
    ]);
    const wttrData = await wttrRes.json();
    const omData = await omRes.json();

    const cur = wttrData.current_condition[0];
    const curW = wttrCodeToKr(cur.weatherCode);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    const weekly = omData.daily.time.map((dateStr, i) => {
      const d = new Date(dateStr + 'T00:00:00');
      const label = i === 0 ? '오늘' : i === 1 ? '내일' : dayNames[d.getDay()];
      const w = omCodeToKr(omData.daily.weather_code[i]);
      return { day: label, icon: w.icon, high: Math.round(omData.daily.temperature_2m_max[i]), low: Math.round(omData.daily.temperature_2m_min[i]) };
    });

    res.json({
      city: '서울',
      temp: parseInt(cur.temp_C),
      condition: curW.condition,
      icon: curW.icon,
      morning: parseInt(wttrData.weather[0].hourly[3].tempC),
      evening: parseInt(wttrData.weather[0].hourly[6].tempC),
      humidity: parseInt(cur.humidity),
      wind: (parseInt(cur.windspeedKmph) / 3.6).toFixed(1),
      weekly,
    });
  } catch (err) {
    console.error('Weather fetch error:', err.message);
    res.status(500).json({ error: 'Weather fetch failed' });
  }
});

// =====================
// SPA Fallback
// =====================
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'prototype-v1.html'));
});

// =====================
// Error Handler
// =====================
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// =====================
// Start
// =====================
if (require.main === module) {
  app.listen(PORT, () => console.log(`CodiPalette v2 server running on http://localhost:${PORT}`));
}

module.exports = app;
