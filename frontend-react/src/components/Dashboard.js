

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

// --- Helper Functions ---
const getStatusColor = (value, high = 80, critical = 95) => {
  if (value >= critical) return 'text-red-600 font-bold';
  if (value >= high) return 'text-yellow-600 font-medium';
  return 'text-green-600';
};

const getMetricColor = (metricName) => {
  switch (metricName.toUpperCase()) {
    case 'CPU': return 'bg-indigo-500'; 
    case 'MEMORY': return 'bg-green-500';
    case 'DISK': return 'bg-orange-500'; 
    case 'TEMP': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const Dashboard = () => {
  const [status, setStatus] = useState({});
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    loadData();
    const interval = setInterval(loadData, 1000); // 5 seconds
    return () => clearInterval(interval);
  }, [navigate]);

  const loadData = async () => {
    try {
      const [statusRes, logsRes] = await Promise.all([
        axios.get('/api/dashboard/status'),
        axios.get('/api/dashboard/logs')
      ]);
      setStatus(statusRes.data);
      const sortedLogs = logsRes.data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setLogs(sortedLogs);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Chart Data ---
  const labels = logs.map(log => new Date(log.timestamp).toLocaleTimeString());
  
  const createChartData = (dataKey, color, label) => ({
      labels,
      datasets: [{
          label: label,
          data: logs.map(log => log[dataKey]),
          borderColor: color,
          tension: 0.1,
      }],
  });

  const cpuChartData = createChartData('cpuUsage', 'rgb(75, 192, 192)', 'CPU Usage (%)');
  const memoryChartData = createChartData('memoryUsage', 'rgb(54, 162, 235)', 'Memory Usage (%)');
  const diskChartData = createChartData('diskSpace', 'rgb(255, 99, 132)', 'Disk Usage (%)');
  const temperatureChartData = createChartData('temperature', 'rgb(255, 206, 86)', 'Temperature (°C)');

  const miniChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: { legend: { display: false }, tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)', titleColor: 'white', bodyColor: 'white', cornerRadius: 6
    }},
    scales: { x: { display: false }, y: { display: false } },
    elements: { point: { radius: 1, hoverRadius: 3 }, line: { borderWidth: 1 } }
  };

  const renderMetricWithGraph = (name, value, unit) => {
    const colorClass = getMetricColor(name);
    let maxReference = 100; // Default max for percentage
    if (name === 'Temp') maxReference = 100;
    const percent = (value / maxReference) * 100;

    return (
      <div className="flex items-center justify-between py-1 border-b border-gray-100 last:border-b-0">
        <span className="text-sm font-medium text-gray-700 w-1/4">{name}:</span>
        <div className="flex-grow mx-2 bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-full rounded-full ${colorClass}`} 
            style={{ width: `${Math.min(percent, 100)}%` }}
            title={`${value}${unit}`}
          ></div>
        </div>
        <span className="font-semibold text-sm w-1/4 text-right">{value}{unit}</span>
      </div>
    );
  };

  if (logs.length === 0) {
      return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-xl text-gray-700">Loading real-time system data...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-3xl font-extrabold text-indigo-700">Server Monitoring Dashboard 🚀</h1>
      </div>

      {/* Mini-Chart Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[ 
          { title: 'CPU Usage', value: status?.cpuUsage || 0, unit: '%', data: cpuChartData, color: 'border-blue-500' },
          { title: 'Memory Usage', value: status?.memoryUsage || 0, unit: '%', data: memoryChartData, color: 'border-green-500' },
          { title: 'Disk Space', value: status?.diskSpace || 0, unit: '%', data: diskChartData, color: 'border-yellow-500' },
          { title: 'Temperature', value: status?.temperature || 0, unit: '°C', data: temperatureChartData, color: 'border-red-500' },
        ].map((item, index) => (
          <div key={index} className={`bg-white p-5 rounded-xl shadow-lg border-l-4 ${item.color} transform hover:scale-[1.02] transition duration-300`}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase">{item.title}</h3>
            <p className="text-4xl font-extrabold mt-1 text-gray-900">{item.value.toFixed(1)}{item.unit}</p>
            <div className="h-12 mt-3">
              <Line data={item.data} options={miniChartOptions} height={48} />
            </div>
          </div>
        ))}
      </div>

      {/* Doughnut Charts */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">Current System Usage Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[ 
            { name: 'CPU', value: status?.cpuUsage || 0, color: '#4BC0C0' },
            { name: 'Memory', value: status?.memoryUsage || 0, color: '#36A2EB' },
            { name: 'Disk', value: status?.diskSpace || 0, color: '#FF6384' },
            { name: 'Temp', value: status?.temperature || 0, color: '#FFCE56' },
          ].map((item, index) => (
            <div key={index} className="text-center">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">{item.name}</h3>
              <div className="relative inline-block w-32 h-32">
                <Doughnut data={{
                  labels: ['Used', 'Free'],
                  datasets: [{ data: [item.value, 100 - item.value], backgroundColor: [item.color, '#F3F4F6'], borderWidth: 0 }]
                }} options={{ ...miniChartOptions, cutout: '75%', animation: { duration: 1500 } }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-extrabold text-gray-900">{item.value.toFixed(1)}{item.name !== 'Temp' ? '%' : '°C'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Recent Log Data Stream (Last 5)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {logs.slice(-5).reverse().map((log, index) => (
            <div key={log._id || index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition">
              <div className="text-sm font-bold text-indigo-600 mb-3 border-b pb-2">
                <span className="text-gray-600 font-normal">T:</span> {new Date(log.timestamp).toLocaleTimeString()}
              </div>
              <div className="space-y-1">
                {renderMetricWithGraph('CPU', log.cpuUsage.toFixed(1), '%')}
                {renderMetricWithGraph('Memory', log.memoryUsage.toFixed(1), '%')}
                {renderMetricWithGraph('Disk', log.diskSpace.toFixed(1), '%')}
                {renderMetricWithGraph('Temp', log.temperature.toFixed(1), '°C')}
              </div>
            </div>
          ))}
        </div>

        {/* Full Log Table with Color-Coded Values */}
        <div className="overflow-x-auto mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Full Log Table</h3>
          <table className="w-full table-auto text-sm border-collapse">
            <thead className="bg-gray-100 sticky top-0">
              <tr className="border-b border-gray-300">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Time</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">CPU Usage</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Memory Usage</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Disk Space</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Temperature</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(-10).reverse().map((log, index) => (
                <tr key={log._id || index} className="border-b border-gray-200 hover:bg-gray-50 transition duration-150">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">{new Date(log.timestamp).toLocaleString()}</td>
                  
                  <td className={`px-4 py-3 text-center ${getStatusColor(log.cpuUsage)}`}>{log.cpuUsage.toFixed(1)}%</td>
                  <td className={`px-4 py-3 text-center ${getStatusColor(log.memoryUsage)}`}>{log.memoryUsage.toFixed(1)}%</td>
                  <td className={`px-4 py-3 text-center ${getStatusColor(log.diskSpace)}`}>{log.diskSpace.toFixed(1)}%</td>
                  <td className={`px-4 py-3 text-center ${getStatusColor(log.temperature)}`}>{log.temperature.toFixed(1)}°C</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
