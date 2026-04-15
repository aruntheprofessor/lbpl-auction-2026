// soundService.js - Sound effects for auction
// Using Web Audio API - no external files needed!

let audioContext = null;

// Initialize audio context (must be called after user interaction)
const initAudio = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

// Play a simple "beep" sound for bids
export const playBidSound = () => {
  try {
    const ctx = initAudio();
    const now = ctx.currentTime;
    
    // Create oscillator for a pleasant "ding" sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 800; // Higher pitch for bid
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(now + 0.1);
  } catch (e) {
    console.warn('Sound not supported:', e);
  }
};

// Play a "success" sound for SOLD
export const playSoldSound = () => {
  try {
    const ctx = initAudio();
    const now = ctx.currentTime;
    
    // Create a triumphant ascending chord
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0.15, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.3);
    });
  } catch (e) {
    console.warn('Sound not supported:', e);
  }
};

// Play a "decline" sound for UNSOLD
export const playUnsoldSound = () => {
  try {
    const ctx = initAudio();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.value = 200; // Lower pitch for unsold
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(now + 0.15);
  } catch (e) {
    console.warn('Sound not supported:', e);
  }
};

// Play a "click" sound for button presses
export const playClickSound = () => {
  try {
    const ctx = initAudio();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 600;
    
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(now + 0.05);
  } catch (e) {
    console.warn('Sound not supported:', e);
  }
};