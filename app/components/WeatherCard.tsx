import React from 'react';

// Definimos los tipos de datos que recibirá la tarjeta
// Deben coincidir con lo que devuelve el 'execute' de tu backend
export interface WeatherProps {
  location: string;
  temp: number;
  description: string;
}

export const WeatherCard: React.FC<WeatherProps> = ({ location, temp, description }) => {
  // Un emoji básico dependiendo de la temperatura simulada
  const getIcon = (t: number) => {
    if (t > 30) return '☀️🔥';
    if (t > 20) return '🌤️';
    return '☁️';
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-sm mt-3 ml-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500 tracking-wider uppercase">
            Clima Simulado
          </h3>
          <p className="text-2xl font-bold text-gray-950 mt-1">{location}</p>
        </div>
        <div className="text-5xl">{getIcon(temp)}</div>
      </div>
      
      <div className="flex items-end justify-between mt-6">
        <p className="text-6xl font-extrabold text-gray-950 tracking-tight">
          {temp}°<span className="text-4xl text-gray-400">C</span>
        </p>
        <p className="text-base font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
          {description}
        </p>
      </div>
    </div>
  );
};