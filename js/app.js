/**
 * 幕末風雲録：双極の蒼穹 - Rogue Deck-Build -
 * メインコントローラー・ステート管理・イベントバインド
 */

class BakumatsuApp {
    constructor() {
        this.faction = 'tobaku'; // 'tobaku' or 'sabaku'
        this.hp = 75;
        this.maxHp = 75;
        this.gold = 100;
        this.imperialGauge = 0; // 0% 〜 100%
        this.deck = [];
        this.relics = [];
        this.currentTrend = null;
        this.currentEvent = null;
        this.nextBattleStrengthBuff = 0;

        // システム
        this.battle = new BattleSystem(this);
        this.map = new MapSystem(this);
        this.shop = new ShopSystem(this);
        this.ui = new UIManager(this);

        this.init();
    }

    init() {
        // パーティクル初期化
        window.particleSystem.init('fx-canvas');

        // イベントリスナーの登録
        this.bindEvents();

        // 初期音声UIの同期
        this.syncAudioUI();

        // 初期画面はタイトル（陣営選択）
        this.switchScreen('screen-title');

        // 初期画面表示と同時に最速でBGM再生を起動（BGMがONの場合のみ）
        if (window.soundSystem && !window.soundSystem.isBgmMuted) {
            window.soundSystem.playBgm('title');
        }

        // 画面のどこかを操作した際に確実にBGMと効果音をアンロック
        const validGestures = ['click', 'pointerdown', 'mousedown', 'touchstart', 'touchend', 'keydown'];
        const unlockAllAudio = () => {
            if (window.soundSystem) {
                window.soundSystem.init();
                if (!window.soundSystem.isBgmMuted) {
                    if (!window.soundSystem.bgmAudio || window.soundSystem.bgmAudio.paused) {
                        window.soundSystem.playBgm('title');
                    }
                }
            }
        };
        validGestures.forEach(ev => {
            document.addEventListener(ev, unlockAllAudio, { passive: true });
        });
    }

    syncAudioUI() {
        if (!window.soundSystem) return;
        const isBgmMuted = window.soundSystem.isBgmMuted;
        const isSeMuted = window.soundSystem.isSeMuted;

        // BGMボタン（PC用 ＆ メニュー用）
        const bgmText = isBgmMuted ? '🎵 BGM: 止' : '🎵 BGM: 鳴';
        const bgmBtn = document.getElementById('btn-toggle-bgm');
        const menuBgmBtn = document.getElementById('btn-menu-toggle-bgm');
        if (bgmBtn) {
            bgmBtn.textContent = bgmText;
            bgmBtn.classList.toggle('muted', isBgmMuted);
        }
        if (menuBgmBtn) {
            menuBgmBtn.textContent = bgmText;
            menuBgmBtn.classList.toggle('muted', isBgmMuted);
        }

        // 効果音ボタン（PC用 ＆ メニュー用）
        const seText = isSeMuted ? '🔈 効果音: 止' : '🔊 効果音: 鳴';
        const seBtn = document.getElementById('btn-toggle-se');
        const menuSeBtn = document.getElementById('btn-menu-toggle-se');
        if (seBtn) {
            seBtn.textContent = seText;
            seBtn.classList.toggle('muted', isSeMuted);
        }
        if (menuSeBtn) {
            menuSeBtn.textContent = seText;
            menuSeBtn.classList.toggle('muted', isSeMuted);
        }
    }

    bindEvents() {
        // BGM 切り替え（PC用 & ドロップダウン用）
        const handleBgmToggle = () => {
            if (window.soundSystem) {
                window.soundSystem.init();
                window.soundSystem.toggleBgm();
                this.syncAudioUI();
            }
        };
        const bgmBtn = document.getElementById('btn-toggle-bgm');
        const menuBgmBtn = document.getElementById('btn-menu-toggle-bgm');
        if (bgmBtn) bgmBtn.addEventListener('click', handleBgmToggle);
        if (menuBgmBtn) menuBgmBtn.addEventListener('click', handleBgmToggle);

        // 効果音 切り替え（PC用 & ドロップダウン用）
        const handleSeToggle = () => {
            if (window.soundSystem) {
                window.soundSystem.init();
                window.soundSystem.toggleSe();
                this.syncAudioUI();
            }
        };
        const seBtn = document.getElementById('btn-toggle-se');
        const menuSeBtn = document.getElementById('btn-menu-toggle-se');
        if (seBtn) seBtn.addEventListener('click', handleSeToggle);
        if (menuSeBtn) menuSeBtn.addEventListener('click', handleSeToggle);

        // ヘッダー・プルダウンメニューの開閉制御
        const menuBtn = document.getElementById('btn-header-menu');
        const dropdownMenu = document.getElementById('header-dropdown-menu');
        if (menuBtn && dropdownMenu) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dropdownMenu.classList.toggle('active');
                menuBtn.setAttribute('aria-expanded', isOpen);
            });

            // メニュー外クリックで閉じる
            document.addEventListener('click', (e) => {
                if (!dropdownMenu.contains(e.target) && !menuBtn.contains(e.target)) {
                    dropdownMenu.classList.remove('active');
                    menuBtn.setAttribute('aria-expanded', 'false');
                }
            });

            // ESCキーで閉じる
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && dropdownMenu.classList.contains('active')) {
                    dropdownMenu.classList.remove('active');
                    menuBtn.setAttribute('aria-expanded', 'false');
                }
            });
        }

        // 中断セーブデータの再開ボタン
        const btnContinueRun = document.getElementById('btn-continue-run');
        if (btnContinueRun) {
            btnContinueRun.addEventListener('click', () => this.loadRun());
        }

        // 陣営選択（PCクリックおよびタッチデバイスで確実に反応するよう強化）
        // 陣営選択
        const btnTobaku = document.getElementById('btn-select-tobaku');
        const btnSabaku = document.getElementById('btn-select-sabaku');
        if (btnTobaku) {
            btnTobaku.addEventListener('click', () => this.startNewRun('tobaku'));
        }
        if (btnSabaku) {
            btnSabaku.addEventListener('click', () => this.startNewRun('sabaku'));
        }

        // デッキ確認モーダル（PC用 & ドロップダウン用）
        const btnViewDeck = document.getElementById('btn-view-deck');
        const btnMenuViewDeck = document.getElementById('btn-menu-view-deck');
        const btnCloseDeck = document.getElementById('btn-close-deck');
        if (btnViewDeck) {
            btnViewDeck.addEventListener('click', () => this.ui.openDeckModal());
        }
        if (btnMenuViewDeck) {
            btnMenuViewDeck.addEventListener('click', () => {
                if (dropdownMenu) dropdownMenu.classList.remove('active');
                this.ui.openDeckModal();
            });
        }
        if (btnCloseDeck) {
            btnCloseDeck.addEventListener('click', () => this.ui.closeDeckModal());
        }

        // 削除モーダルキャンセル
        const btnCloseRemoval = document.getElementById('btn-close-removal');
        if (btnCloseRemoval) {
            btnCloseRemoval.addEventListener('click', () => this.ui.closeRemovalModal());
        }

        // 報酬スキップ
        const btnSkipReward = document.getElementById('btn-skip-reward');
        if (btnSkipReward) {
            btnSkipReward.addEventListener('click', () => this.ui.closeRewardModal());
        }

        // ターン終了ボタン
        const btnEndTurn = document.getElementById('btn-end-turn');
        if (btnEndTurn) {
            btnEndTurn.addEventListener('click', () => this.battle.endPlayerTurn());
        }

        // ショップ退出ボタン
        const btnLeaveShop = document.getElementById('btn-leave-shop');
        if (btnLeaveShop) {
            btnLeaveShop.addEventListener('click', () => this.returnToMap());
        }

        // ショップカード削除ボタン
        const btnShopRemove = document.getElementById('btn-shop-remove-card');
        if (btnShopRemove) {
            btnShopRemove.addEventListener('click', () => this.shop.removeCardInShop());
        }

        // 休息アクションボタン
        const btnRestHeal = document.getElementById('btn-rest-heal');
        const btnRestNegotiate = document.getElementById('btn-rest-negotiate');
        const btnRestPurge = document.getElementById('btn-rest-purge');

        if (btnRestHeal) {
            btnRestHeal.addEventListener('click', () => this.shop.restHeal());
        }
        if (btnRestNegotiate) {
            btnRestNegotiate.addEventListener('click', () => this.shop.restNegotiate());
        }
        if (btnRestPurge) {
            btnRestPurge.addEventListener('click', () => this.shop.restPurgeCard());
        }

        // リスタートボタン
        const btnRestart = document.getElementById('btn-restart');
        const btnRestartWin = document.getElementById('btn-restart-win');
        if (btnRestart) {
            btnRestart.addEventListener('click', () => this.switchScreen('screen-title'));
        }
        if (btnRestartWin) {
            btnRestartWin.addEventListener('click', () => this.switchScreen('screen-title'));
        }

        // ウィンドウリサイズ時のマップ線再描画
        window.addEventListener('resize', () => {
            const mapScreen = document.getElementById('screen-map');
            if (mapScreen && mapScreen.classList.contains('active')) {
                this.ui.drawMapConnections();
            }
        });

        // ヘッダー部でのタッチドラッグを完全防止（ヘッダー位置を画面上部に永久固定）
        const header = document.getElementById('main-header');
        if (header) {
            header.addEventListener('touchmove', (e) => {
                if (e.cancelable) e.preventDefault();
            }, { passive: false });
        }
    }

    startNewRun(faction) {
        if (this.hasSavedRun()) {
            const confirmed = confirm("進行中のセーブデータが存在します。現在の進行を破棄して、新たな乱世へ出陣しますか？");
            if (!confirmed) return;
            this.clearSavedRun();
        }

        this.faction = faction;
        this.imperialGauge = 0;
        this.relics = [];
        this.nextBattleStrengthBuff = 0;

        window.soundSystem.init();
        window.soundSystem.playTaiko(true);

        // 陣営ごとの初期デッキ・ステータス
        if (faction === 'tobaku') {
            // 🔴 薩長同盟（討幕派）
            this.maxHp = 75;
            this.hp = 75;
            this.gold = 100;
            // 初期デッキ（スターターカードのみで構成：計10枚、志士カードなし）
            this.deck = [
                "tobaku_strike", "tobaku_strike", "tobaku_strike", "tobaku_strike", "tobaku_strike",
                "tobaku_defend", "tobaku_defend", "tobaku_defend", "tobaku_defend",
                "satcho_secret"
            ];
            this.obtainRelic("kaientai_log");
        } else {
            // 🔵 幕府・会津藩（佐幕派）
            this.maxHp = 85;
            this.hp = 85;
            this.gold = 120;
            // 初期デッキ（スターターカードのみで構成：計10枚、志士カードなし）
            this.deck = [
                "sabaku_strike", "sabaku_strike", "sabaku_strike", "sabaku_strike", "sabaku_strike",
                "sabaku_defend", "sabaku_defend", "sabaku_defend", "sabaku_defend",
                "kyokuchu_hatto"
            ];
            this.obtainRelic("makoto_haori");
        }

        // Act 1 生成
        this.map.generateAct(1);

        // 新規開始時のセーブ
        this.saveRun('map');

        // マップ画面へ遷移
        this.switchScreen('screen-map');
        this.ui.renderMap();
    }

    switchScreen(screenId) {
        const screens = [
            'screen-title',
            'screen-map',
            'screen-battle',
            'screen-event',
            'screen-shop',
            'screen-rest',
            'screen-gameover',
            'screen-gamewin'
        ];

        screens.forEach(s => {
            const el = document.getElementById(s);
            if (el) {
                if (s === screenId) {
                    el.classList.add('active');
                } else {
                    el.classList.remove('active');
                }
            }
        });

        // ヘッダーバーの表示/非表示および初期画面（青色の帯）制御
        const header = document.getElementById('main-header');
        if (header) {
            if (screenId === 'screen-gameover' || screenId === 'screen-gamewin') {
                header.classList.remove('visible');
                header.classList.remove('title-mode');
            } else if (screenId === 'screen-title') {
                header.classList.add('visible');
                header.classList.add('title-mode');
            } else {
                header.classList.add('visible');
                header.classList.remove('title-mode');
                this.ui.updateHeader();
            }
        }

        // 画面に応じた BGM 切り替え
        if (window.soundSystem && window.soundSystem.playBgm) {
            switch (screenId) {
                case 'screen-title':
                    window.soundSystem.playBgm('title');
                    this.checkSavedRun();
                    break;
                case 'screen-map':
                    window.soundSystem.playBgm('map');
                    break;
                case 'screen-battle':
                    window.soundSystem.playBgm('battle');
                    break;
                case 'screen-event':
                case 'screen-shop':
                case 'screen-rest':
                    window.soundSystem.playBgm('map');
                    break;
                case 'screen-gamewin':
                    window.soundSystem.playBgm('win');
                    break;
                case 'screen-gameover':
                    window.soundSystem.stopBgm();
                    break;
            }
        }
    }

    modifyImperialGauge(delta) {
        this.imperialGauge = Math.max(0, Math.min(100, this.imperialGauge + delta));
        this.ui.updateHeader();

        // 100%植民地化ゲームオーバー
        if (this.imperialGauge >= 100) {
            this.handleGameOver("列強の要求に屈し、関税自主権および主権を完全喪失…日本は保護領（植民地）と化した…");
        }
    }

    healPlayer(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        this.ui.updateHeader();
    }

    damagePlayer(amount) {
        this.hp = Math.max(0, this.hp - amount);
        this.ui.updateHeader();
        if (this.hp <= 0) {
            this.handleGameOver("戦乱の荒波に呑まれ、志半ばで倒れた…");
        }
    }

    addCardToDeck(cardId) {
        if (typeof GAME_DATA !== 'undefined' && GAME_DATA.canFactionAcquireCard) {
            if (!GAME_DATA.canFactionAcquireCard(cardId, this.faction)) {
                const card = GAME_DATA.cards[cardId];
                const cardName = card ? card.name : cardId;
                console.warn(`[歴史的因縁] 『${cardName}』は歴史上相手陣営に討たれたため、${this.faction === 'tobaku' ? '討幕派' : '佐幕派'}のデッキに加えることはできません。`);
                return false;
            }
        }
        this.deck.push(cardId);
        return true;
    }

    obtainRelic(relicId) {
        if (!this.relics.includes(relicId)) {
            this.relics.push(relicId);
            this.ui.updateHeader();
        }
    }

    hasRelic(relicId) {
        return this.relics.includes(relicId);
    }

    getAvailableRandomRelic() {
        const remaining = Object.keys(GAME_DATA.relics).filter(id => !this.relics.includes(id));
        if (remaining.length === 0) return null;
        return remaining[Math.floor(Math.random() * remaining.length)];
    }

    obtainRandomRelic() {
        const rId = this.getAvailableRandomRelic();
        if (rId) {
            this.obtainRelic(rId);
            const r = GAME_DATA.relics[rId];
            alert(`【遺物獲得！】\n『${r.name}』を入手した！\n${r.desc}`);
        }
    }

    showBattleRewardModal(rewardData) {
        this.ui.showBattleRewardModal(rewardData);
    }

    openCardRemovalModal(onComplete) {
        this.ui.openCardRemovalModal(onComplete);
    }

    returnToMap() {
        this.switchScreen('screen-map');
        this.ui.renderMap();
        this.saveRun('map');
    }

    checkActProgressOrReturnMap() {
        const currentNode = this.map.nodes.find(n => n.id === this.map.currentNodeId);
        if (currentNode && currentNode.type === 'boss') {
            // ボス撃破で次幕またはクリア
            this.map.onActCompleted();
        } else {
            this.returnToMap();
        }
    }

    handleGameOver(reason) {
        this.clearSavedRun(); // 敗北時に中断セーブを消去
        const reasonEl = document.getElementById('gameover-reason');
        if (reasonEl) reasonEl.textContent = reason;
        this.switchScreen('screen-gameover');
    }

    handleGameClear() {
        this.clearSavedRun(); // 乱世平定・クリア時に中断セーブを消去
        window.soundSystem.playVictory();
        const clearMsg = document.getElementById('gamewin-message');
        if (clearMsg) {
            if (this.faction === 'tobaku') {
                clearMsg.innerHTML = `
                    薩長同盟軍の電撃的な進軍により幕府本軍を破り、新政府の樹立を達成！<br>
                    列強介入度を <strong>${this.imperialGauge}%</strong> に抑え込み、独立を保った近代日本への第一歩を記した！
                `;
            } else {
                clearMsg.innerHTML = `
                    会津の誇りと新選組の鉄の結束により倒幕勢力を退け、幕威の再興を達成！<br>
                    列強介入度を <strong>${this.imperialGauge}%</strong> に抑え込み、武士の気概と主権を永遠に証明した！
                `;
            }
        }
        this.switchScreen('screen-gamewin');
    }

    // ==========================================
    // 途中セーブ＆再開（Auto-Save / Continue）
    // ==========================================

    static get SAVE_KEY() {
        return 'bakumatsu_saved_run';
    }

    hasSavedRun() {
        try {
            const raw = localStorage.getItem(BakumatsuApp.SAVE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            return !!(data && data.faction && data.map && Array.isArray(data.deck));
        } catch (e) {
            console.error('[セーブ検証エラー]', e);
            return false;
        }
    }

    getSavedRunData() {
        try {
            const raw = localStorage.getItem(BakumatsuApp.SAVE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            console.error('[セーブ取得エラー]', e);
            return null;
        }
    }

    checkSavedRun() {
        const continueBox = document.getElementById('continue-game-box');
        if (!continueBox) return;

        if (!this.hasSavedRun()) {
            continueBox.classList.add('hidden');
            return;
        }

        const data = this.getSavedRunData();
        if (!data) {
            continueBox.classList.add('hidden');
            return;
        }

        continueBox.classList.remove('hidden');

        const iconEl = document.getElementById('continue-faction-icon');
        const nameEl = document.getElementById('continue-faction-name');
        const actEl = document.getElementById('continue-act');
        const floorEl = document.getElementById('continue-floor');
        const hpEl = document.getElementById('continue-hp');
        const goldEl = document.getElementById('continue-gold');

        if (iconEl) iconEl.textContent = data.faction === 'tobaku' ? '🔴' : '🔵';
        if (nameEl) nameEl.textContent = data.faction === 'tobaku' ? '薩長同盟（討幕派）' : '幕府・会津藩（佐幕派）';
        if (actEl) {
            const actNames = {
                1: "第一幕：京洛動乱",
                2: "第二幕：東海道進撃",
                3: "終幕：天下分け目"
            };
            actEl.textContent = actNames[data.map?.currentAct] || "幕末行路";
        }
        if (floorEl) {
            const floorNum = (data.map?.currentFloor !== undefined) ? data.map.currentFloor + 1 : 1;
            floorEl.textContent = `第${floorNum}階`;
        }
        if (hpEl) hpEl.textContent = `体力 ${data.hp} / ${data.maxHp}`;
        if (goldEl) goldEl.textContent = `${data.gold}両`;
    }

    saveRun(savedScene = 'map') {
        // 死亡時または植民地化敗北時は保存しない
        if (this.hp <= 0 || this.imperialGauge >= 100) return;

        try {
            const saveData = {
                version: "1.0",
                savedAt: Date.now(),
                savedScene: savedScene,
                faction: this.faction,
                hp: this.hp,
                maxHp: this.maxHp,
                gold: this.gold,
                imperialGauge: this.imperialGauge,
                deck: [...this.deck],
                relics: [...this.relics],
                trendId: this.currentTrend ? this.currentTrend.id : null,
                nextBattleStrengthBuff: this.nextBattleStrengthBuff || 0,
                map: {
                    currentAct: this.map.currentAct,
                    currentFloor: this.map.currentFloor,
                    currentNodeId: this.map.currentNodeId,
                    nodes: this.map.nodes,
                    connections: this.map.connections,
                    visitedEventIds: this.map.visitedEventIds || []
                }
            };
            localStorage.setItem(BakumatsuApp.SAVE_KEY, JSON.stringify(saveData));
        } catch (e) {
            console.error('[セーブ保存エラー]', e);
        }
    }

    loadRun() {
        const data = this.getSavedRunData();
        if (!data) {
            alert("セーブデータが見つかりませんでした。");
            this.checkSavedRun();
            return;
        }

        try {
            // ステータス復元
            this.faction = data.faction;
            this.hp = data.hp;
            this.maxHp = data.maxHp;
            this.gold = data.gold;
            this.imperialGauge = data.imperialGauge || 0;
            this.deck = Array.isArray(data.deck) ? [...data.deck] : [];
            this.relics = Array.isArray(data.relics) ? [...data.relics] : [];
            this.nextBattleStrengthBuff = data.nextBattleStrengthBuff || 0;

            // トレンド復元
            if (data.trendId && typeof GAME_DATA !== 'undefined' && GAME_DATA.trends) {
                this.currentTrend = GAME_DATA.trends.find(t => t.id === data.trendId) || null;
            } else {
                this.currentTrend = null;
            }

            // マップ復元
            if (data.map) {
                this.map.currentAct = data.map.currentAct || 1;
                this.map.currentFloor = data.map.currentFloor || 0;
                this.map.currentNodeId = data.map.currentNodeId || null;
                this.map.nodes = data.map.nodes || [];
                this.map.connections = data.map.connections || [];
                this.map.visitedEventIds = data.map.visitedEventIds || [];
            }

            // 音声アンロック＆効果音
            if (window.soundSystem) {
                window.soundSystem.init();
                window.soundSystem.playTaiko(true);
            }

            // シーン再開
            const savedScene = data.savedScene || 'map';
            const currentNode = this.map.nodes.find(n => n.id === this.map.currentNodeId);

            if ((savedScene === 'battle' || savedScene === 'elite' || savedScene === 'boss') && currentNode) {
                this.map.launchBattle(currentNode);
            } else if (savedScene === 'shop') {
                this.shop.openShop();
            } else if (savedScene === 'rest') {
                this.shop.openRestSite();
            } else if (savedScene === 'event' && currentNode) {
                this.map.launchEvent(currentNode);
            } else {
                this.switchScreen('screen-map');
                this.ui.renderMap();
            }
        } catch (e) {
            console.error('[セーブロードエラー]', e);
            alert("セーブデータの復元中にエラーが発生しました。新しくゲームを開始してください。");
            this.clearSavedRun();
        }
    }

    clearSavedRun() {
        try {
            localStorage.removeItem(BakumatsuApp.SAVE_KEY);
        } catch (e) {
            console.error('[セーブ削除エラー]', e);
        }
        this.checkSavedRun();
    }
}

// 起動
window.addEventListener('DOMContentLoaded', () => {
    window.bakumatsuApp = new BakumatsuApp();
});
