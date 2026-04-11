import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer 
} from 'recharts';
import { getDashboardStats } from '../../services/categoryService';
import { exportToCSV } from '../../utils/csvUtils';
import { LuDownload } from 'react-icons/lu';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [statusData, setStatusData] = useState([]);

  const handleExportData = () => {
    if (chartData.length === 0) return alert('No analytics data to export');
    exportToCSV(
      chartData.map(d => ({
        date: d.date,
        revenue: d.revenue || 0,
        orders: d.orders || 0
      })),
      `kudeja-sales-report-${timeRange}-${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'date', label: 'Date' },
        { key: 'revenue', label: 'Revenue (ETB)' },
        { key: 'orders', label: 'Order Volume' }
      ]
    );
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await getDashboardStats();
      if (res.data?.success) {
        const d = res.data.data;
        if (d.revenueByDay) setChartData(d.revenueByDay);
        if (d.topCategories) setCategoryData(d.topCategories);
        if (d.ordersByStatus) setStatusData(d.ordersByStatus);
      }
    } catch (err) {
      console.error('Failed to fetch analytics stats:', err);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px' 
      }}>
        <button
          onClick={handleExportData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <LuDownload size={18} />
          Export Report
        </button>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['day', 'week', 'month', 'year'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '8px 16px',
                backgroundColor: timeRange === range ? '#4CAF50' : '#f5f5f5',
                color: timeRange === range ? 'white' : '#333',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3>User Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {/* <Line type="monotone" dataKey="users" stroke="#8884d8" /> */}
              <Line type="monotone" dataKey="orders" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3>Revenue Overview (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3>Categories Distribution</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>No category data available.</p>
          )}
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3>Orders by Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#00C49F"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>No status data available.</p>
          )}
        </div>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        padding: '25px', 
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h3>Performance Metrics</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginTop: '20px'
        }}>
          {[
            { label: 'Avg. Session Duration', value: '4m 32s', change: '+12%' },
            { label: 'Bounce Rate', value: '34%', change: '-8%' },
            { label: 'Conversion Rate', value: '2.8%', change: '+15%' },
            { label: 'Pages per Visit', value: '5.2', change: '+6%' },
            { label: 'New vs Returning', value: '68% / 32%', change: '+5%' },
            { label: 'Peak Hours', value: '2-4 PM', change: 'Stable' }
          ].map((metric, index) => (
            <div key={index} style={{
              padding: '20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                {metric.label}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
                {metric.value}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: metric.change.startsWith('+') ? '#4CAF50' : 
                      metric.change.startsWith('-') ? '#f44336' : '#FF9800',
                marginTop: '8px'
              }}>
                {metric.change}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;