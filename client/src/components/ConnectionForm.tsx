import React, { useState } from 'react';

interface ConnectionConfig {
    host: string;
    port: string;
    username: string;
    password?: string;
    name?: string;
}

interface ConnectionFormProps {
    onConnect: (config: ConnectionConfig) => void;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ onConnect }) => {
    const [formData, setFormData] = useState<ConnectionConfig>({
        host: 'ssh.xueer.space', // Pre-fill for convenience
        port: '22',
        username: 'manjaro',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate a small delay for effect
        setTimeout(() => {
            onConnect(formData);
            setIsLoading(false);
        }, 600);
    };

    return (
        <div className="w-full h-full flex justify-center items-center perspective-[1000px]">
            <div className="bg-glass-bg backdrop-blur-[20px] border border-glass-border rounded-[24px] p-10 w-[380px] shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_var(--color-glass-border)] animate-float-in relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-accent-color before:to-[#a855f7] before:opacity-80">
                <h2 className="mt-0 text-center mb-8 font-bold text-2xl tracking-[-0.5px] bg-gradient-to-r from-white to-[#aaa] bg-clip-text text-transparent">IronShell</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-5 relative group">
                        <label className="block mb-2 text-[0.85rem] font-medium text-[#889] transition-colors duration-200 group-focus-within:text-accent-color">Host</label>
                        <input
                            className="w-full px-4 py-[0.85rem] rounded-xl border border-glass-border bg-input-bg text-white font-sans text-[0.95rem] box-border transition-all duration-200 ease-in-out focus:outline-none focus:border-accent-color focus:bg-black/40 focus:shadow-[0_0_0_4px_rgba(100,108,255,0.1)] placeholder:text-white/20"
                            type="text"
                            name="host"
                            value={formData.host}
                            onChange={handleChange}
                            required
                            placeholder="example.com"
                        />
                    </div>
                    <div className="mb-5 relative group">
                        <label className="block mb-2 text-[0.85rem] font-medium text-[#889] transition-colors duration-200 group-focus-within:text-accent-color">Port</label>
                        <input
                            className="w-full px-4 py-[0.85rem] rounded-xl border border-glass-border bg-input-bg text-white font-sans text-[0.95rem] box-border transition-all duration-200 ease-in-out focus:outline-none focus:border-accent-color focus:bg-black/40 focus:shadow-[0_0_0_4px_rgba(100,108,255,0.1)] placeholder:text-white/20"
                            type="number"
                            name="port"
                            value={formData.port}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-5 relative group">
                        <label className="block mb-2 text-[0.85rem] font-medium text-[#889] transition-colors duration-200 group-focus-within:text-accent-color">Username</label>
                        <input
                            className="w-full px-4 py-[0.85rem] rounded-xl border border-glass-border bg-input-bg text-white font-sans text-[0.95rem] box-border transition-all duration-200 ease-in-out focus:outline-none focus:border-accent-color focus:bg-black/40 focus:shadow-[0_0_0_4px_rgba(100,108,255,0.1)] placeholder:text-white/20"
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            placeholder="root"
                        />
                    </div>
                    <div className="mb-5 relative group">
                        <label className="block mb-2 text-[0.85rem] font-medium text-[#889] transition-colors duration-200 group-focus-within:text-accent-color">Password</label>
                        <input
                            className="w-full px-4 py-[0.85rem] rounded-xl border border-glass-border bg-input-bg text-white font-sans text-[0.95rem] box-border transition-all duration-200 ease-in-out focus:outline-none focus:border-accent-color focus:bg-black/40 focus:shadow-[0_0_0_4px_rgba(100,108,255,0.1)] placeholder:text-white/20"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="********"
                        />
                    </div>
                    <div className="mb-5 relative group">
                        <label className="block mb-2 text-[0.85rem] font-medium text-[#889] transition-colors duration-200 group-focus-within:text-accent-color">Session Name (Optional)</label>
                        <input
                            className="w-full px-4 py-[0.85rem] rounded-xl border border-glass-border bg-input-bg text-white font-sans text-[0.95rem] box-border transition-all duration-200 ease-in-out focus:outline-none focus:border-accent-color focus:bg-black/40 focus:shadow-[0_0_0_4px_rgba(100,108,255,0.1)] placeholder:text-white/20"
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleChange}
                            placeholder="My Server"
                        />
                    </div>
                    <button type="submit" className="w-full p-[0.9rem] mt-6 bg-gradient-to-br from-accent-color to-[#5058e5] text-white border-none rounded-xl text-base font-semibold cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(100,108,255,0.3)] hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(100,108,255,0.4)] active:translate-y-px active:shadow-[0_2px_8px_rgba(100,108,255,0.3)] disabled:opacity-70 disabled:cursor-wait" disabled={isLoading}>
                        {isLoading ? 'Connecting...' : 'Connect'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ConnectionForm;
