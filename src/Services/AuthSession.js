import {useSyncExternalStore} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Whether the user is currently logged in, kept on-device so the app can
// skip straight to MainTabs on relaunch instead of showing Splash/Login
// again every time. Mirrors the MembershipService.js pattern for
// consistency (see that file for why a plain module store instead of a
// context/library here).

const STORAGE_KEY = '@travelhub/auth_session';

let state = {
  loaded: false,
  isLoggedIn: false,
  mobileNumber: null,
};
const listeners = new Set();

function setState(next) {
  state = next;
  listeners.forEach(listener => listener());
}

const subscribe = listener => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => state;

// {loaded, isLoggedIn, mobileNumber} — `loaded` is false until the stored
// session has been read, so callers (App.jsx) can hold off picking an
// initial route until they actually know which one to pick.
export const useAuthSession = () => useSyncExternalStore(subscribe, getSnapshot);

export const isLoggedIn = () => state.isLoggedIn;

export async function loadAuthSession() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    setState({
      loaded: true,
      isLoggedIn: !!saved?.isLoggedIn,
      mobileNumber: saved?.mobileNumber ?? null,
    });
  } catch {
    setState({...state, loaded: true});
  }
}

// Call once OTP verification actually succeeds.
export async function login(mobileNumber) {
  const next = {loaded: true, isLoggedIn: true, mobileNumber};
  setState(next);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // best-effort persistence; the in-memory session still applies this run
  }
}

export async function logout() {
  setState({loaded: true, isLoggedIn: false, mobileNumber: null});
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // best-effort; state above already reflects the logout for this run
  }
}
