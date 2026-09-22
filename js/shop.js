/**
 * 維新の嵐：双極の蒼穹 - Rogue Deck-Build -
 * ショップ（国内調達・列強密貿易）＆休息システム
 */

class ShopSystem {
    constructor(app) {
        this.app = app;
        this.shopCards = [];
        this.shopRelics = [];
        this.smuggleItem = null;
        this.cardRemovalPrice = 75;
    }

    openShop() {
        this.generateShopInventory();
        this.app.switchScreen('screen-shop');
        this.app.ui.renderShop();
        window.soundSystem.playCoin();
    }

    generateShopInventory() {
        this.shopCards = [];
        this.shopRelics = [];

        // 1. 通常カード販売（3〜4枚）
        const candidateCardIds = Object.keys(GAME_DATA.cards).filter(id => {
            const c = GAME_DATA.cards[id];
            return (c.faction === this.app.faction || c.faction === 'neutral') &&
                   c.rarity !== 'starter' && c.type !== 'curse';
        });

        const shuffledCards = [...candidateCardIds].sort(() => 0.5 - Math.random());
        const selectedCards = shuffledCards.slice(0, 4);

        // レリック「和同開珎」があれば25%割引
        const discount = this.app.hasRelic("wado_kaichin") ? 0.75 : 1.0;

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
        // 費用は0両！だが、列強介入度+20% ＆ 不平等条約呪いカードがデッキに混入
        const smuggleWeapons = ["weapon_armstrong", "weapon_gatling", "warship_ironclad"];
        const chosenWeapon = smuggleWeapons[Math.floor(Math.random() * smuggleWeapons.length)];
        this.smuggleItem = {
            cardId: chosenWeapon,
            imperialCost: 20,
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
    }

    removeCardInShop() {
        const discount = this.app.hasRelic("wado_kaichin") ? 0.75 : 1.0;
        const actualPrice = Math.round(this.cardRemovalPrice * discount);

        if (this.app.gold < actualPrice) {
            window.soundSystem.playWarning();
            alert("カード削除の資金が足りません！");
            return;
        }

        this.app.openCardRemovalModal(() => {
            this.app.gold -= actualPrice;
            this.cardRemovalPrice += 25; // 使うたびに値上がり
            this.app.ui.renderShop();
        });
    }

    // --- 🍵 休息画面 ---
    openRestSite() {
        this.app.switchScreen('screen-rest');
        this.app.ui.renderRestSite();
        window.soundSystem.playHyoshigi();
    }

    restHeal() {
        const healAmount = Math.floor(this.app.maxHp * 0.35);
        this.app.healPlayer(healAmount);
        window.soundSystem.playTaiko(false);
        this.leaveRestSite();
    }

    restNegotiate() {
        // 条約交渉・世論工作で列強介入メーターを下げる
        this.app.modifyImperialGauge(-15);
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

