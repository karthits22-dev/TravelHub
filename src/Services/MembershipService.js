import {useSyncExternalStore} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Whether this user has an active AMC membership — the switch that
// unlocks every members-only feature (see MembersOnly.jsx).
//
// There's no membership endpoint yet, so the status is kept on-device in
// AsyncStorage. Once the backend returns it (e.g. in the verifyOtp
// response), call setMembership() with the server's value instead of
// relying on the local copy.

const STORAGE_KEY = '@travelhub/amc_membership';

let state = {
  loaded: false,
  active: false,
  activatedAt: null,
  renewsOn: null,
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

// {loaded, active, activatedAt, renewsOn} — `loaded` is false until the
// stored status has been read, so callers can avoid flashing a locked
// screen at a member on app start.
export const useMembership = () => useSyncExternalStore(subscribe, getSnapshot);

export const isMemberActive = () => state.active;

// A membership lapses once its renewal date has passed.
const isStillValid = renewsOn => !!renewsOn && new Date(renewsOn) > new Date();

export async function loadMembership() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    setState({
      loaded: true,
      active: !!saved?.active && isStillValid(saved.renewsOn),
      activatedAt: saved?.activatedAt ? new Date(saved.activatedAt) : null,
      renewsOn: saved?.renewsOn ? new Date(saved.renewsOn) : null,
    });
  } catch {
    setState({...state, loaded: true});
  }
}

async function persist(next) {
  setState(next);
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        active: next.active,
        activatedAt: next.activatedAt?.toISOString() ?? null,
        renewsOn: next.renewsOn?.toISOString() ?? null,
      }),
    );
  } catch {
    // best-effort persistence; the in-memory status still applies this session
  }
}

export function activateMembership() {
  const activatedAt = new Date();
  const renewsOn = new Date(activatedAt);
  renewsOn.setFullYear(renewsOn.getFullYear() + 1);
  return persist({loaded: true, active: true, activatedAt, renewsOn});
}

// For syncing with a server value later, and for testing the locked flow.
export function setMembership({active, activatedAt = null, renewsOn = null}) {
  return persist({loaded: true, active, activatedAt, renewsOn});
}
