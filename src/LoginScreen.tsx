import React, { useState } from "react";

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState("");

  const handleGoogleLogin = () => {
    // Logic for Google login
  };

  const handleWalletLogin = () => {
    // Logic for Wallet login
  };

  const handleMagicLink = () => {
    // Logic to send magic link
    console.log("Sending magic link to:", email);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Welcome 👋</h1>
          <p className="mt-2 text-gray-600">
            Select your favorite login option
          </p>
          <p className="mt-1 font-semibold">
            Get your <span className="text-black">100GB</span> free storage now!
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            className="flex items-center justify-center w-full bg-white border border-gray-300 text-gray-700 rounded-md py-2 hover:bg-gray-100"
            onClick={handleGoogleLogin}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png"
              alt="Google"
              className="h-6 mr-2"
            />
          </button>

          <button
            className="flex items-center justify-center w-full bg-purple-600 text-white rounded-md py-2 hover:bg-purple-700"
            onClick={handleWalletLogin}
          >
            <span className="mr-2">💼</span> Wallet
          </button>

          <div className="relative text-center text-gray-500">
            <span>Or</span>
          </div>

          <input
            type="email"
            className="border border-gray-300 rounded-md p-3 w-full focus:outline-none focus:ring-2 focus:ring-purple-600"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            className="bg-green-500 text-white py-2 rounded-md hover:bg-green-600 w-full"
            onClick={handleMagicLink}
          >
            Send a magic link ✨
          </button>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>More information here</p>
          <p className="mt-2">© 2024 hello.app</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
