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
        this.nodes = [];
        this.connections = [];

        // 世論（トレンド）を新幕ごとにランダム決定
        const trend = GAME_DATA.trends[Math.floor(Math.random() * GAME_DATA.trends.length)];
        this.app.currentTrend = trend;

        // 長編ローグライト階層数定義:
        // Act 1: 14階層 ＋ 幕ボス（Floor 14） = 全15階層 (Floor 0〜14)
        // Act 2: 14階層 ＋ 幕ボス（Floor 14） = 全15階層 (Floor 0〜14)
        // Act 3: 13階層 ＋ 最終ボス（Floor 13） = 全14階層 (Floor 0〜13)
        const floorCount = actNumber === 3 ? 13 : 14;

        // Floor 0:
        // 第一幕: 志士を入手できる歴史事件（開始地点 3分岐確定）
        // 第二幕・終幕: 戦場（開始地点 3分岐）
        const f0Nodes = [];
        const f0Count = 3;

        if (actNumber === 1) {
            const shishiEvents = this.getShishiEventsForAct(actNumber);
            const selectedEvents = this.shuffleArray([...shishiEvents]).slice(0, f0Count);

            for (let i = 0; i < f0Count; i++) {
                const ev = selectedEvents[i] || shishiEvents[0];
                const id = `act${actNumber}_f0_n${i}`;
                const node = {
                    id,
                    floor: 0,
                    col: i,
                    type: 'event',
                    title: ev ? ev.title : '歴史事件（志士との邂逅）',
                    icon: '📜',
                    eventId: ev ? ev.id : null,
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
            // ボス直前フロアは2分岐（休息＆商人）、中盤山場（f=6）は3分岐、他は2〜3分岐
            let colCount = 2;
            if (f === floorCount - 1) {
                colCount = 2;
            } else if (f === 6) {
                colCount = 3;
            } else {
                colCount = (Math.random() < 0.6) ? 3 : 2;
            }

            for (let c = 0; c < colCount; c++) {
                let type = 'battle';
                let icon = '⚔️';
                let title = '戦場';

                // --- 階層設計（Slay the Spire級の洗練されたペース配分） ---
                if (f === floorCount - 1) {
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
                    // 中盤の山場: 武器庫（宝箱）または 強敵（エリート）
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
                    // 武器庫・エリート直後の休息または事件
                    if (c === 0) {
                        type = 'rest';
                        icon = '🍵';
                        title = '茶屋休息';
                    } else {
                        type = 'event';
                        icon = '📜';
                        title = '歴史事件';
                    }
                } else if (f === 11) {
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
                } else if (f === 4 || f === 12) {
                    // 商人・休息・事件の寄り道フロア
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
                    // 序盤フロア (f === 1, 2, 3): デッキの基盤を作る戦場主体
                    const rand = Math.random();
                    if (rand < 0.65) {
                        type = 'battle';
                        icon = '⚔️';
                        title = '戦場';
                    } else if (rand < 0.90) {
                        type = 'event';
                        icon = '📜';
                        title = '歴史事件';
                    } else {
                        type = 'rest';
                        icon = '🍵';
                        title = '茶屋休息';
                    }
                } else {
                    // 中盤一般フロア (f === 5, 8, 9, 10): 多彩な分岐網
                    const rand = Math.random();
                    if (rand < 0.40) {
                        type = 'battle';
                        icon = '⚔️';
                        title = '戦場';
                    } else if (rand < 0.65) {
                        type = 'event';
                        icon = '📜';
                        title = '歴史事件';
                    } else if (rand < 0.82) {
                        type = 'shop';
                        icon = '💰';
                        title = '洋行商人';
                    } else if (rand < 0.92) {
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

        this.currentNodeId = nodeId;
        this.currentFloor = node.floor;
        node.completed = true;

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

    launchBattle(node) {
        let enemyKey = 'act1_normal_1';

        if (node.type === 'boss') {
            if (this.currentAct === 1) {
                enemyKey = this.app.faction === 'tobaku' ? 'act1_boss_tobaku' : 'act1_boss_sabaku';
            } else if (this.currentAct === 2) {
                enemyKey = this.app.faction === 'tobaku' ? 'act2_boss_katamori' : 'act2_boss_saigo';
            } else {
                enemyKey = this.app.faction === 'tobaku' ? 'act3_final_yoshinobu' : 'act3_final_kangun';
            }
        } else if (node.type === 'elite') {
            enemyKey = (this.currentAct === 1) ? 'act1_elite_izo' : 'act2_elite_serizawa';
        } else {
            // 通常戦闘
            if (this.currentAct === 1) {
                enemyKey = (Math.random() < 0.5) ? 'act1_normal_1' : 'act1_normal_2';
            } else {
                enemyKey = 'act2_normal_1';
            }
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
            // 現在の幕に対応する志士入手可能イベントを優先抽出
            const shishiEvents = this.getShishiEventsForAct(currentAct);
            let availableEvents = shishiEvents.length > 0 ? shishiEvents : GAME_DATA.events.filter(e => {
                if (Array.isArray(e.act)) return e.act.includes(currentAct);
                return e.act === currentAct;
            });
            if (availableEvents.length === 0) {
                availableEvents = GAME_DATA.events;
            }

            // 未遭遇イベントを優先選出（長編化での重複防止）
            const unvisited = availableEvents.filter(e => !this.visitedEventIds.includes(e.id));
            const pool = unvisited.length > 0 ? unvisited : availableEvents;
            eventToTrigger = pool[Math.floor(Math.random() * pool.length)];
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

