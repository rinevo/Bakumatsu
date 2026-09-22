/**
 * 維新の嵐：双極の蒼穹 - Rogue Deck-Build -
 * 和風プロシージャルサウンドシステム (Web Audio API)
 * 外部アセット不要で和太鼓、拍子木、居合斬撃、墨飛沫、西洋銃火器、警告音などをリアルタイム合成
 */

class SoundSystem {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.bgmTimer = null;
        this.isBgmPlaying = false;
        this.initOnFirstGesture = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBgm();
        } else {
            this.startBgm();
        }
        return this.isMuted;
    }

    // --- 和太鼓（ドン！） ---
    playTaiko(strong = false) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const baseFreq = strong ? 85 : 110;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + (strong ? 0.45 : 0.3));

        gain.gain.setValueAtTime(strong ? 0.9 : 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (strong ? 0.5 : 0.35));

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + (strong ? 0.5 : 0.35));

        // 軽い皮のバズ（ノイズ）
        this.playNoiseSnap(0.06, 0.25, 400);
    }

    // --- 拍子木（カンッ！） ---
    playHyoshigi() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1480, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    // --- 居合・斬撃（シャキーン！） ---
    playSlash() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        
        // 金属音オシレーター
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        // バンドパスフィルターで刀の鋭い金属感を強調
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.Q.setValueAtTime(4.0, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);

        // 風切りノイズ
        this.playNoiseSnap(0.18, 0.4, 2500);
    }

    // --- 重撃・必殺（ズバッ！） ---
    playHeavySlash() {
        this.playTaiko(true);
        this.playSlash();
        setTimeout(() => this.playSlash(), 60);
    }

    // --- 防御・鉄壁（カキィン！） ---
    playShield() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const freqs = [880, 1320, 1760];

        freqs.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now);
            osc.frequency.exponentialRampToValueAtTime(f * 0.95, now + 0.35);

            gain.gain.setValueAtTime(0.2 / (idx + 1), now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.35);
        });
    }

    // --- 西洋銃・大砲（ズドン！） ---
    playGunshot() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        this.playTaiko(true);
        this.playNoiseSnap(0.25, 0.6, 800);

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    // --- コネクト・リンク発動（煌めき） ---
    playConnectLink() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);

            gain.gain.setValueAtTime(0, now);
            gain.gain.setValueAtTime(0.25, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.45);
        });
    }

    // --- 墨絵・連鎖音（シュッ） ---
    playCombo(count) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        this.playHyoshigi();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const pitch = 330 + Math.min(count * 60, 600);
        osc.frequency.setValueAtTime(pitch, now);
        osc.frequency.exponentialRampToValueAtTime(pitch * 1.3, now + 0.15);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // --- 貨幣（両・チャリン） ---
    playCoin() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        [1800, 2400].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + i * 0.06);
            gain.gain.setValueAtTime(0.2, now + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.3);
        });
    }

    // --- 列強警報・不平等条約（ゴォォ…重低音） ---
    playWarning() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(65, now);
        osc.frequency.linearRampToValueAtTime(55, now + 0.8);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, now);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.9);
    }

    // --- 勝利ファンファーレ（和風短音階） ---
    playVictory() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        // 日本の陽旋法・陰旋法モチーフ (D, F, G, A, C, D)
        const notes = [293.66, 349.23, 392.00, 440.00, 587.33];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playKotoNote(freq, 0.6);
            }, idx * 140);
        });
        setTimeout(() => this.playTaiko(true), notes.length * 140);
    }

    playKotoNote(freq, duration = 0.5) {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    // ノイズ発生ヘルパー（打撃感や風切り音）
    playNoiseSnap(duration, vol, cutoff = 1000) {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(cutoff, this.ctx.currentTime);
        filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }

    // 幕末アンビエントBGMループ（静かな琴・太鼓のリズム）
    startBgm() {
        if (this.isBgmPlaying || this.isMuted) return;
        this.isBgmPlaying = true;
        this.init();

        const pentatonic = [220, 246.94, 261.63, 329.63, 349.23, 440]; // 陰音階 A, B, C, E, F, A
        let step = 0;

        this.bgmTimer = setInterval(() => {
            if (this.isMuted || !this.isBgmPlaying) return;
            step++;
            // 4拍ごとに薄い太鼓
            if (step % 4 === 0) {
                this.playTaiko(false);
            }
            // ランダムに琴の静かな響き
            if (Math.random() < 0.5) {
                const note = pentatonic[Math.floor(Math.random() * pentatonic.length)];
                this.playKotoNote(note, 0.9);
            }
        }, 1100);
    }

    stopBgm() {
        this.isBgmPlaying = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}

// グローバルインスタンス
window.soundSystem = new SoundSystem();

