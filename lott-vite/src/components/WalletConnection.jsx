import { ConnectWallet, useAddress, useDisconnect } from "@thirdweb-dev/react";

const WalletConnection = () => {
  const address = useAddress();
  const disconnect = useDisconnect();

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {address ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-gray-200">
            Connected: {address.slice(0, 6)}...{address.slice(-4)}
          </p>
          <button
            onClick={disconnect}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <p className="text-gray-200">Connect your wallet to participate</p>
          <ConnectWallet 
            theme="dark"
            btnTitle="Connect Wallet"
          />
        </div>
      )}
    </div>
  );
};

export default WalletConnection;