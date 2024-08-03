import React, { useState } from "react";

interface SettingsFormProps {
  onSaveSettings: (settings: { rpcUrl: string; secretKey: string }) => void;
}

const SettingsForm: React.FC<SettingsFormProps> = ({ onSaveSettings }) => {
  const [rpcUrl, setRpcUrl] = useState("");
  const [secretKey, setSecretKey] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSaveSettings({ rpcUrl, secretKey });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="rpcUrl"
          className="block text-sm font-medium text-gray-700"
        >
          RPC URL
        </label>
        <input
          type="text"
          id="rpcUrl"
          value={rpcUrl}
          onChange={(e) => setRpcUrl(e.target.value)}
          className="mt-1 block w-full border border-gray-300 p-2 shadow-sm sm:text-sm"
          placeholder="Enter RPC URL"
          required
        />
      </div>
      <div>
        <label
          htmlFor="secretKey"
          className="block text-sm font-medium text-gray-700"
        >
          Secret Key
        </label>
        <input
          type="text"
          id="secretKey"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          className="mt-1 block w-full border border-gray-300 p-2 shadow-sm sm:text-sm"
          placeholder="Update your secret key"
        />
      </div>
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Save Settings
      </button>
    </form>
  );
};

export default SettingsForm;
