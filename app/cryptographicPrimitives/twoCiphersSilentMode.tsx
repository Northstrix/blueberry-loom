"use client";

import { encryptSerpent256ECB, decryptSerpent256ECB } from '@/app/cryptographicPrimitives/serpent';
import { createSHA3, createHMAC, whirlpool, argon2id, sha512 } from 'hash-wasm';
import { ChaCha20 } from 'mipher';

export const silentlyDecryptDataWithTwoCiphersCBC = async (
    bytes: Uint8Array, 
    password: Uint8Array, 
    iterations: number
): Promise<[Uint8Array, boolean]> => {
    const chunkSize = 16;
    const salt = bytes.slice(0, 32);
    const derivedKey = await derive416BytesUsingArgon2id(password, salt, iterations);
    let chacha20key = new Uint8Array(derivedKey.slice(0, 64));
    const blockCipherKey = derivedKey.slice(64, 96);
    const hmacKey = derivedKey.slice(96);
  
    const extractedIV = bytes.slice(32, 48);
    const decryptedIV = await decryptSerpent256ECB(extractedIV, blockCipherKey);
    let previousCiphertext = decryptedIV;
  
    const decryptedData: number[] = [];
    const dataLengthNoLC = bytes.length;
    for (let i = 48; i < dataLengthNoLC; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      const decryptedChunk = await decryptSerpent256ECB(chunk, blockCipherKey);
      const xorChunk = decryptedChunk.map((byte, index) => byte ^ previousCiphertext[index]);
      xorChunk.forEach(byte => decryptedData.push(byte));
      previousCiphertext = chunk;
    }
  
    const decryptedDataUint8Array = new Uint8Array(decryptedData);
  
    const chunkSizeForStreamCipher = 256 * 1024; // 256 KB chunks
    let streamCipherOffset = 0;
    const decryptedTag = new Uint8Array(64);
    const decryptedChunks = new Uint8Array(decryptedDataUint8Array.length - 64);
    let decryptedOffset = 0;
    
    let isFirstChunk = true;
    
    while (streamCipherOffset < decryptedDataUint8Array.length) {
      const input = Array.from(chacha20key).map(byte => byte.toString(16).padStart(2, '0')).join('');
      const sha512_output = await sha512(input);
      const sha512Array = hexStringToArray(sha512_output);
      const byteArray = new Uint8Array(sha512Array);
      const generatedHash = await whirlpool(byteArray);
      chacha20key = new Uint8Array(hexStringToArray(generatedHash));
    
      const chunk = decryptedDataUint8Array.slice(streamCipherOffset, Math.min(streamCipherOffset + chunkSizeForStreamCipher, decryptedDataUint8Array.length));
      const nonce = chacha20key.slice(32, 40);
      const chacha20 = new ChaCha20();
      const decryptedChunk = chacha20.decrypt(chacha20key.slice(0, 32), chunk, nonce);
    
      if (isFirstChunk) {
        decryptedTag.set(decryptedChunk.slice(0, 64));
        decryptedChunks.set(decryptedChunk.slice(64), 0);
        decryptedOffset = decryptedChunk.length - 64;
        isFirstChunk = false;
      } else {
        decryptedChunks.set(decryptedChunk, decryptedOffset);
        decryptedOffset += decryptedChunk.length;
      }
    
      streamCipherOffset += chunk.length;
    }
    const decryptedWithStreamCipher = decryptedChunks.slice(0, decryptedOffset);
    const newTag = await computeTagForDataUsingHMACSHA512(hmacKey, decryptedWithStreamCipher);
    let integrityFailed = false;
    for (let i = 0; i < 64; i++) {
      if (decryptedTag[i] !== newTag[i]) {
        integrityFailed = true;
        break;
      }
    }
    return [decryptedWithStreamCipher, integrityFailed];
    }

export const silentlyEncryptDataWithTwoCiphersCBCnoPadding = async (
    bytes: Uint8Array,
    password: Uint8Array,
    iterations: number
): Promise<Uint8Array> => {
    // Thsi function doesn't add a padding block if the input length is a multiple of 16 //
    const salt = window.crypto.getRandomValues(new Uint8Array(32));
    const encryptedChunks: Uint8Array[] = [];
    encryptedChunks.push(salt);
    const derivedKey = await derive416BytesUsingArgon2id(password, salt, iterations);
    const chunkSize = 256 * 1024; // 256 KB chunks
    let offset = 0;
    let chacha20key = new Uint8Array(derivedKey.slice(0, 64));
    const blockCipherKey = derivedKey.slice(64, 96);
    const hmacKey = derivedKey.slice(96);
    const tag = await computeTagForDataUsingHMACSHA512(hmacKey, bytes);
    const tag_and_data = new Uint8Array(tag.length + bytes.length);
    tag_and_data.set(tag, 0);
    tag_and_data.set(bytes, tag.length);


    const encryptedData = new Uint8Array(tag_and_data.length);
  
    const totalSize = tag_and_data.length;
    while (offset < totalSize) {
      const input = Array.from(chacha20key).map(byte => byte.toString(16).padStart(2, '0')).join('');
      const sha512_output = await sha512(input);
      const sha512Array = hexStringToArray(sha512_output);
      const byteArray = new Uint8Array(sha512Array);
      const generatedHash = await whirlpool(byteArray);
      chacha20key = new Uint8Array(hexStringToArray(generatedHash));
  
      const chunk = tag_and_data.slice(offset, Math.min(offset + chunkSize, totalSize));
      const nonce = chacha20key.slice(32, 40);
      const chacha20 = new ChaCha20();
      const encryptedChunk = chacha20.encrypt(chacha20key.slice(0, 32), chunk, nonce);
  
      for (let i = 0; i < encryptedChunk.length; i++) {
        encryptedData[offset + i] = encryptedChunk[i];
      }
      offset += chunk.length;
    }

    const blockcipher_chunk_size = 16;
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    const encryptedIV = await encryptSerpent256ECB(iv, blockCipherKey);
    encryptedChunks.push(encryptedIV);
    let previousCiphertext = iv;
    for (let i = 0; i < encryptedData.length; i += blockcipher_chunk_size) {
      let chunk = encryptedData.slice(i, i + blockcipher_chunk_size);
      if (chunk.length < blockcipher_chunk_size) {
        const padding = blockcipher_chunk_size - chunk.length;
        const paddedChunk = new Uint8Array(blockcipher_chunk_size);
        paddedChunk.set(chunk);
        paddedChunk.fill(padding, chunk.length);
        chunk = paddedChunk;
      }
      const xorChunk = chunk.map((byte, index) => byte ^ previousCiphertext[index]);
      const encryptedChunk = await encryptSerpent256ECB(xorChunk, blockCipherKey);
      encryptedChunks.push(encryptedChunk);
      previousCiphertext = encryptedChunk;
    }
  
    const totalLength = encryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let soffset = 0;
    for (const chunk of encryptedChunks) {
      result.set(chunk, soffset);
      soffset += chunk.length;
    }
  
    return result;
  }

export const silentlyEncryptDataWithTwoCiphersCBC = async (
  bytes: Uint8Array,
  password: Uint8Array,
  iterations: number
): Promise<Uint8Array> => {
  const salt = window.crypto.getRandomValues(new Uint8Array(32));
  const encryptedChunks: Uint8Array[] = [];
  encryptedChunks.push(salt);
  const derivedKey = await derive416BytesUsingArgon2id(password, salt, iterations);
  const chunkSize = 256 * 1024; // 256 KB chunks
  let offset = 0;
  let chacha20key = new Uint8Array(derivedKey.slice(0, 64));
  const blockCipherKey = derivedKey.slice(64, 96);
  const hmacKey = derivedKey.slice(96);
  const tag = await computeTagForDataUsingHMACSHA512(hmacKey, bytes);
  const tag_and_data = new Uint8Array(tag.length + bytes.length);
  tag_and_data.set(tag, 0);
  tag_and_data.set(bytes, tag.length);


  const encryptedData = new Uint8Array(tag_and_data.length);

  const totalSize = tag_and_data.length;
  while (offset < totalSize) {
    const input = Array.from(chacha20key).map(byte => byte.toString(16).padStart(2, '0')).join('');
    const sha512_output = await sha512(input);
    const sha512Array = hexStringToArray(sha512_output);
    const byteArray = new Uint8Array(sha512Array);
    const generatedHash = await whirlpool(byteArray);
    chacha20key = new Uint8Array(hexStringToArray(generatedHash));

    const chunk = tag_and_data.slice(offset, Math.min(offset + chunkSize, totalSize));
    const nonce = chacha20key.slice(32, 40);
    const chacha20 = new ChaCha20();
    const encryptedChunk = chacha20.encrypt(chacha20key.slice(0, 32), chunk, nonce);

    for (let i = 0; i < encryptedChunk.length; i++) {
      encryptedData[offset + i] = encryptedChunk[i];
    }
    offset += chunk.length;
  }

  const blockcipher_chunk_size = 16;
  const iv = window.crypto.getRandomValues(new Uint8Array(16));
  const encryptedIV = await encryptSerpent256ECB(iv, blockCipherKey);
  encryptedChunks.push(encryptedIV);
  let previousCiphertext = iv;
  let paddingApplied = false; // Flag to track if padding was applied during the loop

  for (let i = 0; i < encryptedData.length; i += blockcipher_chunk_size) {
    let chunk = encryptedData.slice(i, i + blockcipher_chunk_size);

    // Check if this is the last chunk
    if (chunk.length < blockcipher_chunk_size) {
      const padding = blockcipher_chunk_size - chunk.length;
      const paddedChunk = new Uint8Array(blockcipher_chunk_size);
      paddedChunk.set(chunk);
      paddedChunk.fill(padding, chunk.length);
      chunk = paddedChunk;
      paddingApplied = true; // Mark that padding was applied
      //console.log("Padding Length:", padding);
      //console.log("Padded Chunk:", Array.from(paddedChunk));
    }

    const xorChunk = chunk.map((byte, index) => byte ^ previousCiphertext[index]);
    const encryptedChunk = await encryptSerpent256ECB(xorChunk, blockCipherKey);
    encryptedChunks.push(encryptedChunk);
    previousCiphertext = encryptedChunk;
  }

  // Add a full block of padding if no padding was applied during the loop
  if (!paddingApplied) {
    //console.log("Adding Full Padding Block After Loop");
    const paddedChunk = new Uint8Array(blockcipher_chunk_size);
    paddedChunk.fill(blockcipher_chunk_size); // Fill with the value equal to the block size
    const xorChunk = paddedChunk.map((byte, index) => byte ^ previousCiphertext[index]);
    const encryptedChunk = await encryptSerpent256ECB(xorChunk, blockCipherKey);
    encryptedChunks.push(encryptedChunk);

    //console.log("Full Padding Block:", Array.from(paddedChunk)); // Debugging: Print the full padding block
  }
    
  const totalLength = encryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let soffset = 0;
  for (const chunk of encryptedChunks) {
    result.set(chunk, soffset);
    soffset += chunk.length;
  }

  return result;
}

export const computeTagForDataUsingHMACSHA512 = async (key: Uint8Array ,data: Uint8Array) => {
  const hmac = await createHMAC(createSHA3(512), key);
  hmac.init();
  hmac.update(data);
  const signature = hmac.digest('binary');
  return new Uint8Array(signature);
};

export const hexStringToArray = (hexString: string): number[] => {
  // Check if the input is a valid hex string
  if (!/^[0-9A-Fa-f]+$/.test(hexString)) {
      throw new Error("Invalid hex string");
  }

  if (hexString.length % 2 !== 0) {
      throw new Error("Invalid hex string length");
  }

  const resultArray: number[] = [];
  for (let i = 0; i < hexString.length; i += 2) {
      const hexPair = hexString.substring(i, i + 2);
      resultArray.push(parseInt(hexPair, 16)); // Convert hex pair to integer
  }

  return resultArray;
};

const derive416BytesUsingArgon2id = async (password: Uint8Array, salt: Uint8Array, iterations: number) => {
  const derivedKey = await argon2id({
    password,
    salt,
    parallelism: 1,
    iterations,
    memorySize: 512,
    hashLength: 416,
    outputType: 'binary',
  });
  return new Uint8Array(derivedKey);
};

export const deriveBytesUsingArgon2id = async (password: Uint8Array, salt: Uint8Array, iterations: number, number_of_bytes: number) => {
  const derivedKey = await argon2id({
    password,
    salt,
    parallelism: 1,
    iterations,
    memorySize: 512,
    hashLength: number_of_bytes,
    outputType: 'binary',
  });
  return new Uint8Array(derivedKey);
};

export const decryptFieldValueWithTwoCiphersCBCnoPadding = async (
  bytes: Uint8Array, 
  password: Uint8Array, 
  iterations: number
): Promise<[Uint8Array, boolean]> => {
  const chunkSize = 16;
  const salt = bytes.slice(0, 32);
  const derivedKey = await derive416BytesUsingArgon2id(password, salt, iterations);
  let chacha20key = new Uint8Array(derivedKey.slice(0, 64));
  const blockCipherKey = derivedKey.slice(64, 96);
  const hmacKey = derivedKey.slice(96);
  const extractedIV = bytes.slice(32, 48);
  const decryptedIV = await decryptSerpent256ECB(extractedIV, blockCipherKey);
  let previousCiphertext = decryptedIV;

  const decryptedData: number[] = [];
  const dataLengthNoLC = bytes.length - chunkSize;
  for (let i = 48; i < dataLengthNoLC; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    const decryptedChunk = await decryptSerpent256ECB(chunk, blockCipherKey);
    const xorChunk = decryptedChunk.map((byte, index) => byte ^ previousCiphertext[index]);
    for (let j = 0; j < xorChunk.length; j++) {
      decryptedData.push(xorChunk[j]);
    }
    previousCiphertext = chunk;
  }

  // Handle padding in the last block
  const encryptedLastBlock = bytes.slice(bytes.length - chunkSize);
  const decryptedLastBlock = await decryptSerpent256ECB(encryptedLastBlock, blockCipherKey);
  const decryptedLastBlockXORed = decryptedLastBlock.map((byte, index) => byte ^ previousCiphertext[index]);
  const paddingLength = pkcs7PaddingConsumed(decryptedLastBlockXORed);
    const unpaddedLastBlock = decryptedLastBlockXORed.slice(0, 16);
    for (let j = 0; j < 16; j++) {
      decryptedData.push(unpaddedLastBlock[j]);
    }
  const decryptedDataUint8Array = new Uint8Array(decryptedData);

  const chunkSizeForStreamCipher = 256 * 1024; // 256 KB chunks
  let streamCipherOffset = 0;
  const decryptedTag = new Uint8Array(64);
  const decryptedChunks = new Uint8Array(decryptedDataUint8Array.length - 64);
  let decryptedOffset = 0;
  
  let isFirstChunk = true;
  
  while (streamCipherOffset < decryptedDataUint8Array.length) {
    const input = Array.from(chacha20key).map(byte => byte.toString(16).padStart(2, '0')).join('');
    const sha512_output = await sha512(input);
    const sha512Array = hexStringToArray(sha512_output);
    const byteArray = new Uint8Array(sha512Array);
    const generatedHash = await whirlpool(byteArray);
    chacha20key = new Uint8Array(hexStringToArray(generatedHash));
  
    const chunk = decryptedDataUint8Array.slice(streamCipherOffset, Math.min(streamCipherOffset + chunkSizeForStreamCipher, decryptedDataUint8Array.length));
    const nonce = chacha20key.slice(32, 40);
    const chacha20 = new ChaCha20();
    const decryptedChunk = chacha20.decrypt(chacha20key.slice(0, 32), chunk, nonce);
  
    if (isFirstChunk) {
      decryptedTag.set(decryptedChunk.slice(0, 64));
      decryptedChunks.set(decryptedChunk.slice(64), 0);
      decryptedOffset = decryptedChunk.length - 64;
      isFirstChunk = false;
    } else {
      decryptedChunks.set(decryptedChunk, decryptedOffset);
      decryptedOffset += decryptedChunk.length;
    }
  
    streamCipherOffset += chunk.length;
  }
  
  const decryptedWithStreamCipher = decryptedChunks.slice(0, decryptedOffset);
  const newTag = await computeTagForDataUsingHMACSHA512(hmacKey, decryptedWithStreamCipher);
  let integrityPassed = true;
  for (let i = 0; i < 64; i++) {
    if (decryptedTag[i] !== newTag[i]) {
      integrityPassed = false;
      break;
    }
  }
  return [decryptedWithStreamCipher, integrityPassed];
};

export const decryptFieldValueWithTwoCiphersCBC = async (
  bytes: Uint8Array, 
  password: Uint8Array, 
  iterations: number
): Promise<[Uint8Array, boolean]> => {
  const chunkSize = 16;
  const salt = bytes.slice(0, 32);
  const derivedKey = await derive416BytesUsingArgon2id(password, salt, iterations);
  let chacha20key = new Uint8Array(derivedKey.slice(0, 64));
  const blockCipherKey = derivedKey.slice(64, 96);
  const hmacKey = derivedKey.slice(96);
  const extractedIV = bytes.slice(32, 48);
  const decryptedIV = await decryptSerpent256ECB(extractedIV, blockCipherKey);
  let previousCiphertext = decryptedIV;

  const decryptedData: number[] = [];
  const dataLengthNoLC = bytes.length - chunkSize;
  for (let i = 48; i < dataLengthNoLC; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    const decryptedChunk = await decryptSerpent256ECB(chunk, blockCipherKey);
    const xorChunk = decryptedChunk.map((byte, index) => byte ^ previousCiphertext[index]);
    for (let j = 0; j < xorChunk.length; j++) {
      decryptedData.push(xorChunk[j]);
    }
    previousCiphertext = chunk;
  }

  // Handle padding in the last block
  const encryptedLastBlock = bytes.slice(bytes.length - chunkSize);
  const decryptedLastBlock = await decryptSerpent256ECB(encryptedLastBlock, blockCipherKey);
  const decryptedLastBlockXORed = decryptedLastBlock.map((byte, index) => byte ^ previousCiphertext[index]);
  const paddingLength = pkcs7PaddingConsumed(decryptedLastBlockXORed);
  let paddingValid = true;
  if (paddingLength === 0) {
    paddingValid = false;
  } else if (paddingLength === 16) {
    // Do nothing
  } else {
    const unpaddedLastBlock = decryptedLastBlockXORed.slice(0, 16 - paddingLength);
    for (let j = 0; j < unpaddedLastBlock .length; j++) {
      decryptedData.push(unpaddedLastBlock[j]);
    }
  }

  const decryptedDataUint8Array = new Uint8Array(decryptedData);

  const chunkSizeForStreamCipher = 256 * 1024; // 256 KB chunks
  let streamCipherOffset = 0;
  const decryptedTag = new Uint8Array(64);
  const decryptedChunks = new Uint8Array(decryptedDataUint8Array.length - 64);
  let decryptedOffset = 0;
  
  let isFirstChunk = true;
  
  while (streamCipherOffset < decryptedDataUint8Array.length) {
    const input = Array.from(chacha20key).map(byte => byte.toString(16).padStart(2, '0')).join('');
    const sha512_output = await sha512(input);
    const sha512Array = hexStringToArray(sha512_output);
    const byteArray = new Uint8Array(sha512Array);
    const generatedHash = await whirlpool(byteArray);
    chacha20key = new Uint8Array(hexStringToArray(generatedHash));
  
    const chunk = decryptedDataUint8Array.slice(streamCipherOffset, Math.min(streamCipherOffset + chunkSizeForStreamCipher, decryptedDataUint8Array.length));
    const nonce = chacha20key.slice(32, 40);
    const chacha20 = new ChaCha20();
    const decryptedChunk = chacha20.decrypt(chacha20key.slice(0, 32), chunk, nonce);
  
    if (isFirstChunk) {
      decryptedTag.set(decryptedChunk.slice(0, 64));
      decryptedChunks.set(decryptedChunk.slice(64), 0);
      decryptedOffset = decryptedChunk.length - 64;
      isFirstChunk = false;
    } else {
      decryptedChunks.set(decryptedChunk, decryptedOffset);
      decryptedOffset += decryptedChunk.length;
    }
  
    streamCipherOffset += chunk.length;
  }
  
  const decryptedWithStreamCipher = decryptedChunks.slice(0, decryptedOffset);
  const newTag = await computeTagForDataUsingHMACSHA512(hmacKey, decryptedWithStreamCipher);
  let integrityPassed = true;
  for (let i = 0; i < 64; i++) {
    if (decryptedTag[i] !== newTag[i]) {
      integrityPassed = false;
      break;
    }
  }
  return [decryptedWithStreamCipher, integrityPassed];
};

export function pkcs7PaddingConsumed(data: Uint8Array) {
  let allTen = true;
  for (let i = 0; i < 16; i++) {
    if (data[i] !== 0x10) {
      allTen = false;
      break;
    }
  }
  if (allTen) {
    return 16;
  }
  const paddingValue = data[15];
  if (paddingValue < 1 || paddingValue > 16) {
    return 0;
  }
  for (let i = 1; i <= paddingValue; i++) {
    if (data[16 - i] !== paddingValue) {
      return 0;
    }
  }
  return paddingValue;
}

export const encryptPrivateRecordTagWithTwoCiphersCBC = async (
    bytes: Uint8Array,
    password: Uint8Array,
    iterations: number,
): Promise<Uint8Array> => {
    const chunkSize = 256 * 1024; // 256 KB chunks
    let offset = 0;
    const salt = window.crypto.getRandomValues(new Uint8Array(32));
    const encryptedChunks: Uint8Array[] = [];
    encryptedChunks.push(salt);
    const derivedKey = await derive416BytesUsingArgon2id(password, salt, iterations);
    let chacha20key = new Uint8Array(derivedKey.slice(0, 64));
    const blockCipherKey = derivedKey.slice(64, 96);
    const hmacKey = derivedKey.slice(96);
    const tag = await computeTagForDataUsingHMACSHA512(hmacKey, bytes);
    const encryptedData = new Uint8Array(tag.length);
  
    const totalSize = tag.length;
    while (offset < totalSize) {
      const input = Array.from(chacha20key).map(byte => byte.toString(16).padStart(2, '0')).join('');
      const sha512_output = await sha512(input);
      const sha512Array = hexStringToArray(sha512_output);
      const byteArray = new Uint8Array(sha512Array);
      const generatedHash = await whirlpool(byteArray);
      chacha20key = new Uint8Array(hexStringToArray(generatedHash));
  
      const chunk = tag.slice(offset, Math.min(offset + chunkSize, totalSize));
      const nonce = chacha20key.slice(32, 40);
      const chacha20 = new ChaCha20();
      const encryptedChunk = chacha20.encrypt(chacha20key.slice(0, 32), chunk, nonce);
  
      for (let i = 0; i < encryptedChunk.length; i++) {
        encryptedData[offset + i] = encryptedChunk[i];
      }
      offset += chunk.length;
    }

    const blockcipher_chunk_size = 16;
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    const encryptedIV = await encryptSerpent256ECB(iv, blockCipherKey);
    encryptedChunks.push(encryptedIV);
    let previousCiphertext = iv;
    for (let i = 0; i < encryptedData.length; i += blockcipher_chunk_size) {
      let chunk = encryptedData.slice(i, i + blockcipher_chunk_size);
      if (chunk.length < blockcipher_chunk_size) {
        const padding = blockcipher_chunk_size - chunk.length;
        const paddedChunk = new Uint8Array(blockcipher_chunk_size);
        paddedChunk.set(chunk);
        paddedChunk.fill(padding, chunk.length);
        chunk = paddedChunk;
      }
      const xorChunk = chunk.map((byte, index) => byte ^ previousCiphertext[index]);
      const encryptedChunk = await encryptSerpent256ECB(xorChunk, blockCipherKey);
      encryptedChunks.push(encryptedChunk);
      previousCiphertext = encryptedChunk;
    }

    const totalLength = encryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let soffset = 0;
    for (const chunk of encryptedChunks) {
      result.set(chunk, soffset);
      soffset += chunk.length;
    }
    // Inputs (actual values as hex strings)
    //console.log('Input Data (hex):', Buffer.from(bytes).toString('hex'));
    //console.log('Password (hex):', Buffer.from(password).toString('hex'));
    //console.log('Iterations:', iterations);
    
    // Key material
    //console.log('Salt (hex):', Buffer.from(salt).toString('hex'));
    //console.log('HMAC Key (hex):', Buffer.from(hmacKey).toString('hex'));
    
    // Tags
    //console.log('Pre-Encrypted Tag (hex):', Buffer.from(tag).toString('hex'));
    //console.log('Final Ciphertext (hex):', Buffer.from(result).toString('hex'));
    return result;
  }

export const CheckRecordIntegrity = async (
  bytes: Uint8Array, 
  password: Uint8Array, 
  iterations: number,
  plaintextToVerify: Uint8Array
): Promise<boolean> => {
  const chunkSize = 16;
  const salt = bytes.slice(0, 32);
  const derivedKey = await derive416BytesUsingArgon2id(password, salt, iterations);
  let chacha20key = new Uint8Array(derivedKey.slice(0, 64));
  const blockCipherKey = derivedKey.slice(64, 96);
  const hmacKey = derivedKey.slice(96);

  const extractedIV = bytes.slice(32, 48);
  const decryptedIV = await decryptSerpent256ECB(extractedIV, blockCipherKey);
  let previousCiphertext = decryptedIV;

  const decryptedData: number[] = [];
  const dataLength = bytes.length;
  for (let i = 48; i < dataLength; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    const decryptedChunk = await decryptSerpent256ECB(chunk, blockCipherKey);
    const xorChunk = decryptedChunk.map((byte, index) => byte ^ previousCiphertext[index]);
    for (let j = 0; j < xorChunk.length; j++) {
      decryptedData.push(xorChunk[j]);
    }
    previousCiphertext = chunk;
  }

  const decryptedDataUint8Array = new Uint8Array(decryptedData);

  const chunkSizeForStreamCipher = 256 * 1024; // 256 KB chunks
  let streamCipherOffset = 0;
  const decryptedChunks = new Uint8Array(decryptedDataUint8Array);
  let decryptedOffset = 0;
  
  while (streamCipherOffset < decryptedDataUint8Array.length) {
    const input = Array.from(chacha20key).map(byte => byte.toString(16).padStart(2, '0')).join('');
    const sha512_output = await sha512(input);
    const sha512Array = hexStringToArray(sha512_output);
    const byteArray = new Uint8Array(sha512Array);
    const generatedHash = await whirlpool(byteArray);
    chacha20key = new Uint8Array(hexStringToArray(generatedHash));
  
    const chunk = decryptedDataUint8Array.slice(streamCipherOffset, Math.min(streamCipherOffset + chunkSizeForStreamCipher, decryptedDataUint8Array.length));
    const nonce = chacha20key.slice(32, 40);
    const chacha20 = new ChaCha20();
    const decryptedChunk = chacha20.decrypt(chacha20key.slice(0, 32), chunk, nonce);
    decryptedChunks.set(decryptedChunk, decryptedOffset);
    decryptedOffset += decryptedChunk.length;
  
    streamCipherOffset += chunk.length;
  }

  const computedTag = await computeTagForDataUsingHMACSHA512(hmacKey, plaintextToVerify);
  // ===== DEBUG: INTEGRITY CHECK SUMMARY =====
  //console.groupCollapsed('[DEBUG] Decryption & Integrity Check');

  // Inputs (hex strings)
  //console.log('Encrypted Input (hex):', Buffer.from(bytes).toString('hex'));
  //console.log('Password (hex):', Buffer.from(password).toString('hex'));
  //console.log('Iterations:', iterations);
  //console.log('Plaintext to Verify (hex):', Buffer.from(plaintextToVerify).toString('hex'));

  // Key Material
  //console.log('Salt (hex):', Buffer.from(salt).toString('hex'));
  //console.log('HMAC Key (hex):', Buffer.from(hmacKey).toString('hex'));
  //console.log('Block Cipher Key (hex):', Buffer.from(blockCipherKey).toString('hex'));

  // Decryption Outputs
  //console.log('Decrypted IV (hex):', Buffer.from(decryptedIV).toString('hex'));
  //console.log('Decrypted Data (hex):', Buffer.from(decryptedDataUint8Array).toString('hex'));
  //console.log('Final Decrypted Tag (hex):', Buffer.from(decryptedChunks).toString('hex'));

  // Verification
  //console.log('Computed Tag (from plaintext):', Buffer.from(computedTag).toString('hex'));
  //console.log('Match Result:', compareUint8Arrays(decryptedChunks, computedTag));

  //console.groupEnd();
  // ===== END DEBUG =====
  return compareUint8Arrays(decryptedChunks, computedTag);
};

export function compareUint8Arrays(array1: Uint8Array, array2: Uint8Array): boolean {
  // Check if the lengths are equal
  if (array1.length !== array2.length) {
    return false;
  }

  // Compare each element in the arrays
  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      return false; // Return false if any element is different
    }
  }

  return true; // Return true if all elements are equal
}

export const decryptStringWithTwoCiphersCBC = async (
    bytes: Uint8Array,
    derivedKey: Uint8Array,
  ): Promise<[Uint8Array, boolean]> => {
    const chunkSize = 16;
    let chacha20key = new Uint8Array(derivedKey.slice(0, 64));
    const blockCipherKey = derivedKey.slice(64, 96);
    const hmacKey = derivedKey.slice(96);
  
    const extractedIV = bytes.slice(0, 16);
    const decryptedIV = await decryptSerpent256ECB(extractedIV, blockCipherKey);
    let previousCiphertext = decryptedIV;
  
    const decryptedData: number[] = [];
    const dataLengthNoLC = bytes.length - chunkSize;
    for (let i = 16; i < dataLengthNoLC; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      const decryptedChunk = await decryptSerpent256ECB(chunk, blockCipherKey);
      const xorChunk = decryptedChunk.map((byte, index) => byte ^ previousCiphertext[index]);
      for (let j = 0; j < xorChunk.length; j++) {
        decryptedData.push(xorChunk[j]);
      }
      previousCiphertext = chunk;
    }
  
    // Handle padding in the last block
    const encryptedLastBlock = bytes.slice(bytes.length - chunkSize);
    const decryptedLastBlock = await decryptSerpent256ECB(encryptedLastBlock, blockCipherKey);
    const decryptedLastBlockXORed = decryptedLastBlock.map((byte, index) => byte ^ previousCiphertext[index]);
    const paddingLength = pkcs7PaddingConsumed(decryptedLastBlockXORed);
    if (paddingLength === 0) {
    } else if (paddingLength === 16) {
      // Do nothing
    } else {
      const unpaddedLastBlock = decryptedLastBlockXORed.slice(0, 16 - paddingLength);
      for (let j = 0; j < unpaddedLastBlock .length; j++) {
        decryptedData.push(unpaddedLastBlock[j]);
      }
    }
  
    const decryptedDataUint8Array = new Uint8Array(decryptedData);
  
    const chunkSizeForStreamCipher = 256 * 1024; // 256 KB chunks
    let streamCipherOffset = 0;
    const decryptedTag = new Uint8Array(64);
    const decryptedChunks = new Uint8Array(decryptedDataUint8Array.length - 64);
    let decryptedOffset = 0;
    
    let isFirstChunk = true;
    
    while (streamCipherOffset < decryptedDataUint8Array.length) {
      const input = Array.from(chacha20key).map(byte => byte.toString(16).padStart(2, '0')).join('');
      const sha512_output = await sha512(input);
      const sha512Array = hexStringToArray(sha512_output);
      const byteArray = new Uint8Array(sha512Array);
      const generatedHash = await whirlpool(byteArray);
      chacha20key = new Uint8Array(hexStringToArray(generatedHash));
    
      const chunk = decryptedDataUint8Array.slice(streamCipherOffset, Math.min(streamCipherOffset + chunkSizeForStreamCipher, decryptedDataUint8Array.length));
      const nonce = chacha20key.slice(32, 40);
      const chacha20 = new ChaCha20();
      const decryptedChunk = chacha20.decrypt(chacha20key.slice(0, 32), chunk, nonce);
    
      if (isFirstChunk) {
        decryptedTag.set(decryptedChunk.slice(0, 64));
        decryptedChunks.set(decryptedChunk.slice(64), 0);
        decryptedOffset = decryptedChunk.length - 64;
        isFirstChunk = false;
      } else {
        decryptedChunks.set(decryptedChunk, decryptedOffset);
        decryptedOffset += decryptedChunk.length;
      }
    
      streamCipherOffset += chunk.length;
    }
    
    const decryptedWithStreamCipher = decryptedChunks.slice(0, decryptedOffset);
    const newTag = await computeTagForDataUsingHMACSHA512(hmacKey, decryptedWithStreamCipher);
    let integrityPassed = true;
    for (let i = 0; i < 64; i++) {
      if (decryptedTag[i] !== newTag[i]) {
        integrityPassed = false;
        break;
      }
    }
    
    return [decryptedWithStreamCipher, integrityPassed];
};

export const CheckBackupIntegrity = async (
  bytes: Uint8Array, 
  derivedKey: Uint8Array, 
  plaintextToVerify: Uint8Array
): Promise<boolean> => {
  const chunkSize = 16;
  let chacha20key = new Uint8Array(derivedKey.slice(0, 64));
  const blockCipherKey = derivedKey.slice(64, 96);
  const hmacKey = derivedKey.slice(96);

  const extractedIV = bytes.slice(0, 16);
  const decryptedIV = await decryptSerpent256ECB(extractedIV, blockCipherKey);
  let previousCiphertext = decryptedIV;

  const decryptedData: number[] = [];
  const dataLength = bytes.length;
  for (let i = 16; i < dataLength; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    const decryptedChunk = await decryptSerpent256ECB(chunk, blockCipherKey);
    const xorChunk = decryptedChunk.map((byte, index) => byte ^ previousCiphertext[index]);
    for (let j = 0; j < xorChunk.length; j++) {
      decryptedData.push(xorChunk[j]);
    }
    previousCiphertext = chunk;
  }

  const decryptedDataUint8Array = new Uint8Array(decryptedData);

  const chunkSizeForStreamCipher = 256 * 1024; // 256 KB chunks
  let streamCipherOffset = 0;
  const decryptedChunks = new Uint8Array(decryptedDataUint8Array);
  let decryptedOffset = 0;
  
  while (streamCipherOffset < decryptedDataUint8Array.length) {
    const input = Array.from(chacha20key).map(byte => byte.toString(16).padStart(2, '0')).join('');
    const sha512_output = await sha512(input);
    const sha512Array = hexStringToArray(sha512_output);
    const byteArray = new Uint8Array(sha512Array);
    const generatedHash = await whirlpool(byteArray);
    chacha20key = new Uint8Array(hexStringToArray(generatedHash));
  
    const chunk = decryptedDataUint8Array.slice(streamCipherOffset, Math.min(streamCipherOffset + chunkSizeForStreamCipher, decryptedDataUint8Array.length));
    const nonce = chacha20key.slice(32, 40);
    const chacha20 = new ChaCha20();
    const decryptedChunk = chacha20.decrypt(chacha20key.slice(0, 32), chunk, nonce);
    decryptedChunks.set(decryptedChunk, decryptedOffset);
    decryptedOffset += decryptedChunk.length;
  
    streamCipherOffset += chunk.length;
  }

  const computedTag = await computeTagForDataUsingHMACSHA512(hmacKey, plaintextToVerify);
  //console.log('Decrypted Chunks:', decryptedChunks);
  //console.log('Computed Tag:', computedTag);

  return compareUint8Arrays(decryptedChunks, computedTag);
};