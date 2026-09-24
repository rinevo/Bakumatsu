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

        // フロア数定義 (Act 1: 5フロア+ボス, Act 2: 5フロア+ボス, Act 3: 4フロア+最終ボス)
        const floorCount = actNumber === 3 ? 4 : 5;

        // フロアごとのノード生成
        // Floor 0: 戦場固定（開始地点 2〜3分岐）
        // Floor 1〜floorCount-1: バトル、イベント、商人、エリート、休息
        // Floor floorCount: ボスノード固定 (1つ)

        let nodeIdCounter = 1;

        // Floor 0
        const f0Nodes = [];
        const f0Count = 3;
        for (let i = 0; i < f0Count; i++) {
            const id = `act${actNumber}_f0_n${i}`;
            const node = {
                id,
                floor: 0,
                col: i,
                type: 'battle',
                title: '戦場（街道の衝突）',
                icon: '⚔️',
                completed: false
            };
            this.nodes.push(node);
            f0Nodes.push(node);
        }

        let prevFloorNodes = f0Nodes;

        // Floor 1 〜 floorCount - 1
        for (let f = 1; f < floorCount; f++) {
            const fNodes = [];
            const colCount = (f === floorCount - 1) ? 2 : (Math.random() < 0.5 ? 3 : 2);

            for (let c = 0; c < colCount; c++) {
                let type = 'battle';
                let icon = '⚔️';
                let title = '戦場';

                // フロアに応じたノードタイプ決定
                if (f === floorCount - 1) {
                    // ボス直前フロアは休息または商人
                    if (c === 0) {
                        type = 'rest';
                        icon = '🍵';
                        title = '本陣休息';
                    } else {
                        type = 'shop';
                        icon = '💰';
                        title = '洋行商人';
                    }
                } else if (f === 2) {
                    // 中盤にエリートまたはイベント
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
                        title = '商人';
                    }
                } else {
                    const rand = Math.random();
                    if (rand < 0.35) {
                        type = 'event';
                        icon = '📜';
                        title = '歴史事件';
                    } else if (rand < 0.55) {
                        type = 'shop';
                        icon = '💰';
                        title = '洋行商人';
                    } else if (rand < 0.75) {
                        type = 'rest';
                        icon = '🍵';
                        title = '茶屋休息';
                    } else {
                        type = 'battle';
                        icon = '⚔️';
                        title = '戦場';
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

            // 前フロアからの接続（必ず1本以上繋がるように）
            prevFloorNodes.forEach((pn, pIndex) => {
                fNodes.forEach((fn, fIndex) => {
                    // 物理的に近い列同士を接続
                    if (Math.abs(pIndex - fIndex) <= 1 || (fNodes.length === 1)) {
                        this.connections.push([pn.id, fn.id]);
                    }
                });
            });

            // 孤立したfNodesがないか確認
            fNodes.forEach(fn => {
                const connected = this.connections.some(c => c[1] === fn.id);
                if (!connected) {
                    this.connections.push([prevFloorNodes[0].id, fn.id]);
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

        // ノード種別に応じたシーン起動
        switch (node.type) {
            case 'battle':
            case 'elite':
            case 'boss':
                this.launchBattle(node);
                break;
            case 'event':
                this.launchEvent();
                break;
            case 'shop':
                this.app.shop.openShop();
                break;
            case 'rest':
                this.app.shop.openRestSite();
                break;
        }
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

    launchEvent() {
        const currentAct = this.currentAct || 1;
        // 現在の幕に対応する歴史事件を抽出
        let availableEvents = GAME_DATA.events.filter(e => {
            if (Array.isArray(e.act)) return e.act.includes(currentAct);
            return e.act === currentAct;
        });
        if (availableEvents.length === 0) {
            availableEvents = GAME_DATA.events;
        }
        const randomEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
        this.app.currentEvent = randomEvent;
        this.app.switchScreen('screen-event');
        this.app.ui.renderEvent(randomEvent);
    }

    onActCompleted() {
        if (this.currentAct < 3) {
            this.generateAct(this.currentAct + 1);
            this.app.switchScreen('screen-map');
            this.app.ui.renderMap();
        } else {
            this.app.handleGameClear();
        }
    }
}

