import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { MetaMaskSDK, SDKProvider } from '@metamask/sdk';
import useAuth from '../hooks/useAuth';
import { useIndexedDB } from '../idb/IndexedDBContext';

const MetaMaskWalletComponent: React.FC = () => {
  const { db, dbReady } = useIndexedDB();

  const [qrCodeLink, setQrCodeLink] = useState<string>('');
  const { login } = useAuth(db, dbReady);
  const qrCodeRef = useRef<HTMLCanvasElement | null>(null);
  const [account, setAccount] = useState<string>('');
  const [provider, setProvider] = useState<SDKProvider | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  const [showSignMessage, setShowSignMessage] = useState<boolean>(false); // New state variable

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
        setQrCodeLink(link); // Store the link
        setShowQrCode(true);
        return {};
      },
      otp: () => {
        return {
          updateOTPValue: (otpValue: string) => {
            if (otpValue !== '') {
              document.getElementById('otp')!.innerText = otpValue;
            }
          },
        };
      },
    },
  });

  const connect = async () => {
    console.log('connecting');
    const accounts = await sdk.connect().catch((error) => {
      console.log('error connecting account');
      console.error(error);
    });
    console.log('connected');
    console.log(accounts);
    const connectedProvider = sdk.getProvider();
    if (!connectedProvider) {
      alert('No provider');
      return;
    }
    setProvider(connectedProvider);
    console.log('setting account');
    setAccount(accounts?.[0] || '');
    setIsConnected(true);
    console.log('setting connected');
    setShowQrCode(false);
  };

  useEffect(() => {
    try {
      console.log('account or connection changed');

      if (isConnected && account) {
        console.log('calling logging in');
        login(db, dbReady, account, personalSign);
      } else {
        console.log('no account or connection');
        console.log(account);
        console.log(isConnected);
      }
    } catch (error) {
      console.log(error);
    }
  }, [account, isConnected]);

  const personalSign = async (message: string): Promise<string> => {
    if (provider) {
      try {
        setShowSignMessage(true); // Show the signature prompt message
        const from = provider.getSelectedAddress();
        const hexMessage =
          '0x' +
          new TextEncoder()
            .encode(message)
            .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
        const result = await provider.request({
          method: 'personal_sign',
          params: [hexMessage, from],
        });
        setShowSignMessage(false); // Hide the signature prompt message
        return result as string;
      } catch (e) {
        setShowSignMessage(false); // Ensure the message is hidden in case of error
        alert('Error signing message');
        console.error('sign ERR', e);
        return '';
      }
    } else {
      alert('No provider available');
      console.error('No provider');
      return '';
    }
  };

  const terminate = () => {
    sdk.terminate();
    setAccount('');
    setIsConnected(false);
  };

  useEffect(() => {
    if (showQrCode && qrCodeLink && qrCodeRef.current) {
      QRCode.toCanvas(qrCodeRef.current, qrCodeLink, (error: any) => {
        if (error) console.error(error);
      });
    }
  }, [showQrCode, qrCodeLink]);

  useEffect(() => {
    if (window.localStorage.getItem('.sdk-comm')) {
      console.log('has localstorage');
      window.localStorage.removeItem('.sdk-comm');
    } else {
      console.log('no localstorage');
    }
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {showQrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50"></div>
      )}
      <button
        onClick={connect}
        className="flex items-center justify-center w-full bg-white border border-gray-300 text-gray-700 rounded-md py-2 hover:bg-gray-100"
      >
        <img
          src="https://raw.githubusercontent.com/MetaMask/brand-resources/cb6fd847f3a9cc5e231c749383c3898935e62eab/SVG/metamask-fox-wordmark-horizontal.svg"
          alt="MetaMask"
          className="h-6 mr-2"
        />
        {isConnected ? 'Connected' : 'Connect'}
      </button>
      {isConnected && (
        <div className="flex flex-col gap-4 mt-4">
          <button
            onClick={terminate}
            className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600"
          >
            Terminate
          </button>
        </div>
      )}

      {showQrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="p-6 rounded-lg flex flex-col items-center space-y-4">
            <div className="text-center place-items-center justify-center">
              <h2 className="text-xl font-bold mb-2">Connect to MetaMask</h2>
              <p className="mb-2">
                You can connect to MetaMask using one of the following options:
              </p>
              <ul className="list-disc list-inside text-left mb-4">
                <li>Scan the QR code with your mobile phone camera</li>
                <li>Scan the QR code with the MetaMask mobile app</li>
                <li>
                  Or copy and open this link directly in your mobile phone:{' '}
                  <a
                    onClick={() => {
                      navigator.clipboard.writeText(qrCodeLink);
                      alert('Copied login URL to clipboard');
                    }}
                    className="text-blue-500 underline break-all cursor-pointer"
                  >
                    Copy
                  </a>
                </li>
              </ul>
              <canvas
                className="w-100px h-10"
                ref={qrCodeRef}
                style={{ border: '1px solid red' }}
              ></canvas>
              <button
                onClick={() => setShowQrCode(false)}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showSignMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="text-black p-6 rounded-lg flex flex-col items-center space-y-4 bg-white">
            <h2 className="text-xl font-bold mb-2">Signature Requested</h2>
            <p>Please sign the message using your MetaMask mobile app.</p>
          </div>
        </div>
      )}

      <div className="fixed bottom-8 w-full text-center">
        <h1 id="otp" className="text-2xl font-bold"></h1>
      </div>
    </div>
  );
};

export default MetaMaskWalletComponent;
