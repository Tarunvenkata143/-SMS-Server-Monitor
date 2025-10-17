import React, { useState } from 'react';

const SchemaExplorer = () => {
  const [activeTab, setActiveTab] = useState('metrics');

  const schemas = {
    metrics: {
      title: 'Metrics Collection',
      description: 'Stores the most recent performance data for each monitored server. The "server agent" on the remote host writes to this collection periodically.',
      fields: [
        { name: 'server_id', type: 'String', description: 'Unique identifier for the monitored server.' },
        { name: 'cpu', type: 'Number', description: 'Current CPU utilization percentage (0-100).' },
        { name: 'memory', type: 'Number', description: 'Current memory utilization percentage (0-100).' },
        { name: 'disk_free_gb', type: 'Number', description: 'Amount of free disk space in Gigabytes.' },
        { name: 'temperature_c', type: 'Number', description: 'Server temperature in Celsius.' },
        { name: 'timestamp', type: 'String (ISO)', description: 'Time the metrics were recorded.' },
      ]
    },
    alerts: {
      title: 'Alerts Collection',
      description: 'Stores a historical log of all generated alerts that triggered an SMS notification, allowing for trend analysis and audit.',
      fields: [
        { name: 'server_id', type: 'String', description: 'Server that generated the alert.' },
        { name: 'metric', type: 'String', description: 'The metric that exceeded the threshold.' },
        { name: 'value', type: 'Number', description: 'The actual metric value that triggered the alert.' },
        { name: 'threshold', type: 'String', description: 'The boundary condition that was violated.' },
        { name: 'message', type: 'String', description: 'A descriptive, user-friendly alert message.' },
        { name: 'sms_sent', type: 'Boolean', description: 'Confirmation that the SMS gateway was triggered.' },
        { name: 'timestamp', type: 'String (ISO)', description: 'Time the alert was logged.' },
      ]
    },
    commands: {
      title: 'Commands Collection',
      description: 'Acts as the communication queue for SMS commands. The Admin writes a command here (simulating sending an SMS), and the Server Agent reads it.',
      fields: [
        { name: 'server_id', type: 'String', description: 'Target server for the command.' },
        { name: 'command', type: 'String', description: 'The command keyword sent via SMS/dashboard.' },
        { name: 'sms_sender', type: 'String', description: "The admin's verified phone number." },
        { name: 'status', type: 'String', description: 'Current execution status (e.g., PENDING, COMPLETED).' },
        { name: 'timestamp', type: 'String (ISO)', description: 'Time the command was logged/received.' },
        { name: 'response_log', type: 'String (Optional)', description: 'Detailed output from the command execution.' },
      ]
    },
    logs: {
      title: 'Logs Collection',
      description: 'Stores the full log table with 5-minute interval data for all server activities, metrics, alerts, and commands.',
      fields: [
        { name: 'server_id', type: 'String', description: 'Server that generated the log entry.' },
        { name: 'log_type', type: 'String', description: 'Type of log entry (metrics, alert, command).' },
        { name: 'message', type: 'String', description: 'Descriptive log message.' },
        { name: 'timestamp', type: 'String (ISO)', description: 'Time the log entry was recorded.' },
        { name: 'data', type: 'Mixed', description: 'Additional data associated with the log entry.' },
      ]
    },
  };

  const schema = schemas[activeTab];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-xl shadow-md border border-stone-200">
        <h2 className="text-2xl font-semibold mb-4 text-stone-800">Schema Explorer</h2>
        <p className="text-stone-600 mb-6">This section provides a detailed breakdown of the NoSQL database collections used in the monitoring system. Click on each tab to explore the structure, fields, and purpose of the `metrics`, `alerts`, and `commands` collections. This is the foundational data architecture that powers the live simulation below.</p>
        <div className="border-b border-stone-200 mb-4">
          <nav className="flex -mb-px space-x-4" aria-label="Tabs">
            {Object.keys(schemas).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg transition ${
                  activeTab === tab ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
        <div className="overflow-x-auto">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-stone-700">{schema.title}</h4>
            <p className="text-sm text-stone-500">{schema.description}</p>
          </div>
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Field</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {schema.fields.map(field => (
                <tr key={field.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">{field.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 font-mono">{field.type}</td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-stone-500">{field.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SchemaExplorer;
