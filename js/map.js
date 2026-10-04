/**
 * 幕末風雲録：双極の蒼穹 - Rogue Deck-Build -
 * ローグライト・マップ生成＆進行エンジン
 */

class MapSystem {
    constructor(app) {
        this.app = app;
        this.currentAct = 1;
        this.currentFloor = 0;
        this.currentNodeId = null;
        this.previousNodeId = null;
        this.previousFloor = 0;
        this.nodes = [];
        this.connections = []; // [[fromId, toId]]
        this.visitedEventIds = [];

        this.actNames = {
            1: "第一幕：京洛動乱（京都・伏見）",
            2: "第二幕：東海道進撃（箱根・関所突破）",
            3: "終幕：天下分け目の決戦（江戸城・京都御所）"
        };
    }

    generateAct(actNumber) {
        this.currentAct = actNumber;
        this.currentFloor = 0;
        this.currentNodeId = null;
        this.previousNodeId = null;
        this.previousFloor = 0;
        this.nodes = [];
        this.connections = [];

        // 世論（トレンド）を新幕ごとにランダム決定
        const trend = GAME_DATA.trends[Math.floor(Math.random() * GAME_DATA.trends.length)];
        this.app.currentTrend = trend;

        // 長編ローグライト階層数定義:
        // Act 1〜3: 各幕 18階層 ＋ 幕ボス（Floor 18） = 全19階層 (Floor 0〜18)
        const floorCount = 18;

        // Floor 0:
        // 第一幕: 志士を入手できる歴史事件（開始地点 3分岐確定）
        // 第二幕・終幕: 戦場（開始地点 3分岐）
        const f0Nodes = [];
        const f0Count = 3;

        if (actNumber === 1) {
            for (let i = 0; i < f0Count; i++) {
                const id = `act${actNumber}_f0_n${i}`;
                const node = {
                    id,
                    floor: 0,
                    col: i,
                    type: 'event',
                    title: '歴史事件',
                    icon: '📜',
                    eventId: null,
                    completed: false
                };
                this.nodes.push(node);
                f0Nodes.push(node);
            }
        } else {
            // 第二幕、終幕の最初に選択するコマは戦場
            for (let i = 0; i < f0Count; i++) {
                const id = `act${actNumber}_f0_n${i}`;
                const node = {
                    id,
                    floor: 0,
                    col: i,
                    type: 'battle',
                    title: '戦場',
                    icon: '⚔️',
                    eventId: null,
                    completed: false
                };
                this.nodes.push(node);
                f0Nodes.push(node);
            }
        }

        let prevFloorNodes = f0Nodes;

        // Floor 1 〜 floorCount - 1 の戦略的長編ノード網生成
        for (let f = 1; f < floorCount; f++) {
            const fNodes = [];
            // 歴史の関門フロア（不可避の重大事件合流地点）
            const chokeFloor = 10;

            // ボス直前フロアは2分岐（休息＆商人）、山場（f=6, f=13）は3分岐、関門（chokeFloor）は1合流、他は2〜3分岐
            let colCount = 2;
            if (f === chokeFloor) {
                colCount = 1;
            } else if (f === floorCount - 1) {
                colCount = 2;
            } else if (f === 6 || f === 13) {
                colCount = 3;
            } else {
                colCount = (Math.random() < 0.6) ? 3 : 2;
            }

            for (let c = 0; c < colCount; c++) {
                let type = 'battle';
                let icon = '⚔️';
                let title = '戦場';
                let isChokepoint = false;

                // --- 階層設計（歴史事件の体験を拡充した18層戦略配分） ---
                if (f === chokeFloor) {
                    // 歴史の関門: 全ルートが必ず通過する重大歴史特異点
                    type = 'event';
                    icon = '⛩️';
                    title = '歴史の関門';
                    isChokepoint = true;
                } else if (f === floorCount - 1) {
                    // ボス直前フロア: 本陣休息または洋行商人
                    if (c === 0) {
                        type = 'rest';
                        icon = '🍵';
                        title = '本陣休息';
                    } else {
                        type = 'shop';
                        icon = '💰';
                        title = '洋行商人';
                    }
                } else if (f === 6) {
                    // 前半の山場: 武器庫（宝箱）または 強敵（エリート）または 歴史事件
                    if (c === 0) {
                        type = 'treasure';
                        icon = '🎁';
                        title = '武器庫';
                    } else if (c === 1) {
                        type = 'elite';
                        icon = '👹';
                        title = '強敵（刺客）';
                    } else {
                        type = 'event';
                        icon = '📜';
                        title = '歴史事件';
                    }
                } else if (f === 7) {
                    // 前半山場直後の休息または歴史事件
                    if (c === 0) {
                        type = 'rest';
                        icon = '🍵';
                        title = '茶屋休息';
                    } else {
                        type = 'event';
                        icon = '📜';
                        title = '歴史事件';
                    }
                } else if (f === 13) {
                    // 後半の山場: 武器庫（宝箱）または 強敵（エリート）または 歴史事件
                    if (c === 0) {
                        type = 'treasure';
                        icon = '🎁';
                        title = '武器庫';
                    } else if (c === 1) {
                        type = 'elite';
                        icon = '👹';
                        title = '強敵（刺客）';
                    } else {
                        type = 'event';
                        icon = '📜';
                        title = '歴史事件';
                    }
                } else if (f === 14) {
                    // 後半山場直後の休息または歴史事件
                    if (c === 0) {
                        type = 'rest';
                        icon = '🍵';
                        title = '茶屋休息';
                    } else {
                        type = 'event';
                        icon = '📜';
                        title = '歴史事件';
                    }
                } else if (f === 15) {
                    // 終盤の難所: 強敵（エリート）または歴史事件・商人
                    if (c === 0) {
                        type = 'elite';
                        icon = '👹';
                        title = '強敵（刺客）';
                    } else if (c === 1) {
                        type = 'event';
                        icon = '📜';
                        title = '歴史事件';
                    } else {
                        type = 'shop';
                        icon = '💰';
                        title = '洋行商人';
                    }
                } else if (f === 4 || f === 9 || f === 16) {
                    // 商人・休息・歴史事件の寄り道フロア
                    if (c === 0) {
                        type = 'shop';
                        icon = '💰';
                        title = '洋行商人';
                    } else if (c === 1) {
                        type = 'event';
                        icon = '📜';
                        title = '歴史事件';
                    } else {
                        type = 'battle';
                        icon = '⚔️';
                        title = '戦場';
                    }
                } else if (f <= 3) {
                    // 序盤フロア (f === 1, 2, 3): 戦場と歴史事件が選べる構成
                    const rand = Math.random();
                    if (rand < 0.45) {
                        type = 'event';
                        icon = '📜';
                        title = '歴史事件';
                    } else if (rand < 0.85) {
                        type = 'battle';
                        icon = '⚔️';
                        title = '戦場';
                    } else {
                        type = 'rest';
                        icon = '🍵';
                        title = '茶屋休息';
                    }
                } else {
                    // 一般フロア: 歴史事件の遭遇率を高めた多彩な分岐網
                    const rand = Math.random();
                    if (rand < 0.45) {
                        type = 'event';
                        icon = '📜';
                        title = '歴史事件';
                    } else if (rand < 0.75) {
                        type = 'battle';
                        icon = '⚔️';
                        title = '戦場';
                    } else if (rand < 0.87) {
                        type = 'shop';
                        icon = '💰';
                        title = '洋行商人';
                    } else if (rand < 0.95) {
                        type = 'rest';
                        icon = '🍵';
                        title = '茶屋休息';
                    } else {
                        type = 'elite';
                        icon = '👹';
                        title = '強敵（刺客）';
                    }
                }

                const id = `act${actNumber}_f${f}_n${c}`;
                const node = {
                    id,
                    floor: f,
                    col: c,
                    type,
                    title,
                    icon,
                    isChokepoint,
                    completed: false
                };
                this.nodes.push(node);
                fNodes.push(node);
            }

            // 前フロアからの接続（必ず1本以上繋がり、交差・孤立を避ける）
            prevFloorNodes.forEach((pn, pIndex) => {
                fNodes.forEach((fn, fIndex) => {
                    if (Math.abs(pIndex - fIndex) <= 1 || fNodes.length === 1 || prevFloorNodes.length === 1) {
                        this.connections.push([pn.id, fn.id]);
                    }
                });
            });

            // 孤立したfNodesがないか確認し、あれば最も近いノードに接続
            fNodes.forEach((fn, fIndex) => {
                const connected = this.connections.some(c => c[1] === fn.id);
                if (!connected) {
                    const nearestPrev = prevFloorNodes[Math.min(fIndex, prevFloorNodes.length - 1)];
                    this.connections.push([nearestPrev.id, fn.id]);
                }
            });

            prevFloorNodes = fNodes;
        }

        // 最終フロア: ボスノード
        const bossId = `act${actNumber}_boss`;
        const isFinal = (actNumber === 3);
        const bossNode = {
            id: bossId,
            floor: floorCount,
            col: 0,
            type: 'boss',
            title: isFinal ? '【最終決戦】天下統一の陣' : '【幕末の決戦】大陣',
            icon: '🏯',
            isFinalBoss: isFinal,
            completed: false
        };
        this.nodes.push(bossNode);

        // 直前フロアの全ノードからボスへ接続
        prevFloorNodes.forEach(pn => {
            this.connections.push([pn.id, bossId]);
        });

        // 全歴史イベントノードを時系列順（発生年月の昇順）に割り当て
        this.assignChronologicalEvents(actNumber);

        // 志士条件付きマス（鍵付きマス）の設定および迂回ルートの確実な保証（ソフトロック防止）
        this.setupShishiRequirementsAndBypasses(actNumber);
    }

    setupShishiRequirementsAndBypasses(actNumber) {
        const faction = this.app ? this.app.faction : 'tobaku';

        // 1. ノードへの志士条件付与
        this.nodes.forEach(node => {
            node.requiredShishi = null;
            // 関門ノード、Floor 0（開始地点）、ボスノードには絶対に鍵をかけない（安全原則）
            if (node.isChokepoint || node.floor === 0 || node.type === 'boss') return;

            if (node.type === 'event' && node.eventId) {
                const event = GAME_DATA.events.find(e => e.id === node.eventId);
                if (event && event.mapShishiRequirement) {
                    const req = event.mapShishiRequirement[faction] || event.mapShishiRequirement.common;
                    if (req && Array.isArray(req) && req.length > 0) {
                        node.requiredShishi = req;
                    }
                }
            }
        });

        // 2. フロア単位での迂回ノード存在保証（各フロアで最低1つは鍵なしノードが存在すること）
        const maxFloor = Math.max(...this.nodes.map(n => n.floor));
        for (let f = 1; f < maxFloor; f++) {
            const fNodes = this.nodes.filter(n => n.floor === f);
            if (fNodes.length <= 1) {
                // 1本道ノードは絶対に鍵を解除（安全原則）
                fNodes.forEach(n => n.requiredShishi = null);
                continue;
            }

            const unblocked = fNodes.filter(n => !n.requiredShishi || n.requiredShishi.length === 0);
            if (unblocked.length === 0) {
                // 全ノードが鍵付きの場合は、1番目のノードの鍵を解除して迂回ルートを確保
                fNodes[0].requiredShishi = null;
            }
        }

        // 3. 接続単位での迂回ルート保証（前フロアのどのノードからも、少なくとも1つの非鍵ノードへ進めること）
        for (let f = 0; f < maxFloor; f++) {
            const currentFloorNodes = this.nodes.filter(n => n.floor === f);
            const nextFloorNodes = this.nodes.filter(n => n.floor === f + 1);
            const unblockedNext = nextFloorNodes.filter(n => !n.requiredShishi || n.requiredShishi.length === 0);

            if (unblockedNext.length === 0) continue; // 次がボス等の場合

            currentFloorNodes.forEach(pn => {
                const connectedTargets = this.connections
                    .filter(c => c[0] === pn.id)
                    .map(c => c[1]);

                const hasUnblockedTarget = unblockedNext.some(un => connectedTargets.includes(un.id));

                if (!hasUnblockedTarget) {
                    // 鍵なしノードへの接続がない場合、最も近い非鍵ノードへ接続線を追加
                    const nearestUnblocked = unblockedNext.reduce((prev, curr) => {
                        return Math.abs(curr.col - pn.col) < Math.abs(prev.col - pn.col) ? curr : prev;
                    }, unblockedNext[0]);

                    this.connections.push([pn.id, nearestUnblocked.id]);
                }
            });
        }
    }

    isNodeAccessible(node) {
        if (!node) return false;
        if (!node.requiredShishi || node.requiredShishi.length === 0) return true;
        if (!this.app || !this.app.hasAllShishi) return true;
        return this.app.hasAllShishi(node.requiredShishi);
    }

    getSelectableNodes() {
        if (this.currentNodeId === null) {
            // 開始時：Floor 0の全ノードが選択可能
            return this.nodes.filter(n => n.floor === 0);
        }

        // 現在ノードから接続されている次フロアのノード
        const connectedTargetIds = this.connections
            .filter(c => c[0] === this.currentNodeId)
            .map(c => c[1]);

        return this.nodes.filter(n => connectedTargetIds.includes(n.id) && !n.completed);
    }

    visitNode(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return;

        // 志士条件未達の鍵付きノードには進入不可
        if (!this.isNodeAccessible(node)) {
            const reqNames = (node.requiredShishi || []).map(k => this.app.getShishiDisplayName(k)).join('・');
            if (this.app.ui && this.app.ui.showToast) {
                this.app.ui.showToast(`🔒 志士【${reqNames}】が揃っていないため進入できません！迂回ルート（他のマス）を選択してください。`, 'warning');
            } else {
                alert(`🔒 志士【${reqNames}】が揃っていないため進入できません！迂回ルートを選択してください。`);
            }
            if (window.soundSystem && window.soundSystem.playWarning) {
                window.soundSystem.playWarning();
            }
            return;
        }

        this.previousNodeId = this.currentNodeId;
        this.previousFloor = this.currentFloor;

        this.currentNodeId = nodeId;
        this.currentFloor = node.floor;
        node.completed = true;

        // --- 志士死亡判定（通過・迂回および年代経過） ---
        if (node.sortKey) {
            this.app.currentSortKey = Math.max(this.app.currentSortKey || 0, node.sortKey);
        }

        const deathsToTrigger = [];

        // 1. 通過・迂回されたイベントノードの判定
        // （現在のフロア以下の未完了イベントマスで、今回選ばれなかったマス）
        const skippedEventNodes = this.nodes.filter(n =>
            n.type === 'event' &&
            !n.completed &&
            n.id !== nodeId &&
            n.floor <= this.currentFloor
        );

        skippedEventNodes.forEach(sn => {
            if (sn.eventId && GAME_DATA.shishiDeaths) {
                Object.values(GAME_DATA.shishiDeaths).forEach(deathDef => {
                    if (deathDef.eventId === sn.eventId) {
                        const cId = deathDef.cardId;
                        if (!this.app.isShishiSaved(cId) && !this.app.isShishiDead(cId)) {
                            deathsToTrigger.push({
                                cardId: cId,
                                reason: `歴史事件『${sn.shortTitle || sn.title || deathDef.eventTitle}』の地を通過したため、史実の運命により落命`,
                                eventTitle: sn.shortTitle || sn.title || deathDef.eventTitle
                            });
                        }
                    }
                });
            }
        });

        // 2. 年代経過（currentSortKey）による死亡判定
        if (this.app.currentSortKey && GAME_DATA.shishiDeaths) {
            Object.values(GAME_DATA.shishiDeaths).forEach(deathDef => {
                const cId = deathDef.cardId;
                if (deathDef.deathSortKey && deathDef.deathSortKey < this.app.currentSortKey) {
                    if (!this.app.isShishiSaved(cId) && !this.app.isShishiDead(cId)) {
                        if (!deathsToTrigger.some(d => d.cardId === cId)) {
                            const y = deathDef.deathYear || deathDef.year || Math.floor((deathDef.deathSortKey || 0) / 100);
                            const m = deathDef.deathMonth || deathDef.month || ((deathDef.deathSortKey || 0) % 100);
                            deathsToTrigger.push({
                                cardId: cId,
                                reason: `史実の年月（${y}年${m}月）を経過したため落命`,
                                eventTitle: deathDef.eventTitle
                            });
                        }
                    }
                }
            });
        }

        // 死亡処理実行（プレイヤー所持カードが落命した場合はモーダル表示＆デッキ除外）
        if (deathsToTrigger.length > 0) {
            this.app.handleShishiDeaths(deathsToTrigger);
        }

        window.soundSystem.playTaiko(false);

        // ノード突入時の進行状況自動セーブ
        if (this.app.saveRun) {
            this.app.saveRun(node.type);
        }

        // ノード種別に応じたシーン起動
        switch (node.type) {
            case 'battle':
            case 'elite':
            case 'boss':
                this.launchBattle(node);
                break;
            case 'treasure':
                this.launchTreasure(node);
                break;
            case 'event':
                this.launchEvent(node);
                break;
            case 'shop':
                this.app.shop.openShop();
                break;
            case 'rest':
                this.app.shop.openRestSite();
                break;
        }
    }

    revertToPreviousNode() {
        const currentNode = this.nodes.find(n => n.id === this.currentNodeId);
        if (currentNode) {
            currentNode.completed = false;
        }
        this.currentNodeId = this.previousNodeId;
        this.currentFloor = (this.previousFloor !== undefined && this.previousFloor !== null)
            ? this.previousFloor
            : (this.currentNodeId ? (this.nodes.find(n => n.id === this.currentNodeId)?.floor || 0) : 0);
    }

    launchTreasure(node) {
        const modal = document.getElementById('modal-treasure');
        const container = document.getElementById('treasure-rewards-container');
        const claimBtn = document.getElementById('btn-claim-treasure');

        if (!modal || !container || !claimBtn) {
            this.app.obtainRandomRelic();
            this.app.returnToMap();
            return;
        }

        container.innerHTML = '';

        // 獲得報酬の決定: レリック（未所持があれば優先）＋ 資金 40〜70両
        const availableRelicId = this.app.getAvailableRandomRelic();
        let relicObtained = null;
        if (availableRelicId) {
            relicObtained = GAME_DATA.relics[availableRelicId];
            this.app.obtainRelic(availableRelicId);
        }

        const goldBonus = 40 + Math.floor(Math.random() * 31);
        this.app.gold += goldBonus;
        this.app.ui.updateHeader();

        if (window.soundSystem) {
            window.soundSystem.playVictory();
        }

        if (relicObtained) {
            const relicEl = document.createElement('div');
            relicEl.className = 'treasure-reward-item';
            relicEl.innerHTML = `
                <div class="treasure-reward-icon">🏮</div>
                <div class="treasure-reward-info">
                    <div class="treasure-reward-title">【秘蔵遺物】${relicObtained.name}</div>
                    <div class="treasure-reward-desc">${relicObtained.desc}</div>
                </div>
            `;
            container.appendChild(relicEl);
        }

        const goldEl = document.createElement('div');
        goldEl.className = 'treasure-reward-item';
        goldEl.innerHTML = `
            <div class="treasure-reward-icon">💰</div>
            <div class="treasure-reward-info">
                <div class="treasure-reward-title">軍資金 ${goldBonus} 両</div>
                <div class="treasure-reward-desc">葛篭の底から小判の包みを発見した！</div>
            </div>
        `;
        container.appendChild(goldEl);

        modal.classList.add('active');

        // 退出ハンドラー
        const handleClaim = () => {
            modal.classList.remove('active');
            claimBtn.removeEventListener('click', handleClaim);
            this.app.returnToMap();
        };
        claimBtn.addEventListener('click', handleClaim);
    }

    shuffleArray(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    getShishiEventsForAct(actNumber) {
        const actEvents = GAME_DATA.events.filter(e => {
            if (Array.isArray(e.act)) return e.act.includes(actNumber);
            return e.act === actNumber;
        });

        // 志士を入手できる選択肢を持つイベントを抽出
        const shishiEvents = actEvents.filter(e => {
            return (e.choices || []).some(c => {
                if (!c.action) return false;
                const code = c.action.toString();
                return code.includes('addCardToDeck');
            });
        });

        // 自陣営向け選択肢を含むものを優先ソート
        const faction = this.app.faction;
        if (faction) {
            shishiEvents.sort((a, b) => {
                const aFav = (a.choices || []).some(c => c.faction === faction || !c.faction);
                const bFav = (b.choices || []).some(c => c.faction === faction || !c.faction);
                return (bFav ? 1 : 0) - (aFav ? 1 : 0);
            });
        }

        return shishiEvents.length > 0 ? shishiEvents : actEvents;
    }

    getChronologicalEventsForAct(actNumber) {
        const actEvents = GAME_DATA.events.filter(e => {
            if (Array.isArray(e.act)) return e.act.includes(actNumber);
            return e.act === actNumber;
        });
        // 史実発生年月順（sortKey = year * 100 + month）に昇順ソート
        actEvents.sort((a, b) => (a.sortKey || 0) - (b.sortKey || 0));
        return actEvents;
    }

    // 必ず通る関門（チョークポイント）に割り当てる重大歴史事件の定義
    static get CHOKEPOINT_EVENTS() {
        return {
            1: 'event_august_coup',         // 第一幕関門: 八月十八日の政変、都の転換 (186308)
            2: 'event_second_choshu_war',   // 第二幕関門: 第二次長州征討、四境戦争の激闘 (186606)
            3: 'event_aizu_war'             // 終幕関門: 会津戦争、白虎の決意 (186808)
        };
    }

    static get ALL_CHOKEPOINT_EVENT_IDS() {
        return new Set(Object.values(MapSystem.CHOKEPOINT_EVENTS));
    }

    assignChronologicalEvents(actNumber) {
        const actEvents = this.getChronologicalEventsForAct(actNumber);
        if (actEvents.length === 0) return;

        const faction = this.app ? this.app.faction : null;
        const allChokeEventIds = MapSystem.ALL_CHOKEPOINT_EVENT_IDS;
        const chokeId = MapSystem.CHOKEPOINT_EVENTS[actNumber];
        const chokeEvent = actEvents.find(e => e.id === chokeId);
        const chokeSortKey = chokeEvent ? (chokeEvent.sortKey || 0) : 999999;

        // プレイヤー所持志士のうち、まだ生存確定・死亡していない志士の死亡イベントを抽出
        const ownedCardIds = new Set(this.app && this.app.deck ? this.app.deck : []);
        const urgentDeathEvents = [];
        const allDeathEventIds = new Set(
            GAME_DATA.shishiDeaths ? Object.values(GAME_DATA.shishiDeaths).map(d => d.eventId) : []
        );
        if (GAME_DATA.shishiDeaths) {
            Object.values(GAME_DATA.shishiDeaths).forEach(d => {
                if (ownedCardIds.has(d.cardId) && !this.app.isShishiSaved(d.cardId) && !this.app.isShishiDead(d.cardId)) {
                    const ev = actEvents.find(e => e.id === d.eventId);
                    if (ev) urgentDeathEvents.push(ev);
                }
            });
        }

        // イベントノードをフロアごとにグループ化（フロア順に厳格配置）
        const eventNodesByFloor = {};
        this.nodes.filter(n => n.type === 'event').forEach(node => {
            if (!eventNodesByFloor[node.floor]) eventNodesByFloor[node.floor] = [];
            eventNodesByFloor[node.floor].push(node);
        });

        const floors = Object.keys(eventNodesByFloor).map(Number).sort((a, b) => a - b);
        const assignedIds = new Set();
        allChokeEventIds.forEach(id => assignedIds.add(id));

        const chokepointFloor = floors.find(f => eventNodesByFloor[f].some(n => n.isChokepoint));

        let currentMinSortKey = 0;

        floors.forEach(f => {
            const nodesOnFloor = eventNodesByFloor[f];

            nodesOnFloor.forEach(node => {
                let selectedEvent = null;

                if (node.isChokepoint) {
                    selectedEvent = chokeEvent;
                } else {
                    const isBeforeChoke = chokepointFloor !== undefined && f < chokepointFloor;
                    const isAfterChoke = chokepointFloor !== undefined && f > chokepointFloor;

                    const minKey = isAfterChoke ? Math.max(currentMinSortKey, chokeSortKey) : currentMinSortKey;
                    const maxKey = isBeforeChoke ? chokeSortKey : Infinity;

                    let pool = actEvents.filter(e =>
                        !allChokeEventIds.has(e.id) &&
                        !assignedIds.has(e.id) &&
                        (e.sortKey || 0) >= minKey &&
                        (e.sortKey || 0) <= maxKey
                    );

                    // 開始地点（Floor 0）は幕の序盤イベント（最初の5件など）を優先
                    if (f === 0) {
                        const earlyPool = pool.filter(e => (e.sortKey || 0) <= (actEvents[4]?.sortKey || maxKey));
                        if (earlyPool.length > 0) pool = earlyPool;
                    }

                    // 万が一プールが枯渇した場合でも、年代の単調増加および関門境界を厳格に維持
                    if (pool.length === 0) {
                        pool = actEvents.filter(e =>
                            !allChokeEventIds.has(e.id) &&
                            !assignedIds.has(e.id) &&
                            (e.sortKey || 0) >= currentMinSortKey &&
                            (e.sortKey || 0) <= maxKey
                        );
                    }
                    if (pool.length === 0) {
                        pool = actEvents.filter(e =>
                            !allChokeEventIds.has(e.id) &&
                            !assignedIds.has(e.id) &&
                            (e.sortKey || 0) <= maxKey
                        );
                    }
                    if (pool.length === 0) {
                        pool = actEvents.filter(e => !allChokeEventIds.has(e.id) && !assignedIds.has(e.id));
                    }
                    if (pool.length === 0) {
                        pool = actEvents;
                    }

                    // 優先度ソート:
                    // 1. 所持志士の命運がかかった事件（urgentDeathEvents）を最優先
                    // 2. 同じ時期（同一年、または直近の年代帯）に有名志士が死亡する歴史事件があれば一般事件より優先！
                    // 3. 次の有名志士死亡事件が控えている場合、過去の一般イベントでの停滞を防ぎ死亡事件を優先
                    // 4. 年代昇順（sortKey）
                    // 5. 自陣営向け選択肢を持つものを優先
                    const urgentForThisWindow = urgentDeathEvents.filter(ue =>
                        !assignedIds.has(ue.id) && (ue.sortKey || 0) >= minKey && (ue.sortKey || 0) <= maxKey
                    );

                    const unassignedDeaths = pool.filter(e => allDeathEventIds.has(e.id));
                    const nextDeathEvent = unassignedDeaths[0];

                    pool.sort((a, b) => {
                        const aUrgent = urgentForThisWindow.some(u => u.id === a.id);
                        const bUrgent = urgentForThisWindow.some(u => u.id === b.id);
                        if (aUrgent && !bUrgent) return -1;
                        if (!aUrgent && bUrgent) return 1;

                        const aDeath = allDeathEventIds.has(a.id);
                        const bDeath = allDeathEventIds.has(b.id);
                        const yearA = Math.floor((a.sortKey || 0) / 100);
                        const yearB = Math.floor((b.sortKey || 0) / 100);

                        // 同じ時期（同一年）に有名志士が死亡する歴史事件があれば優先配置！
                        if (yearA === yearB) {
                            if (aDeath && !bDeath) return -1;
                            if (!aDeath && bDeath) return 1;
                        }

                        // 次の有名志士死亡事件が控えている場合、過去の一般イベントでの停滞を防ぎ死亡事件を優先
                        if (nextDeathEvent && f >= 2) {
                            const targetYear = Math.floor((nextDeathEvent.sortKey || 0) / 100);
                            if (a.id === nextDeathEvent.id && yearB < targetYear) return -1;
                            if (b.id === nextDeathEvent.id && yearA < targetYear) return 1;
                        }

                        const diff = (a.sortKey || 0) - (b.sortKey || 0);
                        if (diff !== 0) return diff;

                        if (faction) {
                            const aFav = (a.choices || []).some(c => c.faction === faction || !c.faction);
                            const bFav = (b.choices || []).some(c => c.faction === faction || !c.faction);
                            return (bFav ? 1 : 0) - (aFav ? 1 : 0);
                        }
                        return 0;
                    });

                    selectedEvent = pool[0];
                }

                if (selectedEvent) {
                    assignedIds.add(selectedEvent.id);
                    node.eventId = selectedEvent.id;
                    node.period = selectedEvent.period || (selectedEvent.year ? `${selectedEvent.year}年` : '1860年');
                    node.shortTitle = selectedEvent.shortTitle || selectedEvent.title;
                    node.title = `${node.period}\n${node.shortTitle}`;
                    node.sortKey = selectedEvent.sortKey || 0;

                    // 志士命運メタデータをノードに付与
                    if (GAME_DATA.shishiDeaths) {
                        const deathEntry = Object.values(GAME_DATA.shishiDeaths).find(d => d.eventId === selectedEvent.id);
                        if (deathEntry) {
                            node.isFateNode = true;
                            node.deathShishiCardId = deathEntry.cardId;
                            node.deathShishiWarning = deathEntry.name;
                            if (ownedCardIds.has(deathEntry.cardId)) {
                                node.isOwnedFateNode = true;
                            }
                        }
                    }
                }
            });

            // フロア完了後、このフロアで割り当てられたイベントの年代に基づいて次フロアの最小年代を更新
            const floorSortKeys = nodesOnFloor.map(n => n.sortKey).filter(Boolean);
            if (floorSortKeys.length > 0) {
                currentMinSortKey = Math.max(currentMinSortKey, Math.min(...floorSortKeys));
            }
        });
    }

    launchBattle(node) {
        let enemyKey = 'act1_normal_1';
        const act = Math.min(3, Math.max(1, this.currentAct || 1));

        if (node.type === 'boss') {
            if (act === 1) {
                enemyKey = this.app.faction === 'tobaku' ? 'act1_boss_tobaku' : 'act1_boss_sabaku';
            } else if (act === 2) {
                enemyKey = this.app.faction === 'tobaku' ? 'act2_boss_katamori' : 'act2_boss_saigo';
            } else {
                enemyKey = this.app.faction === 'tobaku' ? 'act3_final_yoshinobu' : 'act3_final_kangun';
            }
        } else if (node.type === 'elite') {
            const elitePools = {
                1: ['act1_elite_izo', 'act1_elite_serizawa'],
                2: ['act2_elite_iba', 'act2_elite_hanjiro'],
                3: ['act3_elite_battotai', 'act3_elite_sagawa']
            };
            const pool = elitePools[act] || elitePools[1];
            // 敵対陣営のエリートを優先選出（70%）
            const hostile = pool.filter(id => {
                const e = GAME_DATA.enemies[id];
                return e && e.faction && e.faction !== this.app.faction;
            });
            if (hostile.length > 0 && Math.random() < 0.7) {
                enemyKey = hostile[Math.floor(Math.random() * hostile.length)];
            } else {
                enemyKey = pool[Math.floor(Math.random() * pool.length)];
            }
        } else {
            // 通常戦闘（各幕4体）
            const normalPools = {
                1: ['act1_normal_1', 'act1_normal_2', 'act1_normal_choshu_spy', 'act1_normal_shinsengumi'],
                2: ['act2_normal_1', 'act2_normal_satsuma_samurai', 'act2_normal_denshitai', 'act2_normal_british_marine'],
                3: ['act3_normal_shogitai', 'act3_normal_ouetsu', 'act3_normal_shinseifu', 'act3_normal_armstrong']
            };
            const pool = normalPools[act] || normalPools[1];

            // 敵対陣営の敵を優先（70%）
            const hostile = pool.filter(id => {
                const e = GAME_DATA.enemies[id];
                return e && e.faction && e.faction !== this.app.faction;
            });

            let candidates = (hostile.length > 0 && Math.random() < 0.7) ? hostile : pool;
            // 直前の通常敵との連続重複を防止
            if (this.lastNormalEnemyKey && candidates.length > 1) {
                const nonRepeat = candidates.filter(id => id !== this.lastNormalEnemyKey);
                if (nonRepeat.length > 0) candidates = nonRepeat;
            }

            enemyKey = candidates[Math.floor(Math.random() * candidates.length)];
            this.lastNormalEnemyKey = enemyKey;
        }

        const enemyData = GAME_DATA.enemies[enemyKey];
        if (enemyData) {
            this.app.battle.startBattle(enemyData);
            this.app.switchScreen('screen-battle');
        }
    }

    launchEvent(node) {
        if (!this.visitedEventIds) {
            this.visitedEventIds = [];
        }

        let eventToTrigger = null;
        if (node && node.eventId) {
            eventToTrigger = GAME_DATA.events.find(e => e.id === node.eventId);
        }

        if (!eventToTrigger) {
            const currentAct = this.currentAct || 1;
            const allChokeEventIds = MapSystem.ALL_CHOKEPOINT_EVENT_IDS;

            if (node && node.isChokepoint) {
                const chokeId = MapSystem.CHOKEPOINT_EVENTS[currentAct];
                eventToTrigger = GAME_DATA.events.find(e => e.id === chokeId);
            } else {
                // 道中ノードでは関門専用イベント（四境戦争等）を絶対に除外
                const shishiEvents = this.getShishiEventsForAct(currentAct).filter(e => !allChokeEventIds.has(e.id));
                let availableEvents = shishiEvents.length > 0 ? shishiEvents : GAME_DATA.events.filter(e => {
                    if (Array.isArray(e.act)) return e.act.includes(currentAct);
                    return e.act === currentAct;
                }).filter(e => !allChokeEventIds.has(e.id));
                if (availableEvents.length === 0) {
                    availableEvents = GAME_DATA.events.filter(e => !allChokeEventIds.has(e.id));
                }

                // 未遭遇イベントを優先選出（長編化での重複防止）
                const unvisited = availableEvents.filter(e => !this.visitedEventIds.includes(e.id));
                const pool = unvisited.length > 0 ? unvisited : availableEvents;
                eventToTrigger = pool[Math.floor(Math.random() * pool.length)];
            }
        }

        if (eventToTrigger) {
            this.visitedEventIds.push(eventToTrigger.id);
        }

        this.app.currentEvent = eventToTrigger;
        this.app.switchScreen('screen-event');
        this.app.ui.renderEvent(eventToTrigger);
    }

    onActCompleted() {
        if (this.currentAct < 3) {
            this.generateAct(this.currentAct + 1);
            this.app.switchScreen('screen-map');
            this.app.ui.renderMap();
            if (this.app.saveRun) {
                this.app.saveRun('map');
            }
        } else {
            this.app.handleGameClear();
        }
    }
}

