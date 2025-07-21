import { useEffect, useState } from "react";
import {
  ChainProvider,
  useChain,
} from "@cosmos-kit/react";
import { chains, assets } from "chain-registry";
import { SigningStargateClient, AminoTypes, Registry } from "@cosmjs/stargate";
import { MsgIssue } from "coreum-js/asset/ft/v1/tx";

const appendLog = (msg: string) => {
  const el = document.getElementById("log");
  if (el) {
    el.innerHTML += `<div>> ${msg}</div>`;
    el.scrollTop = el.scrollHeight;
  }
};

export default function App() {
  const [client, setClient] = useState<SigningStargateClient | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("");

  const { connect, disconnect, getOfflineSignerAmino, address, isWalletConnected } = useChain("coreum-testnet");

  const fetchBalance = async (addr: string) => {
    try {
      const api = await client?.getBalance(addr, "utestcore");
      if (api) {
        const human = Number(api.amount) / 1_000_000;
        setBalance(human.toFixed(6));
        appendLog(`💰 Balance: ${human.toFixed(6)} testCORE`);
      }
    } catch (err) {
      appendLog(`❌ Error fetching balance`);
    }
  };

  const handleConnect = async () => {
    appendLog("🔍 Connecting to wallet...");
    try {
      await connect();
      const signer = await getOfflineSignerAmino();
      const wallet = await signer.getAccounts();
      const addr = wallet[0].address;
      setWalletAddress(addr);
      appendLog(`🔑 Connected: ${addr}`);

      const registry = new Registry();
      registry.register("/coreum.asset.ft.v1.MsgIssue", MsgIssue);

      const stargate = await SigningStargateClient.connectWithSigner(
        "https://rpc.testnet-1.coreum.dev:26657",
        signer,
        { registry }
      );

      setClient(stargate);
      fetchBalance(addr);
    } catch (err) {
      appendLog("❌ Error: " + (err as Error).message);
    }
  };

  const handleMint = async () => {
    if (!client || !walletAddress) return appendLog("❌ No wallet or client");

    const msg = {
      typeUrl: "/coreum.asset.ft.v1.MsgIssue",
      value: {
        issuer: walletAddress,
        symbol: "DEMOLOG",
        subunit: "udemolog",
        precision: 6,
        initialAmount: "5000000000",
        description: "Minted via testnet log demo",
        features: ["minting", "burning"],
        burnRate: "0.00",
        sendCommissionRate: "0.00",
      },
    };

    appendLog("🧾 MsgIssue payload constructed");
    appendLog("✍️ Signing transaction...");
    try {
      const fee = {
        amount: [{ denom: "utestcore", amount: "5000" }],
        gas: "200000",
      };

      const result = await client.signAndBroadcast(walletAddress, [msg], fee);
      if (result.code === 0) {
        appendLog(`✅ Minted! Tx hash: ${result.transactionHash}`);
      } else {
        appendLog(`❌ Broadcast failed: ${result.rawLog}`);
      }
    } catch (err) {
      appendLog(`❌ Broadcast error: ${(err as Error).message}`);
    }
  };

  return (
    <div style={{ fontFamily: "monospace", padding: "20px", color: "#0f0", backgroundColor: "#000", minHeight: "100vh" }}>
      <h1>🧪 Mint Smart Token (Testnet Log Dashboard)</h1>
      <button onClick={handleConnect} style={{ marginRight: "10px" }}>🔌 Connect Wallet</button>
      <button onClick={handleMint}>🪙 Mint Token</button>
      <div style={{ marginTop: "20px", backgroundColor: "#111", padding: "15px", borderRadius: "8px", height: "400px", overflowY: "auto" }} id="log">
        <div>> 🔥 Coreum Testnet Log Console</div>
      </div>
    </div>
  );
}
