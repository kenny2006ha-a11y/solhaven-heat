import { WORLD, DAY, WANTED, POLICE, PLAYER, CAR } from './config.js';
import { buildCity, landmarkCenter } from './city.js';
import { spawnTrafficCar, spawnPoliceCar, spawnPed, spawnPickup, updateTraffic, updatePolice, updatePeds, updateGunmen, updateBullets, updateParticles } from './entities.js';
import { updatePlayer } from './player.js';
import { createMissions, updateMissions } from './missions.js';

export function createWorld(random) {
  const city = buildCity(random);
  let sh = { x: WORLD.width / 2, y: WORLD.height / 2 };
  try {
    const found = landmarkCenter('safehouse', city) || landmarkCenter('safehouse');
    if (found) sh = found;
  } catch (e) {}

  const state = {
    time: 0,
    dayTime: 0,
    wanted: 0,
    wantedTimer: 0,
    cash: 0,
    city,
    player: {
      x: sh.x,
      y: sh.y,
      angle: 0,
      hp: PLAYER.hp || 100,
      armor: PLAYER.armor || 50,
      ammo: PLAYER.ammo || 60,
      cash: 0,
      inCar: null
    },
    cars: [],
    peds: [],
    gunmen: [],
    bullets: [],
    particles: [],
    pickups: [],
    missions: createMissions(),
    camera: { x: sh.x, y: sh.y },
    events: [],
    wasted: false,
    busted: false,
    vaultHolding: false
  };

  for (let i = 0; i < 8; i++) {
    spawnTrafficCar(state, sh.x + (Math.random() - 0.5) * 400, sh.y + (Math.random() - 0.5) * 400);
  }
  for (let i = 0; i < 5; i++) {
    const car = spawnTrafficCar(state, sh.x + (Math.random() - 0.5) * 300, sh.y + (Math.random() - 0.5) * 300);
    car.speed = 0;
    car.parked = true;
  }
  for (let i = 0; i < 14; i++) {
    spawnPed(state, sh.x + (Math.random() - 0.5) * 300, sh.y + (Math.random() - 0.5) * 300);
  }
  const pickupKinds = ['hp', 'hp', 'armor', 'ammo'];
  for (let i = 0; i < 4; i++) {
    spawnPickup(state, sh.x + (Math.random() - 0.5) * 200, sh.y + (Math.random() - 0.5) * 200, pickupKinds[i]);
  }

  return state;
}

export function updateWorld(state, input, dt) {
  state.time += dt;
  const cycle = DAY && DAY.cycle ? DAY.cycle : 600;
  state.dayTime = (state.dayTime + dt) % cycle;

  let crimeOccurred = false;
  if (state.events && state.events.length > 0) {
    for (const ev of state.events) {
      if (ev === 'steal' || ev === 'shoot' || (ev && (ev.type === 'steal' || ev.type === 'shoot' || ev.action === 'steal' || ev.action === 'shoot'))) {
        crimeOccurred = true;
      }
    }
  }

  if (crimeOccurred) {
    state.wantedTimer = 0;
  } else {
    state.wantedTimer += dt;
    const decayTime = WANTED && WANTED.decay ? WANTED.decay : 15;
    if (state.wanted > 0 && state.wantedTimer >= decayTime) {
      state.wanted = Math.max(0, state.wanted - 1);
      state.wantedTimer = 0;
    }
  }

  updatePlayer(state, input, dt);
  updateTraffic(state, dt);
  updatePolice(state, dt);
  updatePeds(state, dt);
  updateGunmen(state, dt);
  updateBullets(state, dt);
  updateParticles(state, dt);
  updateMissions(state, dt);

  if (state.player.hp <= 0) {
    state.wasted = true;
  }

  if (!state.player.inCar && state.wanted > 0) {
    const arrestDist = POLICE && POLICE.arrest ? POLICE.arrest : 45;
    const checkEntity = (e) => {
      if (e && (e.isPolice || e.type === 'police')) {
        const dx = e.x - state.player.x;
        const dy = e.y - state.player.y;
        if (dx * dx + dy * dy < arrestDist * arrestDist) {
          state.busted = true;
        }
      }
    };
    if (state.cars) state.cars.forEach(checkEntity);
    if (state.gunmen) state.gunmen.forEach(checkEntity);
  }

  const wWidth = WORLD && WORLD.width ? WORLD.width : 8000;
  const wHeight = WORLD && WORLD.height ? WORLD.height : 8000;
  state.camera.x = Math.max(0, Math.min(wWidth, state.player.x));
  state.camera.y = Math.max(0, Math.min(wHeight, state.player.y));
}
