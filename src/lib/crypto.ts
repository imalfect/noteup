// client-side encryption — password never leaves the browser

export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt.buffer as ArrayBuffer, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptContent(
  content: string,
  password: string
): Promise<{ encrypted: string; salt: string; iv: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encoder = new TextEncoder();
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    encoder.encode(content)
  );
  return {
    encrypted: bufferToBase64(encryptedBuffer),
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
  };
}

export async function decryptContent(
  encrypted: string,
  password: string,
  salt: string,
  iv: string
): Promise<string> {
  const saltBuffer = base64ToBuffer(salt);
  const ivBuffer = base64ToBuffer(iv);
  const key = await deriveKey(password, new Uint8Array(saltBuffer));
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuffer },
    key,
    base64ToBuffer(encrypted)
  );
  return new TextDecoder().decode(decryptedBuffer);
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
