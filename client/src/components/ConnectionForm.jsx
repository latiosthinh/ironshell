import React, { useState } from 'react';

const ConnectionForm = ({ onConnect }) => {
    const [formData, setFormData] = useState({
        host: 'ssh.xueer.space', // Pre-fill for convenience
        port: '22',
        username: 'manjaro',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate a small delay for effect
        setTimeout(() => {
            onConnect(formData);
            setIsLoading(false);
        }, 600);
    };

    return (
        <div className="connection-form-container">
            <div className="glass-panel">
                <h2>IronShell</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Host</label>
                        <input
                            type="text"
                            name="host"
                            value={formData.host}
                            onChange={handleChange}
                            required
                            placeholder="example.com"
                        />
                    </div>
                    <div className="form-group">
                        <label>Port</label>
                        <input
                            type="number"
                            name="port"
                            value={formData.port}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            placeholder="root"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="********"
                        />
                    </div>
                    <button type="submit" className="connect-btn" disabled={isLoading}>
                        {isLoading ? 'Connecting...' : 'Connect'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ConnectionForm;
