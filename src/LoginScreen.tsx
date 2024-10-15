import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addToast, removeToast } from "./slices/errorSlice";
import useAuth from "./hooks/useAuth";
import { useModal } from "./components/modal";
import OTPModal from "./components/modals/OTP";
import useIndexedDB from "./idb/useIndexedDb";
import { useAppSelector } from "./state";
import Spinner3 from "./components/spinner/Spinner3";
import { IndexedDBProvider } from "./idb/IndexedDBContext";
import MetaMaskWalletComponent from "./components/MetamaskLoginComponent";
import GoogleLoginButton from "./components/auth/GoogleLoginButton";



const LoginScreen: React.FC = () => {

  const { db, dbReady } = useIndexedDB();
  const dispatch = useDispatch();

  const { authenticated, loading } = useAppSelector((state) => state.user);

  const { startOTP } = useAuth(db, dbReady);


  const [email, setEmail] = useState("");

  const [onPresent] = useModal(<OTPModal db={db} dbReady={dbReady} email={email} />);

  const handleGoogleLogin = () => {
    // Logic for Google login
  };


  function validateEmail(email: string) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  const handleMagicLink = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!dbReady) {
      console.error("Database not ready yet.");
      return;
    }

    console.log(email);
    if (!validateEmail(email)) {
      dispatch(
        addToast({
          id: Date.now(),
          message: "Please enter a valid email",
          type: "error",
        })
      );
      return;
    }

    const toastId = Date.now();
    dispatch(
      addToast({
        id: toastId,
        message: "Sending magic link...",
        type: "info",
      })
    );

    const result = await startOTP(email.trim());
    if (result) onPresent();

    dispatch(removeToast(toastId));
  };

  if (loading) return <Spinner3 />;


  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Welcome 👋</h1>
          <p className="mt-2 text-gray-600">
            Select your favorite login option
          </p>
        </div>

        <div className="flex flex-col gap-4">
         
          
            <GoogleLoginButton />
          

          {/*
          <button
            className="flex items-center justify-center w-full bg-purple-600 text-white rounded-md py-2 hover:bg-purple-700"
            onClick={handleWalletLogin}
          >
            <span className="mr-2">💼</span> Metamask
            <canvas id="qrCode"></canvas>
            <h1 id="otp"></h1>
          </button>
          */}

          <MetaMaskWalletComponent />
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
          <button onClick={() => {
            // Logic to redirect to docs.hello.app
            window.electron.openExternal("https://docs.hello.app");
          }}
            className="text-blue-500 hover:underline"
          >
            More information here
          </button>

          <p className="mt-2">© 2024 hello.app</p>
        </div>
      </div>
    </div>
  );
};

export default function AppWrapper() {
  return (
    <IndexedDBProvider>
      <LoginScreen />
    </IndexedDBProvider>
  );
}

