// ========================================
// FILE DECRYPTION
// ========================================

async function decryptFile() {
  const fileInput = document.getElementById("decryptInput");
  if (!fileInput.files.length) {
    alert("Select an encrypted file");
    return;
  }

  const file = fileInput.files[0];
  const buffer = new Uint8Array(await file.arrayBuffer());

  if (buffer.byteLength < 13) {
    alert("Invalid encrypted file");
    return;
  }

  // Extract IV + ciphertext
  const iv = buffer.slice(0, 12);
  const ciphertext = buffer.slice(12);

  // Get AES key
  let key;
  try {
    key = await getWalletDerivedKey();
  } catch (err) {
    alert("Failed to derive key from wallet");
    return;
  }

  // Decrypt
  let decrypted;
  try {
    decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
  } catch (err) {
    alert("Decryption failed — wrong wallet or corrupted file");
    return;
  }

  // Download
  const blob = new Blob([decrypted]);
  const url = URL.createObjectURL(blob);

  const link = document.getElementById("downloadDecrypted");
  link.href = url;
  link.download = file.name.replace(".encrypted", "");
  link.style.display = "inline";
  link.textContent = "Download Decrypted File";
}

window.decryptFile = decryptFile;
