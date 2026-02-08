// ========================================
// FILE ENCRYPTION
// ========================================

async function encryptFile() {
  const fileInput = document.getElementById("encryptInput");
  if (!fileInput.files.length) {
    alert("Select a file first");
    return;
  }

  const file = fileInput.files[0];
  const fileBuffer = await file.arrayBuffer();

  // Get AES key from wallet
  let key;
  try {
    key = await getWalletDerivedKey();
  } catch (err) {
    alert("Failed to derive key from wallet");
    return;
  }

  // Random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  let encrypted;
  try {
    encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      fileBuffer
    );
  } catch (err) {
    alert("Encryption failed");
    return;
  }

  // Combine IV + ciphertext
  const encryptedBytes = new Uint8Array(encrypted);
  const packageBytes = new Uint8Array(iv.length + encryptedBytes.length);
  packageBytes.set(iv, 0);
  packageBytes.set(encryptedBytes, iv.length);

  // Download
  const blob = new Blob([packageBytes], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);

  const link = document.getElementById("downloadEncrypted");
  link.href = url;
  link.download = file.name + ".encrypted";
  link.style.display = "inline";
  link.textContent = "Download Encrypted File";
}

window.encryptFile = encryptFile;
