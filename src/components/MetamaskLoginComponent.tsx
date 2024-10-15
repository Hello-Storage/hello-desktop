import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { MetaMaskSDK, SDKProvider } from '@metamask/sdk';
import useAuth from '../hooks/useAuth';
import { useIndexedDB } from '../idb/IndexedDBContext';

const MetaMaskWalletComponent: React.FC = () => {
    const { db, dbReady } = useIndexedDB();

    const { login } = useAuth(db, dbReady);
    const qrCodeRef = useRef<HTMLCanvasElement | null>(null);
    const [account, setAccount] = useState<string>('');
    //const [chainId, setChainId] = useState<string>('');
    //const [response, setResponse] = useState<string>('');
    const [provider, setProvider] = useState<SDKProvider | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [showQrCode, setShowQrCode] = useState<boolean>(false);

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
                if (qrCodeRef.current) {
                    QRCode.toCanvas(qrCodeRef.current, link, (error: any) => {
                        if (error) console.error(error);
                    });
                }
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
        console.log("connecting")
        const accounts = await sdk.connect().then((accounts) => {
            console.log("connected account")
            console.log(accounts)
        }).catch((error) => {
            console.log("error connecting account")
            console.error(error)
        });
        console.log("connected")
        const connectedProvider = sdk.getProvider();
        if (!connectedProvider) return;
        setProvider(connectedProvider);
        setAccount(accounts?.[0] || '');
        //setChainId(connectedProvider.getChainId());
        setIsConnected(true);
        setShowQrCode(false);
    };


    useEffect(() => {
        try {
            if (isConnected && account) {
                login(account, personalSign);
                //setLoading(false);
            }
        } catch (error) {
            console.log(error)
            //loading && setLoading(false);
        }
    }, [account, isConnected]);

    const personalSign = async (message: string): Promise<string> => {
        alert("personal sign")
        if (provider) {
            try {
                const from = provider.getSelectedAddress();
                const hexMessage = '0x' + new TextEncoder().encode(message).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
                const result = await provider.request({
                    method: 'personal_sign',
                    params: [hexMessage, from],
                });
                //setResponse(result as string);
                return result as string;
            } catch (e) {
                alert("error")
                console.error('sign ERR', e);
                return '';
            }
        } else {
            alert("no provider")
            console.error('No provider');
            return '';
        }
    };

    const terminate = () => {
        alert("terminating")
        sdk.terminate();
        setAccount('');
        //setChainId('');
        setIsConnected(false);
    };

    useEffect(() => {
        if (window.localStorage.getItem('.sdk-comm')) {
            alert("has localstorage")
            //remove localstorage
            window.localStorage.removeItem('.sdk-comm');
            //connect();
        } else {
            console.log("no localstorage")
        }
    }, []);

    return (

        <div className="flex flex-col gap-4 mb-6">
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
            <canvas
                ref={qrCodeRef}
                className={`mt-5 ${showQrCode ? 'fixed inset-0 z-50' : ''}`}
                style={{ display: showQrCode ? 'block' : 'none' }}
            ></canvas>
            <div className="fixed bottom-8 w-full text-center">
                <h1 id="otp" className="text-2xl font-bold"></h1>
            </div>
        </div>
    );
};

export default MetaMaskWalletComponent;