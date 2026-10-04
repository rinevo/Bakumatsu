/**
 * 幕末風雲録：双極の蒼穹 - Rogue Deck-Build -
 * 戦闘ロジック・ターン進行・AI・連鎖・コネクトリンク エンジン
 */

class BattleSystem {
    constructor(app) {
        this.app = app;

        // 戦闘中ステータス
        this.playerHp = 0;
        this.playerMaxHp = 0;
        this.playerShield = 0;
        this.playerEnergy = 3;
        this.playerMaxEnergy = 3;

        // デッキ・手札
        this.drawPile = [];
        this.hand = [];
        this.discardPile = [];
        this.exhaustPile = [];

        // 敵情報
        this.enemy = null;
        this.enemyIntentIndex = 0;
        this.enemyComboCount = 0;

        // 敵デッキ・手札・捨札
        this.enemyDeck = [];
        this.enemyDrawPile = [];
        this.enemyHand = [];
        this.enemyDiscardPile = [];
        this.enemyPendingCard = null;

        // ターン内記録
        this.turnCount = 0;
        this.comboCount = 0;
        this.playedThisTurn = [];
        this.triggeredCombosThisTurn = new Set();
        this.turnEndDiscardCount = 0;

        // 状態異常・バフ
        this.playerBuffs = {
            strength: 0,
            thorns: 0,
            damage_reduction: 0,
            auto_gatling: 0
        };
        this.enemyStatus = {
            weak: 0,
            bleed: 0
        };

        // モディファイア
        this.westernCostDiscount = 0;
        this.imperialMultiplier = 1.0;
        this.shieldBonus = 0;
        this.handDrawBonus = 0;

        // 手札温存（キープ）設定（最大5枚まで）
        this.maxKeepCount = 5;

        this.isPlayerTurn = false;
        this.isBattleOver = false;
    }

    startBattle(enemyData) {
        this.isBattleOver = false;
        this.turnCount = 0;
        this.comboCount = 0;
        this.playedThisTurn = [];
        this.triggeredCombosThisTurn = new Set();

        // プレイヤー初期化
        this.playerHp = this.app.hp;
        this.playerMaxHp = this.app.maxHp;
        this.playerShield = 0;
        this.playerMaxEnergy = 3;
        this.playerEnergy = this.playerMaxEnergy;

        this.playerBuffs = {
            strength: this.app.nextBattleStrengthBuff || 0,
            thorns: 0,
            damage_reduction: 0,
            auto_gatling: 0
        };
        this.playerDebuffs = {
            weak: 0,
            vulnerable: 0,
            bleed: 0
        };
        this.app.nextBattleStrengthBuff = 0;

        this.enemyStatus = {
            weak: 0,
            bleed: 0
        };

        // モディファイアリセット
        this.westernCostDiscount = 0;
        this.imperialMultiplier = 1.0;
        this.shieldBonus = 0;
        this.handDrawBonus = 0;

        // 世論（モディファイア）適用
        if (this.app.currentTrend && this.app.currentTrend.applyBattleStart) {
            this.app.currentTrend.applyBattleStart(this);
        }

        // 開幕シールド（初期防陣）の計算（第二幕・終幕の敵耐久強化）
        const currentAct = (this.app.map && this.app.map.currentAct) ? this.app.map.currentAct : 1;
        let defaultStartShield = 0;
        if (currentAct === 2) {
            defaultStartShield = enemyData.isBoss ? 35 : (enemyData.isElite ? 25 : 15);
        } else if (currentAct === 3) {
            defaultStartShield = enemyData.isFinalBoss ? 50 : (enemyData.isElite ? 35 : 25);
        }
        const initialShield = (enemyData.startShield !== undefined) ? enemyData.startShield : defaultStartShield;

        // 敵データクローン
        this.enemy = {
            name: enemyData.name,
            maxHp: enemyData.maxHp,
            hp: enemyData.maxHp,
            shield: initialShield,
            isElite: enemyData.isElite || false,
            isBoss: enemyData.isBoss || false,
            isFinalBoss: enemyData.isFinalBoss || false,
            sprite: enemyData.sprite,
            intents: JSON.parse(JSON.stringify(enemyData.intents)),
            buffStrength: 0,
            stunned: false,
            intent: null
        };
        this.enemyIntentIndex = 0;
        this.enemyComboCount = 0;

        if (initialShield > 0) {
            setTimeout(() => {
                if (window.particleSystem && window.particleSystem.createFloatingText) {
                    window.particleSystem.createFloatingText(`敵防陣展開: シールド+${initialShield}`, window.innerWidth / 2, window.innerHeight * 0.3, "#4299e1");
                }
            }, 300);
        }

        // 敵デッキ・手札の初期化
        this.initEnemyDeck(enemyData);
        this.drawEnemyCards(3);

        // プレイヤーデッキ初期化（シャッフルして山札へ）
        this.drawPile = this.shuffleArray([...this.app.deck]);
        this.discardPile = [];
        this.exhaustPile = [];
        this.hand = [];

        // レリックの戦闘開始時効果
        this.app.relics.forEach(relicId => {
            const r = GAME_DATA.relics[relicId];
            if (r && r.onBattleStart) {
                r.onBattleStart(this);
            }
        });

        // ==========================================
        // 世論（天下の大勢）陣営優劣モディファイア
        // ==========================================
        const situation = this.app.getFactionSituation ? this.app.getFactionSituation() : 'neutral';
        const phase = this.app.getPublicOpinionPhase ? this.app.getPublicOpinionPhase() : null;

        if (situation === 'extreme_disadvantage') {
            // ☠️ 極限劣勢（朝敵討滅令・完全孤立無援・世論敵対100%）: 手札-2枚、敵剛力+12、敵開幕シールド80、プレイヤー脱力4 & 脆弱4
            this.handDrawBonus -= 2;
            this.enemy.buffStrength = (this.enemy.buffStrength || 0) + 12;
            this.enemy.shield = (this.enemy.shield || 0) + 80;
            this.playerDebuffs.weak = 4;
            this.playerDebuffs.vulnerable = 4;
            if (window.particleSystem && window.particleSystem.createFloatingText) {
                setTimeout(() => {
                    window.particleSystem.createFloatingText("☠️【朝敵討滅令】世論100%完全孤立！手札-2 / 敵剛力+12 / 敵防80 / 脱力4 / 脆弱4 / 毎ターン投石8ダメ / 報酬ゼロ", window.innerWidth / 2, window.innerHeight * 0.4, "#9b2c2c");
                }, 500);
            }
            if (window.soundSystem && window.soundSystem.playTaiko) {
                window.soundSystem.playTaiko(true);
            }
        } else if (situation === 'super_disadvantage') {
            // 🚨 強烈な劣勢（孤立無援・朝敵・逆賊）: 手札-1枚、敵剛力+10、敵開幕シールド60、プレイヤー脱力3 & 脆弱3
            this.handDrawBonus -= 1;
            this.enemy.buffStrength = (this.enemy.buffStrength || 0) + 10;
            this.enemy.shield = (this.enemy.shield || 0) + 60;
            this.playerDebuffs.weak = 3;
            this.playerDebuffs.vulnerable = 3;
            if (window.particleSystem && window.particleSystem.createFloatingText) {
                setTimeout(() => {
                    window.particleSystem.createFloatingText("🚨【孤立無援】世論極限劣勢！手札-1 / 敵剛力+10 / 敵防60 / 脱力3 / 脆弱3 / 毎ターン投石6ダメ", window.innerWidth / 2, window.innerHeight * 0.4, "#e53e3e");
                }, 500);
            }
            if (window.soundSystem && window.soundSystem.playTaiko) {
                window.soundSystem.playTaiko(true);
            }
        } else if (situation === 'disadvantage') {
            // ⚠️ やや劣勢（逆風）: 敵剛力+4、敵開幕シールド20、自軍開幕脱力2
            this.enemy.buffStrength = (this.enemy.buffStrength || 0) + 4;
            this.enemy.shield = (this.enemy.shield || 0) + 20;
            this.playerDebuffs.weak = 2;
            if (window.particleSystem && window.particleSystem.createFloatingText) {
                setTimeout(() => {
                    window.particleSystem.createFloatingText("⚠️【世論逆風】敵剛力+4 / 敵防20 / 自軍脱力2", window.innerWidth / 2, window.innerHeight * 0.4, "#dd6b20");
                }, 500);
            }
        } else if (situation === 'neutral') {
            // ⚖️ 拮抗（天下混迷・公武融和）: シールド獲得時+1
            this.shieldBonus += 1;
        } else if (situation === 'advantage') {
            // ✨ やや優勢（追い風）: プレイヤー剛力+2、開幕シールド+5
            this.applyPlayerBuff('strength', 2);
            this.playerShield += 5;
            if (window.particleSystem && window.particleSystem.createFloatingText) {
                setTimeout(() => {
                    window.particleSystem.createFloatingText("✨【世論追い風】大義の士気（剛力+2 / 防+5）", window.innerWidth / 2, window.innerHeight * 0.4, "#319795");
                }, 500);
            }
        } else if (situation === 'super_advantage') {
            // 🌟 絶大優勢（大義名分・官軍・幕威轟々）: プレイヤー剛力+4、開幕シールド+10、敵士気動揺（脱力2）
            this.applyPlayerBuff('strength', 4);
            this.playerShield += 10;
            this.enemyStatus.weak = 2;
            if (window.particleSystem && window.particleSystem.createFloatingText) {
                setTimeout(() => {
                    window.particleSystem.createFloatingText("🌟【大義名分】天下の大勢を掌握！（剛力+4 / 防+10）", window.innerWidth / 2, window.innerHeight * 0.4, "#d69e2e");
                }, 500);
            }
            if (window.soundSystem && window.soundSystem.playKoto) {
                window.soundSystem.playKoto();
            }
        }

        // ==========================================
        // 志士結束アライアンス（デッキ内志士の組み合わせによる常時パッシブ恩恵）
        // ==========================================
        this.triggerShishiAlliances();

        // 最初の敵Intent（手札からカード選定）
        this.pickEnemyIntent();

        // プレイヤー第1ターン開始
        this.startPlayerTurn();
    }

    triggerShishiAlliances() {
        if (!this.app || !this.app.hasShishi) return;

        // 1. 松下村塾・至誠天動（松陰、晋作、玄瑞、稔麿、九一、博文、有朋のうち2名以上）
        const shokaMembers = ['yoshida', 'takasugi', 'kusaka', 'yoshida_minomaru', 'irie', 'ito', 'yamagata'];
        const shokaCount = shokaMembers.filter(m => this.app.hasShishi(m)).length;
        if (shokaCount >= 2) {
            this.handDrawBonus += 1;
            this.applyPlayerBuff('strength', 2);
            setTimeout(() => {
                if (window.particleSystem && window.particleSystem.createFloatingText) {
                    window.particleSystem.createFloatingText("🏮【松下村塾・至誠天動】志士集結！（初手ドロー+1 / 剛力+2）", window.innerWidth / 2, window.innerHeight * 0.35, "#48bb78");
                }
            }, 600);
        }

        // 2. 誠の血盟・新選組中核（近藤、土方、沖田、斎藤、永倉、原田のうち2名以上）
        const shinsenMembers = ['kondo', 'hijikata', 'okita', 'saito', 'nagakura', 'harada'];
        const shinsenCount = shinsenMembers.filter(m => this.app.hasShishi(m)).length;
        if (shinsenCount >= 2) {
            this.enemyStatus.weak = (this.enemyStatus.weak || 0) + 2;
            this.playerShield += 8;
            setTimeout(() => {
                if (window.particleSystem && window.particleSystem.createFloatingText) {
                    window.particleSystem.createFloatingText("🗡️【誠の血盟・新選組】敵威圧！（敵脱力2 / 自軍防+8）", window.innerWidth / 2, window.innerHeight * 0.38, "#63b3ed");
                }
            }, 750);
        }

        // 3. 薩摩示現・精忠義気（西郷、大久保、有馬、半次郎、黒田のうち2名以上）
        const satsumaMembers = ['saigo', 'okubo', 'arima', 'nakamura', 'kuroda'];
        const satsumaCount = satsumaMembers.filter(m => this.app.hasShishi(m)).length;
        if (satsumaCount >= 2) {
            if (this.enemy.shield > 0) {
                this.enemy.shield = Math.floor(this.enemy.shield / 2);
            }
            this.applyPlayerBuff('strength', 2);
            setTimeout(() => {
                if (window.particleSystem && window.particleSystem.createFloatingText) {
                    window.particleSystem.createFloatingText("⚡【薩摩示現・精忠義気】一撃必殺の気迫！（敵防半減 / 剛力+2）", window.innerWidth / 2, window.innerHeight * 0.42, "#ed8936");
                }
            }, 900);
        }

        // 4. 土佐海援・天下の奔流（龍馬、中岡、半平太、象二郎、退助のうち2名以上）
        const tosaMembers = ['ryoma', 'nakaoka', 'takechi', 'goto', 'itagaki'];
        const tosaCount = tosaMembers.filter(m => this.app.hasShishi(m)).length;
        if (tosaCount >= 2) {
            this.playerEnergy += 1;
            setTimeout(() => {
                if (window.particleSystem && window.particleSystem.createFloatingText) {
                    window.particleSystem.createFloatingText("🌊【土佐海援・天下の奔流】時代の胎動！（開幕文+1）", window.innerWidth / 2, window.innerHeight * 0.45, "#9f7aea");
                }
            }, 1050);
        }
    }

    initEnemyDeck(enemyData) {
        this.enemyDeck = [];
        this.enemyDrawPile = [];
        this.enemyHand = [];
        this.enemyDiscardPile = [];
        this.enemyPendingCard = null;

        const intents = enemyData.intents || [];
        if (intents.length === 0) return;

        // 敵の技データから10枚のカードデッキを生成
        const targetDeckSize = 10;
        const repeatCount = Math.ceil(targetDeckSize / intents.length);

        let cardIdx = 1;
        for (let r = 0; r < repeatCount; r++) {
            for (let i = 0; i < intents.length; i++) {
                if (this.enemyDeck.length >= targetDeckSize) break;
                const intent = intents[i];
                const card = {
                    id: `enemy_card_${cardIdx++}`,
                    intentIndex: i,
                    name: intent.desc,
                    type: intent.type, // 'attack', 'defend', 'buff', 'curse'
                    damage: intent.damage || 0,
                    shield: intent.shield || 0,
                    strength: intent.strength || 0,
                    curseId: intent.curseId || null,
                    times: intent.times || 1,
                    desc: intent.desc,
                    ownerName: enemyData.name,
                    isPending: false
                };
                this.enemyDeck.push(card);
            }
        }

        // 山札をシャッフル
        this.enemyDrawPile = this.shuffleArray([...this.enemyDeck]);
    }

    drawEnemyCards(count) {
        for (let i = 0; i < count; i++) {
            if (this.enemyDrawPile.length === 0) {
                if (this.enemyDiscardPile.length === 0) break;
                // 敵の捨て札をシャッフルして山札へ
                this.enemyDrawPile = this.shuffleArray([...this.enemyDiscardPile]);
                this.enemyDiscardPile = [];
            }
            if (this.enemyDrawPile.length > 0) {
                const card = this.enemyDrawPile.pop();
                card.isPending = false;
                this.enemyHand.push(card);
            }
        }
    }

    pickEnemyIntent() {
        if (!this.enemy) return;

        // 手札が足りない場合は補充
        if (this.enemyHand.length === 0) {
            this.drawEnemyCards(3);
        }
        if (this.enemyHand.length === 0) return;

        // 手札の全カードの pending をリセット
        this.enemyHand.forEach(c => c.isPending = false);

        // 手札の中から次にプレイするカードを決定
        const selectedIndex = this.enemyIntentIndex % this.enemyHand.length;
        this.enemyIntentIndex++;

        this.enemyPendingCard = this.enemyHand[selectedIndex];
        this.enemyPendingCard.isPending = true;

        // 敵のIntentオブジェクトを生成
        this.enemy.intent = { ...this.enemyPendingCard };

        // 敵の筋力バフを加算
        if (this.enemy.intent.type === 'attack' && this.enemy.buffStrength) {
            this.enemy.intent.damage += this.enemy.buffStrength;
        }
    }

    startPlayerTurn() {
        if (this.isBattleOver) return;

        this.turnCount++;
        this.isPlayerTurn = true;
        this.comboCount = 0;
        this.playedThisTurn = [];
        this.triggeredCombosThisTurn.clear();
        this.turnEndDiscardCount = 0;

        // シールドリセット（一部レリックがあれば保持可能）
        this.playerShield = 0;

        // 文の回復
        this.playerEnergy = this.playerMaxEnergy;

        // ターン開始時レリック効果
        this.app.relics.forEach(relicId => {
            const r = GAME_DATA.relics[relicId];
            if (r && r.onTurnStart) {
                r.onTurnStart(this, this.turnCount);
            }
        });

        // カードドロー (基本手札枚数は5枚 + ボーナス / 強劣勢時のペナルティ)
        // 温存したカードがある場合、目標手札枚数になるよう補充（例: 5枚温存時は0枚ドローで温存した5枚がそのまま手札になる）
        const targetHandSize = Math.max(2, 5 + this.handDrawBonus);
        const currentHandCount = this.hand.length;
        const drawCount = Math.max(0, targetHandSize - currentHandCount);
        if (drawCount > 0) {
            this.drawCards(drawCount);
        }

        window.soundSystem.playHyoshigi();
        this.app.ui.updateBattleUI();
    }

    // --- 手札カードの温存（キープ）トグル ---
    toggleCardKeep(instanceId) {
        if (!this.isPlayerTurn || this.isBattleOver) return;

        const card = this.hand.find(c => c.instanceId === instanceId);
        if (!card) return;

        if (card.isKept) {
            card.isKept = false;
        } else {
            const currentKeptCount = this.hand.filter(c => c.isKept).length;
            const maxAllowed = this.maxKeepCount || 5;
            if (currentKeptCount >= maxAllowed) {
                if (window.soundSystem && window.soundSystem.playWarning) {
                    window.soundSystem.playWarning();
                }
                if (window.particleSystem && window.particleSystem.createFloatingText) {
                    window.particleSystem.createFloatingText(`温存は最大${maxAllowed}枚までです`, window.innerWidth / 2, window.innerHeight * 0.6, "#ecc94b");
                }
                return;
            }
            card.isKept = true;
            if (window.soundSystem && window.soundSystem.playDraw) {
                window.soundSystem.playDraw();
            }
        }

        if (this.app.ui && this.app.ui.updateBattleUI) {
            this.app.ui.updateBattleUI();
        }
    }

    drawCards(count) {
        for (let i = 0; i < count; i++) {
            if (this.drawPile.length === 0) {
                if (this.discardPile.length === 0) break;
                // 捨て札をシャッフルして山札へ
                this.drawPile = this.shuffleArray([...this.discardPile]);
                this.discardPile = [];
                window.soundSystem.playTaiko(false);
            }
            if (this.drawPile.length > 0) {
                const cardId = this.drawPile.pop();
                const cardData = GAME_DATA.cards[cardId];
                if (cardData) {
                    const cardInstance = { ...cardData, instanceId: Math.random().toString(36).substr(2, 9) };
                    this.hand.push(cardInstance);

                    // 引いた時の効果（呪い等）
                    if (cardInstance.onDrawn) {
                        cardInstance.onDrawn(this);
                    }
                }
            }
        }
    }

    calculateCardCost(card) {
        // マスターデータから本来の基本コストを厳格に取得（意図しないコスト変動や温存割引を完全排除）
        const masterCard = (typeof GAME_DATA !== 'undefined' && GAME_DATA.cards) ? GAME_DATA.cards[card.id] : null;
        let cost = (masterCard && masterCard.cost !== undefined) ? masterCard.cost : (card.cost || 0);

        // 関税自主権喪失の呪いが手札にある場合、全コスト+1
        const hasTariff = this.hand.some(c => c.id === 'curse_tariff');
        if (hasTariff) {
            cost += 1;
        }

        // 開国世論などの西洋火器割引
        if (card.faction === 'neutral' && this.westernCostDiscount) {
            cost = Math.max(0, cost - this.westernCostDiscount);
        }

        return Math.max(0, cost);
    }

    canPlayCard(cardInstance) {
        if (!this.isPlayerTurn || this.isBattleOver) return false;
        if (cardInstance.unplayable) return false;
        const actualCost = this.calculateCardCost(cardInstance);
        return this.playerEnergy >= actualCost;
    }

    playCard(cardIndex) {
        if (cardIndex < 0 || cardIndex >= this.hand.length) return;
        const card = this.hand[cardIndex];
        if (!this.canPlayCard(card)) {
            window.soundSystem.playWarning();
            return;
        }

        const cost = this.calculateCardCost(card);
        this.playerEnergy -= cost;

        // 手札から取り出す
        this.hand.splice(cardIndex, 1);
        this.playedThisTurn.push(card);

        // 連鎖カウント増加
        this.comboCount++;
        const comboKanji = this.getComboKanji(this.comboCount);
        window.particleSystem.showComboText(comboKanji, this.comboCount);
        window.soundSystem.playCombo(this.comboCount);

        // コネクト・リンク判定（特定キャラクター同士の共鳴）
        this.checkConnectLink(card);

        // 基本カード効果（攻撃・防御）
        let baseAttack = card.attack || 0;
        let baseShield = card.shield || 0;

        if (baseAttack > 0) {
            // 筋力バフ加算
            let totalAttack = baseAttack + (this.playerBuffs.strength || 0);
            // 連鎖ボーナス（3連鎖目以降少しダメージUP）
            if (this.comboCount >= 3) {
                totalAttack += Math.floor((this.comboCount - 2) * 1.5);
            }
            // プレイヤー脱力（Weak）デバフ：与ダメージ25%減
            if (this.playerDebuffs && this.playerDebuffs.weak > 0) {
                totalAttack = Math.floor(totalAttack * 0.75);
            }
            this.dealDamageToEnemy(totalAttack);
        }

        if (baseShield > 0) {
            let totalShield = baseShield + this.shieldBonus;
            this.gainPlayerShield(totalShield);
        }

        // カード固有効果の実行
        if (card.onPlay) {
            card.onPlay(this, card);
        }

        // レリックのカード使用時効果
        this.app.relics.forEach(relicId => {
            const r = GAME_DATA.relics[relicId];
            if (r && r.onCardPlayed) {
                r.onCardPlayed(this, card);
            }
        });

        // 墓地または除外へ送る
        if (card.type !== 'shishi' && card.exhaust) {
            this.exhaustPile.push(card.id);
        } else {
            this.discardPile.push(card.id);
        }

        // 敵死亡判定
        if (this.enemy && this.enemy.hp <= 0) {
            this.handleEnemyDefeated();
            return;
        }

        this.app.ui.updateBattleUI();
    }

    checkConnectLink(currentCard) {
        // 1. 志士同士のコネクトリンク（GAME_DATA.combosを参照）
        if (currentCard.character && GAME_DATA.combos) {
            const possibleCombos = GAME_DATA.combos
                .filter(combo => combo.chars && combo.chars.includes(currentCard.character) && !this.triggeredCombosThisTurn.has(combo.id))
                .sort((a, b) => b.chars.length - a.chars.length);

            for (const combo of possibleCombos) {
                const otherChars = combo.chars.filter(ch => ch !== currentCard.character);
                if (otherChars.length === 0) continue;

                // このターン既にプレイされたカードの中に必要な他の志士がすべているか確認
                const allPartnersPresent = otherChars.every(reqChar =>
                    this.playedThisTurn.some(c => c !== currentCard && c.character === reqChar)
                );

                if (allPartnersPresent) {
                    // コネクトリンク発動！
                    this.triggeredCombosThisTurn.add(combo.id);
                    window.soundSystem.playConnectLink();
                    window.particleSystem.createSparks(window.innerWidth / 2, window.innerHeight * 0.45, 25, true);

                    // 連鎖墨文字を必ず表示！
                    if (combo.title) {
                        window.particleSystem.showComboText(combo.title, this.comboCount);
                    }

                    // コンボ効果の適用
                    if (combo.apply) {
                        combo.apply(this, currentCard);
                    }
                    return;
                }
            }
        }
    }

    getComboKanji(count) {
        const kanji = ["零", "壱之連", "弐之連", "参之連", "肆之連", "伍之連", "陸之連", "漆之連", "捌之連", "玖之連", "拾之連！"];
        return kanji[count] || `${count}之連！！`;
    }

    dealDamageToEnemy(amount) {
        if (!this.enemy || amount <= 0) return;

        let dmg = amount;
        // 敵のシールド消費
        if (this.enemy.shield > 0) {
            if (this.enemy.shield >= dmg) {
                this.enemy.shield -= dmg;
                dmg = 0;
                window.soundSystem.playShield();
            } else {
                dmg -= this.enemy.shield;
                this.enemy.shield = 0;
                window.soundSystem.playShield();
                window.soundSystem.playSlash();
            }
        } else {
            window.soundSystem.playSlash();
        }

        if (dmg > 0) {
            this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
        }

        // 敵要素に斬撃エフェクト
        const enemyElem = document.getElementById('battle-enemy-container');
        if (enemyElem) {
            window.particleSystem.triggerEnemySlash(enemyElem);
        }
    }

    dealPiercingDamageToEnemy(amount) {
        if (!this.enemy || amount <= 0) return;
        this.enemy.hp = Math.max(0, this.enemy.hp - amount);
        window.soundSystem.playHeavySlash();

        const enemyElem = document.getElementById('battle-enemy-container');
        if (enemyElem) {
            window.particleSystem.triggerEnemySlash(enemyElem, '#ff3333');
        }
    }

    gainPlayerShield(amount) {
        if (amount <= 0) return;
        this.playerShield += amount;
        window.soundSystem.playShield();
    }

    gainPlayerEnergy(amount) {
        this.playerEnergy += amount;
    }

    healPlayer(amount) {
        if (amount <= 0) return;
        this.playerHp = Math.min(this.playerMaxHp, this.playerHp + amount);
        this.app.hp = this.playerHp;
        this.app.ui.updateHeader();
    }

    damagePlayerDirect(amount) {
        this.playerHp = Math.max(0, this.playerHp - amount);
        this.app.hp = this.playerHp;
        window.soundSystem.playHeavySlash();

        if (this.playerHp <= 0) {
            this.handlePlayerDefeated("戦闘により力尽きた…");
        }
    }

    damagePlayerWithShield(amount) {
        let dmg = amount;

        // 脆弱デバフ（被ダメージ50%増加）
        if (this.playerDebuffs && this.playerDebuffs.vulnerable > 0) {
            dmg = Math.round(dmg * 1.5);
        }

        // ダメージ軽減バフ
        if (this.playerBuffs.damage_reduction > 0) {
            dmg = Math.max(0, dmg - this.playerBuffs.damage_reduction);
        }

        // シールド消費
        if (this.playerShield > 0) {
            if (this.playerShield >= dmg) {
                this.playerShield -= dmg;
                dmg = 0;
                window.soundSystem.playShield();
            } else {
                dmg -= this.playerShield;
                this.playerShield = 0;
                window.soundSystem.playShield();
                window.soundSystem.playHeavySlash();
            }
        } else {
            window.soundSystem.playHeavySlash();
        }

        if (dmg > 0) {
            this.playerHp = Math.max(0, this.playerHp - dmg);
            this.app.hp = this.playerHp;

            const hpFills = [
                document.getElementById('header-hp-fill'),
                document.getElementById('battle-player-hp-fill')
            ].filter(Boolean);
            hpFills.forEach(fill => {
                fill.classList.remove('hp-damage-flash');
                void fill.offsetWidth;
                fill.classList.add('hp-damage-flash');
                setTimeout(() => fill.classList.remove('hp-damage-flash'), 420);
            });

            const battleScreen = document.getElementById('screen-battle');
            if (battleScreen) {
                battleScreen.classList.remove('battle-damage-impact');
                void battleScreen.offsetWidth;
                battleScreen.classList.add('battle-damage-impact');
                setTimeout(() => battleScreen.classList.remove('battle-damage-impact'), 520);
            }

            window.particleSystem.createInkSplash(
                window.innerWidth * 0.5,
                window.innerHeight * 0.78,
                32,
                'rgba(220, 20, 20, '
            );
            window.particleSystem.createSparks(
                window.innerWidth * 0.5,
                window.innerHeight * 0.78,
                24,
                false
            );
        }

        window.particleSystem.createSparks(
            window.innerWidth * 0.5,
            window.innerHeight * 0.78,
            12,
            false
        );

        // 反撃（Thorns）
        if (this.playerBuffs.thorns > 0) {
            this.dealDamageToEnemy(this.playerBuffs.thorns);
        }

        if (this.playerHp <= 0) {
            this.handlePlayerDefeated("敵の太刀筋に倒れた…");
        }
    }

    applyPlayerBuff(type, val) {
        this.playerBuffs[type] = (this.playerBuffs[type] || 0) + val;
    }

    applyStatusToEnemy(type, val) {
        this.enemyStatus[type] = (this.enemyStatus[type] || 0) + val;
    }

    discardEntireHand() {
        const keptCards = [];
        while (this.hand.length > 0) {
            const c = this.hand.shift();
            if (c.isKept) {
                c.isKept = false;
                delete c.wasKeptLastTurn;
                // マスターデータから基本コストを厳格にリセット（いかなる温存割引も排除）
                if (typeof GAME_DATA !== 'undefined' && GAME_DATA.cards && GAME_DATA.cards[c.id]) {
                    c.cost = GAME_DATA.cards[c.id].cost;
                }
                keptCards.push(c);
            } else {
                delete c.wasKeptLastTurn;
                this.discardPile.push(c.id);
            }
        }
        this.hand = keptCards;
    }

    modifyImperialGauge(delta) {
        let actual = delta;
        if (delta > 0) {
            actual = Math.round(delta * this.imperialMultiplier);
            // レリック「尊皇不抜の建白書」があれば25%減
            if (this.app.hasRelic("iron_will")) {
                actual = Math.round(actual * 0.75);
            }
        }
        this.app.modifyImperialGauge(actual);

        // 100%植民地化ゲームオーバーチェック
        if (this.app.imperialGauge >= 100) {
            this.handlePlayerDefeated("列強の介入が限界に達し、日本は植民地化された…（列強植民地敗北）");
        }
    }

    // --- ターン終了（プレイヤー → 敵） ---
    endPlayerTurn() {
        if (!this.isPlayerTurn || this.isBattleOver) return;
        this.isPlayerTurn = false;

        // 1. 手札に残った呪いカードの効果発動
        this.hand.forEach(c => {
            if (c.onTurnEndInHand) {
                c.onTurnEndInHand(this);
            }
        });

        // 2. 土方歳三等の代償（手札破棄）
        if (this.turnEndDiscardCount > 0 && this.hand.length > 0) {
            const discardCount = Math.min(this.turnEndDiscardCount, this.hand.length);
            for (let i = 0; i < discardCount; i++) {
                const discarded = this.hand.shift();
                this.discardPile.push(discarded.id);
            }
        }

        // 3. 自動攻撃（ガトリング砲など）
        if (this.playerBuffs.auto_gatling > 0) {
            this.dealDamageToEnemy(this.playerBuffs.auto_gatling);
            window.soundSystem.playGunshot();
        }

        // 4. 世論のターン終了効果
        if (this.app.currentTrend && this.app.currentTrend.onTurnEnd) {
            this.app.currentTrend.onTurnEnd(this);
        }

        // 4.1 世論（天下の大勢）劣勢時の民衆投石・刺客スリップダメージ
        const situation = this.app.getFactionSituation ? this.app.getFactionSituation() : 'neutral';
        if (situation === 'extreme_disadvantage' || situation === 'super_disadvantage') {
            const isExtreme = situation === 'extreme_disadvantage';
            const stoneDamage = isExtreme ? 8 : 6;
            this.damagePlayerDirect(stoneDamage);
            if (window.particleSystem && window.particleSystem.createFloatingText) {
                const label = isExtreme ? "民衆の一斉蜂起・狙撃: 8ダメ" : "民衆の投石・敵視: 6ダメ";
                window.particleSystem.createFloatingText(label, window.innerWidth / 2, window.innerHeight * 0.45, "#e53e3e");
            }
            if (window.soundSystem && window.soundSystem.playTaiko) {
                window.soundSystem.playTaiko(false);
            }
            if (this.playerHp <= 0) {
                this.handlePlayerDefeated("民衆の敵視と追手の刃に呑まれ、力尽きた…");
                return;
            }
        }

        // プレイヤーのデバフ持続ターン減衰
        if (this.playerDebuffs && this.playerDebuffs.weak > 0) {
            this.playerDebuffs.weak--;
        }
        if (this.playerDebuffs && this.playerDebuffs.vulnerable > 0) {
            this.playerDebuffs.vulnerable--;
        }

        // 5. 手札を捨て札へ
        this.discardEntireHand();

        this.app.ui.updateBattleUI();

        // 敵が死んでいれば勝利
        if (this.enemy.hp <= 0) {
            this.handleEnemyDefeated();
            return;
        }

        // 6. 敵の行動実行（少しディレイを挟んで緊迫感を演出）
        setTimeout(() => {
            this.executeEnemyTurn();
        }, 600);
    }

    executeEnemyTurn() {
        if (this.isBattleOver) return;

        // 敵の気絶チェック
        if (this.enemy.stunned) {
            this.enemy.stunned = false;
            window.soundSystem.playHyoshigi();
            this.finishEnemyTurn();
            return;
        }

        // 流血（Bleed）処理
        if (this.enemyStatus.bleed > 0) {
            this.dealDamageToEnemy(this.enemyStatus.bleed);
            this.enemyStatus.bleed--;
            if (this.enemy.hp <= 0) {
                this.handleEnemyDefeated();
                return;
            }
        }

        // プレイする敵カードを手札から取得
        let playedCard = this.enemyPendingCard;
        const cardIndex = this.enemyHand.findIndex(c => c === playedCard);
        if (cardIndex !== -1) {
            this.enemyHand.splice(cardIndex, 1);
        } else if (this.enemyHand.length > 0) {
            playedCard = this.enemyHand.shift();
        }

        // カード情報がない場合のフォールバック（既存intent）
        const intent = playedCard || this.enemy.intent;
        if (!intent) {
            this.finishEnemyTurn();
            return;
        }

        // 効果適用処理関数
        const applyCardEffects = () => {
            if (this.isBattleOver) return;

            const isOffensiveIntent = intent.type === 'attack' || intent.type === 'curse';
            this.enemyComboCount = isOffensiveIntent ? this.enemyComboCount + 1 : 0;
            const comboLabel = this.enemyComboCount >= 2 ? `・敵${this.enemyComboCount}連撃` : '';
            if (window.particleSystem && window.particleSystem.showEnemyActionText) {
                window.particleSystem.showEnemyActionText(`敵技・${intent.desc || intent.name}${comboLabel}`, this.enemyComboCount);
            }

            switch (intent.type) {
                case 'attack': {
                    let dmg = intent.damage;
                    // 脱力（Weak）でダメージ25%減
                    if (this.enemyStatus.weak > 0) {
                        dmg = Math.floor(dmg * 0.75);
                    }
                    const times = intent.times || 1;
                    for (let t = 0; t < times; t++) {
                        setTimeout(() => {
                            if (!this.isBattleOver) {
                                this.damagePlayerWithShield(dmg);
                            }
                        }, t * 150);
                    }
                    break;
                }
                case 'defend': {
                    this.enemy.shield += intent.shield;
                    window.soundSystem.playShield();
                    break;
                }
                case 'buff': {
                    this.enemy.buffStrength = (this.enemy.buffStrength || 0) + (intent.strength || 2);
                    window.soundSystem.playTaiko(true);
                    break;
                }
                case 'curse': {
                    if (intent.damage) {
                        this.damagePlayerWithShield(intent.damage);
                    }
                    if (intent.curseId) {
                        this.discardPile.push(intent.curseId);
                        window.soundSystem.playWarning();
                    }
                    break;
                }
            }

            // 使用済みカードを敵捨て札へ
            if (playedCard) {
                this.enemyDiscardPile.push(playedCard);
            }

            // 敵手札に1枚補充
            this.drawEnemyCards(1);

            // 脱力ターン減衰
            if (this.enemyStatus.weak > 0) {
                this.enemyStatus.weak--;
            }

            // 敵の次のIntentを決定
            this.pickEnemyIntent();

            // UI更新
            if (this.app.ui && this.app.ui.updateBattleUI) {
                this.app.ui.updateBattleUI();
            }

            // 敵ターン完了・プレイヤーへ
            setTimeout(() => {
                this.finishEnemyTurn();
            }, 600);
        };

        // UIアニメーションの実行（カードフリップ＆公開演出）
        if (this.app.ui && this.app.ui.playEnemyCardAnimation) {
            this.app.ui.playEnemyCardAnimation(intent, () => {
                applyCardEffects();
            });
        } else {
            // UIがない環境等のフォールバック
            applyCardEffects();
        }
    }

    finishEnemyTurn() {
        if (this.isBattleOver || this.playerHp <= 0) return;
        this.startPlayerTurn();
    }

    handleEnemyDefeated() {
        this.isBattleOver = true;
        this.isPlayerTurn = false;

        // 戦闘終了時に BGM を停止
        if (window.soundSystem && window.soundSystem.stopBgm) {
            window.soundSystem.stopBgm();
        }
        window.soundSystem.playVictory();

        // 残存シールドによるサステイン還元（ノーダメージ立ち回りへのボーナス）
        if (this.playerShield > 0) {
            const healAmount = Math.min(5, Math.floor(this.playerShield * 0.2));
            if (healAmount > 0) {
                this.healPlayer(healAmount);
                if (window.particleSystem && window.particleSystem.createFloatingText) {
                    setTimeout(() => {
                        window.particleSystem.createFloatingText(`防陣温存: HP+${healAmount}`, window.innerWidth / 2, window.innerHeight * 0.5, "#48bb78");
                    }, 400);
                }
            }
        }

        // レリックの戦闘勝利効果
        this.app.relics.forEach(relicId => {
            const r = GAME_DATA.relics[relicId];
            if (r && r.onBattleWin) {
                r.onBattleWin(this.app);
            }
        });

        // 最終ボス撃破チェック
        if (this.enemy.isFinalBoss) {
            setTimeout(() => {
                this.app.handleGameClear();
            }, 800);
            return;
        }

        // 報酬計算（両 ＋ カード提示）
        let goldEarned = this.enemy.isElite ? (35 + Math.floor(Math.random() * 20)) :
                         this.enemy.isBoss ? (60 + Math.floor(Math.random() * 30)) :
                         (15 + Math.floor(Math.random() * 12));

        if (this.app.hasRelic("dutch_lexicon")) {
            goldEarned += 15;
        }

        // 世論（天下の大勢）優勢による民衆・豪商からの軍資金支援、および劣勢ペナルティ
        const victorySituation = this.app.getFactionSituation ? this.app.getFactionSituation() : 'neutral';
        if (victorySituation === 'super_advantage') {
            goldEarned += 25; // 絶大優勢ボーナス
        } else if (victorySituation === 'advantage') {
            goldEarned += 10; // やや優勢ボーナス
        } else if (victorySituation === 'disadvantage') {
            goldEarned = Math.max(1, Math.round(goldEarned * 0.50)); // 50%没収（倍増ペナルティ）
        } else if (victorySituation === 'super_disadvantage') {
            goldEarned = Math.max(1, Math.round(goldEarned * 0.25)); // 75%激減（孤立無援・補給深刻途絶）
        } else if (victorySituation === 'extreme_disadvantage') {
            goldEarned = 0; // 0両（完全朝敵・世論敵対100%による完全没収！）
        }

        this.app.gold += goldEarned;

        // カード報酬抽選（通常3枚、松下村塾の硯筆所持で4枚）
        const cardRewards = this.generateCardRewards();

        // エリートまたはボスならレリックも追加
        let relicReward = null;
        if (this.enemy.isElite || this.enemy.isBoss) {
            relicReward = this.app.getAvailableRandomRelic();
        }

        setTimeout(() => {
            this.app.ui.showBattleRewardModal({
                gold: goldEarned,
                cards: cardRewards,
                relic: relicReward
            });
        }, 600);
    }

    generateCardRewards() {
        // 自陣営 + 西洋兵器から選定
        const availablePool = Object.keys(GAME_DATA.cards).filter(id => {
            const c = GAME_DATA.cards[id];
            if (c.rarity === 'starter' || c.type === 'curse') return false;
            if (GAME_DATA.canFactionAcquireCard && !GAME_DATA.canFactionAcquireCard(id, this.app.faction)) return false;
            return c.faction === this.app.faction || c.faction === 'neutral';
        });

        // 幕およびエリート判定に応じたレアリティ出現ウェイト
        const currentAct = (this.app.map && this.app.map.currentAct) ? this.app.map.currentAct : 1;
        const isElite = this.enemy && (this.enemy.isElite || this.enemy.isBoss);

        let weights;
        if (currentAct === 1) {
            weights = isElite
                ? { common: 40, uncommon: 40, rare: 18, legendary: 2 }
                : { common: 65, uncommon: 28, rare: 7, legendary: 0 };
        } else if (currentAct === 2) {
            weights = isElite
                ? { common: 20, uncommon: 40, rare: 32, legendary: 8 }
                : { common: 40, uncommon: 38, rare: 18, legendary: 4 };
        } else { // Act 3 (終幕)
            weights = isElite
                ? { common: 10, uncommon: 30, rare: 45, legendary: 15 }
                : { common: 20, uncommon: 40, rare: 30, legendary: 10 };
        }

        const pickRarity = () => {
            const total = weights.common + weights.uncommon + weights.rare + weights.legendary;
            const roll = Math.random() * total;
            if (roll < weights.common) return 'common';
            if (roll < weights.common + weights.uncommon) return 'uncommon';
            if (roll < weights.common + weights.uncommon + weights.rare) return 'rare';
            return 'legendary';
        };

        const rewardSituation = this.app.getFactionSituation ? this.app.getFactionSituation() : 'neutral';
        if (rewardSituation === 'extreme_disadvantage') {
            return []; // ☠️ 極限劣勢（完全朝敵・世論敵対100%）: 誰も味方せずカード提示0枚！
        }

        let baseRewardCount = 3;
        if (rewardSituation === 'super_disadvantage') {
            baseRewardCount = 1; // 孤立無援: 1枚のみ提示
        } else if (rewardSituation === 'disadvantage') {
            baseRewardCount = 2; // やや劣勢: 2枚提示
        }
        if (this.app.hasRelic("yoshida_shoin_brush")) {
            baseRewardCount += 1;
        }
        const rewardCount = baseRewardCount;
        const chosenCards = [];
        const poolCopy = [...availablePool];

        for (let i = 0; i < rewardCount; i++) {
            if (poolCopy.length === 0) break;
            const targetRarity = pickRarity();
            // 対象レアリティのカード群をフィルタ
            let matching = poolCopy.filter(id => GAME_DATA.cards[id].rarity === targetRarity);
            // なければ全体のプールからフォールバック
            if (matching.length === 0) {
                matching = poolCopy;
            }
            const pickedId = matching[Math.floor(Math.random() * matching.length)];
            chosenCards.push(pickedId);
            // 重複除外
            const idx = poolCopy.indexOf(pickedId);
            if (idx !== -1) poolCopy.splice(idx, 1);
        }

        return chosenCards;
    }

    handlePlayerDefeated(reason) {
        this.isBattleOver = true;
        this.isPlayerTurn = false;

        // 戦闘終了時に BGM を停止
        if (window.soundSystem && window.soundSystem.stopBgm) {
            window.soundSystem.stopBgm();
        }
        window.soundSystem.playWarning();
        this.app.handleGameOver(reason);
    }

    shuffleArray(arr) {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }
}
