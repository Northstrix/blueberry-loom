"use client";
import { useCallback } from "react";
import { sha512, whirlpool } from "hash-wasm";

/**
 * XOR two Uint8Arrays, up to the length of the longer one,
 * padding missing bytes with 0.
 */
function xorArraysFlexible(a: Uint8Array, b: Uint8Array): Uint8Array {
  const maxLen = Math.max(a.length, b.length);
  const result = new Uint8Array(maxLen);
  for (let i = 0; i < maxLen; i++) {
    result[i] = (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return result;
}

/**
 * Hash Uint8Array with hash-wasm and return Uint8Array.
 */
async function hashUint8Array(
  hashFunc: (input: Uint8Array | string) => Promise<string>,
  input: Uint8Array
): Promise<Uint8Array> {
  const hashHex = await hashFunc(input);
  return new Uint8Array(
    hashHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
}

/**
 * Fold a Uint8Array by XORing first half with second half, repeated twice.
 */
function foldUint8Array(input: Uint8Array): Uint8Array {
  let arr = input;
  for (let round = 0; round < 2; round++) {
    const half = Math.floor(arr.length / 2);
    const folded = new Uint8Array(half);
    for (let i = 0; i < half; i++) {
      folded[i] = arr[i] ^ arr[i + half];
    }
    arr = folded;
  }
  return arr;
}

/**
 * Generate N random Uint8Arrays (length between 100 and 200 bytes),
 * XOR them all together using secure randomness.
 */
function generateAndXorRandoms(n: number): { result: Uint8Array; all: Uint8Array[] } {
  let xored: Uint8Array | null = null;
  const all: Uint8Array[] = [];
  for (let i = 0; i < n; i++) {
    const len = 100 + window.crypto.getRandomValues(new Uint8Array(1))[0] % 101;
    const arr = new Uint8Array(len);
    window.crypto.getRandomValues(arr);
    all.push(arr);
    if (xored === null) {
      xored = arr;
    } else {
      xored = xorArraysFlexible(xored, arr);
    }
  }
  return { result: xored!, all };
}

/**
 * Hook to generate a 64-byte random Uint8Array using masterKey and system entropy.
 * Uses only cryptographically secure randomness.
 * Randomizes hash function selection for each call.
 */
export function useGenerateRandomFormKey() {
  return useCallback(
    async (masterKey: Uint8Array): Promise<Uint8Array> => {
      // 1. Fold master key
      const foldedKey = foldUint8Array(masterKey);

      // 2. XOR foldedKey with 5 random arrays (first group)
      const { result: randomXorA, all: randomsA } = generateAndXorRandoms(5);
      const xoredA = xorArraysFlexible(foldedKey, randomXorA);

      // 3. XOR another 5 random arrays (second group)
      const { result: randomXorB, all: randomsB } = generateAndXorRandoms(5);

      // 4. Randomly select hash function order using window.crypto
      const randomByte = new Uint8Array(1);
      window.crypto.getRandomValues(randomByte);
      const useCase1 = (randomByte[0] & 1) === 0;

      let hashA, hashB;
      if (useCase1) {
        hashA = await hashUint8Array(sha512, xoredA);
        hashB = await hashUint8Array(whirlpool, randomXorB);
      } else {
        hashA = await hashUint8Array(whirlpool, xoredA);
        hashB = await hashUint8Array(sha512, randomXorB);
      }

      // 5. XOR the two hashes (length = longer hash)
      const xoredHashes = xorArraysFlexible(hashA, hashB);

      // 6. Generate a new random array (same length as xoredHashes) and XOR it
      const finalRandom = new Uint8Array(xoredHashes.length);
      window.crypto.getRandomValues(finalRandom);
      const finalXor = xorArraysFlexible(xoredHashes, finalRandom);

      // 7. Return first 64 bytes
      const output = finalXor.slice(0, 64);

      return output;
    },
    []
  );
}
