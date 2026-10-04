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
        this.publicOpinion = -25; // 世論メーター (-100 佐幕極限 〜 +100 討幕極限, 初期値: 佐幕寄り -25%)
        this.deck = [];
        this.relics = [];
        this.currentTrend = null;
        this.currentEvent = null;
        this.currentAdventureEvent = null;
        this.isGameOver = false;
        this.savedShishi = new Set();
        this.deadShishi = new Set();
        this.currentSortKey = 0;
        this.pendingSurvivalFailureDeaths = null;

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

        // 初回ユーザー操作時にオーディオコンテキストをアンロック
        const validGestures = ['click', 'pointerdown', 'mousedown', 'touchstart', 'touchend', 'keydown'];
        const unlockInitialAudio = () => {
            if (window.soundSystem) {
                window.soundSystem.init();
                // 初期画面（タイトル）が表示されている場合のみタイトルBGMを再生
                const titleScreen = document.getElementById('screen-title');
                if (titleScreen && titleScreen.classList.contains('active')) {
                    if (!window.soundSystem.isBgmMuted && (!window.soundSystem.bgmAudio || window.soundSystem.bgmAudio.paused)) {
                        window.soundSystem.playBgm('title');
                    }
                }
            }
            // 初回操作が完了したら不要なリスナーを全削除
            validGestures.forEach(ev => {
                document.removeEventListener(ev, unlockInitialAudio);
            });
        };
        validGestures.forEach(ev => {
            document.addEventListener(ev, unlockInitialAudio, { passive: true });
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
        const relicBtn = document.getElementById('btn-header-relics');
        const relicDropdown = document.getElementById('header-relic-dropdown');

        if (menuBtn && dropdownMenu) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (relicDropdown) {
                    relicDropdown.classList.remove('active');
                    if (relicBtn) {
                        relicBtn.classList.remove('active');
                        relicBtn.setAttribute('aria-expanded', 'false');
                    }
                }
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

        // レリック・プルダウンメニューの開閉制御
        if (relicBtn && relicDropdown) {
            relicBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (dropdownMenu) {
                    dropdownMenu.classList.remove('active');
                    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
                }
                const isOpen = relicDropdown.classList.toggle('active');
                relicBtn.classList.toggle('active', isOpen);
                relicBtn.setAttribute('aria-expanded', isOpen);
                if (isOpen && window.soundSystem) {
                    window.soundSystem.playHyoshigi();
                }
            });

            // メニュー外クリックで閉じる
            document.addEventListener('click', (e) => {
                if (!relicDropdown.contains(e.target) && !relicBtn.contains(e.target)) {
                    relicDropdown.classList.remove('active');
                    relicBtn.classList.remove('active');
                    relicBtn.setAttribute('aria-expanded', 'false');
                }
            });

            // ESCキーで閉じる
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && relicDropdown.classList.contains('active')) {
                    relicDropdown.classList.remove('active');
                    relicBtn.classList.remove('active');
                    relicBtn.setAttribute('aria-expanded', 'false');
                }
            });

            // iPad/Android等タッチ端末でのリスト内スクロールを保証（ヘッダーへの伝播を防止）
            relicDropdown.addEventListener('touchmove', (e) => {
                e.stopPropagation();
            }, { passive: true });
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
        const deckBackdrop = document.querySelector('#modal-deck .modal-backdrop');
        if (deckBackdrop) {
            deckBackdrop.addEventListener('click', () => this.ui.closeDeckModal());
        }

        // カード詳細モーダル閉じる
        const btnCloseCardDetail = document.getElementById('btn-close-card-detail');
        if (btnCloseCardDetail) {
            btnCloseCardDetail.addEventListener('click', () => this.ui.closeCardDetailModal());
        }
        const cardDetailBackdrop = document.getElementById('card-detail-backdrop');
        if (cardDetailBackdrop) {
            cardDetailBackdrop.addEventListener('click', () => this.ui.closeCardDetailModal());
        }

        // 削除モーダルキャンセル
        const btnCloseRemoval = document.getElementById('btn-close-removal');
        if (btnCloseRemoval) {
            btnCloseRemoval.addEventListener('click', () => this.ui.closeRemovalModal());
        }
        const removalBackdrop = document.querySelector('#modal-removal .modal-backdrop');
        if (removalBackdrop) {
            removalBackdrop.addEventListener('click', () => this.ui.closeRemovalModal());
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
            btnLeaveShop.addEventListener('click', () => this.shop.leaveShop());
        }

        // ショップ蘭方医の手当て（HP回復）ボタン
        const btnShopHeal = document.getElementById('btn-shop-heal');
        if (btnShopHeal) {
            btnShopHeal.addEventListener('click', () => this.shop.buyHeal());
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

        // 歴史イベント（多段階アドベンチャー）完了ボタン
        const btnEventFinish = document.getElementById('btn-event-finish');
        if (btnEventFinish) {
            btnEventFinish.addEventListener('click', () => this.finishEventAndReturnToMap());
        }

        // リスタートボタン（ゲームオーバー時は直接初期画面へ、ゲームクリア時は背景鑑賞モードへ遷移）
        const btnRestart = document.getElementById('btn-restart');
        const btnRestartWin = document.getElementById('btn-restart-win');
        if (btnRestart) {
            btnRestart.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.switchScreen('screen-title');
            });
        }
        if (btnRestartWin) {
            btnRestartWin.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.enableBackdropView('screen-gamewin');
            });
        }

        // ウィンドウリサイズ時のマップ線再描画＆ヘッダー再計算
        window.addEventListener('resize', () => {
            if (this.ui) {
                this.ui.updateHeader();
            }
            const mapScreen = document.getElementById('screen-map');
            if (mapScreen && mapScreen.classList.contains('active')) {
                this.ui.drawMapConnections();
            }
        });

        // ヘッダー部でのタッチドラッグを完全防止（ヘッダー位置を画面上部に永久固定）
        // ※ただし所持遺物リストやメニューなど、スクロール可能なプルダウン領域内のタッチスクロール操作は許可する
        const header = document.getElementById('main-header');
        if (header) {
            header.addEventListener('touchmove', (e) => {
                if (e.target && e.target.closest && e.target.closest('.header-relic-dropdown, .header-dropdown-menu, .relic-dropdown-list')) {
                    return; // スクロール可能プルダウン内はブラウザのスクロール動作を許可
                }
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
        this.isGameOver = false;
        this.imperialGauge = 0;
        this.publicOpinion = -25; // 幕開けは佐幕優勢（-25%）からスタート
        this.relics = [];
        this.nextBattleStrengthBuff = 0;
        this.savedShishi = new Set();
        this.deadShishi = new Set();
        this.currentSortKey = 0;
        this.pendingSurvivalFailureDeaths = null;

        window.soundSystem.init();
        window.soundSystem.playTaiko(true);

        // 陣営ごとの初期デッキ・ステータス
        if (faction === 'tobaku') {
            // 🔴 薩長同盟（討幕派）
            this.maxHp = 75;
            this.hp = 75;
            this.gold = 100;
            // 初期デッキ（Starter攻撃1枚、Starter防御1枚：計2枚、志士カードなし）
            this.deck = [
                "tobaku_strike",
                "tobaku_defend"
            ];
            // 初期レリックなし
        } else {
            // 🔵 幕府・会津藩（佐幕派）
            this.maxHp = 85;
            this.hp = 85;
            this.gold = 120;
            // 初期デッキ（Starter攻撃1枚、Starter防御1枚：計2枚、志士カードなし）
            this.deck = [
                "sabaku_strike",
                "sabaku_defend"
            ];
            // 初期レリックなし
        }

        // Act 1 生成
        this.map.generateAct(1);

        // 新規開始時のセーブ
        this.saveRun('map');

        // マップ画面へ遷移
        this.switchScreen('screen-map');
        this.ui.renderMap();
    }

    enableBackdropView(screenId) {
        const screen = document.getElementById(screenId);
        if (!screen) return;
        screen.classList.add('backdrop-only');

        // 背景鑑賞モード中は現在再生中の音楽をそのまま維持（停止しない）

        // ボタン押下直後のタップ遅延や合成クリックによる即時誤判定（ゴーストクリック）を完全に防止するため
        // ガード時間を設定（最低400msはクリックを受け付けない）
        const readyTime = Date.now() + 400;

        const onBackdropDismiss = (e) => {
            if (Date.now() < readyTime) {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                return;
            }

            // リスナーをクリーンアップ
            screen.removeEventListener('click', onBackdropDismiss);
            screen.removeEventListener('touchend', onBackdropDismiss);

            screen.classList.remove('backdrop-only');

            // 画面クリック後に初期画面を表示し、初期画面のBGMを再生
            this.switchScreen('screen-title');
        };

        // ボタンのクリックイベント完了後にリスナーを登録
        setTimeout(() => {
            screen.addEventListener('click', onBackdropDismiss);
            screen.addEventListener('touchend', onBackdropDismiss);
        }, 150);
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
                el.classList.remove('backdrop-only');
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
                case 'screen-gamewin': {
                    const winScreen = document.getElementById('screen-gamewin');
                    if (winScreen) {
                        winScreen.classList.remove('faction-tobaku', 'faction-sabaku');
                        winScreen.classList.add(this.faction === 'tobaku' ? 'faction-tobaku' : 'faction-sabaku');
                    }
                    window.soundSystem.playBgm('win');
                    break;
                }
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

    modifyPublicOpinion(delta) {
        let actualDelta = delta;
        // 敵軍有利（自軍不利）の選択時は1.8倍の激甚ペナルティ
        const isAdverse = (this.faction === 'tobaku' && delta < 0) || (this.faction === 'sabaku' && delta > 0);
        if (isAdverse) {
            actualDelta = Math.round(delta * 1.8);
        }

        const prevPhase = this.getPublicOpinionPhase();
        this.publicOpinion = Math.max(-100, Math.min(100, this.publicOpinion + actualDelta));
        const newPhase = this.getPublicOpinionPhase();

        // フェーズが変動した場合の効果音や演出
        if (prevPhase.id !== newPhase.id) {
            if (window.soundSystem) {
                if (newPhase.id === 'bakui_gogo' || newPhase.id === 'kaiten_kangun') {
                    window.soundSystem.playTaiko && window.soundSystem.playTaiko(true);
                } else {
                    window.soundSystem.playKoto && window.soundSystem.playKoto();
                }
            }
        }

        this.ui.updateHeader();
    }

    getPublicOpinionPhase() {
        if (typeof GAME_DATA === 'undefined' || !GAME_DATA.opinionPhases) {
            return { id: "tenka_konmei", name: "天下混迷", subTitle: "情勢拮抗", min: -19, max: 19, badgeClass: "opinion-phase-neutral", color: "#d69e2e", desc: "" };
        }
        return GAME_DATA.opinionPhases.find(p => this.publicOpinion >= p.min && this.publicOpinion <= p.max) || GAME_DATA.opinionPhases[2];
    }

    getFactionSituation() {
        // 討幕派: 正が有利、負が不利
        // 佐幕派: 負が有利、正が不利
        const op = this.publicOpinion;
        if (this.faction === 'tobaku') {
            if (op <= -100) return 'extreme_disadvantage'; // ☠️ 極限劣勢（完全朝敵・幕威100%）
            if (op >= 50) return 'super_advantage';       // 絶大優勢（回天官軍）
            if (op >= 20) return 'advantage';             // やや優勢（討幕高揚）
            if (op >= -19) return 'neutral';              // 拮抗（天下混迷）
            if (op >= -49) return 'disadvantage';         // やや劣勢（佐幕優勢）
            return 'super_disadvantage';                  // 強烈劣勢（幕威轟々）
        } else {
            // 佐幕派
            if (op >= 100) return 'extreme_disadvantage'; // ☠️ 極限劣勢（完全朝敵・官軍100%）
            if (op <= -50) return 'super_advantage';      // 絶大優勢（幕威轟々）
            if (op <= -20) return 'advantage';            // やや優勢（佐幕優勢）
            if (op <= 19) return 'neutral';               // 拮抗（天下混迷）
            if (op <= 49) return 'disadvantage';          // やや劣勢（討幕高揚）
            return 'super_disadvantage';                  // 強烈劣勢（回天官軍）
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

    addCardToDeck(cardId, force = false) {
        const isSaved = this.isShishiSaved(cardId);
        if (!force && !isSaved && this.isShishiDead(cardId)) {
            console.warn(`[志士死亡] 『${cardId}』は歴史上落命したため、デッキに加えることはできません。`);
            return false;
        }
        if (!force && !isSaved && typeof GAME_DATA !== 'undefined' && GAME_DATA.canFactionAcquireCard) {
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

    // --- 志士生死・生存ルート管理システム ---
    markShishiSurvived(cardId) {
        if (!this.savedShishi) this.savedShishi = new Set();
        this.savedShishi.add(cardId);
        if (this.deadShishi) this.deadShishi.delete(cardId);
    }

    isShishiDead(cardId) {
        return Boolean(this.deadShishi && this.deadShishi.has(cardId));
    }

    isShishiSaved(cardId) {
        return Boolean(this.savedShishi && this.savedShishi.has(cardId));
    }

    killShishi(cardId, reason = '歴史の死線により落命', eventTitle = '歴史事件') {
        if (!this.deadShishi) this.deadShishi = new Set();
        if (this.isShishiSaved(cardId)) return null;

        const wasOwned = this.deck.includes(cardId);
        if (wasOwned) {
            this.deck = this.deck.filter(id => id !== cardId);
        }
        this.deadShishi.add(cardId);

        const deathDef = (GAME_DATA.shishiDeaths && GAME_DATA.shishiDeaths[cardId]) || {};
        const cardObj = (GAME_DATA.cards && GAME_DATA.cards[cardId]) || {};
        const deathInfo = {
            cardId,
            name: deathDef.name || cardObj.name || cardId,
            reason: deathDef.reason || reason,
            eventTitle: deathDef.eventTitle || eventTitle,
            lastWords: deathDef.lastWords || '',
            wasOwned
        };
        return deathInfo;
    }

    handleShishiDeaths(deathsList) {
        if (!Array.isArray(deathsList) || deathsList.length === 0) return;
        const processed = [];
        deathsList.forEach(item => {
            const cardId = typeof item === 'string' ? item : item.cardId;
            const reason = typeof item === 'object' ? item.reason : undefined;
            const eventTitle = typeof item === 'object' ? item.eventTitle : undefined;
            const res = this.killShishi(cardId, reason, eventTitle);
            if (res) processed.push(res);
        });

        // プレイヤーが所持していた志士の死亡通知
        const ownedDeaths = processed.filter(p => p.wasOwned);
        if (ownedDeaths.length > 0) {
            if (this.ui && this.ui.showShishiDeathModal) {
                this.ui.showShishiDeathModal(ownedDeaths);
            }
            if (window.soundSystem && window.soundSystem.playWarning) {
                window.soundSystem.playWarning();
            }
        }
        this.ui.updateHeader();
    }

    obtainRelic(relicId) {
        if (!this.relics.includes(relicId)) {
            this.relics.push(relicId);
            this.ui.updateHeader();
        }
    }

    // --- 志士所持判定システム ---
    hasShishi(characterKey) {
        if (!characterKey) return false;
        return this.deck.some(cardId => {
            if (cardId === characterKey) return true;
            const card = (typeof GAME_DATA !== 'undefined' && GAME_DATA.cards) ? GAME_DATA.cards[cardId] : null;
            return card && (card.character === characterKey || card.id === characterKey);
        });
    }

    hasAnyShishi(keys) {
        if (!Array.isArray(keys) || keys.length === 0) return true;
        return keys.some(key => this.hasShishi(key));
    }

    hasAllShishi(keys) {
        if (!Array.isArray(keys) || keys.length === 0) return true;
        return keys.every(key => this.hasShishi(key));
    }

    getOwnedShishiList() {
        if (typeof GAME_DATA === 'undefined' || !GAME_DATA.cards) return [];
        return this.deck
            .map(id => GAME_DATA.cards[id])
            .filter(card => card && (card.type === 'shishi' || card.character));
    }

    getShishiDisplayName(characterKey) {
        if (typeof GAME_DATA === 'undefined' || !GAME_DATA.cards) return characterKey;
        const matchingCard = Object.values(GAME_DATA.cards).find(c => 
            (c.character === characterKey || c.id === characterKey)
        );
        if (matchingCard) {
            // "坂本龍馬：海援隊の采配" -> "坂本龍馬"
            const colonIdx = matchingCard.name.indexOf('：');
            return colonIdx !== -1 ? matchingCard.name.substring(0, colonIdx) : matchingCard.name;
        }
        return characterKey;
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
        if (this.isGameOver || this.hp <= 0 || this.imperialGauge >= 100) {
            console.warn('[returnToMap 中断] ゲームオーバー状態のためマップ遷移を中止しました。');
            return;
        }
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
        this.isGameOver = true;
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
        const winScreen = document.getElementById('screen-gamewin');
        if (winScreen) {
            winScreen.classList.remove('faction-tobaku', 'faction-sabaku');
            winScreen.classList.add(this.faction === 'tobaku' ? 'faction-tobaku' : 'faction-sabaku');
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
                publicOpinion: typeof this.publicOpinion === 'number' ? this.publicOpinion : -25,
                deck: [...this.deck],
                relics: [...this.relics],
                savedShishi: Array.from(this.savedShishi || []),
                deadShishi: Array.from(this.deadShishi || []),
                currentSortKey: this.currentSortKey || 0,
                trendId: this.currentTrend ? this.currentTrend.id : null,
                nextBattleStrengthBuff: this.nextBattleStrengthBuff || 0,
                map: {
                    currentAct: this.map.currentAct,
                    currentFloor: this.map.currentFloor,
                    currentNodeId: this.map.currentNodeId,
                    previousNodeId: this.map.previousNodeId,
                    previousFloor: this.map.previousFloor,
                    nodes: this.map.nodes,
                    connections: this.map.connections,
                    visitedEventIds: this.map.visitedEventIds || []
                },
                shop: {
                    goldSpentInShop: this.shop.goldSpentInShop || 0
                },
                eventResolution: (savedScene === 'event_resolution' && this.currentAdventureEvent && this.currentAdventureEvent.result)
                    ? this.currentAdventureEvent.result
                    : null
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
            this.isGameOver = false;

            // ステータス復元
            this.faction = data.faction;
            this.hp = data.hp;
            this.maxHp = data.maxHp;
            this.gold = data.gold;
            this.imperialGauge = data.imperialGauge || 0;
            this.publicOpinion = typeof data.publicOpinion === 'number' ? data.publicOpinion : -25;
            this.deck = Array.isArray(data.deck) ? [...data.deck] : [];
            this.relics = Array.isArray(data.relics) ? [...data.relics] : [];
            this.savedShishi = new Set(Array.isArray(data.savedShishi) ? data.savedShishi : []);
            this.deadShishi = new Set(Array.isArray(data.deadShishi) ? data.deadShishi : []);
            this.currentSortKey = data.currentSortKey || 0;
            this.pendingSurvivalFailureDeaths = null;
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
                this.map.previousNodeId = data.map.previousNodeId !== undefined ? data.map.previousNodeId : null;
                this.map.previousFloor = data.map.previousFloor !== undefined ? data.map.previousFloor : 0;
                this.map.nodes = data.map.nodes || [];
                this.map.connections = data.map.connections || [];
                this.map.visitedEventIds = data.map.visitedEventIds || [];
            }

            // ショップ状態復元
            if (data.shop) {
                this.shop.goldSpentInShop = data.shop.goldSpentInShop || 0;
            } else {
                this.shop.goldSpentInShop = 0;
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
            } else if (savedScene === 'event_resolution') {
                // 歴史事件の結果表示時点で保存されたデータ: 結果画面をそのまま復元
                if (data.eventResolution) {
                    this.switchScreen('screen-event');
                    this.currentAdventureEvent = { result: data.eventResolution };
                    this.ui.renderEventResolution(data.eventResolution);
                } else {
                    this.returnToMap();
                }
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

    // ==========================================
    // 歴史事件：天命判定（運命の審判）システム
    // ==========================================

    startEventAdventure(eventData, baseChoice) {
        // 確率の算出
        const chances = this.calculateEventSuccessProbability(eventData, baseChoice);
        
        this.currentAdventureEvent = {
            event: eventData,
            baseChoice: baseChoice,
            chances: chances,
            result: null
        };

        // UIで天命判定（ルーレット／八卦演出）を開始
        if (this.ui && this.ui.renderEventFateRoll) {
            this.ui.renderEventFateRoll(this.currentAdventureEvent);
        } else {
            // UIがない場合は即座に判定
            this.resolveFateRollOutcome();
        }
    }

    calculateEventSuccessProbability(eventData, baseChoice) {
        // 直接指定のチェック
        let great = 25;
        let success = 60;
        let fail = 15;
        let riskCategory = 'orthodox';

        // 獲得する志士カードの陣営を判定（敵陣営の志士カード獲得か？）
        let targetsOpposingShishi = false;
        const actionStr = (baseChoice.action || '').toString();
        const effectText = `${baseChoice.effectDesc || ''}`;
        if (typeof GAME_DATA !== 'undefined' && GAME_DATA.cards) {
            for (const [cardId, card] of Object.entries(GAME_DATA.cards)) {
                if (card.type === 'shishi' && (actionStr.includes(`'${cardId}'`) || actionStr.includes(`"${cardId}"`) || effectText.includes(card.name) || (card.character && effectText.includes(card.character)))) {
                    if (card.faction && card.faction !== 'neutral' && card.faction !== this.faction) {
                        targetsOpposingShishi = true;
                        break;
                    }
                }
            }
        }

        // 歴史事件の優勢陣営（historicalAdvantage）を判定
        let historicalAdvantage = eventData.historicalAdvantage;
        if (!historicalAdvantage) {
            const evId = eventData.id || '';
            const evTitle = eventData.title || '';
            // 討幕派優勢な主要歴史事件
            if (/satcho|satsuma_decision|taisei_hokan|restoration_council|toba_fushimi|edo_opening|katsu_saigo|second_choshu|ueno_war|aizu_war|aizu_surrender|goryokaku|paris_expo|hyogo_armada/.test(evId) ||
                /薩長|大政奉還|王政復古|鳥羽・伏見|江戸開城|勝・西郷|四境戦争|第二次長州|上野戦争|会津戦争|会津降伏|五稜郭|版籍奉還|廃藩置県/.test(evTitle)) {
                historicalAdvantage = 'tobaku';
            } else if (/ikedaya|kinmon|first_choshu|august18|shinsengumi|mibu_drill|aburakoji|tenguto|teradaya_1862/.test(evId) ||
                /池田屋|禁門の変|第一次長州|八月十八日|新選組|壬生屯所|油小路|天狗党/.test(evTitle)) {
                historicalAdvantage = 'sabaku';
            }
        }

        // 敵側が有利な歴史事件で、プレイヤーがその反対陣営の場合
        const isOpposingHistoricalEvent = Boolean(historicalAdvantage && historicalAdvantage !== this.faction && historicalAdvantage !== 'neutral');

        if (baseChoice.chances && typeof baseChoice.chances.great === 'number') {
            great = baseChoice.chances.great;
            success = baseChoice.chances.success;
            fail = baseChoice.chances.fail;
            riskCategory = baseChoice.riskCategory || 'custom';
        } else if (baseChoice.riskCategory) {
            riskCategory = baseChoice.riskCategory;
        } else if (targetsOpposingShishi) {
            // 敵陣営の志士を獲得する選択は極めて困難な歴史の抗い
            riskCategory = 'defiance';
        } else if (baseChoice.isHistorical === false) {
            riskCategory = 'defiance';
        } else if (baseChoice.isHistorical === true) {
            riskCategory = 'orthodox';
        } else {
            // キーワード自動判定（defianceをsafeより優先して判定）
            const text = `${baseChoice.text} ${baseChoice.effectDesc || ''} ${eventData.title || ''}`;
            
            if (/旧勢力の完全排除|旧来の兵制を維持|武士の意地を通す|同盟を見送り|同盟を阻止|同盟破談|同盟拒否|盟約を見送り|鎖国を貫く|拒絶|拒否|破談|強硬に対峙|打ち払いを徹底|強硬論|断固拒否|旧態|頑として|歴史に抗う|懐柔を謀る|切り崩し/.test(text)) {
                // 🟠 歴史の抗い（反史実・if決断）
                riskCategory = 'defiance';
            } else if (/正面から|攻め込|攻め入|斬り込|迎え撃|抜刀|突入|突撃|砲撃|襲撃|死守|激戦|強行|突破|突進|暗殺|決死|打って出|決戦を挑|一戦を交|抗戦|徹底抗戦|蜂起|挙兵|ピストル|強襲|討ち入|玉砕|散華|決起|先陣|斬首|討滅|全砲門|電撃奇襲|仇を討つ|武力討幕/.test(text)) {
                // 🔴 逆境・無謀決戦
                riskCategory = 'reckless';
            } else if (/深入りを避け|脱出|静観|回避|退却|離脱|兵力を温存|戦力を温存|資金を温存|隠忍|不戦|武器を手放す|降伏勧告|平和的|流血を止め|恭順を受け入れ|無用な流血|兵糧を蓄える/.test(text)) {
                // 🛡️ 慎重・安全策
                riskCategory = 'safe';
            } else if (/買収|借款|商人|密貿易|密談|密議|情報|金|兵器|新式|潜入|調略|工作|裏手|武器を流|武器の調達|密使|談判|周旋|密命|裏取引/.test(text)) {
                // 🟡 謀略・周旋
                riskCategory = 'intrigue';
            } else {
                // 🟢 堅実・史実正道
                riskCategory = 'orthodox';
            }
        }

        // 敵対する歴史事件で史実に抗う選択の場合、カテゴリを強制的に defiance
        if (isOpposingHistoricalEvent && (riskCategory === 'defiance' || targetsOpposingShishi || baseChoice.isHistorical === false)) {
            riskCategory = 'defiance';
        }

        // カテゴリごとの基本確率（custom以外）
        if (riskCategory !== 'custom' && (!baseChoice.chances || typeof baseChoice.chances.great !== 'number')) {
            switch (riskCategory) {
                case 'safe':
                    great = 15;
                    success = 75;
                    fail = 10;
                    break;
                case 'orthodox':
                    great = 25;
                    success = 60;
                    fail = 15;
                    break;
                case 'intrigue':
                    great = 20;
                    success = 50;
                    fail = 30;
                    break;
                case 'defiance':
                    great = 10;
                    success = 35;
                    fail = 55;
                    break;
                case 'reckless':
                    great = 5;
                    success = 20;
                    fail = 75;
                    break;
                default:
                    great = 25;
                    success = 60;
                    fail = 15;
                    break;
            }
        }

        // 敵対する歴史事件において史実に抗う場合の追加ペナルティ（歴史の奔流への抵抗）
        if (isOpposingHistoricalEvent && (riskCategory === 'defiance' || targetsOpposingShishi || baseChoice.isHistorical === false)) {
            fail += 10;
            success = Math.max(15, success - 8);
            great = Math.max(5, great - 3);
        }

        // 敵側志士カードを獲得しようとする難関ペナルティ
        if (targetsOpposingShishi) {
            fail += 8;
            success = Math.max(15, success - 5);
            great = Math.max(5, great - 2);
        }

        // 呪いや大ダメージ（HP30以上損失）を伴う無謀・危険リスク補正
        const hasCurse = effectText.includes('呪い') || actionStr.includes('curse_');
        const hasHeavyDamage = /HPを?\s*(?:3[0-9]|[4-9][0-9])\s*失/.test(effectText) || /damagePlayer\((?:3[0-9]|[4-9][0-9])\)/.test(actionStr);
        if (hasCurse || hasHeavyDamage) {
            fail += 5;
            success = Math.max(10, success - 5);
        }

        // 志士ボーナス（関連志士所持による加護）
        let hasShishiBonus = false;
        if (baseChoice.shishiBonus) {
            const bonuses = Array.isArray(baseChoice.shishiBonus) ? baseChoice.shishiBonus : [baseChoice.shishiBonus];
            const found = bonuses.find(b => this.hasShishi(b.character || b.cardId));
            if (found) {
                hasShishiBonus = true;
                great += 10;
                success += 10;
                fail = Math.max(5, fail - 20);
            }
        }

        // 世論の追い風（自軍有利50%以上）または逆風（敵対陣営50%以上）
        const isPublicOpinionFavorable = (this.faction === 'tobaku' && this.publicOpinion >= 50) ||
                                         (this.faction === 'sabaku' && this.publicOpinion <= -50);
        const isPublicOpinionAdverse = (this.faction === 'tobaku' && this.publicOpinion <= -50) ||
                                       (this.faction === 'sabaku' && this.publicOpinion >= 50);

        if (isPublicOpinionFavorable) {
            great += 5;
            fail = Math.max(5, fail - 5);
        } else if (isPublicOpinionAdverse) {
            fail += 5;
            success = Math.max(10, success - 5);
        }

        // 確率の合計を100%に正規化
        const total = great + success + fail;
        great = Math.round((great / total) * 100);
        fail = Math.max(5, Math.round((fail / total) * 100));
        success = 100 - great - fail;

        // カテゴリ表示情報
        const categoryMeta = {
            safe: { label: "慎重・安全策", badgeClass: "badge-risk-safe" },
            orthodox: { label: "史実正道", badgeClass: "badge-risk-orthodox" },
            intrigue: { label: "謀略・周旋", badgeClass: "badge-risk-intrigue" },
            defiance: { label: "歴史の抗い", badgeClass: "badge-risk-defiance" },
            reckless: { label: "逆境・無謀決戦", badgeClass: "badge-risk-reckless" },
            custom: { label: "史実の決断", badgeClass: "badge-risk-orthodox" }
        }[riskCategory] || { label: "史実正道", badgeClass: "badge-risk-orthodox" };

        return {
            great,
            success,
            fail,
            totalSuccess: great + success,
            riskCategory,
            categoryLabel: categoryMeta.label,
            categoryBadgeClass: categoryMeta.badgeClass,
            hasShishiBonus,
            isPublicOpinionFavorable,
            isPublicOpinionAdverse
        };
    }

    resolveFateRollOutcome() {
        if (!this.currentAdventureEvent) return;
        const { event, baseChoice, chances } = this.currentAdventureEvent;

        const rand = Math.random() * 100;
        let outcome = 'success';

        if (rand < chances.great) {
            outcome = 'great';
        } else if (rand < chances.great + chances.success) {
            outcome = 'success';
        } else {
            outcome = 'failure';
        }

        const rewards = [];
        let stampText = '史実貫徹';
        let stampClass = 'grade-success';
        let titleText = '';
        let descText = '';

        // 志士ボーナス（選択前に所持していた志士による助勢）を事前に抽出
        const activeShishiBonuses = [];
        if (baseChoice.shishiBonus) {
            const bonuses = Array.isArray(baseChoice.shishiBonus) ? baseChoice.shishiBonus : [baseChoice.shishiBonus];
            bonuses.forEach(b => {
                if (this.hasShishi(b.character || b.cardId)) {
                    activeShishiBonuses.push(b);
                }
            });
        }

        try {
            if (outcome === 'great') {
                stampText = '大業成就';
                stampClass = 'grade-great';
                titleText = '【大業成就】天命を掴み、歴史の偉業を成し遂げた！';
                descText = '周到な決断と天の加護により、一切の損失を出すことなく完全なる勝利を達成！新たな志士が心服して軍列に加わり、天下に名声が轟いた！';

                // アクション実行（ダメージ無効化インターセプト）
                this.executeBaseActionForOutcome(baseChoice, 'great');

                // 事前所持していた志士の助勢ボーナスを適用
                activeShishiBonuses.forEach(b => {
                    if (typeof b.apply === 'function') b.apply(this);
                    rewards.push({ icon: '🌟', text: `志士の助勢: ${b.desc}` });
                });

                // 大成功ボーナス
                this.gold += 25;
                this.nextBattleStrengthBuff = (this.nextBattleStrengthBuff || 0) + 3;
                this.maxHp += 2;
                this.healPlayer(2);

                const opinionBonus = this.faction === 'tobaku' ? 5 : -5;
                this.modifyPublicOpinion(opinionBonus);

                if (baseChoice.isSurvivalRoute) {
                    if (Array.isArray(baseChoice.targetShishi)) {
                        baseChoice.targetShishi.forEach(cId => {
                            this.markShishiSurvived(cId);
                        });
                    }
                    rewards.unshift({ icon: '🕊️', text: `<strong>【史実改変・生存達成】</strong>志士の死線を乗り越え、歴史の運命を覆しました！` });
                }

                rewards.push({ icon: '🏆', text: `大業達成！志士カードを仲間に迎え入れました！` });
                rewards.push({ icon: '✨', text: `天佑神助: 被ダメージを完全無効化（無傷達成）！` });
                rewards.push({ icon: '💰', text: `追加の報奨金: 軍資金 <strong class="reward-highlight">+25両</strong> を獲得！` });
                rewards.push({ icon: '🔥', text: `士気高揚: 次の戦闘の <strong class="reward-highlight">攻撃力 +3</strong> ＆ 最大HP <strong class="reward-highlight">+2</strong>！` });
                rewards.push({ icon: '⚖️', text: `天下の大勢が自軍へさらに傾斜しました！` });

            } else if (outcome === 'success') {
                stampText = '史実貫徹';
                stampClass = 'grade-success';
                titleText = '【史実貫徹】史実の波乱を乗り越え、作戦は成就した';
                descText = '様々な困難や代償に直面しながらも、覚悟を決めた行動によって史実通りの成果を掴み取った。新たな志士が頼もしい味方として合流した！';

                // アクション通常実行
                this.executeBaseActionForOutcome(baseChoice, 'success');

                // 事前所持していた志士の助勢ボーナスを適用
                activeShishiBonuses.forEach(b => {
                    if (typeof b.apply === 'function') b.apply(this);
                    rewards.push({ icon: '🌟', text: `志士の助勢: ${b.desc}` });
                });

                // 生存ルート達成表示
                if (baseChoice.isSurvivalRoute) {
                    if (Array.isArray(baseChoice.targetShishi)) {
                        baseChoice.targetShishi.forEach(cId => {
                            this.markShishiSurvived(cId);
                        });
                    }
                    rewards.unshift({ icon: '🕊️', text: `<strong>【史実改変・生存達成】</strong>志士の死線を乗り越え、歴史の運命を覆しました！` });
                }

                // 基本世論変動
                const opinionVal = typeof baseChoice.opinionChange === 'function' ? baseChoice.opinionChange(this) : baseChoice.opinionChange;
                if (typeof opinionVal === 'number' && opinionVal !== 0) {
                    this.modifyPublicOpinion(opinionVal);
                    const facName = opinionVal > 0 ? '討幕' : '佐幕';
                    rewards.push({ icon: '⚖️', text: `世論が <strong class="reward-highlight">${facName}</strong> へ傾斜しました。` });
                }

                // 敵陣営の志士を獲得した場合の判定
                const actionStr = (baseChoice.action || '').toString();
                const effectText = `${baseChoice.effectDesc || ''}`;
                let acquiredOpposingShishi = null;
                if (typeof GAME_DATA !== 'undefined' && GAME_DATA.cards) {
                    for (const [cardId, card] of Object.entries(GAME_DATA.cards)) {
                        if (card.type === 'shishi' && (actionStr.includes(`'${cardId}'`) || actionStr.includes(`"${cardId}"`) || effectText.includes(card.name) || (card.character && effectText.includes(card.character)))) {
                            if (card.faction && card.faction !== 'neutral' && card.faction !== this.faction) {
                                acquiredOpposingShishi = card;
                                break;
                            }
                        }
                    }
                }

                if (acquiredOpposingShishi) {
                    // 選択肢自体にダメージや呪い等の強烈なデバフが定義されていない場合のセーフティネット
                    const hadDamage = actionStr.includes('damagePlayer');
                    const hadCurse = actionStr.includes('curse_') || effectText.includes('呪い');
                    if (!hadDamage) {
                        this.damagePlayer(25);
                        this.maxHp = Math.max(20, this.maxHp - 5);
                        rewards.push({ icon: '⚡', text: `<span class="penalty">敵陣志士登用の代償: 陣営内の猛烈な反発と内紛により HP 25喪失 ＆ 最大HP -5！</span>` });
                    }
                    if (!hadCurse) {
                        this.addCardToDeck('curse_betrayal');
                        rewards.push({ icon: '☠️', text: `<span class="penalty">猜疑の影: 味方の不信により呪いカード『家臣の寝返り』がデッキに混入！</span>` });
                    }
                    rewards.push({ icon: '⚠️', text: `<span class="penalty">【敵対志士登用】天下を揺るがす異例の登用により、自軍内部に強烈な波紋が広がりました。</span>` });
                }

                rewards.push({ icon: '⭕', text: `史実通りの成果を達成！志士カードを獲得しました。` });

            } else {
                // 失敗 (failure)
                stampText = '作戦失敗';
                stampClass = 'grade-failure';
                titleText = '【作戦失敗】敵の策に嵌まり、手痛い打撃を受けた…';
                descText = '作戦は完全に敵に看破されていた！予期せぬ伏兵と混乱により、志士の迎え入れは叶わず、深手を負って命からがら現場を脱出した…！';

                // 志士獲得を阻止してアクション実行
                this.executeBaseActionForOutcome(baseChoice, 'failure');

                // 生存ルート選択肢での失敗：救出失敗・即座に死亡
                if (baseChoice.isSurvivalRoute && Array.isArray(baseChoice.targetShishi)) {
                    const deadNow = [];
                    baseChoice.targetShishi.forEach(cId => {
                        const res = this.killShishi(cId, '救出作戦失敗により死線にて落命', event?.title);
                        if (res) deadNow.push(res);
                    });
                    rewards.unshift({ icon: '🥀', text: `<span class="penalty">【救出失敗】志士の命を救うことができず、無念の落命となりました（山札から消滅・以降入手不可）。</span>` });
                    if (deadNow.length > 0) {
                        this.pendingSurvivalFailureDeaths = deadNow;
                        // 結末画面表示の直後に落命報告ウィンドウを自動表示
                        setTimeout(() => {
                            if (this.ui && this.ui.showShishiDeathModal && this.pendingSurvivalFailureDeaths) {
                                const list = this.pendingSurvivalFailureDeaths;
                                this.pendingSurvivalFailureDeaths = null;
                                this.ui.showShishiDeathModal(list);
                            }
                        }, 600);
                    }
                }

                // 失敗ペナルティの適用
                const baseActionStr = (baseChoice.action || '').toString();
                const hadDamage = baseActionStr.includes('damagePlayer');
                const penaltyDmg = hadDamage ? 0 : 15; // 元のダメージがなければペナルティ15
                if (penaltyDmg > 0) {
                    this.damagePlayer(penaltyDmg);
                }

                const lostGold = Math.min(this.gold, 15);
                this.gold -= lostGold;

                // 世論悪化（敵対陣営へ傾斜）
                const adverseOpinion = this.faction === 'tobaku' ? -5 : 5;
                this.modifyPublicOpinion(adverseOpinion);

                rewards.push({ icon: '❌', text: `<span class="penalty">志士の登用ならず: 作戦失敗により志士カードは獲得できませんでした。</span>` });
                const dmgText = penaltyDmg > 0 ? `HP ${penaltyDmg}` : '史実の激闘ダメージ';
                rewards.push({ icon: '⚔️', text: `深手の痛手として <span class="penalty">${dmgText}</span> を消費` });
                if (lostGold > 0) {
                    rewards.push({ icon: '💸', text: `混乱による散逸: 軍資金 <span class="penalty">-${lostGold}両</span>` });
                }
                rewards.push({ icon: '⚠️', text: `作戦失敗の動揺により世論が不利に傾斜しました。` });
            }
        } catch (err) {
            console.error("[Fate roll resolution error]", err);
        }

        this.ui.updateHeader();

        // サウンド
        if (window.soundSystem) {
            if (outcome === 'great' && window.soundSystem.playVictory) {
                window.soundSystem.playVictory();
            } else if (outcome === 'success' && window.soundSystem.playTaiko) {
                window.soundSystem.playTaiko(true);
            } else if (outcome === 'failure') {
                if (window.soundSystem.playFailure) {
                    window.soundSystem.playFailure();
                } else if (window.soundSystem.playWarning) {
                    window.soundSystem.playWarning();
                }
            }
        }

        const resultData = {
            outcome,
            stampText,
            stampClass,
            titleText,
            descText,
            rewards
        };

        this.currentAdventureEvent.result = resultData;

        // 選択後の結果が表示された時点で即座に自動保存（リセマラ・リロードやり直し防止）
        this.saveRun('event_resolution');

        if (this.ui && this.ui.renderEventResolution) {
            this.ui.renderEventResolution(resultData);
        }
    }

    executeBaseActionForOutcome(baseChoice, outcome) {
        if (!baseChoice || !baseChoice.action) return;

        const origAddCard = this.addCardToDeck.bind(this);
        const origDamage = this.damagePlayer.bind(this);
        const origMarkSurvived = this.markShishiSurvived.bind(this);
        const origObtainRelic = this.obtainRandomRelic ? this.obtainRandomRelic.bind(this) : null;
        const origRemovalModal = this.openCardRemovalModal ? this.openCardRemovalModal.bind(this) : null;
        let origPlayFanfare = null;
        let origPlayVictory = null;

        if (outcome === 'great') {
            // 大成功: HPダメージを完全無効化
            this.damagePlayer = (amount) => {
                // ダメージ無効化
            };
        } else if (outcome === 'failure') {
            // 失敗: 志士カードの獲得、生存確定、レリック入手、カード削除モーダルを完全ブロック！
            this.addCardToDeck = (cardId) => {
                // 志士獲得を阻止
            };
            this.markShishiSurvived = (cardId) => {
                // 失敗時は生存確定を完全阻止！
            };
            if (origObtainRelic) {
                this.obtainRandomRelic = () => { /* ブロック */ };
            }
            if (origRemovalModal) {
                this.openCardRemovalModal = () => { /* ブロック */ };
            }
            // 失敗時はアクション内のファンファーレ・勝利音も完全にブロック！
            if (window.soundSystem) {
                origPlayFanfare = window.soundSystem.playFanfare;
                origPlayVictory = window.soundSystem.playVictory;
                window.soundSystem.playFanfare = () => {};
                window.soundSystem.playVictory = () => {};
            }
        }

        try {
            baseChoice.action(this);
        } finally {
            this.addCardToDeck = origAddCard;
            this.damagePlayer = origDamage;
            this.markShishiSurvived = origMarkSurvived;
            if (origObtainRelic) this.obtainRandomRelic = origObtainRelic;
            if (origRemovalModal) this.openCardRemovalModal = origRemovalModal;
            if (window.soundSystem) {
                if (origPlayFanfare) window.soundSystem.playFanfare = origPlayFanfare;
                if (origPlayVictory) window.soundSystem.playVictory = origPlayVictory;
            }
        }
    }

    finishEventAndReturnToMap() {
        this.currentAdventureEvent = null;
        this.returnToMap();
        if (this.pendingSurvivalFailureDeaths && this.pendingSurvivalFailureDeaths.length > 0) {
            const deadList = this.pendingSurvivalFailureDeaths;
            this.pendingSurvivalFailureDeaths = null;
            if (this.ui && this.ui.showShishiDeathModal) {
                this.ui.showShishiDeathModal(deadList);
            }
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
