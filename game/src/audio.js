export function createAudio() {
  let ctx = null;
  let engineOsc = null;
  let engineGain = null;
  let sirenInterval = null;

  function init() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
      }
    }
  }

  return {
    resume() {
      try {
        init();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume();
        }
      } catch (e) {}
    },

    engine(speed) {
      try {
        init();
        if (!ctx || ctx.state === 'suspended') return;

        const spd = typeof speed === 'number' ? speed : (speed ? 1 : 0);
        if (spd > 0) {
          if (!engineOsc) {
            engineOsc = ctx.createOscillator();
            engineGain = ctx.createGain();
            engineOsc.type = 'sawtooth';
            engineOsc.frequency.setValueAtTime(40, ctx.currentTime);
            engineGain.gain.setValueAtTime(0.05, ctx.currentTime);

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(150, ctx.currentTime);

            engineOsc.connect(filter);
            filter.connect(engineGain);
            engineGain.connect(ctx.destination);
            engineOsc.start();
          }
          const targetFreq = 40 + spd * 140;
          engineOsc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);
        } else {
          if (engineOsc) {
            engineOsc.stop();
            engineOsc.disconnect();
            engineOsc = null;
            engineGain = null;
          }
        }
      } catch (e) {}
    },

    shoot() {
      try {
        init();
        if (!ctx || ctx.state === 'suspended') return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);

        const bufferSize = ctx.sampleRate * 0.08;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1000, ctx.currentTime);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noise.start();
      } catch (e) {}
    },

    siren(on) {
      try {
        init();
        if (!ctx || ctx.state === 'suspended') return;

        if (on) {
          if (sirenInterval) return;
          let high = false;
          sirenInterval = setInterval(() => {
            try {
              if (!ctx || ctx.state === 'suspended') return;
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              const f1 = high ? 600 : 900;
              const f2 = high ? 900 : 600;
              osc.frequency.setValueAtTime(f1, ctx.currentTime);
              osc.frequency.linearRampToValueAtTime(f2, ctx.currentTime + 0.35);

              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);

              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.35);
              high = !high;
            } catch (err) {}
          }, 350);
        } else {
          if (sirenInterval) {
            clearInterval(sirenInterval);
            sirenInterval = null;
          }
        }
      } catch (e) {}
    },

    pickup() {
      try {
        init();
        if (!ctx || ctx.state === 'suspended') return;

        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

          gain.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.1);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.06);
          osc.stop(ctx.currentTime + idx * 0.06 + 0.1);
        });
      } catch (e) {}
    },

    complete() {
      try {
        init();
        if (!ctx || ctx.state === 'suspended') return;

        const chord = [440, 554.37, 659.25, 880];
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          const startTime = ctx.currentTime + idx * 0.12;
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.12, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.25);
        });
      } catch (e) {}
    },

    hit() {
      try {
        init();
        if (!ctx || ctx.state === 'suspended') return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch (e) {}
    },

    crash() {
      try {
        init();
        if (!ctx || ctx.state === 'suspended') return;

        const bufferSize = ctx.sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.15));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.5);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
      } catch (e) {}
    }
  };
}
