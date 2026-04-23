// src/components/StyledBarChart.jsx
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const StyledBarChart = () => {
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
            
            results.data.forEach(row => {
              const carNumber = row['Гос. номер']?.toUpperCase();
              const distance = parseFloat(row['Пробег в поездках']?.replace(/\s/g, '') || 0);
              const month = row['Месяц'];
              
              if (carNumber && distance > 0) {
                if (!carMap.has(carNumber)) {
                  carMap.set(carNumber, {
                    carNumber: carNumber,
                    totalDistance: 0,
                    count: 0,
                    months: new Set()
                  });
                }
                
                const car = carMap.get(carNumber);
                car.totalDistance += distance;
                car.count += 1;
                car.months.add(month);
              }
            });
            
            const chartData = Array.from(carMap.values())
              .map(car => ({
                carNumber: car.carNumber,
                avgDistance: Math.round(car.totalDistance / car.count),
                monthsCount: car.months.size,
                totalDistance: car.totalDistance
              }))
              .sort((a, b) => b.avgDistance - a.avgDistance)
              .slice(0, 10); // Показываем топ-10 автомобилей
            
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
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div>📊 Загрузка данных...</div>
      </div>
    );
  }

  // Кастомный тултип
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          border: '1px solid #ccc',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>{label}</p>
          <p style={{ margin: '5px 0 0 0', color: '#8884d8' }}>
            📏 Средний пробег: <strong>{payload[0].value.toLocaleString()} км</strong>
          </p>
          {payload[0].payload.monthsCount && (
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
              📅 Активен: {payload[0].payload.monthsCount} месяц(ев)
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '600px', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
        📊 Средний пробег автомобилей (топ-10)
      </h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
        Рассчитано на основе данных за все месяцы
      </p>
      
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis 
            type="number" 
            label={{ value: 'Пробег (км)', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            type="category" 
            dataKey="carNumber" 
            width={100}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="avgDistance" 
            fill="#8884d8" 
            name="Средний пробег (км)"
            radius={[0, 4, 4, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        fontSize: '12px',
        textAlign: 'center',
        color: '#666'
      }}>
        💡 Средний пробег = общий пробег / количество месяцев с данными
      </div>
    </div>
  );
};

export default StyledBarChart;