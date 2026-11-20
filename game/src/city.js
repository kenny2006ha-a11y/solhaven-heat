import { CITY, WORLD, PALETTE, CAR } from './config.js';

export function buildCity(random) {
  const roads = [];
  const blocks = [];
  const buildings = [];
  const landmarks = [];

  const cols = CITY.cols;
  const rows = CITY.rows;
  const roadW = CITY.road;
  const ox = 40;
  const oy = 40;
  const cityWidth = 1380;
  const cityHeight = 1260;

  const totalRoadW = (cols + 1) * roadW;
  const totalRoadH = (rows + 1) * roadW;
  const blockW = (cityWidth - totalRoadW) / cols;
  const blockH = (cityHeight - totalRoadH) / rows;

  // Horizontal roads
  for (let r = 0; r <= rows; r++) {
    roads.push({
      x: ox,
      y: oy + r * (blockH + roadW),
      w: cols * blockW + totalRoadW,
      h: roadW,
      horizontal: true
    });
  }

  // Vertical roads
  for (let c = 0; c <= cols; c++) {
    roads.push({
      x: ox + c * (blockW + roadW),
      y: oy,
      w: roadW,
      h: rows * blockH + totalRoadH,
      horizontal: false
    });
  }

  // Blocks and buildings
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = ox + c * (blockW + roadW) + roadW;
      const by = oy + r * (blockH + roadW) + roadW;
      const blockRect = { x: bx, y: by, w: blockW, h: blockH, col: c, row: r };
      blocks.push(blockRect);

      // Buildings inside block with margin
      const margin = 16;
      const numBldgs = random() < 0.5 ? 1 : 2;
      if (numBldgs === 1) {
        const color = CAR.colors[Math.floor(random() * CAR.colors.length)];
        const bX = bx + margin;
        const bY = by + margin;
        const bW = blockW - margin * 2;
        const bH = blockH - margin * 2;
        buildings.push({ x: bX, y: bY, w: bW, h: bH, color });
      } else {
        const halfW = (blockW - margin * 3) / 2;
        const color1 = CAR.colors[Math.floor(random() * CAR.colors.length)];
        const color2 = CAR.colors[Math.floor(random() * CAR.colors.length)];
        buildings.push({ x: bx + margin, y: by + margin, w: halfW, h: blockH - margin * 2, color: color1 });
        buildings.push({ x: bx + margin * 2 + halfW, y: by + margin, w: halfW, h: blockH - margin * 2, color: color2 });
      }
    }
  }

  // Beach and Water along east edge
  const beachX = 1420;
  const beachW = 90;
  const waterX = 1510;
  const waterW = 90;

  const beach = { x: beachX, y: 0, w: beachW, h: WORLD.height, kind: 'beach' };
  const water = { x: waterX, y: 0, w: waterW, h: WORLD.height, kind: 'water' };

  // Helper to get block rect by col, row
  const getBlock = (c, r) => blocks.find(b => b.col === c && b.row === r) || blocks[0];

  const hospitalBlock = getBlock(0, rows - 1);
  const policeBlock = getBlock(Math.floor(cols / 2), Math.floor(rows / 2));
  const bankBlock = getBlock(Math.floor(cols / 2), 0);
  const pierBlock = getBlock(cols - 1, Math.floor(rows / 2));
  const garageBlock = getBlock(0, Math.floor(rows / 2));
  const safehouseBlock = getBlock(Math.floor(cols / 2), rows - 1);
  const parkBlock = getBlock(1, 1);

  landmarks.push(
    { id: 'hospital', name: 'Hospital', x: hospitalBlock.x, y: hospitalBlock.y, w: hospitalBlock.w, h: hospitalBlock.h, kind: 'hospital' },
    { id: 'police', name: 'Police Station', x: policeBlock.x, y: policeBlock.y, w: policeBlock.w, h: policeBlock.h, kind: 'police' },
    { id: 'bank', name: 'Bank', x: bankBlock.x, y: bankBlock.y, w: bankBlock.w, h: bankBlock.h, kind: 'bank' },
    { id: 'pier', name: 'Pier', x: pierBlock.x, y: pierBlock.y, w: pierBlock.w + 100, h: pierBlock.h, kind: 'pier' },
    { id: 'garage', name: 'Garage', x: garageBlock.x, y: garageBlock.y, w: garageBlock.w, h: garageBlock.h, kind: 'garage' },
    { id: 'safehouse', name: 'Safehouse', x: safehouseBlock.x, y: safehouseBlock.y, w: safehouseBlock.w, h: safehouseBlock.h, kind: 'safehouse' },
    { id: 'park', name: 'Park', x: parkBlock.x, y: parkBlock.y, w: parkBlock.w, h: parkBlock.h, kind: 'park' },
    { id: 'beach', name: 'Beach', x: beach.x, y: beach.y, w: beach.w, h: beach.h, kind: 'beach' }
  );

  return { roads, blocks, buildings, landmarks, beach, water };
}

export function isOnRoad(city, x, y) {
  for (const r of city.roads) {
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true;
  }
  if (x >= city.beach.x && x <= city.beach.x + city.beach.w && y >= city.beach.y && y <= city.beach.y + city.beach.h) return true;
  return false;
}

export function collidesBuilding(city, x, y, radius) {
  for (const b of city.buildings) {
    const cx = Math.max(b.x, Math.min(x, b.x + b.w));
    const cy = Math.max(b.y, Math.min(y, b.y + b.h));
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy < radius * radius) return true;
  }
  return false;
}

export function landmarkCenter(city, id) {
  const lm = city.landmarks.find(l => l.id === id);
  if (!lm) return { x: WORLD.width / 2, y: WORLD.height / 2 };
  // Return road point near landmark
  return { x: lm.x - 24, y: lm.y + lm.h / 2 };
}
