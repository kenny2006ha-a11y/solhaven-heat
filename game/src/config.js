export const FIELD = { width: 1280, height: 720 };

export const STEP = 1 / 60;

export const WORLD = { width: 1600, height: 1340 };

export const CITY = { cols: 6, rows: 5, block: 220, road: 48 };

export const PLAYER = { walk: 170, run: 280, radius: 12, maxHp: 100, maxArmor: 100 };

export const CAR = {
  accel: 420,
  maxSpeed: 520,
  turn: 2.6,
  radius: 16,
  colors: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#ffffff']
};

export const POLICE = { chase: 480, arrest: 26 };

export const WANTED = { max: 5, decay: 26 };

export const MISSIONS = [
  { id: 'steal-car', name: 'Steal Car', reward: 150 },
  { id: 'pier-run', name: 'Pier Run', reward: 250 },
  { id: 'hot-pursuit', name: 'Hot Pursuit', reward: 350 },
  { id: 'gang-war', name: 'Gang War', reward: 450 },
  { id: 'bank-score', name: 'Bank Score', reward: 800 }
];

export const DAY = { cycle: 240, startHour: 9 };

export const SAVE_KEY = 'solhaven-heat.save.v1';

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const PALETTE = {
  road: '#34495e',
  sidewalk: '#7f8c8d',
  grass: '#27ae60',
  sand: '#f39c12',
  water: '#2980b9',
  building: '#2c3e50',
  player: '#e74c3c',
  police: '#2980b9',
  gang: '#8e44ad'
};
