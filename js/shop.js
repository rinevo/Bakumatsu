/**
 * 幕末風雲録：双極の蒼穹 - Rogue Deck-Build -
 * ショップ（国内調達・列強密貿易）＆休息システム
 */

class ShopSystem {
    constructor(app) {
        this.app = app;
        this.shopCards = [];
        this.shopRelics = [];
        this.smuggleItem = null;
        this.healBasePrice = 60;
        this.healedInShop = false;
    }

    openShop() {
        // 商人・政商志士による来店利息ボーナス
        if (this.app.hasShishi('iwazaki') || this.app.hasShishi('godai')) {
            const merchantName = this.app.hasShishi('iwazaki') ? '岩崎弥太郎' : '五代友厚';
            this.app.gold += 15;
            if (this.app.ui && this.app.ui.showToast) {
                this.app.ui.showToast(`💰【${merchantName}の政商手腕】軍資金の利息 +15両 を獲得！`, 'success');
            }
        }

        this.generateShopInventory();
        this.app.switchScreen('screen-shop');
        this.app.ui.renderShop();
        window.soundSystem.playCoin();
    }

    generateShopInventory() {
        this.shopCards = [];
        this.shopRelics = [];
        this.healedInShop = false;

        // 1. 通常カード販売（3〜4枚）
        const candidateCardIds = Object.keys(GAME_DATA.cards).filter(id => {
            const c = GAME_DATA.cards[id];
            if (GAME_DATA.canFactionAcquireCard && !GAME_DATA.canFactionAcquireCard(id, this.app.faction)) return false;
            return (c.faction === this.app.faction || c.faction === 'neutral') &&
                   c.rarity !== 'starter' && c.type !== 'curse';
        });

        const shuffledCards = [...candidateCardIds].sort(() => 0.5 - Math.random());
        const selectedCards = shuffledCards.slice(0, 4);

        // レリック「和同開珎（25%引）」および「蘭和辞書（20%引）」の効果適用
        let discount = 1.0;
        if (this.app.hasRelic("wado_kaichin")) discount *= 0.75;
        if (this.app.hasRelic("dutch_lexicon")) discount *= 0.80;

        // 志士特権: 『岩崎弥太郎』または『五代友厚』所持で全品20%割引！
        if (this.app.hasShishi && (this.app.hasShishi('iwazaki') || this.app.hasShishi('godai'))) {
            discount *= 0.80;
        }

        // 世論（天下の大勢）による価格補正
        discount *= this.getOpinionPriceMultiplier();

        this.shopCards = selectedCards.map(cardId => {
            const c = GAME_DATA.cards[cardId];
            let basePrice = 50;
            if (c.rarity === 'uncommon') basePrice = 85;
            if (c.rarity === 'rare') basePrice = 135;
            if (c.rarity === 'legendary') basePrice = 200;

            return {
                cardId,
                price: Math.round(basePrice * discount),
                purchased: false
            };
        });

        // 2. レリック販売（1〜2個）
        const availableRelics = Object.keys(GAME_DATA.relics).filter(id => !this.app.relics.includes(id));
        const shuffledRelics = [...availableRelics].sort(() => 0.5 - Math.random());
        this.shopRelics = shuffledRelics.slice(0, 2).map(rId => {
            const r = GAME_DATA.relics[rId];
            return {
                relicId: rId,
                price: Math.round(r.price * discount),
                purchased: false
            };
        });

        // 3. 列強密貿易（ハイリスク・借款武器）
        // 志士特権: 『勝海舟』または『小栗忠順』所持で列強介入ペナルティが半減（20%→10%）！
        let imperialCost = 20;
        if (this.app.hasShishi && (this.app.hasShishi('katsu') || this.app.hasShishi('oguri'))) {
            imperialCost = 10;
        }

        const smuggleWeapons = ["weapon_armstrong", "weapon_gatling", "warship_ironclad"];
        const chosenWeapon = smuggleWeapons[Math.floor(Math.random() * smuggleWeapons.length)];
        this.smuggleItem = {
            cardId: chosenWeapon,
            imperialCost,
            curseId: "curse_extraterritoriality",
            claimed: false
        };
    }

    buyCard(index) {
        const item = this.shopCards[index];
        if (!item || item.purchased) return;

        if (this.app.gold < item.price) {
            window.soundSystem.playWarning();
            alert("資金（両）が足りません！");
            return;
        }

        this.app.gold -= item.price;
        item.purchased = true;
        this.app.addCardToDeck(item.cardId);

        window.soundSystem.playCoin();
        this.app.ui.renderShop();
        if (this.app.saveRun) this.app.saveRun('shop');
    }

    buyRelic(index) {
        const item = this.shopRelics[index];
        if (!item || item.purchased) return;

        if (this.app.gold < item.price) {
            window.soundSystem.playWarning();
            alert("資金（両）が足りません！");
            return;
        }

        this.app.gold -= item.price;
        item.purchased = true;
        this.app.obtainRelic(item.relicId);

        window.soundSystem.playCoin();
        this.app.ui.renderShop();
        if (this.app.saveRun) this.app.saveRun('shop');
    }

    claimSmuggle() {
        if (!this.smuggleItem || this.smuggleItem.claimed) return;

        const confirmSmuggle = confirm(
            "【警告：列強密貿易の実行】\n" +
            "新式洋式兵器を無償で受領しますが、列強介入メーターが +20% 上昇し、不平等条約カード『治外法権の受容』がデッキに混入します。\n" +
            "本当に密約を交わしますか？"
        );

        if (!confirmSmuggle) return;

        this.smuggleItem.claimed = true;
        this.app.addCardToDeck(this.smuggleItem.cardId);
        this.app.addCardToDeck(this.smuggleItem.curseId);
        this.app.modifyImperialGauge(this.smuggleItem.imperialCost);

        window.soundSystem.playWarning();
        window.soundSystem.playGunshot();

        // 100%植民地化ゲームオーバーチェック
        if (this.app.imperialGauge >= 100) {
            this.app.handleGameOver("列強密貿易により借款が膨らみ、日本は保護領化された…（列強植民地敗北）");
            return;
        }

        this.app.ui.renderShop();
        if (this.app.saveRun) this.app.saveRun('shop');
    }

    getOpinionPriceMultiplier() {
        if (!this.app || !this.app.getFactionSituation) return 1.0;
        const sit = this.app.getFactionSituation();
        if (sit === 'super_advantage') return 0.80; // 20%割引（民衆・豪商の全面支援）
        if (sit === 'advantage') return 0.90;       // 10%割引
        if (sit === 'disadvantage') return 1.40;    // 40%高騰（警戒・物価高、旧20%の倍）
        if (sit === 'super_disadvantage') return 2.00; // 100%超高騰（定価の2倍！物資遮断・買い占め）
        if (sit === 'extreme_disadvantage') return 2.50; // 150%超高騰（定価の2.5倍！完全経済封鎖）
        return 1.0;
    }

    getHealPrice() {
        let discount = 1.0;
        if (this.app.hasRelic("wado_kaichin")) discount *= 0.75;
        if (this.app.hasRelic("dutch_lexicon")) discount *= 0.80;
        if (this.app.hasShishi && (this.app.hasShishi('iwazaki') || this.app.hasShishi('godai'))) {
            discount *= 0.80;
        }
        discount *= this.getOpinionPriceMultiplier();
        return Math.max(10, Math.round(this.healBasePrice * discount));
    }

    buyHeal() {
        if (this.healedInShop) {
            window.soundSystem.playWarning();
            alert("この店での手当てはすでに受けています。");
            return;
        }

        if (this.app.hp >= this.app.maxHp) {
            window.soundSystem.playWarning();
            alert("体力はすでに満全です！");
            return;
        }

        const price = this.getHealPrice();
        if (this.app.gold < price) {
            window.soundSystem.playWarning();
            alert("手当てを受ける資金（両）が足りません！");
            return;
        }

        this.app.gold -= price;
        this.healedInShop = true;
        const healAmount = Math.max(1, Math.floor(this.app.maxHp * 0.30));
        this.app.healPlayer(healAmount);

        window.soundSystem.playCoin();
        if (window.soundSystem && window.soundSystem.playTaiko) {
            window.soundSystem.playTaiko(false);
        }
        if (this.app.ui && this.app.ui.showToast) {
            this.app.ui.showToast(`💉【蘭方医の手当て】体力 +${healAmount} 回復！（残金: ${this.app.gold}両）`, 'success');
        }

        this.app.ui.renderShop();
        if (this.app.saveRun) this.app.saveRun('shop');
    }

    // --- 🍵 休息画面 ---
    openRestSite() {
        this.app.switchScreen('screen-rest');
        this.app.ui.renderRestSite();
        window.soundSystem.playHyoshigi();
    }

    restHeal() {
        const sit = this.app.getFactionSituation ? this.app.getFactionSituation() : 'neutral';
        let healRatio = 0.35;
        if (sit === 'extreme_disadvantage') {
            healRatio = 0.0; // 追手急襲・四面楚歌: 休息不能（回復0%）
        } else if (sit === 'super_disadvantage') {
            healRatio = 0.05; // 追手迫る極限状態: 5%のみ回復
        } else if (sit === 'disadvantage') {
            healRatio = 0.15; // 警戒態勢・野営困難: 15%に低下
        }
        if (this.app.hasRelic("samurai_pipe")) {
            healRatio += 0.15; // 志士の煙管所持で+15%
        }
        const healAmount = Math.floor(this.app.maxHp * healRatio);
        this.app.healPlayer(healAmount);
        if (healAmount === 0 && window.particleSystem && window.particleSystem.createFloatingText) {
            window.particleSystem.createFloatingText("追手急襲！休息できず回復0", window.innerWidth / 2, window.innerHeight * 0.45, "#e53e3e");
        }
        window.soundSystem.playTaiko(false);
        this.leaveRestSite();
    }

    restNegotiate() {
        // 条約交渉で列強介入メーターを鎮静化
        this.app.modifyImperialGauge(-15);

        // 世論工作で自軍有利に世論を変化（討幕なら+10%、佐幕なら-10%）
        const opinionDelta = this.app.faction === 'tobaku' ? 10 : -10;
        this.app.modifyPublicOpinion(opinionDelta);

        if (window.particleSystem && window.particleSystem.createFloatingText) {
            const factionLabel = this.app.faction === 'tobaku' ? '倒幕支持 +10%' : '佐幕支持 +10%';
            window.particleSystem.createFloatingText(`外交・世論工作！ 列強-15% / ${factionLabel}`, window.innerWidth / 2, window.innerHeight * 0.45, "#48bb78");
        }

        window.soundSystem.playHyoshigi();
        this.leaveRestSite();
    }

    restPurgeCard() {
        this.app.openCardRemovalModal(() => {
            this.leaveRestSite();
        });
    }

    leaveRestSite() {
        // マップへ戻る
        setTimeout(() => {
            this.app.returnToMap();
        }, 300);
    }
}

