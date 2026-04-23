// src/components/SimpleBarChart.jsx
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SimpleBarChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Загрузка данных
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
            // Группируем данные по автомобилям и считаем средний пробег
            const carMap = new Map();
            
            results.data.forEach(row => {
              const carNumber = row['Гос. номер']?.toUpperCase();
              const distance = parseFloat(row['Пробег в поездках']?.replace(/\s/g, '') || 0);
              
              if (carNumber && distance > 0) {
                if (!carMap.has(carNumber)) {
                  carMap.set(carNumber, {
                    carNumber: carNumber,
                    totalDistance: 0,
                    count: 0
                  });
                }
                
                const car = carMap.get(carNumber);
                car.totalDistance += distance;
                car.count += 1;
              }
            });
            
            // Рассчитываем средний пробег
            const chartData = Array.from(carMap.values()).map(car => ({
              carNumber: car.carNumber,
              avgDistance: Math.round(car.totalDistance / car.count) // Средний пробег
            })).sort((a, b) => b.avgDistance - a.avgDistance); // Сортируем по убыванию
            
            setData(chartData);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Ошибка:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Загрузка данных...</div>;
  }

  return (
    <div style={{ width: '100%', height: '500px', padding: '20px' }}>
      <h2 style={{ textAlign: 'center' }}>Средний пробег автомобилей (км)</h2>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="carNumber" 
            angle={-45} 
            textAnchor="end" 
            height={80} 
            interval={0}
            fontSize={12}
          />
          <YAxis label={{ value: 'Пробег (км)', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value) => [`${value} км`, 'Средний пробег']} />
          <Legend />
          <Bar dataKey="avgDistance" fill="#8884d8" name="Средний пробег" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SimpleBarChart;