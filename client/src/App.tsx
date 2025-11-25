import React, { useState } from 'react';
import ConnectionForm from './components/ConnectionForm';
import Terminal from './components/Terminal';
import TabBar from './components/TabBar';
import { useStore, ConnectionConfig, Session } from './store';

function App() {
  const { sessions, activeSessionId, addSession, removeSession, setActiveSessionId } = useStore();
  const [showConnectionForm, setShowConnectionForm] = useState(true);

  const handleConnect = (config: ConnectionConfig) => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      config,
      title: config.name || `${config.username}@${config.host}`,
      status: 'connecting',
    };
    addSession(newSession);
    setShowConnectionForm(false);
  };

  const handleDisconnect = (sessionId: string) => {
    removeSession(sessionId);
  };

  // Effect to handle showing connection form when no sessions
  React.useEffect(() => {
    if (sessions.length === 0) {
      setShowConnectionForm(true);
    }
  }, [sessions]);

  const handleNewTab = () => {
    setShowConnectionForm(true);
    setActiveSessionId(null);
  };

  const handleSwitchSession = (id: string) => {
    setActiveSessionId(id);
    setShowConnectionForm(false);
  };

  const handleDuplicateSession = (sessionId: string) => {
    const sessionToDuplicate = sessions.find(s => s.id === sessionId);
    if (sessionToDuplicate) {
      handleConnect(sessionToDuplicate.config);
    }
  };

  return (
    <div className="w-full h-screen max-h-[100svh] flex flex-col bg-[#0f0f1a]">
      {(sessions.length > 0) && (
        <TabBar
          onSwitchSession={handleSwitchSession}
          onCloseSession={handleDisconnect}
          onNewTab={handleNewTab}
        />
      )}

      <div className="flex-1 relative overflow-hidden">
        {showConnectionForm ? (
          <div className="absolute inset-0 flex flex-col justify-center items-center z-10 bg-[#0f0f1a]">
            <ConnectionForm onConnect={handleConnect} />
            {sessions.length > 0 && (
              <button
                onClick={() => {
                  if (sessions.length > 0) {
                    const lastSession = sessions[sessions.length - 1];
                    handleSwitchSession(lastSession.id);
                  }
                }}
                className="mt-4 text-[#6272a4] hover:text-[#f8f8f2] underline"
              >
                Cancel
              </button>
            )}
          </div>
        ) : (
          sessions.map(session => (
            <div
              key={session.id}
              className={`absolute inset-0 ${activeSessionId === session.id ? 'z-0' : '-z-10 invisible'}`}
            >
              <Terminal
                config={session.config}
                onDisconnect={() => handleDisconnect(session.id)}
                isActive={activeSessionId === session.id}
                onDuplicate={() => handleDuplicateSession(session.id)}
                sessionId={session.id}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
