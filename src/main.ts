import { SigningStargateClient } from "@cosmjs/stargate";

document.addEventListener("DOMContentLoaded", () => {
  const terminal = document.getElementById("terminal")!;
  const appendLog = (msg: string) => {
    terminal.textContent += msg + "\n";
    terminal.scrollTop = terminal.scrollHeight;
  };

  appendLog("Ready.");

  document.getElementById("mintBtn")!.addEventListener("click", async () => {
    appendLog("🔍 Connecting to wallet...");
    if (!window.keplr) {
      appendLog("❌ Keplr not found. Please install Keplr.");
      return;
    }

    const chainId = "coreum-testnet-1";
    try {
      await window.keplr.enable(chainId);
      const offlineSigner = window.getOfflineSigner(chainId);
      const accounts = await offlineSigner.getAccounts();
      const address = accounts[0].address;
      appendLog(`🔑 Wallet connected: ${address}`);

      const msgIssue = {
        typeUrl: "/coreum.asset.ft.v1.MsgIssue",
        value: {
          issuer: address,
          symbol: "PASS",
          subunit: "upass",
          precision: 0,
          initialAmount: "1",
          description: "SoloPass Demo Token",
          features: ["burning", "freezing", "whitelisting"],
          burnRate: "0.0",
          sendCommissionRate: "0.0",
        },
      };

      const fee = {
        amount: [{ denom: "utestcore", amount: "5000" }],
        gas: "200000",
      };

      const client = await SigningStargateClient.connectWithSigner(
        "https://full-node.testnet-1.coreum.dev:26657",
        offlineSigner
      );

      appendLog("🚀 Broadcasting mint transaction...");
      const result = await client.signAndBroadcast(address, [msgIssue], fee);
      if (result.code === 0) {
        appendLog("✅ Mint successful!");
      } else {
        appendLog("❌ Mint failed: " + result.rawLog);
      }
    } catch (err: any) {
      appendLog("⚠️ Error: " + err.message);
    }
  });
});
