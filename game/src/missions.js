import { MISSIONS } from './config.js';
import { landmarkCenter } from './city.js';

export function createMissions() {
  return {
    current: 0,
    stage: 0,
    timer: 0,
    target: null,
    vaultProgress: 0,
    done: false
  };
}

export function missionTarget(state) {
  return state.missions?.target || null;
}

export function updateMissions(state, dt) {
  if (!state.missions) {
    state.missions = createMissions();
  }
  const missions = state.missions;
  if (missions.done) {
    missions.target = null;
    return;
  }

  if (!state.player) return;
  if (!state.events) state.events = [];

  const player = state.player;
  const city = state.city;

  switch (missions.current) {
    case 0: {
      if (missions.stage === 0) {
        missions.target = null;
        if (player.inCar || (state.cars && state.cars.some(c => c.driver === 'player'))) {
          missions.stage = 1;
        }
      } else if (missions.stage === 1) {
        const garage = landmarkCenter(city, 'garage');
        missions.target = { x: garage.x, y: garage.y, label: 'Garage' };
        if (Math.hypot(player.x - garage.x, player.y - garage.y) < 70) {
          player.cash = (player.cash || 0) + 150;
          state.events.push('mission-complete');
          missions.current = 1;
          missions.stage = 0;
          missions.timer = 0;
        }
      }
      break;
    }
    case 1: {
      if (missions.stage === 0) {
        const pier = landmarkCenter(city, 'pier');
        missions.target = { x: pier.x, y: pier.y, label: 'Pier' };
        if (Math.hypot(player.x - pier.x, player.y - pier.y) < 70) {
          missions.stage = 1;
          missions.timer = 90;
        }
      } else if (missions.stage === 1) {
        const safehouse = landmarkCenter(city, 'safehouse');
        missions.target = { x: safehouse.x, y: safehouse.y, label: 'Safehouse' };
        missions.timer = Math.max(0, missions.timer - dt);
        if (missions.timer <= 0) {
          missions.stage = 0;
        } else if (Math.hypot(player.x - safehouse.x, player.y - safehouse.y) < 70) {
          player.cash = (player.cash || 0) + 250;
          state.events.push('mission-complete');
          missions.current = 2;
          missions.stage = 0;
          missions.timer = 0;
        }
      }
      break;
    }
    case 2: {
      if (missions.stage === 0) {
        missions.target = null;
        state.wanted = Math.max(state.wanted || 0, 3);
        if ((state.wanted || 0) <= 0) {
          missions.stage = 1;
        }
      } else if (missions.stage === 1) {
        const safehouse = landmarkCenter(city, 'safehouse');
        missions.target = { x: safehouse.x, y: safehouse.y, label: 'Safehouse' };
        if (Math.hypot(player.x - safehouse.x, player.y - safehouse.y) < 70) {
          player.cash = (player.cash || 0) + 350;
          state.events.push('mission-complete');
          missions.current = 3;
          missions.stage = 0;
        }
      }
      break;
    }
    case 3: {
      const bank = landmarkCenter(city, 'bank');
      missions.target = { x: bank.x, y: bank.y, label: 'Bank' };
      if (!missions.spawnedGunmen) {
        missions.spawnedGunmen = true;
        if (!state.gunmen) state.gunmen = [];
        for (let i = 0; i < 4; i++) {
          state.gunmen.push({
            x: bank.x + (Math.random() - 0.5) * 120,
            y: bank.y + (Math.random() - 0.5) * 120,
            hp: 50,
            shootTimer: 0,
            angle: 0
          });
        }
      }
      const activeGunmen = state.gunmen ? state.gunmen.filter(g => g.hp > 0) : [];
      if (missions.spawnedGunmen && activeGunmen.length === 0) {
        player.cash = (player.cash || 0) + 450;
        state.events.push('mission-complete');
        missions.current = 4;
        missions.stage = 0;
        missions.spawnedGunmen = false;
      }
      break;
    }
    case 4: {
      const bank = landmarkCenter(city, 'bank');
      if (missions.stage === 0) {
        missions.target = { x: bank.x, y: bank.y, label: 'Bank' };
        const atBank = Math.hypot(player.x - bank.x, player.y - bank.y) < 80;
        const isHolding = state.vaultHolding === true || (state.vaultHolding === undefined && atBank);
        if (atBank && isHolding) {
          missions.vaultProgress = (missions.vaultProgress || 0) + dt;
        }
        if (missions.vaultProgress >= 3) {
          state.wanted = 4;
          missions.stage = 1;
        }
      } else if (missions.stage === 1) {
        const safehouse = landmarkCenter(city, 'safehouse');
        missions.target = { x: safehouse.x, y: safehouse.y, label: 'Safehouse' };
        if (Math.hypot(player.x - safehouse.x, player.y - safehouse.y) < 70) {
          player.cash = (player.cash || 0) + 800;
          state.events.push('mission-complete');
          missions.done = true;
          missions.target = null;
        }
      }
      break;
    }
  }
}
