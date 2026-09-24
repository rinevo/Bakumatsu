/**
 * 幕末風雲録：双極の蒼穹 - Rogue Deck-Build -
 * 和風プロシージャルサウンドシステム (Web Audio API)
 * 外部アセット不要で和太鼓、拍子木、居合斬撃、墨飛沫、西洋銃火器、警告音などをリアルタイム合成
 */

class SoundSystem {
    constructor() {
        this.ctx = null;
        this.isBgmMuted = false;
        this.isSeMuted = false;
        this.bgmTimer = null;
        this.isBgmPlaying = false;
        this.initOnFirstGesture = false;

        // MP3 BGM システム
        this.bgmAudio = null;
        this.currentBgmKey = null;
        this.bgmVolume = 0.45;
        this.bgmTracks = {
            title: "bgm/The_Iron_Horizon.mp3",
            map: "bgm/Edge_of_the_Setting_Sun.mp3",
            battle: "bgm/Thunder_of_the_Shogunate.mp3",
            win: "bgm/Still_Water_at_the_Temple_Gate.mp3"
        };
        // ループ再生しない（一度きりで停止する）トラック
        this.bgmNonLooping = {
            title: true,
            win: true
        };
        this.audioElements = {};

        // タイトル画面BGMを最速で再生可能にするため即時プリロード
        this.preloadTrack("title");
    }

    // トラックの事前ロード
    preloadTrack(trackKey) {
        if (typeof Audio === 'undefined') return;
        const src = this.bgmTracks[trackKey];
        if (!src || this.audioElements[trackKey]) return;
        try {
            const isLoop = !this.bgmNonLooping[trackKey];
            const audio = new Audio(src);
            audio.preload = "auto";
            audio.loop = isLoop;
            audio.volume = this.bgmVolume;
            this.audioElements[trackKey] = audio;
        } catch (e) {
            // Audio非対応環境など
        }
    }

    // 互換用プロパティ
    get isMuted() {
        return this.isBgmMuted && this.isSeMuted;
    }

    set isMuted(val) {
        this.isBgmMuted = val;
        this.isSeMuted = val;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    // --- BGM 個別ON/OFF ---
    toggleBgm() {
        this.isBgmMuted = !this.isBgmMuted;
        if (this.isBgmMuted) {
            if (this.bgmAudio) {
                this.bgmAudio.pause();
            }
            this.stopProceduralBgm();
        } else {
            if (this.currentBgmKey) {
                const key = this.currentBgmKey;
                this.currentBgmKey = null; // 強制再ロード・再生
                this.playBgm(key);
            } else {
                this.playBgm('title');
            }
        }
        return this.isBgmMuted;
    }

    // --- 効果音 個別ON/OFF ---
    toggleSe() {
        this.isSeMuted = !this.isSeMuted;
        if (!this.isSeMuted) {
            this.init();
            this.playHyoshigi(); // ON時の確認用音
        }
        return this.isSeMuted;
    }

    // 旧互換用
    toggleMute() {
        const nextState = !(this.isBgmMuted && this.isSeMuted);
        this.isBgmMuted = nextState;
        this.isSeMuted = nextState;
        if (this.isBgmMuted) {
            if (this.bgmAudio) {
                this.bgmAudio.pause();
            }
            this.stopProceduralBgm();
        } else {
            if (this.currentBgmKey) {
                const key = this.currentBgmKey;
                this.currentBgmKey = null;
                this.playBgm(key);
            } else {
                this.playBgm('title');
            }
            this.playHyoshigi();
        }
        return nextState;
    }

    // --- 和太鼓（ドン！） ---
    playTaiko(strong = false, isBgm = false) {
        if (!isBgm && this.isSeMuted) return;
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
        if (this.isSeMuted) return;
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
        if (this.isSeMuted) return;
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
        if (this.isSeMuted) return;
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
        if (this.isSeMuted) return;
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
        if (this.isSeMuted) return;
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
        if (this.isSeMuted) return;
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
        if (this.isSeMuted) return;
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
        if (this.isSeMuted) return;
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
        if (this.isSeMuted) return;
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

    // --- 志士獲得・達成ファンファーレ ---
    playFanfare() {
        this.playVictory();
    }

    playKotoNote(freq, duration = 0.5, isBgm = false) {
        if ((!isBgm && this.isSeMuted) || !this.ctx) return;
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

    // --- MP3 BGM 再生エンジン ---
    playBgm(trackKey) {
        if (!trackKey) return;

        // 同じトラックが再生中の場合は何もしない（頭出し防止）
        if (this.currentBgmKey === trackKey && this.bgmAudio && !this.bgmAudio.paused) {
            return;
        }

        this.currentBgmKey = trackKey;
        if (this.isBgmMuted) return;

        // 既存の再生をスムーズに停止
        this.stopProceduralBgm();
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
            this.bgmAudio = null;
        }

        const src = this.bgmTracks[trackKey];
        if (!src) return;

        try {
            const isLoop = !this.bgmNonLooping[trackKey];
            let audio = this.audioElements[trackKey];
            if (!audio) {
                audio = new Audio(src);
                audio.loop = isLoop;
                audio.volume = this.bgmVolume;
                audio.preload = "auto";
                this.audioElements[trackKey] = audio;
            } else {
                audio.volume = this.bgmVolume;
                audio.loop = isLoop;
            }
            this.bgmAudio = audio;

            // 曲が最後まで終わったら停止する（リピートしないトラック用）
            audio.onended = () => {
                if (!isLoop && this.bgmAudio === audio) {
                    this.bgmAudio = null;
                    this.currentBgmKey = null;
                }
            };

            // 再生失敗時（404エラーなど）はプロシージャルBGMにフォールバック
            audio.onerror = () => {
                console.warn(`[SoundSystem] MP3ファイルの読み込みに失敗しました (${src})。プロシージャル合成音にフォールバックします。`);
                if (this.bgmAudio === audio) {
                    this.bgmAudio = null;
                    this.startProceduralBgm();
                }
            };

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // 再生成功時
                    const hint = document.getElementById('bgm-autoplay-hint');
                    if (hint) hint.classList.add('hidden');
                }).catch(err => {
                    // ブラウザの自動再生ポリシーでブロックされた場合
                    const hint = document.getElementById('bgm-autoplay-hint');
                    if (hint && !this.isBgmMuted) {
                        hint.classList.remove('hidden');
                    }

                    const validGestures = ['click', 'pointerdown', 'mousedown', 'touchstart', 'touchend', 'keydown'];
                    const unlockHandler = () => {
                        if (this.currentBgmKey === trackKey && !this.isBgmMuted && this.bgmAudio) {
                            this.bgmAudio.play().then(() => {
                                const h = document.getElementById('bgm-autoplay-hint');
                                if (h) h.classList.add('hidden');
                                validGestures.forEach(ev => {
                                    window.removeEventListener(ev, unlockHandler, true);
                                    document.removeEventListener(ev, unlockHandler, true);
                                });
                            }).catch(() => {
                                // 再生できるまでリスナーを維持
                            });
                        }
                    };
                    validGestures.forEach(ev => {
                        window.addEventListener(ev, unlockHandler, { capture: true, passive: true });
                        document.addEventListener(ev, unlockHandler, { capture: true, passive: true });
                    });
                });
            }
        } catch (e) {
            console.warn('[SoundSystem] Audio element creation error:', e);
            this.startProceduralBgm();
        }
    }

    stopBgm() {
        this.currentBgmKey = null;
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
            this.bgmAudio.onended = null;
            this.bgmAudio = null;
        }
        this.stopProceduralBgm();
    }

    // 互換性＆フォールバック用：プロシージャル合成BGM
    startProceduralBgm() {
        if (this.isBgmPlaying || this.isBgmMuted) return;
        this.isBgmPlaying = true;
        this.init();

        const pentatonic = [220, 246.94, 261.63, 329.63, 349.23, 440]; // 陰音階 A, B, C, E, F, A
        let step = 0;

        this.bgmTimer = setInterval(() => {
            if (this.isBgmMuted || !this.isBgmPlaying) return;
            step++;
            // 4拍ごとに薄い太鼓
            if (step % 4 === 0) {
                this.playTaiko(false, true);
            }
            // ランダムに琴の静かな響き
            if (Math.random() < 0.5) {
                const note = pentatonic[Math.floor(Math.random() * pentatonic.length)];
                this.playKotoNote(note, 0.9, true);
            }
        }, 1100);
    }

    stopProceduralBgm() {
        this.isBgmPlaying = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    // 旧メソッド互換
    startBgm() {
        if (this.currentBgmKey) {
            this.playBgm(this.currentBgmKey);
        } else {
            this.playBgm('title');
        }
    }
}

// グローバルインスタンス
window.soundSystem = new SoundSystem();

