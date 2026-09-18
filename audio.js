// Web Audio API Sound Synthesizer for tactile feedback & hazard alarms
class SoundEffects {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playBeep(freq = 880, type = 'sine', duration = 0.1, gain = 0.15) {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            
            gainNode.gain.setValueAtTime(gain, this.ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gainNode);
            gainNode.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.warn("Audio play error:", e);
        }
    }

    playDetectionAlert(severity = 'high') {
        if (!this.enabled) return;
        this.init();
        if (severity === 'high' || severity === 'critical') {
            this.playBeep(980, 'square', 0.08, 0.2);
            setTimeout(() => this.playBeep(1320, 'square', 0.12, 0.25), 90);
        } else if (severity === 'medium') {
            this.playBeep(650, 'triangle', 0.12, 0.15);
            setTimeout(() => this.playBeep(850, 'triangle', 0.12, 0.18), 100);
        } else {
            this.playBeep(520, 'sine', 0.1, 0.1);
        }
    }

    playBumpShock() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

            gainNode.gain.setValueAtTime(0.35, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc.connect(gainNode);
            gainNode.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        } catch (e) {
            console.warn(e);
        }
    }

    playClick() {
        this.playBeep(1200, 'sine', 0.03, 0.05);
    }

    playSuccess() {
        this.playBeep(587.33, 'triangle', 0.08, 0.15);
        setTimeout(() => this.playBeep(880, 'triangle', 0.15, 0.2), 90);
    }
}

window.soundFX = new SoundEffects();
