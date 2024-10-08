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
import MetaMaskSDK, { SDKProvider } from "@metamask/sdk";
import QRCode from 'qrcode';



// MetaMask SDK
const sdk = new MetaMaskSDK({
  shouldShimWeb3: false,
  storage: {
    enabled: true,
  },
  dappMetadata: {
    name: 'Electron Test Dapp',
    url: 'https://www.electronjs.org/',
  },
  modals: {
    install: ({ link }) => {
      const qrCodeDOM = document.getElementById('qrCode');
      QRCode.toCanvas(qrCodeDOM, link, (error: any) => {
        if (error) console.error(error)
      })
      return {};
    },
    otp: () => {
      const otpDOM = document.getElementById('otp');
      return {
        updateOTPValue: (otpValue) => {
          if (otpValue !== '') {
            otpDOM!.innerText = otpValue;
          }
        },
      };
    },
  },
});

const LoginScreen: React.FC = () => {

  const { db, dbReady } = useIndexedDB();
  const dispatch = useDispatch();

  const { authenticated, loading } = useAppSelector((state) => state.user);
  console.log(authenticated)
  console.log(loading)

  const { startOTP } = useAuth(db, dbReady);


  const [email, setEmail] = useState("");

  const [onPresent] = useModal(<OTPModal db={db} dbReady={dbReady} email={email} />);

  const handleGoogleLogin = () => {
    // Logic for Google login
  };


  // Helper functions
  function updateDOM(domElement: HTMLElement, value: string) {
    domElement.innerText = value;
  }


  const handleWalletLogin = async () => {

    // App State
    let account = ''
    let chainId = ''
    let response = ''
    let provider: SDKProvider | undefined;


    // Logic for Wallet login
    await sdk.connect().then((accounts) => {
      provider = sdk.getProvider();
      account = accounts?.[0];
      //setEventListeners();
      //updateDOM(accountsDOM, account);
      //connectButtonDOM.textContent = 'Connected';
      //qrCodeDOM.style.display = 'none';
      //chainId = provider.getChainId();
      //updateDOM(chainDOM, chainId);
      //toggleButtons();
    })
      .catch((error) => {
        console.error(error);
      });
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
            <span className="mr-2">💼</span> Metamask
            <canvas id="qrCode"></canvas>
            <h1 id="otp"></h1>
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

