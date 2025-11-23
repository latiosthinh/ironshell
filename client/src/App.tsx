import React, { useState } from 'react';
import ConnectionForm from './components/ConnectionForm';
import Terminal from './components/Terminal';

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
    <div className="w-full h-full max-h-[100svh] flex justify-center items-center lg:p-5">
      {!connectionConfig ? (
        <ConnectionForm onConnect={handleConnect} />
      ) : (
        <Terminal config={connectionConfig} onDisconnect={handleDisconnect} />
      )}
    </div>
  );
}

export default App;
