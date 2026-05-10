import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind } from 'lucide-react';

interface WeatherData {
  temp: number;
  condition: string;
}

export const WeatherWidget = ({ city, lat, lng }: { city: string; lat?: number; lng?: number }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    if (!lat || !lng) {
      setWeather({ temp: 24, condition: 'Clear' });
      return;
    }

    const loadWeather = async () => {
      try {
        const res = await globalThis.fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
        if (!res.ok) throw new Error('Weather fetch failed');
        const data = await res.json();
        if (data && data.current_weather) {
          setWeather({ 
            temp: Math.round(data.current_weather.temperature), 
            condition: (data.current_weather.weathercode || 0).toString()
          });
        }
      } catch (err) {
        console.error('Weather error:', err);
      }
    };
    loadWeather();
    const interval = setInterval(loadWeather, 600000); 
    return () => clearInterval(interval);
  }, [lat, lng]);

  const Icon = weather?.condition === '0' || weather?.condition === '1' ? Sun : Cloud;

  return (
    <div className="flex items-center gap-4 bg-white/[0.03] p-5 rounded-[2rem] backdrop-blur-md border border-white/10 hover-glow">
      <div className="p-3 bg-romantic-gold/10 text-romantic-gold rounded-2xl">
        <Icon size={20} />
      </div>
      <div className="text-left">
        <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold mb-1">{city}</p>
        <p className="text-2xl font-serif font-light">{weather?.temp}°C</p>
      </div>
    </div>
  );
};
