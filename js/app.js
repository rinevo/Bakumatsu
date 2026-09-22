/**
 * 維新の嵐：双極の蒼穹 - Rogue Deck-Build -
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

        // 初期画面はタイトル（陣営選択）
        this.switchScreen('screen-title');
    }

    bindEvents() {
        // 音量ミュート切り替え
        const muteBtn = document.getElementById('btn-toggle-sound');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                const isMuted = window.soundSystem.toggleMute();
                muteBtn.textContent = isMuted ? '🔇 音声: 滅' : '🔊 音声: 鳴';
            });
        }

        // 陣営選択
        const btnTobaku = document.getElementById('btn-select-tobaku');
        const btnSabaku = document.getElementById('btn-select-sabaku');

        if (btnTobaku) {
            btnTobaku.addEventListener('click', () => this.startNewRun('tobaku'));
        }
        if (btnSabaku) {
            btnSabaku.addEventListener('click', () => this.startNewRun('sabaku'));
        }

        // デッキ確認モーダル
        const btnViewDeck = document.getElementById('btn-view-deck');
        const btnCloseDeck = document.getElementById('btn-close-deck');
        if (btnViewDeck) {
            btnViewDeck.addEventListener('click', () => this.ui.openDeckModal());
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
    }

    startNewRun(faction) {
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
            this.deck = [
                "tobaku_strike", "tobaku_strike", "tobaku_strike", "tobaku_strike",
                "tobaku_defend", "tobaku_defend", "tobaku_defend", "tobaku_defend",
                "ryoma_kaiwentai", "satcho_secret"
            ];
            this.obtainRelic("kaientai_log");
        } else {
            // 🔵 幕府・会津藩（佐幕派）
            this.maxHp = 85;
            this.hp = 85;
            this.gold = 120;
            this.deck = [
                "sabaku_strike", "sabaku_strike", "sabaku_strike", "sabaku_strike",
                "sabaku_defend", "sabaku_defend", "sabaku_defend", "sabaku_defend",
                "hijikata_fukucho", "kyokuchu_hatto"
            ];
            this.obtainRelic("makoto_haori");
        }

        // Act 1 生成
        this.map.generateAct(1);

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

        // ヘッダーバーの表示/非表示（タイトル・ゲームオーバー・クリア画面では非表示）
        const header = document.getElementById('main-header');
        if (header) {
            if (screenId === 'screen-title' || screenId === 'screen-gameover' || screenId === 'screen-gamewin') {
                header.classList.remove('visible');
            } else {
                header.classList.add('visible');
                this.ui.updateHeader();
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
        this.deck.push(cardId);
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
        const reasonEl = document.getElementById('gameover-reason');
        if (reasonEl) reasonEl.textContent = reason;
        this.switchScreen('screen-gameover');
    }

    handleGameClear() {
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
}

// 起動
window.addEventListener('DOMContentLoaded', () => {
    window.bakumatsuApp = new BakumatsuApp();
});
