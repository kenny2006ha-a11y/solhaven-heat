import { SCREEN_TITLE, SCREEN_PLAY } from './render.js';
import { spawnTrafficCar, spawnPed } from './entities.js';
import { DAY } from './config.js';

export function stageShot(name, world) {
  if (name === 'start') {
    world.dayTime = DAY.cycle * 0.25;
    return { state: world, screen: SCREEN_TITLE };
  }
  if (name === 'play') {
    world.dayTime = DAY.cycle * 0.3;
    const car = spawnTrafficCar(world);
    if (car) {
      world.player.x = car.x;
      world.player.y = car.y;
      world.player.inCar = car;
      car.driver = 'player';
    }
    for (let i = 0; i < 3; i++) spawnTrafficCar(world);
    for (let i = 0; i < 4; i++) spawnPed(world);
    return { state: world, screen: SCREEN_PLAY };
  }
  if (name === 'mission') {
    world.dayTime = DAY.cycle * 0.85;
    world.wanted = 4;
    const bank = world.city?.landmarks?.find(l => l.type === 'bank') || { x: (world.city?.width || 2000) * 0.5, y: (world.city?.height || 2000) * 0.5 };
    world.player.x = bank.x;
    world.player.y = bank.y;
    const car = spawnTrafficCar(world);
    if (car) {
      car.x = bank.x;
      car.y = bank.y;
      world.player.inCar = car;
      car.driver = 'player';
    }
    for (let i = 0; i < 2; i++) {
      const cop = spawnTrafficCar(world);
      if (cop) {
        cop.isPolice = true;
        cop.x = bank.x + (i === 0 ? 40 : -40);
        cop.y = bank.y + 20;
      }
    }
    return { state: world, screen: SCREEN_PLAY };
  }
  if (name === 'skyline') {
    world.dayTime = DAY.cycle * 0.5;
    if (world.camera && world.city) {
      world.camera.x = world.city.width / 2;
      world.camera.y = world.city.height / 2;
    }
    return { state: world, screen: SCREEN_PLAY };
  }
  return { state: world, screen: SCREEN_TITLE };
}
