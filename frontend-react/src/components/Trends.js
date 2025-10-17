import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Line } from 'react-chartjs-2'; 
import { Cpu, HardDrive, Zap, Gauge, TrendingUp } from 'lucide-react';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend); 
const getColorForUsage = (value, highThreshold = 80, midThreshold = 60) => {
    if (value >= highThreshold) return '#dc2626'; 
    if (value >= midThreshold) return '#f59e0b'; 
    return '#10b981'; 
};

const Trends = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Data Loading 
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        loadData();
        const interval = setInterval(loadData, 5000); 
        
        return () => clearInterval(interval);
    }, [navigate]);

    const loadData = async () => {
        try {
            // Fetch logs. Sorting is assumed to happen in the backend or we can do it here for consistency
            const logsRes = await axios.get('/api/dashboard/logs');
            setLogs(logsRes.data);
        } catch (err) {
            console.error('Error fetching logs:', err);
        } finally {
            setLoading(false);
        }
    };

    // 2. Data Preparation (using useMemo for performance)
    const chartData = useMemo(() => {
        const labels = logs.map(log => new Date(log.timestamp).toLocaleTimeString());
        
        // Combined Line Chart Data
        const combinedChartData = {
            labels,
            datasets: [
                { label: 'CPU Usage (%)', data: logs.map(log => log.cpuUsage), borderColor: '#059669', tension: 0.3, borderWidth: 2, pointRadius: 1 },
                { label: 'Disk Usage (%)', data: logs.map(log => log.diskSpace), borderColor: '#f97316', tension: 0.3, borderWidth: 2, pointRadius: 1 },
                { label: 'Memory Usage (%)', data: logs.map(log => log.memoryUsage), borderColor: '#3b82f6', tension: 0.3, borderWidth: 2, pointRadius: 1 },
                { label: 'Temperature (°C)', data: logs.map(log => log.temperature), borderColor: '#ef4444', tension: 0.3, borderWidth: 2, pointRadius: 1 },
            ],
        };

        // Separate Line Chart Data (for sub-charts)
        const cpuChartData = { labels, datasets: [{ label: 'CPU Usage (%)', data: logs.map(log => log.cpuUsage), borderColor: '#059669', tension: 0.4, borderWidth: 2, pointRadius: 0 }] };
        const memoryChartData = { labels, datasets: [{ label: 'Memory Usage (%)', data: logs.map(log => log.memoryUsage), borderColor: '#3b82f6', tension: 0.4, borderWidth: 2, pointRadius: 0 }] };
        const diskChartData = { labels, datasets: [{ label: 'Disk Usage (%)', data: logs.map(log => log.diskSpace), borderColor: '#f97316', tension: 0.4, borderWidth: 2, pointRadius: 0 }] };
        const temperatureChartData = { labels, datasets: [{ label: 'Temperature (°C)', data: logs.map(log => log.temperature), borderColor: '#ef4444', tension: 0.4, borderWidth: 2, pointRadius: 0 }] };
        
        return {
            combinedChartData,
            cpuChartData, memoryChartData, diskChartData, temperatureChartData,
        };
    }, [logs]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-xl text-gray-700">Loading real-time system data...</p>
                </div>
            </div>
        );
    }

    // Common Options for Sub-Line Charts (to keep them clean)
    const lineChartOptions = {
        maintainAspectRatio: false, responsive: true,
        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
        scales: { x: { display: false }, y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } } },
        elements: { point: { radius: 0 } },
        animation: false,
    };
    
    // Custom threshold for Temperature in the log table
    const getTempColor = (value) => getColorForUsage(value, 70, 50);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            {/* Header - SIMPLIFIED: Only Title Remains */}
            <header className="flex justify-start items-center bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 flex items-center space-x-3">
                    <TrendingUp className="h-8 w-8 text-indigo-600" />
                    <span>Real-Time System Trends</span>
                </h1>
                {/* Removed all buttons (Dashboard, Profile, Logout) */}
            </header>

            {/* Current Usage Gauges (Doughnut Charts) - SECTION REMOVED */}
            
            {/* Combined System Trends Chart */}
            <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
                <h2 className="text-3xl font-semibold mb-4 text-gray-800">Historical Trends</h2>
                <div className="h-80 w-full relative">
                    <Line data={chartData.combinedChartData} options={{
                        ...lineChartOptions,
                        scales: {
                            x: {
                                display: true, // Show X-axis for main chart
                                title: { display: true, text: 'Time', color: '#666' },
                                ticks: { color: '#666', maxTicksLimit: 10 },
                                grid: { color: 'rgba(0,0,0,0.1)' }
                            },
                            y: {
                                beginAtZero: true,
                                title: { display: true, text: 'Usage (%) / Temperature (°C)', color: '#666' },
                                grid: { color: 'rgba(0,0,0,0.1)' },
                                ticks: { color: '#666' }
                            }
                        },
                        plugins: {
                            legend: { position: 'top', labels: { usePointStyle: true, padding: 20, font: { size: 14 } } },
                            tooltip: { mode: 'index', intersect: false, backgroundColor: 'rgba(30,41,59,0.9)', cornerRadius: 6 }
                        },
                        elements: { point: { radius: 3, hoverRadius: 5 }, line: { borderWidth: 3 } },
                    }} height={320} />
                </div>
            </section>

            {/* Individual Mini-Trends Charts */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700 flex items-center"><Cpu className="h-4 w-4 mr-2 text-green-600"/> CPU Mini-Trend</h3>
                    <div className="h-24"><Line data={chartData.cpuChartData} options={lineChartOptions} /></div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700 flex items-center"><Zap className="h-4 w-4 mr-2 text-blue-600"/> Memory Mini-Trend</h3>
                    <div className="h-24"><Line data={chartData.memoryChartData} options={lineChartOptions} /></div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700 flex items-center"><HardDrive className="h-4 w-4 mr-2 text-orange-600"/> Disk Mini-Trend</h3>
                    <div className="h-24"><Line data={chartData.diskChartData} options={lineChartOptions} /></div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700 flex items-center"><Gauge className="h-4 w-4 mr-2 text-red-600"/> Temp Mini-Trend</h3>
                    <div className="h-24"><Line data={chartData.temperatureChartData} options={lineChartOptions} /></div>
                </div>
            </section>

            {/* Recent Logs Table */}
            <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Recent Logs ({logs.length} Total, Showing Last 5)</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memory</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disk</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temp</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {logs.slice(-5).reverse().map((log, index) => ( // Show last 5 logs, newest first
                                <tr key={log._id || index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" style={{ color: getColorForUsage(log.cpuUsage) }}>{log.cpuUsage.toFixed(1)}%</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" style={{ color: getColorForUsage(log.memoryUsage) }}>{log.memoryUsage.toFixed(1)}%</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" style={{ color: getColorForUsage(log.diskSpace) }}>{log.diskSpace.toFixed(1)}%</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" style={{ color: getTempColor(log.temperature) }}>{log.temperature.toFixed(1)}°C</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {logs.length === 0 && <p className="text-center py-4 text-gray-500">No system logs available yet.</p>}
                </div>
            </section>
        </div>
    );
};

export default Trends;