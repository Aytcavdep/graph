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

const AllCarsBarChart = () => {
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
  const chartHeight = Math.max(400, data.length * 35);

  return (
    <div style={{ width: '100%', height: `${chartHeight}px`, padding: '20px' }}>
      <h2 style={{ textAlign: 'center' }}>
        Средний пробег всех автомобилей (км)
      </h2>
      <p style={{ textAlign: 'center', color: '#666' }}>
        Всего автомобилей: {data.length} | Средний пробег по парку:{' '}
        {Math.round(
          data.reduce((sum, car) => sum + car.avgDistance, 0) / data.length,
        )}{' '}
        км
      </p>

      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical" // Горизонтальные столбцы - лучше для многих записей
          margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            label={{
              value: 'Средний пробег (км)',
              position: 'insideBottom',
              offset: -5,
            }}
          />
          <YAxis
            type="category"
            dataKey="carNumber"
            width={110}
            tick={{ fontSize: 11 }}
            interval={0} // Показываем все подписи
          />
          <Tooltip
            formatter={(value) => [
              `${value.toLocaleString()} км`,
              'Средний пробег',
            ]}
            labelFormatter={(label) => `Автомобиль: ${label}`}
          />
          <Legend />
          <Bar
            dataKey="avgDistance"
            fill="#8884d8"
            name="Средний пробег"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <div style={{ marginTop: '20px', overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  border: '1px solid #ddd',
                  padding: '8px',
                  textAlign: 'left',
                }}
              >
                Гос. номер
              </th>
              <th
                style={{
                  border: '1px solid #ddd',
                  padding: '8px',
                  textAlign: 'right',
                }}
              >
                Средний пробег (км)
              </th>
              <th
                style={{
                  border: '1px solid #ddd',
                  padding: '8px',
                  textAlign: 'right',
                }}
              >
                Группировка
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((car, idx) => (
              <tr
                key={car.carNumber}
                style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white' }}
              >
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {car.carNumber}
                </td>
                <td
                  style={{
                    border: '1px solid #ddd',
                    padding: '8px',
                    textAlign: 'right',
                  }}
                >
                  {car.avgDistance.toLocaleString()}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {car.grouping}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllCarsBarChart;
