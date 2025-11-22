import React, { useState } from 'react';
import ConnectionForm from './components/ConnectionForm';
import Terminal from './components/Terminal';
import './index.css';

function App() {
  const [connectionConfig, setConnectionConfig] = useState(null);

  const handleConnect = (config) => {
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
