import { useEffect, useState } from "react";
import { chains } from "chain-registry";
import { useChain } from "@cosmos-kit/react";
import { SigningStargateClient, GasPrice } from "@cosmjs/stargate";

const COREUM = chains.find((chain) => chain.chain_name === "coreum-testnet");

const MINT_MSG = {
  typeUrl: "/coreum.asset.ft.v1.MsgIssue",
  value: {
    issuer: "", // will be set dynamically
    symbol: "LOGTOKEN",
    subunit: "logtoken",
    precision: 6,
    initial_amount: "1",
    description: "Demo log token",
    features: ["burning", "minting", "freezing"],
  },
};

export default function App() {
  const { connect, openView, disconnect, isWalletConnected, status, address, getRpcEndpoint, chain } = useChain("coreum-testnet");
  const [logs, setLogs] = useState<string[]>([]);
  const [balance, setBalance] = useState<string>("N/A");

  const log = (msg: string) => setLogs((prev) => [`🔹 ${msg}`, ...prev]);

  const fetchBalance = async (client: SigningStargateClient, addr: string) => {
    const balanceResult = await client.getBalance(addr, "utestcore");
    setBalance((+balanceResult.amount / 1_000_000).toFixed(6));
    log(`Wallet balance: ${balanceResult.amount} utestcore`);
  };

  const handleMint = async () => {
    if (!address) return log("❌ No address available.");

    log("⛓ Preparing to mint token...");
    const rpc = await getRpcEndpoint();
    const gasPrice = GasPrice.fromString("0.025utestcore");
    const client = await SigningStargateClient.connectWithSigner(rpc, chain.signer!, { gasPrice });

    MINT_MSG.value.issuer = address;

    const fee = {
      amount: [{ denom: "utestcore", amount: "2500" }],
      gas: "200000",
    };

    log(`🧾 Mint message: ${JSON.stringify(MINT_MSG, null, 2)}`);

    try {
      const result = await client.signAndBroadcast(address, [MINT_MSG], fee);
      if (result.code === 0) {
        log(`✅ Mint success! TX Hash: ${result.transactionHash}`);
      } else {
        log(`❌ Mint failed! Code: ${result.code} - Log: ${result.rawLog}`);
      }
    } catch (err: any) {
      log(`🔥 Exception during mint: ${err.message}`);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      log("📡 DApp Initialized.");
      if (typeof window !== "undefined" && window.keplr) {
        log("🧠 Keplr detected.");
      } else {
        log("⚠️ Keplr not detected.");
      }

      if (status === "Connected" && address) {
        log(`🔌 Connected to ${COREUM?.pretty_name}`);
        log(`👤 Address: ${address}`);
        const rpc = await getRpcEndpoint();
        const client = await SigningStargateClient.connectWithSigner(rpc, chain.signer!);
        await fetchBalance(client, address);
      } else {
        log(`🔌 Wallet not connected. Status: ${status}`);
      }
    };
    bootstrap();
  }, [status, address]);

  return (
    <div style={{ padding: 24, fontFamily: "monospace", background: "#111", color: "#0f0", minHeight: "100vh" }}>
      <h1>Mint SoloPass Token <span style={{ color: "#0ff" }}>(Live Log)</span></h1>
      <p>Status: <strong>{status}</strong></p>
      <p>Address: {address || "Not connected"}</p>
      <p>Balance: {balance} CORE</p>
      <button onClick={() => (isWalletConnected ? handleMint() : connect())} style={{ padding: "10px 20px", marginBottom: 12 }}>
        {isWalletConnected ? "Mint Token" : "Connect Wallet"}
      </button>
      <button onClick={() => openView()} style={{ padding: "6px 12px", marginLeft: 8 }}>
        Open Wallet View
      </button>
      <div style={{ marginTop: 20 }}>
        <h2>📝 Logs</h2>
        <div style={{ whiteSpace: "pre-wrap", maxHeight: "60vh", overflowY: "scroll", background: "#000", padding: "10px", border: "1px solid #333" }}>
          {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>
    </div>
  );
}
