/**
 * 幕末風雲録：双極の蒼穹 - Rogue Deck-Build -
 * ゲームマスターデータ (Cards, Relics, Enemies, Events, PublicTrends)
 */

const GAME_DATA = {
    // ==========================================
    // 1. カード定義
    // type: 'shishi'(志士), 'tactic'(戦術), 'equip'(装備), 'curse'(呪い)
    // faction: 'tobaku'(討幕/薩長), 'sabaku'(佐幕/幕府), 'neutral'(中立/西洋), 'curse'(呪い)
    // ==========================================
    canFactionAcquireCard: function(cardId, faction) {
        const card = this.cards[cardId];
        if (!card) return true;
        // 史実死亡した志士は以降入手不可
        if (typeof window !== 'undefined' && window.bakumatsuApp && window.bakumatsuApp.deadShishi && window.bakumatsuApp.deadShishi.has(cardId)) {
            return false;
        }
        if (faction === 'tobaku' && card.killedByTobaku) return false;
        if (faction === 'sabaku' && card.killedBySabaku) return false;
        return true;
    },
    cards: {
        // --- 🔴 薩長同盟（討幕派）初期カード ---
        "tobaku_strike": {
            id: "tobaku_strike",
            name: "示現流の一閃",
            faction: "tobaku",
            type: "tactic",
            subType: "samurai",
            cost: 1,
            attack: 7,
            shield: 0,
            desc: "敵に 7 ダメージ。",
            rarity: "starter"
        },
        "tobaku_defend": {
            id: "tobaku_defend",
            name: "見切り",
            faction: "tobaku",
            type: "tactic",
            cost: 1,
            attack: 0,
            shield: 6,
            desc: "シールドを 6 獲得。",
            rarity: "starter"
        },
        "ryoma_kaiwentai": {
            id: "ryoma_kaiwentai",
            name: "坂本龍馬：海援隊の采配",
            faction: "tobaku",
            killedBySabaku: true, // 歴史上、佐幕派により殺害/討死/処刑（佐幕派プレイ時入手不可）
            character: "ryoma",
            type: "shishi",
            subType: "leader",
            cost: 2,
            attack: 8,
            shield: 4,
            desc: "敵に 8 ダメージ、防 4。手札を全て捨てて3枚ドロー。敵の攻撃意図を3減少。",
            rarity: "legendary",
            onPlay: (b, self) => {
                b.dealDamageToEnemy(8);
                b.gainPlayerShield(4);
                b.discardEntireHand();
                b.drawCards(3);
                if (b.enemy && b.enemy.intent && b.enemy.intent.damage) {
                    b.enemy.intent.damage = Math.max(0, b.enemy.intent.damage - 3);
                }
            }
        },
        "satcho_secret": {
            id: "satcho_secret",
            name: "薩長同盟の密約",
            faction: "tobaku",
            type: "tactic",
            cost: 1,
            attack: 0,
            shield: 0,
            desc: "手札の志士カード1枚を除外し、山札からカードを2枚引く。連鎖+1。",
            rarity: "uncommon",
            onPlay: (b, self) => {
                const shishiIdx = b.hand.findIndex(c => c.type === 'shishi');
                if (shishiIdx !== -1) {
                    const removed = b.hand.splice(shishiIdx, 1)[0];
                    b.exhaustPile.push(removed);
                }
                b.drawCards(2);
                b.comboCount += 1;
            }
        },

        // --- 🔴 薩長同盟（討幕派）アンロック/報酬カード ---
        "katsura_shindo": {
            id: "katsura_shindo",
            name: "桂小五郎：神道無念流",
            faction: "tobaku",
            character: "katsura",
            type: "shishi",
            cost: 1,
            attack: 8,
            shield: 4,
            desc: "敵に 8 ダメージ、防 4。【連携：坂本龍馬】場に龍馬がいればコスト0＆追加1ドロー。",
            rarity: "legendary",
            partnerId: "ryoma_kaiwentai",
            onPlay: (b, self) => {
                b.dealDamageToEnemy(8);
                b.gainPlayerShield(4);
                if (b.playedThisTurn.some(c => c.character === 'ryoma')) {
                    b.gainPlayerEnergy(1);
                    b.drawCards(1);
                    window.particleSystem.showComboText("【薩長盟友！】", b.comboCount);
                    window.soundSystem.playConnectLink();
                }
            }
        },
        "saigo_jigen": {
            id: "saigo_jigen",
            name: "西郷隆盛：薩摩の巨魁",
            faction: "tobaku",
            character: "saigo",
            type: "shishi",
            cost: 2,
            attack: 16,
            shield: 6,
            desc: "敵に 16 ダメージ。敵のシールドを半減させる。",
            rarity: "legendary",
            onPlay: (b, self) => {
                if (b.enemy) {
                    b.enemy.shield = Math.floor(b.enemy.shield / 2);
                }
                b.dealDamageToEnemy(16);
                b.gainPlayerShield(6);
            }
        },
        "takasugi_kiheitai": {
            id: "takasugi_kiheitai",
            name: "高杉晋作：奇兵隊の突進",
            faction: "tobaku",
            character: "takasugi",
            type: "shishi",
            cost: 2,
            attack: 10,
            shield: 0,
            desc: "敵に 10 ダメージ。このターン使ったカード1枚につき追加3ダメージ。",
            rarity: "legendary",
            onPlay: (b, self) => {
                const bonus = (b.playedThisTurn.length - 1) * 3;
                b.dealDamageToEnemy(10 + bonus);
            }
        },
        "okubo_strategy": {
            id: "okubo_strategy",
            name: "大久保利通：冷徹な謀略",
            faction: "tobaku",
            character: "okubo",
            type: "tactic",
            cost: 1,
            attack: 0,
            shield: 8,
            desc: "防 8。敵に「脱力 2」（与ダメージ25%減）を付与し、カードを1枚引く。",
            rarity: "legendary",
            onPlay: (b, self) => {
                b.gainPlayerShield(8);
                b.applyStatusToEnemy("weak", 2);
                b.drawCards(1);
            }
        },
        "sonno_joi": {
            id: "sonno_joi",
            name: "尊王攘夷の激昂",
            faction: "tobaku",
            type: "tactic",
            cost: 0,
            attack: 0,
            shield: 0,
            desc: "文を 1 獲得。HPを 3 消費する。このターンの攻撃力+4。",
            rarity: "uncommon",
            onPlay: (b, self) => {
                b.gainPlayerEnergy(1);
                b.damagePlayerDirect(3);
                b.applyPlayerBuff("strength", 4);
            }
        },
        "ito_diplomat": {
            id: "ito_diplomat",
            name: "伊藤博文：俊才の外交",
            faction: "tobaku",
            character: "ito",
            type: "shishi",
            cost: 1,
            attack: 5,
            shield: 5,
            desc: "敵に 5 ダメージ、防 5。列強介入メーターを 3% 下げる。",
            rarity: "rare",
            onPlay: (b) => {
                b.modifyImperialGauge(-3);
            }
        },
        "omura_reform": {
            id: "omura_reform",
            name: "大村益次郎：兵制改革",
            faction: "tobaku",
            character: "omura",
            type: "shishi",
            cost: 2,
            attack: 11,
            shield: 3,
            desc: "敵に 11 ダメージ、防 3。カードを1枚引く。",
            rarity: "rare",
            onPlay: (b) => {
                b.drawCards(1);
            }
        },
        "inoue_negotiation": {
            id: "inoue_negotiation",
            name: "井上馨：開国の交渉",
            faction: "tobaku",
            character: "inoue",
            type: "shishi",
            cost: 1,
            attack: 6,
            shield: 5,
            desc: "敵に 6 ダメージ、防 5。列強介入メーターを 2% 下げる。",
            rarity: "rare",
            onPlay: (b) => {
                b.modifyImperialGauge(-2);
            }
        },
        "maebara_charge": {
            id: "maebara_charge",
            name: "前原一誠：決死の進撃",
            faction: "tobaku",
            character: "maebara",
            type: "shishi",
            cost: 2,
            attack: 15,
            shield: 0,
            desc: "敵に 15 ダメージ。自分のHPを 3 消費する。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.damagePlayerDirect(3);
            }
        },
        "yamagata_march": {
            id: "yamagata_march",
            name: "山県有朋：進撃の号令",
            faction: "tobaku",
            character: "yamagata",
            type: "shishi",
            cost: 2,
            attack: 13,
            shield: 3,
            desc: "敵に 13 ダメージ、防 3。次のカードの攻撃力+3。",
            rarity: "rare",
            onPlay: (b) => {
                b.applyPlayerBuff("strength", 3);
            }
        },
        "hirosawa_alliance": {
            id: "hirosawa_alliance",
            name: "広沢真臣：盟約の調整",
            faction: "tobaku",
            character: "hirosawa",
            type: "shishi",
            cost: 1,
            attack: 4,
            shield: 8,
            desc: "敵に 4 ダメージ、防 8。列強介入メーターを 4% 下げる。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.modifyImperialGauge(-4);
            }
        },
        "goto_political_drive": {
            id: "goto_political_drive",
            name: "後藤象二郎：大政の建白",
            faction: "tobaku",
            character: "goto",
            type: "shishi",
            cost: 2,
            attack: 9,
            shield: 9,
            desc: "敵に 9 ダメージ、防 9。列強介入メーターを 5% 下げる。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.modifyImperialGauge(-5);
            }
        },
        "sufu_reform": {
            id: "sufu_reform",
            name: "周布政之助：長州の経綸",
            faction: "tobaku",
            character: "sufu",
            type: "shishi",
            cost: 2,
            attack: 8,
            shield: 10,
            desc: "敵に 8 ダメージ、防 10。カードを2枚引く。次のターンの文を +1 得る。",
            rarity: "rare",
            onPlay: (b) => {
                b.drawCards(2);
                b.gainPlayerEnergy(1);
            }
        },
        "nakaoka_mediator": {
            id: "nakaoka_mediator",
            name: "中岡慎太郎：盟友の奔走",
            faction: "tobaku",
            killedBySabaku: true, // 歴史上、佐幕派により殺害/討死/処刑（佐幕派プレイ時入手不可）
            character: "nakaoka",
            type: "shishi",
            cost: 1,
            attack: 7,
            shield: 6,
            desc: "敵に 7 ダメージ、防 6。手札を1枚引く。",
            rarity: "rare",
            onPlay: (b) => {
                b.drawCards(1);
            }
        },
        "iwakura_imperial": {
            id: "iwakura_imperial",
            name: "岩倉具視：朝廷工作",
            faction: "tobaku",
            character: "iwakura",
            type: "shishi",
            cost: 2,
            attack: 6,
            shield: 10,
            desc: "敵に 6 ダメージ、防 10。列強介入メーターを 6% 下げる。",
            rarity: "rare",
            onPlay: (b) => {
                b.modifyImperialGauge(-6);
            }
        },
        "fukuoka_drafting": {
            id: "fukuoka_drafting",
            name: "福岡孝弟：新政の起草",
            faction: "tobaku",
            character: "fukuoka",
            type: "shishi",
            cost: 1,
            attack: 5,
            shield: 9,
            desc: "敵に 5 ダメージ、防 9。次のターンの手札を1枚追加する。",
            rarity: "common",
            onPlay: (b) => {
                b.handDrawBonus += 1;
            }
        },
        "soejima_diplomacy": {
            id: "soejima_diplomacy",
            name: "副島種臣：外政の剛腕",
            faction: "tobaku",
            character: "soejima",
            type: "shishi",
            cost: 2,
            attack: 12,
            shield: 6,
            desc: "敵に 12 ダメージ、防 6。敵の攻撃意図を 4 減少させる。",
            rarity: "common",
            onPlay: (b) => {
                if (b.enemy && b.enemy.intent && b.enemy.intent.damage) {
                    b.enemy.intent.damage = Math.max(0, b.enemy.intent.damage - 4);
                }
            }
        },
        "yokoi_philosophy": {
            id: "yokoi_philosophy",
            name: "横井小楠：実学の構想",
            faction: "tobaku",
            character: "yokoi",
            type: "shishi",
            cost: 1,
            attack: 5,
            shield: 7,
            desc: "敵に 5 ダメージ、防 7。次に使う戦術カードを1枚引く。",
            rarity: "common",
            onPlay: (b) => {
                const tactic = b.drawPile.findIndex(cardId => GAME_DATA.cards[cardId] && GAME_DATA.cards[cardId].type === 'tactic');
                if (tactic !== -1) {
                    const [cardId] = b.drawPile.splice(tactic, 1);
                    b.hand.push(GAME_DATA.cards[cardId]);
                }
            }
        },
        "eto_reform": {
            id: "eto_reform",
            name: "江藤新平：司法の改革",
            faction: "tobaku",
            character: "eto",
            type: "shishi",
            cost: 2,
            attack: 10,
            shield: 10,
            desc: "敵に 10 ダメージ、防 10。自分のHPを 5 回復する。",
            rarity: "common",
            onPlay: (b) => {
                b.healPlayer(5);
            }
        },
        "kuroda_frontier": {
            id: "kuroda_frontier",
            name: "黒田了介：北辺の開拓",
            faction: "tobaku",
            character: "kuroda",
            type: "shishi",
            cost: 2,
            attack: 12,
            shield: 8,
            desc: "敵に 12 ダメージ、防 8。最大HPを 3 増やす。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.playerMaxHp += 3;
                b.app.maxHp += 3;
            }
        },
        "okuma_modernization": {
            id: "okuma_modernization",
            name: "大隈重信：近代化の志",
            faction: "tobaku",
            character: "okuma",
            type: "shishi",
            cost: 1,
            attack: 7,
            shield: 7,
            desc: "敵に 7 ダメージ、防 7。カードを1枚引き、15両を得る。",
            rarity: "common",
            onPlay: (b) => {
                b.drawCards(1);
                b.app.gold += 15;
            }
        },
        "yodo_political_balance": {
            id: "yodo_political_balance",
            name: "山内容堂：公議の裁定",
            faction: "tobaku",
            character: "yodo",
            type: "shishi",
            cost: 2,
            attack: 8,
            shield: 12,
            desc: "敵に 8 ダメージ、防 12。列強介入メーターを 5% 下げる。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.modifyImperialGauge(-5);
            }
        },
        "itagaki_charge": {
            id: "itagaki_charge",
            name: "板垣退助：自由の先駆",
            faction: "tobaku",
            character: "itagaki",
            type: "shishi",
            cost: 1,
            attack: 13,
            shield: 2,
            desc: "敵に 13 ダメージ、防 2。HPを 2 消費する。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.damagePlayerDirect(2);
            }
        },
        "shinagawa_signal": {
            id: "shinagawa_signal",
            name: "品川弥二郎：密使の伝令",
            faction: "tobaku",
            character: "shinagawa",
            type: "shishi",
            cost: 1,
            attack: 6,
            shield: 6,
            desc: "敵に 6 ダメージ、防 6。カードを1枚引く。",
            rarity: "common",
            onPlay: (b) => {
                b.drawCards(1);
            }
        },
        "sanjo_court": {
            id: "sanjo_court",
            name: "三条実美：朝廷の旗",
            faction: "tobaku",
            character: "sanjo",
            type: "shishi",
            cost: 2,
            attack: 8,
            shield: 11,
            desc: "敵に 8 ダメージ、防 11。列強介入メーターを 5% 下げる。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.modifyImperialGauge(-5);
            }
        },
        "arima_revolt": {
            id: "arima_revolt",
            name: "有馬新七：寺田屋の決起",
            faction: "tobaku",
            character: "arima",
            type: "shishi",
            cost: 1,
            attack: 15,
            shield: 0,
            desc: "敵に 15 ダメージ。自分のHPを 4 消費する。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.damagePlayerDirect(4);
            }
        },
        "yoshii_support": {
            id: "yoshii_support",
            name: "吉井友実：薩摩の連絡役",
            faction: "tobaku",
            character: "yoshii",
            type: "shishi",
            cost: 1,
            attack: 6,
            shield: 8,
            desc: "敵に 6 ダメージ、防 8。カードを1枚引く。",
            rarity: "common",
            onPlay: (b) => {
                b.drawCards(1);
            }
        },
        "maki_revolt": {
            id: "maki_revolt",
            name: "真木和泉：尊王の檄文",
            faction: "tobaku",
            killedBySabaku: true, // 歴史上、佐幕派により殺害/討死/処刑（佐幕派プレイ時入手不可）
            character: "maki",
            type: "shishi",
            cost: 1,
            attack: 11,
            shield: 4,
            desc: "敵に 11 ダメージ、防 4。次の戦闘の攻撃力+3。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.applyPlayerBuff("strength", 3);
            }
        },
        "sakuma_gunnery": {
            id: "sakuma_gunnery",
            name: "佐久間象山：海防の大砲",
            faction: "tobaku",
            character: "sakuma",
            type: "shishi",
            cost: 2,
            attack: 14,
            shield: 7,
            desc: "敵に 14 ダメージ、防 7。敵のシールドを 6 破壊する。",
            rarity: "rare",
            onPlay: (b) => {
                if (b.enemy) {
                    b.enemy.shield = Math.max(0, b.enemy.shield - 6);
                }
            }
        },
        "tanaka_intelligence": {
            id: "tanaka_intelligence",
            name: "田中光顕：密偵の網",
            faction: "tobaku",
            character: "tanaka",
            type: "shishi",
            cost: 1,
            attack: 6,
            shield: 6,
            desc: "敵に 6 ダメージ、防 6。敵の攻撃意図を 3 減少させる。",
            rarity: "common",
            onPlay: (b) => {
                if (b.enemy && b.enemy.intent && b.enemy.intent.damage) {
                    b.enemy.intent.damage = Math.max(0, b.enemy.intent.damage - 3);
                }
            }
        },
        "iwazaki_finance": {
            id: "iwazaki_finance",
            name: "岩崎弥太郎：海運の才",
            faction: "tobaku",
            character: "iwazaki",
            type: "shishi",
            cost: 2,
            attack: 8,
            shield: 8,
            desc: "敵に 8 ダメージ、防 8。25両を得る。",
            rarity: "rare",
            onPlay: (b) => {
                b.app.gold += 25;
            }
        },
        "takechi_ideology": {
            id: "takechi_ideology",
            name: "武市半平太：勤王の刃",
            faction: "tobaku",
            character: "takechi",
            type: "shishi",
            cost: 1,
            attack: 12,
            shield: 3,
            desc: "敵に 12 ダメージ、防 3。列強介入メーターを 3%下げる。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.modifyImperialGauge(-3);
            }
        },
        "mochizuki_sacrifice": {
            id: "mochizuki_sacrifice",
            name: "望月亀弥太：池田屋の奮戦",
            faction: "tobaku",
            killedBySabaku: true, // 歴史上、佐幕派により殺害/討死/処刑（佐幕派プレイ時入手不可）
            character: "mochizuki",
            type: "shishi",
            cost: 2,
            attack: 18,
            shield: 0,
            desc: "敵に 18 ダメージ。自分のHPを 5 消費する。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.damagePlayerDirect(5);
            }
        },
        "yamada_modern_army": {
            id: "yamada_modern_army",
            name: "山田顕義：近代軍の礎",
            faction: "tobaku",
            character: "yamada",
            type: "shishi",
            cost: 2,
            attack: 12,
            shield: 9,
            desc: "敵に 12 ダメージ、防 9。次のターンの手札を1枚追加する。",
            rarity: "rare",
            onPlay: (b) => {
                b.handDrawBonus += 1;
            }
        },
        "sasaki_governance": {
            id: "sasaki_governance",
            name: "佐々木高行：藩政の改革",
            faction: "tobaku",
            character: "sasaki_takayuki",
            type: "shishi",
            cost: 1,
            attack: 5,
            shield: 10,
            desc: "敵に 5 ダメージ、防 10。列強介入メーターを 4%下げる。",
            rarity: "common",
            onPlay: (b) => {
                b.modifyImperialGauge(-4);
            }
        },
        "yoshida_teaching": {
            id: "yoshida_teaching",
            name: "吉田松陰：松下村塾の志",
            faction: "tobaku",
            killedBySabaku: true, // 歴史上、佐幕派により殺害/討死/処刑（佐幕派プレイ時入手不可）
            character: "yoshida",
            type: "shishi",
            cost: 1,
            attack: 7,
            shield: 7,
            desc: "敵に 7 ダメージ、防 7。カードを1枚引く。",
            rarity: "rare",
            onPlay: (b) => {
                b.drawCards(1);
            }
        },
        "tanaka_assassin": {
            id: "tanaka_assassin",
            name: "田中新兵衛：薩摩の刺客",
            faction: "tobaku",
            character: "tanaka_shinbei",
            type: "shishi",
            cost: 1,
            attack: 16,
            shield: 0,
            desc: "敵に 16 ダメージ。自分のHPを 3 消費する。",
            rarity: "rare",
            onPlay: (b) => {
                b.damagePlayerDirect(3);
            }
        },
        "kusaka_revolt": {
            id: "kusaka_revolt",
            name: "久坂玄瑞：禁門の進撃",
            faction: "tobaku",
            killedBySabaku: true, // 歴史上、佐幕派により殺害/討死/処刑（佐幕派プレイ時入手不可）
            character: "kusaka",
            type: "shishi",
            cost: 2,
            attack: 15,
            shield: 4,
            desc: "敵に 15 ダメージ、防 4。次の戦闘の攻撃力+4。",
            rarity: "rare",
            onPlay: (b) => {
                b.applyPlayerBuff("strength", 4);
            }
        },
        "irie_secret": {
            id: "irie_secret",
            name: "入江九一：密議の護衛",
            faction: "tobaku",
            killedBySabaku: true, // 歴史上、佐幕派により殺害/討死/処刑（佐幕派プレイ時入手不可）
            character: "irie",
            type: "shishi",
            cost: 1,
            attack: 6,
            shield: 10,
            desc: "敵に 6 ダメージ、防 10。敵に脱力 1を付与する。",
            rarity: "common",
            onPlay: (b) => {
                b.applyStatusToEnemy("weak", 1);
            }
        },
        "yoshida_minomaru": {
            id: "yoshida_minomaru",
            name: "吉田稔麿：松下村塾の剣",
            faction: "tobaku",
            killedBySabaku: true, // 歴史上、佐幕派により殺害/討死/処刑（佐幕派プレイ時入手不可）
            character: "yoshida_minomaru",
            type: "shishi",
            cost: 1,
            attack: 13,
            shield: 3,
            desc: "敵に 13 ダメージ、防 3。敵が攻撃意図なら追加3ダメージ。",
            rarity: "uncommon",
            onPlay: (b) => {
                if (b.enemy && b.enemy.intent && b.enemy.intent.type === 'attack') {
                    b.dealDamageToEnemy(3);
                }
            }
        },
        "ijichi_command": {
            id: "ijichi_command",
            name: "伊地知正治：薩摩の軍議",
            faction: "tobaku",
            character: "ijichi",
            type: "shishi",
            cost: 2,
            attack: 9,
            shield: 10,
            desc: "敵に 9 ダメージ、防 10。次の戦闘の攻撃力+5。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.applyPlayerBuff("strength", 5);
            }
        },
        "kirishima_charge": {
            id: "kirishima_charge",
            name: "来島又兵衛：禁門の猛進",
            faction: "tobaku",
            killedBySabaku: true, // 歴史上、佐幕派により殺害/討死/処刑（佐幕派プレイ時入手不可）
            character: "kirishima",
            type: "shishi",
            cost: 2,
            attack: 17,
            shield: 2,
            desc: "敵に 17 ダメージ、防 2。自分のHPを 4 消費する。",
            rarity: "rare",
            onPlay: (b) => {
                b.damagePlayerDirect(4);
            }
        },
        "akane_negotiation": {
            id: "akane_negotiation",
            name: "赤禰武人：和平の奔走",
            faction: "tobaku",
            character: "akane",
            type: "shishi",
            cost: 1,
            attack: 5,
            shield: 9,
            desc: "敵に 5 ダメージ、防 9。列強介入メーターを 5%下げる。",
            rarity: "common",
            onPlay: (b) => {
                b.modifyImperialGauge(-5);
            }
        },
        "okada_izo": {
            id: "okada_izo",
            name: "岡田以蔵：人斬りの太刀",
            faction: "tobaku",
            character: "izo",
            type: "shishi",
            cost: 1,
            attack: 14,
            shield: 0,
            desc: "敵に 14 ダメージ。敵に流血 2を付与する。",
            rarity: "rare",
            onPlay: (b) => {
                b.applyStatusToEnemy("bleed", 2);
            }
        },
        "komatsu_coordination": {
            id: "komatsu_coordination",
            name: "小松帯刀：薩摩の調整役",
            faction: "tobaku",
            character: "komatsu",
            type: "shishi",
            cost: 1,
            attack: 6,
            shield: 9,
            desc: "敵に 6 ダメージ、防 9。列強介入メーターを 3% 下げる。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.modifyImperialGauge(-3);
            }
        },
        "nakamura_charge": {
            id: "nakamura_charge",
            name: "中村半次郎：示現の猛撃",
            faction: "tobaku",
            character: "nakamura",
            type: "shishi",
            cost: 2,
            attack: 17,
            shield: 1,
            desc: "敵に 17 ダメージ、防 1。",
            rarity: "rare"
        },
        "godai_commerce": {
            id: "godai_commerce",
            name: "五代友厚：通商の気概",
            faction: "tobaku",
            character: "godai",
            type: "shishi",
            cost: 1,
            attack: 6,
            shield: 8,
            desc: "敵に 6 ダメージ、防 8。25両を獲得し、列強介入メーターを 3% 下げる。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.dealDamageToEnemy(6);
                b.gainPlayerShield(8);
                if (window.app) {
                    window.app.gold += 25;
                }
                b.modifyImperialGauge(-3);
            }
        },
        "yoshimura_revolt": {
            id: "yoshimura_revolt",
            name: "吉村寅太郎：天誅の魁",
            faction: "tobaku",
            character: "yoshimura",
            type: "shishi",
            cost: 2,
            attack: 18,
            shield: 0,
            desc: "敵に 18 ダメージ。自分のHPを 4 消費する。次のカードの攻撃力+4。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.dealDamageToEnemy(18);
                b.damagePlayerDirect(4);
                b.playerStrengthBuff = (b.playerStrengthBuff || 0) + 4;
            }
        },

        // --- 🔵 幕府・会津藩（佐幕派）初期カード ---
        "sabaku_strike": {
            id: "sabaku_strike",
            name: "天然理心流の太刀",
            faction: "sabaku",
            type: "tactic",
            subType: "samurai",
            cost: 1,
            attack: 6,
            shield: 2,
            desc: "敵に 6 ダメージ、防 2。",
            rarity: "starter"
        },
        "sabaku_defend": {
            id: "sabaku_defend",
            name: "鉄壁の陣構え",
            faction: "sabaku",
            type: "tactic",
            cost: 1,
            attack: 0,
            shield: 8,
            desc: "シールドを 8 獲得。",
            rarity: "starter"
        },
        "hijikata_fukucho": {
            id: "hijikata_fukucho",
            name: "土方歳三：鬼の副長",
            faction: "sabaku",
            killedByTobaku: true, // 歴史上、討幕派により殺害/戦死/処刑（討幕派プレイ時入手不可）
            character: "hijikata",
            type: "shishi",
            subType: "leader",
            cost: 2,
            attack: 13,
            shield: 7,
            desc: "敵のシールドを無視して 13 ダメージ、防 7。【代償】ターン終了時に手札を1枚破棄。",
            rarity: "legendary",
            onPlay: (b, self) => {
                b.dealPiercingDamageToEnemy(13);
                b.gainPlayerShield(7);
                b.turnEndDiscardCount = (b.turnEndDiscardCount || 0) + 1;
            }
        },
        "kyokuchu_hatto": {
            id: "kyokuchu_hatto",
            name: "新選組：局中法度",
            faction: "sabaku",
            type: "tactic",
            cost: 1,
            attack: 0,
            shield: 10,
            desc: "シールド 10 獲得。次ターンに受けるダメージを 4 軽減。",
            rarity: "common",
            onPlay: (b, self) => {
                b.gainPlayerShield(10);
                b.applyPlayerBuff("damage_reduction", 4);
            }
        },

        // --- 🔵 幕府・会津藩（佐幕派）アンロック/報酬カード ---
        "kondo_kotetsu": {
            id: "kondo_kotetsu",
            name: "近藤勇：虎徹の一撃",
            faction: "sabaku",
            killedByTobaku: true, // 歴史上、討幕派により殺害/戦死/処刑（討幕派プレイ時入手不可）
            character: "kondo",
            type: "shishi",
            cost: 2,
            attack: 12,
            shield: 8,
            desc: "敵に 12 ダメージ、防 8。【連携：土方歳三】場に土方がいれば反撃態勢（攻撃を受けた時10反射）。",
            rarity: "legendary",
            partnerId: "hijikata_fukucho",
            onPlay: (b, self) => {
                b.dealDamageToEnemy(12);
                b.gainPlayerShield(8);
                if (b.playedThisTurn.some(c => c.character === 'hijikata')) {
                    b.applyPlayerBuff("thorns", 10);
                }
            }
        },
        "okita_sandan": {
            id: "okita_sandan",
            name: "沖田総司：無双三段突き",
            faction: "sabaku",
            character: "okita",
            type: "shishi",
            cost: 2,
            attack: 6,
            shield: 0,
            desc: "敵に 6 ダメージ × 3回。敵に「流血 3」（ターン毎ダメージ）を付与。",
            rarity: "rare",
            onPlay: (b, self) => {
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        b.dealDamageToEnemy(6);
                    }, i * 90);
                }
                b.applyStatusToEnemy("bleed", 3);
            }
        },
        "katsu_kaishu": {
            id: "katsu_kaishu",
            name: "勝海舟：無血の大局観",
            faction: "sabaku",
            character: "katsu",
            type: "tactic",
            cost: 2,
            attack: 0,
            shield: 16,
            desc: "防 16。列強介入メーターを 5% 下げる。敵の次の攻撃力を半減。",
            rarity: "legendary",
            onPlay: (b, self) => {
                b.gainPlayerShield(16);
                b.modifyImperialGauge(-5);
                if (b.enemy && b.enemy.intent && b.enemy.intent.damage) {
                    b.enemy.intent.damage = Math.floor(b.enemy.intent.damage / 2);
                }
            }
        },
        "aizu_shield": {
            id: "aizu_shield",
            name: "松平容保：会津の義気",
            faction: "sabaku",
            character: "katamori",
            type: "shishi",
            cost: 2,
            attack: 0,
            shield: 16,
            desc: "防 16。現在のシールド値を 1.4 倍にし、次のターンの被ダメージを 4 軽減する。",
            rarity: "legendary",
            onPlay: (b, self) => {
                b.gainPlayerShield(16);
                b.playerShield = Math.floor(b.playerShield * 1.4);
                b.applyPlayerBuff("damage_reduction", 4);
            }
        },
        "saito_gato": {
            id: "saito_gato",
            name: "斎藤一：無外流の牙突",
            faction: "sabaku",
            character: "saito",
            type: "shishi",
            cost: 1,
            attack: 9,
            shield: 3,
            desc: "敵に 9 ダメージ。敵が攻撃準備中なら威力 1.5倍（13）。",
            rarity: "uncommon",
            onPlay: (b, self) => {
                const isAttacking = b.enemy && b.enemy.intent && b.enemy.intent.type === 'attack';
                const dmg = isAttacking ? 13 : 9;
                b.dealDamageToEnemy(dmg);
                b.gainPlayerShield(3);
            }
        },
        "nagakura_bushin": {
            id: "nagakura_bushin",
            name: "永倉新八：二番隊の剛剣",
            faction: "sabaku",
            character: "nagakura",
            type: "shishi",
            cost: 1,
            attack: 10,
            shield: 4,
            desc: "敵に 10 ダメージ、防 4。",
            rarity: "uncommon"
        },
        "sakai_genba_charge": {
            id: "sakai_genba_charge",
            name: "酒井玄蕃：鬼玄蕃の雷名",
            faction: "sabaku",
            character: "sakai_genba",
            type: "shishi",
            cost: 2,
            attack: 16,
            shield: 4,
            desc: "敵に 16 ダメージ、防 4。敵のシールドを 8 破壊し、次の戦闘の攻撃力 +4。",
            rarity: "rare",
            onPlay: (b) => {
                if (b.enemy) {
                    b.enemy.shield = Math.max(0, (b.enemy.shield || 0) - 8);
                }
                if (window.app) window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 4;
            }
        },
        "harada_spear": {
            id: "harada_spear",
            name: "原田左之助：槍術一閃",
            faction: "sabaku",
            killedByTobaku: true, // 歴史上、討幕派により殺害/戦死/処刑（討幕派プレイ時入手不可）
            character: "harada",
            type: "shishi",
            cost: 1,
            attack: 11,
            shield: 2,
            desc: "敵に 11 ダメージ、防 2。",
            rarity: "uncommon"
        },
        "sannan_tactics": {
            id: "sannan_tactics",
            name: "山南敬助：静謐の采配",
            faction: "sabaku",
            character: "sannan",
            type: "shishi",
            cost: 2,
            attack: 6,
            shield: 10,
            desc: "敵に 6 ダメージ、防 10。カードを1枚引く。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.drawCards(1);
            }
        },
        "ito_kasshitaro": {
            id: "ito_kasshitaro",
            name: "伊東甲子太郎：離隊の弁舌",
            faction: "sabaku",
            character: "ito_kasshitaro",
            type: "shishi",
            cost: 1,
            attack: 7,
            shield: 7,
            desc: "敵に 7 ダメージ、防 7。敵に脱力 1を付与する。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.applyStatusToEnemy("weak", 1);
            }
        },
        "sadaakira_guard": {
            id: "sadaakira_guard",
            name: "松平定敬：桑名の守備",
            faction: "sabaku",
            character: "sadaakira",
            type: "shishi",
            cost: 2,
            attack: 8,
            shield: 12,
            desc: "敵に 8 ダメージ、防 12。",
            rarity: "uncommon"
        },
        "enomoto_naval": {
            id: "enomoto_naval",
            name: "榎本武揚：海軍の采配",
            faction: "sabaku",
            character: "enomoto",
            type: "shishi",
            cost: 2,
            attack: 14,
            shield: 5,
            desc: "敵に 14 ダメージ、防 5。敵のシールドを 8 破壊する。",
            rarity: "rare",
            onPlay: (b) => {
                if (b.enemy) {
                    b.enemy.shield = Math.max(0, b.enemy.shield - 8);
                }
            }
        },
        "otori_strategy": {
            id: "otori_strategy",
            name: "大鳥圭介：北辺の戦略",
            faction: "sabaku",
            character: "otori",
            type: "shishi",
            cost: 1,
            attack: 7,
            shield: 9,
            desc: "敵に 7 ダメージ、防 9。次のターンの手札を1枚追加する。",
            rarity: "rare",
            onPlay: (b) => {
                b.handDrawBonus += 1;
            }
        },
        "kawai_artillery": {
            id: "kawai_artillery",
            name: "河井継之助：長岡の砲術",
            faction: "sabaku",
            killedByTobaku: true, // 歴史上、討幕派により殺害/戦死/処刑（討幕派プレイ時入手不可）
            character: "kawai",
            type: "shishi",
            cost: 2,
            attack: 16,
            shield: 2,
            desc: "敵に 16 ダメージ、防 2。敵のシールドを 5 破壊する。",
            rarity: "rare",
            onPlay: (b) => {
                if (b.enemy) {
                    b.enemy.shield = Math.max(0, b.enemy.shield - 5);
                }
            }
        },
        "sagawa_cavalry": {
            id: "sagawa_cavalry",
            name: "佐川官兵衛：鬼官兵衛の突撃",
            faction: "sabaku",
            character: "sagawa",
            type: "shishi",
            cost: 1,
            attack: 12,
            shield: 4,
            desc: "敵に 12 ダメージ、防 4。敵が攻撃意図なら追加4ダメージ。",
            rarity: "rare",
            onPlay: (b) => {
                if (b.enemy && b.enemy.intent && b.enemy.intent.type === 'attack') {
                    b.dealDamageToEnemy(4);
                }
            }
        },
        "akizuki_strategy": {
            id: "akizuki_strategy",
            name: "秋月悌次郎：退路の策",
            faction: "sabaku",
            character: "akizuki",
            type: "shishi",
            cost: 1,
            attack: 5,
            shield: 11,
            desc: "敵に 5 ダメージ、防 11。HPを 3 回復する。",
            rarity: "common",
            onPlay: (b) => {
                b.healPlayer(3);
            }
        },
        "yamamoto_research": {
            id: "yamamoto_research",
            name: "山本覚馬：洋学の眼",
            faction: "sabaku",
            character: "yamamoto",
            type: "shishi",
            cost: 2,
            attack: 10,
            shield: 8,
            desc: "敵に 10 ダメージ、防 8。カードを2枚引く。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.drawCards(2);
            }
        },
        "oguri_reform": {
            id: "oguri_reform",
            name: "小栗忠順：造船の先見",
            faction: "sabaku",
            killedByTobaku: true, // 歴史上、討幕派により殺害/戦死/処刑（討幕派プレイ時入手不可）
            character: "oguri",
            type: "shishi",
            cost: 2,
            attack: 9,
            shield: 11,
            desc: "敵に 9 ダメージ、防 11。列強介入メーターを 4% 下げる。",
            rarity: "rare",
            onPlay: (b) => {
                b.modifyImperialGauge(-4);
            }
        },
        "yamakawa_cavalry": {
            id: "yamakawa_cavalry",
            name: "山川大蔵：彼岸獅子の奮戦",
            faction: "sabaku",
            character: "yamakawa",
            type: "shishi",
            cost: 2,
            attack: 12,
            shield: 8,
            desc: "敵に 12 ダメージ、防 8。HPを 4 回復し、敵に脱力 1 を付与する。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.healPlayer(4);
                b.applyStatusToEnemy("weak", 1);
            }
        },
        "nagai_retreat": {
            id: "nagai_retreat",
            name: "永井尚志：恭順の進言",
            faction: "sabaku",
            character: "nagai",
            type: "shishi",
            cost: 1,
            attack: 4,
            shield: 13,
            desc: "敵に 4 ダメージ、防 13。列強介入メーターを 4% 下げる。",
            rarity: "common",
            onPlay: (b) => {
                b.modifyImperialGauge(-4);
            }
        },
        "kawamura_navy": {
            id: "kawamura_navy",
            name: "川村純義：海軍の守り",
            faction: "sabaku",
            character: "kawamura",
            type: "shishi",
            cost: 2,
            attack: 11,
            shield: 10,
            desc: "敵に 11 ダメージ、防 10。敵のシールドを 6 破壊する。",
            rarity: "common",
            onPlay: (b) => {
                if (b.enemy) {
                    b.enemy.shield = Math.max(0, b.enemy.shield - 6);
                }
            }
        },
        "sasaki_patrol": {
            id: "sasaki_patrol",
            name: "佐々木只三郎：見廻りの刃",
            faction: "sabaku",
            killedByTobaku: true, // 歴史上、討幕派により殺害/戦死/処刑（討幕派プレイ時入手不可）
            character: "sasaki",
            type: "shishi",
            cost: 1,
            attack: 14,
            shield: 1,
            desc: "敵に 14 ダメージ。敵が攻撃意図なら追加3ダメージ。",
            rarity: "rare",
            onPlay: (b) => {
                if (b.enemy && b.enemy.intent && b.enemy.intent.type === 'attack') {
                    b.dealDamageToEnemy(3);
                }
            }
        },
        "kayano_sacrifice": {
            id: "kayano_sacrifice",
            name: "萱野権兵衛：会津の殉難",
            faction: "sabaku",
            killedByTobaku: true, // 歴史上、新政府軍の裁定により主家殉難・自刃（討幕派プレイ時入手不可）
            character: "kayano",
            type: "shishi",
            cost: 1,
            attack: 6,
            shield: 12,
            desc: "敵に 6 ダメージ、防 12。味方のデバフを解除し、HPを 4 回復する。",
            rarity: "rare",
            onPlay: (b) => {
                b.healPlayer(4);
                if (b.playerDebuffs) {
                    b.playerDebuffs = {};
                }
            }
        },
        "koga_naval": {
            id: "koga_naval",
            name: "甲賀源吾：箱館の艦隊",
            faction: "sabaku",
            killedByTobaku: true, // 歴史上、討幕派により殺害/戦死/処刑（討幕派プレイ時入手不可）
            character: "koga",
            type: "shishi",
            cost: 2,
            attack: 15,
            shield: 7,
            desc: "敵に 15 ダメージ、防 7。敵のシールドを 7 破壊する。",
            rarity: "rare",
            onPlay: (b) => {
                if (b.enemy) {
                    b.enemy.shield = Math.max(0, b.enemy.shield - 7);
                }
            }
        },
        "saigo_tanomo_defense": {
            id: "saigo_tanomo_defense",
            name: "西郷頼母：会津の悲哀",
            faction: "sabaku",
            character: "saigo_tanomo",
            type: "shishi",
            cost: 1,
            attack: 5,
            shield: 14,
            desc: "敵に 5 ダメージ、防 14。HPを 3 回復する。",
            rarity: "common",
            onPlay: (b) => {
                b.healPlayer(3);
            }
        },
        "yamaoka_surrender": {
            id: "yamaoka_surrender",
            name: "山岡鉄舟：無刀の談判",
            faction: "sabaku",
            character: "yamaoka",
            type: "shishi",
            cost: 1,
            attack: 4,
            shield: 15,
            desc: "敵に 4 ダメージ、防 15。列強介入メーターを 5%下げる。",
            rarity: "rare",
            onPlay: (b) => {
                b.modifyImperialGauge(-5);
            }
        },
        "takahashi_guard": {
            id: "takahashi_guard",
            name: "高橋泥舟：槍の守り",
            faction: "sabaku",
            character: "takahashi",
            type: "shishi",
            cost: 2,
            attack: 10,
            shield: 13,
            desc: "敵に 10 ダメージ、防 13。次のターンの被ダメージを 3 軽減する。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.applyPlayerBuff("damage_reduction", 3);
            }
        },
        "hara_counsel": {
            id: "hara_counsel",
            name: "原市之進：幕府の進言",
            faction: "sabaku",
            killedByTobaku: true, // 歴史上、討幕派により殺害/戦死/処刑（討幕派プレイ時入手不可）
            character: "hara_ichinoshin",
            type: "shishi",
            cost: 1,
            attack: 5,
            shield: 12,
            desc: "敵に 5 ダメージ、防 12。列強介入メーターを 4% 下げる。",
            rarity: "common",
            onPlay: (b) => {
                b.modifyImperialGauge(-4);
            }
        },
        "hayashi_last_stand": {
            id: "hayashi_last_stand",
            name: "林忠崇：最後の藩主",
            faction: "sabaku",
            character: "hayashi",
            type: "shishi",
            cost: 2,
            attack: 16,
            shield: 4,
            desc: "敵に 16 ダメージ、防 4。HPを 4 消費する。",
            rarity: "rare",
            onPlay: (b) => {
                b.damagePlayerDirect(4);
            }
        },
        "takeda_strategy": {
            id: "takeda_strategy",
            name: "武田観柳斎：軍学の策",
            faction: "sabaku",
            character: "takeda",
            type: "shishi",
            cost: 1,
            attack: 6,
            shield: 9,
            desc: "敵に 6 ダメージ、防 9。敵に脱力 2を付与する。",
            rarity: "common",
            onPlay: (b) => {
                b.applyStatusToEnemy("weak", 2);
            }
        },
        "iba_duel": {
            id: "iba_duel",
            name: "伊庭八郎：片腕の剣客",
            faction: "sabaku",
            killedByTobaku: true, // 歴史上、討幕派により殺害/戦死/処刑（討幕派プレイ時入手不可）
            character: "iba",
            type: "shishi",
            cost: 2,
            attack: 15,
            shield: 6,
            desc: "敵に 15 ダメージ、防 6。敵が攻撃意図なら追加5ダメージ。",
            rarity: "rare",
            onPlay: (b) => {
                if (b.enemy && b.enemy.intent && b.enemy.intent.type === 'attack') {
                    b.dealDamageToEnemy(5);
                }
            }
        },
        "abe_defense": {
            id: "abe_defense",
            name: "阿部正弘：海防の調停",
            faction: "sabaku",
            character: "abe",
            type: "shishi",
            cost: 1,
            attack: 5,
            shield: 14,
            desc: "敵に 5 ダメージ、防 14。列強介入メーターを 5%下げる。",
            rarity: "common",
            onPlay: (b) => {
                b.modifyImperialGauge(-5);
            }
        },
        "shungaku_council": {
            id: "shungaku_council",
            name: "松平春嶽：公議の守り",
            faction: "sabaku",
            character: "shungaku",
            type: "shishi",
            cost: 2,
            attack: 8,
            shield: 12,
            desc: "敵に 8 ダメージ、防 12。カードを1枚引く。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.drawCards(1);
            }
        },
        "suzuki_patrol": {
            id: "suzuki_patrol",
            name: "鈴木三樹三郎：見廻りの連携",
            faction: "sabaku",
            character: "suzuki",
            type: "shishi",
            cost: 1,
            attack: 10,
            shield: 6,
            desc: "敵に 10 ダメージ、防 6。敵が攻撃意図なら追加4ダメージ。",
            rarity: "common",
            onPlay: (b) => {
                if (b.enemy && b.enemy.intent && b.enemy.intent.type === 'attack') {
                    b.dealDamageToEnemy(4);
                }
            }
        },
        "matsudaira_nobu_guard": {
            id: "matsudaira_nobu_guard",
            name: "松平信敬：藩屏の守り",
            faction: "sabaku",
            character: "matsudaira_nobu",
            type: "shishi",
            cost: 2,
            attack: 6,
            shield: 16,
            desc: "敵に 6 ダメージ、防 16。HPを 4 回復する。",
            rarity: "common",
            onPlay: (b) => {
                b.healPlayer(4);
            }
        },
        "sasaki_escort": {
            id: "sasaki_escort",
            name: "佐々木愛次郎：隊中の護衛",
            faction: "sabaku",
            character: "sasaki_aijiro",
            type: "shishi",
            cost: 1,
            attack: 9,
            shield: 8,
            desc: "敵に 9 ダメージ、防 8。敵が攻撃意図なら追加4ダメージ。",
            rarity: "common",
            onPlay: (b) => {
                if (b.enemy && b.enemy.intent && b.enemy.intent.type === 'attack') {
                    b.dealDamageToEnemy(4);
                }
            }
        },
        "nomura_defense": {
            id: "nomura_defense",
            name: "野村左兵衛：藩兵の守り",
            faction: "sabaku",
            killedByTobaku: true, // 歴史上、討幕派により殺害/戦死/処刑（討幕派プレイ時入手不可）
            character: "nomura",
            type: "shishi",
            cost: 2,
            attack: 7,
            shield: 15,
            desc: "敵に 7 ダメージ、防 15。列強介入メーターを 3%下げる。",
            rarity: "common",
            onPlay: (b) => {
                b.modifyImperialGauge(-3);
            }
        },
        "abe_masato_policy": {
            id: "abe_masato_policy",
            name: "阿部正外：幕政の調整",
            faction: "sabaku",
            character: "abe_masato",
            type: "shishi",
            cost: 1,
            attack: 5,
            shield: 13,
            desc: "敵に 5 ダメージ、防 13。カードを1枚引く。",
            rarity: "common",
            onPlay: (b) => {
                b.drawCards(1);
            }
        },
        "kimura_navy": {
            id: "kimura_navy",
            name: "木村芥舟：海防の舵取り",
            faction: "sabaku",
            character: "kimura",
            type: "shishi",
            cost: 2,
            attack: 10,
            shield: 11,
            desc: "敵に 10 ダメージ、防 11。列強介入メーターを 4%下げる。",
            rarity: "common",
            onPlay: (b) => {
                b.modifyImperialGauge(-4);
            }
        },
        "matsumoto_medicine": {
            id: "matsumoto_medicine",
            name: "松本良順：軍医の処置",
            faction: "sabaku",
            character: "matsumoto",
            type: "shishi",
            cost: 1,
            attack: 4,
            shield: 10,
            desc: "敵に 4 ダメージ、防 10。HPを 8 回復する。",
            rarity: "common",
            onPlay: (b) => {
                b.healPlayer(8);
            }
        },
        "abe_juro_tactics": {
            id: "abe_juro_tactics",
            name: "阿部十郎：遊撃の策",
            faction: "sabaku",
            character: "abe_juro",
            type: "shishi",
            cost: 2,
            attack: 12,
            shield: 6,
            desc: "敵に 12 ダメージ、防 6。敵に脱力 2を付与する。",
            rarity: "common",
            onPlay: (b) => {
                b.applyStatusToEnemy("weak", 2);
            }
        },
        "ii_naosuke": {
            id: "ii_naosuke",
            name: "井伊直弼：大老の断行",
            faction: "sabaku",
            killedByTobaku: true, // 歴史上、討幕派により殺害/戦死/処刑（討幕派プレイ時入手不可）
            character: "ii_naosuke",
            type: "shishi",
            cost: 2,
            attack: 0,
            shield: 18,
            desc: "防 18。列強介入メーターを 5% 下げる。敵の攻撃意図を 4 減少。",
            rarity: "legendary",
            onPlay: (b) => {
                b.modifyImperialGauge(-5);
                if (b.enemy && b.enemy.intent && b.enemy.intent.damage) {
                    b.enemy.intent.damage = Math.max(0, b.enemy.intent.damage - 4);
                }
            }
        },
        "todo_heisuke": {
            id: "todo_heisuke",
            name: "藤堂平助：魁先生の気迫",
            faction: "sabaku",
            character: "todo",
            type: "shishi",
            cost: 1,
            attack: 11,
            shield: 4,
            desc: "敵に 11 ダメージ、防 4。このターン最初の攻撃なら追加 4 ダメージ。",
            rarity: "uncommon",
            onPlay: (b) => {
                const attacks = b.playedThisTurn.filter(c => c.attack && c.attack > 0);
                if (attacks.length <= 1) {
                    b.dealDamageToEnemy(4);
                }
            }
        },
        "shimada_kai": {
            id: "shimada_kai",
            name: "島田魁：不抜の巨躯",
            faction: "sabaku",
            character: "shimada",
            type: "shishi",
            cost: 2,
            attack: 8,
            shield: 16,
            desc: "敵に 8 ダメージ、防 16。次のターンに受けるダメージを 3 軽減。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.applyPlayerBuff("damage_reduction", 3);
            }
        },
        "tatsumi_naobumi": {
            id: "tatsumi_naobumi",
            name: "立見尚文：雷神の指揮",
            faction: "sabaku",
            character: "tatsumi",
            type: "shishi",
            cost: 2,
            attack: 14,
            shield: 8,
            desc: "敵に 14 ダメージ、防 8。敵のシールドを 8 破壊する。",
            rarity: "rare",
            onPlay: (b) => {
                if (b.enemy) {
                    b.enemy.shield = Math.max(0, b.enemy.shield - 8);
                }
            }
        },
        "hitomi_katsutaro": {
            id: "hitomi_katsutaro",
            name: "人見勝太郎：遊撃の陣",
            faction: "sabaku",
            character: "hitomi",
            type: "shishi",
            cost: 1,
            attack: 10,
            shield: 6,
            desc: "敵に 10 ダメージ、防 6。カードを1枚引く。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.drawCards(1);
            }
        },
        "mizuno_magistrate": {
            id: "mizuno_magistrate",
            name: "水野忠徳：長崎奉行の経綸",
            faction: "sabaku",
            character: "mizuno",
            type: "shishi",
            cost: 1,
            attack: 5,
            shield: 12,
            desc: "敵に 5 ダメージ、防 12。列強介入メーターを 4% 下げる。カードを1枚引く。",
            rarity: "common",
            onPlay: (b) => {
                b.dealDamageToEnemy(5);
                b.gainPlayerShield(12);
                b.modifyImperialGauge(-4);
                b.drawCards(1);
            }
        },
        "kiyokawa_leader": {
            id: "kiyokawa_leader",
            name: "清河八郎：浪士組の魁",
            faction: "sabaku",
            character: "kiyokawa",
            type: "shishi",
            cost: 2,
            attack: 12,
            shield: 6,
            desc: "敵に 12 ダメージ、防 6。カードを2枚引く。連鎖+1。",
            rarity: "uncommon",
            onPlay: (b) => {
                b.dealDamageToEnemy(12);
                b.gainPlayerShield(6);
                b.drawCards(2);
                b.comboCount += 1;
            }
        },

        // --- ⚡ 西洋兵器・列強カード（中立・強力だが介入度上昇） ---
        "weapon_minie": {
            id: "weapon_minie",
            name: "新式ミニエ銃",
            faction: "neutral",
            type: "equip",
            cost: 1,
            attack: 0,
            shield: 0,
            desc: "【西洋火器】この戦闘中、全攻撃カード威力+4。⚠️ 列強介入メーター+3%。",
            rarity: "uncommon",
            imperialRisk: 3,
            onPlay: (b, self) => {
                b.applyPlayerBuff("strength", 4);
                b.modifyImperialGauge(3);
                window.soundSystem.playGunshot();
            }
        },
        "weapon_armstrong": {
            id: "weapon_armstrong",
            name: "アームストロング砲",
            faction: "neutral",
            type: "tactic",
            cost: 2,
            attack: 22,
            shield: 0,
            desc: "敵に 22 の破滅的ダメージ。敵のシールドを全破壊。⚠️ 列強介入メーター+5%。",
            rarity: "rare",
            imperialRisk: 5,
            onPlay: (b, self) => {
                if (b.enemy) b.enemy.shield = 0;
                b.dealDamageToEnemy(22);
                b.modifyImperialGauge(5);
                window.soundSystem.playGunshot();
            }
        },
        "weapon_gatling": {
            id: "weapon_gatling",
            name: "舶来ガトリング砲",
            faction: "neutral",
            type: "equip",
            cost: 2,
            attack: 0,
            shield: 0,
            desc: "毎ターン終了時、敵に自動で 6 ダメージ。⚠️ 列強介入メーター+6%。",
            rarity: "legendary",
            imperialRisk: 6,
            onPlay: (b, self) => {
                b.applyPlayerBuff("auto_gatling", 6);
                b.modifyImperialGauge(6);
                window.soundSystem.playGunshot();
            }
        },
        "warship_ironclad": {
            id: "warship_ironclad",
            name: "甲鉄艦の艦砲射撃",
            faction: "neutral",
            type: "tactic",
            cost: 3,
            attack: 36,
            shield: 10,
            desc: "敵に 36 ダメージ、防 10。敵を気絶（次ターン行動不能）させる。⚠️ 列強介入メーター+10%。",
            rarity: "legendary",
            imperialRisk: 10,
            onPlay: (b, self) => {
                b.dealDamageToEnemy(36);
                b.gainPlayerShield(10);
                if (b.enemy) b.enemy.stunned = true;
                b.modifyImperialGauge(10);
                window.soundSystem.playGunshot();
            }
        },

        // --- 💊 道具・回復アイテムカード（中立） ---
        "item_wound_medicine": {
            id: "item_wound_medicine",
            name: "特製・生薬傷薬",
            faction: "neutral",
            type: "item",
            cost: 1,
            attack: 0,
            shield: 4,
            desc: "防 4 を獲得し、HP を 12 回復する。【消費道具】（使用後デッキから消滅）。",
            rarity: "common",
            exhaust: true,
            consumable: true,
            onPlay: (b) => {
                b.healPlayer(12);
                if (window.soundSystem && window.soundSystem.playTaiko) {
                    window.soundSystem.playTaiko(false);
                }
            }
        },
        "item_mankintan": {
            id: "item_mankintan",
            name: "和漢名薬・萬金丹",
            faction: "neutral",
            type: "item",
            cost: 1,
            attack: 0,
            shield: 0,
            desc: "HP を 20 回復し、自身の弱体・脱力状態を全治癒する。【消費道具】（使用後デッキから消滅）。",
            rarity: "uncommon",
            exhaust: true,
            consumable: true,
            onPlay: (b) => {
                b.healPlayer(20);
                if (b.playerDebuffs) b.playerDebuffs = {};
                if (window.soundSystem && window.soundSystem.playTaiko) {
                    window.soundSystem.playTaiko(false);
                }
            }
        },
        "item_quinine": {
            id: "item_quinine",
            name: "蘭方秘薬・キニーネ",
            faction: "neutral",
            type: "item",
            cost: 0,
            attack: 0,
            shield: 0,
            desc: "HP を 28 回復し、カードを 1 枚引く。【消費道具】（使用後デッキから消滅）。",
            rarity: "rare",
            exhaust: true,
            consumable: true,
            onPlay: (b) => {
                b.healPlayer(28);
                b.drawCards(1);
                if (window.soundSystem && window.soundSystem.playTaiko) {
                    window.soundSystem.playTaiko(false);
                }
            }
        },

        // --- ⚠️ 不平等条約・呪いカード ---
        "curse_bounty": {
            id: "curse_bounty",
            name: "幕府指名手配",
            faction: "curse",
            type: "curse",
            cost: 1,
            desc: "【呪い・重圧】手札にある間、ターン終了時に HP 3 ダメージ。1文支払って使用するとその戦闘中は除外（Exhaust）される。",
            rarity: "curse",
            exhaust: true,
            onTurnEndInHand: (battle) => {
                battle.damagePlayerDirect(3);
            },
            onPlay: (battle) => {
                if (window.soundSystem && window.soundSystem.playWarning) {
                    window.soundSystem.playWarning();
                }
            }
        },
        "curse_extraterritoriality": {
            id: "curse_extraterritoriality",
            name: "不平等条約：治外法権の受容",
            faction: "curse",
            type: "curse",
            cost: 0,
            unplayable: true,
            desc: "【呪い・プレイ不可】手札にある間、ターン終了時に HP 3 ダメージ ＆ 列強介入+4%。",
            rarity: "curse",
            onTurnEndInHand: (b) => {
                b.damagePlayerDirect(3);
                b.modifyImperialGauge(4);
                window.soundSystem.playWarning();
            }
        },
        "curse_tariff": {
            id: "curse_tariff",
            name: "不平等条約：関税自主権喪失",
            faction: "curse",
            type: "curse",
            cost: 0,
            unplayable: true,
            desc: "【呪い・プレイ不可】手札にある間、他の全カードのコストが+1文される。",
            rarity: "curse"
        },
        "curse_betrayal": {
            id: "curse_betrayal",
            name: "家臣の寝返り",
            faction: "curse",
            type: "curse",
            cost: 0,
            unplayable: true,
            desc: "【呪い・プレイ不可】このカードを引いた時、敵の攻撃力が+3上昇する。",
            rarity: "curse",
            onDrawn: (b) => {
                if (b.enemy) {
                    b.enemy.buffStrength = (b.enemy.buffStrength || 0) + 3;
                }
                window.soundSystem.playWarning();
            }
        },
        "takeda_kounsai": {
            id: "takeda_kounsai",
            name: "武田耕雲斎：尊攘の義旗",
            faction: "tobaku",
            character: "takeda_kounsai",
            type: "shishi",
            subType: "leader",
            cost: 1,
            attack: 10,
            shield: 8,
            desc: "敵に 10 ダメージ、防 8。敵に流血 2を付与する。次回戦闘の攻撃力+4。",
            rarity: "uncommon",
            onPlay: (b, self) => {
                b.dealDamageToEnemy(10);
                b.gainPlayerShield(8);
                b.applyStatusToEnemy('bleed', 2);
                if (window.soundSystem) window.soundSystem.playSwordHeavy();
            }
        },
        "ogasawara_minister": {
            id: "ogasawara_minister",
            name: "小笠原長行：老中の決戦",
            faction: "sabaku",
            character: "ogasawara",
            type: "shishi",
            subType: "tactician",
            cost: 2,
            attack: 8,
            shield: 16,
            desc: "敵に 8 ダメージ、防 16。列強介入度を -5% 低下させ、敵のシールドを 6 破壊する。",
            rarity: "uncommon",
            onPlay: (b, self) => {
                b.dealDamageToEnemy(8);
                b.gainPlayerShield(16);
                b.destroyEnemyShield(6);
                if (window.app) window.app.modifyImperialGauge(-5);
                if (window.soundSystem) window.soundSystem.playShieldBash();
            }
        },
        "sagara_souzou": {
            id: "sagara_souzou",
            name: "相楽総三：赤報の義旗",
            faction: "tobaku",
            character: "sagara",
            type: "shishi",
            subType: "leader",
            cost: 1,
            attack: 12,
            shield: 4,
            desc: "敵に 12 ダメージ、防 4。次の戦闘の攻撃力+4、20両を得る。",
            rarity: "uncommon",
            onPlay: (b, self) => {
                b.dealDamageToEnemy(12);
                b.gainPlayerShield(4);
                if (window.app) {
                    window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 4;
                    window.app.gold += 20;
                }
                if (window.soundSystem) window.soundSystem.playSword();
            }
        },
        "shibusawa_eiichi": {
            id: "shibusawa_eiichi",
            name: "渋沢栄一：論語と算盤",
            faction: "sabaku",
            character: "shibusawa",
            type: "shishi",
            subType: "tactician",
            cost: 1,
            attack: 0,
            shield: 10,
            desc: "防 10、カードを 1 枚引く。軍資金 25両を獲得し、列強介入メーターを 3% 下げる。",
            rarity: "rare",
            onPlay: (b, self) => {
                b.gainPlayerShield(10);
                b.drawCards(1);
                if (window.app) {
                    window.app.gold += 25;
                    window.app.modifyImperialGauge(-3);
                }
                if (window.soundSystem) window.soundSystem.playCoin();
            }
        },
        "curse_riot": {
            id: "curse_riot",
            name: "過激派の暴発",
            faction: "curse",
            type: "curse",
            cost: 0,
            unplayable: true,
            desc: "【呪い・プレイ不可】このカードを引いた時、自身に 4 ダメージ。",
            rarity: "curse",
            onDrawn: (b) => {
                b.damagePlayerDirect(4);
                window.soundSystem.playWarning();
            }
        },
        // --- 🔴 討幕派 新規志士カード（4枚） ---
        "shimazu_nariakira": {
            id: "shimazu_nariakira",
            name: "島津斉彬：集成の英断",
            faction: "tobaku",
            character: "nariakira",
            type: "shishi",
            subType: "leader",
            cost: 2,
            attack: 10,
            shield: 10,
            desc: "敵に 10 ダメージ、防 10。手札の「兵器」または「戦術」のコストをこの戦闘中1下げる。列強介入 -3%。",
            rarity: "legendary",
            onPlay: (b, self) => {
                b.dealDamageToEnemy(10);
                b.gainPlayerShield(10);
                if (b.hand) {
                    b.hand.forEach(c => {
                        if (c.type === 'tactic' || c.type === 'equip') {
                            c.cost = Math.max(0, (c.cost || 0) - 1);
                        }
                    });
                }
                b.modifyImperialGauge(-3);
            }
        },
        "john_manjiro": {
            id: "john_manjiro",
            name: "ジョン万次郎：数奇なる羅針盤",
            faction: "tobaku",
            character: "manjiro",
            type: "shishi",
            subType: "samurai",
            cost: 1,
            attack: 6,
            shield: 6,
            desc: "敵に 6 ダメージ、防 6。山札からカードを2枚引く。次ターンの手札上限+1。",
            rarity: "rare",
            onPlay: (b, self) => {
                b.dealDamageToEnemy(6);
                b.gainPlayerShield(6);
                b.drawCards(2);
                b.nextTurnHandBonus = (b.nextTurnHandBonus || 0) + 1;
            }
        },
        "yuri_kimimasa": {
            id: "yuri_kimimasa",
            name: "由利公正：新政の殖産",
            faction: "tobaku",
            character: "yuri",
            type: "shishi",
            subType: "tactician",
            cost: 1,
            attack: 0,
            shield: 8,
            desc: "防 8。文を 2 獲得。次戦勝利時の獲得軍資金 +15両。",
            rarity: "uncommon",
            onPlay: (b, self) => {
                b.gainPlayerShield(8);
                b.gainPlayerEnergy(2);
                if (window.app) {
                    window.app.nextBattleGoldBonus = (window.app.nextBattleGoldBonus || 0) + 15;
                }
            }
        },
        "hirano_kuniomi": {
            id: "hirano_kuniomi",
            name: "平野国臣：志士の狂瀾",
            faction: "tobaku",
            character: "hirano",
            type: "shishi",
            subType: "samurai",
            cost: 1,
            attack: 12,
            shield: 0,
            desc: "敵に 12 ダメージ。自軍HPを 3 消費する。敵に「脆弱 2」（被ダメージ50%増）を付与。",
            rarity: "rare",
            killedBySabaku: true, // 六角獄舎で処刑
            onPlay: (b, self) => {
                b.dealDamageToEnemy(12);
                b.damagePlayerDirect(3);
                b.applyStatusToEnemy("vulnerable", 2);
            }
        },

        // --- 🔵 佐幕派 新規志士カード（4枚） ---
        "tokugawa_yoshinobu": {
            id: "tokugawa_yoshinobu",
            name: "徳川慶喜：英断の恭順",
            faction: "sabaku",
            character: "yoshinobu",
            type: "shishi",
            subType: "leader",
            cost: 2,
            attack: 8,
            shield: 16,
            desc: "敵に 8 ダメージ、防 16。敵の攻撃意図を 5 低下させ、次ターンの敵剛力を無効化する。",
            rarity: "legendary",
            onPlay: (b, self) => {
                b.dealDamageToEnemy(8);
                b.gainPlayerShield(16);
                if (b.enemy && b.enemy.intent && b.enemy.intent.damage) {
                    b.enemy.intent.damage = Math.max(0, b.enemy.intent.damage - 5);
                }
                b.applyStatusToEnemy("weak", 2);
            }
        },
        "nakano_takeko": {
            id: "nakano_takeko",
            name: "中野竹子：薙刀の一陣",
            faction: "sabaku",
            character: "takeko",
            type: "shishi",
            subType: "samurai",
            cost: 1,
            attack: 11,
            shield: 4,
            desc: "敵に 11 ダメージ、防 4。会心の一撃（50%の確率でダメージ1.5倍）。敵のシールドを 5 貫通。",
            rarity: "rare",
            killedByTobaku: true, // 柳橋で戦死
            onPlay: (b, self) => {
                let dmg = 11;
                if (Math.random() < 0.5) {
                    dmg = Math.floor(dmg * 1.5);
                    if (window.particleSystem) window.particleSystem.showComboText("【会心一刀！】", 1);
                }
                if (b.enemy && b.enemy.shield > 0) {
                    b.enemy.shield = Math.max(0, b.enemy.shield - 5);
                }
                b.dealDamageToEnemy(dmg);
                b.gainPlayerShield(4);
            }
        },
        "iwase_tadanari": {
            id: "iwase_tadanari",
            name: "岩瀬忠震：条約の理財",
            faction: "sabaku",
            character: "iwase",
            type: "shishi",
            subType: "tactician",
            cost: 1,
            attack: 4,
            shield: 8,
            desc: "敵に 4 ダメージ、防 8。列強介入メーターを 4% 下げ、手札を1枚引く。",
            rarity: "uncommon",
            onPlay: (b, self) => {
                b.dealDamageToEnemy(4);
                b.gainPlayerShield(8);
                b.modifyImperialGauge(-4);
                b.drawCards(1);
            }
        },
        "hattori_takeo": {
            id: "hattori_takeo",
            name: "服部武雄：不抜の二刀",
            faction: "sabaku",
            character: "hattori",
            type: "shishi",
            subType: "samurai",
            cost: 2,
            attack: 14,
            shield: 8,
            desc: "敵に 7 ダメージを 2回（計14）、防 8。敵のシールドを 6 破壊する。",
            rarity: "rare",
            killedBySabaku: true, // 油小路で新選組に討たれる
            onPlay: (b, self) => {
                if (b.enemy && b.enemy.shield > 0) {
                    b.enemy.shield = Math.max(0, b.enemy.shield - 6);
                }
                b.dealDamageToEnemy(7);
                b.dealDamageToEnemy(7);
                b.gainPlayerShield(8);
            }
        },
        "yamamoto_yae": {
            id: "yamamoto_yae",
            name: "山本八重：不抜の銃姫",
            faction: "sabaku",
            character: "yae",
            type: "shishi",
            subType: "samurai",
            cost: 1,
            attack: 9,
            shield: 5,
            desc: "敵に 9 ダメージ、防 5。手札の「兵器」カードの枚数×3 追加ダメージ。敵のシールドを 4 破壊。",
            rarity: "rare",
            onPlay: (b, self) => {
                let bonus = 0;
                if (b.hand) {
                    bonus = b.hand.filter(c => c.type === 'equip').length * 3;
                }
                if (b.enemy && b.enemy.shield > 0) {
                    b.enemy.shield = Math.max(0, b.enemy.shield - 4);
                }
                b.dealDamageToEnemy(9 + bonus);
                b.gainPlayerShield(5);
            }
        },

        // --- 1853-1864年期 追加志士カード（討幕2名、佐幕2名） ---
        "fujita_toko": {
            id: "fujita_toko",
            name: "藤田東湖：回天の気概",
            faction: "tobaku",
            character: "toko",
            type: "shishi",
            subType: "leader",
            cost: 2,
            attack: 11,
            shield: 9,
            desc: "敵に 11 ダメージ、防 9。味方全体の攻撃力をこの戦闘中 +3。列強介入 -3%。",
            rarity: "legendary",
            onPlay: (b, self) => {
                b.dealDamageToEnemy(11);
                b.gainPlayerShield(9);
                b.applyPlayerBuff("strength", 3);
                b.modifyImperialGauge(-3);
            }
        },
        "hashimoto_sanai": {
            id: "hashimoto_sanai",
            name: "橋本左内：啓発の先見",
            faction: "tobaku",
            character: "sanai",
            type: "shishi",
            subType: "tactician",
            cost: 1,
            attack: 6,
            shield: 8,
            desc: "敵に 6 ダメージ、防 8。カードを2枚引く。敵に「脱力 2」を付与する。",
            rarity: "rare",
            killedBySabaku: true, // 安政の大獄で斬首
            onPlay: (b, self) => {
                b.dealDamageToEnemy(6);
                b.gainPlayerShield(8);
                b.drawCards(2);
                b.applyStatusToEnemy("weak", 2);
            }
        },
        "kawaji_toshiakira": {
            id: "kawaji_toshiakira",
            name: "川路聖謨：至誠の勘定",
            faction: "sabaku",
            character: "kawaji",
            type: "shishi",
            subType: "tactician",
            cost: 1,
            attack: 4,
            shield: 13,
            desc: "敵に 4 ダメージ、防 13。列強介入メーターを 5% 下げる。手札を1枚引く。",
            rarity: "rare",
            killedByTobaku: true, // 江戸開城に際し自刃
            onPlay: (b, self) => {
                b.dealDamageToEnemy(4);
                b.gainPlayerShield(13);
                b.modifyImperialGauge(-5);
                b.drawCards(1);
            }
        },
        "serizawa_kamo": {
            id: "serizawa_kamo",
            name: "芹沢鴨：豪剣の狂瀾",
            faction: "sabaku",
            character: "serizawa",
            type: "shishi",
            subType: "samurai",
            cost: 2,
            attack: 16,
            shield: 4,
            desc: "敵に 16 ダメージ、防 4。自軍HPを 4 消費するが、敵シールドを 6 破壊する。",
            rarity: "rare",
            killedBySabaku: true, // 新選組内部粛清により八木邸で暗殺
            onPlay: (b, self) => {
                if (b.enemy && b.enemy.shield > 0) {
                    b.enemy.shield = Math.max(0, b.enemy.shield - 6);
                }
                b.dealDamageToEnemy(16);
                b.gainPlayerShield(4);
                b.damagePlayer(4);
            }
        },

        // --- 1853-1864年期 追加志士カード第2弾（討幕2名、佐幕2名） ---
        "shimazu_hisamitsu": {
            id: "shimazu_hisamitsu",
            name: "島津久光：率兵の国父",
            faction: "tobaku",
            character: "hisamitsu",
            type: "shishi",
            subType: "leader",
            cost: 2,
            attack: 8,
            shield: 14,
            desc: "敵に 8 ダメージ、防 14。味方全体の攻撃力をこの戦闘中 +3。軍資金 25両 獲得。",
            rarity: "legendary",
            onPlay: (b, self) => {
                b.dealDamageToEnemy(8);
                b.gainPlayerShield(14);
                b.applyPlayerBuff("strength", 3);
                if (window.bakumatsuApp) window.bakumatsuApp.gold += 25;
            }
        },
        "kawakami_gensai": {
            id: "kawakami_gensai",
            name: "河上彦斎：神速の居合",
            faction: "tobaku",
            character: "gensai",
            type: "shishi",
            subType: "samurai",
            cost: 1,
            attack: 14,
            shield: 0,
            desc: "敵に 14 ダメージ。敵シールドを 5 貫通。敵が「脆弱」状態なら追加 6 ダメージ。",
            rarity: "rare",
            killedBySabaku: true, // 明治初年に斬首刑死
            onPlay: (b, self) => {
                let dmg = 14;
                if (b.enemy && b.enemy.vulnerable > 0) {
                    dmg += 6;
                }
                if (b.enemy && b.enemy.shield > 0) {
                    b.enemy.shield = Math.max(0, b.enemy.shield - 5);
                }
                b.dealDamageToEnemy(dmg);
            }
        },
        "ando_nobumasa": {
            id: "ando_nobumasa",
            name: "安藤信正：公武合体の老中",
            faction: "sabaku",
            character: "ando",
            type: "shishi",
            subType: "tactician",
            cost: 1,
            attack: 4,
            shield: 14,
            desc: "敵に 4 ダメージ、防 14。列強介入メーターを 4% 下げる。手札を1枚引く。",
            rarity: "rare",
            onPlay: (b, self) => {
                b.dealDamageToEnemy(4);
                b.gainPlayerShield(14);
                b.modifyImperialGauge(-4);
                b.drawCards(1);
            }
        },
        "tsutsui_masanori": {
            id: "tsutsui_masanori",
            name: "筒井政憲：老練の談判",
            faction: "sabaku",
            character: "tsutsui",
            type: "shishi",
            subType: "tactician",
            cost: 1,
            attack: 5,
            shield: 11,
            desc: "敵に 5 ダメージ、防 11。敵の攻撃意図を 4 低下させる。列強介入 -3%。",
            rarity: "uncommon",
            onPlay: (b, self) => {
                b.dealDamageToEnemy(5);
                b.gainPlayerShield(11);
                if (b.enemy && b.enemy.intent) {
                    b.enemy.intent.damage = Math.max(0, (b.enemy.intent.damage || 0) - 4);
                }
                b.modifyImperialGauge(-3);
            }
        },
    },

    // ==========================================
    // 2. レリック（遺物）定義
    // ==========================================
    relics: {
        "choshu_blood_pact": {
            id: "choshu_blood_pact",
            name: "長州の血盟録",
            desc: "各ターン開始時、手札のランダムなカード1枚のコストを -1文（最低0）にする。",
            price: 220,
            onTurnStart: (b) => {
                if (b.hand && b.hand.length > 0) {
                    const c = b.hand[Math.floor(Math.random() * b.hand.length)];
                    c.cost = Math.max(0, (c.cost || 0) - 1);
                    if (window.particleSystem && window.particleSystem.createFloatingText) {
                        window.particleSystem.createFloatingText("血盟の志: コスト-1文", window.innerWidth / 2, window.innerHeight * 0.45, "#e53e3e");
                    }
                }
            }
        },
        "imperial_brocade_amulet": {
            id: "imperial_brocade_amulet",
            name: "禁裏の錦旗御守",
            desc: "毎ターン開始時、シールドを 6 自動で獲得する。",
            price: 220,
            onTurnStart: (b) => {
                b.gainPlayerShield(6);
                if (window.particleSystem && window.particleSystem.createFloatingText) {
                    window.particleSystem.createFloatingText("錦旗加護: シールド+6", window.innerWidth / 2, window.innerHeight * 0.45, "#ecc94b");
                }
            }
        },
        "omura_tactics_scroll": {
            id: "omura_tactics_scroll",
            name: "大村益次郎の陣図",
            desc: "戦闘開始時、全ての敵に 20 ダメージを与え、脱力 2（与ダメ25%減）を付与する。",
            price: 240,
            onBattleStart: (b) => {
                b.dealDamageToEnemy(20);
                b.applyStatusToEnemy("weak", 2);
                if (window.particleSystem && window.particleSystem.createFloatingText) {
                    window.particleSystem.createFloatingText("陣図展開: 敵全体20ダメ & 脱力2", window.innerWidth / 2, window.innerHeight * 0.35, "#3182ce");
                }
            }
        },
        "aoi_crest_blade": {
            id: "aoi_crest_blade",
            name: "葵の御紋章佩刀",
            desc: "戦闘開始時、自身に剛力+5（全攻撃威力+5）および開幕シールド+12を獲得する。",
            price: 240,
            onBattleStart: (b) => {
                b.applyPlayerBuff("strength", 5);
                b.gainPlayerShield(12);
                if (window.particleSystem && window.particleSystem.createFloatingText) {
                    window.particleSystem.createFloatingText("葵の武威: 剛力+5 & シールド+12", window.innerWidth / 2, window.innerHeight * 0.35, "#805ad5");
                }
            }
        },
        "brocade_banner": {
            id: "brocade_banner",
            name: "錦の御旗",
            desc: "戦闘開始時、全ての敵に「脱力 2」（与ダメ25%減）を付与する。",
            price: 180,
            onBattleStart: (b) => {
                b.applyStatusToEnemy("weak", 2);
            }
        },
        "pocket_watch": {
            id: "pocket_watch",
            name: "西洋懐中時計",
            desc: "各戦闘の第1ターン、追加で 1文 を得てカードを2枚余分に引く。",
            price: 200,
            onTurnStart: (b, turn) => {
                if (turn === 1) {
                    b.gainPlayerEnergy(1);
                    b.drawCards(2);
                }
            }
        },
        "kaientai_log": {
            id: "kaientai_log",
            name: "海援隊航海日誌",
            desc: "1ターン中にカードを4枚使用するたびに、1文を回復する。",
            price: 160,
            onCardPlayed: (b) => {
                if (b.playedThisTurn.length % 4 === 0) {
                    b.gainPlayerEnergy(1);
                    window.soundSystem.playHyoshigi();
                }
            }
        },
        "makoto_haori": {
            id: "makoto_haori",
            name: "新選組の浅葱羽織",
            desc: "シールドを獲得するカードを使うたび、追加で+3シールドを得る。",
            price: 150,
            onCardPlayed: (b, card) => {
                if (card.shield > 0) {
                    b.gainPlayerShield(3);
                }
            }
        },
        "wado_kaichin": {
            id: "wado_kaichin",
            name: "古銭・和同開珎",
            desc: "商人でのカード購入や手当て（HP回復）の費用が常時 25% 割引される。",
            price: 130
        },
        "western_medicine": {
            id: "western_medicine",
            name: "蘭方医の手術道具",
            desc: "戦闘勝利時、HPを 6 回復する。",
            price: 170,
            onBattleWin: (app) => {
                app.healPlayer(6);
            }
        },
        "iron_will": {
            id: "iron_will",
            name: "尊皇不抜の建白書",
            desc: "列強介入メーターの上昇を常時 25% 抑える。",
            price: 190
        },
        "choshu_tome": {
            id: "choshu_tome",
            name: "長州奇兵隊簿",
            desc: "志士カードをプレイした時、シールド 4 を獲得し、カードを 1 枚引く。",
            price: 175,
            onCardPlayed: (b, card) => {
                if (card.type === 'shishi') {
                    b.gainPlayerShield(4);
                    b.drawCards(1);
                    if (window.soundSystem) window.soundSystem.playHyoshigi();
                }
            }
        },
        "sakura_tsuba": {
            id: "sakura_tsuba",
            name: "桜文鍔",
            desc: "1ターン中に3連鎖（参之連）を達成した時、即座にシールド 6 を獲得する。",
            price: 160,
            onCardPlayed: (b, card) => {
                if (b.comboCount === 3) {
                    b.gainPlayerShield(6);
                    if (window.soundSystem) window.soundSystem.playShield();
                }
            }
        },
        "dutch_lexicon": {
            id: "dutch_lexicon",
            name: "蘭和辞書",
            desc: "商人での買い物がさらに 20% 割引され、戦闘勝利時の獲得小判が +15両 増える。",
            price: 150
        },
        "shogunate_charter": {
            id: "shogunate_charter",
            name: "徳川慶喜の親書",
            desc: "各戦闘の第1ターン、追加で 1文（エネルギー）を得る。",
            price: 180,
            onTurnStart: (b, turn) => {
                if (turn === 1) {
                    b.gainPlayerEnergy(1);
                }
            }
        },
        "bizen_osafune": {
            id: "bizen_osafune",
            name: "備前長船",
            desc: "各ターン、最初にプレイする攻撃カードのダメージが +4 される。",
            price: 170,
            onTurnStart: (b) => {
                b.bizenUsedThisTurn = false;
            },
            onCardPlayed: (b, card) => {
                if (!b.bizenUsedThisTurn && card.type === 'attack') {
                    b.bizenUsedThisTurn = true;
                    b.dealDamageToEnemy(4);
                }
            }
        },
        "ironclad_plate": {
            id: "ironclad_plate",
            name: "甲鉄艦装甲板",
            desc: "戦闘開始時、シールド 14 を獲得する。",
            price: 170,
            onBattleStart: (b) => {
                b.gainPlayerShield(14);
                if (window.soundSystem) window.soundSystem.playShield();
            }
        },
        "mibu_bell": {
            id: "mibu_bell",
            name: "壬生寺の鐘",
            desc: "敵の意図が「攻撃」であるターンの開始時、シールド 4 を獲得する。",
            price: 160,
            onTurnStart: (b) => {
                if (b.enemy && b.enemy.intent && b.enemy.intent.type === 'attack') {
                    b.gainPlayerShield(4);
                    if (window.soundSystem) window.soundSystem.playShield();
                }
            }
        },
        "samurai_pipe": {
            id: "samurai_pipe",
            name: "志士の煙管",
            desc: "休息マスで休息した際、HP回復量が最大HPの 35% から 50% に増加する。",
            price: 140
        },
        "yoshida_shoin_brush": {
            id: "yoshida_shoin_brush",
            name: "松下村塾の硯筆",
            desc: "戦闘勝利後のカード獲得報酬の提示枚数が 3枚 から 4枚 に増加する。",
            price: 175
        }
    },

    // ==========================================
    // 3. 世論（天下の大勢・天秤フェーズ定義）
    // ==========================================
    opinionPhases: [
        {
            id: "bakui_gogo",
            name: "幕威轟々",
            subTitle: "佐幕強優勢",
            min: -100,
            max: -50,
            badgeClass: "opinion-phase-bakui",
            color: "#2b6cb0",
            desc: "徳川三百年・親藩譜代の威光が天下を圧倒。佐幕派に絶大な大義名分、討幕派は逆賊として孤立無援の窮地。"
        },
        {
            id: "sabaku_yusei",
            name: "佐幕優勢",
            subTitle: "佐幕軽優勢",
            min: -49,
            max: -20,
            badgeClass: "opinion-phase-sabaku",
            color: "#319795",
            desc: "公儀と諸藩の秩序が優勢。佐幕派に有利な風潮、討幕派には警戒の視線。"
        },
        {
            id: "tenka_konmei",
            name: "天下混迷",
            subTitle: "情勢拮抗・公武融和",
            min: -19,
            max: 19,
            badgeClass: "opinion-phase-neutral",
            color: "#d69e2e",
            desc: "天下の大勢は混沌。佐幕・討幕の主張が激突し、互いに決め手を欠く緊張状態。"
        },
        {
            id: "tobaku_koyo",
            name: "討幕高揚",
            subTitle: "討幕軽優勢",
            min: 20,
            max: 49,
            badgeClass: "opinion-phase-tobaku",
            color: "#dd6b20",
            desc: "尊皇攘夷・倒幕の気運が全国へ波及。討幕派に追い風が吹き、佐幕派は守勢に立たされる。"
        },
        {
            id: "kaiten_kangun",
            name: "回天官軍",
            subTitle: "討幕強優勢",
            min: 50,
            max: 100,
            badgeClass: "opinion-phase-kangun",
            color: "#e53e3e",
            desc: "錦の御旗が翻り、新時代の到来を確信した民衆と諸藩が集結。討幕派は官軍として歓呼され、佐幕派は朝敵の汚名を受ける。"
        }
    ],

    // ==========================================
    // 3.1 旧世論（トレンド・モディファイア）
    // ==========================================
    trends: [
        {
            id: "sonno_joi",
            name: "尊皇攘夷の熱狂",
            badgeClass: "trend-red",
            desc: "国粋主義が高揚！全攻撃ダメージ+3。ただしターン終了時列強介入+1%。",
            applyBattleStart: (b) => {
                b.applyPlayerBuff("strength", 3);
            },
            onTurnEnd: (b) => {
                b.modifyImperialGauge(1);
            }
        },
        {
            id: "kaikoku",
            name: "開国通商の風潮",
            badgeClass: "trend-blue",
            desc: "西洋化の波！西洋カードの消費文-1。ただし列強介入上昇率が1.5倍。",
            applyBattleStart: (b) => {
                b.westernCostDiscount = 1;
                b.imperialMultiplier = 1.5;
            }
        },
        {
            id: "kobu_gattai",
            name: "公武合体の融和",
            badgeClass: "trend-gold",
            desc: "協調路線！シールド獲得量が常時+3。ターン開始時の手札+1枚。",
            applyBattleStart: (b) => {
                b.shieldBonus = 3;
                b.handDrawBonus = 1;
            }
        }
    ],

    // ==========================================
    // 4. 敵キャラクター定義
    // ==========================================
    enemies: {
        // ==========================================
        // 第一幕：京洛動乱（通常4体、エリート2体、ボス2体）
        // ==========================================
        "act1_normal_1": {
            name: "京都見廻組隊士",
            maxHp: 42,
            sprite: "mimarigumi",
            faction: "sabaku",
            intents: [
                { type: "attack", damage: 10, desc: "抜き打ち" },
                { type: "attack", damage: 13, desc: "連続斬り" },
                { type: "defend", shield: 8, desc: "身構え" },
                { type: "attack", damage: 16, desc: "踏み込み斬り" }
            ]
        },
        "act1_normal_2": {
            name: "尊攘激派の脱藩浪士",
            maxHp: 38,
            sprite: "ronin",
            faction: "tobaku",
            intents: [
                { type: "attack", damage: 12, desc: "狂乱の太刀" },
                { type: "attack", damage: 15, desc: "捨て身の一撃" },
                { type: "buff", strength: 3, desc: "気合の雄叫び" },
                { type: "attack", damage: 20, desc: "血煙の乱舞" }
            ]
        },
        "act1_normal_choshu_spy": {
            name: "長州密偵武士",
            maxHp: 36,
            sprite: "ronin",
            faction: "tobaku",
            intents: [
                { type: "attack", damage: 7, times: 2, desc: "暗器二連投" },
                { type: "defend", shield: 10, desc: "影身・煙玉散布" },
                { type: "curse", curseId: "curse_betrayal", damage: 9, desc: "塗毒の刃・陰謀" },
                { type: "attack", damage: 16, desc: "奇襲・燕返し" }
            ]
        },
        "act1_normal_shinsengumi": {
            name: "新選組平隊士",
            maxHp: 44,
            sprite: "mimarigumi",
            faction: "sabaku",
            intents: [
                { type: "attack", damage: 10, desc: "新選組直伝・平突き" },
                { type: "defend", shield: 9, desc: "隊列防御陣" },
                { type: "attack", damage: 8, times: 2, desc: "電光二段突き" },
                { type: "attack", damage: 15, desc: "誠の突撃" }
            ]
        },
        "act1_elite_izo": {
            name: "人斬り以蔵 (岡田以蔵)",
            maxHp: 82,
            isElite: true,
            sprite: "izo",
            faction: "tobaku",
            intents: [
                { type: "attack", damage: 10, times: 2, desc: "二連撃" },
                { type: "attack", damage: 14, desc: "踏み込み" },
                { type: "curse", curseId: "curse_riot", damage: 9, desc: "天誅の怨嗟" },
                { type: "attack", damage: 22, desc: "人斬り秘剣" }
            ]
        },
        "act1_elite_serizawa": {
            name: "芹沢鴨（豪刀の猛威）",
            maxHp: 98,
            isElite: true,
            sprite: "serizawa",
            faction: "sabaku",
            intents: [
                { type: "attack", damage: 18, desc: "豪刀乱舞" },
                { type: "buff", strength: 4, desc: "酒気狂乱" },
                { type: "attack", damage: 25, desc: "無慈悲の一閃" },
                { type: "attack", damage: 12, times: 2, desc: "酔剣二連" }
            ]
        },
        // 互換性エイリアス
        "act2_elite_serizawa": {
            name: "芹沢鴨（豪刀の猛威）",
            maxHp: 180,
            startShield: 25,
            isElite: true,
            sprite: "serizawa",
            faction: "sabaku",
            intents: [
                { type: "attack", damage: 18, desc: "豪刀乱舞" },
                { type: "buff", strength: 4, desc: "酒気狂乱" },
                { type: "attack", damage: 25, desc: "無慈悲の一閃" },
                { type: "attack", damage: 12, times: 2, desc: "酔剣二連" }
            ]
        },
        "act1_boss_tobaku": {
            name: "新選組局長・近藤勇",
            maxHp: 140,
            isBoss: true,
            sprite: "kondo_boss",
            faction: "sabaku",
            intents: [
                { type: "defend", shield: 16, desc: "不動の構え" },
                { type: "attack", damage: 22, desc: "虎徹・袈裟斬り" },
                { type: "buff", strength: 4, desc: "誠の号令" },
                { type: "attack", damage: 30, desc: "天然理心流・絶技" }
            ]
        },
        "act1_boss_sabaku": {
            name: "長州総帥・桂小五郎",
            maxHp: 135,
            isBoss: true,
            sprite: "katsura_boss",
            faction: "tobaku",
            intents: [
                { type: "attack", damage: 18, desc: "神道無念流・霞斬り" },
                { type: "defend", shield: 18, desc: "逃げの小五郎" },
                { type: "curse", curseId: "curse_betrayal", damage: 12, desc: "革命の扇動" },
                { type: "attack", damage: 28, desc: "維新の疾風" }
            ]
        },

        // ==========================================
        // 第二幕：東海道進撃（通常4体、エリート2体、ボス2体）
        // ==========================================
        "act2_normal_1": {
            name: "幕府新式歩兵連隊",
            maxHp: 105,
            startShield: 15,
            sprite: "shinsiki",
            faction: "sabaku",
            intents: [
                { type: "attack", damage: 15, desc: "小銃一斉射撃" },
                { type: "attack", damage: 18, desc: "追撃射撃" },
                { type: "defend", shield: 15, desc: "方陣防御" },
                { type: "attack", damage: 22, desc: "銃剣突撃" }
            ]
        },
        "act2_normal_satsuma_samurai": {
            name: "薩摩藩城下士",
            maxHp: 100,
            startShield: 15,
            sprite: "ronin",
            faction: "tobaku",
            intents: [
                { type: "attack", damage: 22, desc: "示現流・初太刀チェスト！" },
                { type: "buff", strength: 4, desc: "猿叫の咆哮" },
                { type: "attack", damage: 26, desc: "捨て身の斬り込み" },
                { type: "defend", shield: 14, desc: "蜻蛉の構え" }
            ]
        },
        "act2_normal_denshitai": {
            name: "幕府伝習隊狙撃手",
            maxHp: 95,
            startShield: 20,
            sprite: "shinsiki",
            faction: "sabaku",
            intents: [
                { type: "attack", damage: 19, desc: "シャスポー精密狙撃" },
                { type: "defend", shield: 18, desc: "地形散兵展開" },
                { type: "attack", damage: 10, times: 2, desc: "鉛弾の雨・二連射" },
                { type: "attack", damage: 25, desc: "急所狙撃" }
            ]
        },
        "act2_normal_british_marine": {
            name: "英国式警備陸戦隊",
            maxHp: 110,
            startShield: 20,
            sprite: "shinsiki",
            intents: [
                { type: "attack", damage: 16, desc: "列強式斉射号令" },
                { type: "attack", damage: 12, times: 2, desc: "サーベル抜刀突撃" },
                { type: "defend", shield: 20, desc: "規律ある鉄壁方陣" },
                { type: "curse", curseId: "curse_extraterritoriality", damage: 14, desc: "砲艦外交の威圧" }
            ]
        },
        "act2_elite_iba": {
            name: "隻腕の小天狗・伊庭八郎",
            maxHp: 190,
            startShield: 25,
            isElite: true,
            sprite: "mimarigumi",
            faction: "sabaku",
            intents: [
                { type: "attack", damage: 10, times: 3, desc: "心形刀流・神速三段斬り" },
                { type: "defend", shield: 24, desc: "小天狗の見切り" },
                { type: "buff", strength: 4, desc: "不撓不屈の気迫" },
                { type: "attack", damage: 32, desc: "心形刀流奥義・残月" }
            ]
        },
        "act2_elite_hanjiro": {
            name: "人斬り半次郎 (桐野利秋)",
            maxHp: 200,
            startShield: 25,
            isElite: true,
            sprite: "izo",
            faction: "tobaku",
            intents: [
                { type: "attack", damage: 25, desc: "薬丸自顕流・電光初太刀" },
                { type: "attack", damage: 13, times: 3, desc: "鬼気迫る怒涛乱撃" },
                { type: "buff", strength: 5, desc: "隼人の戦慄雄叫び" },
                { type: "attack", damage: 35, desc: "天誅斬滅の一刀" }
            ]
        },
        "act2_boss_katamori": {
            name: "会津藩主・松平容保",
            maxHp: 340,
            startShield: 35,
            isBoss: true,
            sprite: "katamori_boss",
            faction: "sabaku",
            intents: [
                { type: "defend", shield: 24, desc: "会津魂の盾" },
                { type: "attack", damage: 24, desc: "白虎隊斉射" },
                { type: "buff", strength: 4, desc: "死守の命" },
                { type: "attack", damage: 36, desc: "義理不抜の猛撃" }
            ]
        },
        "act2_boss_saigo": {
            name: "薩摩軍総督・西郷隆盛",
            maxHp: 350,
            startShield: 35,
            isBoss: true,
            sprite: "saigo_boss",
            faction: "tobaku",
            intents: [
                { type: "attack", damage: 26, desc: "薬丸自顕流・初太刀" },
                { type: "defend", shield: 22, desc: "薩摩隼人の気迫" },
                { type: "attack", damage: 38, desc: "桜島大噴火撃" },
                { type: "buff", strength: 5, desc: "敬天愛人" }
            ]
        },

        // ==========================================
        // 終幕：天下分け目の決戦（通常4体、エリート2体、最終ボス2体）
        // ==========================================
        "act3_normal_shogitai": {
            name: "上野彰義隊決死隊",
            maxHp: 140,
            startShield: 25,
            sprite: "ronin",
            faction: "sabaku",
            intents: [
                { type: "attack", damage: 24, desc: "命知らずの突撃" },
                { type: "defend", shield: 22, desc: "寛永寺山門防柵" },
                { type: "attack", damage: 14, times: 2, desc: "徳川恩顧の怨嗟刃" },
                { type: "attack", damage: 32, desc: "殉節の決死撃" }
            ]
        },
        "act3_normal_ouetsu": {
            name: "奥羽越列藩同盟精鋭",
            maxHp: 150,
            startShield: 30,
            sprite: "mimarigumi",
            faction: "sabaku",
            intents: [
                { type: "attack", damage: 22, desc: "東北武士の剛剣" },
                { type: "defend", shield: 26, desc: "同盟軍の重盾陣" },
                { type: "attack", damage: 9, times: 3, desc: "河井継之助の機関砲斉射" },
                { type: "attack", damage: 28, desc: "不屈の雪国進軍" }
            ]
        },
        "act3_normal_shinseifu": {
            name: "新政府軍電撃隊",
            maxHp: 145,
            startShield: 25,
            sprite: "shinsiki",
            faction: "tobaku",
            intents: [
                { type: "attack", damage: 20, desc: "官軍怒涛の突進" },
                { type: "attack", damage: 15, times: 2, desc: "スナイドル後装銃斉射" },
                { type: "defend", shield: 24, desc: "錦旗親衛陣" },
                { type: "attack", damage: 30, desc: "王政復古の進撃" }
            ]
        },
        "act3_normal_armstrong": {
            name: "アームストロング砲兵隊",
            maxHp: 135,
            startShield: 30,
            sprite: "shinsiki",
            intents: [
                { type: "defend", shield: 25, desc: "照準固定・弾薬装填" },
                { type: "attack", damage: 16, desc: "護衛部隊の牽制散弾" },
                { type: "attack", damage: 12, times: 2, desc: "旋回榴弾支援射撃" },
                { type: "attack", damage: 42, desc: "アームストロング巨砲炸裂！" }
            ]
        },
        "act3_elite_battotai": {
            name: "警視抜刀隊指揮官",
            maxHp: 250,
            startShield: 35,
            isElite: true,
            sprite: "izo",
            faction: "tobaku",
            intents: [
                { type: "attack", damage: 18, times: 2, desc: "神速の二刀斬撃" },
                { type: "buff", strength: 6, desc: "示現の呼吸・殺気研磨" },
                { type: "defend", shield: 30, desc: "達人の刀受け・見切り" },
                { type: "attack", damage: 44, desc: "奥義・天下無双神速居合" }
            ]
        },
        "act3_elite_sagawa": {
            name: "鬼神・佐川官兵衛",
            maxHp: 260,
            startShield: 35,
            isElite: true,
            sprite: "serizawa",
            faction: "sabaku",
            intents: [
                { type: "attack", damage: 28, desc: "豪刀・鬼の一撃" },
                { type: "buff", strength: 4, desc: "血塗れの不退転" },
                { type: "attack", damage: 14, times: 3, desc: "狂乱の怒号三連刃" },
                { type: "attack", damage: 38, desc: "会津魂・散華の突撃" }
            ]
        },
        "act3_final_yoshinobu": {
            name: "征夷大将軍・徳川慶喜",
            maxHp: 480,
            startShield: 50,
            isFinalBoss: true,
            sprite: "yoshinobu_boss",
            faction: "sabaku",
            intents: [
                { type: "defend", shield: 28, desc: "徳川三百年の方陣" },
                { type: "attack", damage: 28, desc: "幕府新鋭砲兵斉射" },
                { type: "curse", curseId: "curse_extraterritoriality", damage: 15, desc: "列強外交の重圧" },
                { type: "attack", damage: 44, desc: "双極の終焉・葵の裁き" }
            ]
        },
        "act3_final_kangun": {
            name: "新政府官軍総司令部",
            maxHp: 500,
            startShield: 50,
            isFinalBoss: true,
            sprite: "kangun_boss",
            faction: "tobaku",
            intents: [
                { type: "attack", damage: 30, desc: "錦旗の下での総進軍" },
                { type: "defend", shield: 30, desc: "御所親衛陣" },
                { type: "buff", strength: 6, desc: "討幕の宣誓" },
                { type: "attack", damage: 45, desc: "新時代への鉄槌" }
            ]
        }
    },

    // ==========================================
    // 5. 歴史的分岐イベント
    // ==========================================
    events: [
        {
            id: "event_ikedaya",
            act: 1,
            importance: 3,
            title: "池田屋事件の急襲",
            desc: "三条小橋の旅籠「池田屋」に不逞志士が集結しているとの報せが入った。夜雨の中、提灯の明かりが揺れる。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["yoshida_minomaru","mochizuki_sacrifice"],
                    opinionChange: 12,
                    text: "【🕊️ 生存ルート】池田屋の表口へ突入し、新選組の猛攻を身を挺して食い止め稔麿と亀弥太を脱出させる",
                    effectDesc: "【生存ルート】志士『吉田稔麿』と『望月亀弥太』の両名を救出！HP 38 ダメージを受けるが、両名は生存確定となり以降もデッキで使用可能！",
                    action: (app) => {
                        app.markShishiSurvived("yoshida_minomaru");
                        if (!app.deck.includes("yoshida_minomaru")) app.addCardToDeck("yoshida_minomaru");
                        app.markShishiSurvived("mochizuki_sacrifice");
                        if (!app.deck.includes("mochizuki_sacrifice")) app.addCardToDeck("mochizuki_sacrifice");
                        app.damagePlayer(38);
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】先陣を切って池田屋へ斬り込む",
                    effectDesc: "志士『近藤勇』を獲得。HP 38 ダメージを受けるが、ランダムなレリックを獲得。",
                    faction: "sabaku",
                    shishiBonus: [
                        {
                            character: "kondo",
                            desc: "虎徹の剛剣！被ダメージを19軽減し、次戦攻撃力+4！",
                            apply: (app) => {
                                app.healPlayer(19);
                                app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                            }
                        },
                        {
                            character: "hijikata",
                            desc: "副長の後詰！被ダメージを10軽減し、20両を獲得！",
                            apply: (app) => {
                                app.healPlayer(10);
                                app.gold += 20;
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("kondo_kotetsu");
                        app.damagePlayer(38);
                        app.obtainRandomRelic();
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】裏手を固め、逃走者を捕縛する",
                    effectDesc: "志士『沖田総司』を獲得。カードを1枚デッキから削除し、25両 を獲得。",
                    faction: "sabaku",
                    shishiBonus: {
                        character: "okita",
                        desc: "神速の三段突き！さらに追加で25両（計50両）と次戦攻撃力+3！",
                        apply: (app) => {
                            app.gold += 25;
                            app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("okita_sandan");
                        app.gold += 25;
                        app.openCardRemovalModal();
                    }
                },
                {
                    opinionChange: -12,
                    text: "【討幕派】池田屋の階下で抜刀し、新選組の刃を迎え撃ち味方を逃がす",
                    effectDesc: "新選組の刃を身に受けHP 26 ダメージを負うが、自らを盾として味方を逃がす。尊攘派壊滅の逆風の中、次戦攻撃力+4、軍資金30両を獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.damagePlayer(26);
                        app.gold += 30;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    requiredShishi: "katsura",
                    opinionChange: -8,
                    text: "【討幕派・桂小五郎】機転を利かせ裏路地から退避し、長州藩邸へ急報を届ける",
                    effectDesc: "桂小五郎の機転で無傷脱出！長州藩邸の防備を固め軍資金45両と次戦攻撃力+5を獲得するが、京都尊攘派の壊滅により世論は佐幕へ傾く。",
                    faction: "tobaku",
                    action: (app) => {
                        app.gold += 45;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                    }
                },
                {
                    requiredShishi: ["kondo", "hijikata"],
                    opinionChange: -18,
                    text: "【佐幕派・局長＆副長】完璧なる包囲と電撃突入により不逞浪士を壊滅",
                    effectDesc: "新選組の完全制圧！HP損害はわずか10。志士『近藤勇』と『沖田総司』を両名獲得し、神器レリックを獲得！",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("kondo_kotetsu");
                        app.addCardToDeck("okita_sandan");
                        app.damagePlayer(10);
                        app.obtainRandomRelic();
                    }
                }
            ]
        },
        {
            id: "event_glover",
            act: 1,
            importance: 2,
            title: "長崎グラバー商会の密談",
            desc: "英国商人トーマス・グラバーが新式の洋式火器を前に、妖しい微笑みを浮かべている。「貴国の未来のために、格安で最新の兵器を用立てましょう…ただし代償は条約で」",
            choices: [
                {
                    opinionChange: 8,
                    text: "莫大な借款契約を結び、最新火器を受け取る",
                    effectDesc: "志士『井上馨』を獲得。『新式ミニエ銃』と 30両 を獲得するが、【列強介入+12%】＆呪い『治外法権の受容』が混入！",
                    shishiBonus: {
                        character: "ryoma",
                        desc: "龍馬の巧みな交渉！呪い『治外法権の受容』を回避し、軍資金+20両！",
                        apply: (app) => {
                            const curseIdx = app.deck.indexOf('curse_extraterritoriality');
                            if (curseIdx !== -1) app.deck.splice(curseIdx, 1);
                            app.gold += 20;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("inoue_negotiation");
                        app.addCardToDeck("weapon_minie");
                        app.addCardToDeck("curse_extraterritoriality");
                        app.gold += 30;
                        app.modifyImperialGauge(12);
                        window.soundSystem.playWarning();
                    }
                },
                {
                    opinionChange: 0,
                    text: "手持ちの資金のみで通常購入する（60両）",
                    costGold: 60,
                    effectDesc: "60両を支払い、『新式ミニエ銃』を入手（列強介入なし）。",
                    shishiBonus: {
                        character: "inoue",
                        desc: "長州五傑の英知！購入費用を20両払い戻し（実質40両）！",
                        apply: (app) => {
                            app.gold += 20;
                        }
                    },
                    canChoose: (app) => app.gold >= 60,
                    action: (app) => {
                        app.gold -= 60;
                        app.addCardToDeck("weapon_minie");
                    }
                },
                {
                    opinionChange: 8,
                    text: "毅然と断り、主権を守る",
                    effectDesc: "志士『岩崎弥太郎』を獲得。【列強介入-4%】。気迫により最大HP+3。",
                    shishiBonus: {
                        character: "iwazaki",
                        desc: "弥太郎の商魂！貿易の隙を突き40両を獲得！",
                        apply: (app) => {
                            app.gold += 40;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("iwazaki_finance");
                        app.modifyImperialGauge(-4);
                        app.maxHp += 3;
                        app.hp += 4;
                    }
                },
                {
                    requiredShishi: "ryoma",
                    opinionChange: 10,
                    text: "【亀山社中】坂本龍馬の直談判により、最新兵器を特別買付する",
                    effectDesc: "グラバーとの信頼関係により列強介入なし！『舶来ガトリング砲』を獲得し、軍資金40両を得る。",
                    action: (app) => {
                        app.addCardToDeck("weapon_gatling");
                        app.gold += 40;
                    }
                }
            ]
        },
        {
            id: "event_teradaya",
            act: 2,
            importance: 3,
            title: "伏見・寺田屋の遭難",
            desc: "深夜、宿が幕府捕吏に包囲された！「上意討ちである！」襖を蹴破る足音が響く。",
            choices: [
                {
                    opinionChange: 12,
                    text: "【討幕派】隠し持った高杉晋作のピストルで応戦！",
                    effectDesc: "志士『坂本龍馬』を獲得。HP 38 ダメージを受けるが、敵を撃退しレリック『西洋懐中時計』を獲得。",
                    faction: "tobaku",
                    shishiBonus: [
                        {
                            character: "takasugi",
                            desc: "晋作の贈答ピストル！奇襲反撃により被ダメージを20軽減し、次戦攻撃力+4！",
                            apply: (app) => {
                                app.healPlayer(20);
                                app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("ryoma_kaiwentai");
                        app.damagePlayer(38);
                        app.obtainRelic("pocket_watch");
                    }
                },
                {
                    opinionChange: 12,
                    text: "お龍の機転に従い、裏庭から脱出する",
                    effectDesc: "志士『吉井友実』を獲得。HPを 8 回復し、30両を得る。",
                    shishiBonus: [
                        {
                            character: "yoshii",
                            desc: "吉井友実の薩摩藩邸引導！HP全快、さらに40両を追加獲得！",
                            apply: (app) => {
                                app.hp = app.maxHp;
                                app.gold += 40;
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.healPlayer(8);
                        app.gold += 30;
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】伏見奉行所の捕吏を指揮し、宿の包囲を固める",
                    effectDesc: "志士『佐々木只三郎』を獲得。金+30、HPを 8 回復する。",
                    faction: "sabaku",
                    shishiBonus: [
                        {
                            character: "sasaki",
                            desc: "京都見廻組の周到な包囲網！軍資金+50両、世論佐幕+8%！",
                            apply: (app) => {
                                app.gold += 50;
                                app.modifyPublicOpinion(-8);
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("sasaki_patrol");
                        app.gold += 30;
                        app.healPlayer(8);
                    }
                },
                {
                    opinionChange: 15,
                    requiredShishi: ["ryoma"],
                    text: "🌟【坂本龍馬 限定】薩摩藩邸への決死の脱出と盟友の救援",
                    effectDesc: "龍馬とお龍の機転により無傷で包囲網を突破！HPを30回復、軍資金50両とレリック『万国公法』を獲得！",
                    faction: "tobaku",
                    action: (app) => {
                        app.healPlayer(30);
                        app.gold += 50;
                        app.obtainRelic("international_law");
                    }
                }
            ]
        },
        {
            id: "event_taisei_hokan",
            act: 2,
            importance: 3,
            title: "大政奉還の歴史的評議",
            desc: "徳川慶喜が政権を朝廷に返上するか否か、天下を揺るがす建白書が突きつけられた。",
            mapShishiRequirement: {
                tobaku: ["ryoma", "goto"],
                sabaku: ["katsu"]
            },
            choices: [
                {
                    opinionChange: 12,
                    text: "内戦を避け、平和的政権移行を後押しする",
                    effectDesc: "志士『後藤象二郎』を獲得。【列強介入-5%】。全カードの最大HP+3＆完全回復。",
                    shishiBonus: [
                        {
                            character: "ryoma",
                            desc: "船中八策の精神！世論討幕+15%、最大HP+5＆完全回復！",
                            apply: (app) => {
                                app.modifyPublicOpinion(15);
                                app.maxHp += 5;
                                app.hp = app.maxHp;
                            }
                        },
                        {
                            character: "goto",
                            desc: "土佐藩の政治力！軍資金60両とレリック『朝廷の密勅書』を獲得！",
                            apply: (app) => {
                                app.gold += 60;
                                app.obtainRelic("imperial_decree");
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("goto_political_drive");
                        app.modifyImperialGauge(-5);
                        app.maxHp += 3;
                        app.hp = app.maxHp;
                    }
                },
                {
                    opinionChange: 12,
                    text: "旧勢力の完全排除を主張し、決戦を挑む",
                    effectDesc: "志士『岩倉具視』を獲得。デッキに『アームストロング砲』を追加。次の戦闘で攻撃力倍増。",
                    shishiBonus: [
                        {
                            character: "iwakura",
                            desc: "王政復古の大号令！次戦攻撃力+8、世論討幕+25%！",
                            apply: (app) => {
                                app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 8;
                                app.modifyPublicOpinion(25);
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("iwakura_imperial");
                        app.addCardToDeck("weapon_armstrong");
                        app.nextBattleStrengthBuff = 6;
                    }
                },
                {
                    opinionChange: 30,
                    requiredShishi: ["ryoma", "goto"],
                    text: "🌟【龍馬＆後藤象二郎 限定】『船中八策』に基づく無血の国家構想を建白",
                    effectDesc: "徳川慶喜公と直接対話。内戦の危機を完全に回避し、世論討幕+30%、列強介入-20%、軍資金100両を獲得しHP全快！",
                    faction: "tobaku",
                    action: (app) => {
                        app.modifyImperialGauge(-20);
                        app.gold += 100;
                        app.hp = app.maxHp;
                    }
                },
                {
                    opinionChange: -12,
                    faction: "sabaku",
                    text: "【佐幕派】徳川宗家を首班とする公議政体を模索し、幕府の実質的指導権を維持する",
                    effectDesc: "志士『勝海舟：無血の大局観』を獲得。列強介入-8%、軍資金 50両 を獲得する。",
                    shishiBonus: [
                        {
                            character: "katsu",
                            desc: "大局の知恵！世論佐幕-15%、HPを全快！",
                            apply: (app) => {
                                app.modifyPublicOpinion(-15);
                                app.hp = app.maxHp;
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("katsu_kaishu");
                        app.modifyImperialGauge(-8);
                        app.gold += 50;
                    }
                }
            ]
        },
        {
            id: "event_sakuradamon",
            act: 1,
            importance: 3,
            title: "桜田門外の変・雪中の襲撃",
            desc: "江戸城桜田門の外に、井伊直弼の駕籠を待ち伏せる人影がある。雪に紛れて刀を抜くか、騒乱を未然に止めるか。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["ii_naosuke"],
                    opinionChange: -10,
                    text: "【🕊️ 生存ルート】大老駕籠の前に身を投げ出して水戸浪士の白刃を払い、井伊直弼を城内へ退避させる",
                    effectDesc: "【生存ルート】志士『井伊直弼』を救出し歴史改変！HP 35 ダメージを受けるが、直弼は生存確定となり以降もデッキで使用可能！",
                    action: (app) => {
                        app.markShishiSurvived("ii_naosuke");
                        if (!app.deck.includes("ii_naosuke")) app.addCardToDeck("ii_naosuke");
                        app.damagePlayer(35);
                    }
                },
                {
                    opinionChange: 12,
                    text: "【討幕派】襲撃に加勢し、幕府の中枢を揺さぶる",
                    effectDesc: "志士『有馬新七』を獲得。HPを 38 失うが、列強介入-5%と 30両を得る。",
                    faction: "tobaku",
                    shishiBonus: [
                        {
                            character: "arima",
                            desc: "精忠組の烈気！被ダメージを20軽減し、次戦攻撃力+6！",
                            apply: (app) => {
                                app.healPlayer(20);
                                app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 6;
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("arima_revolt");
                        app.damagePlayer(38);
                        app.modifyImperialGauge(-5);
                        app.gold += 30;
                    }
                },

                {
                    opinionChange: 12,
                    text: "現場を離れ、噂だけを持ち帰る",
                    effectDesc: "志士『田中光顕』を獲得。25両を得る。",
                    shishiBonus: [
                        {
                            character: "tanaka",
                            desc: "土佐密偵の情勢分析！軍資金+40両、列強介入-10%！",
                            apply: (app) => {
                                app.gold += 40;
                                app.modifyImperialGauge(-10);
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("tanaka_intelligence");
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: -25,
                    requiredShishi: ["ii_naosuke"],
                    text: "🌟【井伊直弼 限定】大老自ら先導し、彦根藩邸への電撃退却を敢行",
                    effectDesc: "襲撃の機先を制して難を逃れ、幕府の威令を天下に誇示！世論佐幕-25%、HP完全回復、軍資金60両獲得！",
                    faction: "sabaku",
                    action: (app) => {
                        app.hp = app.maxHp;
                        app.gold += 60;
                    }
                }
            ]
        },
        {
            id: "event_satcho_alliance",
            act: 2,
            importance: 3,
            historicalAdvantage: "tobaku",
            title: "薩長同盟の密約",
            desc: "犬猿の仲だった薩摩と長州が、坂本龍馬の仲介で一つの卓を囲んだ。互いの誇りを捨て、来るべき時代に備える必要がある。",
            mapShishiRequirement: {
                tobaku: ["ryoma", "saigo", "katsura"],
                sabaku: ["kondo", "hijikata"]
            },
            choices: [
                {
                    opinionChange: 12,
                    text: "【討幕派】密約に署名し、共同戦線を組む",
                    effectDesc: "志士『中岡慎太郎』を獲得。『薩長同盟の密約』をデッキに加え、次の戦闘の攻撃力+4。",
                    faction: "tobaku",
                    isHistorical: true,
                    riskCategory: "orthodox",
                    shishiBonus: [
                        {
                            character: "ryoma",
                            desc: "龍馬の仲介力！次戦攻撃力+8、世論討幕+15%、追加軍資金50両！",
                            apply: (app) => {
                                app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 8;
                                app.modifyPublicOpinion(15);
                                app.gold += 50;
                            }
                        },
                        {
                            character: "nakaoka",
                            desc: "陸援隊の結束！次戦シールド+15、列強介入-10%！",
                            apply: (app) => {
                                app.nextBattleShieldBuff = (app.nextBattleShieldBuff || 0) + 15;
                                app.modifyImperialGauge(-10);
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("nakaoka_mediator");
                        app.addCardToDeck("satcho_secret");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: 12,
                    text: "片方に肩入れし、資金を引き出す",
                    effectDesc: "志士『小松帯刀』を獲得。30両を得るが、列強介入+20%。",
                    riskCategory: "intrigue",
                    shishiBonus: [
                        {
                            character: "komatsu",
                            desc: "薩摩家老の財政手腕！列強介入悪化を帳消しにし、軍資金+80両！",
                            apply: (app) => {
                                app.modifyImperialGauge(-20);
                                app.gold += 80;
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("komatsu_coordination");
                        app.gold += 30;
                        app.modifyImperialGauge(20);
                    }
                },
                {
                    opinionChange: 12,
                    text: "【討幕派】同盟を急がず、互いの力を見極める",
                    effectDesc: "志士『桂小五郎』を獲得。HPを 8 回復し、列強介入-5%。",
                    faction: "tobaku",
                    isHistorical: true,
                    riskCategory: "safe",
                    shishiBonus: [
                        {
                            character: "katsura",
                            desc: "桂小五郎の先見性！HPを25回復、列強介入-15%！",
                            apply: (app) => {
                                app.healPlayer(25);
                                app.modifyImperialGauge(-10);
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("katsura_shindo");
                        app.healPlayer(8);
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    opinionChange: 20,
                    text: "【佐幕派・歴史の抗い】長州の孤立を狙い、桂小五郎へ密使を送り切り崩しを図る",
                    effectDesc: "志士『桂小五郎』を獲得。しかし密議発覚の激震によりHP 32喪失、最大HP-6。世論討幕+20%（大逆風）、呪い『過激派の暴発』が混入！",
                    faction: "sabaku",
                    isHistorical: false,
                    riskCategory: "defiance",
                    action: (app) => {
                        app.addCardToDeck("katsura_shindo");
                        app.addCardToDeck("curse_riot");
                        app.damagePlayer(32);
                        app.maxHp = Math.max(20, app.maxHp - 6);
                    }
                },
                {
                    opinionChange: 40,
                    requiredShishi: ["ryoma", "saigo", "katsura"],
                    text: "🌟【龍馬・西郷・小五郎 揃踏限定】薩長同盟の完全締結と倒幕軍事同盟の結成",
                    effectDesc: "討幕の二大巨頭と盟主が完全合意！世論討幕+40%、軍資金100両、次戦攻撃力+10、神器レリック『薩長盟約の錦旗』を獲得！",
                    faction: "tobaku",
                    isHistorical: true,
                    riskCategory: "orthodox",
                    action: (app) => {
                        app.gold += 100;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 10;
                        app.obtainRelic("satcho_brocade_flag");
                    }
                }
            ]
        },
        {
            id: "event_toba_fushimi",
            act: 3,
            importance: 3,
            title: "鳥羽・伏見の決戦、錦旗の翻転",
            desc: "淀川沿いに錦の御旗が高らかに翻り、砲煙弾雨の中、天下の大勢が一夜にして暗転する。幕府軍1万5千と薩長軍5千の激突、どちらの道を歩むか。",
            mapShishiRequirement: {
                tobaku: ["saigo", "yamada", "iwakura"],
                sabaku: ["hijikata", "kondo", "sadaakira"]
            },
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["sasaki_patrol"],
                    opinionChange: -8,
                    text: "【🕊️ 生存ルート】樟葉の激戦で官軍の銃火に晒された佐々木只三郎を盾となって護衛し後方へ後送する",
                    effectDesc: "【生存ルート】志士『佐々木只三郎』を救出！HP 35 ダメージを受けるが、佐々木は生存確定となり以降もデッキで使用可能！",
                    action: (app) => {
                        app.markShishiSurvived("sasaki_patrol");
                        if (!app.deck.includes("sasaki_patrol")) app.addCardToDeck("sasaki_patrol");
                        app.damagePlayer(35);
                    }
                },
                {
                    opinionChange: 14,
                    text: "【討幕派】錦旗を先頭に官軍怒涛の追撃戦を敢行し、旧幕府軍を壊滅させる",
                    effectDesc: "志士『岩倉具視』と志士『山田顕義』を獲得。決死の銃撃戦でHPを 35 失い、最大HP-12。絶対的大義名分により世論が一気に討幕極限（+50%）へ到達、小判35両を獲得！",
                    faction: "tobaku",
                    shishiBonus: [
                        {
                            character: "saigo",
                            desc: "薩摩軍総指揮！被ダメージを25軽減し、最大HP減少を無効化！",
                            apply: (app) => {
                                app.healPlayer(25);
                                app.maxHp += 12;
                                app.hp += 12;
                            }
                        },
                        {
                            character: "yamada",
                            desc: "近代兵術の用兵！次戦攻撃力+8、軍資金+50両！",
                            apply: (app) => {
                                app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 8;
                                app.gold += 50;
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("iwakura_imperial");
                        app.addCardToDeck("yamada_modern_army");
                        app.maxHp = Math.max(20, app.maxHp - 12);
                        app.damagePlayer(45);
                        app.gold += 35;
                    }
                },
                {
                    opinionChange: 50,
                    text: "【佐幕派】淀千両松で殿軍を死守し、将軍慶喜公の脱出行を警護する",
                    effectDesc: "志士『松平定敬』を獲得。朝敵転落の激震で世論が討幕へ急転（大逆風）、追撃でHPを 32 失い、最大HP-10。徳川の信義を貫いた証として神器レリック『葵の御紋章佩刀』を獲得！",
                    faction: "sabaku",
                    shishiBonus: [
                        {
                            character: "hijikata",
                            desc: "新選組の殿軍奮戦！被ダメージを20軽減、次戦防御力+15！",
                            apply: (app) => {
                                app.healPlayer(20);
                                app.nextBattleShieldBuff = (app.nextBattleShieldBuff || 0) + 15;
                            }
                        },
                        {
                            character: "kondo",
                            desc: "局長の胆力！最大HP減少を相殺し、HP 20回復！",
                            apply: (app) => {
                                app.maxHp += 10;
                                app.healPlayer(20);
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("sadaakira_guard");
                        app.obtainRelic("aoi_crest_blade");
                        app.maxHp = Math.max(20, app.maxHp - 10);
                        app.damagePlayer(42);
                    }
                },
                {
                    opinionChange: 0,
                    text: "【共通】戦禍の負傷兵を敵味方なく救護し、近代人道支援の魁となる",
                    effectDesc: "軍備を放擲して救護に奔走するため軍資金70両を拠出、HPを 42 失う。人道の徳望により最大HP+3、HP全回復、列強介入-5%。",
                    action: (app) => {
                        app.gold = Math.max(0, app.gold - 70);
                        app.damagePlayer(42);
                        app.maxHp += 3;
                        app.hp = app.maxHp;
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    opinionChange: 50,
                    requiredShishi: ["saigo", "okubo"],
                    text: "🌟【西郷隆盛＆大久保利通 限定】錦旗の掲揚と電撃包囲作戦",
                    effectDesc: "一分の隙もない用兵により損害皆無で敵軍を圧倒！HPダメージ・最大HP減少なし、世論討幕+50%、軍資金80両獲得！",
                    faction: "tobaku",
                    action: (app) => {
                        app.gold += 80;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 6;
                    }
                },
                {
                    opinionChange: -30,
                    requiredShishi: ["kondo", "hijikata"],
                    text: "🌟【近藤勇＆土方歳三 限定】新選組死守！淀千両松の逆撃夜襲",
                    effectDesc: "新選組が死力を尽くして薩長追撃隊を撃退！損害を半減（HPダメージ16）、世論佐幕-30%、神器レリック『誠の羽織』を獲得！",
                    faction: "sabaku",
                    action: (app) => {
                        app.obtainRelic("makoto_haori");
                        app.damagePlayer(16);
                        app.gold += 50;
                    }
                }
            ]
        },
        {
            id: "event_goryokaku",
            act: 3,
            importance: 3,
            title: "五稜郭、北辺の決断",
            desc: "北の大地に築かれた星形要塞へ、最後の兵たちが集う。新政府への降伏か、異国との交易を見据えた独立か。",
            choices: [
                {
                    opinionChange: -12,
                    faction: "sabaku",
                    text: "要塞に籠もり、最後まで抗戦する",
                    effectDesc: "志士『榎本武揚』を獲得。HPを 38 失うが、最大HP+3と次の戦闘の攻撃力+4。",
                    action: (app) => {
                        app.addCardToDeck("enomoto_naval");
                        app.damagePlayer(38);
                        app.maxHp += 3;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: -12,
                    text: "新時代を受け入れ、武器を手放す",
                    effectDesc: "志士『大鳥圭介』を獲得。列強介入-5%、HPを 8 回復。",
                    action: (app) => {
                        app.addCardToDeck("otori_strategy");
                        app.modifyImperialGauge(-5);
                        app.hp = app.maxHp;
                    }
                },
                {
                    opinionChange: -12,
                    text: "異国商人と交渉し、交易路を開く",
                    effectDesc: "志士『島田魁』を獲得。35両を得るが、列強介入+20%。",
                    action: (app) => {
                        app.addCardToDeck("shimada_kai");
                        app.gold += 35;
                        app.modifyImperialGauge(20);
                    }
                },
                {
                    opinionChange: 12,
                    faction: "tobaku",
                    text: "【討幕派】黒田清隆の全軍統括に従い、降伏勧告を行い戊辰戦争を完全終結させる",
                    effectDesc: "志士『黒田了介：北辺の開拓』を獲得。HPを 12 回復し、軍資金 50両 を獲得する。",
                    action: (app) => {
                        app.addCardToDeck("kuroda_frontier");
                        app.gold += 50;
                        app.healPlayer(12);
                    }
                }
            ]
        },
        {
            id: "event_shimonoseki",
            act: 1,
            importance: 2,
            title: "下関海峡、攘夷の砲火",
            desc: "海峡を封鎖した長州の砲台に、四国連合艦隊が迫る。異国船を撃つか、いったん砲を下ろして国力を蓄えるか。",
            choices: [
                {
                    opinionChange: 8,
                    text: "砲台を死守し、攘夷の意地を示す",
                    effectDesc: "志士『高杉晋作』を獲得。四国連合艦隊の猛砲撃に晒されHPを 30 失い、最大HP-5。次戦の攻撃力+3。",
                    action: (app) => {
                        app.addCardToDeck("takasugi_kiheitai");
                        app.maxHp = Math.max(20, app.maxHp - 5);
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: 8,
                    text: "洋式兵器を受け入れ、砲術を学ぶ",
                    effectDesc: "志士『井上馨』を獲得。『舶来ガトリング砲』を得るが、列強介入+12%。",
                    action: (app) => {
                        app.addCardToDeck("inoue_negotiation");
                        app.addCardToDeck("weapon_gatling");
                        app.modifyImperialGauge(12);
                    }
                },
                {
                    opinionChange: 8,
                    text: "停戦を申し入れ、民の被害を抑える",
                    effectDesc: "志士『赤禰武人』を獲得。列強介入-4%、HPを 6 回復する。",
                    action: (app) => {
                        app.addCardToDeck("akane_negotiation");
                        app.modifyImperialGauge(-4);
                        app.healPlayer(6);
                    }
                }
            ]
        },
        {
            id: "event_satsuma_decision",
            act: 2,
            importance: 3,
            title: "薩摩藩、討幕への転回",
            desc: "朝廷からの密使が薩摩藩邸を訪れた。幕府と手を結ぶか、長州と共に新たな政を目指すか、藩の未来を決める夜だ。",
            choices: [
                {
                    opinionChange: 12,
                    text: "長州と和解し、討幕の旗を掲げる",
                    effectDesc: "志士『小松帯刀』を獲得。『桂小五郎：神道無念流』をデッキに加え、30両を得る。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("komatsu_coordination");
                        app.addCardToDeck("katsura_shindo");
                        app.gold += 30;
                    }
                },
                {
                    opinionChange: -12,
                    text: "幕府との関係を保ち、情勢を見極める",
                    effectDesc: "志士『吉井友実』を獲得。最大HP+3、列強介入-5%。",
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.maxHp += 3;
                        app.hp += 5;
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    opinionChange: 0,
                    text: "どちらにも与せず、兵糧を確保する",
                    effectDesc: "志士『伊地知正治』を獲得。35両を得るが、HPを 38 失う。",
                    action: (app) => {
                        app.addCardToDeck("ijichi_command");
                        app.gold += 35;
                        app.damagePlayer(38);
                    }
                }
            ]
        },
        {
            id: "event_katsu_saigo",
            act: 2,
            importance: 3,
            title: "江戸城無血開城の談判",
            desc: "勝海舟と西郷隆盛が向かい合い、江戸の町を戦火から救う最後の話し合いが始まった。誇りと人命、そのどちらを優先するか。",
            choices: [
                {
                    opinionChange: 12,
                    text: "恭順を受け入れ、江戸を救う",
                    effectDesc: "志士『西郷隆盛』を獲得。HPを 8 回復し、列強介入-5%。",
                    action: (app) => {
                        app.addCardToDeck("saigo_jigen");
                        app.hp = app.maxHp;
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    opinionChange: 12,
                    text: "【討幕派】勝海舟の大局観を受け入れ、新日本の海防を託す",
                    faction: "tobaku",
                    effectDesc: "志士『山岡鉄舟』を獲得。『勝海舟：無血の大局観』をデッキに加え、列強介入-5%、HPを 8 回復する。",
                    action: (app) => {
                        app.addCardToDeck("yamaoka_surrender");
                        app.addCardToDeck("katsu_kaishu");
                        app.hp = app.maxHp;
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    opinionChange: -12,
                    text: "一戦を交え、武士の意地を通す",
                    effectDesc: "志士『高橋泥舟』を獲得。次の戦闘の攻撃力+4、HPを 38 失う。",
                    action: (app) => {
                        app.addCardToDeck("takahashi_guard");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                        app.damagePlayer(38);
                    }
                },
                {
                    opinionChange: 0,
                    text: "町人の声を聞き、物資を分け与える",
                    effectDesc: "30両を支払い、最大HP+3。資金が足りない場合は選択不可。",
                    costGold: 30,
                    canChoose: (app) => app.gold >= 30,
                    action: (app) => {
                        app.gold -= 30;
                        app.maxHp += 3;
                        app.hp += 10;
                    }
                }
            ]
        },
        {
            id: "event_hakodate_assault",
            act: 3,
            importance: 3,
            title: "箱館総攻撃、最後の朝",
            desc: "海からの艦砲射撃が五稜郭を揺らす。残された兵力を一気に燃やすか、守りを固めて一日でも長く持ちこたえるか。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["iba_duel"],
                    opinionChange: -8,
                    text: "【🕊️ 生存ルート】服毒自刃を図る伊庭八郎の手から薬を奪い、榎本武揚と共に新時代への生き延びを説得する",
                    effectDesc: "【生存ルート】志士『伊庭八郎』を救出！HP 28 ダメージを受けるが、伊庭は生存確定となり以降もデッキで使用可能！",
                    action: (app) => {
                        app.markShishiSurvived("iba_duel");
                        if (!app.deck.includes("iba_duel")) app.addCardToDeck("iba_duel");
                        app.damagePlayer(28);
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】榎本武揚と共に五稜郭の全砲門を開き、最後の決戦に挑む",
                    effectDesc: "志士『榎本武揚』を獲得。HPを 38 失うが、次回戦闘の攻撃力+4。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("enomoto_naval");
                        app.damagePlayer(38);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },

                {
                    opinionChange: 12,
                    text: "【討幕派】陸海軍協同作戦を展開し、箱館要塞の各所を一斉攻略する",
                    effectDesc: "志士『山田顕義』を獲得。HPを 38 失うが、次回戦闘の攻撃力+4。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("yamada_modern_army");
                        app.damagePlayer(38);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: 12,
                    text: "残された兵員の生命を救うため、降伏勧告の使者を立てる",
                    effectDesc: "志士『黒田清隆』を獲得。HPを 8 回復し、列強介入-5%。",
                    action: (app) => {
                        app.addCardToDeck("kuroda_frontier");
                        app.healPlayer(8);
                        app.modifyImperialGauge(-5);
                    }
                }
            ]
        },
        {
            id: "event_yokohama_opening",
            act: 1,
            importance: 1,
            title: "横浜開港、異国船の波止場",
            desc: "開港場に異国の商人と新しい品々が集まり始めた。富と知識を取り込む好機だが、町には見慣れぬ病と不安も広がっている。",
            choices: [
                {
                    opinionChange: -5,
                    text: "【佐幕派】幕府主導で交易を奨励し、国の富を増やす",
                    effectDesc: "志士『小栗忠順』を獲得。25両を得るが、列強介入+7%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("oguri_reform");
                        app.gold += 25;
                        app.modifyImperialGauge(7);
                    }
                },
                {
                    opinionChange: 5,
                    text: "【討幕派】薩長合同の貿易拠点を築き、軍備の資金を稼ぐ",
                    effectDesc: "志士『井上馨』を獲得。25両を得るが、列強介入+7%。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("inoue_negotiation");
                        app.gold += 25;
                        app.modifyImperialGauge(7);
                    }
                },
                {
                    opinionChange: -5,
                    text: "洋学所を開き、知識を取り入れる",
                    effectDesc: "志士『山本覚馬』を獲得。『新式ミニエ銃』をデッキに加え、列強介入+7%。",
                    action: (app) => {
                        app.addCardToDeck("yamamoto_research");
                        app.addCardToDeck("weapon_minie");
                        app.modifyImperialGauge(7);
                    }
                },
                {
                    opinionChange: -5,
                    text: "【佐幕派】外国奉行の権限を強め、横浜の町と港の検疫・警護を徹底する",
                    effectDesc: "志士『水野忠徳』を獲得。HPを 4 回復し、最大HP+2。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("mizuno_magistrate");
                        app.healPlayer(4);
                        app.maxHp += 2;
                    }
                },
                {
                    opinionChange: 5,
                    text: "【討幕派】町名主と結び、港の治安と衛生を守る",
                    effectDesc: "志士『佐々木高行』を獲得。HPを 4 回復し、最大HP+2。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("sasaki_governance");
                        app.healPlayer(4);
                        app.maxHp += 2;
                    }
                }
            ]
        },
        {
            id: "event_kiheitai_formation",
            act: 1,
            importance: 2,
            title: "奇兵隊、身分を越えた軍勢",
            desc: "農民や町人までが銃を手に取り、身分に縛られない新たな隊が結成されようとしている。古い秩序を守るか、力を借りるか。",
            choices: [
                {
                    opinionChange: 8,
                    text: "【討幕派】志願兵を受け入れ、隊を大きくする",
                    effectDesc: "『高杉晋作：奇兵隊の突進』をデッキに加えるが、HPを 26 失う。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("takasugi_kiheitai");
                        app.damagePlayer(26);
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】訓練を優先し、少数精鋭を目指す",
                    effectDesc: "志士『吉田稔麿』を獲得。次の戦闘の攻撃力+3、最大HP+3。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("yoshida_minomaru");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.maxHp += 3;
                        app.hp += 4;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】幕府歩兵隊の教練を強化し、新式調練を取り入れる",
                    effectDesc: "志士『大鳥圭介』を獲得。次の戦闘の攻撃力+3、列強介入-4%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("otori_strategy");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.modifyImperialGauge(-4);
                    }
                },
                {
                    opinionChange: 8,
                    text: "旧来の兵制を維持する",
                    effectDesc: "志士『大村益次郎』を獲得。列強介入-4%、25両を得る。",
                    action: (app) => {
                        app.addCardToDeck("omura_reform");
                        app.modifyImperialGauge(-4);
                        app.gold += 25;
                    }
                }
            ]
        },
        {
            id: "event_shimoda_putiatin_treaty",
            act: 1,
            importance: 2,
            title: "日露通好条約、プチャーチンと川路聖謨の至誠",
            desc: "嘉永七年、下田長楽寺。安政東海地震の津波でロシア軍艦ディアナ号が難破する中、勘定奉行・川路聖謨らは人道的な救助活動を指揮。至誠をもってロシア提督プチャーチンと折衝し、国境画定と開港を定めた『日露通好条約』に調印した。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【佐幕派】川路聖謨の至誠の外交に随行し、北方警備と国境の談判を完遂する",
                    effectDesc: "志士『川路聖謨：至誠の勘定』を獲得。列強介入 -5%、防 12 獲得。",
                    faction: "sabaku",
                    shishiBonus: {
                        character: "kawaji",
                        desc: "至誠の外交！列強介入をさらに 4% 鎮静化！",
                        apply: (app) => {
                            app.modifyImperialGauge(-4);
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("kawaji_toshiakira");
                        app.modifyImperialGauge(-5);
                        app.healPlayer(6);
                    }
                },
                {
                    opinionChange: -5,
                    text: "【佐幕派】難破したロシア水兵のために戸田村で洋式帆船『ヘダ号』の建造を支援する",
                    effectDesc: "志士『水野忠徳』を獲得。軍資金 25両 獲得、列強介入 -3%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("mizuno_magistrate");
                        app.gold += 25;
                        app.modifyImperialGauge(-3);
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】露艦遭難の報を受け、北方警備と海防の機密情報を密かに収集する",
                    effectDesc: "志士『佐久間象山』を獲得。次戦攻撃力 +4、軍資金 20両 獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("sakuma_gunnery");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                        app.gold += 20;
                    }
                }
            ]
        },
        {
            id: "event_fujita_toko_anzai",
            act: 1,
            importance: 2,
            title: "回天詩史、藤田東湖と尊皇攘夷の熱気",
            desc: "ペリー来航に揺れる水戸藩邸。徳川斉昭の腹心・藤田東湖が著した『正気歌』『回天詩史』は天下の尊皇攘夷志士たちを激しく鼓舞し、吉田松陰や西郷隆盛をはじめ幕末の志士たちの精神的指針となっていた。",
            choices: [
                {
                    opinionChange: 8,
                    text: "【討幕派】東湖の書斎に参じ、尊皇攘夷の大義と回天の気概を胸に刻む",
                    effectDesc: "志士『藤田東湖：回天の気概』を獲得。全軍士気が奮い立ち次回攻撃力 +5、世論討幕 8%。",
                    faction: "tobaku",
                    shishiBonus: {
                        character: "toko",
                        desc: "回天の気概！次戦開始時に味方攻撃力+4！",
                        apply: (app) => {
                            app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("fujita_toko");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】水戸学の教えを同志たちへ伝え、破約攘夷の連判を広げる",
                    effectDesc: "志士『武田耕雲斎』を獲得。手札上限 +1、軍資金 20両 獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("takeda_kounsai");
                        app.gold += 20;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】水戸激派の過激化を警戒し、老中首座・阿部正弘の調停策を支える",
                    effectDesc: "志士『阿部正弘』を獲得。防 12、列強介入 -4%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("abe_defense");
                        app.modifyImperialGauge(-4);
                        app.healPlayer(8);
                    }
                }
            ]
        },
        {
            id: "event_boicho_treaty",
            act: 1,
            importance: 1,
            title: "日蘭追加条約、長崎出島の通商改革",
            desc: "安政四年十二月、長崎。幕府はオランダと日蘭追加条約を結び、二百余年続いた出島における貿易独占の撤廃と貿易自由化への一歩を踏み出した。近代造船技術や医学の導入が一層加速する。",
            choices: [
                {
                    opinionChange: -5,
                    text: "【佐幕派】オランダ通詞らと交渉し、最新式の海軍造船書と近代兵器を輸入する",
                    effectDesc: "志士『木村芥舟』を獲得。兵器『新式ミニエ銃』を獲得、列強介入 -2%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("kimura_navy");
                        app.addCardToDeck("weapon_minie");
                        app.modifyImperialGauge(-2);
                    }
                },
                {
                    opinionChange: 5,
                    text: "【討幕派】出島を通じて西洋の近代医学と化学知識を取り入れ、洋式製薬を行う",
                    effectDesc: "『和漢名薬・萬金丹』を獲得。HP を 20 回復し、軍資金 30両 獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("item_mankintan");
                        app.healPlayer(20);
                        app.gold += 30;
                    }
                },
                {
                    opinionChange: 0,
                    text: "長崎会所の財政改革を推進し、貿易利潤を蓄財する",
                    effectDesc: "軍資金 50両 獲得、HP を 6 回復。",
                    action: (app) => {
                        app.gold += 50;
                        app.healPlayer(6);
                    }
                }
            ]
        },
        {
            id: "event_sanai_hitotsubashi_plot",
            act: 1,
            importance: 3,
            title: "将軍継嗣問題、橋本左内と一橋派の密謀",
            desc: "安政四年から五年、十三代将軍家定の病状悪化に伴い、英邁な一橋慶喜を推す「一橋派」と紀州慶福を推す「南紀派」が激突。福井藩士・橋本左内は西郷隆盛らと結び、朝廷と幕府を巻き込んだ一大擁立工作に奔走する。",
            choices: [
                {
                    opinionChange: 10,
                    text: "【討幕派】左内と共に京・江戸を往復し、開明君主・慶喜擁立の密勅工作を進める",
                    effectDesc: "志士『橋本左内：啓発の先見』を獲得。カードを2枚引く、軍資金 25両 獲得。",
                    faction: "tobaku",
                    shishiBonus: {
                        character: "sanai",
                        desc: "啓発の先見！次戦の手札上限+1、初期ドロー+1！",
                        apply: (app) => {
                            app.drawCardsBonus = (app.drawCardsBonus || 0) + 1;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("hashimoto_sanai");
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】薩摩藩の西郷隆盛と提携し、京都の近衛家・公卿勢力への働きかけを強める",
                    effectDesc: "志士『西郷隆盛』を獲得。次回攻撃力 +5、HP 8 回復。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("saigo_jigen");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                        app.healPlayer(8);
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】大老・井伊直弼の断行を支持し、血統重視の南紀派（徳川慶福）で幕府の統制を固める",
                    effectDesc: "志士『井伊直弼』を獲得。防 15、軍資金 40両 獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("ii_naosuke");
                        app.gold += 40;
                        app.healPlayer(10);
                    }
                }
            ]
        },
        {
            id: "event_boshin_chokuji_edo",
            act: 1,
            importance: 3,
            title: "戊午の密勅、水戸藩への直接降下と幕府震撼",
            desc: "安政五年八月、孝明天皇は幕府の無勅許調印に激怒し、幕府を飛び越えて水戸藩へ直接『戊午の密勅』を下した。幕藩体制の根幹を揺るがす前代未聞の事態に、大老・井伊直弼は激怒し、安政の大獄の引き金が引かれる。",
            choices: [
                {
                    opinionChange: 12,
                    text: "【討幕派】密勅の趣旨を諸藩に伝達し、尊皇攘夷の全国的蜂起の機運を醸成する",
                    effectDesc: "志士『武田耕雲斎』を獲得。世論討幕 12%、全軍攻撃力 +4。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("takeda_kounsai");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: 10,
                    text: "【討幕派】長州の松下村塾へ密勅の写しを送り、吉田松陰らと今後の行動を協議する",
                    effectDesc: "志士『吉田松陰』を獲得。手札上限 +1、軍資金 20両 獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("yoshida_teaching");
                        app.gold += 20;
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】幕府の威信を守るため、密勅の返納を水戸藩に強く要求し統制を強化する",
                    effectDesc: "志士『松平春嶽』を獲得。防 16、軍資金 35両 獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("shungaku_council");
                        app.gold += 35;
                        app.healPlayer(8);
                    }
                }
            ]
        },
        {
            id: "event_nariakira_death",
            act: 1,
            importance: 3,
            year: 1858,
            month: 8,
            title: "島津斉彬の急死、薩摩の暗雲",
            desc: "安政五年七月十六日、薩摩藩主・島津斉彬は幕府への異議と朝廷守護のため、五千の兵を率いての上洛を決断。鹿児島天保山にて大規模な軍事演習を実施中、突如として激しい発熱と下痢に見舞われ倒れる。西洋近代化の先駆者として維新回天を目前にした英主の命の灯火が、今まさに消えようとしていた。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["shimazu_nariakira"],
                    opinionChange: 10,
                    costGold: 40,
                    text: "【🕊️ 生存ルート】長崎・蘭方医を緊急招聘し、集成館の最新西洋解熱新薬を投与して決死の救命処置を行う",
                    effectDesc: "【生存ルート】志士『島津斉彬』の急病を克服させ生存確定！軍資金 40両 とHP 20 を消費（不足分HP消費）し、斉彬は生存しデッキに残留！",
                    action: (app) => {
                        app.markShishiSurvived("shimazu_nariakira");
                        if (!app.deck.includes("shimazu_nariakira")) app.addCardToDeck("shimazu_nariakira");
                        const spendGold = Math.min(app.gold, 40);
                        const shortage = 40 - spendGold;
                        app.gold -= spendGold;
                        app.damagePlayer(20 + shortage);
                    }
                },
                {
                    opinionChange: 12,
                    text: "【討幕派】斉彬の遺志を胸に刻み、西郷吉之助（隆盛）とともに上洛・討幕の志を受け継ぐ",
                    effectDesc: "志士『西郷隆盛』を獲得。全軍の攻撃力+4。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("saigo_jigen");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】集成館事業の産業遺産と近代化技術を守り抜き、後事を託される",
                    effectDesc: "軍資金 40両 を獲得し、最大HP+3。",
                    faction: "tobaku",
                    action: (app) => {
                        app.gold += 40;
                        app.maxHp += 3;
                        app.healPlayer(3);
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】薩摩の兵力上洛計画が頓挫したことを察知し、幕府の秩序維持に動く",
                    effectDesc: "軍資金 30両 を獲得し、シールド 15 を得る。",
                    faction: "sabaku",
                    action: (app) => {
                        app.gold += 30;
                        app.playerShield = (app.playerShield || 0) + 15;
                    }
                },
                {
                    opinionChange: 0,
                    text: "早すぎる英主の死を悼み、静かに手を合わせる",
                    effectDesc: "精神を整え、HPを 15 回復する。",
                    action: (app) => {
                        app.healPlayer(15);
                    }
                }
            ]
        },
        {
            id: "event_kurofune_kanrinmaru_voyage",
            act: 1,
            importance: 2,
            title: "咸臨丸の快挙、勝海舟と福沢諭吉の太平洋横断",
            desc: "万延元年正月、日米修好通商条約批准使節の護衛艦として、幕府軍艦『咸臨丸』が浦賀を出港。勝海舟を艦長格とし、ジョン万次郎や福沢諭吉らが乗艦。日本人初の手による太平洋横断を見事に成し遂げサンフランシスコへ到達した。",
            choices: [
                {
                    opinionChange: -5,
                    text: "【佐幕派】咸臨丸の航行を完遂し、サンフランシスコで最新の航海測量技術を習得する",
                    effectDesc: "志士『ジョン万次郎』を獲得。列強介入 -5%、軍資金 35両 獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("john_manjiro");
                        app.modifyImperialGauge(-5);
                        app.gold += 35;
                    }
                },
                {
                    opinionChange: -5,
                    text: "【佐幕派】勝海舟と共に米国の民主制度や造船所を視察し、大局の海防論を確立する",
                    effectDesc: "志士『勝海舟』を獲得。防 12、手札を2枚引く。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("katsu_kaishu");
                        app.healPlayer(8);
                    }
                },
                {
                    opinionChange: 5,
                    text: "【討幕派】使節団から持ち帰られた世界地理・憲政制度の書物を極秘に入手して学ぶ",
                    effectDesc: "志士『大隈重信』を獲得。軍資金 25両 獲得、文 1 獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("okuma_modernization");
                        app.gold += 25;
                    }
                }
            ]
        },
        {
            id: "event_tosa_kinnoto_formation",
            act: 1,
            importance: 2,
            title: "土佐勤王党結成、武市半平太と盟約の血判",
            desc: "文久元年八月、江戸築地土佐藩邸。武市半平太は坂本龍馬、吉村寅太郎、中岡慎太郎ら同志と血判の盟約を結び『土佐勤王党』を結成。一領具足の郷士身分から立ち上がり、一挙に二百名近い一大尊攘勢力へと急成長を遂げる。",
            choices: [
                {
                    opinionChange: 10,
                    text: "【討幕派】血判盟約に署名し、武市半平太と共に土佐藩論の尊皇攘夷化を誓い合う",
                    effectDesc: "志士『武市半平太：勤王の刃』を獲得。世論討幕 10%、次戦攻撃力 +5。",
                    faction: "tobaku",
                    shishiBonus: {
                        character: "takechi",
                        desc: "勤王の誓い！次戦攻撃力+4、列強介入-3%！",
                        apply: (app) => {
                            app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                            app.modifyImperialGauge(-3);
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("takechi_ideology");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】岡田以蔵ら腕利き志士を率いて京洛へ潜入し、天誅の刃で尊攘派の足場を固める",
                    effectDesc: "志士『岡田以蔵』を獲得。敵に 15 ダメージを与える準備を整える。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("okada_izo");
                        app.gold += 20;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】土佐藩主・山内容堂の公武合体路線を支持し、過激な郷士派閥を牽制する",
                    effectDesc: "志士『山内容堂』を獲得。防 14、軍資金 30両 獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("yodo_political_balance");
                        app.gold += 30;
                    }
                }
            ]
        },
        {
            id: "event_azabu_heuskens_assassination",
            act: 1,
            importance: 1,
            title: "ヒュースケン暗殺、赤羽橋の襲撃",
            desc: "万延元年十二月、江戸麻布。米国公使館通訳ヒュースケンがプロイセン宿舎からの帰途、赤羽橋付近で薩摩尊攘派浪士らの襲撃を受け落命。各国公使館が横浜へ退去するなど、幕府の治安管理と外交関係に深刻な危機が訪れる。",
            choices: [
                {
                    opinionChange: 8,
                    text: "【討幕派】攘夷の決行として襲撃を支援し、異国勢力の江戸駐留を動揺させる",
                    effectDesc: "志士『平野国臣』を獲得。列強介入 +10% だが、世論討幕 8%上昇。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("hirano_kuniomi");
                        app.modifyImperialGauge(10);
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】公使館警備を直ちに強化し、各国との全面衝突を回避すべく賠償交渉を行う",
                    effectDesc: "志士『永井尚志』を獲得。軍資金 40両 を失うが、列強介入 -6%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("nagai_retreat");
                        app.gold = Math.max(0, app.gold - 40);
                        app.modifyImperialGauge(-6);
                    }
                },
                {
                    opinionChange: 0,
                    text: "江戸市中の警戒態勢を敷き、自軍の守りを固める",
                    effectDesc: "防 12、HP を 10 回復する。",
                    action: (app) => {
                        app.healPlayer(10);
                    }
                }
            ]
        },
        {
            id: "event_tozenji_incident",
            act: 1,
            importance: 2,
            title: "東禅寺事件、水戸浪士の英公使館急襲",
            desc: "文久元年五月、高輪・東禅寺。イギリス仮公使館として使われていた寺院に水戸脱藩の有志ら14名が抜刀して討ち入る。公使オールコックは脱出したものの館員が負傷。幕府の警備責任を問われ、対英関係は一触即発の危機に陥る。",
            choices: [
                {
                    opinionChange: 8,
                    text: "【討幕派】破約攘夷の義挙として水戸浪士の脱走路を援護する",
                    effectDesc: "志士『相楽総三』を獲得。次戦攻撃力 +4、列強介入 +8%。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("sagara_souzou");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                        app.modifyImperialGauge(8);
                    }
                },
                {
                    opinionChange: -10,
                    text: "【佐幕派】幕府警護隊として身を挺して公使館を守り、浪士らを鎮圧・捕縛する",
                    effectDesc: "志士『高橋泥舟』を獲得。防 15、軍資金 30両 獲得、列強介入 -5%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("takahashi_guard");
                        app.gold += 30;
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    opinionChange: -5,
                    text: "【佐幕派】英国側と賠償交渉を進め、幕府の国際信義を辛うじて維持する",
                    effectDesc: "軍資金 35両 消費、列強介入 -8%、HP 8 回復。",
                    faction: "sabaku",
                    action: (app) => {
                        app.gold = Math.max(0, app.gold - 35);
                        app.modifyImperialGauge(-8);
                        app.healPlayer(8);
                    }
                }
            ]
        },
        {
            id: "event_bunkyu_reform",
            act: 1,
            importance: 3,
            title: "文久の改革、幕府職制改編と参勤交代の緩和",
            desc: "文久二年閏八月、島津久光の率兵上洛と勅使大原重徳の江戸下向を受け、幕府は未曾有の制度改革を断行。一橋慶喜が将軍後見職、松平春嶽が政事総裁職、松平容保が京都守護職に就任し、参勤交代の義務を三年に一度に大幅緩和した。",
            choices: [
                {
                    opinionChange: -12,
                    text: "【佐幕派】政事総裁職・松平春嶽と共に幕府の近代軍制改革と公武合体政権を推進する",
                    effectDesc: "志士『松平春嶽：公議の守り』を獲得。手札上限 +1、防 14 獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("shungaku_council");
                        app.healPlayer(10);
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】会津藩主・松平容保の京都守護職拝命に同行し、治安維持の重責を担う",
                    effectDesc: "志士『松平容保』を獲得。防 18、軍資金 30両 獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("aizu_shield");
                        app.gold += 30;
                    }
                },
                {
                    opinionChange: 12,
                    text: "【討幕派】参勤交代の緩和を利用して諸藩主の妻子を国許へ帰国させ、挙兵準備を加速する",
                    effectDesc: "志士『桂小五郎』を獲得。次回攻撃力 +5、軍資金 40両 獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("katsura_shindo");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                        app.gold += 40;
                    }
                }
            ]
        },
        {
            id: "event_yoshida_toyo_assassination",
            act: 1,
            importance: 2,
            title: "土佐追手門の暗殺、吉田東洋暗殺事件",
            desc: "文久二年四月八日夜、高知城下・追手筋。藩政の全権を握り門閥打破・開明政策を推し進めていた参政・吉田東洋が、武市半平太率いる土佐勤王党の刺客（那須信吾ら）によって雨の夜道で刺殺された。土佐藩論は一気に尊皇攘夷へ傾く。",
            choices: [
                {
                    opinionChange: 10,
                    text: "【討幕派】武市半平太の指示を受け、襲撃の退路を確保して勤王党の天下を掴む",
                    effectDesc: "志士『武市半平太』を獲得。世論討幕 10%、次戦攻撃力 +5。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("takechi_ideology");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】刺客たちの逃亡を助け、長州の久坂玄瑞ら尊攘派との連絡路を開く",
                    effectDesc: "志士『久坂玄瑞』を獲得。軍資金 25両 獲得、HP 8 回復。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("kusaka_revolt");
                        app.gold += 25;
                        app.healPlayer(8);
                    }
                },
                {
                    opinionChange: -10,
                    text: "【佐幕派】東洋派の残党（後藤象二郎ら）を保護し、過激派の暴発を調査・糾問する",
                    effectDesc: "志士『後藤象二郎』を獲得。防 12、軍資金 35両 獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("goto_political_drive");
                        app.gold += 35;
                    }
                }
            ]
        },
        {
            id: "event_kamo_jinja_gyokou",
            act: 1,
            importance: 2,
            title: "賀茂神社行幸、孝明天皇の攘夷親征祈願",
            desc: "文久三年三月十一日、京都。孝明天皇は将軍・徳川家茂らを従え、230年ぶりとなる行幸を賀茂神社へ挙行。自ら攘夷の成就を祈願した。天皇と将軍が並び進む荘厳な隊列に京洛の市民は熱狂し、尊皇攘夷の熱気は最高潮に達する。",
            choices: [
                {
                    opinionChange: 10,
                    text: "【討幕派】行幸の隊列に加わり、朝廷主導の破約攘夷断行を天下に宣言する",
                    effectDesc: "志士『三条実美』を獲得。世論討幕 10%、全軍攻撃力 +4。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("sanjo_court");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: -10,
                    text: "【佐幕派】将軍家茂の供奉列を完璧に警護し、徳川の威光と朝廷への恭順を示す",
                    effectDesc: "志士『徳川慶喜』を獲得。防 16、軍資金 30両 獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("tokugawa_yoshinobu");
                        app.gold += 30;
                    }
                },
                {
                    opinionChange: 0,
                    text: "行幸警備の混乱に乗じ、京洛の治安維持網を再編成する",
                    effectDesc: "HP を 15 回復し、シールド 10 獲得。",
                    action: (app) => {
                        app.healPlayer(15);
                    }
                }
            ]
        },
        {
            id: "event_roshigumi_departure",
            act: 1,
            importance: 2,
            title: "浪士組の出立、清河八郎と壬生浪士の分岐",
            desc: "文久三年二月、将軍家茂警護を名目に江戸小石川・伝通院で結成された『浪士組』二百余名が中山道を進軍して上洛。しかし首謀者・清河八郎は京都新徳寺で真の目的は討幕攘夷であると宣言。これに反対した近藤勇・芹沢鴨らは京都に残留し、のちの新選組の母体となった。",
            choices: [
                {
                    opinionChange: -10,
                    text: "【佐幕派】清河の策謀に猛反発し、芹沢鴨・近藤勇と共に京都に残留して会津藩に尽忠を誓う",
                    effectDesc: "志士『芹沢鴨：豪剣の狂瀾』を獲得。剛剣の威圧で次戦攻撃力 +6、HP 8 消費。",
                    faction: "sabaku",
                    shishiBonus: {
                        character: "serizawa",
                        desc: "筆頭局長の狂瀾！次戦攻撃力+4、敵シールド4破壊！",
                        apply: (app) => {
                            app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("serizawa_kamo");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 6;
                        app.damagePlayer(8);
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】近藤・土方ら試衛館派の統制を固め、壬生屯所で守護職の命を待つ",
                    effectDesc: "志士『土方歳三』を獲得。防 12、軍資金 25両 獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("hijikata_fukucho");
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: 10,
                    text: "【討幕派】清河八郎の大胆不敵な策を支持し、江戸へ引き返して幕府瓦解の工作を画策する",
                    effectDesc: "志士『清河八郎』を獲得。世論討幕 10%、軍資金 30両 獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("kiyokawa_leader");
                        app.gold += 30;
                    }
                }
            ]
        },
        {
            id: "event_tennozan_maki_stand",
            act: 1,
            importance: 3,
            title: "天王山の自刃、真木和泉と十七烈士の殉難",
            desc: "元治元年七月、禁門の変に敗れた長州軍。久留米出身の尊王指導者・真木和泉は十七名の同志と共に天王山に籠城。追撃する会津・新選組の大軍を前に弾薬尽き果てるまで戦い抜き、最後は小屋に火を放ち全員潔く自刃・散華した。",
            choices: [
                {
                    opinionChange: 12,
                    text: "【討幕派】天王山の煙を見上げ、十七烈士の遺志を継いで討幕の復讐を誓う",
                    effectDesc: "志士『真木和泉：尊王の檄文』を獲得。悲壮なる覚悟で次戦攻撃力 +6、世論討幕 12%。",
                    faction: "tobaku",
                    shishiBonus: {
                        character: "maki",
                        desc: "大義殉難の熱血！全軍の攻撃力+5！",
                        apply: (app) => {
                            app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("maki_revolt");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 6;
                    }
                },
                {
                    opinionChange: 10,
                    text: "【討幕派】山麓の追撃包囲網の隙を突き、生き残った長州兵や負傷者を安全に脱出させる",
                    effectDesc: "志士『品川弥二郎』を獲得。HP を 12 回復し、軍資金 20両 獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("shinagawa_signal");
                        app.healPlayer(12);
                        app.gold += 20;
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】会津藩・新選組部隊として天王山を完全制圧し、京洛の治安維持を完了する",
                    effectDesc: "志士『斎藤一』を獲得。防 15、軍資金 40両 獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("saito_gato");
                        app.gold += 40;
                        app.healPlayer(8);
                    }
                }
            ]
        },
        {
            id: "event_daiba_construction",
            act: 1,
            importance: 2,
            title: "品川台場の築造、江川太郎左衛門の海防陣",
            desc: "嘉永六年八月、ペリー再来に備える江戸幕府。韮山代官・江川太郎左衛門の建議により、品川沖に海堡（砲台）を連続築造する空前の大工事『台場建設』が急ピッチで進められた。江戸湾防備の砲門が海を睨む。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【佐幕派】台場砲台の築造指揮を補佐し、最新式反射炉鋳造カノン砲を配備する",
                    effectDesc: "志士『阿部正弘』を獲得。防 15、列強介入 -4%、軍資金 25両 獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("abe_defense");
                        app.healPlayer(8);
                        app.modifyImperialGauge(-4);
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: -5,
                    text: "【佐幕派】台場警備の旗本・幕府歩兵を統制し、海防の厳戒態勢を整える",
                    effectDesc: "志士『筒井政憲：老練の談判』を獲得。防 12、手札上限 +1。",
                    faction: "sabaku",
                    shishiBonus: {
                        character: "tsutsui",
                        desc: "老練の海防陣！シールド 12 獲得！",
                        apply: (app) => {
                            app.healPlayer(10);
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("tsutsui_masanori");
                        app.healPlayer(8);
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】沿岸砲台の構造と防備の弱点を偵察し、将来の海防自立の資とする",
                    effectDesc: "志士『佐久間象山』を獲得。次戦攻撃力 +4、軍資金 20両 獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("sakuma_gunnery");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                        app.gold += 20;
                    }
                }
            ]
        },
        {
            id: "event_rus_japan_shimoda_talks",
            act: 1,
            importance: 2,
            title: "下田の露日談判、筒井政憲とプチャーチンの儀礼",
            desc: "嘉永七年十一月、下田。ロシア提督プチャーチンとの間で国境・通商を定める歴史的会談が開かれた。筆頭全権の老臣・筒井政憲は川路聖謨と共に堂々たる威厳と温厚な至誠でロシア使節に接し、互いの信頼を深めていく。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【佐幕派】筒井政憲の重厚な談判を支え、北方国境を択捉島と得撫島の間と画定させる",
                    effectDesc: "志士『筒井政憲：老練の談判』を獲得。列強介入 -5%、軍資金 30両 獲得。",
                    faction: "sabaku",
                    shishiBonus: {
                        character: "tsutsui",
                        desc: "老練の談判！列強介入をさらに 4% 鎮静化！",
                        apply: (app) => {
                            app.modifyImperialGauge(-4);
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("tsutsui_masanori");
                        app.modifyImperialGauge(-5);
                        app.gold += 30;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】川路聖謨と共に実務交渉を詰め、下田・箱館・長崎の三港開港を取りまとめる",
                    effectDesc: "志士『川路聖謨』を獲得。防 14、列強介入 -4%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("kawaji_toshiakira");
                        app.modifyImperialGauge(-4);
                        app.healPlayer(8);
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】幕府の条約外交の全貌を監視し、通商条項がもたらす国論動揺を分析する",
                    effectDesc: "志士『橋本左内』を獲得。カードを2枚引く、軍資金 25両 獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("hashimoto_sanai");
                        app.gold += 25;
                    }
                }
            ]
        },
        {
            id: "event_tekijuku_flourish",
            act: 1,
            importance: 1,
            title: "大坂適塾の隆盛、緒方洪庵と俊英たちの蘭学",
            desc: "安政年間、大坂船場・適塾。蘭医・緒方洪庵の私塾には福沢諭吉、大村益次郎、橋本左内ら全国から俊英が集い、夜を徹して原書を読み競い合っていた。この小さな町塾こそが、日本の近代化を担う巨星たちの揺籃であった。",
            choices: [
                {
                    opinionChange: 5,
                    text: "【討幕派】適塾の洋学教育に学び、西洋兵学・解剖学の最新知識を吸収する",
                    effectDesc: "志士『大村益次郎』を獲得。文 1 獲得、HP を 10 回復する。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("omura_reform");
                        app.healPlayer(10);
                    }
                },
                {
                    opinionChange: 5,
                    text: "【討幕派】福井藩の秀才・橋本左内ら同志と交わり、天下国家の経綸を熱く論じ合う",
                    effectDesc: "志士『橋本左内』を獲得。手札上限 +1、軍資金 20両 獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("hashimoto_sanai");
                        app.gold += 20;
                    }
                },
                {
                    opinionChange: 0,
                    text: "適塾調合の特製牛痘種と蘭方薬を入手し、陣中の防疫・治療に備える",
                    effectDesc: "『和漢名薬・萬金丹』を獲得。HP を 25 回復する。",
                    action: (app) => {
                        app.addCardToDeck("item_mankintan");
                        app.healPlayer(25);
                    }
                }
            ]
        },
        {
            id: "event_kazunomiya_kobu_gattai",
            act: 1,
            importance: 3,
            title: "和宮降嫁、安藤信正の公武合体大計",
            desc: "文久元年十月、孝明天皇の皇妹・和宮が十四代将軍家茂の御台所として江戸へ御降嫁。大老・井伊直弼没後の幕政を担う老中・安藤信正らは、幕府と朝廷を融和させる『公武合体』により難局を打開せんとするが、過激尊攘派の怒りを買う。",
            choices: [
                {
                    opinionChange: -12,
                    text: "【佐幕派】老中・安藤信正の公武合体路線を固守し、朝廷と幕府の絆で国論を統一する",
                    effectDesc: "志士『安藤信正：公武合体の老中』を獲得。防 16、列強介入 -5%、世論佐幕 12%。",
                    faction: "sabaku",
                    shishiBonus: {
                        character: "ando",
                        desc: "公武合体の結束！防 15、軍資金 35両 獲得！",
                        apply: (app) => {
                            app.healPlayer(12);
                            app.gold += 35;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("ando_nobumasa");
                        app.modifyImperialGauge(-5);
                        app.healPlayer(8);
                    }
                },
                {
                    opinionChange: -10,
                    text: "【佐幕派】中山道の御降嫁行列を厳重に警護し、不逞浪士の妨害を未然に防ぐ",
                    effectDesc: "志士『松平春嶽』を獲得。防 14、軍資金 30両 獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("shungaku_council");
                        app.gold += 30;
                    }
                },
                {
                    opinionChange: 12,
                    text: "【討幕派】朝廷を傀儡化する幕府の謀略と糾弾し、水戸浪士らと共に坂下門外へ結集する",
                    effectDesc: "志士『武田耕雲斎』を獲得。世論討幕 12%、全軍攻撃力 +5。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("takeda_kounsai");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                    }
                }
            ]
        },
        {
            id: "event_hisamitsu_joraku_seichugumi",
            act: 1,
            importance: 3,
            title: "島津久光の上洛、千名の率兵と誠忠組の動天",
            desc: "文久二年三月、薩摩藩主の父・島津久光が千余名の精鋭兵を率いて鹿児島を発進。京都へ進軍した。大久保利通ら誠忠組を従え、幕政改革の勅使護衛を掲げて天下の政治の中枢へ躍り出る。この威勢に京洛の諸大名は息を呑んだ。",
            choices: [
                {
                    opinionChange: 12,
                    text: "【討幕派】島津久光の薩摩軍列に合流し、率兵上洛の威勢で京都の主導権を握る",
                    effectDesc: "志士『島津久光：率兵の国父』を獲得。全軍攻撃力 +5、軍資金 35両 獲得、世論討幕 12%。",
                    faction: "tobaku",
                    shishiBonus: {
                        character: "hisamitsu",
                        desc: "国父の示現！味方剛力+4、軍資金 30両 獲得！",
                        apply: (app) => {
                            app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                            app.gold += 30;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("shimazu_hisamitsu");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                        app.gold += 35;
                    }
                },
                {
                    opinionChange: 10,
                    text: "【討幕派】大久保利通と共に朝廷公卿との周旋を進め、勅使下向の工作をまとめる",
                    effectDesc: "志士『大久保利通』を獲得。防 12、手札を2枚引く。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.healPlayer(8);
                    }
                },
                {
                    opinionChange: -10,
                    text: "【佐幕派】薩摩の大軍上洛を警戒し、京都所司代・京都見廻役の警備態勢を整える",
                    effectDesc: "志士『松平容保』を獲得。防 16、軍資金 30両 獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("aizu_shield");
                        app.gold += 30;
                    }
                }
            ]
        },
        {
            id: "event_choshu_koto_policy",
            act: 1,
            importance: 2,
            title: "長州藩の航海遠略策、長井雅楽と破約攘夷の激突",
            desc: "文久元年、長州藩直講・長井雅楽が公武合体と開国進取を唱える『航海遠略策』を幕府・朝廷に上奏。一時は藩論の主流となるも、久坂玄瑞や桂小五郎ら松陰門下の尊攘派が猛烈に反発。藩論を巡る命がけの権力闘争が勃発する。",
            choices: [
                {
                    opinionChange: 10,
                    text: "【討幕派】久坂玄瑞・桂小五郎を支持して航海遠略策を覆し、破約攘夷を長州藩是とする",
                    effectDesc: "志士『久坂玄瑞：禁門の進撃』を獲得。次戦攻撃力 +5、世論討幕 10%。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("kusaka_revolt");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】周布政之助と共に藩政改革を進め、松下村塾系の若手志士を要職に抜擢する",
                    effectDesc: "志士『周布政之助』を獲得。防 10、軍資金 25両 獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("sufu_reform");
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】長井雅楽の穏健開国策を幕府側から後援し、過激攘夷派の台頭を抑え込む",
                    effectDesc: "志士『永井尚志』を獲得。防 12、軍資金 35両 獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("nagai_retreat");
                        app.gold += 35;
                    }
                }
            ]
        },
        {
            id: "event_kobe_kaigun_sorenjo_founding",
            act: 1,
            importance: 2,
            title: "神戸海軍操練所の創設、勝海舟と諸藩脱藩志士の集結",
            desc: "文久三年四月、勝海舟の建白により神戸村に海軍操練所と私塾が設立された。幕府直参のみならず、坂本龍馬、陸奥宗光、岡田以蔵ら全国の脱藩志士が身分を問わず集結。黒船に対峙する近代的日本海軍の夢がここに始まった。",
            choices: [
                {
                    opinionChange: 8,
                    text: "【討幕派】坂本龍馬と共に操練所の塾頭として諸藩の志士を束ね、海運の夢を育む",
                    effectDesc: "志士『坂本龍馬：海援隊の采配』を獲得。カードを2枚引く、列強介入 -3%。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("ryoma_kaiwentai");
                        app.modifyImperialGauge(-3);
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】軍艦奉行・勝海舟の近代海軍構想を財政的に支援し、幕府艦隊を強化する",
                    effectDesc: "志士『勝海舟』を獲得。防 14、軍資金 30両 獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("katsu_kaishu");
                        app.gold += 30;
                    }
                },
                {
                    opinionChange: 0,
                    text: "操練所で蒸気機関の操縦術と最新測量術を学び、自軍の技術力を高める",
                    effectDesc: "手札上限 +1、最大HP +3、HP を 12 回復。",
                    action: (app) => {
                        app.maxHp += 3;
                        app.healPlayer(12);
                    }
                }
            ]
        },
        {
            id: "event_shimonoseki_bombardment_four_nations",
            act: 1,
            importance: 3,
            title: "下関四カ国連合艦隊砲撃、長州の完敗と開国への転換",
            desc: "元治元年八月、英・仏・米・蘭の軍艦17隻が下関海峡へ来航。下関の長州砲台へ猛烈な艦砲射撃を浴びせ、陸戦隊を上陸させて占領した。高杉晋作が講和使節として乗り込み、賠償交渉を乗り切る中、長州は攘夷の不可能を悟り開国・倒幕へと急転換する。",
            choices: [
                {
                    opinionChange: -12,
                    text: "【討幕派】神速の居合で前線突撃を敢行し、河上彦斎らと共に上陸部隊へ奇襲を仕掛ける",
                    effectDesc: "志士『河上彦斎：神速の居合』を獲得。上陸部隊へ奇襲を試みるも砲撃で大打撃、砲台壊滅の敗北で世論逆風。HP 24 消費、次戦攻撃力 +6。",
                    faction: "tobaku",
                    shishiBonus: {
                        character: "gensai",
                        desc: "神速の抜刀！次戦攻撃力+5、敵シールド全破壊！",
                        apply: (app) => {
                            app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("kawakami_gensai");
                        app.damagePlayer(24);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 6;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【討幕派】高杉晋作・伊藤博文・井上馨の講和交渉を支え、領土割譲要求を完全阻止する",
                    effectDesc: "志士『高杉晋作』を獲得。軍資金 30両 獲得、列強介入 -5%。領土割譲は阻止するも攘夷完敗の現実に世論は後退。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("takasugi_kiheitai");
                        app.gold += 30;
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】長州の攘夷暴発の壊滅を確認し、第一次長州征討の幕府進軍令を発する",
                    effectDesc: "志士『小笠原長行』を獲得。防 16、軍資金 40両 獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("ogasawara_minister");
                        app.gold += 40;
                        app.healPlayer(10);
                    }
                }
            ]
        },
        {
            id: "event_aizu_defense_council",
            act: 3,
            importance: 3,
            title: "会津若松、籠城評議",
            desc: "城下に迫る新政府軍を前に、会津の重臣たちは籠城か撤退かを議論している。民を守るには、決断を急がねばならない。",
            choices: [
                {
                    opinionChange: -12,
                    text: "城門を閉じ、鉄壁の守りを固める",
                    effectDesc: "『松平容保：会津の義気』をデッキに加え、HPを 8 回復。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("aizu_shield");
                        app.healPlayer(8);
                    }
                },
                {
                    opinionChange: -12,
                    text: "城外へ打って出て敵陣を崩す",
                    effectDesc: "『斎藤一：無外流の牙突』をデッキに加えるが、HPを 38 失う。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("saito_gato");
                        app.damagePlayer(38);
                    }
                },
                {
                    opinionChange: 12,
                    text: "【討幕派】会津城下の要衝を押さえ、降伏勧告の使者を送る",
                    effectDesc: "志士『板垣退助』を獲得。HPを 8 回復し、列強介入-5%。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("itagaki_charge");
                        app.healPlayer(8);
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    opinionChange: 0,
                    text: "民を先に避難させ、戦火を抑える",
                    effectDesc: "HPを 8 回復し、25両を得る。",
                    action: (app) => {
                        app.healPlayer(8);
                        app.gold += 25;
                    }
                }
            ]
        },
        {
            id: "event_satsuma_reform",
            act: 2,
            importance: 2,
            title: "薩摩の軍制改革",
            desc: "西郷や大久保のもとに、新式銃の扱いを学ぶ兵たちが集まった。改革には金が要るが、旧来の誇りを捨てる覚悟も必要だ。",
            choices: [
                {
                    opinionChange: 8,
                    text: "大久保の策を採用し、制度から改める",
                    effectDesc: "『大久保利通：冷徹な謀略』をデッキに加え、列強介入-4%。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.modifyImperialGauge(-4);
                    }
                },
                {
                    opinionChange: 8,
                    text: "西郷の人望に賭け、兵の士気を高める",
                    effectDesc: "『西郷隆盛：薩摩の巨魁』をデッキに加えるが、45両を失う。",
                    faction: "tobaku",
                    costGold: 50,
                    canChoose: (app) => app.gold >= 50,
                    action: (app) => {
                        app.gold -= 50;
                        app.addCardToDeck("saigo_jigen");
                    }
                },
                {
                    opinionChange: 8,
                    text: "改革を急がず、資金を温存する",
                    effectDesc: "志士『中村半次郎』を獲得。25両を得るが、次の戦闘で攻撃力-3。",
                    action: (app) => {
                        app.addCardToDeck("nakamura_charge");
                        app.gold += 25;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) - 3;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】薩摩の軍制改革を警戒し、幕府歩兵の装備近代化を進める",
                    effectDesc: "志士『大鳥圭介』を獲得。HPを 6 回復し、列強介入-4%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("otori_strategy");
                        app.healPlayer(6);
                        app.modifyImperialGauge(-4);
                    }
                }
            ]
        },
        {
            id: "event_andei_purge",
            act: 1,
            importance: 3,
            title: "安政の大獄、弾圧の影",
            desc: "幕府の大規模な弾圧が始まり、志士たちは身を隠している。沈黙して難を逃れるか、仲間を救うため動くか。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["yoshida_teaching"],
                    opinionChange: 10,
                    text: "【🕊️ 生存ルート】伝馬町牢屋敷の警備を強襲し、処刑寸前の吉田松陰を密かに脱出させる",
                    effectDesc: "【生存ルート】志士『吉田松陰』を救出し歴史改変！HP 35 ダメージを受けるが、松陰は生存確定となり以降もデッキで使用可能！",
                    action: (app) => {
                        app.markShishiSurvived("yoshida_teaching");
                        if (!app.deck.includes("yoshida_teaching")) app.addCardToDeck("yoshida_teaching");
                        app.damagePlayer(35);
                    }
                },

                {
                    opinionChange: -12,
                    text: "【佐幕派】大老・井伊直弼の断行を補佐し、幕府の威令を徹底する",
                    effectDesc: "志士『井伊直弼』を獲得。30両を得る。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("ii_naosuke");
                        app.gold += 30;
                    }
                },
                {
                    opinionChange: 0,
                    text: "潜伏して情勢を見極める",
                    effectDesc: "HPを 8 回復し、列強介入-5%。",
                    action: (app) => {
                        app.healPlayer(8);
                        app.modifyImperialGauge(-5);
                    }
                }
            ]
        },
        {
            id: "event_namugi_incident",
            act: 1,
            importance: 2,
            title: "生麦事件、外交の火種",
            desc: "街道で起きた衝突が、薩摩と英国の緊張を一気に高めた。謝罪か強硬姿勢か、国の威信を賭けた判断を迫られる。",
            choices: [
                {
                    opinionChange: 8,
                    text: "賠償を払い、戦争を避ける",
                    effectDesc: "志士『吉井友実』を獲得。60両を支払い、列強介入-4%。資金が足りない場合は選択不可。",
                    costGold: 60,
                    canChoose: (app) => app.gold >= 60,
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.gold -= 60;
                        app.modifyImperialGauge(-4);
                    }
                },
                {
                    opinionChange: 8,
                    text: "藩の威信を守り、強硬に出る",
                    effectDesc: "志士『中村半次郎』を獲得。次の戦闘の攻撃力+3、HPを 12 失い、列強介入+12%。",
                    action: (app) => {
                        app.addCardToDeck("nakamura_charge");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.damagePlayer(26);
                        app.modifyImperialGauge(12);
                    }
                },
                {
                    opinionChange: 8,
                    text: "商人を通じて秘密裏に交渉する",
                    effectDesc: "志士『大久保利通』を獲得。25両を得るが、列強介入+12%。",
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.gold += 25;
                        app.modifyImperialGauge(12);
                    }
                },
                {
                    opinionChange: -8,
                    faction: "sabaku",
                    text: "【佐幕派】幕府老中として英国公使と談判し、賠償金交渉により全面戦争を未然に防ぐ",
                    effectDesc: "志士『小栗忠順：造船の先見』を獲得。列強介入-6%、軍資金 25両 を得る。",
                    action: (app) => {
                        app.addCardToDeck("oguri_reform");
                        app.modifyImperialGauge(-6);
                        app.gold += 25;
                    }
                }
            ]
        },
        {
            id: "event_restoration_council",
            act: 2,
            importance: 3,
            title: "王政復古、朝廷の決断",
            desc: "朝廷に政権を戻す大号令が発せられた。新しい国の形を急いで整えるか、旧勢力との対話を残すか。",
            choices: [
                {
                    opinionChange: 12,
                    text: "新政府の中枢をすぐに整える",
                    effectDesc: "志士『岩倉具視』を獲得。最大HP+3、次の戦闘の攻撃力+4。",
                    action: (app) => {
                        app.addCardToDeck("iwakura_imperial");
                        app.maxHp += 3;
                        app.hp += 8;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: -12,
                    text: "旧幕臣との融和を探る",
                    effectDesc: "志士『山内容堂』を獲得。列強介入-5%、HPを 8 回復。",
                    action: (app) => {
                        app.addCardToDeck("yodo_political_balance");
                        app.modifyImperialGauge(-5);
                        app.healPlayer(8);
                    }
                },
                {
                    opinionChange: 12,
                    text: "各藩の協力を買い集める",
                    effectDesc: "志士『三条実美』を獲得。45両を支払うが、次の戦闘の攻撃力+4。資金が足りない場合は選択不可。",
                    costGold: 45,
                    canChoose: (app) => app.gold >= 45,
                    action: (app) => {
                        app.addCardToDeck("sanjo_court");
                        app.gold -= 45;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                }
            ]
        },
        {
            id: "event_aizu_war",
            act: 3,
            importance: 3,
            title: "会津戦争、白虎の決意",
            desc: "城下に砲声が響き、若い兵たちが守備についた。最後まで戦うか、命を残すため撤退するか、重い決断の時だ。",
            choices: [
                {
                    opinionChange: -12,
                    text: "城壁に立ち、最後の一戦に挑む",
                    effectDesc: "『松平容保：会津の義気』をデッキに加え、HPを 38 失う。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("aizu_shield");
                        app.damagePlayer(38);
                    }
                },
                {
                    opinionChange: -12,
                    faction: "sabaku",
                    text: "佐川官兵衛ら抜刀隊と連携し、夜陰に紛れて兵を退かせる",
                    effectDesc: "志士『佐川官兵衛』を獲得。HPを 8 回復し、次の戦闘で攻撃力+4。",
                    action: (app) => {
                        app.addCardToDeck("sagawa_cavalry");
                        app.healPlayer(8);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】庄内藩・酒井玄蕃の援軍と呼応し、新政府軍の包囲網を突破する",
                    effectDesc: "志士『酒井玄蕃：鬼玄蕃の雷名』を獲得。次の戦闘の攻撃力+4、HPを 8 回復。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("sakai_genba_charge");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                        app.healPlayer(8);
                    }
                },
                {
                    opinionChange: 12,
                    faction: "tobaku",
                    text: "【討幕派】板垣退助・伊地知正治の指揮下で新政府軍の砲撃陣地を展開し、鶴ヶ城を包囲制圧する",
                    effectDesc: "志士『板垣退助：自由の先駆』を獲得。HPを 20 失うが、軍資金 40両 を得て次の戦闘で攻撃力+4。",
                    action: (app) => {
                        app.addCardToDeck("itagaki_charge");
                        app.damagePlayer(20);
                        app.gold += 40;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                }
            ]
        },
        {
            id: "event_hamaguri_gate",
            act: 1,
            importance: 3,
            title: "禁門の変、御所前の激戦",
            desc: "長州軍が御所へ迫り、門前はたちまち戦場となった。天下の主導権と朝敵の汚名が交錯する不可避の大激戦。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["kusaka_revolt","kirishima_charge","maki_revolt","irie_secret"],
                    opinionChange: 15,
                    text: "【🕊️ 生存ルート】鷹司邸と蛤御門の死線へ斬り込み、自刃寸前の久坂・来島・真木・入江らを強引に脱出させる",
                    effectDesc: "【生存ルート】禁門の四志士『久坂玄瑞』『来島又兵衛』『真木和泉』『入江九一』を総力救出！HP 40 ダメージを受けるが、全員生存確定！",
                    action: (app) => {
                        app.markShishiSurvived("kusaka_revolt");
                        if (!app.deck.includes("kusaka_revolt")) app.addCardToDeck("kusaka_revolt");
                        app.markShishiSurvived("kirishima_charge");
                        if (!app.deck.includes("kirishima_charge")) app.addCardToDeck("kirishima_charge");
                        app.markShishiSurvived("maki_revolt");
                        if (!app.deck.includes("maki_revolt")) app.addCardToDeck("maki_revolt");
                        app.markShishiSurvived("irie_secret");
                        if (!app.deck.includes("irie_secret")) app.addCardToDeck("irie_secret");
                        app.damagePlayer(40);
                    }
                },
                {
                    opinionChange: -48,
                    text: "【討幕派】御所を目指し、鷹司邸の激戦へ突撃する",
                    effectDesc: "朝敵指定の汚名で世論が佐幕へ傾き（大逆風）、決死の猛攻でHPを 30 失い、最大HP-10。散華の覚悟の証として神器レリック『長州の血盟録』を獲得！",
                    faction: "tobaku",
                    shishiBonus: [
                        {
                            character: "kusaka",
                            desc: "久坂玄瑞の烈士魂！被ダメージを20軽減し、最大HP減少を無効化！",
                            apply: (app) => {
                                app.healPlayer(20);
                                app.maxHp += 10;
                                app.hp += 10;
                            }
                        }
                    ],
                    action: (app) => {
                        app.obtainRelic("choshu_blood_pact");
                        app.maxHp = Math.max(20, app.maxHp - 10);
                        app.damagePlayer(38);
                    }
                },
                {
                    opinionChange: -20,
                    text: "【佐幕派】蛤御門で会津藩兵を率い、長州勢の突撃を粉砕する",
                    effectDesc: "志士『松平容保：会津の義気』を獲得。禁裏死守の激闘でHPを 30 失い、最大HP-10。朝廷防衛の勲功として神器レリック『禁裏の錦旗御守』を獲得！",
                    faction: "sabaku",
                    shishiBonus: [
                        {
                            character: "katamori",
                            desc: "京都守護職の矜持！被ダメージを20軽減、最大HP減少を無効化し世論佐幕-20%！",
                            apply: (app) => {
                                app.healPlayer(20);
                                app.maxHp += 10;
                                app.hp += 10;
                                app.modifyPublicOpinion(-20);
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("aizu_shield");
                        app.obtainRelic("imperial_brocade_amulet");
                        app.maxHp = Math.max(20, app.maxHp - 10);
                        app.damagePlayer(38);
                    }
                },
                {
                    opinionChange: -15,
                    text: "【佐幕派】御所周辺の警備を固め、禁裏の延焼を防ぐ",
                    effectDesc: "志士『斎藤一』を獲得。都の消火と治安維持で軍資金70両を拠出、HPを 38 失う。次回防御+12。",
                    faction: "sabaku",
                    shishiBonus: [
                        {
                            character: "saito",
                            desc: "新選組三番隊組長の一刀！治安維持コストを0両にし、被ダメージを20軽減！",
                            apply: (app) => {
                                app.gold += 70;
                                app.healPlayer(20);
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("saito_gato");
                        app.gold = Math.max(0, app.gold - 70);
                        app.damagePlayer(38);
                        app.nextBattleShieldBuff = (app.nextBattleShieldBuff || 0) + 12;
                    }
                },
                {
                    opinionChange: -15,
                    text: "【佐幕派】桑名藩兵と共に敵の退路を遮断し、都の治安を回復する",
                    effectDesc: "志士『松平定敬』を獲得。追撃戦でHPを 38 失う。軍資金30両を獲得。",
                    faction: "sabaku",
                    shishiBonus: [
                        {
                            character: "sadaakira",
                            desc: "桑名藩主の包囲陣！被ダメージを20軽減し、軍資金+40両！",
                            apply: (app) => {
                                app.healPlayer(20);
                                app.gold += 40;
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("sadaakira_guard");
                        app.damagePlayer(38);
                        app.gold += 30;
                    }
                },
                {
                    opinionChange: 10,
                    requiredShishi: ["katsura"],
                    text: "🌟【桂小五郎 限定】長州勢の暴発を抑え、主力を速やかに隠忍退却させる",
                    effectDesc: "大局を見据えた知略により壊滅を免れる！自軍の損害なし（HP消費0）、世論ペナルティを無効化し、次回戦闘攻撃+6、軍資金50両獲得！",
                    faction: "tobaku",
                    action: (app) => {
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 6;
                        app.gold += 50;
                    }
                }
            ]
        },
        {
            id: "event_tenchu_revolt",
            act: 1,
            importance: 2,
            title: "天誅組の変、山中の旗",
            desc: "大和の山中で、討幕を掲げた若者たちが決起した。大義に応じるか、無謀な蜂起を止めるか。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["yoshimura_revolt"],
                    opinionChange: 10,
                    text: "【🕊️ 生存ルート】鷲家口の包囲網を死力で突破し、負傷した吉村寅太郎を背負って十津川深山へ逃れる",
                    effectDesc: "【生存ルート】志士『吉村寅太郎』を救出！HP 32 ダメージを受けるが、吉村は生存確定となり以降もデッキで使用可能！",
                    action: (app) => {
                        app.markShishiSurvived("yoshimura_revolt");
                        if (!app.deck.includes("yoshimura_revolt")) app.addCardToDeck("yoshimura_revolt");
                        app.damagePlayer(32);
                    }
                },

                {
                    opinionChange: -8,
                    text: "兵站を整え、長期戦に備える",
                    effectDesc: "志士『中岡慎太郎』を獲得。兵站を整え長期戦に備えるも幕府軍の重囲に遭い世論逆風、25両を得る。",
                    action: (app) => {
                        app.addCardToDeck("nakaoka_mediator");
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【討幕派】無用な流血を避け、尊攘の志を温存する",
                    effectDesc: "志士『久坂玄瑞』を獲得。挙兵失敗の逆風の中、尊攘の志を温存して撤退。HPを 6 回復し、列強介入-4%。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("kusaka_revolt");
                        app.healPlayer(6);
                        app.modifyImperialGauge(-4);
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】紀州藩・津藩と連携し、大和の治安を回復する",
                    effectDesc: "志士『立見尚文』を獲得。HPを 26 失うが、次の戦闘の攻撃力+3。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("tatsumi_naobumi");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                }
            ]
        },
        {
            id: "event_shinsengumi_formation",
            act: 1,
            importance: 2,
            title: "新選組結成、京の守護",
            desc: "京都の治安を守るため、浪士たちが一つの旗の下に集まった。厳しい規律か、仲間を信じる柔軟さか。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【佐幕派】近藤勇の指導力に従い、局中法度を厳格に布く",
                    effectDesc: "志士『近藤勇』を獲得。鉄の規律と血の粛清によりHPを 25 失い、最大HP-5。次の戦闘攻撃力+3。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("kondo_kotetsu");
                        app.maxHp = Math.max(20, app.maxHp - 5);
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】土方歳三と共に軍律を固め、組織を統制する",
                    effectDesc: "志士『土方歳三』を獲得。鬼の副長による苛烈な軍律によりHPを 25 失い、最大HP-5。世論佐幕+20%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("hijikata_fukucho");
                        app.maxHp = Math.max(20, app.maxHp - 5);
                        app.damagePlayer(26);
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】浪士組分裂の混乱に乗じ、京の尊攘派同志との連絡網を築く",
                    effectDesc: "志士『田中光顕』を獲得。HPを 6 回復し、25両を得る。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("tanaka_intelligence");
                        app.healPlayer(6);
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: 0,
                    text: "町との協力を優先する",
                    effectDesc: "HPを 6 回復し、20両を得る。",
                    action: (app) => {
                        app.healPlayer(6);
                        app.gold += 20;
                    }
                }
            ]
        },
        {
            id: "event_satsuma_residence",
            act: 2,
            importance: 2,
            title: "江戸薩摩藩邸焼討、決裂の夜",
            desc: "薩摩藩邸に集まった浪士たちをめぐり、幕府側との緊張が限界に達した。報復か、交渉か、夜明け前の決断を迫られる。",
            choices: [
                {
                    opinionChange: 8,
                    text: "【討幕派】藩邸に立て籠もり、幕府軍の猛攻を迎え撃つ",
                    effectDesc: "志士『中村半次郎』を獲得。HPを 26 失うが、次の戦闘の攻撃力+3。",
                    action: (app) => {
                        app.addCardToDeck("nakamura_charge");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: 8,
                    text: "火災の延焼を防ぎ、民衆を誘導する",
                    effectDesc: "志士『伊地知正治』を獲得。HPを 6 回復し、列強介入-4%。",
                    action: (app) => {
                        app.addCardToDeck("ijichi_command");
                        app.healPlayer(6);
                        app.modifyImperialGauge(-4);
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】見廻組・庄内藩兵と共に新式火器を押収する",
                    effectDesc: "志士『佐々木只三郎』を獲得。25両を得る。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("sasaki_patrol");
                        app.gold += 25;
                    }
                }
            ]
        },
        {
            id: "event_harris_treaty",
            act: 1,
            importance: 2,
            title: "日米修好通商条約、開国の署名",
            desc: "港を開き、異国との交易を認める条約が差し出された。国力を蓄える好機か、主権を削る危険な一歩か。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【佐幕派】条約を結び、交易の利益を得る",
                    effectDesc: "志士『井伊直弼』を獲得。30両を得るが、列強介入+12%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("ii_naosuke");
                        app.gold += 30;
                        app.modifyImperialGauge(12);
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】開国の先を見据え、異国使節と堂々と渡り合う",
                    effectDesc: "志士『横井小楠』を獲得。30両を得るが、列強介入+12%。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("yokoi_philosophy");
                        app.gold += 30;
                        app.modifyImperialGauge(12);
                    }
                },
                {
                    opinionChange: 8,
                    text: "朝廷の勅許を待ち、慎重に進める",
                    effectDesc: "志士『三条実美』を獲得。列強介入-4%、HPを 6 回復する。",
                    action: (app) => {
                        app.addCardToDeck("sanjo_court");
                        app.modifyImperialGauge(-4);
                        app.healPlayer(6);
                    }
                },
                {
                    opinionChange: 8,
                    text: "外国使節を拒絶し、攘夷の姿勢を示す",
                    effectDesc: "志士『武市半平太』を獲得。次の戦闘の攻撃力+3、HPを 26 失う。",
                    action: (app) => {
                        app.addCardToDeck("takechi_ideology");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.damagePlayer(26);
                    }
                }
            ]
        },
        {
            id: "event_satsuma_british_war",
            act: 1,
            importance: 2,
            title: "薩英戦争、砲火の教訓",
            desc: "鹿児島湾に英国艦隊が現れ、砲声が城下を揺るがした。力で抗うか、敗北から新しい軍制を学ぶか。",
            choices: [
                {
                    opinionChange: -8,
                    text: "砲台を守り、最後まで撃ち返す",
                    effectDesc: "志士『川村純義』を獲得。HPを 26 失うが、次の戦闘の攻撃力+3。",
                    action: (app) => {
                        app.addCardToDeck("kawamura_navy");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: 8,
                    text: "敗北を認め、洋式兵器を研究する",
                    effectDesc: "志士『黒田了介』を獲得。『アームストロング砲』をデッキに加えるが、列強介入+12%。",
                    action: (app) => {
                        app.addCardToDeck("kuroda_frontier");
                        app.addCardToDeck("weapon_armstrong");
                        app.modifyImperialGauge(12);
                    }
                },
                {
                    opinionChange: 8,
                    text: "講和して、交易路を確保する",
                    effectDesc: "志士『大久保利通』を獲得。30両を得るが、列強介入+12%。",
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.gold += 30;
                        app.modifyImperialGauge(12);
                    }
                }
            ]
        },
        {
            id: "event_choshu_expedition",
            act: 1,
            importance: 2,
            title: "第一次長州征討、進軍の命",
            desc: "幕府は長州へ大軍を送り、諸藩にも出兵を命じた。正面から戦うか、裏で停戦の道を探るか。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["sufu_reform"],
                    opinionChange: 8,
                    costGold: 30,
                    text: "【🕊️ 生存ルート】自刃を決意した周布政之助を必死に説得し、松下村塾の門弟らの未来のため生き延びさせる",
                    effectDesc: "【生存ルート】志士『周布政之助』を説得し生存確定！軍資金 30両 を消費（不足時はHP代替）し世論討幕+8%、周布は生存確定となる。",
                    action: (app) => {
                        app.markShishiSurvived("sufu_reform");
                        if (!app.deck.includes("sufu_reform")) app.addCardToDeck("sufu_reform");
                        const spendGold = Math.min(app.gold, 30);
                        const shortage = 30 - spendGold;
                        app.gold -= spendGold;
                        if (shortage > 0) app.damagePlayer(shortage);
                    }
                },
                {
                    opinionChange: -8,
                    riskCategory: "reckless",
                    text: "総軍を率い、正面から攻め込む",
                    effectDesc: "志士『西郷隆盛』を獲得。HPを 26 失うが、30両と次の戦闘の攻撃力+3を得る。",
                    action: (app) => {
                        app.addCardToDeck("saigo_jigen");
                        app.damagePlayer(26);
                        app.gold += 30;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: -8,
                    riskCategory: "orthodox",
                    text: "停戦交渉を進め、消耗を抑える",
                    effectDesc: "志士『吉井友実』を獲得。列強介入-4%、HPを 6 回復する。",
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.modifyImperialGauge(-4);
                        app.healPlayer(6);
                    }
                }
            ]
        },
        {
            id: "event_boshin_war",
            act: 2,
            importance: 3,
            title: "戊辰戦争、時代の分水嶺",
            desc: "錦旗を掲げた軍勢と旧幕府軍が各地で衝突した。新時代へ進むか、旧き秩序を守るか、国の形が決まろうとしている。",
            choices: [
                {
                    opinionChange: 12,
                    text: "新政府軍の本隊に合流する",
                    effectDesc: "志士『西郷隆盛』を獲得。HPを 8 回復し、次の戦闘の攻撃力+4。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("saigo_jigen");
                        app.healPlayer(8);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: -12,
                    text: "旧幕府軍の防衛線を支える",
                    effectDesc: "志士『松平容保：会津の義気』を獲得。30両を得るが、HPを 38 失う。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("aizu_shield");
                        app.gold += 30;
                        app.damagePlayer(38);
                    }
                },
                {
                    opinionChange: 0,
                    text: "中立を保ち、物資の流通を守る",
                    effectDesc: "志士『岩崎弥太郎』を獲得。30両を得る。",
                    action: (app) => {
                        app.addCardToDeck("iwazaki_finance");
                        app.gold += 30;
                    }
                }
            ]
        },
        {
            id: "event_uraga_arrival",
            act: 1,
            importance: 3,
            title: "浦賀沖、黒船来航",
            desc: "蒸気船の巨体が浦賀沖に現れ、町は大騒ぎとなった。国を閉ざすか、異国の技術を学ぶか、幕府は決断を迫られる。",
            choices: [
                {
                    opinionChange: -12,
                    text: "佐久間象山の献策に従い砲台を築き、強硬に対峙する",
                    effectDesc: "志士『佐久間象山』を獲得。HPを 38 失うが、次の戦闘の攻撃力+4。",
                    action: (app) => {
                        app.addCardToDeck("sakuma_gunnery");
                        app.damagePlayer(38);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: -12,
                    text: "異国の技術を学び、海軍を創設する",
                    effectDesc: "志士『勝海舟』を獲得。異国軍制導入の反発により軍資金70両を拠出、HPを 20 失い、最大HP-10、列強介入+20%。呪い『家臣の寝返り』混入。",
                    action: (app) => {
                        app.addCardToDeck("katsu_kaishu");
                        app.addCardToDeck("curse_betrayal");
                        app.gold = Math.max(0, app.gold - 70);
                        app.maxHp = Math.max(20, app.maxHp - 10);
                        app.damagePlayer(38);
                        app.modifyImperialGauge(20);
                    }
                },
                {
                    opinionChange: 12,
                    text: "【討幕派】黒船への密航を企て、世界の大勢を見聞する",
                    effectDesc: "志士『吉田松陰』を獲得。列強介入-5%、HPを 8 回復する。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("yoshida_teaching");
                        app.modifyImperialGauge(-5);
                        app.healPlayer(8);
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】幕府老中・阿部正弘の諮問に応じ、海岸防備の策を進言する",
                    effectDesc: "志士『阿部正弘』を獲得。列強介入-5%、HPを 8 回復する。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("abe_defense");
                        app.modifyImperialGauge(-5);
                        app.healPlayer(8);
                    }
                }
            ]
        },
        {
            id: "event_manen_embassy",
            act: 1,
            importance: 1,
            title: "万延遣米使節、海の彼方へ",
            desc: "条約批准書を携えた使節団が、太平洋を越えて米国へ向かう。異国の制度を学ぶ旅には、危険と大きな成果が待っている。",
            choices: [
                {
                    opinionChange: -5,
                    text: "使節を送り、制度を学ぶ",
                    effectDesc: "志士『勝海舟』を獲得。列強介入-3%、最大HP+2。",
                    action: (app) => {
                        app.addCardToDeck("katsu_kaishu");
                        app.modifyImperialGauge(-3);
                        app.maxHp += 2;
                        app.hp += 6;
                    }
                },
                {
                    opinionChange: -5,
                    text: "航海の資金を武器に回す",
                    effectDesc: "志士『木村芥舟』を獲得。25両を得るが、列強介入+7%。",
                    action: (app) => {
                        app.addCardToDeck("kimura_navy");
                        app.gold += 25;
                        app.modifyImperialGauge(7);
                    }
                },
                {
                    opinionChange: 5,
                    text: "【討幕派】久坂玄瑞ら尊攘派と共に、国内の改革と破約攘夷を叫ぶ",
                    effectDesc: "志士『久坂玄瑞』を獲得。次の戦闘の攻撃力+2、HPを 4 回復する。",
                    action: (app) => {
                        app.addCardToDeck("kusaka_revolt");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 2;
                        app.healPlayer(4);
                    }
                }
            ]
        },
        {
            id: "event_seven_nobles_exile",
            act: 1,
            importance: 2,
            title: "七卿落ち、雨中の逃避行",
            desc: "政変によって都を追われた公卿たちが、長州を目指して夜道を進む。追手を振り切り、次の策を立てなければならない。",
            choices: [
                {
                    opinionChange: -8,
                    text: "護衛を引き受け、道を切り開く",
                    effectDesc: "志士『三条実美』を獲得。都を追われる逆風の中、追手を防ぎHPを 26 失うが次の戦闘の攻撃力+3。",
                    action: (app) => {
                        app.addCardToDeck("sanjo_court");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: -8,
                    text: "資金を渡し、別の逃走路を用意する",
                    effectDesc: "志士『品川弥二郎』を獲得。都落ちの逆風の中、40両を支払い脱走路を確保、列強介入-4%。資金不足時は選択不可。",
                    costGold: 40,
                    canChoose: (app) => app.gold >= 40,
                    action: (app) => {
                        app.addCardToDeck("shinagawa_signal");
                        app.gold -= 40;
                        app.modifyImperialGauge(-4);
                    }
                },
                {
                    opinionChange: -8,
                    text: "追手へ偽情報を流す",
                    effectDesc: "志士『田中光顕』を獲得。偽情報で追手を欺き30両とHP 6を得るが、都は公武合体派が掌握。",
                    action: (app) => {
                        app.addCardToDeck("tanaka_intelligence");
                        app.gold += 20;
                        app.healPlayer(6);
                    }
                },
                {
                    opinionChange: -8,
                    faction: "sabaku",
                    text: "【佐幕派】京都守護職・会津藩兵と連携して都を厳重警戒し、尊攘派の勢力を完全に一掃する",
                    effectDesc: "志士『松平容保：会津の義気』を獲得。軍資金 30両 を得て、次の戦闘の防御力+6。",
                    action: (app) => {
                        app.addCardToDeck("aizu_shield");
                        app.gold += 30;
                        app.nextBattleDefenseBuff = (app.nextBattleDefenseBuff || 0) + 6;
                    }
                }
            ]
        },
        {
            id: "event_nagasaki_naval_school",
            act: 1,
            importance: 1,
            title: "長崎海軍伝習所、蒸気の学び",
            desc: "長崎に集まった若き志士たちが、航海術と砲術を学び始めた。古い身分にこだわるか、実力ある人材を育てるか。",
            choices: [
                {
                    opinionChange: -5,
                    text: "広く門戸を開き、伝習を進める",
                    effectDesc: "志士『勝海舟』を獲得。最大HP+2、次の戦闘の攻撃力+2。",
                    action: (app) => {
                        app.addCardToDeck("katsu_kaishu");
                        app.maxHp += 2;
                        app.hp += 8;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 2;
                    }
                },
                {
                    opinionChange: -5,
                    text: "海軍総奉行・永井尚志のもと海防費を増やし、新式艦砲と銃陣を整える",
                    effectDesc: "志士『永井尚志』を獲得。『新式ミニエ銃』をデッキに加えるが、列強介入+7%。",
                    action: (app) => {
                        app.addCardToDeck("nagai_retreat");
                        app.addCardToDeck("weapon_minie");
                        app.modifyImperialGauge(7);
                    }
                },
                {
                    opinionChange: 5,
                    text: "諸藩へ知識を持ち帰る",
                    effectDesc: "志士『佐久間象山』を獲得。40両を得て、列強介入-3%。",
                    action: (app) => {
                        app.addCardToDeck("sakuma_gunnery");
                        app.gold += 20;
                        app.modifyImperialGauge(-3);
                    }
                }
            ]
        },
        {
            id: "event_kobe_training",
            act: 1,
            importance: 1,
            title: "神戸海軍操練所、海援隊の夢",
            desc: "勝海舟の構想のもと、身分を越えた若者たちが海軍術を学ぶ。幕府の枠内に留めるか、新しい航路へ出るか。",
            choices: [
                {
                    opinionChange: -5,
                    text: "勝海舟の教えを受け、航海術を磨く",
                    effectDesc: "志士『勝海舟』を獲得。HPを 4 回復し、次の戦闘の攻撃力+2。",
                    action: (app) => {
                        app.addCardToDeck("katsu_kaishu");
                        app.healPlayer(4);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 2;
                    }
                },
                {
                    opinionChange: 5,
                    text: "密かに海外交易を始める",
                    effectDesc: "志士『岩崎弥太郎』を獲得。20両を得るが、列強介入+7%。",
                    action: (app) => {
                        app.addCardToDeck("iwazaki_finance");
                        app.gold += 20;
                        app.modifyImperialGauge(7);
                    }
                },
                {
                    opinionChange: 5,
                    text: "【討幕派】海援隊・陸援隊の同志と共に、海防の基盤を築く",
                    effectDesc: "志士『中岡慎太郎』を獲得。HPを 4 回復し、列強介入-3%。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("nakaoka_mediator");
                        app.healPlayer(4);
                        app.modifyImperialGauge(-3);
                    }
                },
                {
                    opinionChange: -5,
                    text: "【佐幕派】軍艦奉行・木村芥舟と共に幕府直轄の操練体制を確立する",
                    effectDesc: "志士『木村芥舟』を獲得。HPを 4 回復し、15両を得る。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("kimura_navy");
                        app.healPlayer(4);
                        app.gold += 15;
                    }
                }
            ]
        },
        {
            id: "event_charter_oath",
            act: 2,
            importance: 3,
            title: "五箇条の御誓文、新政の誓い",
            desc: "新政府の基本方針を示す誓文が掲げられた。広く議論を集めるか、強い指導力で改革を急ぐか。",
            choices: [
                {
                    opinionChange: 12,
                    text: "万機公論に決し、仲間の声を集める",
                    effectDesc: "志士『福岡孝弟』を獲得。最大HP+3、HPを 8 回復する。",
                    action: (app) => {
                        app.addCardToDeck("fukuoka_drafting");
                        app.maxHp += 3;
                        app.hp += 5;
                    }
                },
                {
                    opinionChange: 12,
                    text: "改革を急ぎ、中央の力を強める",
                    effectDesc: "志士『桂小五郎』を獲得。次の戦闘の攻撃力+4、列強介入+20%。",
                    action: (app) => {
                        app.addCardToDeck("katsura_shindo");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                        app.modifyImperialGauge(20);
                    }
                },
                {
                    opinionChange: 12,
                    text: "諸外国へ新政府の方針を示す",
                    effectDesc: "志士『大隈重信』を獲得。列強介入-5%、30両を得る。",
                    action: (app) => {
                        app.addCardToDeck("okuma_modernization");
                        app.modifyImperialGauge(-5);
                        app.gold += 30;
                    }
                }
            ]
        },
        {
            id: "event_ii_successor",
            act: 1,
            importance: 2,
            title: "桜田門外後、揺れる幕府",
            desc: "大老を失った幕府では、次の政権をめぐる議論が割れている。公武合体か、強権的な統制か、政局の針路を選ぶ時だ。",
            choices: [
                {
                    opinionChange: 8,
                    text: "公武合体を進め、朝廷との融和を図る",
                    effectDesc: "志士『横井小楠』を獲得。列強介入-4%、HPを 6 回復する。",
                    action: (app) => {
                        app.addCardToDeck("yokoi_philosophy");
                        app.modifyImperialGauge(-4);
                        app.healPlayer(6);
                    }
                },
                {
                    opinionChange: -8,
                    text: "強硬論を退け、幕政の刷新を訴える",
                    effectDesc: "志士『松平春嶽』を獲得。次の戦闘の攻撃力+3、最大HP+3。",
                    action: (app) => {
                        app.addCardToDeck("shungaku_council");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.maxHp += 3;
                        app.hp += 3;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】商人と結び、政局を支える資金を得る",
                    effectDesc: "志士『原市之進』を獲得。25両を得る。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("hara_counsel");
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】幕府の動揺を好機と捉え、尊攘の密使を走らせる",
                    effectDesc: "志士『品川弥二郎』を獲得。25両を得る。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("shinagawa_signal");
                        app.gold += 25;
                    }
                }
            ]
        },
        {
            id: "event_satcho_protocol",
            act: 2,
            importance: 3,
            historicalAdvantage: "tobaku",
            title: "薩長盟約、倒幕の密議",
            desc: "薩摩と長州の代表が、互いの疑念を越えて密かに手を結ぼうとしている。連携を急ぐか、兵力を蓄えるか。",
            choices: [
                {
                    opinionChange: 12,
                    text: "【討幕派】盟約を結び、共同作戦を整える",
                    effectDesc: "志士『桂小五郎』を獲得。『薩長同盟の密約』をデッキに加え、次の戦闘の攻撃力+4。",
                    faction: "tobaku",
                    isHistorical: true,
                    riskCategory: "orthodox",
                    action: (app) => {
                        app.addCardToDeck("katsura_shindo");
                        app.addCardToDeck("satcho_secret");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: 25,
                    text: "【佐幕派・歴史の抗い】密偵を放ち同盟を妨害、西郷の懐柔を謀る",
                    effectDesc: "志士『西郷隆盛』を獲得。しかし敵陣営巨魁懐柔の強烈な代償により、HPを 35 失い、最大HP-8。味方の猜疑により世論討幕+25%（大逆風）、呪い『家臣の寝返り』が混入！",
                    faction: "sabaku",
                    isHistorical: false,
                    riskCategory: "defiance",
                    action: (app) => {
                        app.addCardToDeck("saigo_jigen");
                        app.addCardToDeck("curse_betrayal");
                        app.damagePlayer(35);
                        app.maxHp = Math.max(20, app.maxHp - 8);
                        app.gold += 30;
                    }
                },
                {
                    opinionChange: 12,
                    text: "【共通】列強に援助を求め、最新銃器を調達する",
                    effectDesc: "志士『広沢真臣』を獲得。『新式ミニエ銃』をデッキに加えるが、列強介入+20%。",
                    riskCategory: "intrigue",
                    action: (app) => {
                        app.addCardToDeck("hirosawa_alliance");
                        app.addCardToDeck("weapon_minie");
                        app.modifyImperialGauge(20);
                    }
                },
                {
                    opinionChange: -5,
                    text: "【佐幕派】同盟の動向を警戒しつつ、幕府直轄軍の兵糧を蓄える",
                    effectDesc: "志士は獲得できないが、軍資金50両を得て、HPを 12 回復する。",
                    faction: "sabaku",
                    isHistorical: true,
                    riskCategory: "safe",
                    action: (app) => {
                        app.gold += 50;
                        app.healPlayer(12);
                    }
                }
            ]
        },
        {
            id: "event_edo_opening",
            act: 2,
            importance: 3,
            title: "江戸開城前夜、最後の評議",
            desc: "江戸の町を戦火に巻き込むか、城を明け渡して人々を救うか。夜更けの評議で、最後の決断が迫られている。",
            mapShishiRequirement: {
                tobaku: ["saigo", "okubo"],
                sabaku: ["katsu", "oguri"]
            },
            choices: [
                {
                    opinionChange: -12,
                    text: "【佐幕派】主戦派の小栗忠順と共に最後の評議を尽くす",
                    effectDesc: "志士『小栗忠順』を獲得。HPを 8 回復し、列強介入-5%。",
                    faction: "sabaku",
                    shishiBonus: [
                        {
                            character: "oguri",
                            desc: "小栗忠順の軍政財政眼！軍資金+100両、最大HP+5＆完全回復！",
                            apply: (app) => {
                                app.gold += 100;
                                app.maxHp += 5;
                                app.hp = app.maxHp;
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("oguri_reform");
                        app.hp = app.maxHp;
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    opinionChange: 12,
                    text: "【討幕派】西郷の使節として徳川の恭順を静かに見届ける",
                    effectDesc: "志士『大久保利通』を獲得。HPを 8 回復し、列強介入-5%。",
                    faction: "tobaku",
                    shishiBonus: [
                        {
                            character: "okubo",
                            desc: "大久保利通の遠謀深慮！世論討幕+25%、列強介入-15%！",
                            apply: (app) => {
                                app.modifyPublicOpinion(25);
                                app.modifyImperialGauge(-15);
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.hp = app.maxHp;
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    opinionChange: 12,
                    text: "抗戦派を説得し、武器を接収する",
                    effectDesc: "志士『山県有朋』を獲得。次の戦闘の攻撃力+4、30両を得る。",
                    shishiBonus: [
                        {
                            character: "yamagata",
                            desc: "奇兵隊仕込みの軍政手腕！次戦攻撃力+8、軍資金+50両！",
                            apply: (app) => {
                                app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 8;
                                app.gold += 50;
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("yamagata_march");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                        app.gold += 30;
                    }
                },
                {
                    opinionChange: 12,
                    text: "商人を保護し、江戸の経済を維持する",
                    effectDesc: "志士『大隈重信』を獲得。30両を得る。",
                    shishiBonus: [
                        {
                            character: "okuma",
                            desc: "大隈重信の近代経済構想！軍資金+80両、レリック『最新式の算盤』を獲得！",
                            apply: (app) => {
                                app.gold += 80;
                                app.obtainRelic("modern_abacus");
                            }
                        }
                    ],
                    action: (app) => {
                        app.addCardToDeck("okuma_modernization");
                        app.gold += 30;
                    }
                },
                {
                    opinionChange: 20,
                    requiredShishi: ["katsu"],
                    text: "🌟【勝海舟 限定】西郷隆盛との直談判（江戸城無血開城の成立）",
                    effectDesc: "百万の江戸庶民を戦火から救い、完全無血開城を完遂！HP完全回復、世論安定（介入度-30%）、軍資金150両、神器レリック『海軍卿の望遠鏡』を獲得！",
                    action: (app) => {
                        app.hp = app.maxHp;
                        app.modifyImperialGauge(-30);
                        app.gold += 150;
                        app.obtainRelic("admiral_telescope");
                    }
                }
            ]
        },
        {
            id: "event_teradaya_conflict",
            act: 1,
            importance: 2,
            title: "寺田屋騒動、同士討ちの夜",
            desc: "寺田屋に集まった志士たちの意見が割れ、刀を抜く者まで現れた。仲間をまとめるか、決起を急ぐか。",
            choices: [
                {
                    opinionChange: -8,
                    text: "説得を続け、同士討ちを止める",
                    effectDesc: "志士『有馬新七』を獲得。同士討ちを止め説得に努めるも過激派は鎮圧され世論逆風。HPを 6 回復し、列強介入-4%。",
                    action: (app) => {
                        app.addCardToDeck("arima_revolt");
                        app.healPlayer(6);
                        app.modifyImperialGauge(-4);
                    }
                },
                {
                    opinionChange: -8,
                    text: "決起を急ぎ、敵の不意を突く",
                    effectDesc: "志士『吉井友実』を獲得。決起を急ぐも鎮撫使に阻まれHPを 26 失うが次の戦闘の攻撃力+3。",
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.damagePlayer(26);
                    }
                },
                {
                    opinionChange: -8,
                    text: "資金を分けて仲間を逃がす",
                    effectDesc: "志士『田中新兵衛』を獲得。逆風の中35両を支払い仲間を逃がす、最大HP+3。資金不足時は選択不可。",
                    costGold: 35,
                    canChoose: (app) => app.gold >= 35,
                    action: (app) => {
                        app.addCardToDeck("tanaka_assassin");
                        app.gold -= 35;
                        app.maxHp += 3;
                        app.hp += 6;
                    }
                },
                {
                    opinionChange: -8,
                    faction: "sabaku",
                    text: "【佐幕派】島津久光の命を受けた鎮撫使として過激派を制圧し、公武合体の秩序を守る",
                    effectDesc: "志士『松平春嶽：公議の守り』を獲得。HPを 6 回復し、軍資金 30両 を得る。",
                    action: (app) => {
                        app.addCardToDeck("shungaku_council");
                        app.healPlayer(6);
                        app.gold += 30;
                    }
                }
            ]
        },
        {
            id: "event_nagasaki_magistrate",
            act: 1,
            importance: 1,
            title: "長崎奉行所、異国との窓口",
            desc: "長崎奉行所に異国船の報告と交易の要求が届いた。情報を集めて備えるか、港を閉じて緊張を高めるか。",
            choices: [
                {
                    opinionChange: -5,
                    text: "通詞から異国の情報を集める",
                    effectDesc: "志士『水野忠徳』を獲得。『新式ミニエ銃』をデッキに加えるが、列強介入+7%。",
                    action: (app) => {
                        app.addCardToDeck("mizuno_magistrate");
                        app.addCardToDeck("weapon_minie");
                        app.modifyImperialGauge(7);
                    }
                },
                {
                    opinionChange: -5,
                    text: "港の警備を固め、海防を優先する",
                    effectDesc: "志士『永井尚志』を獲得。最大HP+2、次の戦闘の攻撃力+2。",
                    action: (app) => {
                        app.addCardToDeck("nagai_retreat");
                        app.maxHp += 2;
                        app.hp += 8;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 2;
                    }
                },
                {
                    opinionChange: 5,
                    text: "交易を許可し、財源を確保する",
                    effectDesc: "志士『五代友厚』を獲得。25両を得るが、列強介入+7%。",
                    action: (app) => {
                        app.addCardToDeck("godai_commerce");
                        app.gold += 25;
                        app.modifyImperialGauge(7);
                    }
                }
            ]
        },
        {
            id: "event_satsuma_trade",
            act: 1,
            importance: 1,
            year: 1851,
            month: 2,
            title: "薩摩藩の富国強兵、黒糖の財源",
            desc: "島津斉彬の下、南国の産物と密貿易で蓄えた財源をもとに、洋式兵器を導入する計画が進む。国力を増す一手か、危険な一手か。",
            choices: [
                {
                    opinionChange: 5,
                    text: "交易を進め、洋式兵器を買い付ける",
                    effectDesc: "志士『小松帯刀』を獲得。『新式ミニエ銃』をデッキに加えるが、列強介入+7%。",
                    action: (app) => {
                        app.addCardToDeck("komatsu_coordination");
                        app.addCardToDeck("weapon_minie");
                        app.modifyImperialGauge(7);
                    }
                },
                {
                    opinionChange: 5,
                    text: "国内産業を育て、時間をかける",
                    effectDesc: "志士『吉井友実』を獲得。60両を得て、最大HP+2。",
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.gold += 20;
                        app.maxHp += 2;
                        app.hp += 5;
                    }
                },
                {
                    opinionChange: 5,
                    text: "密約を破棄し、主権を守る",
                    effectDesc: "志士『伊地知正治』を獲得。列強介入-3%、HPを 4 回復する。",
                    action: (app) => {
                        app.addCardToDeck("ijichi_command");
                        app.modifyImperialGauge(-3);
                        app.healPlayer(4);
                    }
                }
            ]
        },
        {
            id: "event_yokoi_reform",
            act: 2,
            importance: 2,
            title: "横井小楠、国是の建白",
            desc: "実学を重んじる改革案が評議の場に提出された。諸藩の利害を越えて、国全体の仕組みを作れるか。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["yokoi_philosophy"],
                    opinionChange: 8,
                    text: "【🕊️ 生存ルート】京都寺町丸太町の辻で襲撃された横井小楠の前に躍り出て、刺客の凶刃を打ち払う",
                    effectDesc: "【生存ルート】志士『横井小楠』を救出！HP 30 ダメージを受けるが、横井は生存確定となり以降もデッキで使用可能！",
                    action: (app) => {
                        app.markShishiSurvived("yokoi_philosophy");
                        if (!app.deck.includes("yokoi_philosophy")) app.addCardToDeck("yokoi_philosophy");
                        app.damagePlayer(30);
                    }
                },

                {
                    opinionChange: 8,
                    text: "各地の事情を優先し、改革を急がない",
                    effectDesc: "志士『江藤新平』を獲得。25両を得る。",
                    action: (app) => {
                        app.addCardToDeck("eto_reform");
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】坂本龍馬と共に改革案を取り入れ、新国家の青写真を描く",
                    effectDesc: "志士『坂本龍馬』を獲得。次の戦闘の攻撃力+3、HPを 26 失う。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("ryoma_kaiwentai");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.damagePlayer(26);
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】越前藩主・松平春嶽の幕政改革を支え、公議政体を模索する",
                    effectDesc: "志士『松平春嶽』を獲得。HPを 6 回復し、列強介入-4%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("shungaku_council");
                        app.healPlayer(6);
                        app.modifyImperialGauge(-4);
                    }
                }
            ]
        },
        {
            id: "event_byakkotai_sortie",
            act: 3,
            importance: 3,
            title: "白虎隊、飯盛山の出陣",
            desc: "若い兵たちが城下を守るために出陣する。彼らを前線へ送るか、守備に残して町を支えるか。",
            choices: [
                {
                    opinionChange: -12,
                    text: "若き兵を前線へ送り出す",
                    effectDesc: "『松平容保：会津の義気』をデッキに加えるが、HPを 38 失う。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("aizu_shield");
                        app.damagePlayer(38);
                    }
                },
                {
                    opinionChange: -12,
                    text: "城下の守備を固める",
                    effectDesc: "志士『山川大蔵』を獲得。最大HP+3、次の戦闘の攻撃力+4。",
                    action: (app) => {
                        app.addCardToDeck("yamakawa_cavalry");
                        app.maxHp += 3;
                        app.hp += 9;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: -12,
                    text: "民を避難させ、被害を抑える",
                    effectDesc: "志士『佐川官兵衛』を獲得。列強介入-5%、40両を支払う。",
                    costGold: 40,
                    canChoose: (app) => app.gold >= 40,
                    action: (app) => {
                        app.addCardToDeck("sagawa_cavalry");
                        app.gold -= 40;
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    opinionChange: 12,
                    faction: "tobaku",
                    text: "【討幕派】新式銃隊で戸ノ口原の防衛線を電撃突破し、一気に鶴ヶ城下へ進撃する",
                    effectDesc: "志士『伊地知正治：薩摩の軍議』を獲得。HPを 20 失うが、軍資金 35両 を得て次の戦闘の攻撃力+3。",
                    action: (app) => {
                        app.addCardToDeck("ijichi_command");
                        app.damagePlayer(20);
                        app.gold += 35;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                }
            ]
        },
        {
            id: "event_hakodate_government",
            act: 3,
            importance: 2,
            title: "箱館政権、北辺の評議",
            desc: "五稜郭に集まった旧幕府軍が、新しい政権の形を議論している。海軍を頼るか、陸の守りを固めるか。",
            choices: [
                {
                    opinionChange: -8,
                    text: "海軍を整え、海上防衛を固める",
                    effectDesc: "志士『榎本武揚』と志士『甲賀源吾』を獲得。列強介入+12%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("enomoto_naval");
                        app.addCardToDeck("koga_naval");
                        app.modifyImperialGauge(12);
                    }
                },
                {
                    opinionChange: -8,
                    text: "法と議会を整え、民心を集める",
                    effectDesc: "志士『大鳥圭介』を獲得。最大HP+3、列強介入-4%。",
                    action: (app) => {
                        app.addCardToDeck("otori_strategy");
                        app.maxHp += 3;
                        app.hp += 8;
                        app.modifyImperialGauge(-4);
                    }
                },
                {
                    opinionChange: -8,
                    text: "最後の決戦に備え、遊撃隊の兵糧を買う",
                    effectDesc: "志士『伊庭八郎』を獲得。70両を支払うが、次の戦闘の攻撃力+3。資金が足りない場合は選択不可。",
                    costGold: 70,
                    canChoose: (app) => app.gold >= 70,
                    action: (app) => {
                        app.addCardToDeck("iba_duel");
                        app.gold -= 70;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                }
            ]
        },
        {
            id: "event_tenpo_reform",
            act: 1,
            importance: 1,
            title: "天保の改革、倹約の号令",
            desc: "幕府が倹約と統制を掲げ、改革の号令を発した。厳しい規律で国を立て直すか、商いの力を活かすか。",
            choices: [
                {
                    opinionChange: -5,
                    text: "倹約を徹底し、国庫を立て直す",
                    effectDesc: "志士『松平春嶽』を獲得。50両を得て、列強介入-3%。",
                    action: (app) => {
                        app.addCardToDeck("shungaku_council");
                        app.gold += 20;
                        app.modifyImperialGauge(-3);
                    }
                },
                {
                    opinionChange: 5,
                    text: "商人の力を借り、産業を育てる",
                    effectDesc: "志士『横井小楠』を獲得。最大HP+2、20両を得るが、列強介入+7%。",
                    action: (app) => {
                        app.addCardToDeck("yokoi_philosophy");
                        app.maxHp += 2;
                        app.hp += 7;
                        app.gold += 20;
                        app.modifyImperialGauge(7);
                    }
                },
                {
                    opinionChange: -5,
                    text: "民の負担を減らし、反発を抑える",
                    effectDesc: "志士『阿部正弘』を獲得。HPを 4 回復するが、25両を失う。",
                    action: (app) => {
                        app.addCardToDeck("abe_defense");
                        app.healPlayer(4);
                        app.gold = Math.max(0, app.gold - 25);
                    }
                }
            ]
        },
        {
            id: "event_foreign_ship_edict",
            act: 1,
            importance: 1,
            year: 1842,
            month: 7,
            title: "異国船打払令の見直し、薪水給与令",
            desc: "アヘン戦争の衝撃を受け、幕府は無二念打払令の撤廃と薪水給与令への転換を迫られた。強硬攘夷か、開明海防か、国家の方針を選ぶ。",
            choices: [
                {
                    opinionChange: 5,
                    text: "打ち払いを徹底し、強硬な態度を示す",
                    effectDesc: "志士『有馬新七』を獲得。HPを 16 失うが、次の戦闘の攻撃力+2。",
                    action: (app) => {
                        app.addCardToDeck("arima_revolt");
                        app.damagePlayer(16);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 2;
                    }
                },
                {
                    opinionChange: 5,
                    text: "海防の備えを固め、隙を見せない",
                    effectDesc: "志士『佐久間象山』を獲得。次の戦闘の攻撃力+2、最大HP+2。",
                    action: (app) => {
                        app.addCardToDeck("sakuma_gunnery");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 2;
                        app.maxHp += 2;
                        app.hp += 3;
                    }
                },
                {
                    opinionChange: 5,
                    text: "【討幕派】打ち払いの無謀を説き、海防の真の道を説く",
                    effectDesc: "志士『吉田松陰』を獲得。列強介入-3%、HPを 4 回復する。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("yoshida_teaching");
                        app.modifyImperialGauge(-3);
                        app.healPlayer(4);
                    }
                },
                {
                    opinionChange: -5,
                    text: "【佐幕派】幕閣と協調し、薪水給与令による柔軟な海防政策への転換を図る",
                    effectDesc: "志士『阿部正弘』を獲得。30両を得て、列強介入-3%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("abe_defense");
                        app.gold += 15;
                        app.modifyImperialGauge(-3);
                    }
                }
            ]
        },
        {
            id: "event_satsuma_after_teradaya",
            act: 1,
            importance: 3,
            title: "寺田屋騒動後、薩摩の粛清",
            desc: "藩内の急進派を抑えるため、薩摩では厳しい処分が検討されている。秩序を守るか、志士をかばうか。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["arima_revolt"],
                    opinionChange: 10,
                    text: "【🕊️ 生存ルート】寺田屋の同士討ちに割って入り、有馬新七を裏階段から強引に脱出させる",
                    effectDesc: "【生存ルート】志士『有馬新七』を救出！HP 30 ダメージを受けるが、有馬は生存確定となり以降もデッキで使用可能！",
                    action: (app) => {
                        app.markShishiSurvived("arima_revolt");
                        if (!app.deck.includes("arima_revolt")) app.addCardToDeck("arima_revolt");
                        app.damagePlayer(30);
                    }
                },
                {
                    opinionChange: -12,
                    text: "藩の命に従い、統制を強める",
                    effectDesc: "志士『大久保利通』を獲得。公武合体派の統制強化に従い世論逆風、列強介入-5%、最大HP+3。",
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.modifyImperialGauge(-5);
                        app.maxHp += 3;
                        app.hp += 5;
                    }
                },
                {
                    opinionChange: -12,
                    text: "志士を逃がし、再起の道を残す",
                    effectDesc: "志士『西郷隆盛』を獲得。西郷配流の苦難、軍資金70両拠出・HP 32喪失・最大HP-10、呪い『幕府指名手配』混入。資金不足時は最大HP-14。次戦攻撃力+4。",
                    action: (app) => {
                        app.addCardToDeck("saigo_jigen");
                        app.addCardToDeck("curse_bounty");
                        if (app.gold >= 50) {
                            app.gold -= 50;
                            app.maxHp = Math.max(20, app.maxHp - 10);
                        } else {
                            app.maxHp = Math.max(20, app.maxHp - 10);
                        }
                        app.damagePlayer(45);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: -12,
                    text: "両者を説得し、処分を延期する",
                    effectDesc: "志士『吉井友実』を獲得。処分の延期に奔走し35両支払いHP 8回復するが尊攘派後退。資金不足時は選択不可。",
                    costGold: 35,
                    canChoose: (app) => app.gold >= 35,
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.gold -= 35;
                        app.healPlayer(8);
                    }
                },
                {
                    opinionChange: -12,
                    faction: "sabaku",
                    text: "【佐幕派】島津久光の軍勢と共に江戸へ下り、幕閣に公武合体の幕政改革を認めさせる",
                    effectDesc: "志士『松平春嶽：公議の守り』を獲得。軍資金 40両 を得て、最大HP+3。",
                    action: (app) => {
                        app.addCardToDeck("shungaku_council");
                        app.gold += 40;
                        app.maxHp += 3;
                        app.hp += 6;
                    }
                }
            ]
        },
        {
            id: "event_tokyo_capital",
            act: 3,
            importance: 1,
            title: "東京遷都、新しい都の建設",
            desc: "新政府は都を東へ移し、国の中心を作り直そうとしている。政治の集中か、各地との均衡か。",
            choices: [
                {
                    opinionChange: 5,
                    text: "新都へ政務を集め、改革を急ぐ",
                    effectDesc: "志士『大久保利通』を獲得。最大HP+2、次の戦闘の攻撃力+2。",
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.maxHp += 2;
                        app.hp += 10;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 2;
                    }
                },
                {
                    opinionChange: 5,
                    text: "旧都との協調を保ち、文化を守る",
                    effectDesc: "志士『三条実美』を獲得。列強介入-3%、HPを 4 回復する。",
                    action: (app) => {
                        app.addCardToDeck("sanjo_court");
                        app.modifyImperialGauge(-3);
                        app.healPlayer(4);
                    }
                },
                {
                    opinionChange: 5,
                    text: "都市整備に資金を投じる",
                    effectDesc: "志士『後藤象二郎』を獲得。70両を支払い、次の戦闘の攻撃力+2。資金が足りない場合は選択不可。",
                    costGold: 70,
                    canChoose: (app) => app.gold >= 70,
                    action: (app) => {
                        app.addCardToDeck("goto_political_drive");
                        app.gold -= 70;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 2;
                    }
                }
            ]
        },
        {
            id: "event_kanagawa_treaty",
            act: 1,
            importance: 2,
            title: "日米和親条約、開港の選択",
            desc: "鎖国の扉をわずかに開く条約が提示された。港を開いて国力を蓄えるか、異国の圧力に抗うか。",
            choices: [
                {
                    opinionChange: -8,
                    text: "港を開き、交易の道を作る",
                    effectDesc: "志士『阿部正弘』を獲得。30両を得るが、列強介入+12%。",
                    action: (app) => {
                        app.addCardToDeck("abe_defense");
                        app.gold += 30;
                        app.modifyImperialGauge(12);
                    }
                },
                {
                    opinionChange: 8,
                    text: "限定的に受け入れ、情報を集める",
                    effectDesc: "志士『佐久間象山』を獲得。列強介入-4%、最大HP+3。",
                    action: (app) => {
                        app.addCardToDeck("sakuma_gunnery");
                        app.modifyImperialGauge(-4);
                        app.maxHp += 3;
                        app.hp += 5;
                    }
                },
                {
                    opinionChange: -8,
                    text: "条約を拒み、海防を固める",
                    effectDesc: "志士『松平春嶽』を獲得。次の戦闘の攻撃力+3、HPを 26 失う。",
                    action: (app) => {
                        app.addCardToDeck("shungaku_council");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.damagePlayer(26);
                    }
                }
            ]
        },
        {
            id: "event_ansei_earthquake",
            act: 1,
            importance: 2,
            title: "安政江戸地震、復興の灯",
            desc: "大地震で江戸の町が大きな被害を受けた。兵を救援へ回すか、蓄えを守るか、混乱の中で判断を迫られる。",
            choices: [
                {
                    opinionChange: -8,
                    text: "救援隊を送り、町を立て直す",
                    effectDesc: "志士『勝海舟』を獲得。復興・海防基金として45両を拠出し、HPを 15 失い、最大HP-5。資金が足りない場合は選択不可。",
                    costGold: 80,
                    canChoose: (app) => app.gold >= 80,
                    action: (app) => {
                        app.addCardToDeck("katsu_kaishu");
                        app.gold -= 80;
                        app.maxHp = Math.max(20, app.maxHp - 5);
                        app.damagePlayer(26);
                    }
                },
                {
                    opinionChange: 8,
                    text: "兵站を守り、戦力を温存する",
                    effectDesc: "志士『佐久間象山』を獲得。次の戦闘の攻撃力+3、25両を得る。",
                    action: (app) => {
                        app.addCardToDeck("sakuma_gunnery");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: -8,
                    text: "民に食料を配り、騒乱を抑える",
                    effectDesc: "志士『永井尚志』を獲得。HPを 6 回復し、列強介入-4%。",
                    action: (app) => {
                        app.addCardToDeck("nagai_retreat");
                        app.healPlayer(6);
                        app.modifyImperialGauge(-4);
                    }
                }
            ]
        },
        {
            id: "event_sanjo_council",
            act: 1,
            importance: 2,
            title: "参与会議、諸侯の評議",
            desc: "朝廷と諸侯が集まり、幕府と列強への対応を話し合う。強硬策か、合議による安定か。",
            choices: [
                {
                    opinionChange: -8,
                    text: "合議を重ね、諸侯の協力を得る",
                    effectDesc: "志士『松平春嶽』を獲得。列強介入-4%、HPを 6 回復する。",
                    action: (app) => {
                        app.addCardToDeck("shungaku_council");
                        app.modifyImperialGauge(-4);
                        app.healPlayer(6);
                    }
                },
                {
                    opinionChange: 8,
                    text: "強硬論を掲げ、主導権を握る",
                    effectDesc: "志士『山内容堂』を獲得。次の戦闘の攻撃力+3、HPを 26 失う。",
                    action: (app) => {
                        app.addCardToDeck("yodo_political_balance");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.damagePlayer(26);
                    }
                },
                {
                    opinionChange: 8,
                    text: "議場を商談の場に変える",
                    effectDesc: "志士『小松帯刀』を獲得。30両を得るが、列強介入+12%。",
                    action: (app) => {
                        app.addCardToDeck("komatsu_coordination");
                        app.gold += 30;
                        app.modifyImperialGauge(12);
                    }
                }
            ]
        },
        {
            id: "event_nagaoka_defense",
            act: 3,
            importance: 2,
            title: "長岡城攻防、ガトリングの轟音",
            desc: "長岡城をめぐる攻防で、最新兵器と旧来の武士道がぶつかる。城を守るか、反撃のために兵を温存するか。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["kawai_artillery"],
                    opinionChange: -8,
                    costGold: 35,
                    text: "【🕊️ 生存ルート】八十里越えの退却途上で河井継之助の被弾傷に最新西洋外科手術を施し一命を救う",
                    effectDesc: "【生存ルート】志士『河井継之助』を救出！軍資金 35両 とHP 20 を消費（資金不足時は不足分HPを追加消費）し、河井は生存確定となりデッキに残留！",
                    action: (app) => {
                        app.markShishiSurvived("kawai_artillery");
                        if (!app.deck.includes("kawai_artillery")) app.addCardToDeck("kawai_artillery");
                        const spendGold = Math.min(app.gold, 35);
                        const shortage = 35 - spendGold;
                        app.gold -= spendGold;
                        app.damagePlayer(20 + shortage);
                    }
                },

                {
                    opinionChange: 8,
                    text: "【討幕派】新政府軍の近代火砲陣地を展開し、堅陣を攻略する",
                    effectDesc: "志士『山県有朋』を獲得。HPを 26 失うが、次の戦闘の攻撃力+3。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("yamagata_march");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: 8,
                    text: "八丁沖の湿地を迂回し、敵の背後を突く",
                    effectDesc: "志士『前原一誠』を獲得。25両を得る。",
                    action: (app) => {
                        app.addCardToDeck("maebara_charge");
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: 8,
                    text: "城下の町人を保護し、北越戦線の補給路を確保する",
                    effectDesc: "志士『黒田清隆』を獲得。HPを 6 回復し、列強介入-4%。",
                    action: (app) => {
                        app.addCardToDeck("kuroda_frontier");
                        app.healPlayer(6);
                        app.modifyImperialGauge(-4);
                    }
                }
            ]
        },
        {
            id: "event_satsuma_students",
            act: 2,
            importance: 2,
            title: "薩摩藩英国留学生、海を越える",
            desc: "若き藩士たちを密かに英国へ送り、造船や砲術を学ばせる計画が立てられた。目先の兵力か、未来への投資か。",
            choices: [
                {
                    opinionChange: 8,
                    text: "留学生を送り、未来の知識を得る",
                    effectDesc: "志士『小松帯刀』を獲得。列強介入-4%、最大HP+3。",
                    action: (app) => {
                        app.addCardToDeck("komatsu_coordination");
                        app.modifyImperialGauge(-4);
                        app.maxHp += 3;
                        app.hp += 8;
                    }
                },
                {
                    opinionChange: -8,
                    text: "旅費を兵器購入に回す",
                    effectDesc: "志士『川村純義』を獲得。『アームストロング砲』をデッキに加えるが、列強介入+12%。",
                    action: (app) => {
                        app.addCardToDeck("kawamura_navy");
                        app.addCardToDeck("weapon_armstrong");
                        app.modifyImperialGauge(12);
                    }
                },
                {
                    opinionChange: 8,
                    text: "藩内の教育を優先する",
                    effectDesc: "志士『吉井友実』を獲得。45両を得て、カードを1枚引く機会を得る。",
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.gold += 25;
                        app.healPlayer(6);
                    }
                }
            ]
        },
        {
            id: "event_kobe_incident",
            act: 2,
            importance: 2,
            title: "神戸事件、外交の緊張",
            desc: "新政府軍と外国人の間で衝突が起き、港町に緊張が走った。謝罪して事態を収めるか、国の威信を示すか。",
            choices: [
                {
                    opinionChange: 8,
                    text: "外交官を立て、穏便に収める",
                    effectDesc: "志士『伊藤博文』を獲得。列強介入-4%、60両を支払う。",
                    costGold: 60,
                    canChoose: (app) => app.gold >= 60,
                    action: (app) => {
                        app.addCardToDeck("ito_diplomat");
                        app.gold -= 60;
                        app.modifyImperialGauge(-4);
                    }
                },
                {
                    opinionChange: 8,
                    text: "軍を前に出し、威信を守る",
                    effectDesc: "志士『吉井友実』を獲得。次の戦闘の攻撃力+3、列強介入+12%。",
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.modifyImperialGauge(12);
                    }
                },
                {
                    opinionChange: 8,
                    text: "交易を続け、港の利益を守る",
                    effectDesc: "志士『岩崎弥太郎』を獲得。30両を得るが、列強介入+12%。",
                    action: (app) => {
                        app.addCardToDeck("iwazaki_finance");
                        app.gold += 30;
                        app.modifyImperialGauge(12);
                    }
                }
            ]
        },
        {
            id: "event_shinchogumi",
            act: 1,
            importance: 1,
            title: "新徴組、江戸の治安維持",
            desc: "江戸の町を守るため、新たな治安組織の編成が進められている。厳しい規律か、町人との協力か。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["kiyokawa_leader"],
                    opinionChange: -5,
                    text: "【🕊️ 生存ルート】麻布一の橋の刺客急襲を事前に察知し、清河八郎を護衛して血路を開く",
                    effectDesc: "【生存ルート】志士『清河八郎』を救出！HP 30 ダメージを受けるが、清河は生存確定となり以降もデッキで使用可能！",
                    action: (app) => {
                        app.markShishiSurvived("kiyokawa_leader");
                        if (!app.deck.includes("kiyokawa_leader")) app.addCardToDeck("kiyokawa_leader");
                        app.damagePlayer(30);
                    }
                },

                {
                    opinionChange: -5,
                    text: "【佐幕派】見廻組頭・佐々木只三郎と共に江戸の治安維持にあたる",
                    effectDesc: "志士『佐々木只三郎』を獲得。20両を得る。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("sasaki_patrol");
                        app.gold += 20;
                    }
                },
                {
                    opinionChange: 5,
                    text: "【討幕派】江戸の町名主と連携し、幕府の治安網を掻い潜る",
                    effectDesc: "志士『品川弥二郎』を獲得。20両を得る。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("shinagawa_signal");
                        app.gold += 20;
                    }
                },
                {
                    opinionChange: -5,
                    text: "幕府の軍備費を配分し、隊士の装備を近代化する",
                    effectDesc: "志士『小栗忠順』を獲得。HPを 4 回復し、列強介入-3%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("oguri_reform");
                        app.healPlayer(4);
                        app.modifyImperialGauge(-3);
                    }
                }
            ]
        },
        {
            id: "event_aizu_surrender",
            act: 3,
            importance: 2,
            title: "会津藩降伏、城下の朝",
            desc: "長い籠城の末、会津は降伏を決断する。戦いを終わらせるか、最後まで抗うか。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["kayano_sacrifice"],
                    opinionChange: -5,
                    costGold: 40,
                    text: "【🕊️ 生存ルート】新政府軍参謀へ直談判し、家老・萱野権兵衛の殉難切腹を助命して会津復興の任へ就かせる",
                    effectDesc: "【生存ルート】志士『萱野権兵衛』を救出し生存確定！軍資金 40両 を消費（不足時はHP代替）し、萱野は生存確定となる。",
                    action: (app) => {
                        app.markShishiSurvived("kayano_sacrifice");
                        if (!app.deck.includes("kayano_sacrifice")) app.addCardToDeck("kayano_sacrifice");
                        const spendGold = Math.min(app.gold, 40);
                        const shortage = 40 - spendGold;
                        app.gold -= spendGold;
                        if (shortage > 0) app.damagePlayer(shortage);
                    }
                },
                {
                    opinionChange: -8,
                    text: "降伏を受け入れ、民の命を守る",
                    effectDesc: "志士『秋月悌次郎』を獲得。HPを 6 回復し、列強介入-4%。",
                    action: (app) => {
                        app.addCardToDeck("akizuki_strategy");
                        app.hp = app.maxHp;
                        app.modifyImperialGauge(-4);
                    }
                },
                {
                    opinionChange: -8,
                    text: "最後の一戦に全てを賭ける",
                    effectDesc: "志士『佐川官兵衛』を獲得。次の戦闘の攻撃力+3、HPを 26 失う。",
                    action: (app) => {
                        app.addCardToDeck("sagawa_cavalry");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.damagePlayer(26);
                    }
                },
                {
                    opinionChange: -8,
                    text: "城下の復興資金を残し、家老・西郷頼母と共に藩の誇りを守る",
                    effectDesc: "志士『西郷頼母』を獲得。50両を支払い、最大HP+3。資金が足りない場合は選択不可。",
                    costGold: 50,
                    canChoose: (app) => app.gold >= 50,
                    action: (app) => {
                        app.addCardToDeck("saigo_tanomo_defense");
                        app.gold -= 50;
                        app.maxHp += 3;
                        app.hp += 10;
                    }
                },
                {
                    opinionChange: 8,
                    faction: "tobaku",
                    text: "【討幕派】会津城の開城を受け入れ、将兵を保護して奥羽越の戦乱を終結させる",
                    effectDesc: "志士『大久保利通：冷徹な謀略』を獲得。HPを 8 回復し、軍資金 35両 を獲得する。",
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.healPlayer(8);
                        app.gold += 35;
                    }
                }
            ]
        },
        {
            id: "event_august_coup",
            act: 1,
            importance: 2,
            title: "八月十八日の政変、都の転換",
            desc: "朝廷内の主導権が一夜にして入れ替わり、長州勢は京を追われた。政変に抗うか、次の機会を待つか。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【討幕派】都に残り、尊攘派の失地回復を図る",
                    effectDesc: "志士『久坂玄瑞』を獲得。政変で都を追われる逆風の中、失地回復を図りHPを 26 失うが次の戦闘の攻撃力+3。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("kusaka_revolt");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: -8,
                    text: "七卿落ちに従い、長州へ再起の道を求める",
                    effectDesc: "志士『三条実美』を獲得。都落ちの逆風の中、長州へ再起を期して40両を得て、HPを 6 回復する。",
                    action: (app) => {
                        app.addCardToDeck("sanjo_court");
                        app.gold += 25;
                        app.healPlayer(6);
                    }
                },
                {
                    opinionChange: -8,
                    text: "【討幕派】諸侯へ密書を送り、公武合体派の結束を揺さぶる",
                    effectDesc: "志士『真木和泉』を獲得。公武合体派の結束を揺さぶる密書を送り列強介入-4%、25両を得るが都は佐幕派が掌握。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("maki_revolt");
                        app.modifyImperialGauge(-4);
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】京都守護職・会津藩兵と新選組を指揮し、御所九門を厳重封鎖する",
                    effectDesc: "志士『松平容保：会津の義気』を獲得。御所死守の激闘によりHPを 25 失い、最大HP-5。世論佐幕+30%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("aizu_shield");
                        app.maxHp = Math.max(20, app.maxHp - 5);
                        app.damagePlayer(26);
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】中川宮の令旨を奉じ、都の尊攘過激派を一掃して秩序を回復する",
                    effectDesc: "志士『斎藤一』を獲得。次の戦闘の攻撃力+3、25両を得る。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("saito_gato");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.gold += 25;
                    }
                }
            ]
        },
        {
            id: "event_omiya_assassination",
            act: 2,
            importance: 2,
            title: "近江屋事件、盟友の喪失",
            desc: "京都の宿で、時代を動かした志士が襲撃を受けた。悲しみを力に変えるか、身を隠して計画を守るか。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["ryoma_kaiwentai","nakaoka_mediator"],
                    opinionChange: 0,
                    text: "【🕊️ 生存ルート】二階奥の間へ急行し、刺客の白刃を身を挺して受け止め龍馬と慎太郎を救出する",
                    effectDesc: "【生存ルート】志士『坂本龍馬』と『中岡慎太郎』を救出！HP 38 ダメージを受けるが、両名は生存確定となり以降もデッキで使用可能！",
                    action: (app) => {
                        app.markShishiSurvived("ryoma_kaiwentai");
                        if (!app.deck.includes("ryoma_kaiwentai")) app.addCardToDeck("ryoma_kaiwentai");
                        app.markShishiSurvived("nakaoka_mediator");
                        if (!app.deck.includes("nakaoka_mediator")) app.addCardToDeck("nakaoka_mediator");
                        app.damagePlayer(38);
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】海援隊・陸援隊の仇を討つべく、敵の拠点へ踏み込む",
                    effectDesc: "志士『田中光顕』を獲得。HPを 26 失うが、次の戦闘の攻撃力+3。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("tanaka_intelligence");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】龍馬・中岡の遺志を継ぎ、武力討幕の軍勢を整える",
                    effectDesc: "志士『板垣退助』を獲得。HPを 6 回復し、次の戦闘の攻撃力+3。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("itagaki_charge");
                        app.healPlayer(6);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】京都見廻組を率い、近江屋の不穏分子を急襲する",
                    effectDesc: "志士『佐々木只三郎』を獲得。HPを 26 失うが、次の戦闘の攻撃力+3。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("sasaki_patrol");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: 8,
                    text: "現場を調査し、残された遺品を回収する",
                    effectDesc: "志士『後藤象二郎』を獲得。25両を得る。",
                    action: (app) => {
                        app.addCardToDeck("goto_political_drive");
                        app.gold += 25;
                    }
                }
            ]
        },
        {
            id: "event_kaiyo_maru",
            act: 3,
            importance: 2,
            title: "開陽丸沈没、海軍の試練",
            desc: "最新鋭の艦が海に沈み、北辺の戦力が大きく揺らいだ。残った船を守るか、陸上の防衛へ力を移すか。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【佐幕派】回天艦長・甲賀源吾と共に救助隊を出し物資を回収する",
                    effectDesc: "志士『甲賀源吾』を獲得。HPを 6 回復し、25両を得る。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("koga_naval");
                        app.healPlayer(6);
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】新政府陸海軍の警戒網を広げ、敵残存戦力を封鎖する",
                    effectDesc: "志士『山田顕義』を獲得。HPを 6 回復し、25両を得る。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("yamada_modern_army");
                        app.healPlayer(6);
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: 8,
                    text: "陸上砲台を強化し、港の防備を固める",
                    effectDesc: "志士『黒田清隆』を獲得。次の戦闘の攻撃力+3、HPを 26 失う。",
                    action: (app) => {
                        app.addCardToDeck("kuroda_frontier");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.damagePlayer(26);
                    }
                },
                {
                    opinionChange: -8,
                    text: "榎本武揚と合流し、作戦を立て直す",
                    effectDesc: "志士『榎本武揚』を獲得。列強介入-4%、HPを 6 回復する。",
                    action: (app) => {
                        app.addCardToDeck("enomoto_naval");
                        app.modifyImperialGauge(-4);
                        app.healPlayer(6);
                    }
                }
            ]
        },
        {
            id: "event_iba_hachiro",
            act: 2,
            importance: 2,
            title: "箱根山崎の激闘、隻腕の小天狗",
            desc: "心形刀流の美剣士・伊庭八郎率いる幕府遊撃隊が、箱根の天険にて立ち塞がる。左手に重傷を負いながらも白刃を閃かせるその凄絶な気魄に、何を託すか。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【佐幕派】心形刀流の極意で小田原藩兵を圧倒し、箱根関所を制圧する",
                    effectDesc: "志士『伊庭八郎』を獲得。HPを 26 失うが、次回戦闘の攻撃力+3。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("iba_duel");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】箱根の険路を制し、小田原口の東山道軍本隊と合流する",
                    effectDesc: "志士『板垣退助』を獲得。HPを 26 失うが、次回戦闘の攻撃力+3。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("itagaki_charge");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】遊撃隊頭・人見勝太郎と共に本道から奇襲を仕掛け、敵陣を攪乱する",
                    effectDesc: "志士『人見勝太郎』を獲得。HPを 26 失うが、次回戦闘の攻撃力+3。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("hitomi_katsutaro");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: 0,
                    text: "深手を負った兵の手当てを行い、陣備えを整える",
                    effectDesc: "HPを 6 回復し、25両を得る。",
                    action: (app) => {
                        app.healPlayer(6);
                        app.gold += 25;
                    }
                }
            ]
        },
        {
            id: "event_ippongi_kanmon",
            act: 3,
            importance: 3,
            title: "一本木関門の激闘、土方歳三の突進",
            desc: "箱館総攻撃の苛烈な砲火の中、弁天台場に孤立した同志を救うべく土方歳三が馬を駆る。「我この柵にありて退く者を斬らん！」と叫ぶ鬼の副長の気魄に、何を応えるか。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["hijikata_fukucho"],
                    opinionChange: -10,
                    text: "【🕊️ 生存ルート】一本木関門の激戦で銃撃を受けた土方歳三を即座に馬から抱き起こし野戦病院へ搬送する",
                    effectDesc: "【生存ルート】志士『土方歳三』を救出！HP 38 ダメージを受けるが、鬼の副長・土方歳三は奇跡的に生還し生存確定！",
                    action: (app) => {
                        app.markShishiSurvived("hijikata_fukucho");
                        if (!app.deck.includes("hijikata_fukucho")) app.addCardToDeck("hijikata_fukucho");
                        app.damagePlayer(38);
                    }
                },

                {
                    opinionChange: 12,
                    text: "【討幕派】一本木関門を突破し、箱館五稜郭へ総攻撃を仕掛ける",
                    effectDesc: "志士『黒田清隆』を獲得。HPを 38 失うが、次回戦闘の攻撃力+4。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("kuroda_frontier");
                        app.damagePlayer(38);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: -12,
                    text: "弁天台場の新選組隊士を救出し、防衛線を再編する",
                    effectDesc: "志士『島田魁』を獲得。HPを 8 回復し、30両を得る。",
                    action: (app) => {
                        app.addCardToDeck("shimada_kai");
                        app.healPlayer(8);
                        app.gold += 30;
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】遊撃隊の銃撃で援護し、退路を切り開く",
                    effectDesc: "志士『伊庭八郎』を獲得。HPを 38 失うが、次回戦闘の攻撃力+4。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("iba_duel");
                        app.damagePlayer(38);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                }
            ]
        },
        {
            id: "event_jousai_rebellion",
            act: 3,
            importance: 2,
            title: "請西藩の義挙、唯一の脱藩大名",
            desc: "徳川の恩義に報いるため、請西藩主・林忠崇は領民を戦火から守るべく自ら藩主の座を捨てて脱藩した。遊撃隊を率いて北へ転戦するその覚悟に、どう応じるか。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【佐幕派】脱藩藩主の武士道に共鳴し、共に旗を掲げて転戦する",
                    faction: "sabaku",
                    effectDesc: "志士『林忠崇』を獲得。次の戦闘の攻撃力+3、列強介入-4%。",
                    action: (app) => {
                        app.addCardToDeck("hayashi_last_stand");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.modifyImperialGauge(-4);
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】東山道軍本隊と連携し、房総・木更津の反乱を早期に平定する",
                    faction: "tobaku",
                    effectDesc: "志士『板垣退助』を獲得。最大HP+3、HPを 6 回復する。",
                    action: (app) => {
                        app.addCardToDeck("itagaki_charge");
                        app.maxHp += 3;
                        app.hp += 8;
                    }
                },
                {
                    opinionChange: -8,
                    text: "遊撃隊頭・人見勝太郎と合流し、ゲリラ戦の連携をとる",
                    effectDesc: "志士『人見勝太郎』を獲得。40両を得て、次の戦闘の攻撃力+3。",
                    action: (app) => {
                        app.addCardToDeck("hitomi_katsutaro");
                        app.gold += 25;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                }
            ]
        },
        {
            id: "event_ouetsu_alliance",
            act: 3,
            importance: 3,
            title: "奥羽越列藩同盟、白石の盟約",
            desc: "東国の平和と会津・庄内の赦免を願い、奥羽越の諸藩が白石城に集結した。桑名藩主・松平定敬や会津藩主・松平容保ら東軍諸侯の結束に加わるか。",
            choices: [
                {
                    opinionChange: -12,
                    text: "白石城の列藩会議に参集し、同盟の盟主を支える",
                    effectDesc: "志士『秋月悌次郎』を獲得。HPを 8 回復し、列強介入-5%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("akizuki_strategy");
                        app.healPlayer(8);
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    opinionChange: -12,
                    text: "会津・桑名の高須兄弟と義盟を結び、結束を固める",
                    effectDesc: "志士『松平容保：会津の義気』を獲得。HPを 8 回復し、30両を得る。",
                    action: (app) => {
                        app.addCardToDeck("aizu_shield");
                        app.healPlayer(8);
                        app.gold += 30;
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】北越・長岡藩の砲術隊と連携し、火器陣地を構築する",
                    effectDesc: "志士『河井継之助』を獲得。HPを 38 失うが、次回戦闘の攻撃力+4。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("kawai_artillery");
                        app.damagePlayer(38);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: 12,
                    text: "【討幕派】奥羽諸藩の結束を分断し、新政府軍の進路を切り開く",
                    effectDesc: "志士『桂小五郎』を獲得。50両を得て、列強介入-5%。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("katsura_shindo");
                        app.gold += 30;
                        app.modifyImperialGauge(-5);
                    }
                }
            ]
        },
        {
            id: "event_hakodate_hospital",
            act: 3,
            importance: 1,
            title: "箱館病院の仁術、松本良順の赤十字",
            desc: "幕府奥医師・松本良順が箱館の野戦病院にて敵味方の別なく負傷兵を治療している。「仁術に敵味方なし」という至誠の志に、どう向き合うか。",
            choices: [
                {
                    opinionChange: -5,
                    text: "負傷兵の治療を手伝い、人道主義の医術を支える",
                    effectDesc: "志士『松本良順』を獲得。HPを 4 回復し、最大HP+2。",
                    action: (app) => {
                        app.addCardToDeck("matsumoto_medicine");
                        app.healPlayer(4);
                        app.maxHp += 2;
                        app.hp += 6;
                    }
                },
                {
                    opinionChange: -5,
                    text: "箱館脱走軍の軍規と編成を統制し、組織の士気を高める",
                    effectDesc: "志士『大鳥圭介』を獲得。列強介入-3%、20両を得る。",
                    action: (app) => {
                        app.addCardToDeck("otori_strategy");
                        app.modifyImperialGauge(-3);
                        app.gold += 20;
                    }
                },
                {
                    opinionChange: -5,
                    text: "海軍総裁・榎本武揚と合流し、補給線を確保する",
                    effectDesc: "志士『榎本武揚』を獲得。60両を得て、次の戦闘の攻撃力+2。",
                    action: (app) => {
                        app.addCardToDeck("enomoto_naval");
                        app.gold += 20;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 2;
                    }
                }
            ]
        },
        {
            id: "event_mibu_drill",
            act: 1,
            importance: 1,
            title: "壬生屯所の教練、甲州軍学の指南",
            desc: "壬生の屯所にて、軍学師範・武田観柳斎が隊士たちに甲州流軍学を指南している。規律と実戦の狭間で、隊のあり方をどう整えるか。",
            choices: [
                {
                    opinionChange: -5,
                    text: "副長・武田観柳斎の甲州流軍学を学び、陣形を整える",
                    effectDesc: "志士『武田観柳斎』を獲得。HPを 4 回復し、列強介入-3%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("takeda_strategy");
                        app.healPlayer(4);
                        app.modifyImperialGauge(-3);
                    }
                },
                {
                    opinionChange: -5,
                    text: "総長・山南敬助の温情論に耳を傾け、隊士の結束を重んじる",
                    effectDesc: "志士『山南敬助』を獲得。HPを 4 回復し、20両を得る。",
                    action: (app) => {
                        app.addCardToDeck("sannan_tactics");
                        app.healPlayer(4);
                        app.gold += 20;
                    }
                },
                {
                    opinionChange: -5,
                    text: "【佐幕派】局長・近藤勇の天然理心流の稽古に加わり、剣技を研ぎ澄ます",
                    effectDesc: "志士『近藤勇』を獲得。骨をも砕く天然理心流の荒稽古によりHPを 28 失い、最大HP-3。次回戦闘の攻撃力+2。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("kondo_kotetsu");
                        app.maxHp = Math.max(20, app.maxHp - 3);
                        app.damagePlayer(16);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 2;
                    }
                },
                {
                    opinionChange: 5,
                    text: "【討幕派】壬生周辺の警戒網を探り、新選組の動向を薩摩藩邸へ急報する",
                    effectDesc: "志士『吉井友実』を獲得。HPを 4 回復し、20両を得る。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.healPlayer(4);
                        app.gold += 20;
                    }
                }
            ]
        },
        {
            id: "event_kyoto_shugoshoku_office",
            act: 1,
            importance: 1,
            title: "京都守護職、公用方の政務",
            desc: "黒谷・金戒光明寺の守護職本陣にて、会津藩の公用方が都の治安維持と諸藩の調停に奔走している。藩屏の忠誠をどう支えるか。",
            choices: [
                {
                    opinionChange: -5,
                    text: "守護職・松平容保の信任厚い松平信敬と共に諸藩の周旋に奔走する",
                    effectDesc: "志士『松平信敬』を獲得。HPを 4 回復し、列強介入-3%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("matsudaira_nobu_guard");
                        app.healPlayer(4);
                        app.modifyImperialGauge(-3);
                    }
                },
                {
                    opinionChange: -5,
                    text: "【佐幕派】公用方・野村左兵衛と共に諸藩との外交工作を進める",
                    effectDesc: "志士『野村左兵衛』を獲得。20両を得る。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("nomura_defense");
                        app.gold += 20;
                    }
                },
                {
                    opinionChange: -5,
                    text: "秋月悌次郎と語り合い、天下の大局を見据えた策を練る",
                    effectDesc: "志士『秋月悌次郎』を獲得。HPを 4 回復し、20両を得る。",
                    action: (app) => {
                        app.addCardToDeck("akizuki_strategy");
                        app.healPlayer(4);
                        app.gold += 20;
                    }
                },
                {
                    opinionChange: 5,
                    text: "【討幕派】都に潜伏する岩倉具視らと密かに接触し、守護職の警戒網をかわす",
                    effectDesc: "志士『岩倉具視』を獲得。40両を得て、列強介入-3%。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("iwakura_imperial");
                        app.gold += 20;
                        app.modifyImperialGauge(-3);
                    }
                }
            ]
        },
        {
            id: "event_aburakoji",
            act: 2,
            importance: 2,
            title: "油小路の変、訣別の刃",
            desc: "新選組から分離した御陵衛士と新選組本隊が、油小路の辻で激突した。かつての同志たちの交錯する信念に、どう向き合うか。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["ito_kasshitaro","todo_heisuke"],
                    opinionChange: 0,
                    text: "【🕊️ 生存ルート】油小路の暗闘に割って入り、新選組の包囲を切り裂いて伊東甲子太郎と藤堂平助を救出する",
                    effectDesc: "【生存ルート】志士『伊東甲子太郎』と『藤堂平助』を救出！HP 35 ダメージを受けるが、両名は生存確定となり以降もデッキで使用可能！",
                    action: (app) => {
                        app.markShishiSurvived("ito_kasshitaro");
                        if (!app.deck.includes("ito_kasshitaro")) app.addCardToDeck("ito_kasshitaro");
                        app.markShishiSurvived("todo_heisuke");
                        if (!app.deck.includes("todo_heisuke")) app.addCardToDeck("todo_heisuke");
                        app.damagePlayer(35);
                    }
                },

                {
                    opinionChange: -8,
                    text: "脱出を図る鈴木三樹三郎らを援護し、薩摩藩邸へ逃れる",
                    effectDesc: "志士『鈴木三樹三郎』を獲得。御陵衛士壊滅の逆風の中、薩摩藩邸へ脱出を援護しHPを 6 回復、25両を得る。",
                    action: (app) => {
                        app.addCardToDeck("suzuki_patrol");
                        app.healPlayer(6);
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】十番隊組長・原田左之助の猛槍に加勢し、隊律を貫く",
                    effectDesc: "志士『原田左之助』を獲得。HPを 26 失うが、次回戦闘の攻撃力+3。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("harada_spear");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                }
            ]
        },
        {
            id: "event_seiheitai",
            act: 2,
            importance: 2,
            title: "靖兵隊の結成、不抜の誓い",
            desc: "甲州勝沼の敗戦後、永倉新八と原田左之助は徳川への義を貫くため新選組を離れ「靖兵隊」を結成した。真の武士道を掲げる二人に加わるか。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【佐幕派】彰義隊から脱陣し、日光山でのゲリラ抗戦を決意する",
                    effectDesc: "志士『原田左之助』を獲得。HPを 26 失うが、次回戦闘の攻撃力+3。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("harada_spear");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: -8,
                    text: "永倉新八の神道無念流の剛剣と共に戦線を立て直す",
                    effectDesc: "志士『永倉新八』を獲得。HPを 6 回復し、20両を得る。",
                    action: (app) => {
                        app.addCardToDeck("nagakura_bushin");
                        app.healPlayer(6);
                        app.gold += 20;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】日光口へ進軍し、遊撃隊頭・人見勝太郎ら旧幕軍と合流する",
                    effectDesc: "志士『人見勝太郎』を獲得。25両を得る。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("hitomi_katsutaro");
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】日光口の新政府追撃軍を指揮し、旧幕残党の集結を阻止する",
                    effectDesc: "志士『大村益次郎』を獲得。次回戦闘の攻撃力+3、25両を得る。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("omura_reform");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.gold += 25;
                    }
                }
            ]
        },
        {
            id: "event_ueno_war",
            act: 2,
            importance: 3,
            title: "上野戦争、彰義隊の死守",
            desc: "江戸城開城の後、徳川の義に殉ぜんと彰義隊が上野・寛永寺の山に集結した。新政府軍の総攻撃が迫る黒門口の激戦に、何を期するか。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["harada_spear"],
                    opinionChange: -8,
                    text: "【🕊️ 生存ルート】寛永寺黒門口の砲煙をかいくぐり、重傷の原田左之助を担ぎ出して安全圏へ離脱する",
                    effectDesc: "【生存ルート】志士『原田左之助』を救出！HP 35 ダメージを受けるが、原田は生存確定となり以降もデッキで使用可能！",
                    action: (app) => {
                        app.markShishiSurvived("harada_spear");
                        if (!app.deck.includes("harada_spear")) app.addCardToDeck("harada_spear");
                        app.damagePlayer(35);
                    }
                },

                {
                    opinionChange: -12,
                    text: "遊撃隊の阿部十郎と連携し、ゲリラ戦で敵の側面を衝く",
                    effectDesc: "志士『阿部十郎』を獲得。次の戦闘の攻撃力+4、25両を得る。",
                    action: (app) => {
                        app.addCardToDeck("abe_juro_tactics");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: -12,
                    text: "高橋泥舟の説得に応じ、残存兵力を北へ退避させる",
                    effectDesc: "志士『高橋泥舟』を獲得。HPを 8 回復し、列強介入-5%。",
                    action: (app) => {
                        app.addCardToDeck("takahashi_guard");
                        app.healPlayer(8);
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    opinionChange: 12,
                    faction: "tobaku",
                    text: "【討幕派】大村益次郎の精密砲撃作戦に従い、アームストロング砲で黒門口の防衛線を粉砕する",
                    effectDesc: "志士『山田顕義：近代軍の礎』を獲得し、デッキに『アームストロング砲』を追加。HPを 26 失うが次の戦闘の攻撃力+4。",
                    action: (app) => {
                        app.addCardToDeck("yamada_modern_army");
                        app.addCardToDeck("weapon_armstrong");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                }
            ]
        },
        {
            id: "event_okita_dojo",
            act: 1,
            importance: 3,
            title: "新選組屯所、沖田総司の指南",
            desc: "壬生屯所の道場にて、一番隊組長・沖田総司の竹刀が風を裂く。「刀は突くべし」と笑う天才剣士の稽古に、どう挑むか。",
            choices: [
                {
                    opinionChange: -12,
                    text: "【佐幕派】天然理心流の極意・無双三段突きの指導を受ける",
                    faction: "sabaku",
                    effectDesc: "志士『沖田総司』を獲得。鬼気迫る死線稽古によりHPを 30 失い、最大HP-10（喀血の戦慄）。次の戦闘攻撃力+4。",
                    action: (app) => {
                        app.addCardToDeck("okita_sandan");
                        app.maxHp = Math.max(20, app.maxHp - 10);
                        app.damagePlayer(38);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: 12,
                    text: "【討幕派】道場の太刀筋を冷静に見極め、神道無念流の剣技で対抗する",
                    faction: "tobaku",
                    effectDesc: "志士『桂小五郎』を獲得。新選組の追撃をかわす極限の逃走によりHPを 20 失い、最大HP-10。次回攻撃力+4。",
                    action: (app) => {
                        app.addCardToDeck("katsura_shindo");
                        app.maxHp = Math.max(20, app.maxHp - 10);
                        app.damagePlayer(38);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: -12,
                    text: "護衛隊士・佐々木愛次郎と共に道場の防備を固める",
                    effectDesc: "志士『佐々木愛次郎』を獲得。最大HP+3、HPを 8 回復する。",
                    action: (app) => {
                        app.addCardToDeck("sasaki_escort");
                        app.maxHp += 3;
                        app.hp += 10;
                    }
                }
            ]
        },
        {
            id: "event_koshu_katsunuma",
            act: 2,
            importance: 2,
            title: "甲州勝沼の戦い、甲陽鎮撫隊の進撃",
            desc: "江戸を救うため、近藤勇・土方歳三らは「甲陽鎮撫隊」として甲州へ急行した。勝沼の地で新政府軍と激突する試衛館の勇士たちにどう応えるか。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【佐幕派】虎徹を握る近藤勇の陣頭指揮に従い、敵本陣へ突進する",
                    effectDesc: "志士『近藤勇』を獲得。HPを 26 失うが、次回戦闘の攻撃力+3。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("kondo_kotetsu");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】十番隊組長・原田左之助の猛槍と共に側面の敵兵を蹴散らす",
                    effectDesc: "志士『原田左之助』を獲得。30両を得て、次回戦闘の攻撃力+3。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("harada_spear");
                        app.gold += 20;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】板垣退助率いる東山道先鋒総督軍と共に甲州街道を進撃する",
                    effectDesc: "志士『板垣退助』を獲得。30両を得て、次回戦闘の攻撃力+3。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("itagaki_charge");
                        app.gold += 20;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: -8,
                    text: "山岡鉄舟の使者と連携し、軍を整然と退却させて無血開城の道を探る",
                    effectDesc: "志士『山岡鉄舟』を獲得。HPを 6 回復し、列強介入-4%。",
                    action: (app) => {
                        app.addCardToDeck("yamaoka_surrender");
                        app.healPlayer(6);
                        app.modifyImperialGauge(-4);
                    }
                }
            ]
        },
        {
            id: "event_kuwana_kashiwazaki",
            act: 2,
            importance: 2,
            title: "桑名藩の決断、柏崎の奮戦",
            desc: "鳥羽伏見を脱した桑名藩主・松平定敬が越後・柏崎に陣を敷く。名将・立見尚文率いる雷神隊とともに、北越の山野で義戦に臨む。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【佐幕派】桑名藩主・松平定敬の本陣を守り、不抜の盾となる",
                    faction: "sabaku",
                    effectDesc: "志士『松平定敬』を獲得。最大HP+3、HPを 6 回復する。",
                    action: (app) => {
                        app.addCardToDeck("sadaakira_guard");
                        app.maxHp += 3;
                        app.hp += 12;
                    }
                },
                {
                    opinionChange: -8,
                    text: "雷神隊長・立見尚文の電撃奇襲に加わり、敵軍の背後を突く",
                    effectDesc: "志士『立見尚文』を獲得。次の戦闘の攻撃力+3、25両を得る。",
                    action: (app) => {
                        app.addCardToDeck("tatsumi_naobumi");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: -8,
                    text: "会津公用方・秋月悌次郎と連携し、北越同盟軍の軍資補給を整える",
                    effectDesc: "志士『秋月悌次郎』を獲得。列強介入-4%、HPを 6 回復する。",
                    action: (app) => {
                        app.addCardToDeck("akizuki_strategy");
                        app.modifyImperialGauge(-4);
                        app.healPlayer(6);
                    }
                },
                {
                    opinionChange: 8,
                    faction: "tobaku",
                    text: "【討幕派】新政府北陸道軍として柏崎へ進軍し、越後街道の要衝を確保する",
                    effectDesc: "志士『黒田了介：北辺の開拓』を獲得。HPを 20 失うが、軍資金 30両 を獲得する。",
                    action: (app) => {
                        app.addCardToDeck("kuroda_frontier");
                        app.damagePlayer(20);
                        app.gold += 30;
                    }
                }
            ]
        },
        {
            id: "event_aizu_higan_jishi",
            act: 3,
            importance: 2,
            title: "会津鶴ヶ城の奇策、彼岸獅子の入場",
            desc: "新政府軍に完全包囲された鶴ヶ城へ、山川大蔵率いる日光口守備隊が到着した。伝統芸能「彼岸獅子」を囃したて、敵の包囲陣を堂々と突破する！",
            choices: [
                {
                    opinionChange: -8,
                    text: "【佐幕派】獅子舞の音色に合わせ、山川大蔵と共に堂々と入城する",
                    faction: "sabaku",
                    effectDesc: "志士『山川大蔵』を獲得。最大HP+3、HPを 6 回復する。",
                    action: (app) => {
                        app.addCardToDeck("yamakawa_cavalry");
                        app.maxHp += 3;
                        app.hp += 15;
                    }
                },
                {
                    opinionChange: -8,
                    text: "城内の佐川官兵衛ら抜刀隊と呼応し、敵軍へ逆襲を仕掛ける",
                    effectDesc: "志士『佐川官兵衛』を獲得。次の戦闘の攻撃力+3、HPを 26 失う。",
                    action: (app) => {
                        app.addCardToDeck("sagawa_cavalry");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.damagePlayer(26);
                    }
                },
                {
                    opinionChange: -8,
                    text: "家老・萱野権兵衛と共に本丸防備を固め、藩主・容保公を死守する",
                    effectDesc: "志士『萱野権兵衛：会津の殉難』を獲得。50両を得て、列強介入-4%。",
                    action: (app) => {
                        app.addCardToDeck("kayano_sacrifice");
                        app.gold += 25;
                        app.modifyImperialGauge(-4);
                    }
                }
            ]
        },
        {
            id: "event_miyako_bay",
            act: 3,
            importance: 2,
            title: "宮古湾海戦、アポルダージュの奇襲",
            desc: "新政府軍の装甲艦「甲鉄」を奪取すべく、箱館海軍の「回天」が宮古湾へ突入した。甲賀源吾や土方歳三らが敢行する敵艦斬り込み作戦にどう参戦するか。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["koga_naval"],
                    opinionChange: -8,
                    text: "【🕊️ 生存ルート】甲鉄艦のガトリング掃射から回天艦長・甲賀源吾を身を挺して庇い操舵室へ押し戻す",
                    effectDesc: "【生存ルート】志士『甲賀源吾』を救出！HP 35 ダメージを受けるが、甲賀は生存確定となり以降もデッキで使用可能！",
                    action: (app) => {
                        app.markShishiSurvived("koga_naval");
                        if (!app.deck.includes("koga_naval")) app.addCardToDeck("koga_naval");
                        app.damagePlayer(35);
                    }
                },

                {
                    opinionChange: -8,
                    text: "【佐幕派】土方歳三率いる斬り込み抜刀隊を援護し、敵甲板を制圧する",
                    effectDesc: "志士『土方歳三』を獲得。次回戦闘の攻撃力+3、列強介入-4%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("hijikata_fukucho");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.modifyImperialGauge(-4);
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】甲鉄艦のガトリング砲で迎え撃ち、敵の奇襲を粉砕する",
                    effectDesc: "志士『川村純義』を獲得。次回戦闘の攻撃力+3、列強介入-4%。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("kawamura_navy");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.modifyImperialGauge(-4);
                    }
                },
                {
                    opinionChange: -8,
                    text: "榎本武揚の海軍作戦に従い、味方艦の退路を煙幕で確保する",
                    effectDesc: "志士『榎本武揚』を獲得。HPを 6 回復し、25両を得る。",
                    action: (app) => {
                        app.addCardToDeck("enomoto_naval");
                        app.healPlayer(6);
                        app.gold += 25;
                    }
                }
            ]
        },
        {
            id: "event_izo_assassination",
            act: 1,
            importance: 3,
            title: "京都暗殺風雲、人斬り以蔵の太刀",
            desc: "「天誅」の嵐が吹き荒れる京の都で、土佐勤王党の刺客・岡田以蔵の太刀が凶刃となって闇を裂く。冷徹な人斬りとして恐れられる剣客の前に、どう対峙するか。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["tanaka_assassin"],
                    opinionChange: 8,
                    text: "【🕊️ 生存ルート】町奉行所への連行を阻止し、自刃を止めさせて田中新兵衛を薩摩藩邸へ匿う",
                    effectDesc: "【生存ルート】志士『田中新兵衛』を救出！HP 28 ダメージを受けるが、新兵衛は生存確定となり以降もデッキで使用可能！",
                    action: (app) => {
                        app.markShishiSurvived("tanaka_assassin");
                        if (!app.deck.includes("tanaka_assassin")) app.addCardToDeck("tanaka_assassin");
                        app.damagePlayer(28);
                    }
                },
                {
                    opinionChange: 12,
                    text: "【討幕派】武市半平太の密命に応じ、天誅の刃で佐幕要人を討つ",
                    faction: "tobaku",
                    effectDesc: "志士『岡田以蔵』を獲得。HPを 38 失うが、次回戦闘の攻撃力+4。",
                    action: (app) => {
                        app.addCardToDeck("okada_izo");
                        app.damagePlayer(38);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】京都守護職・新選組の警戒網を強化し、刺客の襲撃を退ける",
                    faction: "sabaku",
                    effectDesc: "志士『近藤勇』を獲得。刺客との死闘によりHPを 28 失い、最大HP-10。次回戦闘の攻撃力+4。",
                    action: (app) => {
                        app.addCardToDeck("kondo_kotetsu");
                        app.maxHp = Math.max(20, app.maxHp - 10);
                        app.damagePlayer(38);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: 0,
                    text: "勝海舟の身辺警護を依頼し、その剛剣を人命救助のために生かす",
                    effectDesc: "志士『勝海舟』を獲得。操練所の警備資金70両を拠出し、最大HP-10。呪い『家臣の寝返り（内通）』混入。資金不足時は最大HP-12。",
                    action: (app) => {
                        app.addCardToDeck("katsu_kaishu");
                        app.addCardToDeck("curse_betrayal");
                        if (app.gold >= 60) {
                            app.gold -= 60;
                            app.maxHp = Math.max(20, app.maxHp - 10);
                        } else {
                            app.maxHp = Math.max(20, app.maxHp - 10);
                        }
                    }
                }
            ]
        },
        {
            id: "event_hyogo_armada",
            act: 2,
            importance: 2,
            title: "兵庫沖の連合艦隊、老中阿部正外の決断",
            desc: "英仏米蘭の四カ国連合艦隊が兵庫沖に来航し、条約勅許と兵庫早期開港を強硬に迫った。朝廷の頑迷な攘夷論と列強の砲艦外交に挟まれ、老中・阿部正外は幕府の命運を賭けた決断を迫られる。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【佐幕派】一身に責任を背負い、朝廷の勅許なき兵庫開港を独断で断行する",
                    faction: "sabaku",
                    effectDesc: "志士『阿部正外』を獲得。列強介入-4%、最大HP+3、HPを 6 回復する。",
                    action: (app) => {
                        app.addCardToDeck("abe_masato_policy");
                        app.modifyImperialGauge(-4);
                        app.maxHp += 3;
                        app.hp += 8;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】朝廷と結んで幕府の独断専横を弾劾し、幕閣を更迭に追い込む",
                    faction: "tobaku",
                    effectDesc: "志士『岩倉具視』を獲得。40両を得て、列強介入-4%。",
                    action: (app) => {
                        app.addCardToDeck("iwakura_imperial");
                        app.gold += 25;
                        app.modifyImperialGauge(-4);
                    }
                },
                {
                    opinionChange: 0,
                    text: "前政事総裁職・松平春嶽と連携し、将軍辞任の危機を防いで公武の調停を図る",
                    effectDesc: "志士『松平春嶽』を獲得。50両を得て、次回戦闘の攻撃力+3。",
                    action: (app) => {
                        app.addCardToDeck("shungaku_council");
                        app.gold += 25;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                }
            ]
        },
        {
            id: "event_tenguto_rising",
            act: 1,
            importance: 2,
            title: "水戸天狗党の挙兵、筑波山の義旗",
            desc: "水戸学の尊皇攘夷思想を掲げ、武田耕雲斎や藤田小四郎らが筑波山にて義旗を掲げた。幕府の専横を糾弾し、日光参拝を経て京都へ直訴せんとする一党の進軍に、天下の志士たちは何を思うか。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["takeda_kounsai"],
                    opinionChange: 10,
                    text: "【🕊️ 生存ルート】敦賀の降伏本陣を電撃急襲し、処刑前の武田耕雲斎を救出して越前山中へ退避させる",
                    effectDesc: "【生存ルート】志士『武田耕雲斎』を救出！HP 35 ダメージを受けるが、耕雲斎は生存確定となり以降もデッキで使用可能！",
                    action: (app) => {
                        app.markShishiSurvived("takeda_kounsai");
                        if (!app.deck.includes("takeda_kounsai")) app.addCardToDeck("takeda_kounsai");
                        app.damagePlayer(35);
                    }
                },

                {
                    opinionChange: -8,
                    text: "【佐幕派】水戸城下の混乱を収拾し、原市之進らと連携して治安を回復する",
                    faction: "sabaku",
                    effectDesc: "志士『原市之進』を獲得。HPを 6 回復し、25両を得る。",
                    action: (app) => {
                        app.addCardToDeck("hara_counsel");
                        app.healPlayer(6);
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: 0,
                    text: "天狗党の志を朝廷へ届けるため、都の公卿へ密書を運ぶ",
                    effectDesc: "志士『三条実美』を獲得。最大HP+3、HPを 6 回復する。",
                    action: (app) => {
                        app.addCardToDeck("sanjo_court");
                        app.maxHp += 3;
                        app.healPlayer(6);
                    }
                }
            ]
        },
        {
            id: "event_second_choshu_war",
            act: 2,
            importance: 3,
            title: "第二次長州征討、四境戦争の激闘",
            desc: "幕府は十四代将軍家茂自ら出陣し、四方より長州藩を取り囲む「四境戦争」が勃発した。幕府軍総勢10万に対し、近代兵制で武装した長州勢が乾坤一擲の反撃に出る。",
            choices: [
                {
                    opinionChange: 12,
                    text: "【討幕派】大村益次郎の陣図に従い、最新火器で幕府総軍を四境で撃破する",
                    effectDesc: "志士『大村益次郎』を獲得。弾薬消耗で軍資金60両拠出、列強介入+20%。世論討幕+35%、神器レリック『大村益次郎の陣図』を獲得！",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("omura_reform");
                        app.addRelic("omura_tactics_scroll");
                        app.gold = Math.max(0, app.gold - 70);
                        app.modifyImperialGauge(20);
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】小笠原長行と共に小倉口・長岡防衛線を死守し、猛火に耐える",
                    effectDesc: "志士『小笠原長行』を獲得。最新兵器の猛攻に晒されHPを 32 失い、最大HP-10。幕府軍備より軍資金 100両と『新式ミニエ銃』を獲得、世論佐幕+30%！",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("ogasawara_minister");
                        app.addCardToDeck("weapon_minie");
                        app.gold += 35;
                        app.maxHp = Math.max(20, app.maxHp - 10);
                        app.damagePlayer(38);
                    }
                },
                {
                    opinionChange: (app) => (app.faction === 'tobaku' ? -35 : 35),
                    text: "【共通】諸藩の疲弊を憂い、休戦交渉の周旋に奔走して流血を止める",
                    effectDesc: "両陣営の強硬派から裏切り者とみなされ呪い『家臣の寝返り』混入、自軍世論-25%（大逆風）。国力温存により最大HP+3、HP全回復、列強介入-5%。",
                    action: (app) => {
                        app.addCardToDeck("curse_betrayal");
                        app.maxHp += 3;
                        app.hp = app.maxHp;
                        app.modifyImperialGauge(-5);
                    }
                }
            ]
        },
        {
            id: "event_sekihotai_march",
            act: 2,
            importance: 2,
            title: "赤報隊の進軍、年貢半減の布告",
            desc: "鳥羽・伏見の勝報を受け、相楽総三率いる赤報隊が東山道先鋒として出陣した。『年貢半減』の大号令に信濃・東山道の民衆は熱狂するが、急進的な義挙に新政府軍本隊との不協和音も生じ始める。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["sagara_souzou"],
                    opinionChange: 10,
                    costGold: 30,
                    text: "【🕊️ 生存ルート】下諏訪宿の処刑場へ急行し、官軍使者を説得して相楽総三の処刑を中止させ身柄を引き取る",
                    effectDesc: "【生存ルート】志士『相楽総三』を救出！軍資金 30両 を支払い（不足時はHP代替）世論討幕+10%、相楽は生存確定となる。",
                    action: (app) => {
                        app.markShishiSurvived("sagara_souzou");
                        if (!app.deck.includes("sagara_souzou")) app.addCardToDeck("sagara_souzou");
                        const spendGold = Math.min(app.gold, 30);
                        const shortage = 30 - spendGold;
                        app.gold -= spendGold;
                        if (shortage > 0) app.damagePlayer(shortage);
                    }
                },

                {
                    opinionChange: -8,
                    text: "【佐幕派】甲陽鎮撫隊や遊撃隊と連携し、東山道・信濃の要衝と代官所を防備して旧幕秩序を守る",
                    faction: "sabaku",
                    effectDesc: "志士『人見勝太郎』を獲得。HPを 6 回復し、25両を得る。",
                    action: (app) => {
                        app.addCardToDeck("hitomi_katsutaro");
                        app.healPlayer(6);
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: -8,
                    text: "東山道軍の板垣退助と合流し、民衆の動揺を鎮めつつ兵站路の確保を急ぐ",
                    effectDesc: "志士『板垣退助』を獲得。偽官軍処刑の衝撃と民衆の不信・世論動揺の中、動揺を鎮めて兵站を確保。最大HP+3、HPを 6 回復する。",
                    action: (app) => {
                        app.addCardToDeck("itagaki_charge");
                        app.maxHp += 3;
                        app.healPlayer(6);
                    }
                }
            ]
        },
        {
            id: "event_paris_expo",
            act: 2,
            importance: 1,
            title: "パリ万国博覧会、海を越えた使節団",
            desc: "慶応三年、幕府は徳川昭武を代表とする使節団をパリ万国博覧会へ派遣した。会計役の渋沢栄一は西欧の株式会社制度や銀行に瞠目し、一方の薩長も独自の外交を展開。海を越えた大舞台で、日本の未来を巡る知略が交錯する。",
            choices: [
                {
                    opinionChange: -5,
                    text: "【佐幕派】西欧の合本組織と近代的金融制度を徹底調査し、幕府の財政基盤を強化する",
                    faction: "sabaku",
                    effectDesc: "志士『渋沢栄一』を獲得。50両を得て、列強介入度を 5% 下げる。",
                    action: (app) => {
                        app.addCardToDeck("shibusawa_eiichi");
                        app.gold += 20;
                        app.modifyImperialGauge(-3);
                    }
                },
                {
                    opinionChange: 5,
                    text: "【討幕派】独自の通商網を築き、近代兵器・物資の調達と新時代の国造りを目指す",
                    faction: "tobaku",
                    effectDesc: "志士『五代友厚』を獲得。20両を得る。",
                    action: (app) => {
                        app.addCardToDeck("godai_commerce");
                        app.gold += 20;
                    }
                },
                {
                    opinionChange: -5,
                    text: "フランスから近代造船・軍事技術を積極的に導入し、国防の近代化を推し進める",
                    effectDesc: "志士『小栗忠順』を獲得。30両を得て、シールド 10 を獲得。",
                    action: (app) => {
                        app.addCardToDeck("oguri_reform");
                        app.gold += 15;
                        if (window.app && window.app.battle) {
                            window.app.battle.gainPlayerShield(10);
                        }
                    }
                }
            ]
        },
        {
            id: "event_shimoda_smuggle",
            act: 1,
            importance: 2,
            title: "下田沖密航、松陰の投獄",
            desc: "下田港に停泊する米艦ポーハタン号へ、小舟で漕ぎ寄せた二人の青年がいた。吉田松陰と金子重之輔。国禁を犯してでも世界を見極めんとする魂に、どう応えるか。",
            choices: [
                {
                    opinionChange: 8,
                    text: "【討幕派】松陰の国禁突破の気概を讃え、獄中からの通信網を確保する",
                    effectDesc: "志士『吉田松陰』を獲得。HP 26 ダメージを受けるが、列強介入 -5%。",
                    faction: "tobaku",
                    shishiBonus: {
                        character: "shoin",
                        desc: "狂者の気概！被ダメージを半減し、次戦攻撃力+4！",
                        apply: (app) => {
                            app.healPlayer(13);
                            app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("yoshida_teaching");
                        app.damagePlayer(26);
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】法を厳格に執行し、国禁を破った密航者を捕縛・幽閉する",
                    effectDesc: "志士『水野忠徳』を獲得。軍資金 25両 を獲得し、HP を 6 回復する。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("mizuno_magistrate");
                        app.gold += 25;
                        app.healPlayer(6);
                    }
                },
                {
                    opinionChange: 0,
                    text: "密航の混乱に紛れ、異国船が残した洋書と最新の海図を回収する",
                    effectDesc: "『新式ミニエ銃』をデッキに加え、最大HP +2。列強介入 +7%。",
                    action: (app) => {
                        app.addCardToDeck("weapon_minie");
                        app.maxHp += 2;
                        app.modifyImperialGauge(7);
                    }
                }
            ]
        },
        {
            id: "event_sakashitamon",
            act: 1,
            importance: 2,
            title: "坂下門外の変、老中襲撃",
            desc: "和宮降嫁に憤る水戸脱藩浪士らが、江戸城坂下門外にて老中・安藤信正の駕籠を襲撃した。白昼の雪解け道に血煙が上がり、公武合体の行方に暗雲が垂れ込める。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【討幕派】浪士の義挙に呼応し、江戸城下の尊攘派ネットワークを拡大する",
                    effectDesc: "志士『武市半平太』を獲得。襲撃失敗と浪士壊滅により幕府取締りが厳重化し世論逆風。HP 26 ダメージを受けるが、次戦攻撃力 +3。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("takechi_ideology");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】老中を身を挺して護衛し、城内へ無事に退避させる",
                    effectDesc: "志士『阿部正弘』を獲得。HP を 6 回復し、軍資金 30両 を獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("abe_defense");
                        app.healPlayer(6);
                        app.gold += 30;
                    }
                },
                {
                    opinionChange: 0,
                    text: "混乱に乗じ、老中警護の手薄になった勘定所の機密書類を調査する",
                    effectDesc: "志士『水野忠徳』を獲得。軍資金 25両 を獲得、最大HP +2。",
                    action: (app) => {
                        app.addCardToDeck("mizuno_magistrate");
                        app.gold += 25;
                        app.maxHp += 2;
                    }
                }
            ]
        },
        {
            id: "event_gotenyama",
            act: 1,
            importance: 2,
            title: "御殿山焼き討ち、炎上の英国公使館",
            desc: "品川御殿山に建設中の英国公使館に、黒装束の長州志士たちが忍び寄る。高杉晋作、久坂玄瑞、井上馨、伊藤博文。夜空を赤く染める火の手が、攘夷の咆哮を告げる。",
            choices: [
                {
                    opinionChange: 8,
                    text: "【討幕派】高杉・久坂らと共に突入し、公使館を一気に焼き払う",
                    effectDesc: "志士『高杉晋作：奇兵隊の突進』を獲得。HP 26 ダメージを受けるが、次戦攻撃力 +4、列強介入 +10%。",
                    faction: "tobaku",
                    shishiBonus: {
                        character: "takasugi",
                        desc: "東行の突進！被ダメージを半減し、次戦攻撃力+2！",
                        apply: (app) => {
                            app.healPlayer(13);
                            app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 2;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("takasugi_kiheitai");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                        app.modifyImperialGauge(10);
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】伊藤・井上と共に後方支援に回り、最新の火薬と武器を奪取する",
                    effectDesc: "志士『伊藤博文』を獲得。『新式ミニエ銃』をデッキに加え、軍資金 20両 を獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("ito_diplomat");
                        app.addCardToDeck("weapon_minie");
                        app.gold += 20;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】火消しと町奉行所の同心を指揮し、延焼を防いで警戒態勢を敷く",
                    effectDesc: "志士『佐々木只三郎』を獲得。HP を 6 回復し、列強介入 -4%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("sasaki_patrol");
                        app.healPlayer(6);
                        app.modifyImperialGauge(-4);
                    }
                }
            ]
        },
        {
            id: "event_iemochi_jouraku",
            act: 1,
            importance: 2,
            title: "将軍家茂の上洛、230年ぶりの拝謁",
            desc: "文久三年三月、第十四代将軍・徳川家茂が三代家光以来二百三十年ぶりに上洛した。京都御所にて孝明天皇へ拝謁し攘夷を誓約する幕府の威信と、公武合体の成否が問われる。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【佐幕派】御所警備の会津藩兵・新選組を統率し、将軍の身辺を完璧に死守する",
                    effectDesc: "志士『松平容保：会津の義気』を獲得。HP を 6 回復し、次戦防御力 +6。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("aizu_shield");
                        app.healPlayer(6);
                        if (window.app && window.app.battle) {
                            window.app.battle.gainPlayerShield(6);
                        }
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】攘夷勅命を盾に将軍へ期限付き攘夷実行を迫り、幕府の面目を奪う",
                    effectDesc: "志士『三条実美』を獲得。軍資金 30両 を獲得し、次戦攻撃力 +3。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("sanjo_court");
                        app.gold += 30;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: -5,
                    text: "将軍と朝廷の間を周旋し、融和のための莫大な進献金を調達する",
                    effectDesc: "志士『松平春嶽』を獲得。軍資金 40両 を獲得するが、最大HP -3。",
                    action: (app) => {
                        app.addCardToDeck("shungaku_council");
                        app.gold += 40;
                        app.maxHp = Math.max(1, app.maxHp - 3);
                    }
                }
            ]
        },
        {
            id: "event_serizawa_assassination",
            act: 1,
            importance: 3,
            title: "八木邸の粛清、芹沢鴨の暗殺",
            desc: "大雨の夜、壬生・八木邸。度重なる乱暴狼藉で会津藩より見切りをつけられた筆頭局長・芹沢鴨を誅殺すべく、近藤勇・土方歳三・沖田総司らが抜刀して奥座敷へ踏み込む。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["sasaki_escort"],
                    opinionChange: -5,
                    text: "【🕊️ 生存ルート】隊中内紛の刃傷から佐々木愛次郎らを救い出し、新選組の粛清の嵐から逃がす",
                    effectDesc: "【生存ルート】志士『佐々木愛次郎』を救出！HP 25 ダメージを受けるが、愛次郎は生存確定となる。",
                    action: (app) => {
                        app.markShishiSurvived("sasaki_escort");
                        if (!app.deck.includes("sasaki_escort")) app.addCardToDeck("sasaki_escort");
                        app.damagePlayer(25);
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】土方・沖田と共に豪雨の闇に紛れて八木邸へ斬り込み、芹沢を一刀両断する",
                    effectDesc: "志士『近藤勇』を獲得。豪剣の返り討ちにより HP 32 ダメージを受けるが、次戦攻撃力 +5、レリックを獲得。",
                    faction: "sabaku",
                    shishiBonus: {
                        character: "hijikata",
                        desc: "副長の綿密な布陣！被ダメージを半減し、軍資金 20両 を獲得！",
                        apply: (app) => {
                            app.healPlayer(16);
                            app.gold += 20;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("kondo_kotetsu");
                        app.damagePlayer(32);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                        app.obtainRandomRelic();
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】裏庭の脱出路を固め、芹沢派幹部を掃討して隊を再編する",
                    effectDesc: "志士『沖田総司』を獲得。カードを1枚デッキから削除し、HP を 8 回復する。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("okita_sandan");
                        app.healPlayer(8);
                        app.openCardRemovalModal();
                    }
                },
                {
                    opinionChange: 12,
                    text: "【討幕派】新選組内部抗争の混乱を監視し、壬生界隈の尊攘派潜伏網を密かに逃がす",
                    effectDesc: "志士『田中光顕』を獲得。軍資金 30両 を獲得し、HP を 8 回復する。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("tanaka_intelligence");
                        app.gold += 30;
                        app.healPlayer(8);
                    }
                }
            ]
        },
        {
            id: "event_kozanshi_rising",
            act: 2,
            importance: 3,
            title: "功山寺挙兵、回天の烽火",
            desc: "元治元年師走、雪降る長州功山寺。「是よりは長州男児の腕前お見せ申すべく候！」高杉晋作がわずか84騎で白馬に跨り決起した。保守派に掌握された藩論を覆す乾坤一擲の賭け。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["akane_negotiation"],
                    opinionChange: 8,
                    text: "【🕊️ 生存ルート】奇兵隊の誤解を解き、和平周旋に尽力した赤禰武人を処刑の刃から救い出す",
                    effectDesc: "【生存ルート】志士『赤禰武人』の冤罪を晴らし生存確定！HP 25 ダメージを受けるが、赤禰は生存確定となる。",
                    action: (app) => {
                        app.markShishiSurvived("akane_negotiation");
                        if (!app.deck.includes("akane_negotiation")) app.addCardToDeck("akane_negotiation");
                        app.damagePlayer(25);
                    }
                },
                {
                    opinionChange: 12,
                    text: "【討幕派】晋作の決起に参陣し、奇兵隊と共に下関会所を電撃急襲する",
                    effectDesc: "志士『高杉晋作：奇兵隊の突進』を獲得。HP 32 ダメージを受けるが、次戦攻撃力 +5、世論討幕 +12%。",
                    faction: "tobaku",
                    shishiBonus: {
                        character: "takasugi",
                        desc: "動けば雷電の如し！被ダメージを半減し、軍資金 30両 を獲得！",
                        apply: (app) => {
                            app.healPlayer(16);
                            app.gold += 30;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("takasugi_kiheitai");
                        app.damagePlayer(32);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                    }
                },
                {
                    opinionChange: 12,
                    text: "【討幕派】伊藤博文率いる力士隊と合流し、後方兵站と武器庫を確実に制圧する",
                    effectDesc: "志士『伊藤博文』を獲得。HP を 8 回復し、軍資金 35両 を獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("ito_diplomat");
                        app.healPlayer(8);
                        app.gold += 35;
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】俗論派重臣と密かに連携し、萩本藩の正規軍を動員して包囲網を敷く",
                    effectDesc: "志士『小栗忠順』を獲得。幕府からの軍事支援金 50両 を獲得するが、最大HP -5。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("oguri_reform");
                        app.gold += 50;
                        app.maxHp = Math.max(1, app.maxHp - 5);
                    }
                }
            ]
        },
        {
            id: "event_choshu_five_return",
            act: 2,
            importance: 1,
            title: "長州ファイブの帰国、開国への針路",
            desc: "英国へ密航留学した長州の若き志士たち。四国連合艦隊との戦端が開かれんとする報に、井上馨と伊藤博文が急遽帰国した。ロンドンで目にした圧倒的国力差を説き、無謀な攘夷を止められるか。",
            choices: [
                {
                    opinionChange: 5,
                    text: "【討幕派】井上馨・伊藤博文の進言を容れ、下関戦争の停戦と近代洋式化を決断する",
                    effectDesc: "志士『井上馨』を獲得。列強介入 -5%、HP を 6 回復する。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("inoue_negotiation");
                        app.modifyImperialGauge(-5);
                        app.healPlayer(6);
                    }
                },
                {
                    opinionChange: 5,
                    text: "【討幕派】英国人商人との直接交渉を開き、新式ライフル銃の購入ルートを拓く",
                    effectDesc: "『新式ミニエ銃』をデッキに加え、軍資金 25両 を獲得するが、列強介入 +6%。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("weapon_minie");
                        app.gold += 25;
                        app.modifyImperialGauge(6);
                    }
                },
                {
                    opinionChange: -5,
                    text: "【佐幕派】幕府側の洋学者・勘定奉行と接触し、洋式造船・軍制の近代化を急がせる",
                    effectDesc: "志士『小栗忠順』を獲得。最大HP +3、次戦攻撃力 +2。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("oguri_reform");
                        app.maxHp += 3;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 2;
                    }
                }
            ]
        },
        {
            id: "event_senchu_hassaku",
            act: 2,
            importance: 3,
            title: "船中八策、夕顔丸の構想",
            desc: "慶応三年六月、長崎から京都へ向かう藩船・夕顔丸の甲板。坂本龍馬が後藤象二郎へ差し出した書付には、大政奉還、議会開設、憲法制定など近代日本の骨格が記されていた。",
            choices: [
                {
                    opinionChange: 12,
                    text: "【討幕派】龍馬の新国家構想に共鳴し、土佐藩の大政奉還建白を全面的に支援する",
                    effectDesc: "志士『坂本龍馬：海援隊の采配』を獲得。HP 30 ダメージを受けるが、全カードの最大HP +3＆完全回復！",
                    faction: "tobaku",
                    shishiBonus: {
                        character: "ryoma",
                        desc: "世界の海援隊！被ダメージを無効化し、軍資金 30両 を獲得！",
                        apply: (app) => {
                            app.healPlayer(30);
                            app.gold += 30;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("ryoma_kaiwentai");
                        app.damagePlayer(30);
                        app.maxHp += 3;
                        app.healPlayer(999);
                    }
                },
                {
                    opinionChange: 12,
                    text: "【討幕派】後藤象二郎と共に山内容堂を説得し、公議政体派の連帯を固める",
                    effectDesc: "志士『後藤象二郎』を獲得。軍資金 40両 を獲得し、列強介入 -5%。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("goto_political_drive");
                        app.gold += 40;
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】徳川宗家を首班とする議会制構想へ誘導し、幕府の権益を守る",
                    effectDesc: "志士『勝海舟』を獲得。軍資金 30両 を獲得し、次戦防御力 +8。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("katsu_kaishu");
                        app.gold += 30;
                        if (window.app && window.app.battle) {
                            window.app.battle.gainPlayerShield(8);
                        }
                    }
                }
            ]
        },
        {
            id: "event_eejanaika",
            act: 2,
            importance: 2,
            title: "ええじゃないか、狂乱の民衆",
            desc: "慶応三年秋、伊勢から京、大坂、東海道へと突如広がった空前絶後の民衆熱狂。「ええじゃないか」の掛け声とともにお札が降り、老若男女が歌い踊る。幕府の治安統制は完全に麻痺した。",
            choices: [
                {
                    opinionChange: 8,
                    text: "【討幕派】民衆の熱狂と街道の混乱に乗じ、倒幕の密使と軍資金を東海道へ送り込む",
                    effectDesc: "志士『中岡慎太郎』を獲得。軍資金 35両 を獲得し、HP を 6 回復する。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("nakaoka_mediator");
                        app.gold += 35;
                        app.healPlayer(6);
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】町奉行所の与力・同心を総動員し、祭礼を口実とした不逞浪士の潜伏を取り締まる",
                    effectDesc: "志士『佐々木只三郎』を獲得。軍資金 25両 を獲得し、次戦防御力 +6。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("sasaki_patrol");
                        app.gold += 25;
                        if (window.app && window.app.battle) {
                            window.app.battle.gainPlayerShield(6);
                        }
                    }
                },
                {
                    opinionChange: 0,
                    text: "民衆に混じって無礼講の熱気に身を委ね、旅の疲労を癒やす",
                    effectDesc: "HP を 12 回復し、最大HP +2 を獲得するが、呪い『世直し一揆の騒乱』が混入！",
                    action: (app) => {
                        app.healPlayer(12);
                        app.maxHp += 2;
                        app.addCardToDeck("curse_riot");
                    }
                }
            ]
        },
        {
            id: "event_nagareyama_farewell",
            act: 2,
            importance: 3,
            title: "流山の訣別、近藤勇の出頭",
            desc: "慶応四年四月、下総流山の陣屋。新政府軍に包囲された新選組本陣にて、局長・近藤勇は偽名「大久保大和」を名乗り、副長・土方歳三を北へ逃がすため単身出頭を決意する。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["kondo_kotetsu"],
                    opinionChange: -10,
                    text: "【🕊️ 生存ルート】板橋刑場へ偽りの救出部隊を突入させ、刑執行直前に近藤勇局長を電撃救出する",
                    effectDesc: "【生存ルート】志士『近藤勇』を救出！HP 38 ダメージを受けるが、近藤局長は生存確定となり以降もデッキで使用可能！",
                    action: (app) => {
                        app.markShishiSurvived("kondo_kotetsu");
                        if (!app.deck.includes("kondo_kotetsu")) app.addCardToDeck("kondo_kotetsu");
                        app.damagePlayer(38);
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】近藤の覚悟を背負い、土方歳三と共に包囲網を脱出して会津へ急行する",
                    effectDesc: "志士『土方歳三：鬼の副長』を獲得。胸裂ける別れの痛手で HP 30 ダメージを受けるが、次戦攻撃力 +5。",
                    faction: "sabaku",
                    shishiBonus: {
                        character: "hijikata",
                        desc: "誠の魂！被ダメージを半減し、次戦攻撃力+3！",
                        apply: (app) => {
                            app.healPlayer(15);
                            app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("hijikata_fukucho");
                        app.damagePlayer(30);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                    }
                },

                {
                    opinionChange: 12,
                    text: "【討幕派】大久保大和の正体を見破り、新選組の残党網を遮断して治安を確立する",
                    effectDesc: "志士『有馬新七』を獲得。軍資金 35両 を獲得し、HP を 8 回復する。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("arima_revolt");
                        app.gold += 35;
                        app.healPlayer(8);
                    }
                }
            ]
        },
        {
            id: "event_nihonmatsu_boys",
            act: 3,
            importance: 2,
            title: "二本松少年隊、大壇口の奮戦",
            desc: "慶応四年七月、奥州二本松城下・大壇口。主力が白河口へ出撃する留守中、十二歳から十七歳の少年隊が木村銃を手に新政府軍の圧倒的砲火へ立ち向かった。散りゆく幼き武士の覚悟。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【佐幕派】少年隊の気概に応え、大壇口に駆けつけて共に死線を耐え抜く",
                    effectDesc: "志士『山川大蔵：彼岸獅子の奮戦』を獲得。悲壮な銃撃戦で HP 28 ダメージを受けるが、次戦防御力 +8。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("yamakawa_cavalry");
                        app.damagePlayer(28);
                        if (window.app && window.app.battle) {
                            window.app.battle.gainPlayerShield(8);
                        }
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】少年たちを城内へ後退させ、歴戦の精鋭部隊で殿軍を務める",
                    effectDesc: "志士『松平容保：会津の義気』を獲得。HP を 8 回復し、最大HP +3。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("aizu_shield");
                        app.healPlayer(8);
                        app.maxHp += 3;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】近代アームストロング砲陣地を敷き、最小限の流血で二本松城を早期制圧する",
                    effectDesc: "志士『山田顕義』を獲得。『アームストロング砲』をデッキに加え、軍資金 30両 を獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("yamada_modern_army");
                        app.addCardToDeck("weapon_armstrong");
                        app.gold += 30;
                    }
                }
            ]
        },
        {
            id: "event_nakano_takeko",
            act: 3,
            importance: 2,
            title: "娘子隊の薙刀、中野竹子の奮迅",
            desc: "慶応四年八月、会津若松・柳橋。銃煙立ち込める戦場に、薙刀を佩いた女性部隊が進撃した。隊長・中野竹子は敵の弾雨をものともせず先陣を切って敵陣へ突撃する。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【佐幕派】中野竹子の娘子隊と共に抜刀突撃を敢行し、新政府軍の銃列を突き崩す",
                    effectDesc: "志士『中野竹子：薙刀の一陣』を獲得。壮烈な激闘により HP 28 ダメージを受けるが、次戦攻撃力 +5。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("nakano_takeko");
                        app.damagePlayer(28);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】鶴ヶ城への後退路を切り拓き、負傷した婦女子を城内へ救出する",
                    effectDesc: "志士『萱野権兵衛』を獲得。HP を 8 回復し、軍資金 25両 を獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("kayano_sacrifice");
                        app.healPlayer(8);
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】射程を保った近代小銃の一斉射撃で突撃を食い止め、無用の殺傷を抑える",
                    effectDesc: "志士『山県有朋』を獲得。軍資金 30両 を獲得し、次戦防御力 +6。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("yamagata_march");
                        app.gold += 30;
                        if (window.app && window.app.battle) {
                            window.app.battle.gainPlayerShield(6);
                        }
                    }
                }
            ]
        },
        {
            id: "event_hakodate_bay_naval",
            act: 3,
            importance: 3,
            title: "箱館湾海戦、甲鉄艦と回天の激闘",
            desc: "明治二年五月、箱館湾。最新鋭の装甲艦「甲鉄」を中核とする新政府海軍と、旧幕府脱走艦隊の生き残り「回天」「蟠竜」による日本史上初の大規模近代洋式海戦。",
            choices: [
                {
                    opinionChange: -12,
                    text: "【佐幕派】蟠竜丸の艦砲射撃で新政府艦「朝陽」を撃沈し、最後の意地を見せる",
                    effectDesc: "志士『榎本武揚』を獲得。壮絶な砲撃戦で HP 32 ダメージを受けるが、次戦攻撃力 +6。",
                    faction: "sabaku",
                    shishiBonus: {
                        character: "enomoto",
                        desc: "不屈の海軍総裁！被ダメージを半減し、次戦攻撃力+2！",
                        apply: (app) => {
                            app.healPlayer(16);
                            app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 2;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("enomoto_naval");
                        app.damagePlayer(32);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 6;
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】擱座した回天丸を浮き砲台として死守し、乗員を五稜郭本隊へ合流させる",
                    effectDesc: "志士『甲賀源吾』を獲得。HP を 8 回復し、最大HP +3。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("koga_naval");
                        app.healPlayer(8);
                        app.maxHp += 3;
                    }
                },
                {
                    opinionChange: 12,
                    text: "【討幕派】装甲艦甲鉄のガトリング砲で敵艦を圧倒し、箱館湾の制海権を完全制圧する",
                    effectDesc: "志士『黒田了介』を獲得。『甲鉄艦の艦砲射撃』をデッキに加え、軍資金 35両 を獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("kuroda_frontier");
                        app.addCardToDeck("warship_ironclad");
                        app.gold += 35;
                    }
                }
            ]
        },
        {
            id: "event_sakuma_assassination",
            act: 1,
            importance: 2,
            title: "佐久間象山暗殺、開国の知略散る",
            desc: "元治元年七月、京都三条木屋町。開国論を唱え馬にまたがる佐久間象山に、尊攘過激派の刺客・河上彦斎らが白昼襲いかかる！",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["sakuma_gunnery"],
                    opinionChange: 0,
                    text: "【🕊️ 生存ルート】象山の馬前に身を挺して割り込み、刺客の斬撃を刀で受け止めて救出する",
                    effectDesc: "【生存ルート】志士『佐久間象山』の命を救い歴史を改変！HP 35 ダメージを受けるが、象山は生存確定となり以降もデッキで使い続けられる。",
                    action: (app) => {
                        app.markShishiSurvived("sakuma_gunnery");
                        if (!app.deck.includes("sakuma_gunnery")) app.addCardToDeck("sakuma_gunnery");
                        app.damagePlayer(35);
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】京都見廻組を急行させ、木屋町一帯の刺客を追捕する",
                    effectDesc: "志士『佐々木只三郎』を獲得。次の戦闘の攻撃力+3。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("sasaki_patrol");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】現場の混乱を避け、象山が遺した西洋砲術の秘図を回収する",
                    effectDesc: "25両を獲得し、次の戦闘のシールド+8。",
                    faction: "tobaku",
                    action: (app) => {
                        app.gold += 25;
                        app.healPlayer(8);
                    }
                }
            ]
        },
        {
            id: "event_sannan_seppuku",
            act: 2,
            importance: 2,
            title: "新選組総長・山南敬助の脱走と切腹",
            desc: "元治二年二月、新選組の過激な方針に絶望した総長・山南敬助が前川邸を脱走。大津にて追っ手の沖田総司に追いつかれ、屯所へ連れ戻された。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["sannan_tactics"],
                    opinionChange: -5,
                    costGold: 30,
                    text: "【🕊️ 生存ルート】局長・近藤勇に命がけで直訴し、山南の脱走を「隠密探索の密命」として助命工作を行う",
                    effectDesc: "【生存ルート】志士『山南敬助』の切腹を回避し生存！軍資金 30両 を消費（不足時はHP代替）し世論佐幕-5%、山南は生存確定となる。",
                    action: (app) => {
                        app.markShishiSurvived("sannan_tactics");
                        if (!app.deck.includes("sannan_tactics")) app.addCardToDeck("sannan_tactics");
                        const spendGold = Math.min(app.gold, 30);
                        const shortage = 30 - spendGold;
                        app.gold -= spendGold;
                        if (shortage > 0) app.damagePlayer(shortage);
                    }
                },
                {
                    opinionChange: -10,
                    text: "【佐幕派】隊規の厳格さを守り、沖田総司に介錯を命じる",
                    effectDesc: "志士『沖田総司』を獲得。次の戦闘の攻撃力+4、HP 15 ダメージ。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("okita_sandan");
                        app.damagePlayer(15);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】新選組の内紛に乗じ、京の町衆に潜伏志士の情報を流す",
                    effectDesc: "軍資金 25両 を獲得し、HP 8 回復。",
                    faction: "tobaku",
                    action: (app) => {
                        app.gold += 25;
                        app.healPlayer(8);
                    }
                }
            ]
        },
        {
            id: "event_izo_execution",
            act: 2,
            importance: 3,
            title: "土佐勤王党の獄、人斬り以蔵と武市半平太の最期",
            desc: "慶応元年五月、高知城下の牢獄。山内容堂による厳しい弾圧の中、過酷な拷問に耐えた岡田以蔵と、獄中から同志を励まし続けた武市半平太が最期の裁きを待つ。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["okada_izo", "takechi_ideology"],
                    opinionChange: 12,
                    text: "【🕊️ 生存ルート】決死の牢破りを決行し、警備の土佐藩士をなぎ倒して武市と以蔵を救出する",
                    effectDesc: "【生存ルート】志士『武市半平太』『岡田以蔵』の両名を救出！HP 38 ダメージを受けるが、両名は生存確定となり以降もデッキで使用可能！",
                    action: (app) => {
                        app.markShishiSurvived("okada_izo");
                        app.markShishiSurvived("takechi_ideology");
                        if (!app.deck.includes("okada_izo")) app.addCardToDeck("okada_izo");
                        if (!app.deck.includes("takechi_ideology")) app.addCardToDeck("takechi_ideology");
                        app.damagePlayer(38);
                    }
                },
                {
                    opinionChange: -10,
                    text: "【討幕派】武市の遺志と以蔵の辞世を胸に刻み、土佐の同志を糾合する",
                    effectDesc: "志士『中岡慎太郎』を獲得。土佐尊攘派壊滅の逆風の中、武市の遺志を胸に同志を糾合。次の戦闘の攻撃力+3。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("nakaoka_mediator");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                },
                {
                    opinionChange: -10,
                    text: "【佐幕派】山内容堂の厳正なる裁断を支持し、土佐の公議政体を固める",
                    effectDesc: "志士『山内容堂』を獲得。25両 を獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("yodo_political_balance");
                        app.gold += 25;
                    }
                }
            ]
        },
        {
            id: "event_takasugi_illness",
            act: 2,
            importance: 3,
            title: "高杉晋作の病臥、風雲児の別れ",
            desc: "慶応三年四月、下関桜山。第二次長州征伐で大勝利を収めた奇兵隊の創設者・高杉晋作だが、肺結核の病魔がその身体を急速に蝕んでいた。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["takasugi_kiheitai"],
                    opinionChange: 10,
                    costGold: 40,
                    text: "【🕊️ 生存ルート】長崎から蘭方医の名医を緊急招聘し、高価な西洋新薬を投与して決死の養生に専念させる",
                    effectDesc: "【生存ルート】志士『高杉晋作』の結核を克服させ生存確定！軍資金 40両 とHP 20 を消費（資金不足時は不足分HPを追加消費）し、晋作は生存しデッキに残留！",
                    action: (app) => {
                        app.markShishiSurvived("takasugi_kiheitai");
                        if (!app.deck.includes("takasugi_kiheitai")) app.addCardToDeck("takasugi_kiheitai");
                        const spendGold = Math.min(app.gold, 40);
                        const shortage = 40 - spendGold;
                        app.gold -= spendGold;
                        app.damagePlayer(20 + shortage);
                    }
                },
                {
                    opinionChange: 10,
                    text: "【討幕派】奇兵隊の指揮権を山県有朋に引き継ぎ、遺志を継ぐ",
                    effectDesc: "志士『山県有朋』を獲得。次の戦闘の攻撃力+4。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("yamagata_march");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】晋作の残した三味線と軍資金を受け取り、後事を託される",
                    effectDesc: "軍資金 35両 を獲得し、最大HP+3。",
                    faction: "tobaku",
                    action: (app) => {
                        app.gold += 35;
                        app.maxHp += 3;
                        app.healPlayer(3);
                    }
                },
                {
                    opinionChange: -5,
                    text: "【佐幕派】長州の麒麟児・晋作の最期を見届け、奇兵隊の動向を監視する",
                    effectDesc: "長州藩の混乱を察知し警戒態勢を整える。軍資金 25両 を獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: 0,
                    text: "静かに手を合わせ、早すぎる英雄の死を悼む",
                    effectDesc: "精神を整え、HPを 15 回復する。",
                    action: (app) => {
                        app.healPlayer(15);
                    }
                }
            ]
        },
        {
            id: "event_takeda_assassination",
            act: 2,
            importance: 2,
            title: "銭取橋の粛清、武田観柳斎の暗殺",
            desc: "慶応三年六月、夜の鴨川銭取橋。新選組五番組組長・武田観柳斎が薩摩藩邸へ赴く途上、密偵の報告を受けた副長・土方歳三の命により斎藤一らが影から迫る。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["takeda_strategy"],
                    opinionChange: 0,
                    text: "【🕊️ 生存ルート】斎藤一の鋭い牙突に割り込み、武田観柳斎を暗闇の路地へ引き摺り込んで逃走させる",
                    effectDesc: "【生存ルート】志士『武田観柳斎』を救出し生存確定！HP 28 ダメージを受けるが、武田は生存確定となる。",
                    action: (app) => {
                        app.markShishiSurvived("takeda_strategy");
                        if (!app.deck.includes("takeda_strategy")) app.addCardToDeck("takeda_strategy");
                        app.damagePlayer(28);
                    }
                },
                {
                    opinionChange: -10,
                    text: "【佐幕派】斎藤一の粛清を援護し、裏切り者を闇に葬る",
                    effectDesc: "志士『斎藤一』を獲得。次の戦闘の攻撃力+4。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("saito_gato");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】現場から観柳斎が所持していた甲州軍学の秘伝書を回収する",
                    effectDesc: "軍資金 25両 を獲得し、次戦シールド+6。",
                    faction: "tobaku",
                    action: (app) => {
                        app.gold += 25;
                        app.healPlayer(6);
                    }
                }
            ]
        },
        {
            id: "event_oguri_execution",
            act: 2,
            importance: 2,
            title: "小栗上野介、権田村の悲劇",
            desc: "慶応四年四月、上野国権田村。幕府勘定奉行として横須賀造船所を創設した小栗忠順だが、官軍東山道総督府の命により無実の罪で烏川水落に引き出された。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["oguri_reform"],
                    opinionChange: -10,
                    text: "【🕊️ 生存ルート】官軍の処刑隊を電撃急襲し、小栗忠順を奪還して山中深く逃亡させる",
                    effectDesc: "【生存ルート】志士『小栗忠順』を救出！HP 35 ダメージと世論討幕-10%を受けるが、小栗は生存確定！",
                    action: (app) => {
                        app.markShishiSurvived("oguri_reform");
                        if (!app.deck.includes("oguri_reform")) app.addCardToDeck("oguri_reform");
                        app.damagePlayer(35);
                    }
                },
                {
                    opinionChange: 10,
                    text: "【討幕派】官軍の命令を遵守し、小栗の遺品・近代造船設計図を接収する",
                    effectDesc: "志士『大隈重信』を獲得。軍資金 30両 を獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("okuma_modernization");
                        app.gold += 30;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】小栗の遺志を胸に刻み、横須賀造船の技術者たちを保護する",
                    effectDesc: "軍資金 35両 を獲得し、最大HP+3。",
                    faction: "sabaku",
                    action: (app) => {
                        app.gold += 35;
                        app.maxHp += 3;
                        app.healPlayer(3);
                    }
                }
            ]
        },
        {
            id: "event_okita_farewell",
            act: 2,
            importance: 3,
            title: "沖田総司、千駄ヶ谷の病臥",
            desc: "慶応四年五月、江戸千駄ヶ谷の植木屋平五郎宅。近藤勇の処刑を知らされぬまま、新選組一番隊組長・沖田総司の病状は極限に達していた。",
            choices: [
                {
                    isSurvivalRoute: true,
                    targetShishi: ["okita_sandan"],
                    opinionChange: -5,
                    costGold: 40,
                    text: "【🕊️ 生存ルート】松本良順直伝の最新西洋滋養薬と名湯での長期湯治を手配し、総司の命を繋ぎ止める",
                    effectDesc: "【生存ルート】志士『沖田総司』の病魔を抑え生存確定！軍資金 40両 とHP 20 を消費（資金不足時は不足分HPを追加消費）し、総司は生存しデッキに残留！",
                    action: (app) => {
                        app.markShishiSurvived("okita_sandan");
                        if (!app.deck.includes("okita_sandan")) app.addCardToDeck("okita_sandan");
                        const spendGold = Math.min(app.gold, 40);
                        const shortage = 40 - spendGold;
                        app.gold -= spendGold;
                        app.damagePlayer(20 + shortage);
                    }
                },
                {
                    opinionChange: -10,
                    text: "【佐幕派】総司の愛刀・加州清光を受け継ぎ、北へ向かう土方歳三の後を追う",
                    effectDesc: "志士『土方歳三』を獲得。次の戦闘の攻撃力+5。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("hijikata_fukucho");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】千駄ヶ谷の潜伏新選組隊士の武装を武装解除させ、保護する",
                    effectDesc: "軍資金 25両 を獲得し、HP 8 回復。",
                    faction: "tobaku",
                    action: (app) => {
                        app.gold += 25;
                        app.healPlayer(8);
                    }
                }
            ]
        },
        {
            id: "event_shuseikan_project",
            act: 1,
            importance: 2,
            title: "集成館事業、近代産業の黎明",
            desc: "嘉永四年、薩摩藩主・島津斉彬が鹿児島・磯の地に一大近代洋式工場群「集成館」を興した。反射炉での鉄砲鋳造、造船、ガラス・火薬の国産化。西欧列強に対峙せんとする富国強兵の魁に、どう呼応するか。",
            choices: [
                {
                    opinionChange: 8,
                    text: "【討幕派】島津斉彬の集成館事業に参画し、最新の洋式火器製造を推進する",
                    effectDesc: "志士『島津斉彬：集成の英断』を獲得。軍資金 40両 を拠出するが、最大HP +3。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("shimazu_nariakira");
                        app.gold = Math.max(0, app.gold - 40);
                        app.maxHp += 3;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】幕府勘定所へ洋式製鉄の技術を献じ、台場砲台の強化を具申する",
                    effectDesc: "志士『阿部正弘』を獲得。軍資金 30両 を獲得し、次戦防御力 +6。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("abe_defense");
                        app.gold += 30;
                        if (window.app && window.app.battle) window.app.battle.gainPlayerShield(6);
                    }
                },
                {
                    opinionChange: 0,
                    text: "集成館で試作された最新式小銃を買い付け、武装を刷新する",
                    effectDesc: "『新式ミニエ銃』をデッキに加え、HP を 6 回復する。",
                    action: (app) => {
                        app.addCardToDeck("weapon_minie");
                        app.healPlayer(6);
                    }
                }
            ]
        },
        {
            id: "event_manjiro_return",
            act: 1,
            importance: 1,
            title: "中浜万次郎の帰航、未知なる航海術",
            desc: "太平洋を漂流し米国で高等教育・航海術を修めたジョン万次郎が、十余年の歳月を経て日本へ帰還した。異国の進んだ地理、造船、民主制度を知る稀代の漂流民をどう迎えるか。",
            choices: [
                {
                    opinionChange: 5,
                    text: "【討幕派】万次郎の卓越した航海術と英語力を乞い、海外密貿易と海運の顧問に迎える",
                    effectDesc: "志士『ジョン万次郎：数奇なる羅針盤』を獲得。列強介入 -4%、HP を 6 回復。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("john_manjiro");
                        app.modifyImperialGauge(-4);
                        app.healPlayer(6);
                    }
                },
                {
                    opinionChange: -5,
                    text: "【佐幕派】幕府直参に登用し、軍艦操練所の教授方として洋式海軍の創設を託す",
                    effectDesc: "志士『勝海舟』を獲得。軍資金 25両 を獲得し、最大HP +2。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("katsu_kaishu");
                        app.gold += 25;
                        app.maxHp += 2;
                    }
                },
                {
                    opinionChange: 0,
                    text: "万次郎が持ち帰った世界地図と英米航海年鑑の写本を調達する",
                    effectDesc: "軍資金 30両 を獲得し、列強介入 -3%。",
                    action: (app) => {
                        app.gold += 30;
                        app.modifyImperialGauge(-3);
                    }
                }
            ]
        },
        {
            id: "event_shimoda_harris_talks",
            act: 1,
            importance: 2,
            title: "下田会談、ハリスと岩瀬忠震の舌戦",
            desc: "安政四年十月、下田・玉泉寺。初代米国総領事タウンゼント・ハリスと、幕府目付・岩瀬忠震が条約締結を巡り対峙した。理路整然と主権と通商利益を守らんと論戦を挑む岩瀬の胆力。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【佐幕派】岩瀬忠震の卓越した外交論陣を支え、関税自主と国益の確保に全力を尽くす",
                    effectDesc: "志士『岩瀬忠震：条約の理財』を獲得。列強介入 -5%、軍資金 25両 を獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("iwase_tadanari");
                        app.modifyImperialGauge(-5);
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】幕閣の無勅許調印路線を糾弾し、朝廷の勅許なき通商条約に反対を叫ぶ",
                    effectDesc: "志士『武市半平太』を獲得。次戦攻撃力 +3、HP 26 ダメージを受ける。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("takechi_ideology");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        app.damagePlayer(26);
                    }
                },
                {
                    opinionChange: 0,
                    text: "条約交渉の妥結を見越し、横浜開港場での物産取引の権利を先行確保する",
                    effectDesc: "軍資金 40両 を獲得するが、列強介入 +6%。",
                    action: (app) => {
                        app.gold += 40;
                        app.modifyImperialGauge(6);
                    }
                }
            ]
        },
        {
            id: "event_ikuno_uprising",
            act: 1,
            importance: 2,
            title: "生野の変、但馬に翻る破約の旗",
            desc: "文久三年十月、但馬生野銀山。大和天誅組の変に呼応し、福岡藩士・平野国臣や公卿・沢宣嘉らが代官所を急襲して破約攘夷の義旗を掲げた。わずか数日の電撃蜂起の行方は。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【討幕派】平野国臣の決起に参陣し、生野代官所の銀山資金を押収して進軍する",
                    effectDesc: "志士『平野国臣：志士の狂瀾』を獲得。進軍を試みるも包囲鎮圧され世論逆風。HP 26 ダメージを受けるが、次戦攻撃力 +4、軍資金 30両 を獲得。",
                    faction: "tobaku",
                    shishiBonus: {
                        character: "hirano",
                        desc: "狂瀾の突進！被ダメージを半減し、次戦攻撃力+2！",
                        apply: (app) => {
                            app.healPlayer(13);
                            app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 2;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("hirano_kuniomi");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                        app.gold += 30;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】出石藩・姫路藩の藩兵を急行させ、代官所を奪還して農民騒擾を鎮撫する",
                    effectDesc: "志士『立見尚文』を獲得。HP を 6 回復し、軍資金 25両 を獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("tatsumi_naobumi");
                        app.healPlayer(6);
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: 0,
                    text: "混乱に乗じ、銀山の良質な銀塊を回収して軍資金に充てる",
                    effectDesc: "軍資金 50両 を獲得するが、最大HP -3。",
                    action: (app) => {
                        app.gold += 50;
                        app.maxHp = Math.max(1, app.maxHp - 3);
                    }
                }
            ]
        },
        {
            id: "event_aburakoji_hattori",
            act: 2,
            importance: 3,
            title: "油小路の死闘、服部武雄の二刀流",
            desc: "慶応三年十一月、京都油小路木津屋橋。伊東甲子太郎を暗殺された御陵衛士の同志たちが遺体を引き取りに現れ、待ち伏せる新選組と壮絶な夜戦に突入。撃剣師範・服部武雄が背に塀を負い二刀を振るって孤軍奮戦する。",
            choices: [
                {
                    opinionChange: -12,
                    text: "【佐幕派】服部武雄の凄絶なる二刀流に加勢し、多勢の新選組包囲陣を相手に獅子奮迅の太刀を振るう",
                    effectDesc: "志士『服部武雄：不抜の二刀』を獲得。死闘の重傷で HP 32 ダメージを受けるが、次戦攻撃力 +6。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("hattori_takeo");
                        app.damagePlayer(32);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 6;
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】新選組隊士として包囲陣を固め、離隊した御陵衛士を掃討して隊の規律を守る",
                    effectDesc: "志士『永倉新八』を獲得。HP を 8 回復し、軍資金 25両 を獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("nagakura_bushin");
                        app.healPlayer(8);
                        app.gold += 25;
                    }
                },
                {
                    opinionChange: -12,
                    text: "【討幕派】死線を脱出した御陵衛士の生き残りを薩摩藩邸へ極秘裏に匿い、再起を期す",
                    effectDesc: "志士『吉井友実』を獲得。御陵衛士壊滅の逆風の中、生き残りを薩摩藩邸へ極秘裏に匿い軍資金 35両 を獲得、HP を 6 回復。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.gold += 35;
                        app.healPlayer(6);
                    }
                }
            ]
        },
        {
            id: "event_yoshinobu_kyoujun",
            act: 2,
            importance: 3,
            title: "上野寛永寺、徳川慶喜の恭順",
            desc: "慶応四年二月、江戸・上野寛永寺大慈院。鳥羽・伏見の敗戦後、将軍・徳川慶喜は主戦派の徹底抗戦論を退け、自ら謹慎・恭順を決断した。徳川二百六十年の泰平の幕引きと江戸焦土戦の回避。",
            choices: [
                {
                    opinionChange: -12,
                    text: "【佐幕派】慶喜公の至誠の恭順方針を支持し、勝海舟と共に和平開城交渉の道を拓く",
                    effectDesc: "志士『徳川慶喜：英断の恭順』を獲得。次戦防御力 +12、全カードの最大HP +3＆完全回復！",
                    faction: "sabaku",
                    shishiBonus: {
                        character: "yoshinobu",
                        desc: "大局の恭順！軍資金 50両 を獲得し、次戦防御力+6！",
                        apply: (app) => {
                            app.gold += 50;
                            if (window.app && window.app.battle) window.app.battle.gainPlayerShield(6);
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("tokugawa_yoshinobu");
                        if (window.app && window.app.battle) window.app.battle.gainPlayerShield(12);
                        app.maxHp += 3;
                        app.healPlayer(999);
                    }
                },
                {
                    opinionChange: -12,
                    text: "【佐幕派】将軍謹慎の隙を狙う過激派を抑え、江戸城下の治安維持にあたる",
                    effectDesc: "志士『勝海舟』を獲得。軍資金 40両 を獲得し、列強介入 -5%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("katsu_kaishu");
                        app.gold += 40;
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    opinionChange: 12,
                    text: "【討幕派】東征大総督府の進撃に加わり、朝敵追討の旗を掲げて東海道を疾走する",
                    effectDesc: "志士『西郷隆盛：薩摩の巨魁』を獲得。HP 32 ダメージを受けるが、次戦攻撃力 +5。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("saigo_jigen");
                        app.damagePlayer(32);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                    }
                }
            ]
        },
        {
            id: "event_dajokan_satsu",
            act: 3,
            importance: 2,
            title: "太政官札の発行、由利公正の新通貨",
            desc: "慶応四年五月、京都。新政府の軍資金不足を解消すべく、参与・由利公正（三岡八郎）の献策により日本初の全国通用紙幣「太政官札」が発行された。近代的国家財政の産声。",
            choices: [
                {
                    opinionChange: 8,
                    text: "【討幕派】由利公正の通貨改革を後援し、太政官札の普及と新政府財政の安定を図る",
                    effectDesc: "志士『由利公正：新政の殖産』を獲得。軍資金 50両 を獲得し、最大HP +3。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("yuri_kimimasa");
                        app.gold += 50;
                        app.maxHp += 3;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】大坂の豪商たちを説得し、正金準備の確保と新紙幣の信認向上に努める",
                    effectDesc: "志士『五代友厚』を獲得。軍資金 40両 を獲得し、HP を 6 回復。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("godai_commerce");
                        app.gold += 40;
                        app.healPlayer(6);
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】旧幕府の金座・銀座の貨幣流通を死守し、奥羽諸藩の軍用資金を調達する",
                    effectDesc: "志士『小栗忠順』を獲得。軍資金 35両 を獲得し、次戦防御力 +6。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("oguri_reform");
                        app.gold += 35;
                        if (window.app && window.app.battle) window.app.battle.gainPlayerShield(6);
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】副島種臣と共に制度事務局の財政法規を整備し、全国通用を推進する",
                    effectDesc: "志士『副島種臣：外政の剛腕』を獲得。軍資金 35両 を獲得し、次戦攻撃力 +3。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("soejima_diplomacy");
                        app.gold += 35;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                    }
                }
            ]
        },
        {
            id: "event_aizu_nadeshiko",
            act: 3,
            importance: 2,
            title: "会津娘子隊の結成、鶴ヶ城の義烈",
            desc: "慶応四年八月、会津若松城下。新政府軍の猛攻が城壁に迫る中、中野竹子や神保雪子ら武家の女性たちが薙刀を手に自発的に結集した。家と義を胸に出陣する烈女たちの決意。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【佐幕派】中野竹子率いる娘子隊の結成を後押しし、鶴ヶ城柳橋の迎撃戦へ共に出陣する",
                    effectDesc: "志士『中野竹子：薙刀の一陣』を獲得。HP 26 ダメージを受けるが、次戦攻撃力 +5、世論佐幕 8%。",
                    faction: "sabaku",
                    shishiBonus: {
                        character: "takeko",
                        desc: "烈女の気迫！被ダメージを半減し、次戦攻撃力+3！",
                        apply: (app) => {
                            app.healPlayer(13);
                            app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("nakano_takeko");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】山川大蔵と共に鶴ヶ城内の防備を固め、婦女子の城内収容を指揮する",
                    effectDesc: "志士『山川大蔵：彼岸獅子の奮戦』を獲得。HP を 8 回復し、最大HP +3。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("yamakawa_cavalry");
                        app.healPlayer(8);
                        app.maxHp += 3;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】会津城下の戦闘激化を憂い、城内へ降伏勧告の使者を立てて無用の流血を防ぐ",
                    effectDesc: "志士『板垣退助』を獲得。HP を 8 回復し、軍資金 30両 を獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("itagaki_charge");
                        app.healPlayer(8);
                        app.gold += 30;
                    }
                }
            ]
        },
        {
            id: "event_yae_spencer",
            act: 3,
            importance: 2,
            title: "鶴ヶ城の銃姫、山本八重のスペンサー銃",
            desc: "慶応四年八月、砲煙渦巻く会津鶴ヶ城。男装に身を包み断髪した山本八重が、当時最新鋭の七連発スペンサー銃を携えて本丸の城壁に立った。夜襲の敵兵へ向け、正確無比の連射が轟く。",
            choices: [
                {
                    opinionChange: -8,
                    text: "【佐幕派】八重のスペンサー銃の乱射に加勢し、夜襲の敵兵を狙撃して本丸を守り抜く",
                    effectDesc: "志士『山本八重：不抜の銃姫』を獲得。激しい銃撃戦で HP 26 ダメージを受けるが、次回攻撃力 +5、世論佐幕 8%。",
                    faction: "sabaku",
                    shishiBonus: {
                        character: "yae",
                        desc: "正確無比の照準！被ダメージを半減し、次戦攻撃力+3！",
                        apply: (app) => {
                            app.healPlayer(13);
                            app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 3;
                        }
                    },
                    action: (app) => {
                        app.addCardToDeck("yamamoto_yae");
                        app.damagePlayer(26);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                    }
                },
                {
                    opinionChange: -8,
                    text: "【佐幕派】兄・覚馬の洋学知識を活かして弾薬調合を指揮し、城内の兵站を維持する",
                    effectDesc: "志士『山本覚馬』を獲得。HP を 8 回復し、軍資金 30両 を獲得。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("yamamoto_research");
                        app.healPlayer(8);
                        app.gold += 30;
                    }
                },
                {
                    opinionChange: 8,
                    text: "【討幕派】城壁からの驚異的な連射砲火を警戒し、アームストロング砲陣地から牽制射撃を加える",
                    effectDesc: "志士『山田顕義』を獲得。『アームストロング砲』をデッキに加え、軍資金 25両 を獲得。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("yamada_modern_army");
                        app.addCardToDeck("weapon_armstrong");
                        app.gold += 25;
                    }
                }
            ]
        }
    ],

    // ==========================================
    // 6. 志士連携（コンボ・コネクトリンク）マスター定義 (全233組・全志士網羅)
    // ==========================================
    combos: [
    // === 既存のコンボ（連鎖墨文字を必ず表示） ===
    {
        id: "combo_ryoma_katsura",
        chars: ["ryoma", "katsura"],
        title: "【薩長盟友！】",
        desc: "文+1、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerEnergy(1);
            b.drawCards(1);
        }
    },
    {
        id: "combo_hijikata_kondo",
        chars: ["hijikata", "kondo"],
        title: "【誠の連帯！】",
        desc: "敵に6ダメージ、防6。",
        apply: (b) => {
            b.dealDamageToEnemy(6);
            b.gainPlayerShield(6);
        }
    },
    {
        id: "combo_saigo_okubo",
        chars: ["saigo", "okubo"],
        title: "【薩摩の両雄！】",
        desc: "敵に12ダメージ。",
        apply: (b) => {
            b.dealDamageToEnemy(12);
        }
    },
    {
        id: "combo_saigo_ryoma",
        chars: ["saigo", "ryoma"],
        title: "【龍馬と西郷・天下の大鐘！】",
        desc: "敵に18ダメージ、防10、文+1、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(18);
            b.gainPlayerShield(10);
            b.gainPlayerEnergy(1);
            b.drawCards(1);
        }
    },
    {
        id: "combo_katsu_ryoma",
        chars: ["katsu", "ryoma"],
        title: "【海舟と龍馬！】",
        desc: "列強介入-3%、防10。",
        apply: (b) => {
            b.modifyImperialGauge(-5);
            b.gainPlayerShield(10);
        }
    },
    {
        id: "combo_katsu_saigo",
        chars: ["katsu", "saigo"],
        title: "【江戸城無血開城！】",
        desc: "敵に18ダメージ、防16、列強介入-3%、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(18);
            b.gainPlayerShield(16);
            b.modifyImperialGauge(-8);
            b.drawCards(1);
        }
    },
    {
        id: "combo_ito_omura",
        chars: ["ito", "omura"],
        title: "【新政の両輪！】",
        desc: "カードを1枚引き、文+1。",
        apply: (b) => {
            b.drawCards(1);
            b.gainPlayerEnergy(1);
        }
    },
    {
        id: "combo_hijikata_nagakura",
        chars: ["hijikata", "nagakura"],
        title: "【二番隊の猛襲！】",
        desc: "敵に8ダメージ、防8。",
        apply: (b) => {
            b.dealDamageToEnemy(8);
            b.gainPlayerShield(8);
        }
    },
    {
        id: "combo_okita_saito",
        chars: ["okita", "saito"],
        title: "【一番隊の双刃！】",
        desc: "敵に10ダメージ、流血2付与。",
        apply: (b) => {
            b.dealDamageToEnemy(10);
            b.applyStatusToEnemy("bleed", 2);
        }
    },
    {
        id: "combo_kondo_sannan",
        chars: ["kondo", "sannan"],
        title: "【誠の軍議！】",
        desc: "防10、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerShield(10);
            b.drawCards(1);
        }
    },
    {
        id: "combo_enomoto_otori",
        chars: ["enomoto", "otori"],
        title: "【北海艦隊！】",
        desc: "敵に10ダメージ、腕力+3。",
        apply: (b) => {
            b.dealDamageToEnemy(10);
            b.applyPlayerBuff("strength", 3);
        }
    },
    {
        id: "combo_nakaoka_ryoma",
        chars: ["nakaoka", "ryoma"],
        title: "【土佐の盟友！】",
        desc: "文+1、カードを2枚引く。",
        apply: (b) => {
            b.gainPlayerEnergy(1);
            b.drawCards(2);
        }
    },
    {
        id: "combo_katsura_maebara",
        chars: ["katsura", "maebara"],
        title: "【松門の重鎮・下関挙兵！】",
        desc: "敵に 16 ダメージ、防 12、カードを 1 枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(16);
            b.gainPlayerShield(12);
            b.drawCards(1);
        }
    },
    {
        id: "combo_katsura_yoshida",
        chars: ["katsura", "yoshida"],
        title: "【松陰と小五郎・至誠大業！】",
        desc: "敵に14ダメージ、文+1、カードを1枚引き、腕力+3。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.gainPlayerEnergy(1);
            b.drawCards(1);
            b.applyPlayerBuff("strength", 3);
        }
    },
    {
        id: "combo_katsura_takasugi",
        chars: ["katsura", "takasugi"],
        title: "【長州の双璧！】",
        desc: "敵に16ダメージ、防10、腕力+4。",
        apply: (b) => {
            b.dealDamageToEnemy(16);
            b.gainPlayerShield(10);
            b.applyPlayerBuff("strength", 4);
        }
    },
    {
        id: "combo_katsura_omura",
        chars: ["katsura", "omura"],
        title: "【長州軍政の両輪！】",
        desc: "敵に14ダメージ、防12、文+1、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.gainPlayerShield(12);
            b.gainPlayerEnergy(1);
            b.drawCards(1);
        }
    },
    {
        id: "combo_katamori_yamagawa",
        chars: ["katamori", "yamakawa"],
        title: "【会津守護の陣！】",
        desc: "防14、HPを4回復。",
        apply: (b) => {
            b.gainPlayerShield(14);
            b.healPlayer(5);
        }
    },
    {
        id: "combo_katamori_kondo",
        chars: ["katamori", "kondo"],
        title: "【会津守護の忠誠！】",
        desc: "敵に14ダメージ、防14、反撃態勢（12反射）。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.gainPlayerShield(14);
            b.applyPlayerBuff("thorns", 12);
        }
    },
    {
        id: "combo_kawai_koga",
        chars: ["kawai", "koga"],
        title: "【北辺艦砲連携！】",
        desc: "敵に14ダメージ、敵シールド全破壊。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            if (b.enemy) b.enemy.shield = 0;
        }
    },
    {
        id: "combo_harada_sagawa",
        chars: ["harada", "sagawa"],
        title: "【鬼神の槍騎！】",
        desc: "敵に12ダメージ、流血3付与。",
        apply: (b) => {
            b.dealDamageToEnemy(12);
            b.applyStatusToEnemy("bleed", 3);
        }
    },

    {
        id: "combo_hisamitsu_saigo",
        chars: ["hisamitsu", "saigo"],
        title: "【薩摩の国父と巨魁・示現の威風！】",
        desc: "敵に 24 ダメージ、防 12、軍資金 25両 獲得。",
        apply: (b) => {
            b.dealDamageToEnemy(24);
            b.gainPlayerShield(12);
            if (window.bakumatsuApp) window.bakumatsuApp.gold += 25;
        }
    },
    {
        id: "combo_hisamitsu_nariakira",
        chars: ["hisamitsu", "nariakira"],
        title: "【島津の血脈・集成と率兵！】",
        desc: "防 18、文 +1、手札の全カードのコスト -1（次ターン）。",
        apply: (b) => {
            b.gainPlayerShield(18);
            b.player.energy = (b.player.energy || 0) + 1;
        }
    },
    {
        id: "combo_gensai_sakuma",
        chars: ["gensai", "sakuma"],
        title: "【開国の碩学と人斬り・運命の白刃！】",
        desc: "敵に 26 ダメージ、敵シールド全破壊。",
        apply: (b) => {
            if (b.enemy) b.enemy.shield = 0;
            b.dealDamageToEnemy(26);
        }
    },
    {
        id: "combo_gensai_izo",
        chars: ["gensai", "izo"],
        title: "【幕末二大凶刃・神速と天誅！】",
        desc: "敵に 22 ダメージ、敵に「流血 4」「脆弱 2」付与。",
        apply: (b) => {
            b.dealDamageToEnemy(22);
            b.applyStatusToEnemy("bleed", 4);
            b.applyStatusToEnemy("vulnerable", 2);
        }
    },
    {
        id: "combo_ando_ii",
        chars: ["ando", "ii_naosuke"],
        title: "【幕閣の執政・大老と老中！】",
        desc: "防 22、敵の攻撃意図を半減、世論佐幕 5%。",
        apply: (b) => {
            b.gainPlayerShield(22);
            if (b.enemy && b.enemy.intent) {
                b.enemy.intent.damage = Math.floor((b.enemy.intent.damage || 0) / 2);
            }
            b.modifyPublicOpinion(-5);
        }
    },
    {
        id: "combo_ando_shungaku",
        chars: ["ando", "shungaku"],
        title: "【公武合体大計・幕政再建の策！】",
        desc: "防 18、列強介入 -5%、カードを2枚引く。",
        apply: (b) => {
            b.gainPlayerShield(18);
            b.modifyImperialGauge(-5);
            b.drawCards(2);
        }
    },
    {
        id: "combo_tsutsui_kawaji",
        chars: ["tsutsui", "kawaji"],
        title: "【下田条約全権・至誠の二老臣！】",
        desc: "防 20、文 +1、列強介入 -6%。",
        apply: (b) => {
            b.gainPlayerShield(20);
            b.player.energy = (b.player.energy || 0) + 1;
            b.modifyImperialGauge(-6);
        }
    },
    {
        id: "combo_tsutsui_mizuno",
        chars: ["tsutsui", "mizuno"],
        title: "【幕府老臣と敏腕奉行・外政の経綸！】",
        desc: "敵に 12 ダメージ、防 15、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(12);
            b.gainPlayerShield(15);
            b.drawCards(1);
        }
    },
    {
        id: "combo_mochizuki_takechi",
        chars: ["mochizuki", "takechi"],
        title: "【土佐勤王の烈火！】",
        desc: "敵に15ダメージ、腕力+4。",
        apply: (b) => {
            b.dealDamageToEnemy(15);
            b.applyPlayerBuff("strength", 4);
        }
    },
    {
        id: "combo_izo_takechi",
        chars: ["izo", "takechi"],
        title: "【勤王暗殺連携！】",
        desc: "敵に12ダメージ、流血3付与、腕力+3。",
        apply: (b) => {
            b.dealDamageToEnemy(12);
            b.applyStatusToEnemy("bleed", 3);
            b.applyPlayerBuff("strength", 3);
        }
    },
    {
        id: "combo_shinagawa_tanaka",
        chars: ["shinagawa", "tanaka"],
        title: "【密使の連絡網！】",
        desc: "カードを2枚引き、列強介入-3%。",
        apply: (b) => {
            b.drawCards(2);
            b.modifyImperialGauge(-4);
        }
    },
    {
        id: "combo_takahashi_yamaoka",
        chars: ["takahashi", "yamaoka"],
        title: "【江戸無血の双槍！】",
        desc: "防18、被ダメージ軽減4。",
        apply: (b) => {
            b.gainPlayerShield(18);
            b.applyPlayerBuff("damage_reduction", 4);
        }
    },
    {
        id: "combo_hijikata_takeda",
        chars: ["hijikata", "takeda"],
        title: "【局中軍学！】",
        desc: "敵に脱力3付与、敵に9ダメージ。",
        apply: (b) => {
            b.applyStatusToEnemy("weak", 3);
            b.dealDamageToEnemy(9);
        }
    },
    {
        id: "combo_kuroda_sakuma",
        chars: ["kuroda", "sakuma"],
        title: "【北辺海防の砲陣！】",
        desc: "敵に16ダメージ、防10。",
        apply: (b) => {
            b.dealDamageToEnemy(16);
            b.gainPlayerShield(10);
        }
    },
    {
        id: "combo_yamada_yoshida",
        chars: ["yamada", "yoshida"],
        title: "【松下村塾の継承！】",
        desc: "カードを2枚引き、腕力+3。",
        apply: (b) => {
            b.drawCards(2);
            b.applyPlayerBuff("strength", 3);
        }
    },
    {
        id: "combo_enomoto_iwazaki",
        chars: ["enomoto", "iwazaki"],
        title: "【海運艦隊の連携！】",
        desc: "文+1、敵に12ダメージ、列強介入+7%。",
        apply: (b) => {
            b.gainPlayerEnergy(1);
            b.dealDamageToEnemy(12);
            b.modifyImperialGauge(3);
        }
    },
    {
        id: "combo_abe_juro_matsumoto",
        chars: ["abe_juro", "matsumoto"],
        title: "【軍医遊撃の陣！】",
        desc: "HPを4回復、敵に脱力2付与。",
        apply: (b) => {
            b.healPlayer(8);
            b.applyStatusToEnemy("weak", 2);
        }
    },
    {
        id: "combo_akane_yamaoka",
        chars: ["akane", "yamaoka"],
        title: "【和平談判の刃！】",
        desc: "列強介入-3%、防12。",
        apply: (b) => {
            b.modifyImperialGauge(-8);
            b.gainPlayerShield(12);
        }
    },
    {
        id: "combo_irie_kusaka",
        chars: ["irie", "kusaka"],
        title: "【長州密議の猛攻！】",
        desc: "敵に13ダメージ、腕力+4。",
        apply: (b) => {
            b.dealDamageToEnemy(13);
            b.applyPlayerBuff("strength", 4);
        }
    },
    {
        id: "combo_goto_iwakura",
        chars: ["goto", "iwakura"],
        title: "【大政の双策！】",
        desc: "列強介入-3%、カードを1枚引く。",
        apply: (b) => {
            b.modifyImperialGauge(-8);
            b.drawCards(1);
        }
    },
    {
        id: "combo_fukuoka_soejima",
        chars: ["fukuoka", "soejima"],
        title: "【新政外交の両翼！】",
        desc: "防12、文+1。",
        apply: (b) => {
            b.gainPlayerShield(12);
            b.gainPlayerEnergy(1);
        }
    },
    {
        id: "combo_ijichi_yamagata",
        chars: ["ijichi", "yamagata"],
        title: "【薩摩陸軍の猛進！】",
        desc: "敵に14ダメージ、腕力+4。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.applyPlayerBuff("strength", 4);
        }
    },
    {
        id: "combo_eto_yokoi",
        chars: ["eto", "yokoi"],
        title: "【実学改革の連環！】",
        desc: "HPを4回復、カードを1枚引く、列強介入-3%。",
        apply: (b) => {
            b.healPlayer(6);
            b.drawCards(1);
            b.modifyImperialGauge(-4);
        }
    },
    {
        id: "combo_sanjo_yodo",
        chars: ["sanjo", "yodo"],
        title: "【公議朝廷の結束！】",
        desc: "防15、列強介入-3%。",
        apply: (b) => {
            b.gainPlayerShield(15);
            b.modifyImperialGauge(-6);
        }
    },
    {
        id: "combo_abe_shungaku",
        chars: ["abe", "shungaku"],
        title: "【海防公議の盾！】",
        desc: "防16、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerShield(16);
            b.drawCards(1);
        }
    },
    {
        id: "combo_kimura_oguri",
        chars: ["kimura", "oguri"],
        title: "【造船海防の双翼！】",
        desc: "敵に12ダメージ、列強介入-3%。",
        apply: (b) => {
            b.dealDamageToEnemy(12);
            b.modifyImperialGauge(-5);
        }
    },
    {
        id: "combo_sasaki_aijiro_suzuki",
        chars: ["sasaki_aijiro", "suzuki"],
        title: "【見廻り双刃！】",
        desc: "敵に10ダメージ、流血2付与。",
        apply: (b) => {
            b.dealDamageToEnemy(10);
            b.applyStatusToEnemy("bleed", 2);
        }
    },
    {
        id: "combo_kusaka_yoshida_minomaru",
        chars: ["kusaka", "yoshida_minomaru"],
        title: "【松下村塾の急襲！】",
        desc: "敵に15ダメージ、腕力+3。",
        apply: (b) => {
            b.dealDamageToEnemy(15);
            b.applyPlayerBuff("strength", 3);
        }
    },
    {
        id: "combo_izo_tanaka_shinbei",
        chars: ["izo", "tanaka_shinbei"],
        title: "【刺客血盟の太刀！】",
        desc: "敵に14ダメージ、流血4付与。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.applyStatusToEnemy("bleed", 4);
        }
    },

    // === 新規追加のコンボ（未設定志士28名を完全網羅） ===
    {
        id: "combo_takasugi_inoue",
        chars: ["takasugi", "inoue"],
        title: "【長州維新の俊英！】",
        desc: "敵に12ダメージ、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(12);
            b.drawCards(1);
        }
    },
    {
        id: "combo_kirishima_maebara",
        chars: ["kirishima", "maebara"],
        title: "【長州決死の強襲！】",
        desc: "敵に15ダメージ、腕力+3。",
        apply: (b) => {
            b.dealDamageToEnemy(15);
            b.applyPlayerBuff("strength", 3);
        }
    },
    {
        id: "combo_itagaki_okuma",
        chars: ["itagaki", "okuma"],
        title: "【民権の盟約！】",
        desc: "文+1、カードを1枚引く、列強介入-3%。",
        apply: (b) => {
            b.gainPlayerEnergy(1);
            b.drawCards(1);
            b.modifyImperialGauge(-4);
        }
    },
    {
        id: "combo_hirosawa_sasaki_takayuki",
        chars: ["hirosawa", "sasaki_takayuki"],
        title: "【新政審議の連携！】",
        desc: "防14、列強介入-3%。",
        apply: (b) => {
            b.gainPlayerShield(14);
            b.modifyImperialGauge(-5);
        }
    },
    {
        id: "combo_arima_maki",
        chars: ["arima", "maki"],
        title: "【尊皇義挙の烈火！】",
        desc: "敵に16ダメージ、腕力+4。",
        apply: (b) => {
            b.dealDamageToEnemy(16);
            b.applyPlayerBuff("strength", 4);
        }
    },
    {
        id: "combo_saigo_yoshii",
        chars: ["saigo", "yoshii"],
        title: "【薩摩連絡の信義！】",
        desc: "防10、カードを2枚引く。",
        apply: (b) => {
            b.gainPlayerShield(10);
            b.drawCards(2);
        }
    },
    {
        id: "combo_ito_kasshitaro_saito",
        chars: ["ito_kasshitaro", "saito"],
        title: "【御陵衛士の暗躍！】",
        desc: "敵に12ダメージ、敵に脱力2付与。",
        apply: (b) => {
            b.dealDamageToEnemy(12);
            b.applyStatusToEnemy("weak", 2);
        }
    },
    {
        id: "combo_katamori_sadaakira",
        chars: ["katamori", "sadaakira"],
        title: "【一会桑の絆！】",
        desc: "防18、HPを4回復。",
        apply: (b) => {
            b.gainPlayerShield(18);
            b.healPlayer(4);
        }
    },
    {
        id: "combo_akizuki_yamamoto",
        chars: ["akizuki", "yamamoto"],
        title: "【会津洋学の炯眼！】",
        desc: "防12、カードを2枚引く。",
        apply: (b) => {
            b.gainPlayerShield(12);
            b.drawCards(2);
        }
    },
    {
        id: "combo_komatsu_nakamura",
        chars: ["komatsu", "nakamura"],
        title: "【薩摩藩政の剛柔！】",
        desc: "敵に14ダメージ、防8、列強介入-3%。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.gainPlayerShield(8);
            b.modifyImperialGauge(-4);
        }
    },
    {
        id: "combo_yamakawa_akizuki",
        chars: ["yamakawa", "akizuki"],
        title: "【会津軍政の知恵・日光口の転戦！】",
        desc: "敵に 14 ダメージ、防 12、カードを 1 枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.gainPlayerShield(12);
            b.drawCards(1);
        }
    },
    {
        id: "combo_katsu_nagai",
        chars: ["katsu", "nagai"],
        title: "【幕臣海防の先見！】",
        desc: "防15、列強介入-3%、敵攻撃意図-3。",
        apply: (b) => {
            b.gainPlayerShield(15);
            b.modifyImperialGauge(-6);
            if (b.enemy && b.enemy.intent && b.enemy.intent.damage) {
                b.enemy.intent.damage = Math.max(0, b.enemy.intent.damage - 3);
            }
        }
    },
    {
        id: "combo_saigo_tanomo_katamori",
        chars: ["saigo_tanomo", "katamori"],
        title: "【会津の忠諫・家老の覚悟！】",
        desc: "防 16、HPを 4 回復、次のターンの被ダメージを 3 軽減。",
        apply: (b) => {
            b.gainPlayerShield(16);
            b.healPlayer(6);
            b.nextTurnDamageReduction = (b.nextTurnDamageReduction || 0) + 3;
        }
    },
    {
        id: "combo_sasaki_sasaki_aijiro",
        chars: ["sasaki", "sasaki_aijiro"],
        title: "【京都見廻の刃！】",
        desc: "敵に14ダメージ、流血3付与。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.applyStatusToEnemy("bleed", 3);
        }
    },
    {
        id: "combo_abe_masato_hara_ichinoshin",
        chars: ["abe_masato", "hara_ichinoshin"],
        title: "【徳川幕政の参謀！】",
        desc: "防16、列強介入-3%。",
        apply: (b) => {
            b.gainPlayerShield(16);
            b.modifyImperialGauge(-5);
        }
    },
    {
        id: "combo_hayashi_iba",
        chars: ["hayashi", "iba"],
        title: "【遊撃脱藩の武士道！】",
        desc: "敵に18ダメージ、腕力+4。",
        apply: (b) => {
            b.dealDamageToEnemy(18);
            b.applyPlayerBuff("strength", 4);
        }
    },
    {
        id: "combo_matsudaira_nobu_nomura",
        chars: ["matsudaira_nobu", "nomura"],
        title: "【藩屏守護の鉄陣！】",
        desc: "防20、被ダメージ軽減3。",
        apply: (b) => {
            b.gainPlayerShield(20);
            b.applyPlayerBuff("damage_reduction", 3);
        }
    },
    {
        id: "combo_tosa_trio",
        chars: ["takechi", "ryoma", "nakaoka"],
        title: "【土佐三傑・維新天動！】",
        desc: "敵に24ダメージ、防14、文+1、カードを2枚引く、列強介入-3%。",
        apply: (b) => {
            b.dealDamageToEnemy(24);
            b.gainPlayerShield(14);
            b.gainPlayerEnergy(1);
            b.drawCards(2);
            b.modifyImperialGauge(-6);
        }
    },
    {
        id: "combo_takechi_ryoma",
        chars: ["takechi", "ryoma"],
        title: "【土佐の奔流！】",
        desc: "敵に14ダメージ、防8、文+1。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.gainPlayerShield(8);
            b.gainPlayerEnergy(1);
        }
    },
    {
        id: "combo_takechi_nakaoka",
        chars: ["takechi", "nakaoka"],
        title: "【土佐勤王の義盟！】",
        desc: "敵に15ダメージ、列強介入-3%、腕力+3。",
        apply: (b) => {
            b.dealDamageToEnemy(15);
            b.modifyImperialGauge(-4);
            b.applyPlayerBuff("strength", 3);
        }
    },
    {
        id: "combo_shinsengumi_trio",
        chars: ["kondo", "hijikata", "okita"],
        title: "【誠の結び・試衛館三傑！】",
        desc: "敵に22ダメージ、防16、流血4付与、カードを2枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(22);
            b.gainPlayerShield(16);
            b.applyStatusToEnemy("bleed", 4);
            b.drawCards(2);
        }
    },
    {
        id: "combo_hijikata_okita",
        chars: ["hijikata", "okita"],
        title: "【天然理心流の極致！】",
        desc: "敵に14ダメージ、防8、流血3付与。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.gainPlayerShield(8);
            b.applyStatusToEnemy("bleed", 3);
        }
    },
    {
        id: "combo_kondo_okita",
        chars: ["kondo", "okita"],
        title: "【試衛館の師弟！】",
        desc: "敵に15ダメージ、防8、腕力+2。",
        apply: (b) => {
            b.dealDamageToEnemy(15);
            b.gainPlayerShield(8);
            b.applyPlayerBuff("strength", 2);
        }
    },
    {
        id: "combo_shoka_four_devas",
        chars: ["kusaka", "takasugi", "yoshida_minomaru", "irie"],
        title: "【松下村塾・松門四天王！】",
        desc: "敵に32ダメージ、腕力+6、防18、文+2、カードを2枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(32);
            b.applyPlayerBuff("strength", 6);
            b.gainPlayerShield(18);
            b.gainPlayerEnergy(2);
            b.drawCards(2);
        }
    },
    {
        id: "combo_takasugi_kusaka",
        chars: ["takasugi", "kusaka"],
        title: "【松下村塾の双璧！】",
        desc: "敵に18ダメージ、腕力+4、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(18);
            b.applyPlayerBuff("strength", 4);
            b.drawCards(1);
        }
    },
    {
        id: "combo_takasugi_minomaru",
        chars: ["takasugi", "yoshida_minomaru"],
        title: "【松門の奇才！】",
        desc: "敵に15ダメージ、腕力+3。",
        apply: (b) => {
            b.dealDamageToEnemy(15);
            b.applyPlayerBuff("strength", 3);
        }
    },
    {
        id: "combo_takasugi_irie",
        chars: ["takasugi", "irie"],
        title: "【松門の志士魂！】",
        desc: "敵に14ダメージ、防8、文+1。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.gainPlayerShield(8);
            b.gainPlayerEnergy(1);
        }
    },
    {
        id: "combo_minomaru_irie",
        chars: ["yoshida_minomaru", "irie"],
        title: "【松門の同門武功！】",
        desc: "敵に13ダメージ、防10、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(13);
            b.gainPlayerShield(10);
            b.drawCards(1);
        }
    },
    {
        id: "combo_ryoma_mochizuki",
        chars: ["ryoma", "mochizuki"],
        title: "【土佐脱藩・神戸海軍！】",
        desc: "敵に16ダメージ、防8、文+1。",
        apply: (b) => {
            b.dealDamageToEnemy(16);
            b.gainPlayerShield(8);
            b.gainPlayerEnergy(1);
        }
    },
    {
        id: "combo_shoin_shoka_trio",
        chars: ["yoshida", "takasugi", "kusaka"],
        title: "【松下村塾・至誠天動！】",
        desc: "敵に28ダメージ、腕力+6、防16、文+1、カードを2枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(28);
            b.applyPlayerBuff("strength", 6);
            b.gainPlayerShield(16);
            b.gainPlayerEnergy(1);
            b.drawCards(2);
        }
    },
    {
        id: "combo_shoin_takasugi",
        chars: ["yoshida", "takasugi"],
        title: "【松陰と晋作・至誠継承！】",
        desc: "敵に16ダメージ、腕力+4、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(16);
            b.applyPlayerBuff("strength", 4);
            b.drawCards(1);
        }
    },
    {
        id: "combo_shoin_kusaka",
        chars: ["yoshida", "kusaka"],
        title: "【松陰と玄瑞・至誠血盟！】",
        desc: "敵に16ダメージ、防10、腕力+3。",
        apply: (b) => {
            b.dealDamageToEnemy(16);
            b.gainPlayerShield(10);
            b.applyPlayerBuff("strength", 3);
        }
    },
    {
        id: "combo_shoin_minomaru",
        chars: ["yoshida", "yoshida_minomaru"],
        title: "【松下村塾の俊英！】",
        desc: "敵に14ダメージ、防8、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.gainPlayerShield(8);
            b.drawCards(1);
        }
    },
    {
        id: "combo_shoin_irie",
        chars: ["yoshida", "irie"],
        title: "【至誠の門弟・誠心！】",
        desc: "敵に12ダメージ、防12、被ダメージ軽減2。",
        apply: (b) => {
            b.dealDamageToEnemy(12);
            b.gainPlayerShield(12);
            b.applyPlayerBuff("damage_reduction", 2);
        }
    },
    {
        id: "combo_shoin_ito",
        chars: ["yoshida", "ito"],
        title: "【周旋の才！】",
        desc: "防12、列強介入-3%、文+1、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerShield(12);
            b.modifyImperialGauge(-4);
            b.gainPlayerEnergy(1);
            b.drawCards(1);
        }
    },
    {
        id: "combo_shoin_yamagata",
        chars: ["yoshida", "yamagata"],
        title: "【松陰の軍略薫陶！】",
        desc: "敵に15ダメージ、腕力+4。",
        apply: (b) => {
            b.dealDamageToEnemy(15);
            b.applyPlayerBuff("strength", 4);
        }
    },
    {
        id: "combo_shoin_maebara",
        chars: ["yoshida", "maebara"],
        title: "【松陰直伝の烈士！】",
        desc: "敵に18ダメージ、HPを4回復。",
        apply: (b) => {
            b.dealDamageToEnemy(18);
            b.healPlayer(3);
        }
    },
    {
        id: "combo_shoin_shinagawa",
        chars: ["yoshida", "shinagawa"],
        title: "【至誠の伝令！】",
        desc: "防10、カードを2枚引く。",
        apply: (b) => {
            b.gainPlayerShield(10);
            b.drawCards(2);
        }
    },
    {
        id: "combo_saigo_nakamura",
        chars: ["saigo", "nakamura"],
        title: "【薩摩示現の剛勇！】",
        desc: "敵に18ダメージ、腕力+4。",
        apply: (b) => {
            b.dealDamageToEnemy(18);
            b.applyPlayerBuff("strength", 4);
        }
    },
    {
        id: "combo_saigo_komatsu",
        chars: ["saigo", "komatsu"],
        title: "【薩摩維新の盟約！】",
        desc: "敵に14ダメージ、防10、列強介入-3%。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.gainPlayerShield(10);
            b.modifyImperialGauge(-4);
        }
    },
    {
        id: "combo_ii_abe",
        chars: ["ii_naosuke", "abe"],
        title: "【幕府大老の決断！】",
        desc: "防18、列強介入-3%。",
        apply: (b) => {
            b.gainPlayerShield(18);
            b.modifyImperialGauge(-6);
        }
    },
    {
        id: "combo_todo_harada",
        chars: ["todo", "harada"],
        title: "【試衛館・魁と槍撃！】",
        desc: "敵に14ダメージ、流血3付与。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.applyStatusToEnemy("bleed", 3);
        }
    },
    {
        id: "combo_todo_ito_kasshitaro",
        chars: ["todo", "ito_kasshitaro"],
        title: "【御陵衛士の義心！】",
        desc: "敵に12ダメージ、防8、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(12);
            b.gainPlayerShield(8);
            b.drawCards(1);
        }
    },
    {
        id: "combo_hijikata_shimada",
        chars: ["hijikata", "shimada"],
        title: "【箱館不抜の誠！】",
        desc: "防18、被ダメージ軽減3。",
        apply: (b) => {
            b.gainPlayerShield(18);
            b.applyPlayerBuff("damage_reduction", 3);
        }
    },
    {
        id: "combo_sadaakira_tatsumi",
        chars: ["sadaakira", "tatsumi"],
        title: "【桑名雷神の不敗陣！】",
        desc: "敵に16ダメージ、防12、敵シールド全破壊。",
        apply: (b) => {
            b.dealDamageToEnemy(16);
            b.gainPlayerShield(12);
            if (b.enemy) b.enemy.shield = 0;
        }
    },
    {
        id: "combo_iba_hitomi",
        chars: ["iba", "hitomi"],
        title: "【遊撃隊の義盟！】",
        desc: "敵に16ダメージ、腕力+4。",
        apply: (b) => {
            b.dealDamageToEnemy(16);
            b.applyPlayerBuff("strength", 4);
        }
    },
    {
        id: "combo_ito_inoue",
        chars: ["ito","inoue"],
        title: "【長州五傑の盟友！】",
        desc: "文+1、カードを1枚引き、列強介入-3%。",
        apply: (b) => {
            b.gainPlayerEnergy(1); b.drawCards(1); b.modifyImperialGauge(-4);
        }
    },
    {
        id: "combo_katsura_ito",
        chars: ["katsura","ito"],
        title: "【長州政務の継承！】",
        desc: "敵に12ダメージ、防10、文+1。",
        apply: (b) => {
            b.dealDamageToEnemy(12); b.gainPlayerShield(10); b.gainPlayerEnergy(1);
        }
    },
    {
        id: "combo_takasugi_yamagata",
        chars: ["takasugi","yamagata"],
        title: "【奇兵隊の師弟！】",
        desc: "敵に16ダメージ、腕力+3。",
        apply: (b) => {
            b.dealDamageToEnemy(16); b.applyPlayerBuff('strength', 3);
        }
    },
    {
        id: "combo_takasugi_ito",
        chars: ["takasugi","ito"],
        title: "【功山寺義挙の呼応！】",
        desc: "敵に15ダメージ、文+1、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(15); b.gainPlayerEnergy(1); b.drawCards(1);
        }
    },
    {
        id: "combo_omura_yamada",
        chars: ["omura","yamada"],
        title: "【近代兵制の師弟！】",
        desc: "敵に14ダメージ、防10、敵シールド全破壊。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(10); if (b.enemy) b.enemy.shield = 0;
        }
    },
    {
        id: "combo_yamagata_yamada",
        chars: ["yamagata","yamada"],
        title: "【長州陸軍の俊英！】",
        desc: "敵に14ダメージ、防8、腕力+3。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(8); b.applyPlayerBuff('strength', 3);
        }
    },
    {
        id: "combo_katsura_kusaka",
        chars: ["katsura","kusaka"],
        title: "【長州尊皇の双璧！】",
        desc: "敵に15ダメージ、防10、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(15); b.gainPlayerShield(10); b.drawCards(1);
        }
    },
    {
        id: "combo_kusaka_shinagawa",
        chars: ["kusaka","shinagawa"],
        title: "【松門尊攘の絆！】",
        desc: "敵に12ダメージ、腕力+3、HPを4回復。",
        apply: (b) => {
            b.dealDamageToEnemy(12); b.applyPlayerBuff('strength', 3); b.healPlayer(4);
        }
    },
    {
        id: "combo_yoshida_inoue",
        chars: ["yoshida","inoue"],
        title: "【松下村塾の英才！】",
        desc: "敵に10ダメージ、防10、文+1。",
        apply: (b) => {
            b.dealDamageToEnemy(10); b.gainPlayerShield(10); b.gainPlayerEnergy(1);
        }
    },
    {
        id: "combo_yamagata_maebara",
        chars: ["yamagata","maebara"],
        title: "【長州幹部の共闘！】",
        desc: "敵に14ダメージ、防8、敵に脱力2付与。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(8); b.applyStatusToEnemy('weak', 2);
        }
    },
    {
        id: "combo_hirosawa_katsura",
        chars: ["hirosawa","katsura"],
        title: "【長州政務の重鎮！】",
        desc: "敵に14ダメージ、防14、列強介入-3%。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(14); b.modifyImperialGauge(-4);
        }
    },
    {
        id: "combo_katsura_sanjo",
        chars: ["katsura", "sanjo"],
        title: "【朝廷周旋・七卿落ちの信義！】",
        desc: "防 14、カードを 2 枚引く、列強介入度 -4%。",
        apply: (b) => {
            b.gainPlayerShield(14);
            b.drawCards(2);
            if (window.app) window.app.modifyImperialGauge(-3);
        }
    },
    {
        id: "combo_maki_kusaka",
        chars: ["maki","kusaka"],
        title: "【禁門の義挙・天王山の誓い！】",
        desc: "敵に18ダメージ、腕力+4、HPを4消費。",
        apply: (b) => {
            b.dealDamageToEnemy(18); b.applyPlayerBuff('strength', 4); b.damagePlayer(4);
        }
    },
    {
        id: "combo_kirishima_kusaka",
        chars: ["kirishima","kusaka"],
        title: "【蛤御門の突進！】",
        desc: "敵に20ダメージ、流血3付与。",
        apply: (b) => {
            b.dealDamageToEnemy(20); b.applyStatusToEnemy('bleed', 3);
        }
    },
    {
        id: "combo_akane_takasugi",
        chars: ["akane","takasugi"],
        title: "【奇兵隊の連帯！】",
        desc: "敵に14ダメージ、防10、文+1。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(10); b.gainPlayerEnergy(1);
        }
    },
    {
        id: "combo_iwakura_saigo",
        chars: ["iwakura","saigo"],
        title: "【王政復古の大号令！】",
        desc: "敵に18ダメージ、防12、文+1。",
        apply: (b) => {
            b.dealDamageToEnemy(18); b.gainPlayerShield(12); b.gainPlayerEnergy(1);
        }
    },
    {
        id: "combo_iwakura_okubo",
        chars: ["iwakura","okubo"],
        title: "【維新断行の盟友！】",
        desc: "防16、列強介入-3%、カードを2枚引く。",
        apply: (b) => {
            b.gainPlayerShield(16); b.modifyImperialGauge(-6); b.drawCards(2);
        }
    },
    {
        id: "combo_okubo_komatsu",
        chars: ["okubo","komatsu"],
        title: "【薩摩藩庁の盟約！】",
        desc: "防14、列強介入-3%、文+1。",
        apply: (b) => {
            b.gainPlayerShield(14); b.modifyImperialGauge(-5); b.gainPlayerEnergy(1);
        }
    },
    {
        id: "combo_katsura_okubo",
        chars: ["katsura","okubo"],
        title: "【薩長鼎立の経綸！】",
        desc: "敵に14ダメージ、防14、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(14); b.drawCards(1);
        }
    },
    {
        id: "combo_saigo_kuroda",
        chars: ["saigo","kuroda"],
        title: "【薩摩師弟の信義！】",
        desc: "敵に16ダメージ、防12、HPを4回復。",
        apply: (b) => {
            b.dealDamageToEnemy(16); b.gainPlayerShield(12); b.healPlayer(5);
        }
    },
    {
        id: "combo_saigo_itagaki",
        chars: ["saigo","itagaki"],
        title: "【薩土倒幕の盟約！】",
        desc: "敵に18ダメージ、腕力+4。",
        apply: (b) => {
            b.dealDamageToEnemy(18); b.applyPlayerBuff('strength', 4);
        }
    },
    {
        id: "combo_komatsu_ryoma",
        chars: ["komatsu","ryoma"],
        title: "【薩土海援の盟約！】",
        desc: "敵に12ダメージ、防12、文+1、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(12); b.gainPlayerShield(12); b.gainPlayerEnergy(1); b.drawCards(1);
        }
    },
    {
        id: "combo_ijichi_nakamura",
        chars: ["ijichi","nakamura"],
        title: "【薩摩示現の双璧！】",
        desc: "敵に20ダメージ、敵の攻撃意図を3減少。",
        apply: (b) => {
            b.dealDamageToEnemy(20); if (b.enemy && b.enemy.intent) b.enemy.intent.damage = Math.max(0, (b.enemy.intent.damage || 0) - 3);
        }
    },
    {
        id: "combo_arima_tanaka_shinbei",
        chars: ["arima","tanaka_shinbei"],
        title: "【薩摩精忠の烈剣！】",
        desc: "敵に18ダメージ、流血3付与。",
        apply: (b) => {
            b.dealDamageToEnemy(18); b.applyStatusToEnemy('bleed', 3);
        }
    },
    {
        id: "combo_okubo_yoshii",
        chars: ["okubo","yoshii"],
        title: "【精忠組の絆！】",
        desc: "防12、カードを1枚引き、HPを4回復。",
        apply: (b) => {
            b.gainPlayerShield(12); b.drawCards(1); b.healPlayer(4);
        }
    },
    {
        id: "combo_kawamura_saigo",
        chars: ["kawamura","saigo"],
        title: "【薩摩海軍の驍将！】",
        desc: "敵に16ダメージ、防12、敵シールドを8破壊。",
        apply: (b) => {
            b.dealDamageToEnemy(16); b.gainPlayerShield(12); if (b.enemy) b.enemy.shield = Math.max(0, (b.enemy.shield || 0) - 8);
        }
    },
    {
        id: "combo_saigo_tanomo_yamakawa",
        chars: ["saigo_tanomo", "yamakawa"],
        title: "【会津主従・白河口防衛！】",
        desc: "敵に 14 ダメージ、防 14、HPを 4 回復。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(14); b.healPlayer(4);
        }
    },
    {
        id: "combo_ryoma_goto",
        chars: ["ryoma","goto"],
        title: "【清風亭の盟約・大政奉還！】",
        desc: "敵に15ダメージ、防12、列強介入-3%、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(15); b.gainPlayerShield(12); b.modifyImperialGauge(-6); b.drawCards(1);
        }
    },
    {
        id: "combo_ryoma_iwazaki",
        chars: ["ryoma","iwazaki"],
        title: "【海援隊と三菱の黎明！】",
        desc: "敵に12ダメージ、防10、文+1、15両を得る。",
        apply: (b) => {
            b.dealDamageToEnemy(12); b.gainPlayerShield(10); b.gainPlayerEnergy(1); if (b.app) b.app.gold += 15;
        }
    },
    {
        id: "combo_goto_itagaki",
        chars: ["goto","itagaki"],
        title: "【自由民権の双璧！】",
        desc: "敵に14ダメージ、防10、文+1。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(10); b.gainPlayerEnergy(1);
        }
    },
    {
        id: "combo_nakaoka_itagaki",
        chars: ["nakaoka","itagaki"],
        title: "【薩土密約の盟友！】",
        desc: "敵に16ダメージ、防8、腕力+3。",
        apply: (b) => {
            b.dealDamageToEnemy(16); b.gainPlayerShield(8); b.applyPlayerBuff('strength', 3);
        }
    },
    {
        id: "combo_goto_fukuoka",
        chars: ["goto","fukuoka"],
        title: "【土佐建白の同志！】",
        desc: "防14、列強介入-3%、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerShield(14); b.modifyImperialGauge(-5); b.drawCards(1);
        }
    },
    {
        id: "combo_goto_yodo",
        chars: ["goto","yodo"],
        title: "【鯨海酔侯と腹心！】",
        desc: "敵に12ダメージ、防14、文+1。",
        apply: (b) => {
            b.dealDamageToEnemy(12); b.gainPlayerShield(14); b.gainPlayerEnergy(1);
        }
    },
    {
        id: "combo_goto_sasaki_takayuki",
        chars: ["goto","sasaki_takayuki"],
        title: "【土佐政務の参謀！】",
        desc: "防12、列強介入-3%、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerShield(12); b.modifyImperialGauge(-4); b.drawCards(1);
        }
    },
    {
        id: "combo_nakaoka_tanaka",
        chars: ["nakaoka","tanaka"],
        title: "【陸援隊の誓い！】",
        desc: "敵に14ダメージ、防8、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(8); b.drawCards(1);
        }
    },
    {
        id: "combo_nakaoka_sanjo",
        chars: ["nakaoka","sanjo"],
        title: "【五卿守護の信義！】",
        desc: "防15、HPを4回復、列強介入-3%。",
        apply: (b) => {
            b.gainPlayerShield(15); b.healPlayer(5); b.modifyImperialGauge(-4);
        }
    },
    {
        id: "combo_iwakura_sanjo",
        chars: ["iwakura","sanjo"],
        title: "【王政復古・朝廷の双翼！】",
        desc: "防18、文+1、カードを2枚引く。",
        apply: (b) => {
            b.gainPlayerShield(18); b.gainPlayerEnergy(1); b.drawCards(2);
        }
    },
    {
        id: "combo_okuma_soejima",
        chars: ["okuma","soejima"],
        title: "【佐賀の双璧・致遠の友！】",
        desc: "敵に12ダメージ、防12、列強介入-3%、文+1。",
        apply: (b) => {
            b.dealDamageToEnemy(12); b.gainPlayerShield(12); b.modifyImperialGauge(-5); b.gainPlayerEnergy(1);
        }
    },
    {
        id: "combo_okuma_eto",
        chars: ["okuma","eto"],
        title: "【佐賀英傑の連衡！】",
        desc: "敵に15ダメージ、防8、文+1。",
        apply: (b) => {
            b.dealDamageToEnemy(15); b.gainPlayerShield(8); b.gainPlayerEnergy(1);
        }
    },
    {
        id: "combo_yokoi_shungaku",
        chars: ["yokoi","shungaku"],
        title: "【国是三論の知遇！】",
        desc: "防16、文+1、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerShield(16); b.gainPlayerEnergy(1); b.drawCards(1);
        }
    },
    {
        id: "combo_ryoma_yokoi",
        chars: ["ryoma","yokoi"],
        title: "【新国家の構想！】",
        desc: "敵に12ダメージ、防12、文+1、カードを2枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(12); b.gainPlayerShield(12); b.gainPlayerEnergy(1); b.drawCards(2);
        }
    },
    {
        id: "combo_ryoma_shungaku",
        chars: ["ryoma","shungaku"],
        title: "【海軍創設の庇護！】",
        desc: "防15、文+1、15両を得る。",
        apply: (b) => {
            b.gainPlayerShield(15); b.gainPlayerEnergy(1); if (b.app) b.app.gold += 15;
        }
    },
    {
        id: "combo_yodo_shungaku",
        chars: ["yodo","shungaku"],
        title: "【四賢侯の英邁！】",
        desc: "防16、列強介入-3%、HPを4回復。",
        apply: (b) => {
            b.gainPlayerShield(16); b.modifyImperialGauge(-5); b.healPlayer(5);
        }
    },
    {
        id: "combo_sakuma_katsu",
        chars: ["sakuma","katsu"],
        title: "【海防砲術の義兄弟！】",
        desc: "敵に14ダメージ、防14、列強介入-3%。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(14); b.modifyImperialGauge(-5);
        }
    },
    {
        id: "combo_sakuma_yoshida",
        chars: ["sakuma","yoshida"],
        title: "【東洋道徳・西洋芸術！】",
        desc: "敵に14ダメージ、文+1、カードを2枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerEnergy(1); b.drawCards(2);
        }
    },
    {
        id: "combo_kondo_nagakura",
        chars: ["kondo","nagakura"],
        title: "【試衛館・神道無念の剛剣！】",
        desc: "敵に16ダメージ、防8、反撃態勢（8反射）。",
        apply: (b) => {
            b.dealDamageToEnemy(16); b.gainPlayerShield(8); b.applyPlayerBuff('thorns', 8);
        }
    },
    {
        id: "combo_kondo_harada",
        chars: ["kondo","harada"],
        title: "【試衛館・種田流の豪槍！】",
        desc: "敵に15ダメージ、防8、反撃態勢（8反射）。",
        apply: (b) => {
            b.dealDamageToEnemy(15); b.gainPlayerShield(8); b.applyPlayerBuff('thorns', 8);
        }
    },
    {
        id: "combo_kondo_saito",
        chars: ["kondo","saito"],
        title: "【誠の潜入・絶対の信頼！】",
        desc: "敵に16ダメージ、防10、敵に脱力2付与。",
        apply: (b) => {
            b.dealDamageToEnemy(16); b.gainPlayerShield(10); b.applyStatusToEnemy('weak', 2);
        }
    },
    {
        id: "combo_kondo_shimada",
        chars: ["kondo","shimada"],
        title: "【誠の巨魁・不抜の護衛！】",
        desc: "防18、反撃態勢（10反射）。",
        apply: (b) => {
            b.gainPlayerShield(18); b.applyPlayerBuff('thorns', 10);
        }
    },
    {
        id: "combo_hijikata_saito",
        chars: ["hijikata","saito"],
        title: "【新選組の双璧・不敗の刃！】",
        desc: "敵に18ダメージ、防10、流血2付与。",
        apply: (b) => {
            b.dealDamageToEnemy(18); b.gainPlayerShield(10); b.applyStatusToEnemy('bleed', 2);
        }
    },
    {
        id: "combo_okita_todo",
        chars: ["okita","todo"],
        title: "【試衛館の若駒！】",
        desc: "敵に14ダメージ、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.drawCards(1);
        }
    },
    {
        id: "combo_okita_nagakura",
        chars: ["okita","nagakura"],
        title: "【新選組・最強の双刃！】",
        desc: "敵に18ダメージ、防6。",
        apply: (b) => {
            b.dealDamageToEnemy(18); b.gainPlayerShield(6);
        }
    },
    {
        id: "combo_nagakura_harada",
        chars: ["nagakura","harada"],
        title: "【靖兵の義兄弟！】",
        desc: "敵に16ダメージ、防8、流血2付与。",
        apply: (b) => {
            b.dealDamageToEnemy(16); b.gainPlayerShield(8); b.applyStatusToEnemy('bleed', 2);
        }
    },
    {
        id: "combo_nagakura_todo",
        chars: ["nagakura","todo"],
        title: "【魁先生と二番隊！】",
        desc: "敵に14ダメージ、防6、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(6); b.drawCards(1);
        }
    },
    {
        id: "combo_sannan_todo",
        chars: ["sannan","todo"],
        title: "【誠の文武・温情の友！】",
        desc: "防12、カードを1枚引き、HPを4回復。",
        apply: (b) => {
            b.gainPlayerShield(12); b.drawCards(1); b.healPlayer(4);
        }
    },
    {
        id: "combo_ito_kasshitaro_suzuki",
        chars: ["ito_kasshitaro","suzuki"],
        title: "【御陵衛士の兄弟！】",
        desc: "敵に14ダメージ、防8、敵に脱力1付与。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(8); b.applyStatusToEnemy('weak', 1);
        }
    },
    {
        id: "combo_kondo_matsumoto",
        chars: ["kondo","matsumoto"],
        title: "【幕府軍医の温情！】",
        desc: "防14、HPを4回復。",
        apply: (b) => {
            b.gainPlayerShield(14); b.healPlayer(8);
        }
    },
    {
        id: "combo_takeda_kondo",
        chars: ["takeda","kondo"],
        title: "【甲州軍学の指南！】",
        desc: "防16、カードを2枚引く。",
        apply: (b) => {
            b.gainPlayerShield(16); b.drawCards(2);
        }
    },
    {
        id: "combo_abe_juro_suzuki",
        chars: ["abe_juro","suzuki"],
        title: "【油小路脱出の盟約！】",
        desc: "敵に14ダメージ、防10、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(10); b.drawCards(1);
        }
    },
    {
        id: "combo_katamori_akizuki",
        chars: ["katamori","akizuki"],
        title: "【会津主従・忠節の奏上！】",
        desc: "防16、HPを4回復、列強介入-3%。",
        apply: (b) => {
            b.gainPlayerShield(16); b.healPlayer(5); b.modifyImperialGauge(-4);
        }
    },
    {
        id: "combo_katamori_yamamoto",
        chars: ["katamori","yamamoto"],
        title: "【守護職砲術の信任！】",
        desc: "敵に14ダメージ、防14、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(14); b.drawCards(1);
        }
    },
    {
        id: "combo_katamori_sagawa",
        chars: ["katamori","sagawa"],
        title: "【鬼神の忠誠！】",
        desc: "敵に16ダメージ、防12、反撃態勢（10反射）。",
        apply: (b) => {
            b.dealDamageToEnemy(16); b.gainPlayerShield(12); b.applyPlayerBuff('thorns', 10);
        }
    },
    {
        id: "combo_yamakawa_sadaakira",
        chars: ["yamakawa","sadaakira"],
        title: "【会桑不抜・柏崎の同盟！】",
        desc: "敵に15ダメージ、防12、HPを4回復。",
        apply: (b) => {
            b.dealDamageToEnemy(15); b.gainPlayerShield(12); b.healPlayer(4);
        }
    },
    {
        id: "combo_yamagawa_yamamoto",
        chars: ["yamakawa","yamamoto"],
        title: "【会津蘭学・防備の絆！】",
        desc: "敵に12ダメージ、防12、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(12); b.gainPlayerShield(12); b.drawCards(1);
        }
    },
    {
        id: "combo_sadaakira_kondo",
        chars: ["sadaakira","kondo"],
        title: "【所司代と誠の刀！】",
        desc: "敵に14ダメージ、防14、反撃態勢（8反射）。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(14); b.applyPlayerBuff('thorns', 8);
        }
    },
    {
        id: "combo_sagawa_saito",
        chars: ["sagawa","saito"],
        title: "【会津義戦の抜刀！】",
        desc: "敵に18ダメージ、防8、流血2付与。",
        apply: (b) => {
            b.dealDamageToEnemy(18); b.gainPlayerShield(8); b.applyStatusToEnemy('bleed', 2);
        }
    },
    {
        id: "combo_tatsumi_kawai",
        chars: ["tatsumi","kawai"],
        title: "【北越不敗の同盟！】",
        desc: "敵に18ダメージ、敵シールド全破壊、防10。",
        apply: (b) => {
            b.dealDamageToEnemy(18); b.gainPlayerShield(10); if (b.enemy) b.enemy.shield = 0;
        }
    },
    {
        id: "combo_yamakawa_taizo_katamori",
        chars: ["yamakawa","katamori"],
        title: "【彼岸獅子の奇策！】",
        desc: "敵に12ダメージ、防16、HPを4回復。",
        apply: (b) => {
            b.dealDamageToEnemy(12); b.gainPlayerShield(16); b.healPlayer(5);
        }
    },
    {
        id: "combo_sasaki_kondo",
        chars: ["sasaki","kondo"],
        title: "【京都見廻と新選組！】",
        desc: "敵に18ダメージ、防8、反撃態勢（8反射）。",
        apply: (b) => {
            b.dealDamageToEnemy(18); b.gainPlayerShield(8); b.applyPlayerBuff('thorns', 8);
        }
    },
    {
        id: "combo_matsudaira_nobu_katamori",
        chars: ["matsudaira_nobu","katamori"],
        title: "【畿内守護の陣！】",
        desc: "防18、HPを4回復。",
        apply: (b) => {
            b.gainPlayerShield(18); b.healPlayer(4);
        }
    },
    {
        id: "combo_nomura_akizuki",
        chars: ["nomura","akizuki"],
        title: "【会津公用の方策！】",
        desc: "防14、列強介入-3%、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerShield(14); b.modifyImperialGauge(-4); b.drawCards(1);
        }
    },
    {
        id: "combo_katsu_yamaoka",
        chars: ["katsu","yamaoka"],
        title: "【幕末の三舟・直談判の信義！】",
        desc: "敵に14ダメージ、防16、列強介入-3%。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(16); b.modifyImperialGauge(-6);
        }
    },
    {
        id: "combo_katsu_takahashi",
        chars: ["katsu","takahashi"],
        title: "【幕末の三舟・護持の槍！】",
        desc: "敵に12ダメージ、防18。",
        apply: (b) => {
            b.dealDamageToEnemy(12); b.gainPlayerShield(18);
        }
    },
    {
        id: "combo_yamaoka_saigo",
        chars: ["yamaoka","saigo"],
        title: "【無刀と巨魁・至誠の肝胆！】",
        desc: "敵に16ダメージ、防16、列強介入-3%。",
        apply: (b) => {
            b.dealDamageToEnemy(16); b.gainPlayerShield(16); b.modifyImperialGauge(-6);
        }
    },
    {
        id: "combo_katsu_enomoto",
        chars: ["katsu","enomoto"],
        title: "【幕府海軍の先駆！】",
        desc: "敵に15ダメージ、防12、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(15); b.gainPlayerShield(12); b.drawCards(1);
        }
    },
    {
        id: "combo_katsu_kimura",
        chars: ["katsu","kimura"],
        title: "【咸臨丸渡米の絆！】",
        desc: "防16、列強介入-3%、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerShield(16); b.modifyImperialGauge(-6); b.drawCards(1);
        }
    },
    {
        id: "combo_katsu_abe",
        chars: ["katsu","abe"],
        title: "【海防建白の抜擢！】",
        desc: "防16、文+1、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerShield(16); b.gainPlayerEnergy(1); b.drawCards(1);
        }
    },
    {
        id: "combo_enomoto_hijikata",
        chars: ["enomoto","hijikata"],
        title: "【五稜郭の誓い・蝦夷の夢！】",
        desc: "敵に18ダメージ、防12、腕力+4。",
        apply: (b) => {
            b.dealDamageToEnemy(18); b.gainPlayerShield(12); b.applyPlayerBuff('strength', 4);
        }
    },
    {
        id: "combo_enomoto_kuroda",
        chars: ["enomoto","kuroda"],
        title: "【箱館の助命・北溟の友！】",
        desc: "敵に15ダメージ、防15、HPを4回復。",
        apply: (b) => {
            b.dealDamageToEnemy(15); b.gainPlayerShield(15); b.healPlayer(6);
        }
    },
    {
        id: "combo_enomoto_koga",
        chars: ["enomoto","koga"],
        title: "【箱館艦隊の忠魂！】",
        desc: "敵に18ダメージ、敵シールド全破壊。",
        apply: (b) => {
            b.dealDamageToEnemy(18); if (b.enemy) b.enemy.shield = 0;
        }
    },
    {
        id: "combo_enomoto_oguri",
        chars: ["enomoto","oguri"],
        title: "【幕府近代化の双翼！】",
        desc: "敵に14ダメージ、防14、列強介入-3%。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(14); b.modifyImperialGauge(-5);
        }
    },
    {
        id: "combo_enomoto_matsumoto",
        chars: ["enomoto","matsumoto"],
        title: "【箱館救療の仁術！】",
        desc: "防15、HPを4回復。",
        apply: (b) => {
            b.gainPlayerShield(15); b.healPlayer(8);
        }
    },
    {
        id: "combo_hijikata_otori",
        chars: ["hijikata","otori"],
        title: "【箱館陸軍の双将！】",
        desc: "敵に16ダメージ、防12、腕力+3。",
        apply: (b) => {
            b.dealDamageToEnemy(16); b.gainPlayerShield(12); b.applyPlayerBuff('strength', 3);
        }
    },
    {
        id: "combo_hijikata_iba",
        chars: ["hijikata","iba"],
        title: "【箱館迎撃の美剣！】",
        desc: "敵に18ダメージ、防8。",
        apply: (b) => {
            b.dealDamageToEnemy(18); b.gainPlayerShield(8);
        }
    },
    {
        id: "combo_oguri_nagai",
        chars: ["oguri","nagai"],
        title: "【幕府経綸の俊才！】",
        desc: "防14、列強介入-3%、文+1。",
        apply: (b) => {
            b.gainPlayerShield(14); b.modifyImperialGauge(-6); b.gainPlayerEnergy(1);
        }
    },
    {
        id: "combo_hara_ichinoshin_shungaku",
        chars: ["hara_ichinoshin","shungaku"],
        title: "【一橋改革の英断！】",
        desc: "防16、文+1、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerShield(16); b.gainPlayerEnergy(1); b.drawCards(1);
        }
    },
    {
        id: "combo_hayashi_hitomi",
        chars: ["hayashi","hitomi"],
        title: "【遊撃義挙の共闘！】",
        desc: "敵に16ダメージ、防10、腕力+3。",
        apply: (b) => {
            b.dealDamageToEnemy(16); b.gainPlayerShield(10); b.applyPlayerBuff('strength', 3);
        }
    },
    {
        id: "combo_abe_masato_abe",
        chars: ["abe_masato","abe"],
        title: "【幕閣改革の連繋！】",
        desc: "防16、列強介入-3%、文+1。",
        apply: (b) => {
            b.gainPlayerShield(16); b.modifyImperialGauge(-5); b.gainPlayerEnergy(1);
        }
    },
    {
        id: "combo_ii_naosuke_nagai",
        chars: ["ii_naosuke","nagai"],
        title: "【大老と幕閣の決断！】",
        desc: "防16、列強介入-3%、文+1。",
        apply: (b) => {
            b.gainPlayerShield(16); b.modifyImperialGauge(-6); b.gainPlayerEnergy(1);
        }
    },
    {
        id: "combo_hitomi_otori",
        chars: ["hitomi","otori"],
        title: "【箱館遊撃の陣砲！】",
        desc: "敵に16ダメージ、防10、敵シールド全破壊。",
        apply: (b) => {
            b.dealDamageToEnemy(16); b.gainPlayerShield(10); if (b.enemy) b.enemy.shield = 0;
        }
    },
    {
        id: "combo_godai_ryoma",
        chars: ["godai", "ryoma"],
        title: "【海運交易の盟友！】",
        desc: "敵に8ダメージ、15両を獲得。",
        apply: (b) => {
            b.dealDamageToEnemy(8);
            if (window.app) window.app.gold += 15;
        }
    },
    {
        id: "combo_godai_komatsu",
        chars: ["godai", "komatsu"],
        title: "【薩摩通商の推進！】",
        desc: "防8、列強介入-3%。",
        apply: (b) => {
            b.gainPlayerShield(8);
            b.modifyImperialGauge(-3);
        }
    },
    {
        id: "combo_yoshimura_takechi",
        chars: ["yoshimura", "takechi"],
        title: "【土佐勤王の血脈！】",
        desc: "敵に10ダメージ、攻撃力+3。",
        apply: (b) => {
            b.dealDamageToEnemy(10);
            b.playerStrengthBuff = (b.playerStrengthBuff || 0) + 3;
        }
    },
    {
        id: "combo_yoshimura_maki",
        chars: ["yoshimura", "maki"],
        title: "【尊王挙兵の先駆け！】",
        desc: "敵に12ダメージ、自傷2。",
        apply: (b) => {
            b.dealDamageToEnemy(12);
            b.damagePlayerDirect(2);
        }
    },
    {
        id: "combo_mizuno_abe",
        chars: ["mizuno", "abe"],
        title: "【開国海防の腹心！】",
        desc: "防10、列強介入-3%。",
        apply: (b) => {
            b.gainPlayerShield(10);
            b.modifyImperialGauge(-4);
        }
    },
    {
        id: "combo_mizuno_nagai",
        chars: ["mizuno", "nagai"],
        title: "【幕閣外交の俊英！】",
        desc: "防8、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerShield(8);
            b.drawCards(1);
        }
    },
    {
        id: "combo_kiyokawa_kondo",
        chars: ["kiyokawa", "kondo"],
        title: "【浪士組上洛の盟約！】",
        desc: "敵に8ダメージ、防6。",
        apply: (b) => {
            b.dealDamageToEnemy(8);
            b.gainPlayerShield(6);
        }
    },
    {
        id: "combo_kiyokawa_sasaki",
        chars: ["kiyokawa", "sasaki"],
        title: "【京都と江戸の治安！】",
        desc: "敵に10ダメージ、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(10);
            b.drawCards(1);
        }
    },
    {
        id: "combo_takeda_yoshida",
        chars: ["takeda_kounsai", "yoshida"],
        title: "【水戸と長州の烽火！】",
        desc: "敵に12ダメージ、防8、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(12);
            b.gainPlayerShield(8);
            b.drawCards(1);
        }
    },
    {
        id: "combo_takeda_hara",
        chars: ["takeda_kounsai", "hara_ichinoshin"],
        title: "【水戸両雄の運命！】",
        desc: "敵に14ダメージ、流血3付与。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.applyStatusToEnemy('bleed', 3);
        }
    },
    {
        id: "combo_ogasawara_mizuno",
        chars: ["ogasawara", "mizuno"],
        title: "【幕閣外交の英断！】",
        desc: "防16、列強介入-3%、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerShield(16);
            if (window.app) window.app.modifyImperialGauge(-3);
            b.drawCards(1);
        }
    },
    {
        id: "combo_ogasawara_enomoto",
        chars: ["ogasawara", "enomoto"],
        title: "【幕臣不抜の転戦！】",
        desc: "敵に12ダメージ、防14、次回攻撃力+2。",
        apply: (b) => {
            b.dealDamageToEnemy(12);
            b.gainPlayerShield(14);
            if (window.app) window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 8;
        }
    },
    {
        id: "combo_sagara_saigo",
        chars: ["sagara", "saigo"],
        title: "【倒幕激発の密謀！】",
        desc: "敵に16ダメージ、防10、次回攻撃力+2。",
        apply: (b) => {
            b.dealDamageToEnemy(16);
            b.gainPlayerShield(10);
            if (window.app) window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 8;
        }
    },
    {
        id: "combo_sagara_itagaki",
        chars: ["sagara", "itagaki"],
        title: "【東山道先鋒の魁！】",
        desc: "敵に14ダメージ、防8、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.gainPlayerShield(8);
            b.drawCards(1);
        }
    },
    {
        id: "combo_sagara_takeda",
        chars: ["sagara", "takeda_kounsai"],
        title: "【尊攘義旗の継承！】",
        desc: "敵に15ダメージ、防8、次回攻撃力+2。",
        apply: (b) => {
            b.dealDamageToEnemy(15);
            b.gainPlayerShield(8);
            if (window.app) window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 6;
        }
    },
    {
        id: "combo_shibusawa_godai",
        chars: ["shibusawa", "godai"],
        title: "【東西の経済巨頭！】",
        desc: "防10、20両を獲得、敵全体に10ダメージ。",
        apply: (b) => {
            b.gainPlayerShield(10);
            b.dealDamageToEnemy(10);
            if (window.app) window.app.gold += 20;
        }
    },
    {
        id: "combo_shibusawa_oguri",
        chars: ["shibusawa", "oguri"],
        title: "【幕府近代化の遺産！】",
        desc: "防14、列強介入度-5%、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerShield(14);
            b.drawCards(1);
            if (window.app) window.app.modifyImperialGauge(-3);
        }
    },
    {
        id: "combo_shibusawa_katsu",
        chars: ["shibusawa", "katsu"],
        title: "【徳川の信義と再生！】",
        desc: "防12、敵の次の攻撃力を半減、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerShield(12);
            b.drawCards(1);
            if (b.enemy) {
                b.enemy.nextDamageMultiplier = 0.5;
            }
        }
    },
    {
        id: "combo_shibusawa_hara",
        chars: ["shibusawa", "hara_ichinoshin"],
        title: "【一橋家登用の恩義！】",
        desc: "敵に12ダメージ、次回攻撃力+2、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(12);
            b.drawCards(1);
            if (window.app) window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 6;
        }
    },
    // === 史実連携コンボ（追加24組） ===
    // --- 佐幕派・幕府勢力（12組） ---
    {
        id: "combo_sannan_okita",
        chars: ["sannan", "okita"],
        title: "【試衛館の情愛・哀惜の太刀！】",
        desc: "敵に14ダメージ、防8、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.gainPlayerShield(8);
            b.drawCards(1);
        }
    },
    {
        id: "combo_sannan_hijikata",
        chars: ["sannan", "hijikata"],
        title: "【総長と副長・局中草創の誓い！】",
        desc: "防14、敵全体に脱力2、次回攻撃力+2。",
        apply: (b) => {
            b.gainPlayerShield(14);
            if (b.enemy) b.enemy.debuffWeak = (b.enemy.debuffWeak || 0) + 2;
            if (window.app) window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 4;
        }
    },
    {
        id: "combo_shimada_saito",
        chars: ["shimada", "saito"],
        title: "【新選組の殿軍・不滅の誠！】",
        desc: "敵に12ダメージ、防16。",
        apply: (b) => {
            b.dealDamageToEnemy(12);
            b.gainPlayerShield(16);
        }
    },
    {
        id: "combo_tatsumi_otori",
        chars: ["tatsumi", "otori"],
        title: "【雷神と伝習・不敗の指揮！】",
        desc: "敵に16ダメージ、敵シールドを8破壊、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(16);
            b.destroyEnemyShield(8);
            b.drawCards(1);
        }
    },
    {
        id: "combo_tatsumi_hijikata",
        chars: ["tatsumi", "hijikata"],
        title: "【箱館決戦・雷神と鬼！】",
        desc: "敵に18ダメージ、防10。",
        apply: (b) => {
            b.dealDamageToEnemy(18);
            b.gainPlayerShield(10);
        }
    },
    {
        id: "combo_koga_hijikata",
        chars: ["koga", "hijikata"],
        title: "【宮古湾突入・アポルダージュ！】",
        desc: "敵に20ダメージ、敵シールド全破壊、被ダメ-3。",
        apply: (b) => {
            b.dealDamageToEnemy(20);
            if (b.enemy) b.enemy.shield = 0;
            if (window.app) window.app.damageReductionNextTurn = (window.app.damageReductionNextTurn || 0) + 3;
        }
    },
    {
        id: "combo_kawai_sakuma",
        chars: ["kawai", "sakuma"],
        title: "【象山門下の先見・富国強兵！】",
        desc: "敵に16ダメージ、25両獲得、列強介入度-3%。",
        apply: (b) => {
            b.dealDamageToEnemy(16);
            if (window.app) {
                window.app.gold += 15;
                window.app.modifyImperialGauge(-3);
            }
        }
    },
    {
        id: "combo_kawai_katsu",
        chars: ["kawai", "katsu"],
        title: "【長岡の気概と海舟の大局！】",
        desc: "防16、列強介入度-5%、敵の次攻撃力を半減。",
        apply: (b) => {
            b.gainPlayerShield(16);
            if (window.app) window.app.modifyImperialGauge(-3);
            if (b.enemy) b.enemy.nextDamageMultiplier = 0.5;
        }
    },
    {
        id: "combo_ii_mizuno",
        chars: ["ii_naosuke", "mizuno"],
        title: "【大老と奉行・開国条約の断行！】",
        desc: "防16、列強介入度-6%、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerShield(16);
            b.drawCards(1);
            if (window.app) window.app.modifyImperialGauge(-3);
        }
    },
    {
        id: "combo_hayashi_enomoto",
        chars: ["hayashi", "enomoto"],
        title: "【脱藩藩主と総裁・蝦夷の義挙！】",
        desc: "敵に14ダメージ、防14、次回攻撃力+2。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.gainPlayerShield(14);
            if (window.app) window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 6;
        }
    },
    {
        id: "combo_yamakawa_sagawa",
        chars: ["yamakawa", "sagawa"],
        title: "【会津の知謀と猛撃・城下の絆！】",
        desc: "敵に16ダメージ、防10、HP4回復。",
        apply: (b) => {
            b.dealDamageToEnemy(16);
            b.gainPlayerShield(10);
            if (window.app) window.app.healPlayer(4);
        }
    },
    {
        id: "combo_kimura_enomoto",
        chars: ["kimura", "enomoto"],
        title: "【長崎伝習・幕府海軍の黎明！】",
        desc: "防14、敵シールドを8破壊、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerShield(14);
            b.destroyEnemyShield(8);
            b.drawCards(1);
        }
    },
    // --- 討幕派・薩長土肥（12組） ---
    {
        id: "combo_katsura_saigo",
        chars: ["katsura", "saigo"],
        title: "【薩長盟約の巨頭・新時代の大業！】",
        desc: "敵全体に16ダメージ、防12、次回攻撃力+2。",
        apply: (b) => {
            b.dealDamageToEnemy(16);
            b.gainPlayerShield(12);
            if (window.app) window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 6;
        }
    },
    {
        id: "combo_katsura_fukuoka",
        chars: ["katsura", "fukuoka"],
        title: "【五箇条御誓文の起草！】",
        desc: "防12、カードを2枚引く、次回攻撃力+2。",
        apply: (b) => {
            b.gainPlayerShield(12);
            b.drawCards(2);
            if (window.app) window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 4;
        }
    },
    {
        id: "combo_katsura_yamada",
        chars: ["katsura", "yamada"],
        title: "【長州軍政・用兵の俊英！】",
        desc: "敵に18ダメージ、敵のシールドを8破壊、防8。",
        apply: (b) => {
            b.dealDamageToEnemy(18);
            b.gainPlayerShield(8);
            if (b.enemy) b.enemy.shield = Math.max(0, (b.enemy.shield || 0) - 8);
        }
    },
    {
        id: "combo_ijichi_saigo",
        chars: ["ijichi", "saigo"],
        title: "【薩摩の頭脳と大器・不敗の軍略！】",
        desc: "敵全体に14ダメージ、防10、敵剛力を解除。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.gainPlayerShield(10);
            if (b.enemy && b.enemy.buffStrength > 0) {
                b.enemy.buffStrength = 0;
            }
        }
    },
    {
        id: "combo_ijichi_kuroda",
        chars: ["ijichi", "kuroda"],
        title: "【薩摩軍総撃・北征の砲陣！】",
        desc: "敵に16ダメージ、防6、次回攻撃力+2。",
        apply: (b) => {
            b.dealDamageToEnemy(16);
            b.gainPlayerShield(6);
            if (window.app) window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 6;
        }
    },
    {
        id: "combo_arima_okubo",
        chars: ["arima", "okubo"],
        title: "【精忠組結党・薩摩の志士気骨！】",
        desc: "敵に18ダメージ、自HP3消費、25両獲得。",
        apply: (b) => {
            b.dealDamageToEnemy(18);
            b.damagePlayerDirect(3);
            if (window.app) window.app.gold += 15;
        }
    },
    {
        id: "combo_iwazaki_goto",
        chars: ["iwazaki", "goto"],
        title: "【土佐商会・海運と政商の胎動！】",
        desc: "軍資金50両獲得、防12。",
        apply: (b) => {
            b.gainPlayerShield(12);
            if (window.app) window.app.gold += 20;
        }
    },
    {
        id: "combo_iwazaki_godai",
        chars: ["iwazaki", "godai"],
        title: "【海運と鉱山・近代財界の二大巨頭！】",
        desc: "軍資金40両獲得、防10、列強介入度-4%。",
        apply: (b) => {
            b.gainPlayerShield(10);
            if (window.app) {
                window.app.gold += 20;
                window.app.modifyImperialGauge(-3);
            }
        }
    },
    {
        id: "combo_kirishima_takasugi",
        chars: ["kirishima", "takasugi"],
        title: "【奇兵と遊撃・長州諸隊の突進！】",
        desc: "敵に22ダメージ、敵シールド全破壊、次回攻撃力+2。",
        apply: (b) => {
            b.dealDamageToEnemy(22);
            if (b.enemy) b.enemy.shield = 0;
            if (window.app) window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 4;
        }
    },
    {
        id: "combo_maebara_takasugi",
        chars: ["maebara", "takasugi"],
        title: "【松陰門下の義挙・功山寺の魁！】",
        desc: "敵に16ダメージ、カードを1枚引く、次回攻撃力+2。",
        apply: (b) => {
            b.dealDamageToEnemy(16);
            b.drawCards(1);
            if (window.app) window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 4;
        }
    },
    {
        id: "combo_eto_soejima",
        chars: ["eto", "soejima"],
        title: "【佐賀二傑・法治と外交の礎！】",
        desc: "敵に14ダメージ、防12、敵の次攻撃力-4。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.gainPlayerShield(12);
            if (b.enemy) {
                b.enemy.nextTurnStrengthDebuff = (b.enemy.nextTurnStrengthDebuff || 0) + 4;
            }
        }
    },
    {
        id: "combo_yoshimura_izo",
        chars: ["yoshimura", "izo"],
        title: "【土佐勤王の天誅・暗闘の刃！】",
        desc: "敵に18ダメージ、敵に流血3を付与。",
        apply: (b) => {
            b.dealDamageToEnemy(18);
            if (b.enemy) b.enemy.debuffBleed = (b.enemy.debuffBleed || 0) + 3;
        }
    },
    {
        id: "combo_kawamura_kuroda",
        chars: ["kawamura", "kuroda"],
        title: "【海防軍政の防備！】",
        desc: "防14、敵シールド8破壊。",
        apply: (b) => {
            b.gainPlayerShield(14);
            if (b.enemy) b.enemy.shield = Math.max(0, (b.enemy.shield || 0) - 8);
        }
    },
    {
        id: "combo_saigo_tanomo_sagawa",
        chars: ["saigo_tanomo", "sagawa"],
        title: "【会津の勇猛・家老と猛将！】",
        desc: "敵に16ダメージ、防10、次回攻撃力+2。",
        apply: (b) => {
            b.dealDamageToEnemy(16);
            b.gainPlayerShield(10);
            if (window.app) window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 5;
        }
    },
    {
        id: "combo_kawamura_katsu",
        chars: ["kawamura", "katsu"],
        title: "【海軍伝習・薩摩と幕臣！】",
        desc: "防14、列強介入度-4%、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerShield(14);
            b.drawCards(1);
            if (window.app) window.app.modifyImperialGauge(-3);
        }
    },
    {
        id: "combo_takechi_tanaka_shinbei",
        chars: ["takechi", "tanaka_shinbei"],
        title: "【薩土天誅・義兄弟の刃！】",
        desc: "敵に 18 ダメージ、次回攻撃力 +6、流血 3 を付与、HPを 3 消費。",
        apply: (b) => {
            b.dealDamageToEnemy(18);
            if (window.app) window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 6;
            if (b.enemy) b.enemy.debuffBleed = (b.enemy.debuffBleed || 0) + 3;
            b.damagePlayer(3);
        }
    },
    // === 萱野権兵衛 史実コンボ（会津藩家老・殉難の忠義） ===
    {
        id: "combo_kayano_katamori",
        chars: ["kayano", "katamori"],
        title: "【主家殉難・義の家老！】",
        desc: "防 18、HP 4 回復、デバフを解除。",
        apply: (b) => {
            b.gainPlayerShield(18);
            b.healPlayer(5);
            if (b.playerDebuffs) b.playerDebuffs = {};
        }
    },
    {
        id: "combo_kayano_saigo_tanomo",
        chars: ["kayano", "saigo_tanomo"],
        title: "【会津両家老・悲愁の決別！】",
        desc: "敵に 14 ダメージ、防 12、次ターンの被ダメージ 3 軽減。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.gainPlayerShield(12);
            b.applyPlayerBuff("damage_reduction", 3);
        }
    },
    {
        id: "combo_kayano_sagawa",
        chars: ["kayano", "sagawa"],
        title: "【会津士魂・不抜の覚悟！】",
        desc: "敵に 16 ダメージ、防 10、次回攻撃力 +5。",
        apply: (b) => {
            b.dealDamageToEnemy(16);
            b.gainPlayerShield(10);
            if (window.app) window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 5;
        }
    },
    // === 周布政之助 史実コンボ（長州藩執政・尊攘開国の経綸） ===
    {
        id: "combo_sufu_katsura",
        chars: ["sufu", "katsura"],
        title: "【長州藩政の師弟！】",
        desc: "敵に 14 ダメージ、防 12、カードを 2 枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.gainPlayerShield(12);
            b.drawCards(2);
        }
    },
    {
        id: "combo_sufu_yoshida",
        chars: ["sufu", "yoshida"],
        title: "【至誠開花・村塾庇護！】",
        desc: "防 12、カードを 2 枚引く、次回攻撃力 +4。",
        apply: (b) => {
            b.gainPlayerShield(12);
            b.drawCards(2);
            if (window.app) window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 4;
        }
    },
    {
        id: "combo_sufu_takasugi",
        chars: ["sufu", "takasugi"],
        title: "【奇兵隊創設の英断！】",
        desc: "敵に 18 ダメージ、次回攻撃力 +6。",
        apply: (b) => {
            b.dealDamageToEnemy(18);
            if (window.app) window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 6;
        }
    },
    // === 酒井玄蕃 史実コンボ（庄内藩猛将・戊辰不敗の鬼玄蕃） ===
    {
        id: "combo_sakai_katamori",
        chars: ["sakai_genba", "katamori"],
        title: "【奥羽越の盟主・不抜の絆！】",
        desc: "敵に 16 ダメージ、防 14、敵シールドを 8 破壊。",
        apply: (b) => {
            b.dealDamageToEnemy(16);
            b.gainPlayerShield(14);
            if (b.enemy) b.enemy.shield = Math.max(0, (b.enemy.shield || 0) - 8);
        }
    },
    {
        id: "combo_sakai_tatsumi",
        chars: ["sakai_genba", "tatsumi"],
        title: "【奥羽連勝・雷神と鬼玄蕃！】",
        desc: "敵に 20 ダメージ、次回攻撃力 +8。",
        apply: (b) => {
            b.dealDamageToEnemy(20);
            if (window.app) window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 8;
        }
    },
    {
        id: "combo_sakai_kawai",
        chars: ["sakai_genba", "kawai"],
        title: "【北越連帯・最新兵器の雷撃！】",
        desc: "敵に 18 ダメージ、敵シールドを 10 破壊。",
        apply: (b) => {
            b.dealDamageToEnemy(18);
            if (b.enemy) b.enemy.shield = Math.max(0, (b.enemy.shield || 0) - 10);
        }
    },
    // === 新規追加 史実コネクトリンク（8組追加：233組→241組） ===
    {
        id: "combo_nariakira_saigo",
        chars: ["nariakira", "saigo"],
        title: "【薩摩の師弟・集成の号令！】",
        desc: "敵に 20 ダメージ、次戦攻撃力 +6、文 +1。",
        apply: (b) => {
            b.dealDamageToEnemy(20);
            b.gainPlayerEnergy(1);
            if (window.app) window.app.nextBattleStrengthBuff = (window.app.nextBattleStrengthBuff || 0) + 6;
        }
    },
    {
        id: "combo_manjiro_katsu",
        chars: ["manjiro", "katsu"],
        title: "【太平洋の羅針盤！】",
        desc: "防 16、カードを2枚引く。列強介入 -4%。",
        apply: (b) => {
            b.gainPlayerShield(16);
            b.drawCards(2);
            b.modifyImperialGauge(-4);
        }
    },
    {
        id: "combo_yuri_ryoma",
        chars: ["yuri", "ryoma"],
        title: "【新貨創出・船中の国論！】",
        desc: "敵に 14 ダメージ、文 +1、軍資金 30両 を獲得。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.gainPlayerEnergy(1);
            if (window.app) window.app.gold += 30;
        }
    },
    {
        id: "combo_hirano_saigo",
        chars: ["hirano", "saigo"],
        title: "【錦江湾の絆・狂瀾の義！】",
        desc: "敵に 18 ダメージ、敵に脱力 2、剛力 +3。",
        apply: (b) => {
            b.dealDamageToEnemy(18);
            b.applyStatusToEnemy("weak", 2);
            b.applyPlayerBuff("strength", 3);
        }
    },
    {
        id: "combo_yoshinobu_katsu",
        chars: ["yoshinobu", "katsu"],
        title: "【徳川の泰平・大局の決断！】",
        desc: "防 20、文 +1、敵の全攻撃意図を半減。",
        apply: (b) => {
            b.gainPlayerShield(20);
            b.gainPlayerEnergy(1);
            if (b.enemy && b.enemy.intent && b.enemy.intent.damage) {
                b.enemy.intent.damage = Math.floor(b.enemy.intent.damage / 2);
            }
        }
    },
    {
        id: "combo_takeko_yamakawa",
        chars: ["takeko", "yamakawa"],
        title: "【会津の華・義烈の薙刀！】",
        desc: "敵に 18 ダメージ、防 10、敵シールドを 10 破壊。",
        apply: (b) => {
            b.dealDamageToEnemy(18);
            b.gainPlayerShield(10);
            if (b.enemy) b.enemy.shield = Math.max(0, (b.enemy.shield || 0) - 10);
        }
    },
    {
        id: "combo_iwase_abe",
        chars: ["iwase", "abe"],
        title: "【安政外交の双璧！】",
        desc: "防 14、列強介入 -6%、文 +1。",
        apply: (b) => {
            b.gainPlayerShield(14);
            b.modifyImperialGauge(-6);
            b.gainPlayerEnergy(1);
        }
    },
    {
        id: "combo_hattori_ito",
        chars: ["hattori", "ito_kasshitaro"],
        title: "【御陵衛士・孤高の二刀！】",
        desc: "敵に 22 ダメージ、敵に「脆弱 2」（被ダメージ50%増）。",
        apply: (b) => {
            b.dealDamageToEnemy(22);
            b.applyStatusToEnemy("vulnerable", 2);
        }
    },
    {
        id: "combo_yae_kakuma",
        chars: ["yae", "yamamoto"],
        title: "【山本兄妹・洋学と連発銃！】",
        desc: "敵に 18 ダメージ、防 10、列強介入 -3%。",
        apply: (b) => {
            b.dealDamageToEnemy(18);
            b.gainPlayerShield(10);
            b.modifyImperialGauge(-3);
        }
    },
    {
        id: "combo_yae_takeko",
        chars: ["yae", "takeko"],
        title: "【会津二藍・薙刀と連発銃！】",
        desc: "敵に 20 ダメージ、敵シールド全破壊。",
        apply: (b) => {
            b.dealDamageToEnemy(20);
            if (b.enemy) b.enemy.shield = 0;
        }
    },

    {
        id: "combo_toko_takeda",
        chars: ["toko", "takeda_kounsai"],
        title: "【水戸両雄・回天の義旗！】",
        desc: "敵に 22 ダメージ、味方剛力 +3、世論討幕 5%。",
        apply: (b) => {
            b.dealDamageToEnemy(22);
            b.applyPlayerBuff("strength", 3);
            b.modifyPublicOpinion(5);
        }
    },
    {
        id: "combo_toko_shoin",
        chars: ["toko", "yoshida"],
        title: "【志士覚醒・正気の系譜！】",
        desc: "防 14、文 +1、カードを2枚引く。",
        apply: (b) => {
            b.gainPlayerShield(14);
            b.player.energy = (b.player.energy || 0) + 1;
            b.drawCards(2);
        }
    },
    {
        id: "combo_sanai_shungaku",
        chars: ["sanai", "shungaku"],
        title: "【越前名君と俊英・啓発の政道！】",
        desc: "防 18、敵脱力 2、手札上限 +1。",
        apply: (b) => {
            b.gainPlayerShield(18);
            b.applyStatusToEnemy("weak", 2);
            b.drawCards(1);
        }
    },
    {
        id: "combo_sanai_saigo",
        chars: ["sanai", "saigo"],
        title: "【一橋派密契・天下の奔走！】",
        desc: "敵に 20 ダメージ、敵脆弱 2、軍資金 25両 獲得。",
        apply: (b) => {
            b.dealDamageToEnemy(20);
            b.applyStatusToEnemy("vulnerable", 2);
            if (window.bakumatsuApp) window.bakumatsuApp.gold += 25;
        }
    },
    {
        id: "combo_kawaji_mizuno",
        chars: ["kawaji", "mizuno"],
        title: "【安政の実務・至誠の勘定！】",
        desc: "防 16、列強介入 -6%、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerShield(16);
            b.modifyImperialGauge(-6);
            b.drawCards(1);
        }
    },
    {
        id: "combo_kawaji_abe",
        chars: ["kawaji", "abe"],
        title: "【老中首座と名奉行・国難の経綸！】",
        desc: "防 20、文 +1、列強介入 -5%。",
        apply: (b) => {
            b.gainPlayerShield(20);
            b.player.energy = (b.player.energy || 0) + 1;
            b.modifyImperialGauge(-5);
        }
    },
    {
        id: "combo_serizawa_kondo",
        chars: ["serizawa", "kondo"],
        title: "【壬生浪士組・両局長の豪剣！】",
        desc: "敵に 24 ダメージ、敵シールド 8 破壊。",
        apply: (b) => {
            if (b.enemy && b.enemy.shield > 0) {
                b.enemy.shield = Math.max(0, b.enemy.shield - 8);
            }
            b.dealDamageToEnemy(24);
        }
    },
    {
        id: "combo_serizawa_kiyokawa",
        chars: ["serizawa", "kiyokawa"],
        title: "【浪士組上洛・京洛の破乱！】",
        desc: "敵に 18 ダメージ、防 10、敵に「流血 3」付与。",
        apply: (b) => {
            b.dealDamageToEnemy(18);
            b.gainPlayerShield(10);
            b.applyStatusToEnemy("bleed", 3);
        }
    },
]
};

// ==========================================
// 全140件 歴史事件の史実メタデータ定義
// （発生年、月、表示期間、マップ用短縮タイトル）
// ==========================================
GAME_DATA.eventMeta = {

    // 1853-1864年期 追加歴史事件メタデータ第2弾（8件）
    "event_daiba_construction": { year: 1853, month: 8, period: "1853年8月", shortTitle: "品川台場築造" },
    "event_rus_japan_shimoda_talks": { year: 1854, month: 11, period: "1854年11月", shortTitle: "下田露日談判" },
    "event_tekijuku_flourish": { year: 1856, month: 5, period: "1856年5月", shortTitle: "大坂適塾隆盛" },
    "event_kazunomiya_kobu_gattai": { year: 1861, month: 10, period: "1861年10月", shortTitle: "和宮降嫁" },
    "event_hisamitsu_joraku_seichugumi": { year: 1862, month: 3, period: "1862年3月", shortTitle: "島津久光上洛" },
    "event_choshu_koto_policy": { year: 1861, month: 4, period: "1861年4月", shortTitle: "航海遠略策" },
    "event_kobe_kaigun_sorenjo_founding": { year: 1863, month: 4, period: "1863年4月", shortTitle: "神戸操練所創設" },
    "event_shimonoseki_bombardment_four_nations": { year: 1864, month: 8, period: "1864年8月", shortTitle: "下関四カ国砲撃" },

    // 1853-1864年期 追加歴史事件メタデータ（14件）
    "event_shimoda_putiatin_treaty": { year: 1854, month: 12, period: "1854年12月", shortTitle: "日露通好条約" },
    "event_fujita_toko_anzai": { year: 1855, month: 2, period: "1855年2月", shortTitle: "回天詩史" },
    "event_boicho_treaty": { year: 1857, month: 12, period: "1857年12月", shortTitle: "日蘭追加条約" },
    "event_sanai_hitotsubashi_plot": { year: 1858, month: 3, period: "1858年3月", shortTitle: "一橋派密謀" },
    "event_nariakira_death": { year: 1858, month: 8, period: "1858年8月", shortTitle: "斉彬の急死" },
    "event_boshin_chokuji_edo": { year: 1858, month: 8, period: "1858年8月", shortTitle: "戊午の密勅" },
    "event_kurofune_kanrinmaru_voyage": { year: 1860, month: 1, period: "1860年1月", shortTitle: "咸臨丸横断" },
    "event_tosa_kinnoto_formation": { year: 1861, month: 8, period: "1861年8月", shortTitle: "土佐勤王党" },
    "event_azabu_heuskens_assassination": { year: 1861, month: 12, period: "1861年12月", shortTitle: "ヒュースケン暗殺" },
    "event_tozenji_incident": { year: 1861, month: 5, period: "1861年5月", shortTitle: "東禅寺事件" },
    "event_bunkyu_reform": { year: 1862, month: 8, period: "1862年8月", shortTitle: "文久の改革" },
    "event_yoshida_toyo_assassination": { year: 1862, month: 4, period: "1862年4月", shortTitle: "吉田東洋暗殺" },
    "event_kamo_jinja_gyokou": { year: 1863, month: 3, period: "1863年3月", shortTitle: "賀茂神社行幸" },
    "event_roshigumi_departure": { year: 1863, month: 2, period: "1863年2月", shortTitle: "浪士組出立" },
    "event_tennozan_maki_stand": { year: 1864, month: 7, period: "1864年7月", shortTitle: "天王山自刃" },
    // 新規追加歴史事件メタデータ（8件）
    "event_shuseikan_project": { year: 1851, month: 4, period: "1851年4月", shortTitle: "集成館事業" },
    "event_manjiro_return": { year: 1851, month: 10, period: "1851年10月", shortTitle: "万次郎帰航" },
    "event_shimoda_harris_talks": { year: 1857, month: 10, period: "1857年10月", shortTitle: "下田会談" },
    "event_ikuno_uprising": { year: 1863, month: 10, period: "1863年10月", shortTitle: "生野の変" },
    "event_aburakoji_hattori": { year: 1867, month: 11, period: "1867年11月", shortTitle: "油小路死闘" },
    "event_yoshinobu_kyoujun": { year: 1868, month: 2, period: "1868年2月", shortTitle: "慶喜公恭順" },
    "event_dajokan_satsu": { year: 1868, month: 5, period: "1868年5月", shortTitle: "太政官札" },
    "event_aizu_nadeshiko": { year: 1868, month: 8, period: "1868年8月", shortTitle: "会津娘子隊" },
    "event_yae_spencer": { year: 1868, month: 8, period: "1868年8月", shortTitle: "八重スペンサー銃" },
    "event_sakuma_assassination": { year: 1864, month: 7, period: "1864年7月", shortTitle: "佐久間象山暗殺" },
    "event_sannan_seppuku": { year: 1865, month: 2, period: "1865年2月", shortTitle: "山南敬助の切腹" },
    "event_izo_execution": { year: 1865, month: 5, period: "1865年5月", shortTitle: "土佐勤王党の獄" },
    "event_takasugi_illness": { year: 1867, month: 4, period: "1867年4月", shortTitle: "高杉晋作の病臥" },
    "event_takeda_assassination": { year: 1867, month: 6, period: "1867年6月", shortTitle: "銭取橋の粛清" },
    "event_oguri_execution": { year: 1868, month: 4, period: "1868年4月", shortTitle: "小栗上野介処刑" },
    "event_okita_farewell": { year: 1868, month: 5, period: "1868年5月", shortTitle: "沖田総司の病臥" },
    // === 第一幕（京洛動乱期：〜1864年）全41件 ===
    "event_tenpo_reform": { year: 1841, month: 5, period: "1841年", shortTitle: "天保の改革" },
    "event_foreign_ship_edict": { year: 1842, month: 7, period: "1842年", shortTitle: "薪水給与令" },
    "event_satsuma_trade": { year: 1851, month: 2, period: "1851年", shortTitle: "薩摩の富国強兵" },
    "event_uraga_arrival": { year: 1853, month: 6, period: "1853年6月", shortTitle: "黒船来航" },
    "event_kanagawa_treaty": { year: 1854, month: 3, period: "1854年3月", shortTitle: "日米和親条約" },
    "event_nagasaki_naval_school": { year: 1855, month: 8, period: "1855年", shortTitle: "海軍伝習所" },
    "event_ansei_earthquake": { year: 1855, month: 10, period: "1855年10月", shortTitle: "安政江戸地震" },
    "event_nagasaki_magistrate": { year: 1856, month: 7, period: "1856年", shortTitle: "長崎奉行所" },
    "event_harris_treaty": { year: 1858, month: 6, period: "1858年6月", shortTitle: "修好通商条約" },
    "event_andei_purge": { year: 1858, month: 9, period: "1858年", shortTitle: "安政の大獄" },
    "event_yokohama_opening": { year: 1859, month: 6, period: "1859年6月", shortTitle: "横浜開港" },
    "event_glover": { year: 1859, month: 9, period: "1859年", shortTitle: "グラバー商会" },
    "event_manen_embassy": { year: 1860, month: 1, period: "1860年1月", shortTitle: "万延遣米使節" },
    "event_sakuradamon": { year: 1860, month: 3, period: "1860年3月", shortTitle: "桜田門外の変" },
    "event_ii_successor": { year: 1860, month: 4, period: "1860年4月", shortTitle: "揺れる幕府" },
    "event_teradaya_conflict": { year: 1862, month: 4, period: "1862年4月", shortTitle: "寺田屋騒動" },
    "event_satsuma_after_teradaya": { year: 1862, month: 5, period: "1862年5月", shortTitle: "薩摩の粛清" },
    "event_namugi_incident": { year: 1862, month: 8, period: "1862年8月", shortTitle: "生麦事件" },
    "event_izo_assassination": { year: 1862, month: 10, period: "1862年秋", shortTitle: "人斬り以蔵" },
    "event_mibu_drill": { year: 1863, month: 3, period: "1863年3月", shortTitle: "壬生屯所の練" },
    "event_shinsengumi_formation": { year: 1863, month: 3, period: "1863年3月", shortTitle: "新選組結成" },
    "event_shinchogumi": { year: 1863, month: 4, period: "1863年4月", shortTitle: "新徴組" },
    "event_shimonoseki": { year: 1863, month: 5, period: "1863年5月", shortTitle: "下関攘夷砲火" },
    "event_kiheitai_formation": { year: 1863, month: 6, period: "1863年6月", shortTitle: "奇兵隊結成" },
    "event_satsuma_british_war": { year: 1863, month: 7, period: "1863年7月", shortTitle: "薩英戦争" },
    "event_august_coup": { year: 1863, month: 8, period: "1863年8月", shortTitle: "八月十八政変" },
    "event_seven_nobles_exile": { year: 1863, month: 8, period: "1863年8月", shortTitle: "七卿落ち" },
    "event_tenchu_revolt": { year: 1863, month: 8, period: "1863年8月", shortTitle: "天誅組の変" },
    "event_okita_dojo": { year: 1863, month: 9, period: "1863年9月", shortTitle: "沖田総司指南" },
    "event_sanjo_council": { year: 1864, month: 1, period: "1864年1月", shortTitle: "参与会議" },
    "event_tenguto_rising": { year: 1864, month: 3, period: "1864年3月", shortTitle: "天狗党挙兵" },
    "event_kyoto_shugoshoku_office": { year: 1864, month: 4, period: "1864年4月", shortTitle: "京都守護職" },
    "event_kobe_training": { year: 1864, month: 5, period: "1864年5月", shortTitle: "神戸海軍操練" },
    "event_ikedaya": { year: 1864, month: 6, period: "1864年6月", shortTitle: "池田屋事件" },
    "event_hamaguri_gate": { year: 1864, month: 7, period: "1864年7月", shortTitle: "禁門の変" },
    "event_choshu_expedition": { year: 1864, month: 8, period: "1864年8月", shortTitle: "長州征討" },
    "event_shimoda_smuggle": { year: 1854, month: 3, period: "1854年3月", shortTitle: "下田沖密航" },
    "event_sakashitamon": { year: 1862, month: 1, period: "1862年1月", shortTitle: "坂下門外変" },
    "event_gotenyama": { year: 1863, month: 1, period: "1863年1月", shortTitle: "御殿山焼討" },
    "event_iemochi_jouraku": { year: 1863, month: 3, period: "1863年3月", shortTitle: "将軍家茂上洛" },
    "event_serizawa_assassination": { year: 1863, month: 9, period: "1863年9月", shortTitle: "芹沢鴨暗殺" },

    // === 第二幕（東海道進撃期：1865年〜1868年春）全32件 ===
    "event_satsuma_reform": { year: 1865, month: 1, period: "1865年", shortTitle: "薩摩軍制改革" },
    "event_satsuma_students": { year: 1865, month: 3, period: "1865年3月", shortTitle: "英国留学生" },
    "event_hyogo_armada": { year: 1865, month: 9, period: "1865年9月", shortTitle: "兵庫沖艦隊" },
    "event_satcho_alliance": { year: 1866, month: 1, period: "1866年1月", shortTitle: "薩長同盟" },
    "event_teradaya": { year: 1866, month: 1, period: "1866年1月", shortTitle: "寺田屋の遭難" },
    "event_satsuma_decision": { year: 1866, month: 5, period: "1866年5月", shortTitle: "討幕への転回" },
    "event_satcho_protocol": { year: 1866, month: 6, period: "1866年6月", shortTitle: "薩長盟約密議" },
    "event_second_choshu_war": { year: 1866, month: 6, period: "1866年6月", shortTitle: "四境戦争" },
    "event_paris_expo": { year: 1867, month: 1, period: "1867年1月", shortTitle: "パリ万博使節" },
    "event_yokoi_reform": { year: 1867, month: 5, period: "1867年5月", shortTitle: "横井小楠建白" },
    "event_taisei_hokan": { year: 1867, month: 10, period: "1867年10月", shortTitle: "大政奉還" },
    "event_aburakoji": { year: 1867, month: 11, period: "1867年11月", shortTitle: "油小路の変" },
    "event_omiya_assassination": { year: 1867, month: 11, period: "1867年11月", shortTitle: "近江屋事件" },
    "event_restoration_council": { year: 1867, month: 12, period: "1867年12月", shortTitle: "王政復古" },
    "event_satsuma_residence": { year: 1867, month: 12, period: "1867年12月", shortTitle: "薩摩邸焼討" },
    "event_toba_fushimi": { year: 1868, month: 1, period: "1868年1月", shortTitle: "鳥羽伏見の戦" },
    "event_boshin_war": { year: 1868, month: 1, period: "1868年1月", shortTitle: "戊辰戦争開戦" },
    "event_kobe_incident": { year: 1868, month: 1, period: "1868年1月", shortTitle: "神戸事件" },
    "event_sekihotai_march": { year: 1868, month: 2, period: "1868年2月", shortTitle: "赤報隊進軍" },
    "event_koshu_katsunuma": { year: 1868, month: 3, period: "1868年3月", shortTitle: "甲州勝沼の戦" },
    "event_charter_oath": { year: 1868, month: 3, period: "1868年3月", shortTitle: "五箇条御誓文" },
    "event_edo_opening": { year: 1868, month: 3, period: "1868年3月", shortTitle: "江戸開城前夜" },
    "event_katsu_saigo": { year: 1868, month: 3, period: "1868年3月", shortTitle: "江戸城無血開城" },
    "event_seiheitai": { year: 1868, month: 3, period: "1868年3月", shortTitle: "靖兵隊結成" },
    "event_iba_hachiro": { year: 1868, month: 4, period: "1868年4月", shortTitle: "箱根山崎激闘" },
    "event_kuwana_kashiwazaki": { year: 1868, month: 4, period: "1868年4月", shortTitle: "桑名藩の決断" },
    "event_ueno_war": { year: 1868, month: 5, period: "1868年5月", shortTitle: "上野戦争" },
    "event_kozanshi_rising": { year: 1865, month: 1, period: "1865年1月", shortTitle: "功山寺挙兵" },
    "event_choshu_five_return": { year: 1865, month: 3, period: "1865年3月", shortTitle: "長州五傑帰国" },
    "event_senchu_hassaku": { year: 1867, month: 6, period: "1867年6月", shortTitle: "船中八策" },
    "event_eejanaika": { year: 1867, month: 8, period: "1867年8月", shortTitle: "ええじゃないか" },
    "event_nagareyama_farewell": { year: 1868, month: 4, period: "1868年4月", shortTitle: "流山の訣別" },

    // === 終幕（決戦〜明治期：1868年夏以降）全51件 ===
    "event_jousai_rebellion": { year: 1868, month: 4, period: "1868年4月", shortTitle: "請西藩の義挙" },
    "event_ouetsu_alliance": { year: 1868, month: 5, period: "1868年5月", shortTitle: "奥羽越同盟" },
    "event_nagaoka_defense": { year: 1868, month: 5, period: "1868年5月", shortTitle: "長岡城攻防" },
    "event_tokyo_capital": { year: 1868, month: 7, period: "1868年7月", shortTitle: "東京遷都" },
    "event_byakkotai_sortie": { year: 1868, month: 8, period: "1868年8月", shortTitle: "白虎隊出陣" },
    "event_aizu_defense_council": { year: 1868, month: 8, period: "1868年8月", shortTitle: "会津籠城評議" },
    "event_aizu_war": { year: 1868, month: 8, period: "1868年8月", shortTitle: "会津戦争" },
    "event_aizu_higan_jishi": { year: 1868, month: 9, period: "1868年9月", shortTitle: "彼岸獅子入場" },
    "event_aizu_surrender": { year: 1868, month: 9, period: "1868年9月", shortTitle: "会津藩降伏" },
    "event_kaiyo_maru": { year: 1868, month: 11, period: "1868年11月", shortTitle: "開陽丸沈没" },
    "event_hakodate_government": { year: 1868, month: 12, period: "1868年12月", shortTitle: "箱館政権" },
    "event_miyako_bay": { year: 1869, month: 3, period: "1869年3月", shortTitle: "宮古湾海戦" },
    "event_hakodate_hospital": { year: 1869, month: 4, period: "1869年4月", shortTitle: "箱館病院赤十字" },
    "event_ippongi_kanmon": { year: 1869, month: 5, period: "1869年5月", shortTitle: "一本木関門" },
    "event_goryokaku": { year: 1869, month: 5, period: "1869年5月", shortTitle: "五稜郭の決断" },
    "event_hakodate_assault": { year: 1869, month: 5, period: "1869年5月", shortTitle: "箱館総攻撃" },
    "event_hanseki_hokan": { year: 1869, month: 6, period: "1869年6月", shortTitle: "版籍奉還" },
    "event_dajo_system": { year: 1869, month: 7, period: "1869年7月", shortTitle: "太政官制度" },
    "event_hokkaido_development": { year: 1869, month: 7, period: "1869年7月", shortTitle: "北海道開拓" },
    "event_hokkaido_agency": { year: 1869, month: 8, period: "1869年8月", shortTitle: "開拓使設置" },
    "event_yokohama_settlement": { year: 1870, month: 1, period: "1870年", shortTitle: "横浜居留地" },
    "event_postal_system": { year: 1871, month: 3, period: "1871年3月", shortTitle: "郵便制度確立" },
    "event_han_reform": { year: 1871, month: 7, period: "1871年7月", shortTitle: "廃藩置県" },
    "event_treaty_qing": { year: 1871, month: 9, period: "1871年9月", shortTitle: "日清修好条規" },
    "event_europe_mission": { year: 1871, month: 11, period: "1871年11月", shortTitle: "岩倉使節団" },
    "event_army_ministry": { year: 1872, month: 2, period: "1872年2月", shortTitle: "陸軍省設置" },
    "event_first_newspaper": { year: 1872, month: 2, period: "1872年2月", shortTitle: "日刊新聞創刊" },
    "event_gakusei_system": { year: 1872, month: 8, period: "1872年8月", shortTitle: "学制公布" },
    "event_railway_opening": { year: 1872, month: 9, period: "1872年9月", shortTitle: "鉄道開通" },
    "event_tomioka_silk": { year: 1872, month: 10, period: "1872年10月", shortTitle: "富岡製糸場" },
    "event_conscription": { year: 1873, month: 1, period: "1873年1月", shortTitle: "徴兵令公布" },
    "event_civilization_enlightenment": { year: 1873, month: 3, period: "1873年", shortTitle: "文明開化" },
    "event_land_tax": { year: 1873, month: 7, period: "1873年7月", shortTitle: "地租改正" },
    "event_seikanron_debate": { year: 1873, month: 10, period: "1873年10月", shortTitle: "征韓論論争" },
    "event_meiji_political_crisis": { year: 1873, month: 10, period: "1873年10月", shortTitle: "明治六年政変" },
    "event_freedom_rights": { year: 1874, month: 1, period: "1874年1月", shortTitle: "自由民権運動" },
    "event_tonden_soldiers": { year: 1874, month: 10, period: "1874年10月", shortTitle: "屯田兵制度" },
    "event_hokkaido_village": { year: 1875, month: 5, period: "1875年", shortTitle: "開拓農村建設" },
    "event_sword_ban": { year: 1876, month: 3, period: "1876年3月", shortTitle: "廃刀令公布" },
    "event_stipend_reform": { year: 1876, month: 8, period: "1876年8月", shortTitle: "秩禄処分" },
    "event_samurai_livelihood": { year: 1876, month: 12, period: "1876年", shortTitle: "士族授産" },
    "event_satsuma_rebellion": { year: 1877, month: 2, period: "1877年2月", shortTitle: "西南戦争" },
    "event_okubo_assassination": { year: 1878, month: 5, period: "1878年5月", shortTitle: "紀尾井坂変" },
    "event_ryukyu_annexation": { year: 1879, month: 3, period: "1879年3月", shortTitle: "琉球処分" },
    "event_rokumeikan": { year: 1883, month: 11, period: "1883年11月", shortTitle: "鹿鳴館外交" },
    "event_treaty_revision": { year: 1886, month: 5, period: "1886年", shortTitle: "条約改正交渉" },
    "event_nihonmatsu_boys": { year: 1868, month: 7, period: "1868年7月", shortTitle: "二本松少年隊" },
    "event_nakano_takeko": { year: 1868, month: 8, period: "1868年8月", shortTitle: "娘子隊奮迅" },
    "event_hakodate_bay_naval": { year: 1869, month: 5, period: "1869年5月", shortTitle: "箱館湾海戦" },
    "event_shinpuren_revolt": { year: 1876, month: 10, period: "1876年10月", shortTitle: "神風連の乱" },
    "event_meiji_constitution": { year: 1889, month: 2, period: "1889年2月", shortTitle: "帝国憲法発布" }
};

// 全イベントに史実メタデータとソートキー（sortKey = year * 100 + month）を自動付与
if (Array.isArray(GAME_DATA.events)) {
    GAME_DATA.events.forEach(ev => {
        const meta = GAME_DATA.eventMeta[ev.id];
        if (meta) {
            Object.assign(ev, meta);
            ev.sortKey = meta.year * 100 + (meta.month || 0);
        } else {
            ev.year = 1860;
            ev.month = 1;
            ev.period = "1860年頃";
            ev.shortTitle = ev.title;
            ev.sortKey = 186001;
        }
    });
}

// ==========================================
// 全99名 志士カード人物伝（史実伝記）定義
// ==========================================

// ==========================================
// 全46件 志士カード史実死亡・死線定義
// ==========================================
GAME_DATA.shishiDeaths = {
    "shimazu_nariakira": {
        "cardId": "shimazu_nariakira",
        "character": "nariakira",
        "name": "島津斉彬",
        "faction": "tobaku",
        "year": 1858,
        "month": 8,
        "deathYear": 1858,
        "deathMonth": 8,
        "deathSortKey": 185808,
        "eventId": "event_nariakira_death",
        "eventTitle": "島津斉彬の急死、薩摩の暗雲",
        "reason": "安政5年7月、率兵上洛に向けた天保山での練兵中に急病（コレラ等）を発し、わずか数日で急死。",
        "lastWords": "「勇断なき者は大事を成せず」薩摩の英主、回天の夢半ばにして鹿児島に散る。"
    },
    "yoshida_teaching": {
        "cardId": "yoshida_teaching",
        "character": "yoshida",
        "name": "吉田松陰",
        "faction": "tobaku",
        "deathYear": 1859,
        "deathMonth": 10,
        "deathSortKey": 185910,
        "eventId": "event_andei_purge",
        "eventTitle": "安政の大獄の嵐",
        "reason": "安政6年10月、幕府への直言により伝馬町牢屋敷にて斬首処刑。",
        "lastWords": "「身はたとひ 武蔵の野辺に 朽ちぬとも 留め置かまし 大和魂」"
    },
    "ii_naosuke": {
        "cardId": "ii_naosuke",
        "character": "ii_naosuke",
        "name": "井伊直弼",
        "faction": "sabaku",
        "deathYear": 1860,
        "deathMonth": 3,
        "deathSortKey": 186003,
        "eventId": "event_sakuradamon",
        "eventTitle": "桜田門外の変・雪中の襲撃",
        "reason": "安政7年3月3日、雪の桜田門外にて水戸浪士らの奇襲を受け駕籠の中で落命。",
        "lastWords": "「茶道一会、天下の政治もまた一期一会」大老の豪腕、雪に赤く染まる。"
    },
    "arima_revolt": {
        "cardId": "arima_revolt",
        "character": "arima",
        "name": "有馬新七",
        "faction": "tobaku",
        "deathYear": 1862,
        "deathMonth": 4,
        "deathSortKey": 186204,
        "eventId": "event_satsuma_after_teradaya",
        "eventTitle": "寺田屋騒動、薩摩の粛清",
        "reason": "文久2年4月、伏見寺田屋にて同藩の鎮撫使と斬り合い激闘の末に絶命。",
        "lastWords": "「おいごと刺せ！おいごと刺せ！」"
    },
    "kiyokawa_leader": {
        "cardId": "kiyokawa_leader",
        "character": "kiyokawa",
        "name": "清河八郎",
        "faction": "sabaku",
        "deathYear": 1863,
        "deathMonth": 4,
        "deathSortKey": 186304,
        "eventId": "event_shinchogumi",
        "eventTitle": "新徴組、江戸の治安維持",
        "reason": "文久3年4月、麻布一の橋にて幕府刺客・佐々木只三郎らに討たれ落命。",
        "lastWords": "「魁の志、道半ばにして倒るるか……」浪士組創設者の終焉。"
    },
    "tanaka_assassin": {
        "cardId": "tanaka_assassin",
        "character": "tanaka_shinbei",
        "name": "田中新兵衛",
        "faction": "tobaku",
        "deathYear": 1863,
        "deathMonth": 5,
        "deathSortKey": 186305,
        "eventId": "event_izo_assassination",
        "eventTitle": "京都暗殺風雲、人斬り以蔵の太刀",
        "reason": "文久3年5月、姉小路暗殺の嫌疑を受け町奉行所にて尋問中に自刃。",
        "lastWords": "己が太刀を奪い返し、無言のまま喉を突いて果てた。"
    },
    "sasaki_escort": {
        "cardId": "sasaki_escort",
        "character": "sasaki_aijiro",
        "name": "佐々木愛次郎",
        "faction": "sabaku",
        "deathYear": 1863,
        "deathMonth": 8,
        "deathSortKey": 186308,
        "eventId": "event_serizawa_assassination",
        "eventTitle": "八木邸の粛清、芹沢鴨の暗殺",
        "reason": "文久3年8月、新選組内部抗争の渦中で暗殺され落命。",
        "lastWords": "美男五人衆と呼ばれた若き隊士、隊規の闇に消える。"
    },
    "yoshimura_revolt": {
        "cardId": "yoshimura_revolt",
        "character": "yoshimura",
        "name": "吉村寅太郎",
        "faction": "tobaku",
        "deathYear": 1863,
        "deathMonth": 9,
        "deathSortKey": 186309,
        "eventId": "event_tenchu_revolt",
        "eventTitle": "天誅組の変、山中の旗",
        "reason": "文久3年9月、天誅組の総裁として幕府追討軍と交戦し鷲家口にて戦死。",
        "lastWords": "「吉野山 風に乱るる もみじ葉は 我が立つ杣の 血潮なりけり」"
    },
    "yoshida_minomaru": {
        "cardId": "yoshida_minomaru",
        "character": "yoshida_minomaru",
        "name": "吉田稔麿",
        "faction": "tobaku",
        "deathYear": 1864,
        "deathMonth": 6,
        "deathSortKey": 186406,
        "eventId": "event_ikedaya",
        "eventTitle": "池田屋事件の急襲",
        "reason": "元治元年6月、池田屋にて新選組の強襲を受け長州藩邸前で自刃。",
        "lastWords": "松門四天王の英才、長州の未来を案じながら24歳で散る。"
    },
    "mochizuki_sacrifice": {
        "cardId": "mochizuki_sacrifice",
        "character": "mochizuki",
        "name": "望月亀弥太",
        "faction": "tobaku",
        "deathYear": 1864,
        "deathMonth": 6,
        "deathSortKey": 186406,
        "eventId": "event_ikedaya",
        "eventTitle": "池田屋事件の急襲",
        "reason": "元治元年6月、池田屋から脱出を図るも新選組の追撃を受け自刃。",
        "lastWords": "土佐勤王党の駿足、深手を負い二条川原にて絶命。"
    },
    "kusaka_revolt": {
        "cardId": "kusaka_revolt",
        "character": "kusaka",
        "name": "久坂玄瑞",
        "faction": "tobaku",
        "deathYear": 1864,
        "deathMonth": 7,
        "deathSortKey": 186407,
        "eventId": "event_hamaguri_gate",
        "eventTitle": "禁門の変、御所前の激戦",
        "reason": "元治元年7月、御所突入に失敗し鷹司邸内で寺島忠三郎と共に自刃。",
        "lastWords": "「時ありて 散るをめでたき 桜花 人も見捨てぬ 嵐ならずや」"
    },
    "kirishima_charge": {
        "cardId": "kirishima_charge",
        "character": "kirishima",
        "name": "来島又兵衛",
        "faction": "tobaku",
        "deathYear": 1864,
        "deathMonth": 7,
        "deathSortKey": 186407,
        "eventId": "event_hamaguri_gate",
        "eventTitle": "禁門の変、御所前の激戦",
        "reason": "元治元年7月、蛤御門にて陣頭指揮を執り会津軍へ突撃中に胸を撃たれ自刃。",
        "lastWords": "「これにて死すとも悔いなし！」"
    },
    "maki_revolt": {
        "cardId": "maki_revolt",
        "character": "maki",
        "name": "真木和泉",
        "faction": "tobaku",
        "deathYear": 1864,
        "deathMonth": 7,
        "deathSortKey": 186407,
        "eventId": "event_hamaguri_gate",
        "eventTitle": "禁門の変、御所前の激戦",
        "reason": "元治元年7月、天王山にて退路を断たれ同志十七名と共に自刃。",
        "lastWords": "「大君の 臣たるものを 辞する身は 草の露とも 露の身とも」"
    },
    "irie_secret": {
        "cardId": "irie_secret",
        "character": "irie",
        "name": "入江九一",
        "faction": "tobaku",
        "deathYear": 1864,
        "deathMonth": 7,
        "deathSortKey": 186407,
        "eventId": "event_hamaguri_gate",
        "eventTitle": "禁門の変、御所前の激戦",
        "reason": "元治元年7月、久坂玄瑞の自刃を見届け御所を脱出する際、敵槍を受け戦死。",
        "lastWords": "松門四天王の忠義、久坂の遺志を胸に落命。"
    },
    "sakuma_gunnery": {
        "cardId": "sakuma_gunnery",
        "character": "sakuma",
        "name": "佐久間象山",
        "faction": "tobaku",
        "deathYear": 1864,
        "deathMonth": 7,
        "deathSortKey": 186407,
        "eventId": "event_sakuma_assassination",
        "eventTitle": "佐久間象山暗殺、開国の知略散る",
        "reason": "元治元年7月、京都三条木屋町にて尊攘派刺客・河上彦斎らに白昼暗殺される。",
        "lastWords": "「東洋道徳、西洋芸術」天下の兵学者、凶刃に斃れる。"
    },
    "sufu_reform": {
        "cardId": "sufu_reform",
        "character": "sufu",
        "name": "周布政之助",
        "faction": "tobaku",
        "deathYear": 1864,
        "deathMonth": 9,
        "deathSortKey": 186409,
        "eventId": "event_choshu_expedition",
        "eventTitle": "第一次長州征討、進軍の命",
        "reason": "元治元年9月、禁門の変の責めと藩内保守派の専横を苦に山口庄原にて自刃。",
        "lastWords": "長州革新の支柱、若き志士たちに未来を託して逝く。"
    },
    "takeda_kounsai": {
        "cardId": "takeda_kounsai",
        "character": "takeda_kounsai",
        "name": "武田耕雲斎",
        "faction": "tobaku",
        "deathYear": 1865,
        "deathMonth": 2,
        "deathSortKey": 186502,
        "eventId": "event_tenguto_rising",
        "eventTitle": "水戸天狗党の挙兵、筑波山の義旗",
        "reason": "元治2年2月、京への雪中進軍の末に敦賀にて降伏、幕府軍により非情の斬首処刑。",
        "lastWords": "「過ぐる日の 夢路を辿る 白雪に 散る紅の 花ぞ惜しまる」"
    },
    "sannan_tactics": {
        "cardId": "sannan_tactics",
        "character": "sannan",
        "name": "山南敬助",
        "faction": "sabaku",
        "deathYear": 1865,
        "deathMonth": 2,
        "deathSortKey": 186502,
        "eventId": "event_sannan_seppuku",
        "eventTitle": "新選組総長・山南敬助の脱走と切腹",
        "reason": "元治2年2月、新選組の方針に絶望し脱走、連れ戻され沖田総司の介錯で切腹。",
        "lastWords": "「総司、頼む……」誠の旗の下、静謐なる総長が逝く。"
    },
    "okada_izo": {
        "cardId": "okada_izo",
        "character": "izo",
        "name": "岡田以蔵",
        "faction": "tobaku",
        "deathYear": 1865,
        "deathMonth": 5,
        "deathSortKey": 186505,
        "eventId": "event_izo_execution",
        "eventTitle": "土佐勤王党の獄、人斬り以蔵の最期",
        "reason": "慶応元年5月、過酷な拷問の果てに土佐藩にて打首獄門。",
        "lastWords": "「君が為 尽くす心は 水の泡 消えにし後は 澄み渡る空」"
    },
    "takechi_ideology": {
        "cardId": "takechi_ideology",
        "character": "takechi",
        "name": "武市半平太",
        "faction": "tobaku",
        "deathYear": 1865,
        "deathMonth": 5,
        "deathSortKey": 186505,
        "eventId": "event_izo_execution",
        "eventTitle": "土佐勤王党の獄、人斬り以蔵の最期",
        "reason": "慶応元年5月、藩主・山内容堂の命により三文字割腹の切腹を遂げる。",
        "lastWords": "「ふたたびと 返らぬ歳を 儚くも 命に代えて 咲くや白菊」"
    },
    "akane_negotiation": {
        "cardId": "akane_negotiation",
        "character": "akane",
        "name": "赤禰武人",
        "faction": "tobaku",
        "deathYear": 1866,
        "deathMonth": 2,
        "deathSortKey": 186602,
        "eventId": "event_kozanshi_rising",
        "eventTitle": "功山寺挙兵、回天の烽火",
        "reason": "慶応2年2月、長州内訌の調停を図るも裏切りと誤解され処刑。",
        "lastWords": "「忠誠の心は天日に通ず」平和を望んだ奇兵隊総管の悲運。"
    },
    "takasugi_kiheitai": {
        "cardId": "takasugi_kiheitai",
        "character": "takasugi",
        "name": "高杉晋作",
        "faction": "tobaku",
        "deathYear": 1867,
        "deathMonth": 4,
        "deathSortKey": 186704,
        "eventId": "event_takasugi_illness",
        "eventTitle": "高杉晋作の病臥、風雲児の別れ",
        "reason": "慶応3年4月、四境戦争の激闘後に肺結核が悪化し下関にて27歳で病没。",
        "lastWords": "「おもしろき こともなき世を おもしろく すみなすものは 心なりけり」"
    },
    "takeda_strategy": {
        "cardId": "takeda_strategy",
        "character": "takeda",
        "name": "武田観柳斎",
        "faction": "sabaku",
        "deathYear": 1867,
        "deathMonth": 6,
        "deathSortKey": 186706,
        "eventId": "event_takeda_assassination",
        "eventTitle": "銭取橋の粛清、武田観柳斎の暗殺",
        "reason": "慶応3年6月、薩摩への内通を疑われ鴨川銭取橋にて斎藤一らにより討殺。",
        "lastWords": "甲州軍学の知謀、新選組の刃に消ゆ。"
    },
    "ryoma_kaiwentai": {
        "cardId": "ryoma_kaiwentai",
        "character": "ryoma",
        "name": "坂本龍馬",
        "faction": "tobaku",
        "deathYear": 1867,
        "deathMonth": 11,
        "deathSortKey": 186711,
        "eventId": "event_omiya_assassination",
        "eventTitle": "近江屋事件、盟友の喪失",
        "reason": "慶応3年11月15日、京都近江屋にて刺客に襲われ脳天を斬られ絶命。",
        "lastWords": "「脳をやられた、もういかん……」日本の夜明けを見ることなく斃れる。"
    },
    "nakaoka_mediator": {
        "cardId": "nakaoka_mediator",
        "character": "nakaoka",
        "name": "中岡慎太郎",
        "faction": "tobaku",
        "deathYear": 1867,
        "deathMonth": 11,
        "deathSortKey": 186711,
        "eventId": "event_omiya_assassination",
        "eventTitle": "近江屋事件、盟友の喪失",
        "reason": "慶応3年11月15日、近江屋にて龍馬と共に襲撃を受け全身に深手を負い二日後に絶命。",
        "lastWords": "「龍馬は即死であった……」陸援隊長、友の後を追う。"
    },
    "ito_kasshitaro": {
        "cardId": "ito_kasshitaro",
        "character": "ito_kasshitaro",
        "name": "伊東甲子太郎",
        "faction": "sabaku",
        "deathYear": 1867,
        "deathMonth": 11,
        "deathSortKey": 186711,
        "eventId": "event_aburakoji",
        "eventTitle": "油小路の変、訣別の刃",
        "reason": "慶応3年11月、近藤勇の招宴帰途、油小路木津屋橋にて新選組に暗殺。",
        "lastWords": "「奸賊ばら！」御陵衛士の魁、夜陰の辻に斃れる。"
    },
    "todo_heisuke": {
        "cardId": "todo_heisuke",
        "character": "todo",
        "name": "藤堂平助",
        "faction": "sabaku",
        "deathYear": 1867,
        "deathMonth": 11,
        "deathSortKey": 186711,
        "eventId": "event_aburakoji",
        "eventTitle": "油小路の変、訣別の刃",
        "reason": "慶応3年11月、伊東の遺体収容に駆けつけた油小路にて新選組と交戦し戦死。",
        "lastWords": "魁先生と呼ばれた試衛館以来の同志、油小路の石畳に散る。"
    },
    "sasaki_patrol": {
        "cardId": "sasaki_patrol",
        "character": "sasaki",
        "name": "佐々木只三郎",
        "faction": "sabaku",
        "deathYear": 1868,
        "deathMonth": 1,
        "deathSortKey": 186801,
        "eventId": "event_toba_fushimi",
        "eventTitle": "鳥羽・伏見の決戦、錦旗の翻転",
        "reason": "慶応4年1月、樟葉の戦いにて官軍の猛銃撃を腰に受け致命傷、戦死。",
        "lastWords": "京都見廻組組頭、小太刀の達人、徳川の落日に殉ず。"
    },
    "sagara_souzou": {
        "cardId": "sagara_souzou",
        "character": "sagara",
        "name": "相楽総三",
        "faction": "tobaku",
        "deathYear": 1868,
        "deathMonth": 3,
        "deathSortKey": 186803,
        "eventId": "event_sekihotai_march",
        "eventTitle": "赤報隊の進軍、年貢半減の布告",
        "reason": "慶応4年3月、偽官軍の罪を着せられ信濃下諏訪宿にて無念の処刑。",
        "lastWords": "赤報隊の先駆、官軍の政治的都合に翻弄され散る。"
    },
    "kondo_kotetsu": {
        "cardId": "kondo_kotetsu",
        "character": "kondo",
        "name": "近藤勇",
        "faction": "sabaku",
        "deathYear": 1868,
        "deathMonth": 4,
        "deathSortKey": 186804,
        "eventId": "event_nagareyama_farewell",
        "eventTitle": "流山の訣別、近藤勇の出頭",
        "reason": "慶応4年4月、流山で捕縛され板橋宿の刑場にて斬首刑に処される。",
        "lastWords": "「孤軍たすけ落ちて 俘虜となる 顧みて君恩を思えば 涙さらに流る」"
    },
    "oguri_reform": {
        "cardId": "oguri_reform",
        "character": "oguri",
        "name": "小栗忠順",
        "faction": "sabaku",
        "deathYear": 1868,
        "deathMonth": 4,
        "deathSortKey": 186804,
        "eventId": "event_oguri_execution",
        "eventTitle": "小栗上野介、権田村の悲劇",
        "reason": "慶応4年4月、上野国権田村にて新政府軍により無実の罪で斬首処刑。",
        "lastWords": "横須賀造船所を創った幕府最高の知性、無言のまま露と消ゆ。"
    },
    "okita_sandan": {
        "cardId": "okita_sandan",
        "character": "okita",
        "name": "沖田総司",
        "faction": "sabaku",
        "deathYear": 1868,
        "deathMonth": 5,
        "deathSortKey": 186805,
        "eventId": "event_okita_farewell",
        "eventTitle": "沖田総司、千駄ヶ谷の病臥",
        "reason": "慶応4年5月、近藤勇の死を知らされぬまま千駄ヶ谷植木屋にて結核病没。",
        "lastWords": "「動かねば 闇にへだつや 花と水」天才剣士、25歳で静かに眠る。"
    },
    "harada_spear": {
        "cardId": "harada_spear",
        "character": "harada",
        "name": "原田左之助",
        "faction": "sabaku",
        "deathYear": 1868,
        "deathMonth": 5,
        "deathSortKey": 186805,
        "eventId": "event_ueno_war",
        "eventTitle": "上野戦争、彰義隊の死守",
        "reason": "慶応4年5月、彰義隊に加わり上野寛永寺にて奮戦、受けた銃傷により絶命。",
        "lastWords": "十番組組長、槍を振るい江戸の炎の中に散る。"
    },
    "kawai_artillery": {
        "cardId": "kawai_artillery",
        "character": "kawai",
        "name": "河井継之助",
        "faction": "sabaku",
        "deathYear": 1868,
        "deathMonth": 8,
        "deathSortKey": 186808,
        "eventId": "event_nagaoka_defense",
        "eventTitle": "長岡城攻防、ガトリングの轟音",
        "reason": "慶応4年8月、長岡城奪還戦で左足に被弾、会津への退却途上で戦傷死。",
        "lastWords": "「八十里 腰抜け武士の 越す峠」長岡の家老、独立の夢散る。"
    },
    "yokoi_philosophy": {
        "cardId": "yokoi_philosophy",
        "character": "yokoi",
        "name": "横井小楠",
        "faction": "tobaku",
        "deathYear": 1869,
        "deathMonth": 1,
        "deathSortKey": 186901,
        "eventId": "event_yokoi_reform",
        "eventTitle": "横井小楠、国是の建白",
        "reason": "明治2年1月、開明的思想を逆恨みされ京都寺町にて十津川郷士らに暗殺。",
        "lastWords": "「堯舜孔子の道、西洋の器械」公議政体の先駆者、凶刃に散る。"
    },
    "koga_naval": {
        "cardId": "koga_naval",
        "character": "koga",
        "name": "甲賀源吾",
        "faction": "sabaku",
        "deathYear": 1869,
        "deathMonth": 3,
        "deathSortKey": 186903,
        "eventId": "event_miyako_bay",
        "eventTitle": "宮古湾海戦、アポルダージュの奇襲",
        "reason": "明治2年3月、回天艦長として敵甲鉄艦への奇襲中、集中砲火を浴び戦死。",
        "lastWords": "「舵を離すな！」艦橋で指揮を執り続けた海の勇士。"
    },
    "kayano_sacrifice": {
        "cardId": "kayano_sacrifice",
        "character": "kayano",
        "name": "萱野権兵衛",
        "faction": "sabaku",
        "deathYear": 1869,
        "deathMonth": 5,
        "deathSortKey": 186905,
        "eventId": "event_aizu_surrender",
        "eventTitle": "会津藩降伏、城下の朝",
        "reason": "明治2年5月、主家松平容保の助命のため戦争責任を一手に背負い切腹。",
        "lastWords": "「主家殉難、義の家老」会津武士道の魂を遺して果つ。"
    },
    "hijikata_fukucho": {
        "cardId": "hijikata_fukucho",
        "character": "hijikata",
        "name": "土方歳三",
        "faction": "sabaku",
        "deathYear": 1869,
        "deathMonth": 5,
        "deathSortKey": 186905,
        "eventId": "event_ippongi_kanmon",
        "eventTitle": "一本木関門の激闘、土方歳三の突進",
        "reason": "明治2年5月11日、箱館一本木関門にて馬上で進撃中、腹部に銃弾を受け戦死。",
        "lastWords": "「よしや身は 蝦夷の島根に 朽ちぬとも 魂は東の 君をまもらむ」"
    },
    "iba_duel": {
        "cardId": "iba_duel",
        "character": "iba",
        "name": "伊庭八郎",
        "faction": "sabaku",
        "deathYear": 1869,
        "deathMonth": 5,
        "deathSortKey": 186905,
        "eventId": "event_hakodate_assault",
        "eventTitle": "箱館総攻撃、最後の朝",
        "reason": "明治2年5月、木古内で胸に重傷を負い五稜郭内にて榎本武揚に看取られ服毒自刃。",
        "lastWords": "「待てしばし 冥土の道も 連れ添ひて」隻腕の美剣士、北辺に散る。"
    }
};

GAME_DATA.shishiBios = {
    "ryoma_kaiwentai": "土佐藩出身。脱藩後に勝海舟に師事し神戸海軍操練所で航海術を修める。長崎に亀山社中（のちの海援隊）を結成し、長州への武器斡旋などを通じて敵対していた薩摩・長州を結ぶ「薩長同盟」を仲介。さらに後藤象二郎を介して「船中八策」を提示し大政奉還の実現に決定打を与えた。近江屋にて暗殺される。",
    "katsura_shindo": "長州藩の指導者（のちの木戸孝允）。吉田松陰の教えを受け、江戸三大道場・練兵館で神道無念流の免許皆伝を得て塾頭を務めた剣豪。池田屋事件や禁門の変など幾多の危機を巧みな変装と機転で潜り抜け「逃げの小五郎」の異名をとる。薩長同盟の当事者として討幕の主導権を握り、維新の三傑に数えられる。",
    "saigo_jigen": "薩摩藩士（西郷南洲）。藩主・島津斉彬の側近として活躍するも二度の島流しを経験。復帰後は薩摩軍の司令官として禁門の変や長州征伐を指揮。坂本龍馬の仲介で長州と薩長同盟を密約し、戊辰戦争では東征大総督参謀として江戸無血開城を勝海舟と談判して成し遂げた。情に厚く「敬天愛人」の精神で人々から敬愛された維新の三傑。",
    "takasugi_kiheitai": "長州藩士。吉田松陰の松下村塾で「双璧」と称された英才。身分にとらわれず町人や農民で組織した革新的軍隊「奇兵隊」を創設。功山寺でわずか80余名から決起して藩政を掌握し、四境戦争（第二次長州征伐）では小倉方面軍を率いて幕府軍を撃破した。維新の成就を見届けることなく結核により27歳で早世した風雲児。",
    "ito_diplomat": "長州藩士（のちの初代内閣総理大臣）。松下村塾に学び、英国へ密航留学（長州ファイブ）して西欧の国力と近代文明を痛感。下関戦争の危機に際して井上馨とともに急遽帰国し講和交渉に尽力。卓越した英語力と国際感覚で維新政府の外交・制度設計を牽引し、明治憲法の制定や立憲政体の樹立に絶大な足跡を残した。",
    "omura_reform": "長州藩の軍学者・蘭学者。緒方洪庵の適塾で塾頭を務め、西洋兵学に精通。第二次長州征伐では石州口の戦いを近代戦術で電撃指揮し幕府軍を圧倒。戊辰戦争の上野戦争では彰義隊をわずか一日で壊滅させた。「近代日本陸軍の父」と称され、身分を問わない国民皆兵制を推進したが、刺客の襲撃を受け凶弾に倒れた。",
    "inoue_negotiation": "長州藩士。高杉晋作らと英国公使館焼き討ちに参加するも、英留学（長州ファイブ）を経て開国論へと転換。下関戦争の和平交渉や幕府との折衝で奔走。長州の内紛では襲撃を受けて全身に重傷を負うが奇跡的に生還した。維新後は外務卿として不平等条約改正や鹿鳴館外交、財政改革に奔走した。",
    "maebara_charge": "長州藩士。松下村塾で学び、戊辰戦争では北越戦争参謀として長岡藩や会津藩相手に奮戦。軍事的な手腕を高く評価され維新後は兵部大輔となるが、大村益次郎の国民皆兵策に反対して下野。武士階級の急激な没落や新政府への不満から萩の乱を起こして決起するも敗れ、刑死した。",
    "yamagata_march": "長州藩士。松下村塾の門下となり、高杉晋作の奇兵隊で軍監を務めて頭角を現す。戊辰戦争では北越や会津へ転戦して軍功を挙げた。維新後は大村益次郎の遺志を継いで徴兵制を確立し日本陸軍の基礎を築いた。のちに首相、元老として政官軍に君臨し近代日本の権力構造に強大な影響を及ぼした。",
    "hirosawa_alliance": "長州藩士。周布政之助らの抜擢を受け、藩政改革や国事周旋に尽力。坂本龍馬らと交流し薩長同盟の実現を陰から支えた。戊辰戦争では諸藩との連絡調整に辣腕を振るい、新政府成立後は参議として五箇条の御誓文の策定に関与するなど重鎮となったが、東京の私邸で謎の暗殺を遂げた。",
    "goto_political_drive": "土佐藩重役。藩政の実権を握り、当初は尊王攘夷派の武市半平太らを弾圧したが、坂本龍馬と長崎で会談して開国協調へ転向。龍馬の「船中八策」を容れて藩主・山内容堂を説得し、徳川慶喜に対する「大政奉還の建白」を主導して無血革命の道を開いた。維新後も板垣退助らと自由民権運動を推進した。",
    "sufu_reform": "長州藩の革新派重臣。吉田松陰や高杉晋作、桂小五郎ら有為の若手志士たちを深く理解し、藩の要職に抜擢して尊王攘夷論へ導いた。藩論の対立や八月十八日の政変など激動の政局を支え続けたが、藩内保守派の台頭と禁門の変の責めを苦に自刃。長州の幕末維新運動の土台を築いた大立者。",
    "nakaoka_mediator": "土佐藩出身の志士。武市半平太の土佐勤王党に参加後に脱藩。長州・薩摩の志士たちと深く結びつき、坂本龍馬とともに薩長同盟の締結に奔走して決定的な役割を果たした。戦闘部隊「陸援隊」を結成し武力倒幕を目指したが、京都近江屋で坂本龍馬とともに襲撃され、激闘の末に落命した。",
    "iwakura_imperial": "公家（朝廷の政治家）。王政復帰を企図して朝廷工作に暗躍し、一度は失脚して洛北岩倉に隠棲するも薩長の志士たちと密かに連携。王政復帰の大号令を演出して明治新政府を樹立した。のちに全権大使として欧米を視察する「岩倉使節団」を率い、近代日本の基本国家方針を決定づけた。",
    "fukuoka_drafting": "土佐藩士。後藤象二郎とともに大政奉還建白書の起草に携わり、公議政体論の具現化に尽力。明治新政府の基本綱領である「五箇条の御誓文」の起草者の一人として知られ、由利公正の原案を修正して新時代の国是を定めた。維新後も司法卿や参議を歴任し法制の近代化に貢献した。",
    "soejima_diplomacy": "肥前佐賀藩士。国学や蘭学、英学を修め、大隈重信らとともに藩の改革を主導。維新後は外務卿として日清修好条規の批准や台湾出兵問題の交渉、マリア・ルス号事件の奴隷解放判決などを剛腕で解決し国際的評価を獲得。のちに征韓論で下野し自由民権運動にも関与した。",
    "yokoi_philosophy": "肥後熊本藩出身の思想家・政治顧問。越前福井藩主・松平春嶽の政治総裁職補佐として招聘され、幕政改革や「公議政体論」を提唱。開国交易と近代議会制度の導入を説き、坂本龍馬や勝海舟ら多くの幕末指導者に絶大な思想的影響を与えた。開明的な思想を仇敵視され京都で暗殺された。",
    "eto_reform": "肥前佐賀藩士。脱藩して京へ上り尊王討幕の策を唱える。戊辰戦争では彰義隊討伐で功を挙げた。維新後は初代司法卿として裁判所制度の確立や近代法典の整備を猛スピードで断行、「日本近代司法の父」と呼ばれる。征韓論で下野後、佐賀の乱の首謀者として捕縛され悲運の刑死を遂げた。",
    "kuroda_frontier": "薩摩藩士（黒田清隆）。高杉晋作らと親交を結び、鳥羽・伏見の戦いや戊辰戦争で活躍。箱館戦争では新政府軍参謀として榎本武揚らを降伏させ、榎本の助命に奔走した義侠肌の将。維新後は開拓使長官として北海道の大規模な近代化・産業振興を推進し、のちに第2代内閣総理大臣を務めた。",
    "okuma_modernization": "肥前佐賀藩士。長崎で蘭学・英学を学び、米国の憲法や世界情勢に精通。維新後は大蔵大輔として鉄道敷設、造幣局設立、国立銀行条例など近代日本の経済基盤を一手に構築した。明治十四年の政変で下野後に立憲改進党を結成、早稲田大学の前身となる東京専門学校を創設した大政治家。",
    "yodo_political_balance": "土佐藩第15代藩主（山内豊信）。「鯨海酔侯」と自称した風流人でありながら、幕末の四賢侯の一人として幕政に多大な発言力を持った。坂本龍馬や後藤象二郎の建白を容れて将軍・徳川慶喜に大政奉還を勧告。小御所会議では慶喜を弁護して岩倉具視らと激論を交わし公議政体の平和的移行を模索した。",
    "itagaki_charge": "土佐藩士。武力討幕を唱えて中岡慎太郎や西郷隆盛と密約を結び、戊辰戦争では迅衝隊を率いて甲州勝沼や会津鶴ヶ城攻めで大武功を立てた。維新後は参議となるが征韓論で下野。「板垣死すとも自由は死せず」の名言で知られる自由民権運動の指導者として愛国社や自由党を結成した。",
    "shinagawa_signal": "長州藩士。吉田松陰の松下村塾で学び、高杉晋作らとともに尊王攘夷運動の最前線に立つ。戊辰戦争では奥羽鎮撫総督府参謀として奮戦。官軍の士気を鼓舞した日本最初の軍歌「トコトンヤレ節（宮さん宮さん）」の作詞者としても知られる。維新後は内務大臣などを歴任した。",
    "sanjo_court": "公卿（三条実愛の子）。尊王攘夷派の公卿として朝廷の中心となるが、八月十八日の政変で失脚し長州へ落ち延びる（七卿落ち）。王政復帰後に復権し、明治新政府の最高官職である太政大臣に就任して20年近くにわたり政府の頂点に立って維新の大業を束ね続けた。",
    "arima_revolt": "薩摩藩士。誠忠組を組織し過激な尊王攘夷活動を展開。関白・九条尚忠や京都所司代の襲撃を企て寺田屋に集結するも、藩主の父・島津久光の命を受けた薩摩藩士同士の鎮圧部隊と刃を交えることとなり、壮絶な斬り合いの末に命を落とした（寺田屋事件）。尊攘派志士の魁として語り継がれる。",
    "yoshii_support": "薩摩藩士。西郷隆盛や大久保利通の盟友として誠忠組で活動。寺田屋事件で負傷した坂本龍馬を薩摩藩邸に匿い、妻のお龍とともに日本最初の新婚旅行とされる霧島温泉への旅を手配した人物。戊辰戦争や維新後の宮内次官・日本鉄道社長就任など政財界で活躍した。",
    "maki_revolt": "筑後久留米水天宮の神職・尊王攘夷派思想家。西国雄藩の志士たちに強い思想的影響を与え尊攘運動の精神的支柱となった。八月十八日の政変で長州へ逃れ、禁門の変では長州軍とともに京都へ進撃。山崎・天王山に布陣して戦うも敗北し、十七人の同士とともに壮絶な自爆・自刃を遂げた。",
    "sakuma_gunnery": "信濃松代藩士・兵学者。「東洋道徳・西洋芸術（科学技術）」を唱え、西洋砲術や海防論の第一人者として天下に名を轟かせた。吉田松陰、勝海舟、坂本龍馬など幕末の英傑たちが門下に集まった。松陰の密航企図に連座して幽閉されるも赦免され、上洛して開国論を説いたが尊攘派刺客に暗殺された。",
    "tanaka_intelligence": "土佐藩出身の志士。武市半平太の土佐勤王党に参加後に脱藩し、中岡慎太郎の陸援隊で副長を務める。近江屋事件では重傷を負った中岡慎太郎を看取り刺客の情報を聞き出した。戊辰戦争では陸援隊を率いて各地を転戦。維新後は宮内大臣を長く務め、幕末史の貴重な記録や証言を残した。",
    "iwazaki_finance": "土佐藩地下浪人の子から身を起こし、吉田東洋や後藤象二郎に見出されて藩の開成館長崎出張所で土佐商会を統括。坂本龍馬の海援隊の経理も担当した。維新後に土佐藩の船艇を買い受けて三菱商会（九十九商会）を創業。西南戦争の軍事輸送を一手に引き受けて日本最大の財閥・三菱の礎を築いた。",
    "takechi_ideology": "土佐藩士。白札郷士の身分から土佐勤王党を結成し、二百余名の同志を率いて尊王攘夷運動を展開。藩政の実験を握る参政・吉田東洋を暗殺し京都で尊攘派の頭領として朝廷工作を進めた。しかし藩主・山内容堂の怒りを買い投獄され、過酷な拷問に耐え抜いた末に見事な三文字割腹により切腹した。",
    "mochizuki_sacrifice": "土佐藩出身の志士。武市半平太の土佐勤王党に加盟後に脱藩。長州藩の志士たちと交わり尊攘活動に従事した。元治元年（1864年）京都・三条木屋町の旅館池田屋で新選組の襲撃を受けた際、猛烈に抜刀して奮戦するも重傷を負い、長州藩邸に逃れる途中で力尽きて自刃した（池田屋事件）。",
    "yamada_modern_army": "長州藩士。吉田松陰の松下村塾で最年少の門弟として学び、高杉晋作の奇兵隊で軍功を重ねた。戊辰戦争では卓越した戦術眼を発揮し「小楠公」と称賛された。維新後は欧米軍制を調査し大村益次郎の後を継いで近代軍制を確立。のちに司法大臣として日本大学や國學院大學の創設に尽力した。",
    "sasaki_governance": "土佐藩士。武市半平太の土佐勤王党を厳しく断罪した保守的立場から出発するも、坂本龍馬や後藤象二郎の建白を受けて大政奉還の実現に協力。戊辰戦争では軍監として従軍。明治維新後は司法や宮内省で要職を務め、明治天皇の側近として皇室祭祀や伝統政治の保護に重きをなした。",
    "yoshida_teaching": "長州藩士・思想家・教育者。松下村塾を開き、身分を問わず高杉晋作、久坂玄瑞、桂小五郎、伊藤博文、山県有朋ら明治維新の原動力となる幾多の英傑を育成した。ペリー艦隊への密航を企てて投獄され、安政の大獄で老中暗殺計画を自供して死刑となった。「狂愚まこと貧しからず」の信念に生きた先覚者。",
    "tanaka_assassin": "薩摩藩出身の剣客。「幕末四大人斬り」の一人として知られ、示現流の達手。武市半平太の知遇を得て本間精一郎などの要人暗殺を実行した。姉小路公知暗殺事件（朔平門外の変）において自らの愛刀が現場に遺留されていたことから捕縛され、町奉行所で取り調べを受ける最中に隙を突いて自刃した。",
    "kusaka_revolt": "長州藩士。吉田松陰の松下村塾で高杉晋作と並び「松門の双璧」と称された尊王攘夷運動の若き最高指導者。朝廷や諸藩の志士を糾合し京都で尊攘派の世論を主導した。八月十八日の政変で長州が追放された後、禁門の変（蛤御門の変）で進撃を指揮するも被弾し、鷹司邸にて自刃を遂げた。",
    "irie_secret": "長州藩士。吉田松陰の松下村塾門下で「松門四天王」の一人に数えられる忠義の志士。松陰の野山獄投獄後も救出に奔走し、奇兵隊の結成にも参画。禁門の変では天王山別動隊として奮戦したが、敗走中に久坂玄瑞らの自刃を見届けた後、敵の包囲を突破しようと斬り込み壮絶な戦死を遂げた。",
    "yoshida_minomaru": "長州藩士。吉田松陰の松下村塾で「松門四天王」の一人。情報収集能力と軍事的な才覚に長け、長州藩の諜報活動や諸藩との周旋を担当した。元治元年（1864年）京都・三条木屋町の池田屋で新選組の奇襲に遭遇。一度は脱出するも仲間の危機を知って引き返し、多勢の敵と激闘を繰り広げ討死した。",
    "ijichi_command": "薩摩藩士。合気道や軍学に秀で、身体に障害を持ち片目が不自由でありながら、稀代の軍略家として西郷隆盛から絶対の信任を得た。鳥羽・伏見の戦いでは薩摩軍の作戦参謀として幕府軍を翻弄。戊辰戦争の白河口の戦いでは寡兵で会津軍の大軍を破るなど、新政府軍の勝利を軍略面から決定づけた名将。",
    "kirishima_charge": "長州藩の遊撃隊総督。元は長州藩の武術指南役で、槍術・剣術の達人。尊王攘夷派の急進的武闘派として鳴らし、藩論を強硬論へ牽引した。禁門の変（蛤御門の変）では風折烏帽子に鎖帷子を着込んで先頭に立ち会津・薩摩軍を強襲。薩摩藩兵の銃弾に胸を撃ち抜かれ、その場で潔く自刃した。",
    "akane_negotiation": "長州藩士・僧侶出身の志士。白石正一郎や高杉晋作と親交を結び、奇兵隊の第3代総督に就任。長州藩が孤立無援となった第一次長州征伐に際し、藩の破滅を防ぐため幕府軍との和平交渉に奔走した。しかし高杉晋作らの功山寺挙兵によって主戦派が政権を奪還したため裏切り者とみなされ処刑された悲劇の志士。",
    "okada_izo": "土佐藩郷士出身の剣客。鏡心明智流の達人で「人斬り以蔵」と恐れられた幕末四大人斬りの一人。武市半平太の土佐勤王党に加わり、天誅と称して要人暗殺を繰り返した。勝海舟の護衛を務め暗殺者から勝を救った逸話も持つ。勤王党壊滅後に捕縛され、凄惨な拷問に耐えかね自供した末に打ち首獄門となった。",
    "komatsu_coordination": "薩摩藩家老。若くして首席家老に抜擢され、類まれな調整力と人格で西郷隆盛や大久保利通の活動を全面的に庇護・登用した。坂本龍馬を深く信頼し、薩長同盟の密約締結は小松邸で行われた。大政奉還や王政復帰にも薩摩代表として尽力。明治新政府でも参与・外国官知事として期待されたが35歳で病没した。",
    "nakamura_charge": "薩摩藩士（桐野利秋）。示現流を極め「人斬り半次郎」の異名をとった豪傑。戊辰戦争では会津若松城の開城受け入れを担当し、礼節ある態度で敵将・松平容保らを感嘆させた。明治政府では陸軍少将・裁判長となるが西郷隆盛に従って下野。西南戦争で西郷とともに城山で壮絶な討死を遂げた。",
    "godai_commerce": "薩摩藩士。長崎海軍伝習所でオランダ語・航海術を学ぶ。薩英戦争で捕虜となるも英国商人グラバーらと交流を深め、薩摩藩遣英使節団を導いて渡欧。欧米の近代産業を視察した。維新後は大阪財界の指導者として大阪株式取引所や大阪商工会議所を創設。「東の渋沢、西の五代」と称された近代経済の巨頭。",
    "yoshimura_revolt": "土佐藩出身の志士。武市半平太の土佐勤王党に加盟後にいち早く脱藩。久坂玄瑞らと交わり、公卿の中山忠光を擁立して大和国で「天誅組」を結成して挙兵（天誅組の変）。五條代官所を襲撃して討幕の先鞭をつけたが、八月十八日の政変により孤立無援となり、幕府軍の猛攻に包囲され戦死した。",
    "hijikata_fukucho": "新選組副長。「鬼の副長」と恐れられ、厳格な局中法度により荒くれ者の集団を幕末最強の剣客武装部隊へと鍛え上げた。鳥羽・伏見の戦い以降は洋式軍術を採り入れ、宇都宮城攻防戦や会津戦争を転戦。蝦夷共和国（箱館）では陸軍奉行並として奮戦し、弁天台場を救うため単騎出撃して凶弾に倒れた不屈の士道者。",
    "kondo_kotetsu": "新選組局長。天然理心流宗家4代目。名刀・長曽祢虎徹を帯び、剛胆無比な統率力で隊を率いた。池田屋事件でその名を天下に轟かせ、京都の治安維持に尽力。戊辰戦争では甲陽鎮撫隊を指揮して敗れるも流山で新政府軍に投降。板橋刑場で斬首された。「孤軍たすけ落ちて首をも見ず」の辞世を残した幕府の忠臣。",
    "okita_sandan": "新選組一番隊組長・剣術師範。天然理心流の神童と呼ばれ、目にも留まらぬ速さの「無双三段突き」を操った新選組最強の剣士。池田屋事件や数々の市中粛清戦で刃を振るったが、肺結核に侵され戦線離脱を余儀なくされる。近藤勇の死を知らされぬまま、江戸千駄ヶ谷の植木屋にて20代半ばで病没した悲劇の天才剣士。",
    "aizu_shield": "会津藩第9代藩主。京都守護職に就任し、公武合体と京都の治安回復に尽力。新選組を預かり過激派浪士の鎮圧にあたった。孝明天皇から絶大な信任と御宸翰を賜るも、鳥羽・伏見の戦い以降は朝敵の汚名を着せられる。戊辰戦争では籠城戦の末に開城。義を重んじ最後まで幕府と皇室への誠忠を貫き通した悲運の名君。",
    "saito_gato": "新選組三番隊組長・撃剣師範。左利きの無外流達人とも伝わり、局内の粛清役や密偵など危険な任務を一手に担った。会津戦争では新選組本隊と別れて会津に残り最後まで抗戦。維新後は警察官（警部）となり西南戦争の抜刀隊で大功を立てた。激動の幕末新選組幹部の中で大正時代まで生き抜いた伝説の剣士。",
    "nagakura_bushin": "新選組二番隊組長・撃剣師範。神道無念流の免許皆伝を持ち、沖田総司と並び「新選組最強」と称された剣客。池田屋事件では刀が折れるほどの激闘を繰り広げた。近藤勇と対立して隊を離脱し靖共隊を結成して戊辰戦争を転戦。維新後は北海道へ渡り小樽で余生を送り、新選組の真実を後世に語り継ぐ手記を残した。",
    "sakai_genba_charge": "庄内藩家老（酒井了恒）。戊辰戦争の奥羽越列藩同盟において庄内軍二番大隊を指揮。「鬼玄蕃」の異名をとる神出鬼没の機動戦術と破竹の進撃により、新政府軍を連戦連勝で撃破し一度も負けることなく終戦を迎えた。戦後は西郷隆盛の寛大な戦後処理に深く感服し、西郷の遺訓を広めることに生涯を捧げた。",
    "harada_spear": "新選組十番隊組長。宝蔵院流槍術の達人。腹に切腹の傷痕を持ち「死に損ないの左之助」を豪語した熱血漢。池田屋事件や油小路の変などで長槍を振るい活躍した。近藤勇と袂を分かった後は彰義隊に加わり、上野戦争で官軍相手に奮戦して重傷を負い落命した（大陸へ渡って馬賊になったという伝説も残る）。",
    "sannan_tactics": "新選組総長。北辰一刀流と仙台藩仕込みの武術・教養を兼ね備え、温厚な人格で隊の参謀役・知恵袋として近藤や土方を支えた。しかし隊の武断主義化や方針の違いから孤立し、文久3年（1865年）に突如脱走。沖田総司に連れ戻され、掟に従って沖田の介錯により従容として切腹した。隊士たちから惜しまれた知将。",
    "ito_kasshitaro": "新選組参謀・文学師範。北辰一刀流剣術と国学・水戸学を修めた雄弁家。隊の思想的対立から同志を引き連れて新選組を離脱し、孝明天皇の陵墓を守る名目で「御陵衛士（高台寺党）」を結成。坂本龍馬暗殺の黒幕を新選組と疑う中、近藤勇に酒宴へ招かれ帰り道の油小路で新選組刺客により暗殺された。",
    "sadaakira_guard": "桑名藩第4代藩主。会津藩主・松平容保の実弟。幕末に京都所司代に就任し、兄の容保（京都守護職）とともに「一会桑（一橋・会津・桑名）」体制を築いて幕末京都の治安と政局を牽引した。鳥羽・伏見の戦い後は箱館戦争まで転戦して降伏。明治維新後は日光東照宮宮司などを務めた。",
    "enomoto_naval": "幕府海軍副総裁。オランダへ留学して近代造船術・海軍戦術を学び、開陽丸をはじめとする幕府艦隊を率いた。鳥羽・伏見の敗戦後、幕臣の救済と北辺防衛を目指して艦隊で脱走し箱館五稜郭で「蝦夷共和国」を樹立。敗戦後に投獄されるも黒田清隆らの助命嘆願で赦免され、海軍卿や文部大臣を歴任した開明派幕臣。",
    "otori_strategy": "幕府陸軍奉行並。緒方洪庵の適塾で学び、江川太郎左衛門らに西洋兵学を師事。幕府の伝習隊を育成・指揮し、戊辰戦争では宇都宮城奪還や日光口の戦闘で新政府軍を大いに苦しめた。箱館戦争では陸軍総督として榎本武揚とともに防衛戦を展開。維新後は工部大学校校長や外交官として日本の近代工業化に寄与した。",
    "kawai_artillery": "越後長岡藩家老。佐久間象山に学び世界情勢に通暁した傑物。藩政改革を断行して財政を再建し、ガトリング砲やスナイドル銃など最新鋭西洋火器を配備。戊辰戦争では武装中立を目指して交渉するも決裂し、新政府軍相手に電撃的な奇襲戦を仕掛けて長岡城を奪還した（北越戦争）。戦闘で受けた足の銃創が悪化し戦没。",
    "sagawa_cavalry": "会津藩家老・別撰組隊長。「鬼官兵衛」と恐れられた猛将。戊辰戦争では越後口や会津防衛戦でゲリラ戦を指揮し、新政府軍を幾度も撃退して恐れられた。開城後は斗南藩への移封に付き添い、西南戦争では警視隊抜刀隊副総括として出征。激戦の阿蘇で敵陣に斬り込み壮絶な戦死を遂げた。",
    "akizuki_strategy": "会津藩士。公武合体運動を支え、京都守護職を務める藩主・松平容保の右腕として西郷隆盛や勝海舟ら各藩の首脳と交渉した会津きっての知性派。戊辰戦争では講和を模索して奔走し、越後で河井継之助の支援にも回った。維新後は教育者として熊本の第五高等中学校などで小泉八雲らを支え後進の育成に尽くした。",
    "yamamoto_research": "会津藩士・洋学者。佐久間象山に師事し砲術・洋学を修めた。禁門の変では会津藩の砲兵隊を指揮。鳥羽・伏見の戦い以降に京都で捕縛されるが、獄中で「管見」と題する近代国家建設の建白書を著し新政府を驚嘆させた。失明と足の麻痺を抱えながらも京都府政を指導し、新島襄とともに同志社英学校の創設を支援した。",
    "oguri_reform": "幕府勘定奉行・外国奉行。万延元年遣米使節として渡米し米国の工業力に衝撃を受ける。帰国後に横須賀製鉄所（造船所）の建設を断行し、近代的な海軍と財政基盤を整備。「幕府の命運が尽きるとも、近代日本の土台を残す」と尽力した。武力抗戦を主張したため慶喜に罷免され、領地の上野国権田村にて非業の斬首を遂げた。",
    "yamakawa_cavalry": "会津藩家老（山川浩）。戊辰戦争の会津若松城攻防戦において、伝統芸能「彼岸獅子」の一行に偽装して新政府軍の厳重な包囲網を堂々と突破し城内へ入城した智将。維新後は陸軍少将となり西南戦争の熊本城救援で武功を立てた。東京高等師範学校校長を務めるなど教育者としても高い功績を残した。",
    "nagai_retreat": "幕府旗本・大目付・海軍総裁。長崎海軍伝習所の総監を務め、勝海舟らを指導して幕府海軍を創設。第二次長州征伐の停戦交渉など数々の困難な外交・内政交渉をまとめた幕府屈指の実務家。箱館戦争では榎本武揚らとともに五稜郭に立て籠もり、敗戦後は新政府で開拓使や元老院議官を務めた。",
    "kawamura_navy": "薩摩藩士（のちに海軍大将・海軍卿）。薩英戦争で英国艦に突入する武勇を示し、戊辰戦争では海軍指揮官として活躍。新政府軍の軍艦を統率し宮古湾海戦や箱館戦争の制海権掌握に決定的な貢献をした。維新後は「日本海軍の生みの親」として横須賀鎮守府司令長官などを歴任し、近代海軍の創設を牽引した。",
    "sasaki_patrol": "京都見廻組肝煎・旗本。神道無念流の達人として名を馳せ、新選組とともに京都の治安維持・不逞浪士取締りを担当。清河八郎の暗殺を実行したほか、坂本龍馬・中岡慎太郎が落命した「近江屋事件」の急襲を指揮した最有力人物とされる。鳥羽・伏見の戦いで銃創を負い、紀州へ退却する途中の軍艦上で戦死した。",
    "kayano_sacrifice": "会津藩首席家老。戊辰戦争では会津若松城攻防戦の軍事指揮を執り、最後まで徹底抗戦を主張。降伏後、朝敵とされた会津藩主・松平容保の助命と藩の存続のため、戦争責任を一身に背負い自ら敗戦の首謀者として切腹・殉難した。その潔い義挙は敵味方を問わず深い感動を呼んだ。",
    "koga_naval": "幕府海軍軍艦頭並。幕府の軍艦回天丸の艦長。箱館戦争の宮古湾海戦において、新政府軍の最新鋭装甲艦「甲鉄」を奇襲奪取するアボルダージュ（切り込み接舷作戦）を敢行。敵艦のガトリング砲による猛烈な迎撃を浴びながらも操舵室で指揮を取り続け、全身に被弾して壮絶な戦死を遂げた。",
    "saigo_tanomo_defense": "会津藩首席家老。藩主・松平容保の京都守護職就任に強硬に反対し罷免されるが、戊辰戦争の危機に際して呼び戻され総督として白河口で奮戦。会津城落城の際、一族21人が足手まといにならぬよう集団自決した悲劇でも知られる。維新後は日光東照宮宮司などを務め、武田惣角に大東流合気柔術を伝授した。",
    "yamaoka_surrender": "幕臣・一刀正伝無刀流開祖。「幕末の三舟」の一人。勝海舟の命を受け、官軍で埋まる東海道を単身突破して駿府の西郷隆盛と直談判。「朝敵徳川慶喜、恭順の誠を尽くす」と堂々たる気迫で交渉し、江戸無血開城の道筋を切り開いた。維新後は明治天皇の侍従として篤い信頼を受け、禅と剣に生きた無私の人。",
    "takahashi_guard": "幕臣・山岡鉄舟の義兄。「幕末の三舟」の一人。新陰流の達人で「天下第一の槍使い」と謳われた武芸の泰斗。講武所教授頭取や遊撃隊頭を務め幕府の精鋭武力を統率。江戸無血開城に際しては徳川慶喜の身辺警護を厳重に行い、暴発を防ぎつつ恭順姿勢を貫徹させた。維新後は一切の官職を辞して謹慎し余生を送った。",
    "hara_counsel": "水戸藩士・徳川慶喜の側近。藤田東湖に学んで尊王攘夷論を修め、一橋徳川家の家老として慶喜を輔弼した。大政奉還や幕政改革のブレーンとして辣腕を振るい慶喜の絶対的な信任を得ていたが、開国路線への傾斜を疑われ、幕府内の保守急進派の旗本により京都で暗殺された。その死は慶喜に大打撃を与えた。",
    "hayashi_last_stand": "上総請西藩第3代藩主。幕末において唯一、藩主みずから脱藩して旧幕府軍に加わり戊辰戦争を戦った異色の義士。遊撃隊を率いて箱根や東北・仙台まで転戦して抗戦を続けた。降伏後は改易・幽閉されたがのちに赦免され明治維新後も長く生き、大正・昭和まで激動の記憶を伝えた。",
    "takeda_strategy": "新選組五番隊組長・軍学師範。北辰一刀流や富田流の武術に加え、甲州流軍学を修めて初期新選組の戦術参謀として重宝された。しかし尊王派に傾倒して隊を脱走しようと企てたため、新選組の粛清対象となる。京都・銭取橋にて斎藤一ら刺客の急襲を受け討ち取られた。",
    "iba_duel": "幕府奥詰・心形刀流剣客。幕府の歩兵隊を率いて戊辰戦争に参戦。箱根の戦いで左手首を切断される重傷を負うも隻腕の剣士として復帰し「伊庭の小天狗」と称された。箱館戦争まで転戦して五稜郭で木古内の戦いなどを奮戦。木古内で胸部を撃ち抜かれ、榎本武揚から贈られたモルヒネを服毒して自決した。",
    "abe_defense": "江戸幕府老中首座（備後福山藩主）。ペリー来航に際し、鎖国以来の国是を破って朝廷に報告し全国の諸大名から意見を公募した。幕府主導の海防・軍制改革に着手し、長崎海軍伝習所の創設や講武所の設置、勝海舟ら有能な人材の抜擢を推進。協調的な公議政体の先鞭をつけたが39歳の若さで病没した。",
    "shungaku_council": "越前福井藩第16代藩主（松平慶永）。幕末の四賢侯の一人。橋本左内や横井小楠ら開明的な俊才を登用して藩政改革を推進。幕府の政事総裁職に就任し公武合体と公議政体論を主導した。文久の改革では参勤交代の緩和などを断行。明治維新後も民部卿・大蔵卿などを歴任し新時代の制度設計に関わった。",
    "suzuki_patrol": "新選組九番隊組長（伊東甲子太郎の実弟）。兄とともに新選組に入隊したが、思想の違いから離脱して御陵衛士（高台寺党）を結成。油小路の変で新選組の襲撃を受け、兄を討たれるも薩摩藩邸に逃れて生還。戊辰戦争では赤報隊の二番隊を率い、のちに司法官や警察官を務めた。",
    "matsudaira_nobu_guard": "丹波亀山藩第8代藩主。幕末の動乱期に京都守衛や大坂城警備の重責を担い、幕府の秩序維持に尽力した。公武合体派の大名として幕府と朝廷の調停を試み、鳥羽・伏見の戦い後は新政府に恭順して領内の混乱を防いだ。",
    "sasaki_escort": "新選組隊士。近藤勇の道場・試衛館時代からの古参隊士の一人とされ、美男として知られた。隊内では小姓や局長身辺の護衛任務を務めた。初期新選組の厳しい内部対立や規律の中で命を落としたとされる（諸説あり）。",
    "nomura_defense": "新選組隊士（野村利三郎）。鳥羽・伏見の戦い以降に新選組に合流し、近藤勇が流山で投降した際にも最後まで付き従った忠実な隊士。土方歳三とともに宇都宮、会津、箱館五稜郭へと転戦。箱館・弁天台場の攻防戦で新政府軍相手に激戦の末に戦死した。",
    "abe_masato_policy": "白河藩主・幕府老中。幕府の開国路線を推進し、兵庫開港問題に直面して朝廷の勅許を得るため強硬に幕政を指導した。朝廷の不興を買い官位剥奪・失脚となるが、現実的な対外協調外交を断行した胆力は幕閣の中でも特異な存在であった。",
    "kimura_navy": "幕府目付・軍艦奉行。咸臨丸の渡米航海における最高責任者（軍艦奉行提督）として勝海舟や福沢諭吉らを率いて日本人初の太平洋横断・訪米を成功させた。温厚で公正な人柄で乗組員をまとめ、帰国後は大目付や海軍奉行として近代海軍の創設・運用に尽力した。",
    "matsumoto_medicine": "幕府奥医師・西洋医学者。ポンペに師事して近代医学を修め、長崎養生所（日本初の近代病院）を開設。幕府の医学所頭取となり近代西洋医学の普及に尽力した。戊辰戦争では旧幕府軍の軍医として負傷兵を敵味方なく治療。維新後は初代陸軍軍医総監を務め、海水浴の健康効果を日本に広めた。",
    "abe_juro_tactics": "新選組伍長・柔術師範。のちに伊東甲子太郎の御陵衛士（高台寺党）に同調して隊を離脱。油小路の変では現場を脱出して薩摩藩に庇護された。戊辰戦争では御陵衛士の生き残りで結成された赤報隊や陸援隊に参加し、会津戦争などで旧幕府軍相手に戦った。維新後は北海道で果樹園を開いた。",
    "ii_naosuke": "近江彦根藩第15代藩主・江戸幕府大老。ペリー来航後の国難に際し、朝廷の勅許を得ずに「日米修好通商条約」に調印して開国を断行。将軍継嗣問題でも徳川家茂を擁立し、反発する尊王攘夷派や一橋派の志士・大名を徹底弾圧した（安政の大獄）。桜田門外の変において水戸・薩摩浪士の襲撃を受け非業の死を遂げた。",
    "todo_heisuke": "新選組八番隊組長。試衛館以来の同志で「魁先生（さきがけせんせい）」と称された一番槍の達人。北辰一刀流目録。伊東甲子太郎を隊に引き入れたが、思想的共鳴から新選組を離れて御陵衛士に参加。油小路の変で新選組に襲撃され、旧友の近藤・土方は助命を望んだが隊士の刃に倒れ24歳で落命した。",
    "shimada_kai": "新選組伍長・守衛頭。美濃出身で怪力無双の巨漢剣士。厳格な規律を遵守し近藤・土方を支え続けた。鳥羽・伏見の戦いから箱館戦争まで新選組の全戦闘に従軍。土方歳三の戦死を見届け五稜郭で降伏した。維新後は京都の西本願寺の夜警などを務め、新選組の歴史を正確に語り継いだ。",
    "tatsumi_naobumi": "桑名藩士・幕臣。戊辰戦争で桑名軍を率いて各地を転戦し、卓越した近代戦術と智謀により新政府軍を幾度も撃破。「東軍最高の知将」「雷神」と恐れられた。維新後に新政府に登用されて陸軍に入り、日清戦争・日露戦争でも大功を立て大将まで上り詰めた稀代の名将。",
    "hitomi_katsutaro": "幕臣・遊撃隊隊長。幕府歩兵頭並として洋式調練に熟達。戊辰戦争では伊庭八郎らとともに遊撃隊を率いて房総、箱根、奥州へと転戦。箱館戦争では歩兵頭並として五稜郭で奮戦した。維新後は茨城県令などを歴任し地方行政の近代化に貢献した。",
    "mizuno_magistrate": "幕臣・長崎奉行・外国奉行・勘定奉行。ロシアのプチャーチンとの日露通好条約交渉や、開国後の横浜開港を推進した幕末屈指の外交官・財政家。小栗忠順とともに近代的な国防と造船所の必要性を唱え、幕府の開明路線を牽引した。",
    "kiyokawa_leader": "出羽庄内出身の尊王攘夷派志士。北辰一刀流の達人で文武両道。将軍・徳川家茂の上洛警護を名目に幕府を説得して「浪士組」を結成（新選組の母体）。しかし上洛直後に真の目的は討幕攘夷であると宣言。幕府に危険視され、江戸麻布の一ノ橋にて見廻組の佐々木只三郎らに暗殺された。",
    "takeda_kounsai": "水戸藩家老。徳川斉昭の信任を得て藩政改革と尊王攘夷論を推進。水戸藩内外の尊攘激派が結集した「天狗党」の総首領に推され挙兵（天狗党の乱）。千余名を率いて上洛を目指し真冬の中山道を越えたが越前敦賀で幕府軍に降伏。凄惨な弾圧により武田をはじめ幹部数百名が斬首された。",
    "ogasawara_minister": "唐津藩世子・幕府老中格・外国事務総裁。第二次長州征伐では小倉口総督として指揮を執るが幕府軍の敗色濃厚となり撤退。戊辰戦争では榎本武揚艦隊に合流して箱館五稜郭へ渡り抗戦。維新後は引退して世に出ず、幕末の回顧録を残した。",
    "sagara_souzou": "下野国郷士出身の尊攘派志士。西郷隆盛らの密命を受け江戸で薩摩藩邸浪士隊を率いて幕府を挑発。戊辰戦争勃発に際し、新政府軍の先鋒として「赤報隊」を結成。「年貢半減令」を掲げて東山道を快進撃したが、新政府の方針転換により偽官軍の汚名を着せられ下諏訪にて処刑された悲劇の志士。",
    "shibusawa_eiichi": "武蔵国血洗島の豪農出身。尊王攘夷思想に傾倒し高崎城乗っ取りを企てるも挫折、一橋慶喜に仕官して幕臣となる。徳川昭武に従いパリ万国博覧会へ渡欧し近代資本主義の仕組みを学ぶ。維新後は大蔵省で新制度を整えた後に実業界へ転じ、第一国立銀行など約500もの企業を育て「日本資本主義の父」と称された。",
    // 新規追加志士人物伝（8名）
    "shimazu_nariakira": "薩摩藩第11代藩主。洋式軍備や近代産業を興す「集成館事業」を創始し、反射炉・造船所・紡績・電信を日本で初めて実用化させた幕末屈指の名君。西郷隆盛や大久保利通の非凡な才を見出して抜擢し、明治維新の原動力となる薩摩の礎を築いた。大軍を率いての上洛直前に志半ばで急逝。",
    "john_manjiro": "土佐国中浜の漁師出身（中浜万次郎）。14歳で漂流しアメリカ捕鯨船に救助され渡米。近代航海術・測量・英語を修めて首席卒業し、ゴールドラッシュで資金を得て奇跡の帰国を果たした。日米和親条約の交渉通訳や軍艦操練所教授を務め、咸臨丸の太平洋横断でも活躍した日米架け橋の偉人。",
    "yuri_kimimasa": "越前福井藩士（三岡八郎）。橋本左内や横井小楠に師事し藩財政の再建に辣腕を振るう。坂本龍馬と深く親交を結び新国家の経済政策を策定。明治新政府では参与・会計事務掛となり「五箇条の御誓文」の原案を起草、日本最初の全国通用紙幣「太政官札」を発行して国家財政の基礎を確立した。",
    "hirano_kuniomi": "筑前福岡藩士。尊皇攘夷激派の志士。西郷隆盛と僧月照の入水に立ち会い月照を救出、寺田屋事件にも関与した。大和天誅組の変に呼応して但馬生野で挙兵（生野の変）したが敗れ捕縛。京都六角獄舎に投獄され、禁門の変の混乱の中で斬首処刑された悲壮の義士。",
    "tokugawa_yoshinobu": "江戸幕府第15代征夷大将軍（徳川慶喜）。水戸徳川家出身の一橋家当主。卓越した知謀で国難に立ち向かい、土佐藩の建白を容れて「大政奉還」を決断。鳥羽・伏見の戦い後は主戦論を退けて自ら上野寛永寺・水戸で謹慎・恭順を徹底し、江戸無血開城と日本の内乱終息を導いた最後の将軍。",
    "nakano_takeko": "会津藩士の娘。江戸三大道場・玄武館で薙刀・撃剣・書道を修めた才色兼備の女剣士。戊辰戦争の会津城下戦において武家の女性たちを率いて自発的に「娘子隊」を結成。白装束に薙刀を手に新政府軍の銃列へ決死の突撃を敢行し、柳橋の激闘にて銃弾を受け21歳の若さで散華した。",
    "iwase_tadanari": "江戸幕府旗本・外国奉行・目付。俊才をもって知られ、ペリー来航後の外交を一手に担う。初代米国総領事ハリスと粘り強い交渉を展開して日米修好通商条約の条文を起草、「条約の理財」と称された。安政の五カ国条約を主導したが、将軍継嗣問題で井伊直弼に疎まれ安政の大獄で失脚・蟄居となった。",
    "hattori_takeo": "播磨赤穂出身の新選組撃剣師範・柔術師範。二刀流の達人として恐れられた。伊東甲子太郎らとともに新選組を離脱して御陵衛士（高台寺党）を結成。油小路の変において伊東の遺体を収容に訪れ新選組の伏兵と激突。背中に民家の塀を背負い、多勢の隊士を相手に孤軍奮戦して壮烈な最期を遂げた。",
    "yamamoto_yae": "会津藩砲術師範・山本権八の娘で山本覚馬の妹。会津戦争に際して断髪男装し、兄から贈られた最新鋭の七連発スペンサー銃を手に鶴ヶ城に籠城。夜襲に際して自ら銃撃戦を指揮して新政府軍を撃退、「幕末のジャンヌ・ダルク」と称された。維新後は京都へ移り、新島襄と結婚して同志社英学校（現・同志社大学）の創立を支えた。日清・日露戦争では篤志看護婦として従軍し、女性として初となる叙勲を受けた。",

    "fujita_toko": "水戸藩主・徳川斉昭の腹心として藩政改革を牽引した碩学。『正気歌』『回天詩史』を著して尊皇攘夷思想を体系化し、吉田松陰や西郷隆盛ら幕末志士に絶大な影響を与えた。安政江戸地震において母を助け出そうとして圧死し、志半ばで世を去った。",
    "hashimoto_sanai": "越前福井藩士・蘭方医。若くして『啓発録』を著し、藩主・松平春嶽の側近として藩政改革を推進。将軍継嗣問題では一橋慶喜の擁立を企て西郷隆盛らと奔走した。開国進取と殖産興業を唱えた大器であったが、大老・井伊直弼による安政の大獄で捕縛され26歳で刑死した。",
    "kawaji_toshiakira": "江戸幕府勘定奉行。三河国出身。卓越した行政手腕を買われ、ペリー来航時には海岸防禦御用掛、日露交渉では幕府全権として下田でロシア提督プチャーチンと交渉し『日露通好条約』を締結。至誠を尽くした人格はロシア側からも高く賞賛された。江戸城開城に際して自刃を遂げた。",
    "serizawa_kamo": "水戸郷士出身で新選組筆頭局長。神道無念流免許皆伝の剛剣で、文久3年に清河八郎の浪士組に参加して上洛。清河の離反後は近藤勇らと共に京都に残留して壬生浪士組を結成した。粗暴な言動や刃傷沙汰が重なり、会津藩の密命を受けた近藤・土方らによって八木邸にて暗殺された。",

    "shimazu_hisamitsu": "薩摩藩主・島津忠義の実父（薩摩藩国父）。兄・斉彬の遺志を継ぎ藩政を主導。文久2年に千余名の兵を率いて上洛し、勅使を奉じて幕政改革（文久の改革）を断行させた。寺田屋騒動では過激尊攘派を鎮圧。生麦事件や薩英戦争を経験して軍備近代化を進め、薩長同盟と明治維新の基盤を築いた。",
    "kawakami_gensai": "肥後熊本藩士。「幕末四大人斬り」の一人に数えられる神速の居合の達人。尊皇攘夷思想を奉じ、長州藩の久坂玄瑞や宮部鼎蔵らと交わる。元治元年、白昼の京都三条木屋町で開国論者の巨頭・佐久間象山を白刃一閃で暗殺。鳥羽・伏見の戦いにも従軍したが、明治維新後の開国新政に反対して斬首された。",
    "ando_nobumasa": "陸奥磐城平藩主・江戸幕府老中。大老・井伊直弼が桜田門外の変で暗殺された後、老中首座として幕政を担当。皇妹・和宮の将軍徳川家茂への降嫁を推進し、公武合体によって幕府の威信回復を図った。これに反発する水戸脱藩浪士らに坂下門外で襲撃されて負傷（坂下門外の変）、失脚した。",
    "tsutsui_masanori": "江戸幕府旗本・槍奉行・西丸留守居・大目付。温厚誠実な人柄と深い見識で信頼を集めた名臣。嘉永7年、ロシア使節プチャーチンとの下田交渉において筆頭全権を務め、川路聖謨と共に至誠をもって『日露通好条約』に調印した。国境画定や開港交渉において日本の主権確立に貢献した。",
};

// 全志士カードに人物伝（bio）を自動付与
if (GAME_DATA.cards && GAME_DATA.shishiBios) {
    Object.keys(GAME_DATA.shishiBios).forEach(cardId => {
        if (GAME_DATA.cards[cardId]) {
            GAME_DATA.cards[cardId].bio = GAME_DATA.shishiBios[cardId];
        }
    });
}
