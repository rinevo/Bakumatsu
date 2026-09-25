/**
 * 幕末風雲録：双極の蒼穹 - Rogue Deck-Build -
 * UI描画更新・カードレンダラー・モーダル・予測ガイドライン
 */

class UIManager {
    constructor(app) {
        this.app = app;
        this.selectedRemovalCallback = null;
    }

    // --- 上部ステータスバー更新 ---
    updateHeader() {
        const hpBar = document.getElementById('header-hp-fill');
        const hpText = document.getElementById('header-hp-text');
        const shieldText = document.getElementById('header-shield-text');
        const goldText = document.getElementById('header-gold-text');
        const factionBadge = document.getElementById('header-faction-badge');
        const imperialFill = document.getElementById('header-imperial-fill');
        const imperialText = document.getElementById('header-imperial-text');
        const trendBadge = document.getElementById('header-trend-badge');
        const relicList = document.getElementById('header-relic-list');

        if (hpBar) {
            const hpRatio = Math.max(0, Math.min(1, this.app.hp / this.app.maxHp));
            hpBar.style.width = `${hpRatio * 100}%`;
        }
        if (hpText) hpText.textContent = `${this.app.hp} / ${this.app.maxHp}`;
        if (shieldText) shieldText.textContent = this.app.battle ? this.app.battle.playerShield : 0;
        if (goldText) goldText.textContent = `${this.app.gold} 両`;

        if (factionBadge) {
            if (this.app.faction === 'tobaku') {
                factionBadge.className = 'faction-badge tobaku';
                factionBadge.textContent = '🔴 薩長同盟（討幕派）';
            } else {
                factionBadge.className = 'faction-badge sabaku';
                factionBadge.textContent = '🔵 幕府・会津藩（佐幕派）';
            }
        }

        // 列強介入メーター
        if (imperialFill) {
            imperialFill.style.width = `${Math.min(100, this.app.imperialGauge)}%`;
            if (this.app.imperialGauge >= 80) {
                imperialFill.style.backgroundColor = '#d90429';
            } else if (this.app.imperialGauge >= 50) {
                imperialFill.style.backgroundColor = '#f77f00';
            } else {
                imperialFill.style.backgroundColor = '#fcbf49';
            }
        }
        if (imperialText) {
            imperialText.textContent = `${this.app.imperialGauge}% / 100%`;
            if (this.app.imperialGauge >= 80) {
                imperialText.classList.add('danger-pulse');
            } else {
                imperialText.classList.remove('danger-pulse');
            }
        }

        // 世論（トレンド）
        const menuTrendBadge = document.getElementById('menu-trend-badge');
        if (this.app.currentTrend) {
            const trendClass = `trend-badge ${this.app.currentTrend.badgeClass}`;
            const trendText = `世論: ${this.app.currentTrend.name}`;
            const trendTitle = this.app.currentTrend.desc;
            if (trendBadge) {
                trendBadge.className = trendClass;
                trendBadge.textContent = trendText;
                trendBadge.title = trendTitle;
            }
            if (menuTrendBadge) {
                menuTrendBadge.className = trendClass;
                menuTrendBadge.textContent = trendText;
                menuTrendBadge.title = trendTitle;
            }
        }

        // レリックアイコン一覧
        const menuRelicList = document.getElementById('menu-relic-list');
        if (relicList) relicList.innerHTML = '';
        if (menuRelicList) menuRelicList.innerHTML = '';

        if (this.app.relics.length === 0) {
            if (menuRelicList) {
                menuRelicList.innerHTML = '<span class="empty-relic-hint">（未所持）</span>';
            }
        } else {
            this.app.relics.forEach(relicId => {
                const r = GAME_DATA.relics[relicId];
                if (r) {
                    if (relicList) {
                        const span = document.createElement('span');
                        span.className = 'relic-icon-item';
                        span.textContent = '🏮';
                        span.title = `【${r.name}】\n${r.desc}`;
                        relicList.appendChild(span);
                    }
                    if (menuRelicList) {
                        const mSpan = document.createElement('span');
                        mSpan.className = 'relic-icon-item';
                        mSpan.textContent = '🏮';
                        mSpan.title = `【${r.name}】\n${r.desc}`;
                        menuRelicList.appendChild(mSpan);
                    }
                }
            });
        }
    }

    // --- カードHTML要素の生成 ---
    createCardElement(card, options = {}) {
        const div = document.createElement('div');
        div.className = `card-frame ${card.faction} ${card.type} ${card.rarity || ''}`;
        div.dataset.cardId = card.id;

        const actualCost = this.app.battle ? this.app.battle.calculateCardCost(card) : (card.cost || 0);

        let costHtml = `<div class="card-cost">${card.unplayable ? '✕' : actualCost + ' 文'}</div>`;
        let attackBadge = card.attack ? `<span class="stat-badge atk">攻 ${card.attack}</span>` : '';
        let shieldBadge = card.shield ? `<span class="stat-badge def">防 ${card.shield}</span>` : '';
        let typeBadge = `<span class="card-type-tag">${this.getTypeName(card.type)}</span>`;
        let riskBadge = card.imperialRisk ? `<span class="stat-badge risk">列強+${card.imperialRisk}%</span>` : '';

        div.innerHTML = `
            <div class="card-inner">
                <div class="card-top">
                    ${costHtml}
                    ${typeBadge}
                </div>
                <div class="card-name">${card.name}</div>
                <div class="card-stats">
                    ${attackBadge}
                    ${shieldBadge}
                    ${riskBadge}
                </div>
                <div class="card-desc">${card.desc}</div>
                <div class="card-footer">
                    <span class="card-faction-tag">${this.getFactionName(card.faction)}</span>
                </div>
            </div>
        `;

        // ホバー時のコネクトリンク予測ガイドライン
        if (options.enableHoverGuide) {
            div.addEventListener('mouseenter', () => this.highlightSynergyCards(card));
            div.addEventListener('mouseleave', () => this.clearSynergyHighlights());
        }

        return div;
    }

    getTypeName(type) {
        switch (type) {
            case 'shishi': return '志士';
            case 'tactic': return '戦術';
            case 'equip': return '装備';
            case 'curse': return '呪い';
            default: return 'カード';
        }
    }

    getFactionName(faction) {
        switch (faction) {
            case 'tobaku': return '薩長同盟';
            case 'sabaku': return '幕府会津';
            case 'neutral': return '西洋舶来';
            case 'curse': return '不平等条約';
            default: return '';
        }
    }

    // --- コネクトリンク予測ハイライト ---
    highlightSynergyCards(hoveredCard) {
        if (!hoveredCard) return;
        const handCards = document.querySelectorAll('#battle-hand .card-frame');
        const hoveredElem = document.querySelector(`[data-card-id="${hoveredCard.id}"]`);

        // 1. 志士のコンボパートナーを判定
        let partnerChars = [];
        if (hoveredCard.character && GAME_DATA.combos) {
            const relevantCombos = GAME_DATA.combos.filter(combo => combo.chars && combo.chars.includes(hoveredCard.character));
            partnerChars = [...new Set(relevantCombos.flatMap(combo => combo.chars.filter(ch => ch !== hoveredCard.character)))];
        }

        handCards.forEach(cardElem => {
            const cId = cardElem.dataset.cardId;
            const cData = GAME_DATA.cards[cId];
            if (!cData || cardElem === hoveredElem) return;

            let isPartner = false;
            if (cData.character && partnerChars.includes(cData.character)) {
                isPartner = true;
            }

            if (isPartner) {
                cardElem.classList.add('synergy-partner-glow');
                if (hoveredElem) {
                    window.particleSystem.createConnectLink(hoveredElem, cardElem);
                }
            }
        });
    }

    clearSynergyHighlights() {
        document.querySelectorAll('.synergy-partner-glow').forEach(el => {
            el.classList.remove('synergy-partner-glow');
        });
    }

    // --- 戦闘画面UIの描画更新 ---
    updateBattleUI() {
        this.updateHeader();
        const b = this.app.battle;
        if (!b) return;

        const battleScreen = document.getElementById('screen-battle');
        if (battleScreen && b.playerMaxHp > 0) {
            const damageRatio = 1 - Math.max(0, Math.min(1, b.playerHp / b.playerMaxHp));
            const dangerOpacity = (damageRatio * 0.58).toFixed(3);
            battleScreen.style.setProperty('--battle-danger', dangerOpacity);
        }

        // プレイヤー戦闘情報
        const energyText = document.getElementById('battle-player-energy');
        const shieldText = document.getElementById('battle-player-shield');
        const drawCount = document.getElementById('battle-draw-count');
        const discardCount = document.getElementById('battle-discard-count');
        const enemyDrawCount = document.getElementById('battle-enemy-draw-count');
        const enemyDiscardCount = document.getElementById('battle-enemy-discard-count');
        const buffsContainer = document.getElementById('battle-player-buffs');

        if (energyText) energyText.textContent = `${b.playerEnergy} / ${b.playerMaxEnergy}`;
        if (shieldText) shieldText.textContent = b.playerShield;
        if (drawCount) drawCount.textContent = b.drawPile.length;
        if (discardCount) discardCount.textContent = b.discardPile.length;
        if (enemyDrawCount) enemyDrawCount.textContent = b.enemyDrawPile ? b.enemyDrawPile.length : 0;
        if (enemyDiscardCount) enemyDiscardCount.textContent = b.enemyDiscardPile ? b.enemyDiscardPile.length : 0;

        // 敵伏せ手札の描画
        this.renderEnemyHand();

        // プレイヤーバフ表示
        if (buffsContainer) {
            buffsContainer.innerHTML = '';
            if (b.playerBuffs.strength > 0) {
                buffsContainer.innerHTML += `<span class="buff-tag">腕力 +${b.playerBuffs.strength}</span>`;
            }
            if (b.playerBuffs.thorns > 0) {
                buffsContainer.innerHTML += `<span class="buff-tag">反撃 ${b.playerBuffs.thorns}</span>`;
            }
            if (b.playerBuffs.damage_reduction > 0) {
                buffsContainer.innerHTML += `<span class="buff-tag">堅守 -${b.playerBuffs.damage_reduction}</span>`;
            }
            if (b.playerBuffs.auto_gatling > 0) {
                buffsContainer.innerHTML += `<span class="buff-tag">機関砲 ${b.playerBuffs.auto_gatling}</span>`;
            }
        }

        // 敵情報描画
        const enemyContainer = document.getElementById('battle-enemy-container');
        if (enemyContainer && b.enemy) {
            const e = b.enemy;
            const enemyName = document.getElementById('battle-enemy-name');
            const enemyHpBar = document.getElementById('battle-enemy-hp-fill');
            const enemyHpText = document.getElementById('battle-enemy-hp-text');
            const enemyShieldText = document.getElementById('battle-enemy-shield-text');
            const enemyIntent = document.getElementById('battle-enemy-intent');
            const enemyStatus = document.getElementById('battle-enemy-status');

            if (enemyName) {
                const tag = e.isFinalBoss ? '【天下統一道の覇者】' : e.isBoss ? '【大陣頭】' : e.isElite ? '【強敵】' : '';
                enemyName.textContent = `${tag} ${e.name}`;
            }
            if (enemyHpBar) {
                const ratio = Math.max(0, Math.min(1, e.hp / e.maxHp));
                enemyHpBar.style.width = `${ratio * 100}%`;
            }
            if (enemyHpText) enemyHpText.textContent = `${e.hp} / ${e.maxHp}`;
            if (enemyShieldText) enemyShieldText.textContent = e.shield;

            // 敵Intent表示
            if (enemyIntent && e.intent) {
                let intentIcon = '⚔️';
                let intentText = '';
                if (e.intent.type === 'attack') {
                    intentIcon = '⚔️';
                    const times = e.intent.times ? ` × ${e.intent.times}` : '';
                    intentText = `攻撃 ${e.intent.damage}${times}`;
                } else if (e.intent.type === 'defend') {
                    intentIcon = '🛡️';
                    intentText = `防御 ${e.intent.shield}`;
                } else if (e.intent.type === 'buff') {
                    intentIcon = '⚡';
                    intentText = `強化 +${e.intent.strength}`;
                } else if (e.intent.type === 'curse') {
                    intentIcon = '⚠️';
                    intentText = `呪詛 ${e.intent.damage || 0}`;
                }
                enemyIntent.innerHTML = `<span class="intent-icon">${intentIcon}</span> <span class="intent-desc">${intentText} (${e.intent.desc})</span>`;
            }

            // 敵状態異常
            if (enemyStatus) {
                enemyStatus.innerHTML = '';
                if (b.enemyStatus.weak > 0) {
                    enemyStatus.innerHTML += `<span class="status-tag weak">脱力 ${b.enemyStatus.weak}</span>`;
                }
                if (b.enemyStatus.bleed > 0) {
                    enemyStatus.innerHTML += `<span class="status-tag bleed">流血 ${b.enemyStatus.bleed}</span>`;
                }
                if (e.buffStrength > 0) {
                    enemyStatus.innerHTML += `<span class="status-tag buff">怪力 +${e.buffStrength}</span>`;
                }
            }
        }

        // 手札カードのレンダリング
        const handContainer = document.getElementById('battle-hand');
        if (handContainer) {
            handContainer.innerHTML = '';
            b.hand.forEach((card, index) => {
                const cardEl = this.createCardElement(card, { enableHoverGuide: true });
                const canPlay = b.canPlayCard(card);

                if (!canPlay) {
                    cardEl.classList.add('cannot-play');
                } else {
                    cardEl.classList.add('can-play');
                }

                // クリックでプレイ
                cardEl.addEventListener('click', () => {
                    b.playCard(index);
                });

                handContainer.appendChild(cardEl);
            });
        }

        // ターン終了ボタンの活性状態
        const endTurnBtn = document.getElementById('btn-end-turn');
        if (endTurnBtn) {
            endTurnBtn.disabled = !b.isPlayerTurn;
        }
    }

    // --- 敵伏せ手札描画 ---
    renderEnemyHand() {
        const handContainer = document.getElementById('battle-enemy-hand');
        if (!handContainer) return;
        handContainer.innerHTML = '';

        const b = this.app.battle;
        if (!b || !b.enemyHand) return;

        b.enemyHand.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'enemy-card-back';

            // 次手予告のオーラクラス
            if (card.isPending) {
                const intentType = card.type || 'attack';
                cardEl.classList.add(`intent-${intentType}`);
            }

            // 家紋アイコンの決定（葵紋・菊花・誠など）
            let crestChar = '⚜️';
            if (b.enemy && b.enemy.name) {
                const name = b.enemy.name;
                if (name.includes('新選組') || name.includes('近藤') || name.includes('土方') || name.includes('沖田') || name.includes('斎藤')) {
                    crestChar = '誠';
                } else if (name.includes('徳川') || name.includes('幕府') || name.includes('会津') || name.includes('容保') || name.includes('見廻組')) {
                    crestChar = '葵';
                } else if (name.includes('官軍') || name.includes('薩摩') || name.includes('長州') || name.includes('西郷') || name.includes('桂')) {
                    crestChar = '菊';
                } else {
                    crestChar = '⚔️';
                }
            }

            cardEl.innerHTML = `<div class="enemy-card-crest">${crestChar}</div>`;
            cardEl.title = card.isPending ? `【敵の気配】次の行動札の予兆…` : '【伏せ札】敵の手札';

            handContainer.appendChild(cardEl);
        });
    }

    // --- 敵カードプレイ演出（3Dフリップ＆公開） ---
    playEnemyCardAnimation(card, callback) {
        const playZone = document.getElementById('battle-enemy-play-zone');
        if (!playZone) {
            if (callback) callback();
            return;
        }

        playZone.innerHTML = '';

        const cardEl = document.createElement('div');
        const typeClass = card.type || 'attack';
        cardEl.className = `enemy-revealed-card ${typeClass}`;

        let typeLabel = '【攻撃】';
        let statBadge = '';
        if (card.type === 'attack') {
            typeLabel = '【攻撃】';
            const times = (card.times && card.times > 1) ? ` × ${card.times}` : '';
            statBadge = `<span class="enemy-stat-badge atk">攻 ${card.damage || 0}${times}</span>`;
        } else if (card.type === 'defend') {
            typeLabel = '【防御】';
            statBadge = `<span class="enemy-stat-badge def">防 ${card.shield || 0}</span>`;
        } else if (card.type === 'buff') {
            typeLabel = '【強化】';
            statBadge = `<span class="enemy-stat-badge buff">腕力 +${card.strength || 2}</span>`;
        } else if (card.type === 'curse') {
            typeLabel = '【呪詛】';
            statBadge = `<span class="enemy-stat-badge curse">呪詛 ${card.damage || 0}</span>`;
        }

        const owner = card.ownerName || (this.app.battle && this.app.battle.enemy ? this.app.battle.enemy.name : '敵武士');

        cardEl.innerHTML = `
            <div class="enemy-card-banner">
                <span class="enemy-card-type-tag ${typeClass}">${typeLabel}</span>
                <span class="enemy-card-owner">${owner}</span>
            </div>
            <div class="enemy-card-title">${card.name || card.desc || '必殺の太刀'}</div>
            <div class="enemy-card-stats">
                ${statBadge}
            </div>
            <div class="enemy-card-desc">${card.desc || card.name || '敵が秘術を繰り出した！'}</div>
            <div class="enemy-card-foot">幕末武技札</div>
        `;

        playZone.appendChild(cardEl);

        // 抜刀・プレイ音
        if (window.soundSystem) {
            if (card.type === 'attack') {
                window.soundSystem.playSlash();
            } else if (card.type === 'defend') {
                window.soundSystem.playShield();
            } else {
                window.soundSystem.playTaiko(true);
            }
        }

        // カードが表向きになって効果が発動するタイミング（約420ms）
        setTimeout(() => {
            if (callback) callback();
        }, 420);

        // アニメーション完了後に要素をクリア（約1450ms）
        setTimeout(() => {
            if (playZone.contains(cardEl)) {
                playZone.removeChild(cardEl);
            }
        }, 1450);
    }

    // --- マップ描画 ---
    renderMap() {
        this.updateHeader();
        const mapSystem = this.app.map;
        const nodesContainer = document.getElementById('map-nodes-container');
        const actTitle = document.getElementById('map-act-title');
        const svgLines = document.getElementById('map-svg-lines');

        if (actTitle) {
            actTitle.textContent = mapSystem.actNames[mapSystem.currentAct] || "幕末行路";
        }

        if (!nodesContainer || !svgLines) return;
        nodesContainer.innerHTML = '';
        svgLines.innerHTML = '';

        const selectableNodes = mapSystem.getSelectableNodes();
        const maxFloor = Math.max(...mapSystem.nodes.map(n => n.floor));

        // フロアごとに縦並びで配置
        const floorRows = {};
        for (let f = 0; f <= maxFloor; f++) {
            const row = document.createElement('div');
            row.className = 'map-floor-row';
            row.dataset.floor = f;
            floorRows[f] = row;
            nodesContainer.appendChild(row);
        }

        this.cachedNodeElements = {};

        mapSystem.nodes.forEach(node => {
            const nodeDiv = document.createElement('div');
            nodeDiv.className = `map-node ${node.type}`;
            nodeDiv.id = `node-${node.id}`;
            nodeDiv.innerHTML = `
                <div class="node-icon">${node.icon}</div>
                <div class="node-title">${node.title}</div>
            `;

            const isSelectable = selectableNodes.some(sn => sn.id === node.id);
            const isCurrent = (mapSystem.currentNodeId === node.id);

            if (node.completed) {
                nodeDiv.classList.add('completed');
            }
            if (isCurrent) {
                nodeDiv.classList.add('current');
            }
            if (isSelectable) {
                nodeDiv.classList.add('selectable');
                nodeDiv.addEventListener('click', () => {
                    mapSystem.visitNode(node.id);
                });
            }

            floorRows[node.floor].appendChild(nodeDiv);
            this.cachedNodeElements[node.id] = nodeDiv;
        });

        // レイアウト完了後に確実に接続線を描画
        const scheduleDraw = (typeof requestAnimationFrame !== 'undefined')
            ? requestAnimationFrame
            : (fn => setTimeout(fn, 16));

        scheduleDraw(() => {
            setTimeout(() => {
                this.drawMapConnections();
                // マップ初期表示時に現在選択可能なフロア（開始地点 Floor 0）が見えるようスクロール位置を調整
                const mapScreen = document.getElementById('screen-map');
                const targetNode = document.querySelector('.map-node.selectable, .map-node.current');
                if (targetNode) {
                    targetNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else if (mapScreen) {
                    mapScreen.scrollTop = mapScreen.scrollHeight;
                }
            }, 60);
        });
    }

    drawMapConnections() {
        const svg = document.getElementById('map-svg-lines');
        const gridContainer = document.getElementById('map-grid-container');
        if (!svg || !gridContainer || !this.cachedNodeElements) return;

        svg.innerHTML = '';
        const containerRect = gridContainer.getBoundingClientRect();
        if (containerRect.width === 0 || containerRect.height === 0) return;

        const connections = this.app.map.connections;
        connections.forEach(([fromId, toId]) => {
            const fromElem = this.cachedNodeElements[fromId];
            const toElem = this.cachedNodeElements[toId];
            if (!fromElem || !toElem || !fromElem.getBoundingClientRect || !toElem.getBoundingClientRect) return;

            const r1 = fromElem.getBoundingClientRect();
            const r2 = toElem.getBoundingClientRect();

            // コンテナ基準の正確な中心座標
            const x1 = (r1.left + r1.right) / 2 - containerRect.left;
            const y1 = (r1.top + r1.bottom) / 2 - containerRect.top;
            const x2 = (r2.left + r2.right) / 2 - containerRect.left;
            const y2 = (r2.top + r2.bottom) / 2 - containerRect.top;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', 'rgba(223, 177, 91, 0.6)');
            line.setAttribute('stroke-width', '2.5');
            line.setAttribute('stroke-dasharray', '5, 4');
            svg.appendChild(line);
        });
    }

    // --- 歴史イベント画面描画 ---
    renderEvent(eventData) {
        this.updateHeader();
        const titleEl = document.getElementById('event-title');
        const descEl = document.getElementById('event-desc');
        const choicesContainer = document.getElementById('event-choices-container');

        if (titleEl) titleEl.textContent = eventData.title;
        if (descEl) descEl.textContent = eventData.desc;

        if (choicesContainer) {
            choicesContainer.innerHTML = '';
            eventData.choices
                .filter(choice => {
                    if (choice.faction && choice.faction !== this.app.faction) return false;
                    if (choice.action && typeof GAME_DATA !== 'undefined' && GAME_DATA.canFactionAcquireCard) {
                        const fnStr = choice.action.toString();
                        for (const cardId of Object.keys(GAME_DATA.cards)) {
                            if (!GAME_DATA.canFactionAcquireCard(cardId, this.app.faction)) {
                                if (fnStr.includes(`'${cardId}'`) || fnStr.includes(`"${cardId}"`)) {
                                    return false;
                                }
                            }
                        }
                    }
                    return true;
                })
                .forEach(choice => {
                const btn = document.createElement('button');
                btn.className = 'btn-event-choice';

                const canChoose = choice.canChoose ? choice.canChoose(this.app) : true;
                btn.disabled = !canChoose;

                btn.innerHTML = `
                    <div class="choice-text">${choice.text}</div>
                    <div class="choice-effect">${choice.effectDesc}</div>
                `;

                btn.addEventListener('click', () => {
                    try {
                        choice.action(this.app);
                    } catch (err) {
                        console.error("Event choice execution error:", err);
                    }
                    if (window.soundSystem && window.soundSystem.playTaiko) {
                        window.soundSystem.playTaiko(false);
                    }
                    setTimeout(() => {
                        this.app.returnToMap();
                    }, 400);
                });

                    choicesContainer.appendChild(btn);
                });
        }
    }

    // --- ショップ画面描画 ---
    renderShop() {
        this.updateHeader();
        const shop = this.app.shop;
        const cardsContainer = document.getElementById('shop-cards-container');
        const relicsContainer = document.getElementById('shop-relics-container');
        const smuggleContainer = document.getElementById('shop-smuggle-container');
        const removeCardBtn = document.getElementById('btn-shop-remove-card');
        const removeCardCost = document.getElementById('shop-remove-card-cost');

        // 通常カード一覧
        if (cardsContainer) {
            cardsContainer.innerHTML = '';
            shop.shopCards.forEach((item, index) => {
                const card = GAME_DATA.cards[item.cardId];
                if (!card) return;

                const wrapper = document.createElement('div');
                wrapper.className = 'shop-item-wrapper';

                const cardEl = this.createCardElement(card);
                const buyBtn = document.createElement('button');
                buyBtn.className = 'btn-shop-buy';
                buyBtn.textContent = item.purchased ? '売切' : `${item.price} 両で購入`;
                buyBtn.disabled = item.purchased || (this.app.gold < item.price);

                buyBtn.addEventListener('click', () => shop.buyCard(index));

                wrapper.appendChild(cardEl);
                wrapper.appendChild(buyBtn);
                cardsContainer.appendChild(wrapper);
            });
        }

        // レリック販売一覧
        if (relicsContainer) {
            relicsContainer.innerHTML = '';
            shop.shopRelics.forEach((item, index) => {
                const relic = GAME_DATA.relics[item.relicId];
                if (!relic) return;

                const rDiv = document.createElement('div');
                rDiv.className = 'shop-relic-card';
                rDiv.innerHTML = `
                    <div class="relic-icon">🏮</div>
                    <div class="relic-title">${relic.name}</div>
                    <div class="relic-desc">${relic.desc}</div>
                `;

                const btn = document.createElement('button');
                btn.className = 'btn-shop-buy';
                btn.textContent = item.purchased ? '売切' : `${item.price} 両で購入`;
                btn.disabled = item.purchased || (this.app.gold < item.price);
                btn.addEventListener('click', () => shop.buyRelic(index));

                rDiv.appendChild(btn);
                relicsContainer.appendChild(rDiv);
            });
        }

        // 列強密貿易枠
        if (smuggleContainer && shop.smuggleItem) {
            smuggleContainer.innerHTML = '';
            const s = shop.smuggleItem;
            const c = GAME_DATA.cards[s.cardId];

            const smDiv = document.createElement('div');
            smDiv.className = 'smuggle-box';
            smDiv.innerHTML = `
                <div class="smuggle-badge">⚠️ 禁制・列強密貿易（借款）</div>
                <div class="smuggle-desc">
                    <strong>${c.name}</strong> を 0両 で即座に受領可能。<br>
                    代償: <strong>【列強介入メーター +${s.imperialCost}%】</strong> ＆ 不平等条約呪いカードが混入！
                </div>
            `;

            const smBtn = document.createElement('button');
            smBtn.className = 'btn-smuggle';
            smBtn.textContent = s.claimed ? '受領済' : '密約を交わす（借款受領）';
            smBtn.disabled = s.claimed;
            smBtn.addEventListener('click', () => shop.claimSmuggle());

            smDiv.appendChild(smBtn);
            smuggleContainer.appendChild(smDiv);
        }

        // カード削除価格更新
        const discount = this.app.hasRelic("wado_kaichin") ? 0.75 : 1.0;
        const actualPrice = Math.round(shop.cardRemovalPrice * discount);
        if (removeCardCost) removeCardCost.textContent = `${actualPrice} 両`;
        if (removeCardBtn) {
            removeCardBtn.disabled = (this.app.gold < actualPrice);
        }
    }

    // --- 休息画面描画 ---
    renderRestSite() {
        this.updateHeader();
        const healAmt = Math.floor(this.app.maxHp * 0.35);
        const healDesc = document.getElementById('rest-heal-desc');
        if (healDesc) healDesc.textContent = `HPを ${healAmt} 回復します。`;
    }

    // --- デッキ一覧モーダル ---
    openDeckModal() {
        const modal = document.getElementById('modal-deck');
        const container = document.getElementById('deck-cards-grid');
        const countText = document.getElementById('deck-total-count');

        if (countText) countText.textContent = `所持カード: ${this.app.deck.length} 枚`;
        if (container) {
            container.innerHTML = '';
            this.app.deck.forEach(cardId => {
                const card = GAME_DATA.cards[cardId];
                if (card) {
                    const el = this.createCardElement(card);
                    container.appendChild(el);
                }
            });
        }
        modal.classList.add('active');
        window.soundSystem.playHyoshigi();
    }

    closeDeckModal() {
        document.getElementById('modal-deck').classList.remove('active');
    }

    // --- カード削除モーダル ---
    openCardRemovalModal(onComplete) {
        this.selectedRemovalCallback = onComplete;
        const modal = document.getElementById('modal-removal');
        const container = document.getElementById('removal-cards-grid');

        if (container) {
            container.innerHTML = '';
            this.app.deck.forEach((cardId, index) => {
                const card = GAME_DATA.cards[cardId];
                if (card) {
                    const el = this.createCardElement(card);
                    el.classList.add('clickable-removal');
                    el.addEventListener('click', () => {
                        const confirmRemove = confirm(`『${card.name}』をデッキから破棄しますか？`);
                        if (confirmRemove) {
                            this.app.deck.splice(index, 1);
                            modal.classList.remove('active');
                            window.soundSystem.playSlash();
                            if (this.selectedRemovalCallback) {
                                this.selectedRemovalCallback();
                                this.selectedRemovalCallback = null;
                            }
                        }
                    });
                    container.appendChild(el);
                }
            });
        }
        modal.classList.add('active');
    }

    closeRemovalModal() {
        document.getElementById('modal-removal').classList.remove('active');
        this.selectedRemovalCallback = null;
    }

    // --- 戦闘報酬モーダル ---
    showBattleRewardModal(rewardData) {
        const modal = document.getElementById('modal-reward');
        const goldText = document.getElementById('reward-gold-amount');
        const cardsContainer = document.getElementById('reward-cards-container');
        const relicContainer = document.getElementById('reward-relic-container');

        if (goldText) goldText.textContent = `${rewardData.gold} 両`;

        if (cardsContainer) {
            cardsContainer.innerHTML = '';
            rewardData.cards.forEach(cardId => {
                const card = GAME_DATA.cards[cardId];
                if (!card) return;

                const cardEl = this.createCardElement(card);
                cardEl.classList.add('reward-card-choice');
                cardEl.addEventListener('click', () => {
                    this.app.addCardToDeck(cardId);
                    window.soundSystem.playTaiko(false);
                    modal.classList.remove('active');
                    this.app.checkActProgressOrReturnMap();
                });
                cardsContainer.appendChild(cardEl);
            });
        }

        if (relicContainer) {
            relicContainer.innerHTML = '';
            if (rewardData.relic) {
                const r = GAME_DATA.relics[rewardData.relic];
                if (r) {
                    const rDiv = document.createElement('div');
                    rDiv.className = 'reward-relic-box';
                    rDiv.innerHTML = `
                        <div class="relic-icon">🏮</div>
                        <div class="relic-title">${r.name}</div>
                        <div class="relic-desc">${r.desc}</div>
                    `;
                    this.app.obtainRelic(rewardData.relic);
                    relicContainer.appendChild(rDiv);
                }
            }
        }

        modal.classList.add('active');
    }

    closeRewardModal() {
        document.getElementById('modal-reward').classList.remove('active');
        this.app.checkActProgressOrReturnMap();
    }
}
