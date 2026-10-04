/**
 * 幕末風雲録：双極の蒼穹 - Rogue Deck-Build -
 * UI描画更新・カードレンダラー・モーダル・予測ガイドライン
 */

class UIManager {
    constructor(app) {
        this.app = app;
        this.selectedRemovalCallback = null;
        window.addEventListener('resize', () => this.updateHeader());

        // カード詳細モーダルの閉じる操作
        const btnCloseCardDetail = document.getElementById('btn-close-card-detail');
        if (btnCloseCardDetail) {
            btnCloseCardDetail.addEventListener('click', () => this.closeCardDetailModal());
        }
        const cardDetailBackdrop = document.getElementById('card-detail-backdrop');
        if (cardDetailBackdrop) {
            cardDetailBackdrop.addEventListener('click', () => this.closeCardDetailModal());
        }

        // ESCキーでモーダルを階層的に閉じる
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const detailModal = document.getElementById('modal-card-detail');
                if (detailModal && detailModal.classList.contains('active')) {
                    this.closeCardDetailModal();
                    e.stopPropagation();
                    return;
                }
                const deckModal = document.getElementById('modal-deck');
                if (deckModal && deckModal.classList.contains('active')) {
                    this.closeDeckModal();
                }
            }
        });
    }

    // --- 上部ステータスバー更新 ---
    updateHeader() {
        const hpBar = document.getElementById('header-hp-fill');
        const hpText = document.getElementById('header-hp-text');
        const goldText = document.getElementById('header-gold-text');
        const factionBadge = document.getElementById('header-faction-badge');
        const imperialFill = document.getElementById('header-imperial-fill');
        const imperialText = document.getElementById('header-imperial-text');

        if (hpBar) {
            const hpRatio = Math.max(0, Math.min(1, this.app.hp / this.app.maxHp));
            hpBar.style.width = `${hpRatio * 100}%`;
        }
        if (hpText) hpText.textContent = `${this.app.hp} / ${this.app.maxHp}`;
        if (goldText) goldText.textContent = `${this.app.gold} 両`;

        if (factionBadge) {
            if (this.app.faction === 'tobaku') {
                factionBadge.className = 'faction-badge tobaku';
                factionBadge.innerHTML = '<span class="badge-full">🔴 薩長同盟（討幕派）</span><span class="badge-short">🔴 討幕派</span>';
            } else {
                factionBadge.className = 'faction-badge sabaku';
                factionBadge.innerHTML = '<span class="badge-full">🔵 幕府・会津藩（佐幕派）</span><span class="badge-short">🔵 佐幕派</span>';
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

        const imperialContainer = document.querySelector('.imperial-container');
        if (imperialContainer) {
            // メーター枠の幅が狭い場合（320px未満）はコンパクトモードにして「列強介入メーター（植民地化リスク）」を省略
            const isNarrow = imperialContainer.offsetWidth > 0 && imperialContainer.offsetWidth < 320;
            imperialContainer.classList.toggle('compact', isNarrow);
        }

        // 世論動乱（天下の大勢・天秤メーター）
        const opinionPointer = document.getElementById('header-opinion-pointer');
        const opinionPhaseText = document.getElementById('header-opinion-phase-text');
        const opinionContainer = document.getElementById('header-opinion-container');
        if (typeof this.app.publicOpinion === 'number') {
            const phase = this.app.getPublicOpinionPhase();
            const situation = this.app.getFactionSituation();
            const sign = this.app.publicOpinion > 0 ? '+' : '';
            const leftPercent = Math.max(0, Math.min(100, ((this.app.publicOpinion + 100) / 200) * 100));

            if (opinionPointer) {
                opinionPointer.style.left = `${leftPercent}%`;
                if (situation === 'super_disadvantage') {
                    opinionPointer.classList.add('danger-pulse');
                } else {
                    opinionPointer.classList.remove('danger-pulse');
                }
            }

            if (opinionPhaseText) {
                opinionPhaseText.textContent = `世論：${phase.name} (${sign}${this.app.publicOpinion}%)`;
                opinionPhaseText.style.color = phase.color || '#dfb15b';
            }

            if (opinionContainer) {
                // メーター枠の幅が狭い場合（270px未満）はコンパクトモードにして「佐幕」「討幕」を自動非表示
                const isNarrow = opinionContainer.offsetWidth > 0 && opinionContainer.offsetWidth < 270;
                opinionContainer.classList.toggle('compact', isNarrow);

                let situationDesc = "";
                if (situation === 'super_advantage') situationDesc = "【絶大優勢】全攻撃+4、開幕防+10、敵士気動揺、商人20%引、勝利小判+25両";
                else if (situation === 'advantage') situationDesc = "【やや優勢】全攻撃+2、開幕防+5、商人10%引、勝利小判+10両";
                else if (situation === 'neutral') situationDesc = "【情勢拮抗】シールド獲得時+1、標準相場";
                else if (situation === 'disadvantage') situationDesc = "⚠️【やや劣勢】敵剛力+4、敵防20、自軍開幕脱力2、商人価格1.4倍、勝利小判-50%、カード提示2枚、休息回復15%";
                else if (situation === 'super_disadvantage') situationDesc = "🚨【孤立無援】毎ターン手札-1枚、敵剛力+10、敵防60、開幕脱力3&脆弱3、毎ターン投石6ダメ、商人価格2倍、勝利小判-75%、カード提示1枚、休息回復5%";
                else if (situation === 'extreme_disadvantage') situationDesc = "☠️【朝敵討滅令・完全孤立】毎ターン手札-2枚、敵剛力+12、敵防80、開幕脱力4&脆弱4、毎ターン投石8ダメ、商人価格2.5倍、勝利小判0両、カード提示0枚、休息回復0%！";

                opinionContainer.title = `世論動乱（天下の大勢）: ${phase.name} (${sign}${this.app.publicOpinion}%)\n${phase.desc}\n自陣営状況: ${situationDesc}`;
            }
        }

        // レリック表示の更新（単一アイコン＋所持数＆プルダウンリスト）
        const relicCountEl = document.getElementById('header-relic-count');
        const relicDropdownList = document.getElementById('header-relic-dropdown-list');
        const relicDropdownCountBadge = document.getElementById('relic-dropdown-count-badge');

        const totalRelics = this.app.relics.length;
        if (relicCountEl) relicCountEl.textContent = totalRelics;
        if (relicDropdownCountBadge) relicDropdownCountBadge.textContent = `${totalRelics}個`;

        if (relicDropdownList) {
            relicDropdownList.innerHTML = '';
            if (totalRelics === 0) {
                relicDropdownList.innerHTML = '<div class="relic-empty-message">所持している遺物はありません</div>';
            } else {
                this.app.relics.forEach(relicId => {
                    const r = GAME_DATA.relics[relicId];
                    if (r) {
                        const item = document.createElement('div');
                        item.className = 'relic-dropdown-item';
                        item.innerHTML = `
                            <span class="relic-item-icon">🏮</span>
                            <div class="relic-item-info">
                                <div class="relic-item-name">${r.name}</div>
                                <div class="relic-item-desc">${r.desc}</div>
                            </div>
                        `;
                        relicDropdownList.appendChild(item);
                    }
                });
            }
        }
    }

    // --- カードHTML要素の生成 ---
    createCardElement(card, options = {}) {
        const div = document.createElement('div');
        div.className = `card-frame ${card.faction} ${card.type} ${card.rarity || ''}`;
        if (card.isKept) div.classList.add('card-kept');
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
                    <div class="card-top-right">
                        ${typeBadge}
                    </div>
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

        // 戦闘手札表示の場合: 温存ボタンをカード本体の外側に独立配置したスロットを生成
        if (options.inBattleHand && !card.unplayable) {
            const slot = document.createElement('div');
            slot.className = 'battle-card-slot';

            const isKept = card.isKept || false;
            const keepTab = document.createElement('button');
            keepTab.className = `card-keep-tab ${isKept ? 'active' : ''}`;
            keepTab.type = 'button';
            keepTab.title = isKept ? '温存解除' : '次ターンへ温存';
            keepTab.innerHTML = `<span class="keep-icon">📌</span><span class="keep-text">${isKept ? '温存中' : '温存'}</span>`;
            keepTab.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.app.battle) this.app.battle.toggleCardKeep(card.instanceId);
            });

            slot.appendChild(keepTab);
            slot.appendChild(div);
            return slot;
        }

        return div;
    }

    getTypeName(type) {
        switch (type) {
            case 'shishi': return '志士';
            case 'tactic': return '戦術';
            case 'equip': return '装備';
            case 'item': return '道具';
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

    getRarityName(rarity) {
        switch (rarity) {
            case 'starter': return '初期札';
            case 'common': return '通常';
            case 'uncommon': return '良質';
            case 'rare': return '名品';
            case 'legendary': return '伝奇';
            case 'curse': return '条約';
            default: return '一般';
        }
    }

    // --- コネクトリンク予測ハイライト ---
    highlightSynergyCards(hoveredCard) {
        if (!hoveredCard) return;
        const handCards = document.querySelectorAll('#battle-hand .card-frame');
        const hoveredElem = document.querySelector(`[data-card-id="${hoveredCard.id}"]`);

        // 1. 志士のコンボパートナーを判定（今ターン未発動のコンボのみ）
        let partnerChars = [];
        if (hoveredCard.character && GAME_DATA.combos) {
            const b = this.app.battle;
            const triggered = (b && b.triggeredCombosThisTurn) ? b.triggeredCombosThisTurn : new Set();
            const relevantCombos = GAME_DATA.combos.filter(combo =>
                combo.chars && combo.chars.includes(hoveredCard.character) && !triggered.has(combo.id)
            );
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
        const playerHpFill = document.getElementById('battle-player-hp-fill');
        const playerHpText = document.getElementById('battle-player-hp-text');
        const shieldFill = document.getElementById('battle-player-shield-fill');
        const shieldText = document.getElementById('battle-player-shield');
        const drawCount = document.getElementById('battle-draw-count');
        const discardCount = document.getElementById('battle-discard-count');
        const enemyDrawCount = document.getElementById('battle-enemy-draw-count');
        const enemyDiscardCount = document.getElementById('battle-enemy-discard-count');
        const buffsContainer = document.getElementById('battle-player-buffs');

        if (energyText) energyText.textContent = `${b.playerEnergy} / ${b.playerMaxEnergy}`;
        if (playerHpText) playerHpText.textContent = `${b.playerHp} / ${b.playerMaxHp}`;
        if (playerHpFill) {
            const hpRatio = b.playerMaxHp > 0 ? Math.max(0, Math.min(1, b.playerHp / b.playerMaxHp)) : 0;
            playerHpFill.style.width = `${(hpRatio * 100).toFixed(1)}%`;
            if (hpRatio <= 0.25) {
                playerHpFill.classList.add('low-hp');
            } else {
                playerHpFill.classList.remove('low-hp');
            }
        }
        if (shieldText) shieldText.textContent = b.playerShield;
        if (shieldFill) {
            const maxRef = b.playerMaxHp > 0 ? b.playerMaxHp : 100;
            const shieldRatio = Math.max(0, Math.min(1, b.playerShield / maxRef));
            shieldFill.style.width = `${(shieldRatio * 100).toFixed(1)}%`;
        }
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
            const enemyShieldBar = document.getElementById('battle-enemy-shield-fill');
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
            if (enemyShieldText) enemyShieldText.textContent = e.shield || 0;
            if (enemyShieldBar) {
                const maxRef = e.maxHp > 0 ? e.maxHp : 100;
                const shieldRatio = Math.max(0, Math.min(1, (e.shield || 0) / maxRef));
                enemyShieldBar.style.width = `${(shieldRatio * 100).toFixed(1)}%`;
            }

            // 敵Intent表示（数値は完全非公開、行動種別の気配のみ）
            if (enemyIntent && e.intent) {
                let intentIcon = '⚔️';
                let intentLabel = '攻撃の気配';
                if (e.intent.type === 'attack') {
                    intentIcon = '⚔️';
                    intentLabel = (e.intent.times && e.intent.times > 1) ? `連撃の気配 (${e.intent.times}撃)` : '攻撃の気配';
                } else if (e.intent.type === 'defend') {
                    intentIcon = '🛡️';
                    intentLabel = '身構え（防御）';
                } else if (e.intent.type === 'buff') {
                    intentIcon = '⚡';
                    intentLabel = '気合（強化）';
                } else if (e.intent.type === 'curse') {
                    intentIcon = '⚠️';
                    intentLabel = '計略（妨害）';
                }
                enemyIntent.innerHTML = `<span class="intent-icon">${intentIcon}</span> <span class="intent-desc">${intentLabel}</span>`;
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
                const element = this.createCardElement(card, { enableHoverGuide: true, inBattleHand: true });
                const cardEl = element.classList.contains('card-frame') ? element : element.querySelector('.card-frame');
                const canPlay = b.canPlayCard(card);

                if (cardEl) {
                    if (!canPlay) {
                        cardEl.classList.add('cannot-play');
                    } else {
                        cardEl.classList.add('can-play');
                    }

                    // クリックでプレイ（カード本体をクリックした時のみ）
                    cardEl.addEventListener('click', () => {
                        b.playCard(index);
                    });
                }

                handContainer.appendChild(element);
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

        const floorProgress = document.getElementById('map-floor-progress');

        if (!nodesContainer || !svgLines) return;
        nodesContainer.innerHTML = '';
        svgLines.innerHTML = '';

        const selectableNodes = mapSystem.getSelectableNodes();
        const maxFloor = Math.max(...mapSystem.nodes.map(n => n.floor));

        if (floorProgress) {
            const currentFloorNum = (mapSystem.currentFloor !== undefined) ? mapSystem.currentFloor + 1 : 1;
            const totalFloorNum = maxFloor + 1;
            floorProgress.textContent = `（第${currentFloorNum}階 / ${totalFloorNum}階）`;
        }

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
            if (node.isChokepoint) {
                nodeDiv.classList.add('chokepoint-node');
            }
            nodeDiv.id = `node-${node.id}`;

            // 志士条件（鍵付きマス）の判定
            let lockBadgeHtml = '';
            const hasShishiReq = node.requiredShishi && node.requiredShishi.length > 0;
            const isAccessible = mapSystem.isNodeAccessible(node);

            if (hasShishiReq) {
                const reqNames = node.requiredShishi.map(k => this.app.getShishiDisplayName(k)).join('・');
                if (isAccessible) {
                    nodeDiv.classList.add('shishi-unlocked');
                    lockBadgeHtml = `<div class="node-lock-badge unlocked" title="【志士集結】進入可能: ${reqNames}">🔓</div>`;
                } else {
                    nodeDiv.classList.add('shishi-locked');
                    lockBadgeHtml = `<div class="node-lock-badge locked" title="【要志士】${reqNames}">🔒</div>`;
                }
            }

            let titleContent = node.title;
            if (node.period && node.shortTitle) {
                // 歴史の霧: 2フロア以上先の未訪問事件は具体的な事件名を伏せる
                const currentFloor = mapSystem.currentFloor || 0;
                const isFogged = (node.type === 'event') && !node.completed && (node.floor > currentFloor + 1);

                if (isFogged) {
                    if (node.isChokepoint) {
                        titleContent = `<span class="node-period">${node.period}</span><span class="node-name node-fog-choke">⛩️ 歴史の関門</span>`;
                    } else {
                        titleContent = `<span class="node-period">${node.period}</span><span class="node-name node-fog">🌫️ 風雲急（未詳）</span>`;
                    }
                } else {
                    const chokePrefix = node.isChokepoint ? '⛩️ ' : '';
                    titleContent = `<span class="node-period">${node.period}</span><span class="node-name">${chokePrefix}${node.shortTitle}</span>`;
                }
            }

            if (hasShishiReq && !node.completed) {
                const reqNames = node.requiredShishi.map(k => this.app.getShishiDisplayName(k)).join('・');
                if (isAccessible) {
                    titleContent += `<span class="node-req-label unlocked">✨【${reqNames}】開錠!</span>`;
                } else {
                    titleContent += `<span class="node-req-label locked">🔒【要:${reqNames}】</span>`;
                }
            }

            nodeDiv.innerHTML = `
                ${lockBadgeHtml}
                <div class="node-icon">${node.icon}</div>
                <div class="node-title">${titleContent}</div>
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
                if (hasShishiReq && !isAccessible) {
                    nodeDiv.classList.add('selectable-locked');
                }
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
                // マップ初期表示時に現在選択可能なフロアが見えるようスクロール位置を調整
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

        const containerHeight = gridContainer.offsetHeight || containerRect.height;
        svg.setAttribute('width', containerRect.width);
        svg.setAttribute('height', containerHeight);
        svg.setAttribute('viewBox', `0 0 ${containerRect.width} ${containerHeight}`);

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

        // ステージの初期化（幕壱: 初動方針をアクティブにし、判定・幕参を非表示）
        const stageOpening = document.getElementById('event-stage-opening');
        const stageRolling = document.getElementById('event-stage-rolling');
        const stageResolution = document.getElementById('event-stage-resolution');

        if (stageOpening) stageOpening.style.display = 'block';
        if (stageRolling) stageRolling.style.display = 'none';
        if (stageResolution) stageResolution.style.display = 'none';

        const titleEl = document.getElementById('event-title');
        const descEl = document.getElementById('event-desc');
        const choicesContainer = document.getElementById('event-choices-container');

        if (titleEl) {
            const periodPrefix = eventData.period ? `【${eventData.period}】` : '';
            let impBadge = '';
            const imp = eventData.importance || 1;
            if (imp === 3) {
                impBadge = '<span class="badge-importance badge-imp-3">★★★ 天下決戦・歴史転換点</span> ';
            } else if (imp === 2) {
                impBadge = '<span class="badge-importance badge-imp-2">★★☆ 重大政変</span> ';
            } else {
                impBadge = '<span class="badge-importance badge-imp-1">★☆☆ 動乱</span> ';
            }
            titleEl.innerHTML = `${impBadge}${periodPrefix}${eventData.title}`;
        }
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

                // 志士限定選択肢（requiredShishi）の判定
                let reqShishiList = [];
                if (choice.requiredShishi) {
                    reqShishiList = Array.isArray(choice.requiredShishi) ? choice.requiredShishi : [choice.requiredShishi];
                }
                const hasRequiredShishi = reqShishiList.length === 0 || this.app.hasAllShishi(reqShishiList);

                // 基本の選択可否判定
                let canChoose = choice.canChoose ? choice.canChoose(this.app) : true;
                if (!hasRequiredShishi) {
                    canChoose = false;
                }
                btn.disabled = !canChoose;

                // 志士限定バッジ
                let shishiReqBadgeHtml = '';
                if (reqShishiList.length > 0) {
                    const reqNames = reqShishiList.map(k => this.app.getShishiDisplayName(k)).join('・');
                    if (hasRequiredShishi) {
                        btn.classList.add('special-shishi-choice');
                        shishiReqBadgeHtml = `<span class="badge-shishi-req unlocked">✨【${reqNames} 同行】</span> `;
                    } else {
                        btn.classList.add('locked-shishi-choice');
                        shishiReqBadgeHtml = `<span class="badge-shishi-req locked">🔒【要：${reqNames}】</span> `;
                    }
                }

                // 志士所持ボーナス（shishiBonus）の判定とバッジ生成
                let activeBonuses = [];
                if (choice.shishiBonus) {
                    const bonusList = Array.isArray(choice.shishiBonus) ? choice.shishiBonus : [choice.shishiBonus];
                    bonusList.forEach(bonus => {
                        const targetKey = bonus.character || bonus.cardId;
                        if (targetKey && this.app.hasShishi(targetKey)) {
                            activeBonuses.push(bonus);
                        }
                    });
                }

                let bonusHtml = '';
                if (activeBonuses.length > 0) {
                    btn.classList.add('has-shishi-bonus');
                    bonusHtml = activeBonuses.map(b => {
                        const shishiName = this.app.getShishiDisplayName(b.character || b.cardId);
                        return `<div class="choice-shishi-bonus">🌟【${shishiName}の助勢】${b.desc}</div>`;
                    }).join('');
                }

                let opinionBadgeHtml = '';
                const rawOpinionChange = typeof choice.opinionChange === 'function'
                    ? choice.opinionChange(this.app)
                    : choice.opinionChange;

                if (typeof rawOpinionChange === 'number') {
                    const isAdverse = (this.app.faction === 'tobaku' && rawOpinionChange < 0) ||
                                      (this.app.faction === 'sabaku' && rawOpinionChange > 0);
                    const effectiveChange = isAdverse ? Math.round(rawOpinionChange * 1.8) : rawOpinionChange;

                    if (rawOpinionChange === 0) {
                        opinionBadgeHtml = `<span class="badge-opinion badge-opinion-neutral">⚖️ 世論: 変動なし</span>`;
                    } else {
                        const targetFactionName = rawOpinionChange > 0 ? "討幕" : "佐幕";
                        const factionCircle = rawOpinionChange > 0 ? "🔴" : "🔵";

                        if (isAdverse) {
                            const label = `⚠️ 逆風: ${factionCircle}${targetFactionName}+${Math.abs(effectiveChange)}%`;
                            opinionBadgeHtml = `<span class="badge-opinion badge-opinion-adverse">${label}</span>`;
                        } else {
                            const label = `${factionCircle} 世論: ${targetFactionName}+${Math.abs(effectiveChange)}%`;
                            opinionBadgeHtml = `<span class="badge-opinion badge-opinion-favorable">${label}</span>`;
                        }
                    }
                }

                // 史実成否確率の算出とバッジ生成
                const chances = this.app.calculateEventSuccessProbability(eventData, choice);
                const probBadgeHtml = `
                    <div class="choice-probability-row">
                        <span class="badge-risk ${chances.categoryBadgeClass || ''}">${chances.categoryLabel || '史実判定'}</span>
                        <span class="badge-prob-total">史実成否見込: ${chances.totalSuccess}%</span>
                        <span class="badge-prob-great">大成功 ${chances.great}%</span>
                        <span class="badge-prob-fail">失敗 ${chances.fail}%</span>
                        <span class="badge-prob-warning">（失敗時: 志士入手不可＆痛手）</span>
                    </div>
                `;

                btn.innerHTML = `
                    <div class="choice-text">${shishiReqBadgeHtml}${opinionBadgeHtml}${choice.text}</div>
                    <div class="choice-effect">${choice.effectDesc}</div>
                    ${bonusHtml}
                    ${probBadgeHtml}
                `;

                btn.addEventListener('click', () => {
                    // 二重クリック・連打防止
                    const allChoiceBtns = choicesContainer.querySelectorAll('.btn-event-choice');
                    allChoiceBtns.forEach(b => { b.disabled = true; });

                    if (window.soundSystem && window.soundSystem.playTaiko) {
                        window.soundSystem.playTaiko(false);
                    }

                    // 天命判定開始
                    this.app.startEventAdventure(eventData, choice);
                });

                    choicesContainer.appendChild(btn);
                });
        }
    }

    // --- 運命判定フェーズ（天命の審判アニメーション） 描画 ---
    renderEventFateRoll(adventureData) {
        this.updateHeader();

        const stageOpening = document.getElementById('event-stage-opening');
        const stageRolling = document.getElementById('event-stage-rolling');
        const stageResolution = document.getElementById('event-stage-resolution');

        if (stageOpening) stageOpening.style.display = 'none';
        if (stageRolling) stageRolling.style.display = 'block';
        if (stageResolution) stageResolution.style.display = 'none';

        const choiceNameEl = document.getElementById('fate-roll-choice-name');
        const chancesEl = document.getElementById('fate-roll-chances');

        if (choiceNameEl) {
            choiceNameEl.innerHTML = `<strong>選んだ決断：</strong>${adventureData.baseChoice.text}`;
        }

        if (chancesEl && adventureData.chances) {
            const c = adventureData.chances;
            chancesEl.innerHTML = `
                <span>🏆 大成功 <strong>${c.great}%</strong></span> ｜ 
                <span>⭕ 成功 <strong>${c.success}%</strong></span> ｜ 
                <span>⚠️ 失敗 <strong>${c.fail}%</strong></span>
            `;
        }

        // 太鼓や演出音
        if (window.soundSystem && window.soundSystem.playHyoshigi) {
            window.soundSystem.playHyoshigi();
        }

        // 約1.1秒後に判定結果へ進む
        setTimeout(() => {
            this.app.resolveFateRollOutcome();
        }, 1100);
    }

    // --- 幕参：結末・歴史の審判 描画 ---
    renderEventResolution(resultData) {
        this.updateHeader();

        const stageOpening = document.getElementById('event-stage-opening');
        const stageRolling = document.getElementById('event-stage-rolling');
        const stageResolution = document.getElementById('event-stage-resolution');

        if (stageOpening) stageOpening.style.display = 'none';
        if (stageRolling) stageRolling.style.display = 'none';
        if (stageResolution) stageResolution.style.display = 'block';

        const stampEl = document.getElementById('resolution-stamp');
        if (stampEl) {
            stampEl.className = `resolution-stamp ${resultData.stampClass}`;
            stampEl.textContent = resultData.stampText;
        }

        const titleEl = document.getElementById('resolution-title');
        if (titleEl) {
            titleEl.textContent = resultData.titleText;
        }

        const descEl = document.getElementById('resolution-desc');
        if (descEl) {
            descEl.textContent = resultData.descText;
        }

        const rewardsContainer = document.getElementById('resolution-rewards-container');
        if (rewardsContainer) {
            rewardsContainer.innerHTML = '';
            (resultData.rewards || []).forEach(r => {
                const row = document.createElement('div');
                row.className = `resolution-reward-row ${r.text.includes('penalty') ? 'penalty' : ''}`;
                row.innerHTML = `<span class="reward-icon">${r.icon}</span><span>${r.text}</span>`;
                rewardsContainer.appendChild(row);
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

        // 蘭方医の有償手当て（HP回復）の表示更新
        const healBtn = document.getElementById('btn-shop-heal');
        const healCostSpan = document.getElementById('shop-heal-cost');
        const healPrice = shop.getHealPrice ? shop.getHealPrice() : 60;

        if (healCostSpan) healCostSpan.textContent = `${healPrice} 両`;
        if (healBtn) {
            if (shop.healedInShop) {
                healBtn.textContent = '手当て済';
                healBtn.disabled = true;
            } else if (this.app.hp >= this.app.maxHp) {
                healBtn.textContent = '体力全快（手当て不要）';
                healBtn.disabled = true;
            } else {
                healBtn.innerHTML = `手当てを受ける (<span id="shop-heal-cost">${healPrice} 両</span>)`;
                healBtn.disabled = (this.app.gold < healPrice);
            }
        }

        // 離脱ボタン・警告ヒントの更新
        this.updateShopLeaveButton();
    }

    updateShopLeaveButton() {
        const btnLeaveShop = document.getElementById('btn-leave-shop');
        const hint = document.getElementById('shop-leave-hint');
        if (!btnLeaveShop) return;

        const goldSpent = this.app.shop.goldSpentInShop || 0;
        if (goldSpent > 0) {
            btnLeaveShop.textContent = '店を後にする（街道へ進む）';
            btnLeaveShop.classList.remove('btn-retreat');
            btnLeaveShop.classList.add('btn-proceed');
            if (hint) {
                hint.textContent = '✅ 調達を完了しました。街道を進軍できます。';
                hint.className = 'shop-leave-hint ready';
            }
        } else {
            btnLeaveShop.textContent = '店を後にする（元のマスへ引き返す）';
            btnLeaveShop.classList.add('btn-retreat');
            btnLeaveShop.classList.remove('btn-proceed');
            if (hint) {
                hint.textContent = '⚠️ 何も購入しない場合、進軍できず元の地点へ引き返します。';
                hint.className = 'shop-leave-hint warning';
            }
        }
    }

    // --- 休息画面描画 ---
    renderRestSite() {
        this.updateHeader();
        const hasPipe = this.app.hasRelic("samurai_pipe");
        const healAmt = Math.floor(this.app.maxHp * (hasPipe ? 0.50 : 0.35));
        const healDesc = document.getElementById('rest-heal-desc');
        if (healDesc) {
            const pipeBonusText = hasPipe ? '（志士の煙管により50%に強化）' : '（最大HPの35%）';
            healDesc.textContent = `HPを ${healAmt} 回復します。${pipeBonusText}`;
        }
        const negotiateDesc = document.getElementById('rest-negotiate-desc');
        if (negotiateDesc) {
            const factionLabel = this.app.faction === 'tobaku' ? '倒幕派' : '佐幕派';
            negotiateDesc.innerHTML = `列強介入メーターを <strong>-15%</strong> 抑制し、世論を${factionLabel}有利に <strong>10%</strong> 工作します。`;
        }
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
                    el.classList.add('card-clickable-detail');
                    el.setAttribute('title', 'クリックで拡大・詳細と人物伝を表示');
                    el.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.openCardDetailModal(card);
                    });
                    container.appendChild(el);
                }
            });
        }
        modal.classList.add('active');
        window.soundSystem.playHyoshigi();
    }

    closeDeckModal() {
        this.closeCardDetailModal();
        document.getElementById('modal-deck').classList.remove('active');
    }

    // --- カード詳細・人物伝拡大モーダル ---
    openCardDetailModal(card) {
        if (!card) return;
        const modal = document.getElementById('modal-card-detail');
        if (!modal) return;

        // 1. 拡大カードの描画
        const visualContainer = document.getElementById('card-detail-enlarged-container');
        if (visualContainer) {
            visualContainer.innerHTML = '';
            const enlargedCard = this.createCardElement(card);
            enlargedCard.classList.remove('card-clickable-detail');
            visualContainer.appendChild(enlargedCard);
        }

        // 2. ヘッダー・種別バッジ
        const typeBadge = document.getElementById('card-detail-type-badge');
        const titleEl = document.getElementById('card-detail-title');
        if (typeBadge) typeBadge.textContent = this.getTypeName(card.type);
        if (titleEl) titleEl.textContent = card.type === 'shishi' ? '志士詳細・人物伝' : '札詳細情報';

        // 3. 基本情報（名前・レアリティ）
        const nameEl = document.getElementById('card-detail-name');
        const rarityEl = document.getElementById('card-detail-rarity');
        if (nameEl) nameEl.textContent = card.name;
        if (rarityEl) {
            rarityEl.textContent = this.getRarityName(card.rarity);
            rarityEl.className = `card-detail-rarity-tag ${card.rarity || 'common'}`;
        }

        // 4. バッジ群（陣営、コスト、攻撃、防御）
        const factionEl = document.getElementById('card-detail-faction');
        if (factionEl) {
            factionEl.textContent = this.getFactionName(card.faction) || '中立';
            factionEl.className = `detail-badge-pill faction-${card.faction}`;
        }

        const costEl = document.getElementById('card-detail-stats-cost');
        if (costEl) {
            costEl.textContent = card.unplayable ? '使用不可' : `費用: ${card.cost ?? 0} 文`;
        }

        const atkEl = document.getElementById('card-detail-stats-atk');
        if (atkEl) {
            if (card.attack) {
                atkEl.textContent = `攻撃: ${card.attack}`;
                atkEl.style.display = 'inline-block';
            } else {
                atkEl.style.display = 'none';
            }
        }

        const defEl = document.getElementById('card-detail-stats-def');
        if (defEl) {
            if (card.shield) {
                defEl.textContent = `防御: ${card.shield}`;
                defEl.style.display = 'inline-block';
            } else {
                defEl.style.display = 'none';
            }
        }

        // 5. 効果テキスト
        const effectEl = document.getElementById('card-detail-effect');
        if (effectEl) {
            effectEl.textContent = card.desc || '効果なし';
        }

        // 6. 人物伝（志士カードの場合）
        const bioSection = document.getElementById('card-detail-bio-section');
        const bioEl = document.getElementById('card-detail-bio');
        if (card.type === 'shishi' && card.bio) {
            if (bioSection) bioSection.style.display = 'block';
            if (bioEl) bioEl.textContent = card.bio;
        } else {
            if (bioSection) bioSection.style.display = 'none';
        }

        // 7. 連携・絆効果
        const synergySection = document.getElementById('card-detail-synergy-section');
        const synergyEl = document.getElementById('card-detail-synergy');
        let synergyHtml = '';

        if (card.character && GAME_DATA.combos) {
            const relatedCombos = GAME_DATA.combos.filter(cb => cb.chars && cb.chars.includes(card.character));
            if (relatedCombos.length > 0) {
                synergyHtml = relatedCombos.map(cb => {
                    const partnerChars = cb.chars
                        .filter(ch => ch !== card.character)
                        .map(ch => {
                            const pCard = Object.values(GAME_DATA.cards).find(c => c.character === ch);
                            return pCard ? pCard.name.split('：')[0] : ch;
                        })
                        .join('・');
                    return `<strong>${cb.title}</strong>（連携相手：${partnerChars || '自身'}）<br><span style="opacity:0.9">${cb.desc}</span>`;
                }).join('<hr style="border:none;border-top:1px dashed rgba(0,188,212,0.3);margin:6px 0;">');
            }
        }

        if (synergyHtml) {
            if (synergySection) synergySection.style.display = 'block';
            if (synergyEl) synergyEl.innerHTML = synergyHtml;
        } else {
            if (synergySection) synergySection.style.display = 'none';
        }

        modal.classList.add('active');
        if (window.soundSystem) {
            if (typeof window.soundSystem.playConnectLink === 'function') {
                window.soundSystem.playConnectLink();
            } else if (typeof window.soundSystem.playHyoshigi === 'function') {
                window.soundSystem.playHyoshigi();
            }
        }
    }

    closeCardDetailModal() {
        const modal = document.getElementById('modal-card-detail');
        if (modal) {
            modal.classList.remove('active');
        }
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
            cardsContainer.scrollLeft = 0; // スクロール位置を左端（先頭カード）に初期化

            if (!rewardData.cards || rewardData.cards.length === 0) {
                cardsContainer.innerHTML = '<div style="color: #e53e3e; padding: 20px; text-align: center; font-weight: bold; width: 100%; font-size: 1.05rem;">☠️【朝敵指定・完全孤立】世論完全敵対のため、味方する新たな志士は現れなかった…（提示カード0枚）</div>';
            }

            const scrollHint = document.getElementById('reward-scroll-hint');
            if (scrollHint) {
                // 4枚以上の選択肢がある場合にスクロール案内を有効化
                scrollHint.style.display = (rewardData.cards && rewardData.cards.length >= 4) ? '' : 'none';
            }

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

        // 戦果確認ウィンドウ表示中のBGM再生
        if (window.soundSystem && window.soundSystem.playBgm) {
            window.soundSystem.playBgm('reward');
        }
    }

    closeRewardModal() {
        document.getElementById('modal-reward').classList.remove('active');
        this.app.checkActProgressOrReturnMap();
    }

    showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `toast-msg toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 3200);
    }
}
