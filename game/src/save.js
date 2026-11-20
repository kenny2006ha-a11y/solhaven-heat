import { SAVE_KEY } from './config.js';

export function saveGame(state) {
  try {
    const data = {
      player: {
        x: state?.player?.x ?? 0,
        y: state?.player?.y ?? 0,
        hp: state?.player?.hp ?? 0,
        armor: state?.player?.armor ?? 0,
        ammo: state?.player?.ammo ?? 0,
        cash: state?.player?.cash ?? 0
      },
      missions: {
        current: state?.missions?.current ?? null
      },
      wanted: state?.wanted ?? 0,
      time: state?.time ?? 0,
      carId: state?.carId ?? state?.player?.carId ?? null
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (_) {}
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}
