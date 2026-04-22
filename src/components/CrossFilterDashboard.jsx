// src/components/CrossFilterDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const CrossFilterDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null);

  // Загрузка CSV файла
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data.csv');
        if (!response.ok) {
          throw new Error('Не удалось загрузить файл data.csv');
        }
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          delimiter: ';',
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsedData = results.data.map(row => ({
              id: row['№'],
              month: row['Месяц'],
              grouping: row['Группировка'],
              carNumber: row['Гос. номер']?.toUpperCase(),
              distance: parseFloat(row['Пробег в поездках']?.replace(/\s/g, '') || 0),
              engineHours: parseFloat(row['Моточасы'] || 0),
              engineHoursMoving: parseFloat(row['Моточасы в движении'] || 0),
              engineHoursIdle: parseFloat(row['Моточасы без движения'] || 0),
              refueled: parseFloat(row['Заправлено'] || 0),
              fuelUsed: parseFloat(row['Потрачено по ДУТ всего'] || 0),
              fuelUsedMoving: parseFloat(row['Потрачено по ДУТ в движении'] || 0),
              avgFuelConsumption: parseFloat(row['Ср. расход по ДУТ всего'] || 0),
              fuelUsedIdle: parseFloat(row['Потрачено по ДУТ на холостом ходу'] || 0),
              avgFuelConsumptionIdle: parseFloat(row['Ср. расход по ДУТ на холостом ходу'] || 0),
              avgFuelConsumptionMoving: parseFloat(row['Ср. расход по ДУТ в движении'] || 0),
              avgSpeed: parseFloat(row['Ср. скорость'] || 0),
              maxSpeed: parseFloat(row['Макс. скорость'] || 0)
            }));
            
            setData(parsedData);
            setLoading(false);
          },
          error: (error) => {
            console.error('Ошибка парсинга CSV:', error);
            setError('Ошибка при чтении файла');
            setLoading(false);
          }
        });
      } catch (err) {
        console.error('Ошибка загрузки:', err);
        setError('Не удалось загрузить данные');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Уникальные месяцы
  const months = useMemo(() => {
    return [...new Set(data.map(item => item.month))].sort();
  }, [data]);

  // Фильтрация по месяцу
  const filteredByMonth = useMemo(() => {
    if (!selectedMonth) return data;
    return data.filter(item => item.month === selectedMonth);
  }, [data, selectedMonth]);

  // Агрегированные данные по автомобилям
  const carAggregated = useMemo(() => {
    const grouped = {};
    filteredByMonth.forEach(item => {
      if (!grouped[item.carNumber]) {
        grouped[item.carNumber] = {
          carNumber: item.carNumber,
          grouping: item.grouping,
          totalFuelUsed: 0,
          totalDistance: 0,
          totalEngineHours: 0,
          avgSpeedSum: 0,
          count: 0
        };
      }
      grouped[item.carNumber].totalFuelUsed += item.fuelUsed || 0;
      grouped[item.carNumber].totalDistance += item.distance || 0;
      grouped[item.carNumber].totalEngineHours += item.engineHours || 0;
      if (item.avgSpeed) {
        grouped[item.carNumber].avgSpeedSum += item.avgSpeed;
        grouped[item.carNumber].count += 1;
      }
    });
    
    return Object.values(grouped)
      .map(car => ({
        ...car,
        avgSpeed: car.count ? (car.avgSpeedSum / car.count).toFixed(1) : 0,
        fuelEfficiency: car.totalDistance > 0 ? (car.totalFuelUsed / car.totalDistance * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.totalFuelUsed - a.totalFuelUsed);
  }, [filteredByMonth]);

  // Данные по выбранному автомобилю
  const carDetails = useMemo(() => {
    if (!selectedCar) return [];
    return filteredByMonth
      .filter(item => item.carNumber === selectedCar)
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredByMonth, selectedCar]);

  // Статистика по топливу
  const fuelStats = useMemo(() => {
    const moving = filteredByMonth.reduce((sum, item) => sum + (item.fuelUsedMoving || 0), 0);
    const idle = filteredByMonth.reduce((sum, item) => sum + (item.fuelUsedIdle || 0), 0);
    return [
      { name: 'В движении', value: moving },
      { name: 'На холостом ходу', value: idle }
    ];
  }, [filteredByMonth]);

  // Обработчик клика по столбцу (ИСПРАВЛЕННЫЙ)
  const handleBarClick = (data) => {
    if (data && data.activePayload && data.activePayload[0] && data.activePayload[0].payload) {
      const clickedCar = data.activePayload[0].payload.carNumber;
      setSelectedCar(clickedCar);
    }
  };

  // Обработчик клика по PieChart (опционально)
  const handlePieClick = (data) => {
    console.log('Клик по сектору:', data);
    // Можно добавить логику фильтрации по типу расхода
  };

  // Сброс фильтра по автомобилю
  const clearCarFilter = () => {
    setSelectedCar(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Загрузка данных...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <h2 style={{ color: 'red' }}>Ошибка: {error}</h2>
        <p>Убедитесь, что файл data.csv находится в папке public/</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        📊 Дашборд аналитики автопарка
      </h1>

      {/* Фильтры */}
      <div style={{ 
        background: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <strong style={{ fontSize: '16px' }}>📅 Фильтр по месяцу: </strong>
          <button
            onClick={() => {
              setSelectedMonth(null);
              setSelectedCar(null); // Сбрасываем и фильтр авто при смене месяца
            }}
            style={{
              ...buttonStyle,
              backgroundColor: !selectedMonth ? '#007bff' : '#e0e0e0',
              color: !selectedMonth ? 'white' : 'black'
            }}
          >
            Все месяцы
          </button>
          {months.map(month => (
            <button
              key={month}
              onClick={() => {
                setSelectedMonth(month);
                setSelectedCar(null); // Сбрасываем фильтр авто при смене месяца
              }}
              style={{
                ...buttonStyle,
                backgroundColor: selectedMonth === month ? '#007bff' : '#e0e0e0',
                color: selectedMonth === month ? 'white' : 'black'
              }}
            >
              {month}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <strong style={{ fontSize: '16px' }}>🚛 Фильтр по автомобилю: </strong>
          <select
            onChange={(e) => setSelectedCar(e.target.value || null)}
            value={selectedCar || ''}
            style={{ padding: '8px', fontSize: '14px', borderRadius: '4px', flex: 1 }}
          >
            <option value="">Все автомобили</option>
            {carAggregated.map(car => (
              <option key={car.carNumber} value={car.carNumber}>
                {car.carNumber} ({car.grouping})
              </option>
            ))}
          </select>
          {selectedCar && (
            <button
              onClick={clearCarFilter}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ✕ Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Информация об активных фильтрах */}
      {(selectedMonth || selectedCar) && (
        <div style={{
          background: '#e3f2fd',
          padding: '10px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <span>🔍 Активные фильтры:</span>
          {selectedMonth && (
            <span style={{ background: '#2196f3', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>
              Месяц: {selectedMonth}
            </span>
          )}
          {selectedCar && (
            <span style={{ background: '#4caf50', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>
              Авто: {selectedCar}
            </span>
          )}
          <button
            onClick={() => {
              setSelectedMonth(null);
              setSelectedCar(null);
            }}
            style={{
              marginLeft: 'auto',
              padding: '2px 12px',
              backgroundColor: '#ff9800',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Сбросить все
          </button>
        </div>
      )}

      {/* Графики */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
        {/* Расход топлива */}
        <div style={{ width: '48%', height: '450px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>⛽ Расход топлива по автомобилям (л)</h3>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
            💡 Кликните на любой столбец, чтобы отфильтровать данные по автомобилю
          </p>
          <ResponsiveContainer>
            <BarChart 
              data={carAggregated}
              onClick={handleBarClick}
              cursor="pointer"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="carNumber" 
                angle={-45} 
                textAnchor="end" 
                height={100} 
                interval={0} 
                fontSize={11}
              />
              <YAxis />
              <Tooltip 
                cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
                        <p style={{ margin: '5px 0 0 0', color: '#8884d8' }}>
                          Расход: {payload[0].value.toFixed(1)} л
                        </p>
                        <p style={{ margin: '5px 0 0 0', color: '#82ca9d' }}>
                          Пробег: {carAggregated.find(c => c.carNumber === label)?.totalDistance || 0} км
                        </p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#999' }}>
                          👆 Кликните для фильтрации
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar 
                dataKey="totalFuelUsed" 
                fill="#8884d8" 
                name="Расход топлива, л"
                onClick={handleBarClick}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Пробег */}
        <div style={{ width: '48%', height: '450px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>📏 Пробег по автомобилям (км)</h3>
          <ResponsiveContainer>
            <BarChart data={carAggregated}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="carNumber" 
                angle={-45} 
                textAnchor="end" 
                height={100} 
                interval={0} 
                fontSize={11}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="totalDistance" 
                fill="#82ca9d" 
                name="Пробег, км"
                onClick={handleBarClick}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
        {/* Эффективность топлива */}
        <div style={{ width: '48%', height: '400px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>📊 Эффективность расхода топлива (л/100км)</h3>
          <ResponsiveContainer>
            <BarChart data={carAggregated}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="carNumber" 
                angle={-45} 
                textAnchor="end" 
                height={100} 
                interval={0} 
                fontSize={11}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="fuelEfficiency" 
                fill="#ffc658" 
                name="Расход, л/100км"
                onClick={handleBarClick}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Распределение топлива */}
        <div style={{ width: '48%', height: '400px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>🔄 Распределение расхода топлива</h3>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={fuelStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                onClick={handlePieClick}
                cursor="pointer"
              >
                {fuelStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Детали по выбранному автомобилю */}
      {selectedCar && carDetails.length > 0 && (
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginTop: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>🚛 Детальная аналитика: {selectedCar}</h2>
            <button
              onClick={clearCarFilter}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ✕ Закрыть
            </button>
          </div>
          
          <div style={{ height: '400px', marginTop: '20px' }}>
            <ResponsiveContainer>
              <LineChart data={carDetails}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" label={{ value: 'Расход (л)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Пробег (км)', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="fuelUsed" 
                  stroke="#ff7300" 
                  name="Расход топлива, л" 
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="distance" 
                  stroke="#387908" 
                  name="Пробег, км" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Дополнительные метрики */}
          <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: '#f0f0f0', padding: '15px', borderRadius: '8px' }}>
              <h4>⏱️ Моточасы</h4>
              <p>Всего: {carDetails.reduce((sum, item) => sum + item.engineHours, 0).toFixed(1)} ч</p>
              <p>В движении: {carDetails.reduce((sum, item) => sum + item.engineHoursMoving, 0).toFixed(1)} ч</p>
              <p>Холостой ход: {carDetails.reduce((sum, item) => sum + item.engineHoursIdle, 0).toFixed(1)} ч</p>
            </div>
            <div style={{ flex: 1, background: '#f0f0f0', padding: '15px', borderRadius: '8px' }}>
              <h4>📈 Скоростные показатели</h4>
              <p>Средняя скорость: {(carDetails.reduce((sum, item) => sum + item.avgSpeed, 0) / carDetails.length).toFixed(1)} км/ч</p>
              <p>Макс. скорость: {Math.max(...carDetails.map(item => item.maxSpeed))} км/ч</p>
            </div>
            <div style={{ flex: 1, background: '#f0f0f0', padding: '15px', borderRadius: '8px' }}>
              <h4>⛽ Топливная эффективность</h4>
              <p>Ср. расход: {(carDetails.reduce((sum, item) => sum + item.avgFuelConsumption, 0) / carDetails.length).toFixed(1)} л/100км</p>
              <p>Расход на холостом: {(carDetails.reduce((sum, item) => sum + item.avgFuelConsumptionIdle, 0) / carDetails.length).toFixed(1)} л/ч</p>
            </div>
          </div>
        </div>
      )}

      {/* Подсказка, если выбран месяц но нет данных */}
      {selectedMonth && carAggregated.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: '#fff3cd',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <h3>⚠️ Нет данных за выбранный период</h3>
          <p>Попробуйте выбрать другой месяц или сбросить фильтр</p>
        </div>
      )}
    </div>
  );
};

const buttonStyle = {
  margin: '0 5px',
  padding: '8px 16px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'all 0.3s'
};

export default CrossFilterDashboard;