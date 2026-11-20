import { CAR, POLICE, WORLD, CITY } from './config.js';
import { isOnRoad, collidesBuilding } from './city.js';

let nextCarId = 1;

export function spawnTrafficCar(state, x, y) {
  if (!state.cars) state.cars = [];
  const road = state.city && state.city.roads && state.city.roads.length > 0
    ? state.city.roads[Math.floor(Math.random() * state.city.roads.length)]
    : { x: WORLD.width / 2, y: WORLD.height / 2, w: 50, h: 50, horizontal: true };
  
  const cx = x ?? (road.horizontal ? road.x + Math.random() * road.w : road.x + road.w / 2);
  const cy = y ?? (road.horizontal ? road.y + road.h / 2 : road.y + Math.random() * road.h);
  const angle = road.horizontal ? (Math.random() < 0.5 ? 0 : Math.PI) : (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);

  const car = {
    id: nextCarId++,
    x: cx,
    y: cy,
    angle,
    speed: 100 + Math.random() * 150,
    color: CAR.colors[Math.floor(Math.random() * CAR.colors.length)],
    kind: 'traffic',
    driver: 'traffic'
  };
  state.cars.push(car);
  return car;
}

export function spawnPoliceCar(state, x, y) {
  if (!state.cars) state.cars = [];
  const car = {
    id: nextCarId++,
    x: x ?? WORLD.width / 2,
    y: y ?? WORLD.height / 2,
    angle: 0,
    speed: 180,
    color: '#2980b9',
    kind: 'police',
    driver: 'traffic'
  };
  state.cars.push(car);
  return car;
}

export function spawnPed(state, x, y) {
  if (!state.peds) state.peds = [];
  const ped = {
    x: x ?? Math.random() * WORLD.width,
    y: y ?? Math.random() * WORLD.height,
    angle: Math.random() * Math.PI * 2,
    speed: 25 + Math.random() * 25
  };
  state.peds.push(ped);
  return ped;
}

export function spawnGunman(state, x, y) {
  if (!state.gunmen) state.gunmen = [];
  const gunman = {
    x: x ?? Math.random() * WORLD.width,
    y: y ?? Math.random() * WORLD.height,
    hp: 50,
    shootTimer: 0,
    angle: 0
  };
  state.gunmen.push(gunman);
  return gunman;
}

export function spawnPickup(state, x, y, kind = 'cash') {
  if (!state.pickups) state.pickups = [];
  const amount = kind === 'cash' ? 100 + Math.floor(Math.random() * 200) : kind === 'ammo' ? 30 : 25;
  const pickup = { x, y, kind, amount };
  state.pickups.push(pickup);
  return pickup;
}

export function addParticle(state, x, y, opts = {}) {
  if (!state.particles) state.particles = [];
  const particle = {
    x,
    y,
    vx: opts.vx ?? (Math.random() - 0.5) * 80,
    vy: opts.vy ?? (Math.random() - 0.5) * 80,
    life: 0,
    maxLife: opts.maxLife ?? 0.4,
    color: opts.color ?? '#f39c12',
    size: opts.size ?? 3
  };
  state.particles.push(particle);
  return particle;
}

export function updateTraffic(state, dt) {
  if (!state.cars) return;
  for (const car of state.cars) {
    if (car.driver === 'player') continue;
    if (car.kind === 'parked') continue;

    const nx = car.x + Math.cos(car.angle) * car.speed * dt;
    const ny = car.y + Math.sin(car.angle) * car.speed * dt;

    if (collidesBuilding(state.city, nx, ny, CAR.radius) || nx < 0 || nx > WORLD.width || ny < 0 || ny > WORLD.height) {
      car.angle += Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    } else {
      car.x = nx;
      car.y = ny;
      if (Math.random() < 0.02) {
        car.angle += (Math.random() < 0.5 ? 1 : -1) * (Math.PI / 2);
      }
    }
  }
}

export function updatePolice(state, dt) {
  if (!state.cars) state.cars = [];
  const wanted = state.wanted || 0;
  const maxPolice = wanted > 0 ? Math.min(5, wanted + 1) : 0;
  
  const policeCars = state.cars.filter(c => c.kind === 'police');
  
  if (wanted > 0 && policeCars.length < maxPolice) {
    const edge = Math.floor(Math.random() * 4);
    let px = WORLD.width / 2, py = WORLD.height / 2;
    if (edge === 0) { px = 50; py = Math.random() * WORLD.height; }
    else if (edge === 1) { px = WORLD.width - 50; py = Math.random() * WORLD.height; }
    else if (edge === 2) { px = Math.random() * WORLD.width; py = 50; }
    else { px = Math.random() * WORLD.width; py = WORLD.height - 50; }
    spawnPoliceCar(state, px, py);
  } else if (wanted === 0 && policeCars.length > 0) {
    state.cars = state.cars.filter(c => c.kind !== 'police');
  }

  for (const car of state.cars) {
    if (car.kind !== 'police') continue;
    const dx = state.player.x - car.x;
    const dy = state.player.y - car.y;
    const targetAngle = Math.atan2(dy, dx);
    
    let angleDiff = targetAngle - car.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    car.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), CAR.turn * dt);

    car.speed = Math.min(POLICE.chase, car.speed + CAR.accel * dt);
    
    const nx = car.x + Math.cos(car.angle) * car.speed * dt;
    const ny = car.y + Math.sin(car.angle) * car.speed * dt;
    if (!collidesBuilding(state.city, nx, ny, CAR.radius)) {
      car.x = nx;
      car.y = ny;
    } else {
      car.angle += Math.PI / 2;
    }
  }
}

export function updatePeds(state, dt) {
  if (!state.peds) return;
  for (const ped of state.peds) {
    ped.x += Math.cos(ped.angle) * ped.speed * dt;
    ped.y += Math.sin(ped.angle) * ped.speed * dt;

    if (collidesBuilding(state.city, ped.x, ped.y, 8) || ped.x < 0 || ped.x > WORLD.width || ped.y < 0 || ped.y > WORLD.height) {
      ped.angle += Math.PI;
    } else if (Math.random() < 0.03) {
      ped.angle += (Math.random() - 0.5) * Math.PI;
    }

    const dx = state.player.x - ped.x;
    const dy = state.player.y - ped.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < 100 * 100) {
      ped.angle = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 0.5;
      ped.speed = 60;
    } else {
      ped.speed = 30;
    }
  }
}

export function updateGunmen(state, dt) {
  if (!state.gunmen) return;
  const survivingGunmen = [];
  for (const gunman of state.gunmen) {
    if (gunman.hp <= 0) {
      spawnPickup(state, gunman.x, gunman.y, 'cash');
      addParticle(state, gunman.x, gunman.y, { color: '#e74c3c', size: 5, maxLife: 0.6 });
      continue;
    }
    survivingGunmen.push(gunman);

    const dx = state.player.x - gunman.x;
    const dy = state.player.y - gunman.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    gunman.angle = Math.atan2(dy, dx);

    if (dist <= 420) {
      gunman.shootTimer += dt;
      if (gunman.shootTimer >= 1.2) {
        gunman.shootTimer = 0;
        if (!state.bullets) state.bullets = [];
        state.bullets.push({
          x: gunman.x,
          y: gunman.y,
          vx: Math.cos(gunman.angle) * 350,
          vy: Math.sin(gunman.angle) * 350,
          from: 'gunman',
          damage: 15,
          life: 3
        });
      }
    }
  }
  state.gunmen = survivingGunmen;
}

export function updateBullets(state, dt) {
  if (!state.bullets) return;
  const alive = [];
  for (const b of state.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;

    if (b.life <= 0 || collidesBuilding(state.city, b.x, b.y, 4)) {
      addParticle(state, b.x, b.y, { color: '#f1c40f', size: 2, maxLife: 0.2 });
      continue;
    }

    let hit = false;
    if (b.from === 'player') {
      if (state.gunmen) {
        for (const g of state.gunmen) {
          const dx = g.x - b.x;
          const dy = g.y - b.y;
          if (dx * dx + dy * dy < 16 * 16) {
            g.hp -= b.damage;
            hit = true;
            addParticle(state, b.x, b.y, { color: '#e74c3c', size: 3, maxLife: 0.3 });
            break;
          }
        }
      }
    } else if (b.from === 'gunman') {
      const dx = state.player.x - b.x;
      const dy = state.player.y - b.y;
      if (dx * dx + dy * dy < 14 * 14) {
        if (state.player.armor > 0) {
          state.player.armor = Math.max(0, state.player.armor - b.damage);
        } else {
          state.player.hp = Math.max(0, state.player.hp - b.damage);
        }
        hit = true;
        addParticle(state, b.x, b.y, { color: '#e74c3c', size: 3, maxLife: 0.3 });
      }
    }

    if (!hit) {
      alive.push(b);
    }
  }
  state.bullets = alive;
}

export function updateParticles(state, dt) {
  if (!state.particles) return;
  const alive = [];
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life += dt;
    if (p.life < p.maxLife) {
      alive.push(p);
    }
  }
  state.particles = alive;
}
