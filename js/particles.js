/**
 * 維新の嵐：双極の蒼穹 - Rogue Deck-Build -
 * 墨絵・斬撃・火花・コネクトリンク エフェクト描画エンジン (HTML5 Canvas)
 */

class ParticleSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.slashes = [];
        this.links = [];
        this.textFloats = [];
        this.lastTime = performance.now();
        this.isRunning = false;
    }

    init(canvasId = 'fx-canvas') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.startLoop();
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    startLoop() {
        if (this.isRunning) return;
        this.isRunning = true;
        const loop = (now) => {
            const dt = (now - this.lastTime) / 1000;
            this.lastTime = now;
            this.update(dt);
            this.draw();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    // --- 墨飛沫（Ink Splash） ---
    createInkSplash(x, y, count = 18, color = 'rgba(25, 23, 22, ') {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 220;
            const size = 3 + Math.random() * 12;
            const life = 0.5 + Math.random() * 0.7;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size,
                maxLife: life,
                life: life,
                colorPrefix: color,
                drag: 0.92,
                type: 'ink'
            });
        }
    }

    // --- 金箔・火花（Gold Flakes / Gun Sparks） ---
    createSparks(x, y, count = 15, isGold = true) {
        const color = isGold ? 'rgba(235, 190, 75, ' : 'rgba(255, 90, 30, ';
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 280;
            const size = 2 + Math.random() * 5;
            const life = 0.3 + Math.random() * 0.5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size,
                maxLife: life,
                life: life,
                colorPrefix: color,
                drag: 0.94,
                gravity: 120,
                type: 'spark'
            });
        }
    }

    // --- 鋭い斬撃（Sword Slash Trail） ---
    createSlash(x1, y1, x2, y2, color = '#f5efe6', width = 5) {
        this.slashes.push({
            x1, y1, x2, y2,
            width,
            color,
            life: 0.25,
            maxLife: 0.25
        });
        // 斬撃線上に少し墨飛沫
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        this.createInkSplash(midX, midY, 8, 'rgba(180, 35, 35, ');
    }

    // --- 敵への攻撃エフェクト簡易トリガー ---
    triggerEnemySlash(targetElem, color = '#f7d070') {
        if (!targetElem) return;
        const rect = targetElem.getBoundingClientRect();
        const x1 = rect.left + rect.width * 0.15;
        const y1 = rect.top + rect.height * 0.2;
        const x2 = rect.right - rect.width * 0.15;
        const y2 = rect.bottom - rect.height * 0.2;
        this.createSlash(x1, y1, x2, y2, color, 6);
        this.createInkSplash((x1 + x2) / 2, (y1 + y2) / 2, 20);
    }

    // --- コネクト・リンク光線（2枚のカードを結ぶ金色の絆） ---
    createConnectLink(cardElemA, cardElemB) {
        if (!cardElemA || !cardElemB) return;
        const rectA = cardElemA.getBoundingClientRect();
        const rectB = cardElemB.getBoundingClientRect();
        const x1 = rectA.left + rectA.width / 2;
        const y1 = rectA.top + rectA.height / 2;
        const x2 = rectB.left + rectB.width / 2;
        const y2 = rectB.top + rectB.height / 2;

        this.links.push({
            x1, y1, x2, y2,
            life: 0.9,
            maxLife: 0.9
        });

        this.createSparks(x1, y1, 10, true);
        this.createSparks(x2, y2, 10, true);
    }

    // --- 連鎖墨文字（壱之連、弐之連…）演出 ---
    showComboText(text, count) {
        const x = window.innerWidth / 2;
        const y = window.innerHeight * 0.38;
        this.textFloats.push({
            text,
            count,
            x, y,
            life: 1.0,
            maxLife: 1.0,
            scale: 0.6
        });
        this.createInkSplash(x, y, 22, 'rgba(20, 20, 22, ');
        if (count >= 3) {
            this.createSparks(x, y, 16, true);
        }
    }

    update(dt) {
        // パーティクル更新
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= p.drag;
            p.vy *= p.drag;
            if (p.gravity) {
                p.vy += p.gravity * dt;
            }
        }

        // 斬撃更新
        for (let i = this.slashes.length - 1; i >= 0; i--) {
            const s = this.slashes[i];
            s.life -= dt;
            if (s.life <= 0) {
                this.slashes.splice(i, 1);
            }
        }

        // コネクトリンク更新
        for (let i = this.links.length - 1; i >= 0; i--) {
            const l = this.links[i];
            l.life -= dt;
            if (l.life <= 0) {
                this.links.splice(i, 1);
            }
        }

        // 連鎖文字更新
        for (let i = this.textFloats.length - 1; i >= 0; i--) {
            const t = this.textFloats[i];
            t.life -= dt;
            if (t.life <= 0) {
                this.textFloats.splice(i, 1);
                continue;
            }
            const progress = 1 - (t.life / t.maxLife);
            t.scale = 0.7 + Math.sin(progress * Math.PI) * 0.5;
            t.y -= 15 * dt;
        }
    }

    draw() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. コネクトリンク線（金色の光）
        this.links.forEach(l => {
            const alpha = Math.min(1, l.life / (l.maxLife * 0.7));
            this.ctx.save();
            this.ctx.strokeStyle = `rgba(235, 195, 80, ${alpha * 0.9})`;
            this.ctx.lineWidth = 4 + Math.sin(performance.now() * 0.02) * 2;
            this.ctx.shadowColor = '#ffd700';
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            this.ctx.moveTo(l.x1, l.y1);
            // 微妙に波打つ光線
            const midX = (l.x1 + l.x2) / 2 + (Math.random() - 0.5) * 8;
            const midY = (l.y1 + l.y2) / 2 + (Math.random() - 0.5) * 8;
            this.ctx.quadraticCurveTo(midX, midY, l.x2, l.y2);
            this.ctx.stroke();
            this.ctx.restore();
        });

        // 2. 斬撃線
        this.slashes.forEach(s => {
            const alpha = s.life / s.maxLife;
            this.ctx.save();
            this.ctx.strokeStyle = s.color;
            this.ctx.globalAlpha = alpha;
            this.ctx.lineWidth = s.width;
            this.ctx.shadowColor = s.color;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.moveTo(s.x1, s.y1);
            this.ctx.lineTo(s.x2, s.y2);
            this.ctx.stroke();
            this.ctx.restore();
        });

        // 3. パーティクル（墨・火花）
        this.particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            this.ctx.save();
            this.ctx.fillStyle = `${p.colorPrefix}${alpha})`;
            if (p.type === 'spark') {
                this.ctx.shadowColor = '#ffbb33';
                this.ctx.shadowBlur = 8;
            }
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * (0.4 + alpha * 0.6), 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        // 4. 連鎖墨文字（和風筆文字スタイル）
        this.textFloats.forEach(t => {
            const alpha = Math.min(1, (t.life / t.maxLife) * 1.5);
            this.ctx.save();
            this.ctx.translate(t.x, t.y);
            this.ctx.scale(t.scale, t.scale);
            this.ctx.globalAlpha = alpha;

            // 影（墨の滲み）
            this.ctx.font = 'bold 52px "Yu Mincho", "Hiragino Mincho ProN", serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            this.ctx.fillStyle = 'rgba(10, 10, 12, 0.9)';
            this.ctx.shadowColor = t.count >= 3 ? 'rgba(215, 40, 40, 0.8)' : 'rgba(212, 175, 55, 0.8)';
            this.ctx.shadowBlur = 24;
            this.ctx.fillText(t.text, 0, 0);

            // 金または朱のハイライト縁取り
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = t.count >= 3 ? '#ff3b30' : '#e6be65';
            this.ctx.strokeText(t.text, 0, 0);

            this.ctx.restore();
        });
    }
}

// グローバルインスタンス
window.particleSystem = new ParticleSystem();

