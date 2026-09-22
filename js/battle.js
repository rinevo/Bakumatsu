/**
 * 維新の嵐：双極の蒼穹 - Rogue Deck-Build -
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

        // ターン内記録
        this.turnCount = 0;
        this.comboCount = 0;
        this.playedThisTurn = [];
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

        this.isPlayerTurn = false;
        this.isBattleOver = false;
    }

    startBattle(enemyData) {
        this.isBattleOver = false;
        this.turnCount = 0;
        this.comboCount = 0;
        this.playedThisTurn = [];

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

        // 敵データクローン
        this.enemy = {
            name: enemyData.name,
            maxHp: enemyData.maxHp,
            hp: enemyData.maxHp,
            shield: 0,
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

        // デッキ初期化（シャッフルして山札へ）
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

        // 最初の敵Intent決定
        this.pickEnemyIntent();

        // プレイヤー第1ターン開始
        this.startPlayerTurn();
    }

    pickEnemyIntent() {
        if (!this.enemy || !this.enemy.intents || this.enemy.intents.length === 0) return;
        const currentTemplate = this.enemy.intents[this.enemyIntentIndex % this.enemy.intents.length];
        this.enemyIntentIndex++;

        // 意図のクローン
        this.enemy.intent = { ...currentTemplate };

        // 敵の筋力バフがあれば加算
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

        // カードドロー (基本5枚 + ボーナス)
        const drawCount = 5 + this.handDrawBonus;
        this.drawCards(drawCount);

        window.soundSystem.playHyoshigi();
        this.app.ui.updateBattleUI();
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
        let cost = card.cost || 0;

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
        if (!currentCard.partnerId && !currentCard.character) return;

        // このターン既にプレイされたカードの中からパートナーを探す
        const partner = this.playedThisTurn.find(c =>
            c !== currentCard &&
            (c.id === currentCard.partnerId ||
             (currentCard.character === 'ryoma' && c.character === 'katsura') ||
             (currentCard.character === 'katsura' && c.character === 'ryoma') ||
             (currentCard.character === 'hijikata' && c.character === 'kondo') ||
             (currentCard.character === 'kondo' && c.character === 'hijikata') ||
             (currentCard.character === 'saigo' && c.character === 'okubo') ||
             (currentCard.character === 'okubo' && c.character === 'saigo') ||
             (currentCard.character === 'katsu' && c.character === 'ryoma') ||
             (currentCard.character === 'ryoma' && c.character === 'katsu'))
        );

        if (partner) {
            // コネクトリンク発動！
            window.soundSystem.playConnectLink();
            window.particleSystem.createSparks(window.innerWidth / 2, window.innerHeight * 0.45, 25, true);
            
            // パートナーに応じたボーナス
            if ((currentCard.character === 'ryoma' && partner.character === 'katsura') ||
                (currentCard.character === 'katsura' && partner.character === 'ryoma')) {
                this.gainPlayerEnergy(1);
                this.drawCards(1);
            } else if ((currentCard.character === 'hijikata' && partner.character === 'kondo') ||
                       (currentCard.character === 'kondo' && partner.character === 'hijikata')) {
                this.dealDamageToEnemy(6);
                this.gainPlayerShield(6);
            } else if ((currentCard.character === 'saigo' && partner.character === 'okubo') ||
                       (currentCard.character === 'okubo' && partner.character === 'saigo')) {
                this.dealDamageToEnemy(12);
            } else if ((currentCard.character === 'katsu' && partner.character === 'ryoma') ||
                       (currentCard.character === 'ryoma' && partner.character === 'katsu')) {
                this.modifyImperialGauge(-5);
                this.gainPlayerShield(10);
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
        }

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
        while (this.hand.length > 0) {
            const c = this.hand.pop();
            this.discardPile.push(c.id);
        }
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

        const intent = this.enemy.intent;
        if (intent) {
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
                            this.damagePlayerWithShield(dmg);
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
        }

        // 脱力ターン減衰
        if (this.enemyStatus.weak > 0) {
            this.enemyStatus.weak--;
        }

        // 敵の次のIntentを決定
        this.pickEnemyIntent();

        // 敵ターン完了・プレイヤーへ
        setTimeout(() => {
            this.finishEnemyTurn();
        }, 700);
    }

    finishEnemyTurn() {
        if (this.isBattleOver || this.playerHp <= 0) return;
        this.startPlayerTurn();
    }

    handleEnemyDefeated() {
        this.isBattleOver = true;
        this.isPlayerTurn = false;
        window.soundSystem.playVictory();

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

        // 報酬計算（両 ＋ カード3枚提示）
        const goldEarned = this.enemy.isElite ? (35 + Math.floor(Math.random() * 20)) :
                           this.enemy.isBoss ? (60 + Math.floor(Math.random() * 30)) :
                           (15 + Math.floor(Math.random() * 12));

        this.app.gold += goldEarned;

        // カード報酬3枚抽選
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
        // 自陣営 + 西洋兵器から3枚選定
        const availablePool = Object.keys(GAME_DATA.cards).filter(id => {
            const c = GAME_DATA.cards[id];
            if (c.rarity === 'starter' || c.type === 'curse') return false;
            return c.faction === this.app.faction || c.faction === 'neutral';
        });

        const shuffled = this.shuffleArray(availablePool);
        return shuffled.slice(0, 3);
    }

    handlePlayerDefeated(reason) {
        this.isBattleOver = true;
        this.isPlayerTurn = false;
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
