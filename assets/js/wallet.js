console.log("wallet.js LOADED");

// Make the account truly global
window.connectedAccount = null;

const ENCRYPTION_SIGN_MESSAGE = `
AstroDev Encryption Request:
This signature derives your personal AES key.
It does NOT cost gas.
It does NOT grant permissions.
It is ONLY used for encryption/decryption.
`;

// Shorten address for UI
function shortAddress(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// Update the Connect Wallet button
function updateWalletUI() {
  const btn = document.getElementById("connectWalletBtn");
  if (!btn) return;

  if (window.connectedAccount) {
    btn.textContent = shortAddress(window.connectedAccount);
    btn.disabled = true;
    btn.classList.add("wallet-connected");
  } else {
    btn.textContent = "Connect Wallet";
    btn.disabled = false;
    btn.classList.remove("wallet-connected");
  }
}

// Connect wallet
async function connectWallet() {
  console.log("connectWallet() was called");

  if (!window.ethereum) {
    alert("No wallet detected. Please install Rabby.");
    return;
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    console.log("eth_requestAccounts returned:", accounts);

    if (!accounts || accounts.length === 0) {
      console.log("No accounts returned — Rabby may still be locked");
      return;
    }

    window.connectedAccount = accounts[0];
    console.log("Connected:", window.connectedAccount);

    updateWalletUI();

  } catch (err) {
    console.error("Wallet connection failed:", err);
    alert("Wallet connection failed or was rejected.");
  }
}

// Derive AES key from wallet signature
async function getWalletDerivedKey() {
  if (!window.ethereum) {
    throw new Error("No wallet detected");
  }

  if (!window.connectedAccount) {
    await connectWallet();
  }

  const signature = await window.ethereum.request({
    method: "personal_sign",
    params: [ENCRYPTION_SIGN_MESSAGE, window.connectedAccount]
  });

  const sigBytes = new TextEncoder().encode(signature);
  const hash = await crypto.subtle.digest("SHA-256", sigBytes);

  return crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

// Rabby fires this when unlocking or switching accounts
if (window.ethereum) {
  window.ethereum.on("accountsChanged", (accounts) => {
    console.log("accountsChanged:", accounts);

    if (accounts.length > 0) {
      window.connectedAccount = accounts[0];
    } else {
      window.connectedAccount = null;
    }

    updateWalletUI();
  });

  // Fires when Rabby unlocks
  window.ethereum.on("connect", (info) => {
    console.log("Rabby connect event:", info);

    window.ethereum.request({ method: "eth_accounts" })
      .then((accounts) => {
        console.log("eth_accounts returned:", accounts);
        if (accounts.length > 0) {
          window.connectedAccount = accounts[0];
          updateWalletUI();
        }
      });
  });
}

// Expose globally
window.connectWallet = connectWallet;
window.getWalletDerivedKey = getWalletDerivedKey;
