import React, { useState } from "react";

interface LoginFormProps {
  onLoginSuccess: (secretKey: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [secretKey, setSecretKey] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Here, you would typically validate the secret key or generate a new one
    // For simplicity, we'll call onLoginSuccess directly
    onLoginSuccess(secretKey);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="Enter your secret key"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Login / Import Account
      </button>
    </form>
  );
};

export { LoginForm };
