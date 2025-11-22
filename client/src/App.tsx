import React, { useState } from 'react';
import ConnectionForm from './components/ConnectionForm';
import Terminal from './components/Terminal';
import './index.css';

interface ConnectionConfig {
  host: string;
  port: string;
  username: string;
  password?: string;
}

function App() {
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig | null>(null);

  const handleConnect = (config: ConnectionConfig) => {
    setConnectionConfig(config);
  };

  const handleDisconnect = () => {
    setConnectionConfig(null);
  };

  return (
    <div className="app-container">
      {!connectionConfig ? (
        <ConnectionForm onConnect={handleConnect} />
      ) : (
        <Terminal config={connectionConfig} onDisconnect={handleDisconnect} />
      )}
    </div>
  );
}

export default App;
