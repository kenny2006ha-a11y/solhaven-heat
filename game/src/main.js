import { createRandom } from './random.js';
import { createWorld, updateWorld } from './world.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE, ACTION_SAVE, ACTION_CONTINUE } from './input.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_WASTED, SCREEN_BUSTED } from './render.js';
import { createAudio } from './audio.js';
import { saveGame, loadGame } from './save.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const renderer = createRenderer(canvas);
const input = createInput(canvas);
const audio = createAudio();

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = params.get('seed');
const seed = seedParam !== null ? parseInt(seedParam, 10) || Math.floor(Math.random() * 1000000) : Math.floor(Math.random() * 1000000);

let state = createWorld(createRandom(seed));
let screen = SCREEN_TITLE;
let hasSave = loadGame() !== null;
let audioResumed = false;

function checkAction(actions, flag) {
  if (!actions) return false;
  if (Array.isArray(actions)) return actions.includes(flag);
  if (actions instanceof Set) return actions.has(flag);
  return Boolean(actions[flag]);
}

if (shot) {
  const staged = stageShot(shot, state);
  state = staged.state;
  screen = staged.screen;
  renderer.draw(state, screen, hasSave);
  renderer.draw(state, screen, hasSave);
  window.__shotReady = true;
} else {
  let lastTime = performance.now();
  let accumulator = 0;
  const STEP = 1 / 60;

  function loop(currentTime) {
    let frameTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    if (frameTime > 0.25) frameTime = 0.25;
    accumulator += frameTime;

    while (accumulator >= STEP) {
      const actions = input.takeActions();
      const hasConfirm = checkAction(actions, ACTION_CONFIRM);
      const hasPause = checkAction(actions, ACTION_PAUSE);
      const hasSaveAction = checkAction(actions, ACTION_SAVE);
      const hasContinue = checkAction(actions, ACTION_CONTINUE);

      if (hasConfirm && !audioResumed) {
        audio.resume();
        audioResumed = true;
      }

      if (screen === SCREEN_TITLE) {
        if (hasConfirm) {
          state = createWorld(createRandom(Date.now()));
          screen = SCREEN_PLAY;
          hasSave = loadGame() !== null;
        } else if (hasContinue && hasSave) {
          const saved = loadGame();
          if (saved) {
            if (saved.x !== undefined) state.player.x = saved.x;
            if (saved.y !== undefined) state.player.y = saved.y;
            if (saved.hp !== undefined) state.player.hp = saved.hp;
            if (saved.ammo !== undefined) state.player.ammo = saved.ammo;
            if (saved.cash !== undefined) state.player.cash = saved.cash;
            if (saved.mission !== undefined && state.missions) {
              state.missions.current = saved.mission;
            }
          }
          screen = SCREEN_PLAY;
        }
      } else if (screen === SCREEN_PLAY) {
        if (hasPause) {
          screen = SCREEN_PAUSED;
        } else if (hasSaveAction) {
          saveGame(state);
          hasSave = loadGame() !== null;
        }
        updateWorld(state, input, STEP);
        if (state.wasted) {
          screen = SCREEN_WASTED;
        } else if (state.busted) {
          screen = SCREEN_BUSTED;
        }
      } else if (screen === SCREEN_PAUSED) {
        if (hasPause || hasConfirm) {
          screen = SCREEN_PLAY;
        }
      } else if (screen === SCREEN_WASTED || screen === SCREEN_BUSTED) {
        if (hasConfirm) {
          state.player.hp = 100;
          state.player.cash = Math.max(0, (state.player.cash || 0) - 100);
          if (state.player.wanted !== undefined) state.player.wanted = 0;
          if (state.wasted !== undefined) state.wasted = false;
          if (state.busted !== undefined) state.busted = false;
          const landmark = (screen === SCREEN_WASTED && state.city?.hospitals?.[0]) ||
                           (screen === SCREEN_BUSTED && state.city?.police?.[0]) ||
                           state.city?.hospital || state.city?.policeStation;
          if (landmark) {
            state.player.x = landmark.x ?? state.player.x;
            state.player.y = landmark.y ?? state.player.y;
          }
          screen = SCREEN_PLAY;
        }
      }

      accumulator -= STEP;
    }

    renderer.draw(state, screen, hasSave);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame((time) => {
    lastTime = time;
    renderer.draw(state, screen, hasSave);
    requestAnimationFrame(loop);
  });
}
