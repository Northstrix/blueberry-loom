import { create } from "zustand";

type State = {
  masterKey: Uint8Array;
  iterations: number;
  isLoggedIn: boolean;
};

type Actions = {
  setMasterKey: (key: Uint8Array) => void;
  setIterations: (count: number) => void;
  setIsLoggedIn: (status: boolean) => void;
  setLoginData: (masterKey: Uint8Array, iterations: number) => void; // Reduced arguments
};

const useStore = create<State & Actions>((set) => ({
  masterKey: new Uint8Array(272),
  iterations: 0,
  isLoggedIn: false,

  setMasterKey: (key: Uint8Array) => set({ masterKey: key }),
  setIterations: (count: number) => set({ iterations: count }),
  setIsLoggedIn: (status: boolean) => set({ isLoggedIn: status }),

  // Combined structure with reduced arguments
  setLoginData: (masterKey: Uint8Array, iterations: number) =>
    set({
      masterKey,
      iterations,
      isLoggedIn: true,
    }),
}));

export default useStore;
