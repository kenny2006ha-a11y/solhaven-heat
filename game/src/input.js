export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_INTERACT = 4;
export const ACTION_SHOOT = 8;
export const ACTION_SAVE = 16;
export const ACTION_CONTINUE = 32;

export function createInput(canvas) {
  const keys = new Set();
  let mouseX = 0;
  let mouseY = 0;
  let isMouseDown = false;
  let actions = 0;

  const handleKeyDown = (e) => {
    keys.add(e.code);
    if (e.code === 'Enter') actions |= ACTION_CONFIRM;
    if (e.code === 'KeyP' || e.code === 'Escape') actions |= ACTION_PAUSE;
    if (e.code === 'KeyE') actions |= ACTION_INTERACT;
    if (e.code === 'KeyF') actions |= ACTION_SHOOT;
    if (e.code === 'KeyQ') actions |= ACTION_SAVE;
    if (e.code === 'KeyC') actions |= ACTION_CONTINUE;
  };

  const handleKeyUp = (e) => {
    keys.delete(e.code);
  };

  const updateMouse = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top) * scaleY;
  };

  const handleMouseMove = (e) => {
    updateMouse(e);
  };

  const handleMouseDown = (e) => {
    if (e.button === 0) {
      isMouseDown = true;
      actions |= (ACTION_CONFIRM | ACTION_SHOOT);
      updateMouse(e);
    }
  };

  const handleMouseUp = (e) => {
    if (e.button === 0) {
      isMouseDown = false;
      updateMouse(e);
    }
  };

  const handleBlur = () => {
    keys.clear();
    isMouseDown = false;
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', handleBlur);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mouseup', handleMouseUp);

  return {
    moveX() {
      let x = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      return x;
    },
    moveY() {
      let y = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      return y;
    },
    run() {
      return keys.has('ShiftLeft') || keys.has('ShiftRight');
    },
    handbrake() {
      return keys.has('Space');
    },
    mouse() {
      return { x: mouseX, y: mouseY };
    },
    mouseDown() {
      return isMouseDown;
    },
    takeActions() {
      const current = actions;
      actions = 0;
      return current;
    }
  };
}
