"use client"
import { whirlpool, sha512 } from 'hash-wasm';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

const hexStringToArray = (hexString: string): Uint8Array => {
  //console.log("hexStringToArray input:", hexString);
  const matches = hexString.match(/.{1,2}/g);
  if (!matches) {
    throw new Error('Invalid hexadecimal string');
  }
  const arr = new Uint8Array(matches.map(byte => parseInt(byte, 16)));
  //console.log("hexStringToArray output:", arr);
  return arr;
};

const base64ToUint8Array = (base64: string): Uint8Array => {
  //console.log("base64ToUint8Array input:", base64);
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  //console.log("base64ToUint8Array output:", bytes);
  return bytes;
};

export async function getPublicMlKem1024Fingerprint(
  recipientEmail: string
): Promise<[string | null, Error | null]> {
  try {
    // Fetch the public key from Firestore
    const keyRef = doc(db, `data/${recipientEmail}/public`, 'mlkem-public-key');
    const keyDoc = await getDoc(keyRef);
    const keyData = keyDoc.data();
    //console.log("keyData:", keyData);

    if (!keyData || !('publicKey' in keyData)) {
      throw new Error("Public key not found in Firestore");
    }

    const publicKeyStr = keyData.publicKey;
    //console.log("publicKeyStr:", publicKeyStr);

    // Convert base64 to bytes to check length (ML-KEM-1024 public key is 1568 bytes)
    const publicKeyBytes = base64ToUint8Array(publicKeyStr);
    if (publicKeyBytes.length !== 1568) {
      throw new Error("Public key length does not match ML-KEM-1024 requirements");
    }

    // Hash the base-64 string as a string, using sha512 + whirlpool as in the original
    const sha512Hash = await sha512(publicKeyStr);
    //console.log("sha512Hash:", sha512Hash);
    const sha512Bytes = hexStringToArray(sha512Hash);
    //console.log("sha512Bytes:", sha512Bytes);

    const whirlpoolHash = await whirlpool(sha512Bytes);
    //console.log("whirlpoolHash:", whirlpoolHash);
    const whirlpoolBytes = hexStringToArray(whirlpoolHash);
    //console.log("whirlpoolBytes:", whirlpoolBytes);

    // Format as ABCD-EF12-3456-...
    const hex = Array.from(whirlpoolBytes)
      .map(b => b.toString(16).padStart(2, '0').toUpperCase())
      .join('');
    //console.log("hex:", hex);

    const blocks = [];
    for (let i = 0; i < hex.length; i += 4) {
      blocks.push(hex.slice(i, i + 4));
    }
    //console.log("blocks:", blocks);

    const fingerprint = blocks.join('-');
    //console.log("fingerprint:", fingerprint);

    return [fingerprint, null];
  } catch (err) {
    //console.error("Error in getPublicMlKem1024Fingerprint:", err);
    return [null, err instanceof Error ? err : new Error(String(err))];
  }
}
