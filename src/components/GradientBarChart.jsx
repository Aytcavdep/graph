// src/components/AllCarsBarChart.jsx
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const GradientBarChart  = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data.csv');
        const csvText = await response.text();

        Papa.parse(csvText, {
          delimiter: ';',
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const carMap = new Map();

            results.data.forEach((row) => {
              const carNumber = row['Гос. номер']?.toUpperCase();
              const distance = parseFloat(
                row['Пробег в поездках']?.replace(/\s/g, '') || 0,
              );

              if (carNumber && distance > 0) {
                if (!carMap.has(carNumber)) {
                  carMap.set(carNumber, {
                    carNumber: carNumber,
                    totalDistance: 0,
                    count: 0,
                    grouping: row['Группировка'],
                  });
                }

                const car = carMap.get(carNumber);
                car.totalDistance += distance;
                car.count += 1;
              }
            });

            // ПОКАЗЫВАЕМ ВСЕ АВТОМОБИЛИ
            const chartData = Array.from(carMap.values())
              .map((car) => ({
                carNumber: car.carNumber,
                avgDistance: Math.round(car.totalDistance / car.count),
                grouping: car.grouping,
              }))
              .sort((a, b) => b.avgDistance - a.avgDistance);

            console.log(`Загружено автомобилей: ${chartData.length}`); // Проверка в консоли
            setData(chartData);
            setLoading(false);
          },
        });
      } catch (error) {
        console.error('Ошибка:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        Загрузка данных...
      </div>
    );
  }

  // Динамическая высота в зависимости от количества автомобилей
 // Находим min и max для градиента
  const maxDistance = Math.max(...data.map(car => car.avgDistance));
  const minDistance = Math.min(...data.map(car => car.avgDistance));

  // Функция для создания градиентного цвета
  const getGradientColor = (distance) => {
    const ratio = (distance - minDistance) / (maxDistance - minDistance);
    // От зелёного (0) к красному (1)
    const red = Math.round(255 * ratio);
    const green = Math.round(255 * (1 - ratio));
    const blue = 100;
    return `rgb(${red}, ${green}, ${blue})`;
  };

  return (
    <div style={{ width: '100%', height: `${chartHeight}px`, padding: '20px' }}>
      <h2 style={{ textAlign: 'center' }}>
        🌈 Градиентная цветовая шкала (от малого к большему пробегу)
      </h2>
      
      {/* Градиентная шкала */}
      <div style={{ 
        width: '80%', 
        margin: '0 auto 20px auto',
        height: '30px',
        background: 'linear-gradient(to right, rgb(0, 255, 100), rgb(255, 0, 100))',
        borderRadius: '4px',
        position: 'relative'
      }}>
        <div style={{ 
          position: 'absolute', 
          left: 0, 
          bottom: '-25px', 
          fontSize: '12px' 
        }}>
          Меньший пробег ({minDistance.toLocaleString()} км)
        </div>
        <div style={{ 
          position: 'absolute', 
          right: 0, 
          bottom: '-25px', 
          fontSize: '12px' 
        }}>
          Больший пробег ({maxDistance.toLocaleString()} км)
        </div>
      </div>
      
      <ResponsiveContainer>
        <BarChart 
          data={data} 
          layout="vertical"
          margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" />
          <YAxis type="category" dataKey="carNumber" width={120} />
          <Tooltip />
          
          <Bar dataKey="avgDistance">
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getGradientColor(entry.avgDistance)}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GradientBarChart;