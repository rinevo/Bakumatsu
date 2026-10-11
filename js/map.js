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

    getPeriodForFloor(act, floor) {
        if (typeof GAME_DATA !== 'undefined' && typeof GAME_DATA.getPeriodForFloor === 'function') {
            return GAME_DATA.getPeriodForFloor(act, floor);
        }
        return {
            id: `act${act}_p`,
            startYear: 1858,
            endYear: 1864,
            eraName: "幕末動乱期",
            label: "1858〜1864年"
        };
    }

    getYearForFloor(act, floor) {
        const p = this.getPeriodForFloor(act, floor);
        return p ? p.startYear : 1860;
    }

    getEraName(year) {
        switch(year) {
            case 1858: return "安政5年";
            case 1859: return "安政6年";
            case 1860: return "万延元年";
            case 1861: return "文久元年";
            case 1862: return "文久2年";
            case 1863: return "文久3年";
            case 1864: return "元治元年";
            case 1865: return "慶応元年";
            case 1866: return "慶応2年";
            case 1867: return "慶応3年";
            case 1868: return "明治元年";
            case 1869: return "明治2年";
            default: return `${year}年`;
        }
    }

    getNodeMeta(type, floor, floorCount, isChokepoint = false) {
        switch (type) {
            case 'event':
                return {
                    icon: isChokepoint ? '⛩️' : '📜',
                    title: isChokepoint ? '歴史の関門' : '歴史事件'
                };
            case 'battle':
                return { icon: '⚔️', title: '戦場' };
            case 'rest':
                return {
                    icon: '🍵',
                    title: (floor === floorCount - 1) ? '本陣休息' : '茶屋休息'
                };
            case 'shop':
                return { icon: '💰', title: '洋行商人' };
            case 'elite':
                return { icon: '👹', title: '強敵（刺客）' };
            case 'treasure':
                return { icon: '🎁', title: '武器庫' };
            case 'boss':
                return { icon: '🏯', title: '決戦' };
            default:
                return { icon: '⚔️', title: '戦場' };
        }
    }

    getNodeTypesForFloor(f, floorCount, chokeFloor) {
        if (f === 0) {
            // Floor 0: 各幕の開幕地点（歴史事件1マス確定）
            return ['event'];
        }
        if (f === chokeFloor) {
            // 歴史の関門（不可避の重大歴史特異点: 1マス確定、商人は絶対に配置しない）
            return ['event'];
        }
        if (f === floorCount - 1) {
            // ボス直前フロア: 本陣休息および洋行商人の2分岐（重複なし）
            return ['rest', 'shop'];
        }
        if (f === 6 || f === 13) {
            // 前半・後半の山場: 武器庫、強敵、歴史事件（3分岐確定、重複なし）
            return ['treasure', 'elite', 'event'];
        }
        if (f === 7 || f === 14) {
            // 山場直後フロア: 休息または歴史事件、戦場
            const colCount = (Math.random() < 0.5) ? 3 : 2;
            const pool = ['rest', 'event', 'battle'];
            return this.shuffleArray(pool).slice(0, colCount);
        }
        if (f === 4 || f === 9 || f === 16) {
            // 寄り道フロア: 商人、歴史事件、戦場
            const colCount = (Math.random() < 0.6) ? 3 : 2;
            const pool = ['shop', 'event', 'battle'];
            return this.shuffleArray(pool).slice(0, colCount);
        }
        if (f <= 3) {
            // 序盤フロア (f === 1, 2, 3): 戦場、歴史事件、茶屋休息
            const colCount = (Math.random() < 0.6) ? 3 : 2;
            const pool = ['battle', 'event', 'rest'];
            return this.shuffleArray(pool).slice(0, colCount);
        }

        // 一般フロア (f=5, 8, 11, 12, 15 等)
        const colCount = (Math.random() < 0.6) ? 3 : 2;
        // フロア進行度に応じてエリートを含める
        const pool = ['battle', 'event', 'shop', 'rest'];
        if (f >= 5) {
            pool.push('elite');
        }
        const selected = this.shuffleArray(pool).slice(0, colCount);

        // 安全策：万が一にも商人のみ（単独マスかつshop）にならないようにする
        if (selected.length === 1 && selected[0] === 'shop') {
            selected[0] = 'battle';
        }
        return selected;
    }

    generateAct(actNumber) {
        this.currentAct = actNumber;
        this.currentFloor = 0;
        this.currentNodeId = null;
        this.previousNodeId = null;
        this.previousFloor = 0;
        this.nodes = [];
        this.connections = [];

        // 現在の進行期間（数年単位）を幕初期フロアの期間に初期化
        const initPeriod = this.getPeriodForFloor(actNumber, 0);
        this.app.currentPeriod = initPeriod;
        this.app.currentYear = initPeriod.startYear;
        this.app.currentSortKey = initPeriod.startYear * 100 + 1;

        // 世論（トレンド）を新幕ごとにランダム決定
        const trend = GAME_DATA.trends[Math.floor(Math.random() * GAME_DATA.trends.length)];
        this.app.currentTrend = trend;

        // 長編ローグライト階層数定義:
        // Act 1〜3: 各幕 18階層 ＋ 幕ボス（Floor 18） = 全19階層 (Floor 0〜18)
        const floorCount = 18;
        const chokeFloor = 10;

        // Floor 0: 開始地点（重複のない3分岐）
        const f0Types = this.getNodeTypesForFloor(0, floorCount, chokeFloor);
        const f0Nodes = [];

        for (let i = 0; i < f0Types.length; i++) {
            const type = f0Types[i];
            const meta = this.getNodeMeta(type, 0, floorCount, false);
            const id = `act${actNumber}_f0_n${i}`;
            const node = {
                id,
                floor: 0,
                col: i,
                type,
                title: meta.title,
                icon: meta.icon,
                eventId: null,
                period: initPeriod,
                startYear: initPeriod.startYear,
                endYear: initPeriod.endYear,
                year: initPeriod.startYear,
                eraName: initPeriod.eraName,
                isChokepoint: false,
                completed: false
            };
            this.nodes.push(node);
            f0Nodes.push(node);
        }

        let prevFloorNodes = f0Nodes;

        // Floor 1 〜 floorCount - 1 の戦略的長編ノード網生成
        for (let f = 1; f < floorCount; f++) {
            const fNodes = [];
            const isChoke = (f === chokeFloor);
            const floorTypes = this.getNodeTypesForFloor(f, floorCount, chokeFloor);

            for (let c = 0; c < floorTypes.length; c++) {
                const type = floorTypes[c];
                const meta = this.getNodeMeta(type, f, floorCount, isChoke);
                const id = `act${actNumber}_f${f}_n${c}`;
                const p = this.getPeriodForFloor(actNumber, f);
                const node = {
                    id,
                    floor: f,
                    col: c,
                    type,
                    title: meta.title,
                    icon: meta.icon,
                    period: p,
                    startYear: p.startYear,
                    endYear: p.endYear,
                    year: p.startYear,
                    eraName: p.eraName,
                    isChokepoint: isChoke,
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

            // 商人マスによる進行不能（ソフトロック）防止：
            // 前フロアのどの親ノードからも、次フロアの候補の中に必ず1つ以上の「非商人マス」が含まれるように接続を保証
            prevFloorNodes.forEach(pn => {
                const targetNodes = fNodes.filter(fn => 
                    this.connections.some(c => c[0] === pn.id && c[1] === fn.id)
                );
                const hasNonShop = targetNodes.some(fn => fn.type !== 'shop');
                if (!hasNonShop) {
                    // 非ショップノードの中で列インデックス(col)が最も近いノードへ接続を追加
                    const nonShopNodes = fNodes.filter(fn => fn.type !== 'shop');
                    if (nonShopNodes.length > 0) {
                        let closest = nonShopNodes[0];
                        let minDiff = Math.abs(pn.col - closest.col);
                        for (let k = 1; k < nonShopNodes.length; k++) {
                            const diff = Math.abs(pn.col - nonShopNodes[k].col);
                            if (diff < minDiff) {
                                minDiff = diff;
                                closest = nonShopNodes[k];
                            }
                        }
                        this.connections.push([pn.id, closest.id]);
                    }
                }
            });

            prevFloorNodes = fNodes;
        }

        // 最終フロア: ボスノード
        const bossId = `act${actNumber}_boss`;
        const isFinal = (actNumber === 3);
        const bossPeriod = this.getPeriodForFloor(actNumber, floorCount);
        const bossNode = {
            id: bossId,
            floor: floorCount,
            col: 0,
            type: 'boss',
            title: isFinal ? '【最終決戦】天下統一の陣' : '【幕末の決戦】大陣',
            icon: '🏯',
            period: bossPeriod,
            startYear: bossPeriod.startYear,
            endYear: bossPeriod.endYear,
            year: bossPeriod.startYear,
            eraName: bossPeriod.eraName,
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

        this.previousNodeId = this.currentNodeId;
        this.previousFloor = this.currentFloor;

        this.currentNodeId = nodeId;
        this.currentFloor = node.floor;
        node.completed = true;

        // --- 進行時代区分（数年単位 / Period）の更新 ---
        const period = node.period || this.getPeriodForFloor(this.currentAct, node.floor);
        this.app.currentPeriod = period;
        this.app.currentYear = period.startYear;
        this.app.currentSortKey = period.startYear * 100 + 1;

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
                            // 首謀者落命により事件が消滅した志士は歴史改変により生存
                            if (this.app.isShishiDeathPreventedByDeadMastermind && this.app.isShishiDeathPreventedByDeadMastermind(cId)) {
                                this.app.markShishiSurvived(cId);
                                return;
                            }
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

        // 2. 年代経過による死亡判定（現在の期間の開始年より過去の史実死線志士）
        if (this.app.currentPeriod && GAME_DATA.shishiDeaths) {
            Object.values(GAME_DATA.shishiDeaths).forEach(deathDef => {
                const cId = deathDef.cardId;
                const deathYear = deathDef.deathYear || deathDef.year || Math.floor((deathDef.deathSortKey || 0) / 100);
                if (deathYear < this.app.currentPeriod.startYear) {
                    if (!this.app.isShishiSaved(cId) && !this.app.isShishiDead(cId)) {
                        // 首謀者落命により事件が消滅した志士は、歴史上の死亡時期を過ぎても落命しない！
                        if (this.app.isShishiDeathPreventedByDeadMastermind && this.app.isShishiDeathPreventedByDeadMastermind(cId)) {
                            this.app.markShishiSurvived(cId);
                            return;
                        }
                        if (!deathsToTrigger.some(d => d.cardId === cId)) {
                            deathsToTrigger.push({
                                cardId: cId,
                                reason: `史実の時期（${deathYear}年）を経過したため落命`,
                                eventTitle: deathDef.eventTitle
                            });
                        }
                    }
                }
            });
        }

        // 3. 志士の死亡が発生する歴史事件カードが未使用のまま発生期間を経過した場合の死亡判定
        if (GAME_DATA.eventCards && this.app.currentPeriod) {
            Object.values(GAME_DATA.eventCards).forEach(evCard => {
                if (evCard.deathShishi && evCard.deathShishi.length > 0 && evCard.year < this.app.currentPeriod.startYear) {
                    evCard.deathShishi.forEach(cId => {
                        if (!this.app.isShishiSaved(cId) && !this.app.isShishiDead(cId)) {
                            // 首謀者落命により事件が消滅した志士は落命しない
                            if (this.app.isShishiDeathPreventedByDeadMastermind && this.app.isShishiDeathPreventedByDeadMastermind(cId)) {
                                this.app.markShishiSurvived(cId);
                                return;
                            }
                            if (!deathsToTrigger.some(d => d.cardId === cId)) {
                                deathsToTrigger.push({
                                    cardId: cId,
                                    reason: `歴史事件カード『${evCard.originalTitle || evCard.name}』(${evCard.year}年)が未使用のまま時代(${this.app.currentPeriod.label})を経過したため、史実の死線により落命`,
                                    eventTitle: evCard.originalTitle || evCard.name
                                });
                            }
                        }
                    });
                }
            });
        }

        const proceedWithNodeEntry = () => {
            const launchActualNode = () => {
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
            };

            // 死亡処理実行（プレイヤー所持カードが落命した場合はモーダル表示＆デッキ除外 ➡ 首謀者落命パージ ➡ シーン起動）
            if (deathsToTrigger.length > 0) {
                this.app.handleShishiDeaths(deathsToTrigger, launchActualNode);
            } else {
                launchActualNode();
            }
        };

        // 期間を過ぎた歴史事件カードの除外通知＆同数ランダム補充
        if (typeof this.app.checkAndPurgeExpiredEventCards === 'function') {
            this.app.checkAndPurgeExpiredEventCards(proceedWithNodeEntry);
        } else {
            proceedWithNodeEntry();
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
        if (typeof GAME_DATA !== 'undefined' && GAME_DATA.chokepointEvents) {
            return GAME_DATA.chokepointEvents;
        }
        return {
            1: 'event_august_coup',         // 第一幕関門: 八月十八日の政変、都の転換 (186308)
            2: 'event_second_choshu_war',   // 第二幕関門: 第二次長州征討、四境戦争の激闘 (186606)
            3: 'event_aizu_war'             // 終幕関門: 会津戦争、白虎の決意 (186808)
        };
    }

    static get ALL_CHOKEPOINT_EVENT_IDS() {
        if (typeof GAME_DATA !== 'undefined' && GAME_DATA.allChokepointEventIds) {
            return GAME_DATA.allChokepointEventIds;
        }
        return new Set(Object.values(MapSystem.CHOKEPOINT_EVENTS));
    }

    assignChronologicalEvents(actNumber) {
        const ownedCardIds = new Set(this.app && this.app.deck ? this.app.deck : []);

        // マスに直接特定の歴史事件を事前配置せず、数年単位の時代区分（Period）を設定した空白マスとして初期化
        this.nodes.forEach(node => {
            const period = this.getPeriodForFloor(actNumber, node.floor);
            node.period = period;
            node.startYear = period.startYear;
            node.endYear = period.endYear;
            node.year = period.startYear;
            node.eraName = period.eraName;
            node.sortKey = period.startYear * 100 + 1;

            if (node.type === 'event') {
                node.eventId = null;
                node.title = node.isChokepoint ? '歴史の関門' : '歴史事件';
                node.shortTitle = node.title;
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

        if (this.app && typeof this.app.startHistoricalEventClash === 'function') {
            this.app.startHistoricalEventClash(node, eventToTrigger);
        } else {
            this.app.currentEvent = eventToTrigger;
            this.app.switchScreen('screen-event');
            this.app.ui.renderEvent(eventToTrigger);
        }
    }

    onActCompleted() {
        if (this.currentAct < 3) {
            this.generateAct(this.currentAct + 1);
            this.app.switchScreen('screen-map');
            this.app.ui.renderMap();
            if (this.app.saveRun) {
                this.app.saveRun('map');
            }
            if (typeof this.app.checkAndPurgeExpiredEventCards === 'function') {
                this.app.checkAndPurgeExpiredEventCards();
            }
        } else {
            this.app.handleGameClear();
        }
    }
}

