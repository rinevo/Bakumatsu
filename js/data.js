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
            character: "ryoma",
            type: "shishi",
            subType: "leader",
            cost: 2,
            attack: 8,
            shield: 4,
            desc: "敵に 8 ダメージ、防 4。手札を全て捨てて3枚ドロー。敵の攻撃意図を3減少。",
            rarity: "rare",
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
            rarity: "starter",
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
            rarity: "common",
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
            rarity: "rare",
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
            rarity: "uncommon",
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
            rarity: "uncommon",
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
            rarity: "common",
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
            rarity: "uncommon",
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
            rarity: "uncommon",
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
            rarity: "uncommon",
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
            rarity: "rare",
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
            rarity: "rare",
            onPlay: (b) => {
                b.modifyImperialGauge(-5);
            }
        },
        "kido_reform": {
            id: "kido_reform",
            name: "木戸孝允：維新の設計",
            faction: "tobaku",
            character: "kido",
            type: "shishi",
            cost: 1,
            attack: 8,
            shield: 6,
            desc: "敵に 8 ダメージ、防 6。カードを1枚引く。",
            rarity: "rare",
            onPlay: (b) => {
                b.drawCards(1);
            }
        },
        "nakaoka_mediator": {
            id: "nakaoka_mediator",
            name: "中岡慎太郎：盟友の奔走",
            faction: "tobaku",
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
            rarity: "rare",
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
            rarity: "rare",
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
            rarity: "rare",
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
            rarity: "rare",
            onPlay: (b) => {
                b.healPlayer(5);
            }
        },
        "kuroda_frontier": {
            id: "kuroda_frontier",
            name: "黒田清隆：北辺の開拓",
            faction: "tobaku",
            character: "kuroda",
            type: "shishi",
            cost: 2,
            attack: 12,
            shield: 8,
            desc: "敵に 12 ダメージ、防 8。最大HPを 3 増やす。",
            rarity: "rare",
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
            rarity: "rare",
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
            rarity: "rare",
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
            rarity: "rare",
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
            rarity: "rare",
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
            rarity: "rare",
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
            rarity: "rare",
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
            rarity: "rare",
            onPlay: (b) => {
                b.drawCards(1);
            }
        },
        "maki_revolt": {
            id: "maki_revolt",
            name: "真木和泉：尊王の檄文",
            faction: "tobaku",
            character: "maki",
            type: "shishi",
            cost: 1,
            attack: 11,
            shield: 4,
            desc: "敵に 11 ダメージ、防 4。次の戦闘の攻撃力+3。",
            rarity: "rare",
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
            rarity: "rare",
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
            rarity: "rare",
            onPlay: (b) => {
                b.modifyImperialGauge(-3);
            }
        },
        "mochizuki_sacrifice": {
            id: "mochizuki_sacrifice",
            name: "望月亀弥太：池田屋の奮戦",
            faction: "tobaku",
            character: "mochizuki",
            type: "shishi",
            cost: 2,
            attack: 18,
            shield: 0,
            desc: "敵に 18 ダメージ。自分のHPを 5 消費する。",
            rarity: "rare",
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
            rarity: "rare",
            onPlay: (b) => {
                b.modifyImperialGauge(-4);
            }
        },
        "yoshida_teaching": {
            id: "yoshida_teaching",
            name: "吉田松陰：松下村塾の志",
            faction: "tobaku",
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
            character: "irie",
            type: "shishi",
            cost: 1,
            attack: 6,
            shield: 10,
            desc: "敵に 6 ダメージ、防 10。敵に脱力 1を付与する。",
            rarity: "rare",
            onPlay: (b) => {
                b.applyStatusToEnemy("weak", 1);
            }
        },
        "yoshida_minomaru": {
            id: "yoshida_minomaru",
            name: "吉田稔麿：松下村塾の剣",
            faction: "tobaku",
            character: "yoshida_minomaru",
            type: "shishi",
            cost: 1,
            attack: 13,
            shield: 3,
            desc: "敵に 13 ダメージ、防 3。敵が攻撃意図なら追加3ダメージ。",
            rarity: "rare",
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
            rarity: "rare",
            onPlay: (b) => {
                b.applyPlayerBuff("strength", 5);
            }
        },
        "kirishima_charge": {
            id: "kirishima_charge",
            name: "来島又兵衛：禁門の猛進",
            faction: "tobaku",
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
            rarity: "rare",
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
            rarity: "rare",
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
            character: "hijikata",
            type: "shishi",
            subType: "leader",
            cost: 2,
            attack: 13,
            shield: 7,
            desc: "敵のシールドを無視して 13 ダメージ、防 7。【代償】ターン終了時に手札を1枚破棄。",
            rarity: "rare",
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
            rarity: "starter",
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
            character: "kondo",
            type: "shishi",
            cost: 2,
            attack: 12,
            shield: 8,
            desc: "敵に 12 ダメージ、防 8。【連携：土方歳三】場に土方がいれば反撃態勢（攻撃を受けた時10反射）。",
            rarity: "common",
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
            rarity: "rare",
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
            shield: 15,
            desc: "防 15。現在のシールド値を 1.4 倍にする。",
            rarity: "uncommon",
            onPlay: (b, self) => {
                b.gainPlayerShield(15);
                b.playerShield = Math.floor(b.playerShield * 1.4);
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
            rarity: "common",
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
        "yamagawa_defense": {
            id: "yamagawa_defense",
            name: "山川浩：会津守備隊",
            faction: "sabaku",
            character: "yamagawa",
            type: "shishi",
            cost: 2,
            attack: 4,
            shield: 14,
            desc: "敵に 4 ダメージ、防 14。",
            rarity: "uncommon"
        },
        "harada_spear": {
            id: "harada_spear",
            name: "原田左之助：槍術一閃",
            faction: "sabaku",
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
            rarity: "rare",
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
            rarity: "rare"
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
            rarity: "rare",
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
            rarity: "rare",
            onPlay: (b) => {
                b.drawCards(2);
            }
        },
        "oguri_reform": {
            id: "oguri_reform",
            name: "小栗忠順：造船の先見",
            faction: "sabaku",
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
            name: "山川大蔵：会津の退陣",
            faction: "sabaku",
            character: "yamakawa_taizo",
            type: "shishi",
            cost: 1,
            attack: 8,
            shield: 10,
            desc: "敵に 8 ダメージ、防 10。HPを 4 回復する。",
            rarity: "rare",
            onPlay: (b) => {
                b.healPlayer(4);
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
            rarity: "rare",
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
            rarity: "rare",
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
        "katamori_oath": {
            id: "katamori_oath",
            name: "松平容保：義の誓い",
            faction: "sabaku",
            character: "katamori",
            type: "shishi",
            cost: 2,
            attack: 7,
            shield: 15,
            desc: "敵に 7 ダメージ、防 15。次のターンの被ダメージを 4 軽減する。",
            rarity: "rare",
            onPlay: (b) => {
                b.applyPlayerBuff("damage_reduction", 4);
            }
        },
        "koga_naval": {
            id: "koga_naval",
            name: "甲賀源吾：箱館の艦隊",
            faction: "sabaku",
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
        "kuroda_defense": {
            id: "kuroda_defense",
            name: "黒田了介：守備の采配",
            faction: "sabaku",
            character: "kuroda_ryosuke",
            type: "shishi",
            cost: 1,
            attack: 5,
            shield: 14,
            desc: "敵に 5 ダメージ、防 14。HPを 3 回復する。",
            rarity: "rare",
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
            rarity: "rare",
            onPlay: (b) => {
                b.applyPlayerBuff("damage_reduction", 3);
            }
        },
        "hara_counsel": {
            id: "hara_counsel",
            name: "原市之進：幕府の進言",
            faction: "sabaku",
            character: "hara_ichinoshin",
            type: "shishi",
            cost: 1,
            attack: 5,
            shield: 12,
            desc: "敵に 5 ダメージ、防 12。列強介入メーターを 4% 下げる。",
            rarity: "rare",
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
            rarity: "rare",
            onPlay: (b) => {
                b.applyStatusToEnemy("weak", 2);
            }
        },
        "iba_duel": {
            id: "iba_duel",
            name: "伊庭八郎：片腕の剣客",
            faction: "sabaku",
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
            rarity: "rare",
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
            rarity: "rare",
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
            rarity: "rare",
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
            rarity: "rare",
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
            rarity: "rare",
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
            character: "nomura",
            type: "shishi",
            cost: 2,
            attack: 7,
            shield: 15,
            desc: "敵に 7 ダメージ、防 15。列強介入メーターを 3%下げる。",
            rarity: "rare",
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
            rarity: "rare",
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
            rarity: "rare",
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
            rarity: "rare",
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
            rarity: "rare",
            onPlay: (b) => {
                b.applyStatusToEnemy("weak", 2);
            }
        },
        "ii_naosuke": {
            id: "ii_naosuke",
            name: "井伊直弼：大老の断行",
            faction: "sabaku",
            character: "ii_naosuke",
            type: "shishi",
            cost: 2,
            attack: 0,
            shield: 18,
            desc: "防 18。列強介入メーターを 5% 下げる。敵の攻撃意図を 4 減少。",
            rarity: "rare",
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
            rarity: "rare",
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
            rarity: "rare",
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

        // --- ⚠️ 不平等条約・呪いカード ---
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
        }
    },

    // ==========================================
    // 2. レリック（遺物）定義
    // ==========================================
    relics: {
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
            desc: "商人でのカード購入や削除の費用が常時 25% 割引される。",
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
        }
    },

    // ==========================================
    // 3. 世論（トレンド・モディファイア）
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
        // ACT 1: 京洛動乱
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
        "act1_elite_izo": {
            name: "人斬り以蔵 (岡田以蔵)",
            maxHp: 78,
            isElite: true,
            sprite: "izo",
            intents: [
                { type: "attack", damage: 10, times: 2, desc: "二連撃" },
                { type: "attack", damage: 13, desc: "踏み込み" },
                { type: "curse", curseId: "curse_riot", damage: 8, desc: "天誅の怨嗟" },
                { type: "attack", damage: 21, desc: "人斬り秘剣" }
            ]
        },
        "act1_boss_tobaku": {
            name: "新選組局長・近藤勇",
            maxHp: 135,
            isBoss: true,
            sprite: "kondo_boss",
            intents: [
                { type: "defend", shield: 14, desc: "不動の構え" },
                { type: "attack", damage: 20, desc: "虎徹・袈裟斬り" },
                { type: "buff", strength: 3, desc: "誠の号令" },
                { type: "attack", damage: 28, desc: "天然理心流・絶技" }
            ]
        },
        "act1_boss_sabaku": {
            name: "長州総帥・桂小五郎",
            maxHp: 130,
            isBoss: true,
            sprite: "katsura_boss",
            intents: [
                { type: "attack", damage: 16, desc: "神道無念流・霞斬り" },
                { type: "defend", shield: 16, desc: "逃げの小五郎" },
                { type: "curse", curseId: "curse_betrayal", damage: 11, desc: "革命の扇動" },
                { type: "attack", damage: 26, desc: "維新の疾風" }
            ]
        },

        // ACT 2: 東海道進軍・関所突破
        "act2_normal_1": {
            name: "幕府新式歩兵連隊",
            maxHp: 64,
            sprite: "shinsiki",
            intents: [
                { type: "attack", damage: 14, desc: "小銃一斉射撃" },
                { type: "attack", damage: 17, desc: "追撃射撃" },
                { type: "defend", shield: 14, desc: "方陣防御" },
                { type: "attack", damage: 21, desc: "銃剣突撃" }
            ]
        },
        "act2_elite_serizawa": {
            name: "芹沢鴨（豪剣の猛威）",
            maxHp: 105,
            isElite: true,
            sprite: "serizawa",
            intents: [
                { type: "attack", damage: 21, desc: "豪刀乱舞" },
                { type: "buff", strength: 5, desc: "酒気狂乱" },
                { type: "attack", damage: 28, desc: "無慈悲の一閃" },
                { type: "attack", damage: 18, times: 2, desc: "酔剣二連" }
            ]
        },
        "act2_boss_katamori": {
            name: "会津藩主・松平容保",
            maxHp: 190,
            isBoss: true,
            sprite: "katamori_boss",
            intents: [
                { type: "defend", shield: 22, desc: "会津魂の盾" },
                { type: "attack", damage: 22, desc: "白虎隊斉射" },
                { type: "buff", strength: 3, desc: "死守の命" },
                { type: "attack", damage: 34, desc: "義理不抜の猛撃" }
            ]
        },
        "act2_boss_saigo": {
            name: "薩摩軍総督・西郷隆盛",
            maxHp: 200,
            isBoss: true,
            sprite: "saigo_boss",
            intents: [
                { type: "attack", damage: 24, desc: "薬丸自顕流・初太刀" },
                { type: "defend", shield: 20, desc: "薩摩隼人の気迫" },
                { type: "attack", damage: 36, desc: "桜島大噴火撃" },
                { type: "buff", strength: 4, desc: "敬天愛人" }
            ]
        },

        // ACT 3: 江戸城 / 京都御所 決戦
        "act3_final_yoshinobu": {
            name: "征夷大将軍・徳川慶喜",
            maxHp: 285,
            isFinalBoss: true,
            sprite: "yoshinobu_boss",
            intents: [
                { type: "defend", shield: 25, desc: "徳川三百年の方陣" },
                { type: "attack", damage: 26, desc: "幕府新鋭砲兵斉射" },
                { type: "curse", curseId: "curse_extraterritoriality", damage: 13, desc: "列強外交の重圧" },
                { type: "attack", damage: 40, desc: "双極の終焉・葵の裁き" }
            ]
        },
        "act3_final_kangun": {
            name: "新政府官軍総司令部",
            maxHp: 295,
            isFinalBoss: true,
            sprite: "kangun_boss",
            intents: [
                { type: "attack", damage: 28, desc: "錦旗の下での総進軍" },
                { type: "defend", shield: 28, desc: "御所親衛陣" },
                { type: "buff", strength: 5, desc: "討幕の宣誓" },
                { type: "attack", damage: 42, desc: "新時代への鉄槌" }
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
            title: "池田屋事件の急襲",
            desc: "三条小橋の旅籠「池田屋」に不逞志士が集結しているとの報せが入った。夜雨の中、提灯の明かりが揺れる。",
            choices: [
                {
                    text: "先陣を切って斬り込む（戦闘リスク大・高報酬）",
                    effectDesc: "志士『近藤勇』を獲得。HPを 10 失うが、強力なレリックと 60両 を獲得。",
                    action: (app) => {
                        app.addCardToDeck("kondo_kotetsu");
                        app.damagePlayer(10);
                        app.gold += 60;
                        app.obtainRandomRelic();
                    }
                },
                {
                    text: "裏手を固め、逃走者を捕縛する（堅実）",
                    effectDesc: "志士『沖田総司』を獲得。カードを1枚デッキから削除し、30両 を獲得。",
                    action: (app) => {
                        app.addCardToDeck("okita_sandan");
                        app.gold += 30;
                        app.openCardRemovalModal();
                    }
                },
                {
                    text: "深入りを避け、情報のみ持ち帰る",
                    effectDesc: "志士『望月亀弥太』を獲得。HPを 12 回復する。",
                    action: (app) => {
                        app.addCardToDeck("mochizuki_sacrifice");
                        app.healPlayer(12);
                    }
                }
            ]
        },
        {
            id: "event_glover",
            act: 1,
            title: "長崎グラバー商会の密談",
            desc: "英国商人トーマス・グラバーが新式の洋式火器を前に、妖しい微笑みを浮かべている。「貴国の未来のために、格安で最新の兵器を用立てましょう…ただし代償は条約で」",
            choices: [
                {
                    text: "莫大な借款契約を結び、最新火器を受け取る",
                    effectDesc: "志士『井上馨』を獲得。『新式ミニエ銃』と 80両 を獲得するが、【列強介入+15%】＆呪い『治外法権の受容』が混入！",
                    action: (app) => {
                        app.addCardToDeck("inoue_negotiation");
                        app.addCardToDeck("weapon_minie");
                        app.addCardToDeck("curse_extraterritoriality");
                        app.gold += 80;
                        app.modifyImperialGauge(15);
                        window.soundSystem.playWarning();
                    }
                },
                {
                    text: "手持ちの資金のみで通常購入する（60両）",
                    costGold: 60,
                    effectDesc: "60両を支払い、『新式ミニエ銃』を入手（列強介入なし）。",
                    canChoose: (app) => app.gold >= 60,
                    action: (app) => {
                        app.gold -= 60;
                        app.addCardToDeck("weapon_minie");
                    }
                },
                {
                    text: "毅然と断り、主権を守る",
                    effectDesc: "志士『岩崎弥太郎』を獲得。【列強介入-8%】。気迫により最大HP+4。",
                    action: (app) => {
                        app.addCardToDeck("iwazaki_finance");
                        app.modifyImperialGauge(-8);
                        app.maxHp += 4;
                        app.hp += 4;
                    }
                }
            ]
        },
        {
            id: "event_teradaya",
            act: 2,
            title: "伏見・寺田屋の遭難",
            desc: "深夜、宿が幕府捕吏に包囲された！「上意討ちである！」襖を蹴破る足音が響く。",
            choices: [
                {
                    text: "隠し持った高杉晋作のピストルで応戦！",
                    effectDesc: "志士『坂本龍馬』を獲得。HP 8 ダメージを受けるが、敵を撃退しレリック『西洋懐中時計』を獲得。",
                    action: (app) => {
                        app.addCardToDeck("ryoma_kaiwentai");
                        app.damagePlayer(8);
                        app.obtainRelic("pocket_watch");
                    }
                },
                {
                    text: "お龍の機転に従い、裏庭から脱出する",
                    effectDesc: "志士『吉井友実』を獲得。HPを 10 回復し、山札の全カードを把握する。",
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.healPlayer(10);
                    }
                }
            ]
        },
        {
            id: "event_taisei_hokan",
            act: 2,
            title: "大政奉還の歴史的評議",
            desc: "徳川慶喜が政権を朝廷に返上するか否か、天下を揺るがす建白書が突きつけられた。",
            choices: [
                {
                    text: "内戦を避け、平和的政権移行を後押しする",
                    effectDesc: "志士『後藤象二郎』を獲得。【列強介入-12%】。全カードの最大HP+5＆完全回復。",
                    action: (app) => {
                        app.addCardToDeck("goto_political_drive");
                        app.modifyImperialGauge(-12);
                        app.maxHp += 5;
                        app.hp = app.maxHp;
                    }
                },
                {
                    text: "旧勢力の完全排除を主張し、決戦を挑む",
                    effectDesc: "志士『岩倉具視』を獲得。デッキに『アームストロング砲』を追加。次の戦闘で攻撃力倍増。",
                    action: (app) => {
                        app.addCardToDeck("iwakura_imperial");
                        app.addCardToDeck("weapon_armstrong");
                        app.nextBattleStrengthBuff = 6;
                    }
                }
            ]
        },
        {
            id: "event_sakuradamon",
            act: 1,
            title: "桜田門外の変・雪中の襲撃",
            desc: "江戸城桜田門の外に、井伊直弼の駕籠を待ち伏せる人影がある。雪に紛れて刀を抜くか、騒乱を未然に止めるか。",
            choices: [
                {
                    text: "襲撃に加勢し、幕府の中枢を揺さぶる",
                    effectDesc: "志士『有馬新七』を獲得。HPを 8 失うが、列強介入-10%と 45両を得る。",
                    action: (app) => {
                        app.addCardToDeck("arima_revolt");
                        app.damagePlayer(8);
                        app.modifyImperialGauge(-10);
                        app.gold += 45;
                    }
                },
                {
                    text: "警護を固め、混乱を鎮める",
                    effectDesc: "志士『井伊直弼』を獲得。HPを 8 回復し、最大HP+3。",
                    action: (app) => {
                        app.addCardToDeck("ii_naosuke");
                        app.healPlayer(8);
                        app.maxHp += 3;
                        app.hp = Math.min(app.maxHp, app.hp + 3);
                    }
                },
                {
                    text: "現場を離れ、噂だけを持ち帰る",
                    effectDesc: "志士『田中光顕』を獲得。15両を得る。",
                    action: (app) => {
                        app.addCardToDeck("tanaka_intelligence");
                        app.gold += 15;
                    }
                }
            ]
        },
        {
            id: "event_satcho_alliance",
            act: 2,
            title: "薩長同盟の密約",
            desc: "犬猿の仲だった薩摩と長州が、坂本龍馬の仲介で一つの卓を囲んだ。互いの誇りを捨て、来るべき時代に備える必要がある。",
            choices: [
                {
                    text: "密約に署名し、共同戦線を組む",
                    effectDesc: "志士『中岡慎太郎』を獲得。『薩長同盟の密約』をデッキに加え、次の戦闘の攻撃力+4。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("nakaoka_mediator");
                        app.addCardToDeck("satcho_secret");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    text: "片方に肩入れし、資金を引き出す",
                    effectDesc: "志士『小松帯刀』を獲得。50両を得るが、列強介入+6%。",
                    action: (app) => {
                        app.addCardToDeck("komatsu_coordination");
                        app.gold += 50;
                        app.modifyImperialGauge(6);
                    }
                },
                {
                    text: "同盟を急がず、互いの力を見極める",
                    effectDesc: "志士『桂小五郎』を獲得。HPを 10 回復し、列強介入-4%。",
                    action: (app) => {
                        app.addCardToDeck("katsura_shindo");
                        app.healPlayer(10);
                        app.modifyImperialGauge(-4);
                    }
                }
            ]
        },
        {
            id: "event_toba_fushimi",
            act: 2,
            title: "鳥羽・伏見の戦端",
            desc: "錦の御旗が翻り、淀川沿いに砲声が轟く。戦場へ急行すれば勝機はあるが、退けば兵を温存できる。",
            choices: [
                {
                    text: "砲火を恐れず、最前線へ進む",
                    effectDesc: "志士『山田顕義』を獲得。HPを 14 失うが、『アームストロング砲』と 35両を獲得。",
                    action: (app) => {
                        app.addCardToDeck("yamada_modern_army");
                        app.damagePlayer(14);
                        app.addCardToDeck("weapon_armstrong");
                        app.gold += 35;
                    }
                },
                {
                    text: "要所を守り、反撃の機会を待つ",
                    effectDesc: "志士『人見勝太郎』を獲得。次の戦闘で攻撃力+8、HPを 5 回復。",
                    action: (app) => {
                        app.addCardToDeck("hitomi_katsutaro");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 8;
                        app.healPlayer(5);
                    }
                },
                {
                    text: "兵を退き、民の被害を抑える",
                    effectDesc: "志士『原市之進』を獲得。列強介入-8%、最大HP+2。",
                    action: (app) => {
                        app.addCardToDeck("hara_counsel");
                        app.modifyImperialGauge(-8);
                        app.maxHp += 2;
                    }
                }
            ]
        },
        {
            id: "event_goryokaku",
            act: 3,
            title: "五稜郭、北辺の決断",
            desc: "北の大地に築かれた星形要塞へ、最後の兵たちが集う。新政府への降伏か、異国との交易を見据えた独立か。",
            choices: [
                {
                    text: "要塞に籠もり、最後まで抗戦する",
                    effectDesc: "志士『榎本武揚』を獲得。HPを 12 失うが、最大HP+8と次の戦闘の攻撃力+5。",
                    action: (app) => {
                        app.addCardToDeck("enomoto_naval");
                        app.damagePlayer(12);
                        app.maxHp += 8;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                    }
                },
                {
                    text: "新時代を受け入れ、武器を手放す",
                    effectDesc: "志士『大鳥圭介』を獲得。列強介入-10%、HPを完全回復。",
                    action: (app) => {
                        app.addCardToDeck("otori_strategy");
                        app.modifyImperialGauge(-10);
                        app.hp = app.maxHp;
                    }
                },
                {
                    text: "異国商人と交渉し、交易路を開く",
                    effectDesc: "志士『島田魁』を獲得。70両を得るが、列強介入+12%。",
                    action: (app) => {
                        app.addCardToDeck("shimada_kai");
                        app.gold += 70;
                        app.modifyImperialGauge(12);
                    }
                }
            ]
        },
        {
            id: "event_shimonoseki",
            act: 1,
            title: "下関海峡、攘夷の砲火",
            desc: "海峡を封鎖した長州の砲台に、四国連合艦隊が迫る。異国船を撃つか、いったん砲を下ろして国力を蓄えるか。",
            choices: [
                {
                    text: "砲台を死守し、攘夷の意地を示す",
                    effectDesc: "志士『高杉晋作』を獲得。HPを 10 失うが、50両と次の戦闘の攻撃力+6を得る。",
                    action: (app) => {
                        app.addCardToDeck("takasugi_kiheitai");
                        app.damagePlayer(10);
                        app.gold += 50;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 6;
                    }
                },
                {
                    text: "洋式兵器を受け入れ、砲術を学ぶ",
                    effectDesc: "志士『井上馨』を獲得。『舶来ガトリング砲』を得るが、列強介入+8%。",
                    action: (app) => {
                        app.addCardToDeck("inoue_negotiation");
                        app.addCardToDeck("weapon_gatling");
                        app.modifyImperialGauge(8);
                    }
                },
                {
                    text: "停戦を申し入れ、民の被害を抑える",
                    effectDesc: "志士『赤禰武人』を獲得。列強介入-6%、HPを 6 回復する。",
                    action: (app) => {
                        app.addCardToDeck("akane_negotiation");
                        app.modifyImperialGauge(-6);
                        app.healPlayer(6);
                    }
                }
            ]
        },
        {
            id: "event_satsuma_decision",
            act: 2,
            title: "薩摩藩、討幕への転回",
            desc: "朝廷からの密使が薩摩藩邸を訪れた。幕府と手を結ぶか、長州と共に新たな政を目指すか、藩の未来を決める夜だ。",
            choices: [
                {
                    text: "長州と和解し、討幕の旗を掲げる",
                    effectDesc: "志士『小松帯刀』を獲得。『桂小五郎：神道無念流』をデッキに加え、35両を得る。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("komatsu_coordination");
                        app.addCardToDeck("katsura_shindo");
                        app.gold += 35;
                    }
                },
                {
                    text: "幕府との関係を保ち、情勢を見極める",
                    effectDesc: "志士『吉井友実』を獲得。最大HP+5、列強介入-5%。",
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.maxHp += 5;
                        app.hp += 5;
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    text: "どちらにも与せず、兵糧を確保する",
                    effectDesc: "志士『伊地知正治』を獲得。70両を得るが、HPを 6 失う。",
                    action: (app) => {
                        app.addCardToDeck("ijichi_command");
                        app.gold += 70;
                        app.damagePlayer(6);
                    }
                }
            ]
        },
        {
            id: "event_katsu_saigo",
            act: 2,
            title: "江戸城無血開城の談判",
            desc: "勝海舟と西郷隆盛が向かい合い、江戸の町を戦火から救う最後の話し合いが始まった。誇りと人命、そのどちらを優先するか。",
            choices: [
                {
                    text: "恭順を受け入れ、江戸を救う",
                    effectDesc: "志士『西郷隆盛』を獲得。HPを完全回復し、列強介入-12%。",
                    action: (app) => {
                        app.addCardToDeck("saigo_jigen");
                        app.hp = app.maxHp;
                        app.modifyImperialGauge(-12);
                    }
                },
                {
                    text: "【討幕派】勝海舟の大局観を受け入れ、新日本の海防を託す",
                    faction: "tobaku",
                    effectDesc: "志士『山岡鉄舟』を獲得。『勝海舟：無血の大局観』をデッキに加え、列強介入-10%、HPを完全回復する。",
                    action: (app) => {
                        app.addCardToDeck("yamaoka_surrender");
                        app.addCardToDeck("katsu_kaishu");
                        app.hp = app.maxHp;
                        app.modifyImperialGauge(-10);
                        window.soundSystem.playFanfare();
                    }
                },
                {
                    text: "一戦を交え、武士の意地を通す",
                    effectDesc: "志士『高橋泥舟』を獲得。次の戦闘の攻撃力+10、HPを 15 失う。",
                    action: (app) => {
                        app.addCardToDeck("takahashi_guard");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 10;
                        app.damagePlayer(15);
                    }
                },
                {
                    text: "町人の声を聞き、物資を分け与える",
                    effectDesc: "30両を支払い、最大HP+10。資金が足りない場合は選択不可。",
                    costGold: 30,
                    canChoose: (app) => app.gold >= 30,
                    action: (app) => {
                        app.gold -= 30;
                        app.maxHp += 10;
                        app.hp += 10;
                    }
                }
            ]
        },
        {
            id: "event_hakodate_assault",
            act: 3,
            title: "箱館総攻撃、最後の朝",
            desc: "海からの艦砲射撃が五稜郭を揺らす。残された兵力を一気に燃やすか、守りを固めて一日でも長く持ちこたえるか。",
            choices: [
                {
                    text: "甲鉄艦を迎え撃つ",
                    effectDesc: "志士『黒田清隆』を獲得。『甲鉄艦の艦砲射撃』を得るが、HPを 18 失い、列強介入+10%。",
                    action: (app) => {
                        app.addCardToDeck("kuroda_frontier");
                        app.addCardToDeck("warship_ironclad");
                        app.damagePlayer(18);
                        app.modifyImperialGauge(10);
                    }
                },
                {
                    text: "隻腕の美剣客・伊庭八郎と共に白刃の突撃を敢行する",
                    effectDesc: "志士『秋月悌次郎』を獲得。『伊庭八郎：片腕の剣客』をデッキに加え、次の戦闘の攻撃力+12、HPを 6 失う。",
                    action: (app) => {
                        app.addCardToDeck("akizuki_strategy");
                        app.addCardToDeck("iba_duel");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 12;
                        app.damagePlayer(6);
                        window.soundSystem.playFanfare();
                    }
                },
                {
                    text: "星形要塞の防壁に全力を注ぐ",
                    effectDesc: "次の戦闘で攻撃力+5、HPを 12 回復する。",
                    action: (app) => {
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                        app.healPlayer(12);
                    }
                },
                {
                    text: "降伏文書を整え、民を逃がす",
                    effectDesc: "列強介入-8%、50両を得る。",
                    action: (app) => {
                        app.modifyImperialGauge(-8);
                        app.gold += 50;
                    }
                }
            ]
        },
        {
            id: "event_yokohama_opening",
            act: 1,
            title: "横浜開港、異国船の波止場",
            desc: "開港場に異国の商人と新しい品々が集まり始めた。富と知識を取り込む好機だが、町には見慣れぬ病と不安も広がっている。",
            choices: [
                {
                    text: "交易を奨励し、国の富を増やす",
                    effectDesc: "志士『小栗忠順』を獲得。80両を得るが、列強介入+10%。",
                    action: (app) => {
                        app.addCardToDeck("oguri_reform");
                        app.gold += 80;
                        app.modifyImperialGauge(10);
                    }
                },
                {
                    text: "洋学所を開き、知識を取り入れる",
                    effectDesc: "志士『山本覚馬』を獲得。『新式ミニエ銃』をデッキに加え、列強介入+5%。",
                    action: (app) => {
                        app.addCardToDeck("yamamoto_research");
                        app.addCardToDeck("weapon_minie");
                        app.modifyImperialGauge(5);
                    }
                },
                {
                    text: "検疫を徹底し、町の暮らしを守る",
                    effectDesc: "志士『佐々木只三郎』を獲得。HPを 10 回復し、最大HP+3。",
                    action: (app) => {
                        app.addCardToDeck("sasaki_patrol");
                        app.healPlayer(10);
                        app.maxHp += 3;
                    }
                }
            ]
        },
        {
            id: "event_kiheitai_formation",
            act: 1,
            title: "奇兵隊、身分を越えた軍勢",
            desc: "農民や町人までが銃を手に取り、身分に縛られない新たな隊が結成されようとしている。古い秩序を守るか、力を借りるか。",
            choices: [
                {
                    text: "志願兵を受け入れ、隊を大きくする",
                    effectDesc: "『高杉晋作：奇兵隊の突進』をデッキに加えるが、HPを 7 失う。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("takasugi_kiheitai");
                        app.damagePlayer(7);
                    }
                },
                {
                    text: "訓練を優先し、少数精鋭を目指す",
                    effectDesc: "志士『吉田稔麿』を獲得。次の戦闘の攻撃力+7、最大HP+4。",
                    action: (app) => {
                        app.addCardToDeck("yoshida_minomaru");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 7;
                        app.maxHp += 4;
                        app.hp += 4;
                    }
                },
                {
                    text: "旧来の兵制を維持する",
                    effectDesc: "志士『大村益次郎』を獲得。列強介入-5%、35両を得る。",
                    action: (app) => {
                        app.addCardToDeck("omura_reform");
                        app.modifyImperialGauge(-5);
                        app.gold += 35;
                    }
                }
            ]
        },
        {
            id: "event_aizu_defense_council",
            act: 3,
            title: "会津若松、籠城評議",
            desc: "城下に迫る新政府軍を前に、会津の重臣たちは籠城か撤退かを議論している。民を守るには、決断を急がねばならない。",
            choices: [
                {
                    text: "城門を閉じ、鉄壁の守りを固める",
                    effectDesc: "『松平容保：会津の義気』をデッキに加え、HPを 8 回復。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("aizu_shield");
                        app.healPlayer(8);
                    }
                },
                {
                    text: "城外へ打って出て敵陣を崩す",
                    effectDesc: "『斎藤一：無外流の牙突』をデッキに加えるが、HPを 12 失う。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("saito_gato");
                        app.damagePlayer(12);
                    }
                },
                {
                    text: "民を先に避難させ、戦火を抑える",
                    effectDesc: "志士『秋月悌次郎』を獲得。40両を支払い、列強介入-10%。資金が足りない場合は選択不可。",
                    costGold: 40,
                    canChoose: (app) => app.gold >= 40,
                    action: (app) => {
                        app.addCardToDeck("akizuki_strategy");
                        app.gold -= 40;
                        app.modifyImperialGauge(-10);
                    }
                }
            ]
        },
        {
            id: "event_satsuma_reform",
            act: 2,
            title: "薩摩の軍制改革",
            desc: "西郷や大久保のもとに、新式銃の扱いを学ぶ兵たちが集まった。改革には金が要るが、旧来の誇りを捨てる覚悟も必要だ。",
            choices: [
                {
                    text: "大久保の策を採用し、制度から改める",
                    effectDesc: "『大久保利通：冷徹な謀略』をデッキに加え、列強介入-3%。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.modifyImperialGauge(-3);
                    }
                },
                {
                    text: "西郷の人望に賭け、兵の士気を高める",
                    effectDesc: "『西郷隆盛：薩摩の巨魁』をデッキに加えるが、50両を失う。",
                    faction: "tobaku",
                    costGold: 50,
                    canChoose: (app) => app.gold >= 50,
                    action: (app) => {
                        app.gold -= 50;
                        app.addCardToDeck("saigo_jigen");
                    }
                },
                {
                    text: "改革を急がず、資金を温存する",
                    effectDesc: "志士『中村半次郎』を獲得。60両を得るが、次の戦闘で攻撃力-3。",
                    action: (app) => {
                        app.addCardToDeck("nakamura_charge");
                        app.gold += 60;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) - 3;
                    }
                }
            ]
        },
        {
            id: "event_andei_purge",
            act: 1,
            title: "安政の大獄、弾圧の影",
            desc: "幕府の大規模な弾圧が始まり、志士たちは身を隠している。沈黙して難を逃れるか、仲間を救うため動くか。",
            choices: [
                {
                    text: "同志を匿い、地下組織を守る",
                    effectDesc: "志士『吉田松陰』を獲得。HPを 10 失うが、最大HP+6と次の戦闘の攻撃力+5。",
                    action: (app) => {
                        app.addCardToDeck("yoshida_teaching");
                        app.damagePlayer(10);
                        app.maxHp += 6;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                    }
                },
                {
                    text: "幕府に恭順し、情報を売る",
                    effectDesc: "志士『井伊直弼』を獲得。50両を得るが、列強介入+8%。",
                    action: (app) => {
                        app.addCardToDeck("ii_naosuke");
                        app.gold += 50;
                        app.modifyImperialGauge(8);
                    }
                },
                {
                    text: "国外への逃亡路を整える",
                    effectDesc: "志士『品川弥二郎』を獲得。30両を支払い、HPを完全回復。資金が足りない場合は選択不可。",
                    costGold: 30,
                    canChoose: (app) => app.gold >= 30,
                    action: (app) => {
                        app.addCardToDeck("shinagawa_signal");
                        app.gold -= 30;
                        app.hp = app.maxHp;
                    }
                }
            ]
        },
        {
            id: "event_namugi_incident",
            act: 1,
            title: "生麦事件、外交の火種",
            desc: "街道で起きた衝突が、薩摩と英国の緊張を一気に高めた。謝罪か強硬姿勢か、国の威信を賭けた判断を迫られる。",
            choices: [
                {
                    text: "賠償を払い、戦争を避ける",
                    effectDesc: "志士『中村半次郎』を獲得。60両を支払い、列強介入-15%。資金が足りない場合は選択不可。",
                    costGold: 60,
                    canChoose: (app) => app.gold >= 60,
                    action: (app) => {
                        app.addCardToDeck("nakamura_charge");
                        app.gold -= 60;
                        app.modifyImperialGauge(-15);
                    }
                },
                {
                    text: "藩の威信を守り、強硬に出る",
                    effectDesc: "志士『吉井友実』を獲得。次の戦闘の攻撃力+12、HPを 12 失い、列強介入+10%。",
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 12;
                        app.damagePlayer(12);
                        app.modifyImperialGauge(10);
                    }
                },
                {
                    text: "商人を通じて秘密裏に交渉する",
                    effectDesc: "志士『大久保利通』を獲得。35両を得るが、列強介入+4%。",
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.gold += 35;
                        app.modifyImperialGauge(4);
                    }
                }
            ]
        },
        {
            id: "event_restoration_council",
            act: 2,
            title: "王政復古、朝廷の決断",
            desc: "朝廷に政権を戻す大号令が発せられた。新しい国の形を急いで整えるか、旧勢力との対話を残すか。",
            choices: [
                {
                    text: "新政府の中枢をすぐに整える",
                    effectDesc: "志士『岩倉具視』を獲得。最大HP+8、次の戦闘の攻撃力+6。",
                    action: (app) => {
                        app.addCardToDeck("iwakura_imperial");
                        app.maxHp += 8;
                        app.hp += 8;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 6;
                    }
                },
                {
                    text: "旧幕臣との融和を探る",
                    effectDesc: "志士『山内容堂』を獲得。列強介入-10%、HPを 10 回復。",
                    action: (app) => {
                        app.addCardToDeck("yodo_political_balance");
                        app.modifyImperialGauge(-10);
                        app.healPlayer(10);
                    }
                },
                {
                    text: "各藩の協力を買い集める",
                    effectDesc: "志士『三条実美』を獲得。45両を支払うが、次の戦闘の攻撃力+15。資金が足りない場合は選択不可。",
                    costGold: 45,
                    canChoose: (app) => app.gold >= 45,
                    action: (app) => {
                        app.addCardToDeck("sanjo_court");
                        app.gold -= 45;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 15;
                    }
                }
            ]
        },
        {
            id: "event_aizu_war",
            act: 3,
            title: "会津戦争、白虎の決意",
            desc: "城下に砲声が響き、若い兵たちが守備についた。最後まで戦うか、命を残すため撤退するか、重い決断の時だ。",
            choices: [
                {
                    text: "城壁に立ち、最後の一戦に挑む",
                    effectDesc: "『松平容保：会津の義気』をデッキに加え、HPを 15 失う。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("aizu_shield");
                        app.damagePlayer(15);
                    }
                },
                {
                    text: "夜陰に紛れて兵を退かせる",
                    effectDesc: "志士『山本覚馬』を獲得。HPを 12 回復し、次の戦闘で攻撃力+4。",
                    action: (app) => {
                        app.addCardToDeck("yamamoto_research");
                        app.healPlayer(12);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    text: "降伏を申し入れ、城下を守る",
                    effectDesc: "志士『山川大蔵』を獲得。列強介入-7%、50両を失う。",
                    action: (app) => {
                        app.addCardToDeck("yamakawa_cavalry");
                        app.modifyImperialGauge(-7);
                        app.gold = Math.max(0, app.gold - 50);
                    }
                }
            ]
        },
        {
            id: "event_hamaguri_gate",
            act: 1,
            title: "禁門の変、御所前の激戦",
            desc: "長州軍が御所へ迫り、門前はたちまち戦場となった。撤退の道を確保するか、火線を押し返すか。",
            choices: [
                {
                    text: "御所を守り、敵陣へ突撃する",
                    effectDesc: "志士『久坂玄瑞』を獲得。次の戦闘の攻撃力+10、HPを 14 失う。",
                    action: (app) => {
                        app.addCardToDeck("kusaka_revolt");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 10;
                        app.damagePlayer(14);
                    }
                },
                {
                    text: "民衆を避難させ、延焼を防ぐ",
                    effectDesc: "志士『来島又兵衛』を獲得。HPを 10 回復し、列強介入-6%。",
                    action: (app) => {
                        app.addCardToDeck("kirishima_charge");
                        app.healPlayer(10);
                        app.modifyImperialGauge(-6);
                    }
                },
                {
                    text: "兵を退き、再起の資金を集める",
                    effectDesc: "志士『入江九一』を獲得。45両を得るが、次の戦闘の攻撃力-3。",
                    action: (app) => {
                        app.addCardToDeck("irie_secret");
                        app.gold += 45;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) - 3;
                    }
                }
            ]
        },
        {
            id: "event_tenchu_revolt",
            act: 1,
            title: "天誅組の変、山中の旗",
            desc: "大和の山中で、討幕を掲げた若者たちが決起した。大義に応じるか、無謀な蜂起を止めるか。",
            choices: [
                {
                    text: "決起に加わり、兵を率いる",
                    effectDesc: "志士『真木和泉』を獲得。『高杉晋作：奇兵隊の突進』をデッキに加え、HPを 9 失う。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("maki_revolt");
                        app.addCardToDeck("takasugi_kiheitai");
                        app.damagePlayer(9);
                    }
                },
                {
                    text: "兵站を整え、長期戦に備える",
                    effectDesc: "志士『田中光顕』を獲得。35両を支払い、最大HP+7。資金が足りない場合は選択不可。",
                    costGold: 35,
                    canChoose: (app) => app.gold >= 35,
                    action: (app) => {
                        app.addCardToDeck("tanaka_intelligence");
                        app.gold -= 35;
                        app.maxHp += 7;
                        app.hp += 7;
                    }
                },
                {
                    text: "無用な流血を避け、解散を促す",
                    effectDesc: "志士『久坂玄瑞』を獲得。列強介入-8%、HPを 8 回復する。",
                    action: (app) => {
                        app.addCardToDeck("kusaka_revolt");
                        app.modifyImperialGauge(-8);
                        app.healPlayer(8);
                    }
                }
            ]
        },
        {
            id: "event_shinsengumi_formation",
            act: 1,
            title: "新選組結成、京の守護",
            desc: "京都の治安を守るため、浪士たちが一つの旗の下に集まった。厳しい規律か、仲間を信じる柔軟さか。",
            choices: [
                {
                    text: "局中法度を掲げ、隊を鍛える",
                    effectDesc: "志士『土方歳三』を獲得。『新選組：局中法度』をデッキに加え、次の戦闘の攻撃力+4。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("hijikata_fukucho");
                        app.addCardToDeck("kyokuchu_hatto");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    text: "志願者を広く募り、隊を拡大する",
                    effectDesc: "『永倉新八：二番隊の剛剣』をデッキに加え、50両を得る。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("nagakura_bushin");
                        app.gold += 50;
                    }
                },
                {
                    text: "町との協力を優先する",
                    effectDesc: "志士『山南敬助』を獲得。HPを 12 回復し、列強介入-4%。",
                    action: (app) => {
                        app.addCardToDeck("sannan_tactics");
                        app.healPlayer(12);
                        app.modifyImperialGauge(-4);
                    }
                }
            ]
        },
        {
            id: "event_satsuma_residence",
            act: 2,
            title: "江戸薩摩藩邸焼討、決裂の夜",
            desc: "薩摩藩邸に集まった浪士たちをめぐり、幕府側との緊張が限界に達した。報復か、交渉か、夜明け前の決断を迫られる。",
            choices: [
                {
                    text: "藩邸を守り、反撃の狼煙を上げる",
                    effectDesc: "志士『中村半次郎』を獲得。HPを 13 失うが、次の戦闘の攻撃力+12。",
                    action: (app) => {
                        app.addCardToDeck("nakamura_charge");
                        app.damagePlayer(13);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 12;
                    }
                },
                {
                    text: "捕虜を交換し、戦火を広げない",
                    effectDesc: "志士『吉井友実』を獲得。列強介入-9%、40両を得る。",
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.modifyImperialGauge(-9);
                        app.gold += 40;
                    }
                },
                {
                    text: "新式火器を密かに運び出す",
                    effectDesc: "志士『佐々木只三郎』を獲得。『新式ミニエ銃』をデッキに加えるが、列強介入+6%。",
                    action: (app) => {
                        app.addCardToDeck("sasaki_patrol");
                        app.addCardToDeck("weapon_minie");
                        app.modifyImperialGauge(6);
                    }
                }
            ]
        },
        {
            id: "event_harris_treaty",
            act: 1,
            title: "日米修好通商条約、開国の署名",
            desc: "港を開き、異国との交易を認める条約が差し出された。国力を蓄える好機か、主権を削る危険な一歩か。",
            choices: [
                {
                    text: "条約を結び、交易の利益を得る",
                    effectDesc: "志士『井伊直弼』を獲得。90両を得るが、列強介入+14%。",
                    action: (app) => {
                        app.addCardToDeck("ii_naosuke");
                        app.gold += 90;
                        app.modifyImperialGauge(14);
                    }
                },
                {
                    text: "修正を求め、時間を稼ぐ",
                    effectDesc: "志士『阿部正外』を獲得。列強介入-5%、HPを 6 回復する。",
                    action: (app) => {
                        app.addCardToDeck("abe_masato_policy");
                        app.modifyImperialGauge(-5);
                        app.healPlayer(6);
                    }
                },
                {
                    text: "攘夷を掲げ、条約を拒絶する",
                    effectDesc: "志士『松平春嶽』を獲得。次の戦闘の攻撃力+9、50両を失う。",
                    action: (app) => {
                        app.addCardToDeck("shungaku_council");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 9;
                        app.gold = Math.max(0, app.gold - 50);
                    }
                }
            ]
        },
        {
            id: "event_satsuma_british_war",
            act: 1,
            title: "薩英戦争、砲火の教訓",
            desc: "鹿児島湾に英国艦隊が現れ、砲声が城下を揺るがした。力で抗うか、敗北から新しい軍制を学ぶか。",
            choices: [
                {
                    text: "砲台を守り、最後まで撃ち返す",
                    effectDesc: "志士『川村純義』を獲得。HPを 16 失うが、次の戦闘の攻撃力+14。",
                    action: (app) => {
                        app.addCardToDeck("kawamura_navy");
                        app.damagePlayer(16);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 14;
                    }
                },
                {
                    text: "敗北を認め、洋式兵器を研究する",
                    effectDesc: "志士『黒田了介』を獲得。『アームストロング砲』をデッキに加えるが、列強介入+8%。",
                    action: (app) => {
                        app.addCardToDeck("kuroda_defense");
                        app.addCardToDeck("weapon_armstrong");
                        app.modifyImperialGauge(8);
                    }
                },
                {
                    text: "講和して、交易路を確保する",
                    effectDesc: "志士『大久保利通』を獲得。70両を得るが、列強介入+5%。",
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.gold += 70;
                        app.modifyImperialGauge(5);
                    }
                }
            ]
        },
        {
            id: "event_choshu_expedition",
            act: 1,
            title: "第一次長州征討、進軍の命",
            desc: "幕府は長州へ大軍を送り、諸藩にも出兵を命じた。正面から戦うか、裏で停戦の道を探るか。",
            choices: [
                {
                    text: "総軍を率い、正面から攻め込む",
                    effectDesc: "志士『西郷隆盛』を獲得。HPを 12 失うが、80両と次の戦闘の攻撃力+8を得る。",
                    action: (app) => {
                        app.addCardToDeck("saigo_jigen");
                        app.damagePlayer(12);
                        app.gold += 80;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 8;
                    }
                },
                {
                    text: "停戦交渉を進め、消耗を抑える",
                    effectDesc: "志士『吉井友実』を獲得。列強介入-8%、HPを 8 回復する。",
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.modifyImperialGauge(-8);
                        app.healPlayer(8);
                    }
                },
                {
                    text: "密かに長州へ武器を流す",
                    effectDesc: "志士『桂小五郎』を獲得。『新式ミニエ銃』をデッキに加え、列強介入+7%。",
                    action: (app) => {
                        app.addCardToDeck("katsura_shindo");
                        app.addCardToDeck("weapon_minie");
                        app.modifyImperialGauge(7);
                    }
                }
            ]
        },
        {
            id: "event_boshin_war",
            act: 2,
            title: "戊辰戦争、時代の分水嶺",
            desc: "錦旗を掲げた軍勢と旧幕府軍が各地で衝突した。新時代へ進むか、旧き秩序を守るか、国の形が決まろうとしている。",
            choices: [
                {
                    text: "新政府軍として進軍する",
                    effectDesc: "志士『山田顕義』を獲得。次の戦闘の攻撃力+15、HPを 10 失う。",
                    action: (app) => {
                        app.addCardToDeck("yamada_modern_army");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 15;
                        app.damagePlayer(10);
                    }
                },
                {
                    text: "旧幕府軍の防衛線を支える",
                    effectDesc: "志士『原市之進』を獲得。最大HP+10、HPを 5 回復する。",
                    action: (app) => {
                        app.addCardToDeck("hara_counsel");
                        app.maxHp += 10;
                        app.healPlayer(5);
                    }
                },
                {
                    text: "戦火を避け、民間の避難を優先する",
                    effectDesc: "志士『横井小楠』を獲得。列強介入-12%、40両を得る。",
                    action: (app) => {
                        app.addCardToDeck("yokoi_philosophy");
                        app.modifyImperialGauge(-12);
                        app.gold += 40;
                    }
                }
            ]
        },
        {
            id: "event_uraga_arrival",
            act: 1,
            title: "浦賀沖、黒船来航",
            desc: "蒸気船の巨体が浦賀沖に現れ、町は大騒ぎとなった。国を閉ざすか、異国の技術を学ぶか、幕府は決断を迫られる。",
            choices: [
                {
                    text: "砲台を築き、海防を強化する",
                    effectDesc: "志士『阿部正弘』を獲得。『松平容保：会津の義気』をデッキに加え、最大HP+5。",
                    action: (app) => {
                        app.addCardToDeck("abe_defense");
                        app.addCardToDeck("aizu_shield");
                        app.maxHp += 5;
                        app.hp += 5;
                    }
                },
                {
                    text: "使節を迎え、技術を調査する",
                    effectDesc: "志士『佐久間象山』を獲得。『新式ミニエ銃』をデッキに加えるが、列強介入+8%。",
                    action: (app) => {
                        app.addCardToDeck("sakuma_gunnery");
                        app.addCardToDeck("weapon_minie");
                        app.modifyImperialGauge(8);
                    }
                },
                {
                    text: "返書を渡し、開戦を避ける",
                    effectDesc: "志士『吉田松陰』を獲得。列強介入-6%、40両を得る。",
                    action: (app) => {
                        app.addCardToDeck("yoshida_teaching");
                        app.modifyImperialGauge(-6);
                        app.gold += 40;
                    }
                }
            ]
        },
        {
            id: "event_manen_embassy",
            act: 1,
            title: "万延遣米使節、海の彼方へ",
            desc: "条約批准書を携えた使節団が、太平洋を越えて米国へ向かう。異国の制度を学ぶ旅には、危険と大きな成果が待っている。",
            choices: [
                {
                    text: "使節を送り、制度を学ぶ",
                    effectDesc: "志士『勝海舟』を獲得。列強介入-8%、最大HP+6。",
                    action: (app) => {
                        app.addCardToDeck("katsu_kaishu");
                        app.modifyImperialGauge(-8);
                        app.maxHp += 6;
                        app.hp += 6;
                    }
                },
                {
                    text: "航海の資金を武器に回す",
                    effectDesc: "志士『木村芥舟』を獲得。75両を得るが、列強介入+6%。",
                    action: (app) => {
                        app.addCardToDeck("kimura_navy");
                        app.gold += 75;
                        app.modifyImperialGauge(6);
                    }
                },
                {
                    text: "国内の改革を優先する",
                    effectDesc: "志士『伊藤博文』を獲得。次の戦闘の攻撃力+8、HPを 5 回復する。",
                    action: (app) => {
                        app.addCardToDeck("ito_diplomat");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 8;
                        app.healPlayer(5);
                    }
                }
            ]
        },
        {
            id: "event_seven_nobles_exile",
            act: 1,
            title: "七卿落ち、雨中の逃避行",
            desc: "政変によって都を追われた公卿たちが、長州を目指して夜道を進む。追手を振り切り、次の策を立てなければならない。",
            choices: [
                {
                    text: "護衛を引き受け、道を切り開く",
                    effectDesc: "志士『三条実美』を獲得。HPを 11 失うが、次の戦闘の攻撃力+11。",
                    action: (app) => {
                        app.addCardToDeck("sanjo_court");
                        app.damagePlayer(11);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 11;
                    }
                },
                {
                    text: "資金を渡し、別の逃走路を用意する",
                    effectDesc: "志士『品川弥二郎』を獲得。40両を支払い、列強介入-9%。資金が足りない場合は選択不可。",
                    costGold: 40,
                    canChoose: (app) => app.gold >= 40,
                    action: (app) => {
                        app.addCardToDeck("shinagawa_signal");
                        app.gold -= 40;
                        app.modifyImperialGauge(-9);
                    }
                },
                {
                    text: "追手へ偽情報を流す",
                    effectDesc: "志士『田中光顕』を獲得。30両とHP 6を得る。",
                    action: (app) => {
                        app.addCardToDeck("tanaka_intelligence");
                        app.gold += 30;
                        app.healPlayer(6);
                    }
                }
            ]
        },
        {
            id: "event_europe_mission",
            act: 3,
            title: "岩倉使節団、世界視察",
            desc: "新政府は欧米諸国へ使節を送り、近代国家の仕組みを学ぼうとしている。国の未来への投資か、目の前の戦力か。",
            choices: [
                {
                    text: "視察団を送り、国づくりを学ぶ",
                    effectDesc: "志士『岩倉具視』を獲得。列強介入-10%、次の戦闘の攻撃力+5。",
                    action: (app) => {
                        app.addCardToDeck("iwakura_imperial");
                        app.modifyImperialGauge(-10);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                    }
                },
                {
                    text: "視察費を軍備に回す",
                    effectDesc: "志士『木戸孝允』を獲得。『アームストロング砲』をデッキに加えるが、列強介入+10%。",
                    action: (app) => {
                        app.addCardToDeck("kido_reform");
                        app.addCardToDeck("weapon_armstrong");
                        app.modifyImperialGauge(10);
                    }
                },
                {
                    text: "民の暮らしを優先して施しを行う",
                    effectDesc: "志士『伊藤博文』を獲得。60両を支払い、最大HP+12。資金が足りない場合は選択不可。",
                    costGold: 60,
                    canChoose: (app) => app.gold >= 60,
                    action: (app) => {
                        app.addCardToDeck("ito_diplomat");
                        app.gold -= 60;
                        app.maxHp += 12;
                        app.hp += 12;
                    }
                }
            ]
        },
        {
            id: "event_nagasaki_naval_school",
            act: 1,
            title: "長崎海軍伝習所、蒸気の学び",
            desc: "長崎に集まった若き志士たちが、航海術と砲術を学び始めた。古い身分にこだわるか、実力ある人材を育てるか。",
            choices: [
                {
                    text: "広く門戸を開き、伝習を進める",
                    effectDesc: "志士『勝海舟』を獲得。最大HP+8、次の戦闘の攻撃力+5。",
                    action: (app) => {
                        app.addCardToDeck("katsu_kaishu");
                        app.maxHp += 8;
                        app.hp += 8;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                    }
                },
                {
                    text: "海防費を増やし、艦砲を整える",
                    effectDesc: "志士『榎本武揚』を獲得。『甲鉄艦の艦砲射撃』をデッキに加えるが、列強介入+10%。",
                    action: (app) => {
                        app.addCardToDeck("enomoto_naval");
                        app.addCardToDeck("warship_ironclad");
                        app.modifyImperialGauge(10);
                    }
                },
                {
                    text: "諸藩へ知識を持ち帰る",
                    effectDesc: "志士『佐久間象山』を獲得。40両を得て、列強介入-5%。",
                    action: (app) => {
                        app.addCardToDeck("sakuma_gunnery");
                        app.gold += 40;
                        app.modifyImperialGauge(-5);
                    }
                }
            ]
        },
        {
            id: "event_kobe_training",
            act: 1,
            title: "神戸海軍操練所、海援隊の夢",
            desc: "勝海舟の構想のもと、身分を越えた若者たちが海軍術を学ぶ。幕府の枠内に留めるか、新しい航路へ出るか。",
            choices: [
                {
                    text: "航海術を磨き、海援隊を支える",
                    effectDesc: "『坂本龍馬：海援隊の采配』をデッキに加え、50両を得る。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("ryoma_kaiwentai");
                        app.gold += 50;
                    }
                },
                {
                    text: "【討幕派】勝海舟の開国論に共鳴し、その大局観を乞う",
                    faction: "tobaku",
                    effectDesc: "『勝海舟：無血の大局観』をデッキに加え、列強介入-6%。",
                    action: (app) => {
                        app.addCardToDeck("katsu_kaishu");
                        app.modifyImperialGauge(-6);
                        window.soundSystem.playFanfare();
                    }
                },
                {
                    text: "幕府の許可を得て慎重に進める",
                    effectDesc: "志士『中岡慎太郎』を獲得。列強介入-6%、HPを 8 回復する。",
                    action: (app) => {
                        app.addCardToDeck("nakaoka_mediator");
                        app.modifyImperialGauge(-6);
                        app.healPlayer(8);
                    }
                },
                {
                    text: "密かに海外交易を始める",
                    effectDesc: "80両を得るが、列強介入+12%。",
                    action: (app) => {
                        app.gold += 80;
                        app.modifyImperialGauge(12);
                    }
                }
            ]
        },
        {
            id: "event_charter_oath",
            act: 2,
            title: "五箇条の御誓文、新政の誓い",
            desc: "新政府の基本方針を示す誓文が掲げられた。広く議論を集めるか、強い指導力で改革を急ぐか。",
            choices: [
                {
                    text: "万機公論に決し、仲間の声を集める",
                    effectDesc: "志士『福岡孝弟』を獲得。最大HP+5、HPを 5 回復する。",
                    action: (app) => {
                        app.addCardToDeck("fukuoka_drafting");
                        app.maxHp += 5;
                        app.hp += 5;
                    }
                },
                {
                    text: "改革を急ぎ、中央の力を強める",
                    effectDesc: "志士『木戸孝允』を獲得。次の戦闘の攻撃力+12、列強介入+5%。",
                    action: (app) => {
                        app.addCardToDeck("kido_reform");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 12;
                        app.modifyImperialGauge(5);
                    }
                },
                {
                    text: "諸外国へ新政府の方針を示す",
                    effectDesc: "志士『大隈重信』を獲得。列強介入-10%、60両を得る。",
                    action: (app) => {
                        app.addCardToDeck("okuma_modernization");
                        app.modifyImperialGauge(-10);
                        app.gold += 60;
                    }
                }
            ]
        },
        {
            id: "event_han_reform",
            act: 3,
            title: "廃藩置県、藩を越える国",
            desc: "各地の藩を廃し、中央政府のもとに新しい行政区を置く改革が始まった。抵抗を抑え、国を一つにまとめる必要がある。",
            choices: [
                {
                    text: "改革を断行し、国の仕組みを統一する",
                    effectDesc: "志士『木戸孝允』を獲得。最大HP+10、次の戦闘の攻撃力+7。",
                    action: (app) => {
                        app.addCardToDeck("kido_reform");
                        app.maxHp += 10;
                        app.hp += 10;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 7;
                    }
                },
                {
                    text: "旧藩主と交渉し、穏便に進める",
                    effectDesc: "志士『西郷隆盛』を獲得。列強介入-8%、HPを 10 回復する。",
                    action: (app) => {
                        app.addCardToDeck("saigo_jigen");
                        app.modifyImperialGauge(-8);
                        app.healPlayer(10);
                    }
                },
                {
                    text: "各地の兵を政府軍へ編入する",
                    effectDesc: "志士『大久保利通』を獲得。『新式ミニエ銃』をデッキに加え、40両を得る。",
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.addCardToDeck("weapon_minie");
                        app.gold += 40;
                    }
                }
            ]
        },
        {
            id: "event_ii_successor",
            act: 1,
            title: "桜田門外後、揺れる幕府",
            desc: "大老を失った幕府では、次の政権をめぐる議論が割れている。公武合体か、強権的な統制か、政局の針路を選ぶ時だ。",
            choices: [
                {
                    text: "諸藩と協議し、公武合体を進める",
                    effectDesc: "志士『阿部正外』を獲得。列強介入-7%、HPを 8 回復する。",
                    action: (app) => {
                        app.addCardToDeck("abe_masato_policy");
                        app.modifyImperialGauge(-7);
                        app.healPlayer(8);
                    }
                },
                {
                    text: "幕府の権威を優先し、統制を強める",
                    effectDesc: "志士『松平春嶽』を獲得。次の戦闘の攻撃力+10、HPを 8 失う。",
                    action: (app) => {
                        app.addCardToDeck("shungaku_council");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 10;
                        app.damagePlayer(8);
                    }
                },
                {
                    text: "商人と結び、政局を支える資金を得る",
                    effectDesc: "志士『原市之進』を獲得。70両を得るが、列強介入+5%。",
                    action: (app) => {
                        app.addCardToDeck("hara_counsel");
                        app.gold += 70;
                        app.modifyImperialGauge(5);
                    }
                }
            ]
        },
        {
            id: "event_satcho_protocol",
            act: 2,
            title: "薩長盟約、倒幕の密議",
            desc: "薩摩と長州の代表が、互いの疑念を越えて密かに手を結ぼうとしている。連携を急ぐか、兵力を蓄えるか。",
            choices: [
                {
                    text: "盟約を結び、共同作戦を整える",
                    effectDesc: "志士『桂小五郎』を獲得。『薩長同盟の密約』をデッキに加え、次の戦闘の攻撃力+6。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("katsura_shindo");
                        app.addCardToDeck("satcho_secret");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 6;
                    }
                },
                {
                    text: "同盟を見送り、兵糧を蓄える",
                    effectDesc: "志士『西郷隆盛』を獲得。50両を得て、HPを 5 回復する。",
                    action: (app) => {
                        app.addCardToDeck("saigo_jigen");
                        app.gold += 50;
                        app.healPlayer(5);
                    }
                },
                {
                    text: "列強に援助を求める",
                    effectDesc: "志士『広沢真臣』を獲得。『新式ミニエ銃』をデッキに加えるが、列強介入+9%。",
                    action: (app) => {
                        app.addCardToDeck("hirosawa_alliance");
                        app.addCardToDeck("weapon_minie");
                        app.modifyImperialGauge(9);
                    }
                }
            ]
        },
        {
            id: "event_edo_opening",
            act: 2,
            title: "江戸開城前夜、最後の評議",
            desc: "江戸の町を戦火に巻き込むか、城を明け渡して人々を救うか。夜更けの評議で、最後の決断が迫られている。",
            choices: [
                {
                    text: "無血開城を受け入れる",
                    effectDesc: "志士『小栗忠順』を獲得。HPを完全回復し、列強介入-10%。",
                    action: (app) => {
                        app.addCardToDeck("oguri_reform");
                        app.hp = app.maxHp;
                        app.modifyImperialGauge(-10);
                    }
                },
                {
                    text: "城を守り、最後の抵抗を示す",
                    effectDesc: "志士『永井尚志』を獲得。次の戦闘の攻撃力+14、HPを 14 失う。",
                    action: (app) => {
                        app.addCardToDeck("nagai_retreat");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 14;
                        app.damagePlayer(14);
                    }
                },
                {
                    text: "民衆の避難に資金を使う",
                    effectDesc: "志士『高橋泥舟』を獲得。45両を支払い、最大HP+8。資金が足りない場合は選択不可。",
                    costGold: 45,
                    canChoose: (app) => app.gold >= 45,
                    action: (app) => {
                        app.addCardToDeck("takahashi_guard");
                        app.gold -= 45;
                        app.maxHp += 8;
                        app.hp += 8;
                    }
                }
            ]
        },
        {
            id: "event_hokkaido_development",
            act: 3,
            title: "北海道開拓、北の新天地",
            desc: "戦乱の後、北の大地を開き新しい国力を築く計画が持ち上がった。軍備・交易・民の暮らし、どこへ投資するか。",
            choices: [
                {
                    text: "屯田兵を置き、北辺を守る",
                    effectDesc: "『山県有朋：進撃の号令』をデッキに加え、最大HP+5。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("yamagata_march");
                        app.maxHp += 5;
                        app.hp += 5;
                    }
                },
                {
                    text: "港を整備し、交易を盛んにする",
                    effectDesc: "志士『黒田清隆』を獲得。80両を得るが、列強介入+8%。",
                    action: (app) => {
                        app.addCardToDeck("kuroda_frontier");
                        app.gold += 80;
                        app.modifyImperialGauge(8);
                    }
                },
                {
                    text: "開拓民の住まいを優先する",
                    effectDesc: "志士『榎本武揚』を獲得。HPを 12 回復し、列強介入-5%。",
                    action: (app) => {
                        app.addCardToDeck("enomoto_naval");
                        app.healPlayer(12);
                        app.modifyImperialGauge(-5);
                    }
                }
            ]
        },
        {
            id: "event_teradaya_conflict",
            act: 1,
            title: "寺田屋騒動、同士討ちの夜",
            desc: "寺田屋に集まった志士たちの意見が割れ、刀を抜く者まで現れた。仲間をまとめるか、決起を急ぐか。",
            choices: [
                {
                    text: "説得を続け、同士討ちを止める",
                    effectDesc: "志士『有馬新七』を獲得。HPを 10 回復し、列強介入-5%。",
                    action: (app) => {
                        app.addCardToDeck("arima_revolt");
                        app.healPlayer(10);
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    text: "決起を急ぎ、敵の不意を突く",
                    effectDesc: "志士『吉井友実』を獲得。次の戦闘の攻撃力+13、HPを 10 失う。",
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 13;
                        app.damagePlayer(10);
                    }
                },
                {
                    text: "資金を分けて仲間を逃がす",
                    effectDesc: "志士『田中新兵衛』を獲得。35両を支払い、最大HP+6。資金が足りない場合は選択不可。",
                    costGold: 35,
                    canChoose: (app) => app.gold >= 35,
                    action: (app) => {
                        app.addCardToDeck("tanaka_assassin");
                        app.gold -= 35;
                        app.maxHp += 6;
                        app.hp += 6;
                    }
                }
            ]
        },
        {
            id: "event_nagasaki_magistrate",
            act: 1,
            title: "長崎奉行所、異国との窓口",
            desc: "長崎奉行所に異国船の報告と交易の要求が届いた。情報を集めて備えるか、港を閉じて緊張を高めるか。",
            choices: [
                {
                    text: "通詞から異国の情報を集める",
                    effectDesc: "志士『木村芥舟』を獲得。『新式ミニエ銃』をデッキに加えるが、列強介入+6%。",
                    action: (app) => {
                        app.addCardToDeck("kimura_navy");
                        app.addCardToDeck("weapon_minie");
                        app.modifyImperialGauge(6);
                    }
                },
                {
                    text: "港の警備を固め、海防を優先する",
                    effectDesc: "志士『永井尚志』を獲得。最大HP+8、次の戦闘の攻撃力+4。",
                    action: (app) => {
                        app.addCardToDeck("nagai_retreat");
                        app.maxHp += 8;
                        app.hp += 8;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 4;
                    }
                },
                {
                    text: "交易を許可し、財源を確保する",
                    effectDesc: "志士『武市半平太』を獲得。75両を得るが、列強介入+10%。",
                    action: (app) => {
                        app.addCardToDeck("takechi_ideology");
                        app.gold += 75;
                        app.modifyImperialGauge(10);
                    }
                }
            ]
        },
        {
            id: "event_hanseki_hokan",
            act: 3,
            title: "版籍奉還、藩主たちの決断",
            desc: "諸藩の土地と人民を朝廷へ返す構想が示された。新しい統一国家を急ぐか、各地の事情に配慮するか。",
            choices: [
                {
                    text: "奉還を進め、中央の制度を整える",
                    effectDesc: "志士『木戸孝允』を獲得。最大HP+9、列強介入-6%。",
                    action: (app) => {
                        app.addCardToDeck("kido_reform");
                        app.maxHp += 9;
                        app.hp += 9;
                        app.modifyImperialGauge(-6);
                    }
                },
                {
                    text: "藩主との協議を重ね、摩擦を抑える",
                    effectDesc: "志士『大久保利通』を獲得。40両を得て、HPを 8 回復する。",
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.gold += 40;
                        app.healPlayer(8);
                    }
                },
                {
                    text: "軍制を統一し、政府軍を強化する",
                    effectDesc: "志士『山内容堂』を獲得。『アームストロング砲』をデッキに加えるが、列強介入+7%。",
                    action: (app) => {
                        app.addCardToDeck("yodo_political_balance");
                        app.addCardToDeck("weapon_armstrong");
                        app.modifyImperialGauge(7);
                    }
                }
            ]
        },
        {
            id: "event_seikanron_debate",
            act: 3,
            title: "征韓論政変、割れる新政府",
            desc: "海外派兵をめぐって新政府の重鎮たちが激しく対立した。武力で威信を示すか、国内の改革を優先するか。",
            choices: [
                {
                    text: "派兵を支持し、軍の力を示す",
                    effectDesc: "志士『江藤新平』を獲得。次の戦闘の攻撃力+16、HPを 12 失う。",
                    action: (app) => {
                        app.addCardToDeck("eto_reform");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 16;
                        app.damagePlayer(12);
                    }
                },
                {
                    text: "内政を優先し、国力を蓄える",
                    effectDesc: "志士『大久保利通』を獲得。列強介入-10%、最大HP+7。",
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.modifyImperialGauge(-10);
                        app.maxHp += 7;
                        app.hp += 7;
                    }
                },
                {
                    text: "双方を調停し、政権の結束を守る",
                    effectDesc: "志士『副島種臣』を獲得。50両を支払い、HPを完全回復。資金が足りない場合は選択不可。",
                    costGold: 50,
                    canChoose: (app) => app.gold >= 50,
                    action: (app) => {
                        app.addCardToDeck("soejima_diplomacy");
                        app.gold -= 50;
                        app.hp = app.maxHp;
                    }
                }
            ]
        },
        {
            id: "event_satsuma_trade",
            act: 1,
            title: "薩摩藩の密貿易、黒糖の財源",
            desc: "南国の産物を密かに運び、洋式武器を買う資金にする計画が持ち上がった。国力を増す一手か、危険な交易か。",
            choices: [
                {
                    text: "交易を進め、洋式兵器を買い付ける",
                    effectDesc: "志士『小松帯刀』を獲得。『新式ミニエ銃』をデッキに加えるが、列強介入+9%。",
                    action: (app) => {
                        app.addCardToDeck("komatsu_coordination");
                        app.addCardToDeck("weapon_minie");
                        app.modifyImperialGauge(9);
                    }
                },
                {
                    text: "国内産業を育て、時間をかける",
                    effectDesc: "志士『吉井友実』を獲得。60両を得て、最大HP+5。",
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.gold += 60;
                        app.maxHp += 5;
                        app.hp += 5;
                    }
                },
                {
                    text: "密約を破棄し、主権を守る",
                    effectDesc: "志士『伊地知正治』を獲得。列強介入-10%、HPを 6 回復する。",
                    action: (app) => {
                        app.addCardToDeck("ijichi_command");
                        app.modifyImperialGauge(-10);
                        app.healPlayer(6);
                    }
                }
            ]
        },
        {
            id: "event_yokoi_reform",
            act: 2,
            title: "横井小楠、国是の建白",
            desc: "実学を重んじる改革案が評議の場に提出された。諸藩の利害を越えて、国全体の仕組みを作れるか。",
            choices: [
                {
                    text: "実学を採用し、制度を改める",
                    effectDesc: "『横井小楠：実学の構想』をデッキに加え、最大HP+6。",
                    faction: "tobaku",
                    action: (app) => {
                        app.addCardToDeck("yokoi_philosophy");
                        app.maxHp += 6;
                        app.hp += 6;
                    }
                },
                {
                    text: "各地の事情を優先し、改革を急がない",
                    effectDesc: "志士『松平春嶽』を獲得。HPを 10 回復し、列強介入-5%。",
                    action: (app) => {
                        app.addCardToDeck("shungaku_council");
                        app.healPlayer(10);
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    text: "改革案を軍備に転用する",
                    effectDesc: "志士『坂本龍馬』を獲得。次の戦闘の攻撃力+11、35両を得る。",
                    action: (app) => {
                        app.addCardToDeck("ryoma_kaiwentai");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 11;
                        app.gold += 35;
                    }
                }
            ]
        },
        {
            id: "event_byakkotai_sortie",
            act: 3,
            title: "白虎隊、飯盛山の出陣",
            desc: "若い兵たちが城下を守るために出陣する。彼らを前線へ送るか、守備に残して町を支えるか。",
            choices: [
                {
                    text: "若き兵を前線へ送り出す",
                    effectDesc: "『松平容保：会津の義気』をデッキに加えるが、HPを 13 失う。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("aizu_shield");
                        app.damagePlayer(13);
                    }
                },
                {
                    text: "城下の守備を固める",
                    effectDesc: "志士『山川大蔵』を獲得。最大HP+9、次の戦闘の攻撃力+5。",
                    action: (app) => {
                        app.addCardToDeck("yamakawa_cavalry");
                        app.maxHp += 9;
                        app.hp += 9;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                    }
                },
                {
                    text: "民を避難させ、被害を抑える",
                    effectDesc: "志士『佐川官兵衛』を獲得。列強介入-8%、40両を支払う。",
                    costGold: 40,
                    canChoose: (app) => app.gold >= 40,
                    action: (app) => {
                        app.addCardToDeck("sagawa_cavalry");
                        app.gold -= 40;
                        app.modifyImperialGauge(-8);
                    }
                }
            ]
        },
        {
            id: "event_hakodate_government",
            act: 3,
            title: "箱館政権、北辺の評議",
            desc: "五稜郭に集まった旧幕府軍が、新しい政権の形を議論している。海軍を頼るか、陸の守りを固めるか。",
            choices: [
                {
                    text: "海軍を整え、海上補給を確保する",
                    effectDesc: "志士『榎本武揚』を獲得。『甲鉄艦の艦砲射撃』をデッキに加えるが、列強介入+10%。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("enomoto_naval");
                        app.addCardToDeck("warship_ironclad");
                        app.modifyImperialGauge(10);
                    }
                },
                {
                    text: "法と議会を整え、民心を集める",
                    effectDesc: "志士『大鳥圭介』を獲得。最大HP+8、列強介入-6%。",
                    action: (app) => {
                        app.addCardToDeck("otori_strategy");
                        app.maxHp += 8;
                        app.hp += 8;
                        app.modifyImperialGauge(-6);
                    }
                },
                {
                    text: "最後の決戦に備え、兵糧を買う",
                    effectDesc: "志士『立見尚文』を獲得。70両を支払うが、次の戦闘の攻撃力+18。資金が足りない場合は選択不可。",
                    costGold: 70,
                    canChoose: (app) => app.gold >= 70,
                    action: (app) => {
                        app.addCardToDeck("tatsumi_naobumi");
                        app.gold -= 70;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 18;
                    }
                }
            ]
        },
        {
            id: "event_tenpo_reform",
            act: 1,
            title: "天保の改革、倹約の号令",
            desc: "幕府が倹約と統制を掲げ、改革の号令を発した。厳しい規律で国を立て直すか、商いの力を活かすか。",
            choices: [
                {
                    text: "倹約を徹底し、国庫を立て直す",
                    effectDesc: "志士『松平春嶽』を獲得。50両を得て、列強介入-5%。",
                    action: (app) => {
                        app.addCardToDeck("shungaku_council");
                        app.gold += 50;
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    text: "商人の力を借り、産業を育てる",
                    effectDesc: "志士『横井小楠』を獲得。最大HP+7、60両を得るが、列強介入+5%。",
                    action: (app) => {
                        app.addCardToDeck("yokoi_philosophy");
                        app.maxHp += 7;
                        app.hp += 7;
                        app.gold += 60;
                        app.modifyImperialGauge(5);
                    }
                },
                {
                    text: "民の負担を減らし、反発を抑える",
                    effectDesc: "志士『阿部正弘』を獲得。HPを 12 回復するが、30両を失う。",
                    action: (app) => {
                        app.addCardToDeck("abe_defense");
                        app.healPlayer(12);
                        app.gold = Math.max(0, app.gold - 30);
                    }
                }
            ]
        },
        {
            id: "event_foreign_ship_edict",
            act: 1,
            title: "異国船打払令、海防の決断",
            desc: "異国船を追い払う命令が出され、沿岸の緊張が高まった。強硬策か、情報収集か、海防の方針を選ぶ。",
            choices: [
                {
                    text: "砲台を増設し、打払令を実行する",
                    effectDesc: "志士『阿部正弘』を獲得。次の戦闘の攻撃力+12、HPを 8 失う。",
                    action: (app) => {
                        app.addCardToDeck("abe_defense");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 12;
                        app.damagePlayer(8);
                    }
                },
                {
                    text: "異国船を観察し、技術を学ぶ",
                    effectDesc: "志士『佐久間象山』を獲得。『新式ミニエ銃』をデッキに加えるが、列強介入+8%。",
                    action: (app) => {
                        app.addCardToDeck("sakuma_gunnery");
                        app.addCardToDeck("weapon_minie");
                        app.modifyImperialGauge(8);
                    }
                },
                {
                    text: "通商の窓口を残し、衝突を避ける",
                    effectDesc: "志士『吉田松陰』を獲得。列強介入-9%、40両を得る。",
                    action: (app) => {
                        app.addCardToDeck("yoshida_teaching");
                        app.modifyImperialGauge(-9);
                        app.gold += 40;
                    }
                }
            ]
        },
        {
            id: "event_satsuma_after_teradaya",
            act: 1,
            title: "寺田屋騒動後、薩摩の粛清",
            desc: "藩内の急進派を抑えるため、薩摩では厳しい処分が検討されている。秩序を守るか、志士をかばうか。",
            choices: [
                {
                    text: "藩の命に従い、統制を強める",
                    effectDesc: "志士『大久保利通』を獲得。列強介入-6%、最大HP+5。",
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.modifyImperialGauge(-6);
                        app.maxHp += 5;
                        app.hp += 5;
                    }
                },
                {
                    text: "志士を逃がし、再起の道を残す",
                    effectDesc: "志士『西郷隆盛』を獲得。次の戦闘の攻撃力+13、HPを 10 失う。",
                    action: (app) => {
                        app.addCardToDeck("saigo_jigen");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 13;
                        app.damagePlayer(10);
                    }
                },
                {
                    text: "両者を説得し、処分を延期する",
                    effectDesc: "志士『有馬新七』を獲得。35両を支払い、HPを 10 回復する。資金が足りない場合は選択不可。",
                    costGold: 35,
                    canChoose: (app) => app.gold >= 35,
                    action: (app) => {
                        app.addCardToDeck("arima_revolt");
                        app.gold -= 35;
                        app.healPlayer(10);
                    }
                }
            ]
        },
        {
            id: "event_tokyo_capital",
            act: 3,
            title: "東京遷都、新しい都の建設",
            desc: "新政府は都を東へ移し、国の中心を作り直そうとしている。政治の集中か、各地との均衡か。",
            choices: [
                {
                    text: "新都へ政務を集め、改革を急ぐ",
                    effectDesc: "志士『大久保利通』を獲得。最大HP+10、次の戦闘の攻撃力+8。",
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.maxHp += 10;
                        app.hp += 10;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 8;
                    }
                },
                {
                    text: "旧都との協調を保ち、文化を守る",
                    effectDesc: "志士『三条実美』を獲得。列強介入-8%、HPを 10 回復する。",
                    action: (app) => {
                        app.addCardToDeck("sanjo_court");
                        app.modifyImperialGauge(-8);
                        app.healPlayer(10);
                    }
                },
                {
                    text: "都市整備に資金を投じる",
                    effectDesc: "志士『後藤象二郎』を獲得。70両を支払い、次の戦闘の攻撃力+18。資金が足りない場合は選択不可。",
                    costGold: 70,
                    canChoose: (app) => app.gold >= 70,
                    action: (app) => {
                        app.addCardToDeck("goto_political_drive");
                        app.gold -= 70;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 18;
                    }
                }
            ]
        },
        {
            id: "event_kanagawa_treaty",
            act: 1,
            title: "日米和親条約、開港の選択",
            desc: "鎖国の扉をわずかに開く条約が提示された。港を開いて国力を蓄えるか、異国の圧力に抗うか。",
            choices: [
                {
                    text: "港を開き、交易の道を作る",
                    effectDesc: "志士『阿部正弘』を獲得。70両を得るが、列強介入+10%。",
                    action: (app) => {
                        app.addCardToDeck("abe_defense");
                        app.gold += 70;
                        app.modifyImperialGauge(10);
                    }
                },
                {
                    text: "限定的に受け入れ、情報を集める",
                    effectDesc: "志士『佐久間象山』を獲得。列強介入-4%、最大HP+5。",
                    action: (app) => {
                        app.addCardToDeck("sakuma_gunnery");
                        app.modifyImperialGauge(-4);
                        app.maxHp += 5;
                        app.hp += 5;
                    }
                },
                {
                    text: "条約を拒み、海防を固める",
                    effectDesc: "志士『松平春嶽』を獲得。次の戦闘の攻撃力+10、HPを 8 失う。",
                    action: (app) => {
                        app.addCardToDeck("shungaku_council");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 10;
                        app.damagePlayer(8);
                    }
                }
            ]
        },
        {
            id: "event_ansei_earthquake",
            act: 1,
            title: "安政江戸地震、復興の灯",
            desc: "大地震で江戸の町が大きな被害を受けた。兵を救援へ回すか、蓄えを守るか、混乱の中で判断を迫られる。",
            choices: [
                {
                    text: "救援隊を送り、町を立て直す",
                    effectDesc: "志士『勝海舟』を獲得。50両を支払い、最大HP+10。資金が足りない場合は選択不可。",
                    costGold: 50,
                    canChoose: (app) => app.gold >= 50,
                    action: (app) => {
                        app.addCardToDeck("katsu_kaishu");
                        app.gold -= 50;
                        app.maxHp += 10;
                        app.hp += 10;
                    }
                },
                {
                    text: "兵站を守り、戦力を温存する",
                    effectDesc: "志士『佐久間象山』を獲得。次の戦闘の攻撃力+12、40両を得る。",
                    action: (app) => {
                        app.addCardToDeck("sakuma_gunnery");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 12;
                        app.gold += 40;
                    }
                },
                {
                    text: "民に食料を配り、騒乱を抑える",
                    effectDesc: "志士『永井尚志』を獲得。HPを 12 回復し、列強介入-5%。",
                    action: (app) => {
                        app.addCardToDeck("nagai_retreat");
                        app.healPlayer(12);
                        app.modifyImperialGauge(-5);
                    }
                }
            ]
        },
        {
            id: "event_sanjo_council",
            act: 1,
            title: "参与会議、諸侯の評議",
            desc: "朝廷と諸侯が集まり、幕府と列強への対応を話し合う。強硬策か、合議による安定か。",
            choices: [
                {
                    text: "合議を重ね、諸侯の協力を得る",
                    effectDesc: "志士『松平春嶽』を獲得。列強介入-8%、HPを 8 回復する。",
                    action: (app) => {
                        app.addCardToDeck("shungaku_council");
                        app.modifyImperialGauge(-8);
                        app.healPlayer(8);
                    }
                },
                {
                    text: "強硬論を掲げ、主導権を握る",
                    effectDesc: "志士『山内容堂』を獲得。次の戦闘の攻撃力+14、HPを 9 失う。",
                    action: (app) => {
                        app.addCardToDeck("yodo_political_balance");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 14;
                        app.damagePlayer(9);
                    }
                },
                {
                    text: "議場を商談の場に変える",
                    effectDesc: "志士『小松帯刀』を獲得。65両を得るが、列強介入+6%。",
                    action: (app) => {
                        app.addCardToDeck("komatsu_coordination");
                        app.gold += 65;
                        app.modifyImperialGauge(6);
                    }
                }
            ]
        },
        {
            id: "event_nagaoka_defense",
            act: 3,
            title: "長岡城攻防、ガトリングの轟音",
            desc: "長岡城をめぐる攻防で、最新兵器と旧来の武士道がぶつかる。城を守るか、反撃のために兵を温存するか。",
            choices: [
                {
                    text: "城壁を守り、敵の進軍を止める",
                    effectDesc: "志士『河井継之助』を獲得。『舶来ガトリング砲』をデッキに加えるが、列強介入+8%。",
                    action: (app) => {
                        app.addCardToDeck("kawai_artillery");
                        app.addCardToDeck("weapon_gatling");
                        app.modifyImperialGauge(8);
                    }
                },
                {
                    text: "兵を退き、反撃の機会を待つ",
                    effectDesc: "志士『立見尚文』を獲得。HPを 10 回復し、次の戦闘の攻撃力+9。",
                    action: (app) => {
                        app.addCardToDeck("tatsumi_naobumi");
                        app.healPlayer(10);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 9;
                    }
                },
                {
                    text: "町を守るため、兵糧を分ける",
                    effectDesc: "志士『山県有朋』を獲得。45両を支払い、最大HP+8。資金が足りない場合は選択不可。",
                    costGold: 45,
                    canChoose: (app) => app.gold >= 45,
                    action: (app) => {
                        app.addCardToDeck("yamagata_march");
                        app.gold -= 45;
                        app.maxHp += 8;
                        app.hp += 8;
                    }
                }
            ]
        },
        {
            id: "event_satsuma_students",
            act: 2,
            title: "薩摩藩英国留学生、海を越える",
            desc: "若き藩士たちを密かに英国へ送り、造船や砲術を学ばせる計画が立てられた。目先の兵力か、未来への投資か。",
            choices: [
                {
                    text: "留学生を送り、未来の知識を得る",
                    effectDesc: "志士『小松帯刀』を獲得。列強介入-7%、最大HP+8。",
                    action: (app) => {
                        app.addCardToDeck("komatsu_coordination");
                        app.modifyImperialGauge(-7);
                        app.maxHp += 8;
                        app.hp += 8;
                    }
                },
                {
                    text: "旅費を兵器購入に回す",
                    effectDesc: "志士『川村純義』を獲得。『アームストロング砲』をデッキに加えるが、列強介入+9%。",
                    action: (app) => {
                        app.addCardToDeck("kawamura_navy");
                        app.addCardToDeck("weapon_armstrong");
                        app.modifyImperialGauge(9);
                    }
                },
                {
                    text: "藩内の教育を優先する",
                    effectDesc: "志士『吉井友実』を獲得。45両を得て、カードを1枚引く機会を得る。",
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.gold += 45;
                        app.healPlayer(5);
                    }
                }
            ]
        },
        {
            id: "event_kobe_incident",
            act: 2,
            title: "神戸事件、外交の緊張",
            desc: "新政府軍と外国人の間で衝突が起き、港町に緊張が走った。謝罪して事態を収めるか、国の威信を示すか。",
            choices: [
                {
                    text: "外交官を立て、穏便に収める",
                    effectDesc: "志士『伊藤博文』を獲得。列強介入-12%、60両を支払う。",
                    costGold: 60,
                    canChoose: (app) => app.gold >= 60,
                    action: (app) => {
                        app.addCardToDeck("ito_diplomat");
                        app.gold -= 60;
                        app.modifyImperialGauge(-12);
                    }
                },
                {
                    text: "軍を前に出し、威信を守る",
                    effectDesc: "志士『吉井友実』を獲得。次の戦闘の攻撃力+15、列強介入+10%。",
                    action: (app) => {
                        app.addCardToDeck("yoshii_support");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 15;
                        app.modifyImperialGauge(10);
                    }
                },
                {
                    text: "交易を続け、港の利益を守る",
                    effectDesc: "志士『岩崎弥太郎』を獲得。80両を得るが、列強介入+6%。",
                    action: (app) => {
                        app.addCardToDeck("iwazaki_finance");
                        app.gold += 80;
                        app.modifyImperialGauge(6);
                    }
                }
            ]
        },
        {
            id: "event_shinchogumi",
            act: 1,
            title: "新徴組、江戸の治安維持",
            desc: "江戸の町を守るため、新たな治安組織の編成が進められている。厳しい規律か、町人との協力か。",
            choices: [
                {
                    text: "規律を掲げ、隊を鍛える",
                    effectDesc: "志士『佐々木愛次郎』を獲得。『新選組：局中法度』をデッキに加え、次の戦闘の攻撃力+5。",
                    faction: "sabaku",
                    action: (app) => {
                        app.addCardToDeck("sasaki_escort");
                        app.addCardToDeck("kyokuchu_hatto");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 5;
                    }
                },
                {
                    text: "町人と協力し、情報網を作る",
                    effectDesc: "志士『佐々木只三郎』を獲得。HPを 10 回復し、列強介入-5%。",
                    action: (app) => {
                        app.addCardToDeck("sasaki_patrol");
                        app.healPlayer(10);
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    text: "警備費を集め、装備を整える",
                    effectDesc: "志士『高橋泥舟』を獲得。50両を得るが、列強介入+4%。",
                    action: (app) => {
                        app.addCardToDeck("takahashi_guard");
                        app.gold += 50;
                        app.modifyImperialGauge(4);
                    }
                }
            ]
        },
        {
            id: "event_aizu_surrender",
            act: 3,
            title: "会津藩降伏、城下の朝",
            desc: "長い籠城の末、会津は降伏を決断する。戦いを終わらせるか、最後まで抗うか。",
            choices: [
                {
                    text: "降伏を受け入れ、民の命を守る",
                    effectDesc: "志士『秋月悌次郎』を獲得。HPを完全回復し、列強介入-12%。",
                    action: (app) => {
                        app.addCardToDeck("akizuki_strategy");
                        app.hp = app.maxHp;
                        app.modifyImperialGauge(-12);
                    }
                },
                {
                    text: "最後の一戦に全てを賭ける",
                    effectDesc: "志士『佐川官兵衛』を獲得。次の戦闘の攻撃力+18、HPを 15 失う。",
                    action: (app) => {
                        app.addCardToDeck("sagawa_cavalry");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 18;
                        app.damagePlayer(15);
                    }
                },
                {
                    text: "城下の復興資金を残す",
                    effectDesc: "志士『山川浩』を獲得。50両を支払い、最大HP+10。資金が足りない場合は選択不可。",
                    costGold: 50,
                    canChoose: (app) => app.gold >= 50,
                    action: (app) => {
                        app.addCardToDeck("yamagawa_defense");
                        app.gold -= 50;
                        app.maxHp += 10;
                        app.hp += 10;
                    }
                }
            ]
        },
        {
            id: "event_august_coup",
            act: 1,
            title: "八月十八日の政変、都の転換",
            desc: "朝廷内の主導権が一夜にして入れ替わり、長州勢は京を追われた。政変に抗うか、次の機会を待つか。",
            choices: [
                {
                    text: "都に残り、失地を取り戻す",
                    effectDesc: "志士『久坂玄瑞』を獲得。次の戦闘の攻撃力+14、HPを 10 失う。",
                    action: (app) => {
                        app.addCardToDeck("kusaka_revolt");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 14;
                        app.damagePlayer(10);
                    }
                },
                {
                    text: "兵を退き、再起の資金を集める",
                    effectDesc: "志士『松平容保』を獲得。60両を得て、HPを 5 回復する。",
                    action: (app) => {
                        app.addCardToDeck("katamori_oath");
                        app.gold += 60;
                        app.healPlayer(5);
                    }
                },
                {
                    text: "諸侯へ密書を送り、列強介入を抑える",
                    effectDesc: "志士『真木和泉』を獲得。列強介入-9%、最大HP+4。",
                    action: (app) => {
                        app.addCardToDeck("maki_revolt");
                        app.modifyImperialGauge(-9);
                        app.maxHp += 4;
                        app.hp += 4;
                    }
                }
            ]
        },
        {
            id: "event_omiya_assassination",
            act: 2,
            title: "近江屋事件、盟友の喪失",
            desc: "京都の宿で、時代を動かした志士が襲撃を受けた。悲しみを力に変えるか、身を隠して計画を守るか。",
            choices: [
                {
                    text: "仇を討ち、敵の拠点へ踏み込む",
                    effectDesc: "志士『佐々木只三郎』を獲得。次の戦闘の攻撃力+16、HPを 12 失う。",
                    action: (app) => {
                        app.addCardToDeck("sasaki_patrol");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 16;
                        app.damagePlayer(12);
                    }
                },
                {
                    text: "密書を守り、同志を分散させる",
                    effectDesc: "志士『中岡慎太郎』を獲得。列強介入-7%、40両を得る。",
                    action: (app) => {
                        app.addCardToDeck("nakaoka_mediator");
                        app.modifyImperialGauge(-7);
                        app.gold += 40;
                    }
                },
                {
                    text: "新しい盟主を立て、連携を保つ",
                    effectDesc: "志士『田中光顕』を獲得。最大HP+8、カードを1枚引く機会を得る。",
                    action: (app) => {
                        app.addCardToDeck("tanaka_intelligence");
                        app.maxHp += 8;
                        app.hp += 8;
                    }
                }
            ]
        },
        {
            id: "event_kaiyo_maru",
            act: 3,
            title: "開陽丸沈没、海軍の試練",
            desc: "最新鋭の艦が海に沈み、北辺の戦力が大きく揺らいだ。残った船を守るか、陸上の防衛へ力を移すか。",
            choices: [
                {
                    text: "救助隊を出し、艦の物資を回収する",
                    effectDesc: "志士『甲賀源吾』を獲得。35両を得て、HPを 8 回復する。",
                    action: (app) => {
                        app.addCardToDeck("koga_naval");
                        app.gold += 35;
                        app.healPlayer(8);
                    }
                },
                {
                    text: "陸上砲台へ資材を移す",
                    effectDesc: "志士『大鳥圭介』を獲得。次の戦闘の攻撃力+13、最大HP+5。",
                    action: (app) => {
                        app.addCardToDeck("otori_strategy");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 13;
                        app.maxHp += 5;
                        app.hp += 5;
                    }
                },
                {
                    text: "外国商人から艦を買い直す",
                    effectDesc: "志士『榎本武揚』を獲得。『甲鉄艦の艦砲射撃』をデッキに加えるが、列強介入+12%。",
                    action: (app) => {
                        app.addCardToDeck("enomoto_naval");
                        app.addCardToDeck("warship_ironclad");
                        app.modifyImperialGauge(12);
                    }
                }
            ]
        },
        {
            id: "event_dajo_system",
            act: 3,
            title: "太政官制度、行政の再編",
            desc: "新政府の役所を整え、複雑な政務を分担する制度が議論されている。中央集権か、現場の裁量か。",
            choices: [
                {
                    text: "中央の役所を整え、改革を統一する",
                    effectDesc: "志士『福岡孝弟』を獲得。最大HP+9、列強介入-6%。",
                    action: (app) => {
                        app.addCardToDeck("fukuoka_drafting");
                        app.maxHp += 9;
                        app.hp += 9;
                        app.modifyImperialGauge(-6);
                    }
                },
                {
                    text: "地方の裁量を残し、反発を抑える",
                    effectDesc: "志士『大久保利通』を獲得。HPを 10 回復し、50両を得る。",
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.healPlayer(10);
                        app.gold += 50;
                    }
                },
                {
                    text: "軍務を優先し、戦時体制を整える",
                    effectDesc: "志士『大村益次郎』を獲得。次の戦闘の攻撃力+15、HPを 7 失う。",
                    action: (app) => {
                        app.addCardToDeck("omura_reform");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 15;
                        app.damagePlayer(7);
                    }
                }
            ]
        },
        {
            id: "event_sword_ban",
            act: 3,
            title: "廃刀令、武士の時代の終わり",
            desc: "帯刀を禁じる新しい法が公布され、武士の誇りと生活が大きく揺らいだ。古い誇りを守るか、新時代へ適応するか。",
            choices: [
                {
                    text: "刀を置き、新しい職を探す",
                    effectDesc: "志士『斎藤一』を獲得。列強介入-6%、50両を得る。",
                    action: (app) => {
                        app.addCardToDeck("saito_gato");
                        app.modifyImperialGauge(-6);
                        app.gold += 50;
                    }
                },
                {
                    text: "武士の意地を貫き、抗議する",
                    effectDesc: "志士『前原一誠』を獲得。次の戦闘の攻撃力+15、HPを 10 失う。",
                    action: (app) => {
                        app.addCardToDeck("maebara_charge");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 15;
                        app.damagePlayer(10);
                    }
                },
                {
                    text: "刀を記念に残し、訓練へ転じる",
                    effectDesc: "志士『永倉新八』を獲得。最大HP+8、HPを 8 回復する。",
                    action: (app) => {
                        app.addCardToDeck("nagakura_bushin");
                        app.maxHp += 8;
                        app.hp += 8;
                    }
                }
            ]
        },
        {
            id: "event_conscription",
            act: 3,
            title: "徴兵令、国民皆兵の布告",
            desc: "身分を越えて兵を集める新しい軍制が発表された。近代軍を作るか、旧来の武士団を守るか。",
            choices: [
                {
                    text: "徴兵を進め、近代軍を整える",
                    effectDesc: "志士『山県有朋』を獲得。次の戦闘の攻撃力+16、最大HP+6。",
                    action: (app) => {
                        app.addCardToDeck("yamagata_march");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 16;
                        app.maxHp += 6;
                        app.hp += 6;
                    }
                },
                {
                    text: "志願兵を募り、反発を抑える",
                    effectDesc: "志士『大村益次郎』を獲得。40両を支払い、列強介入-7%。資金が足りない場合は選択不可。",
                    costGold: 40,
                    canChoose: (app) => app.gold >= 40,
                    action: (app) => {
                        app.addCardToDeck("omura_reform");
                        app.gold -= 40;
                        app.modifyImperialGauge(-7);
                    }
                },
                {
                    text: "軍費を民生へ回す",
                    effectDesc: "志士『山田顕義』を獲得。HPを 12 回復し、60両を得る。",
                    action: (app) => {
                        app.addCardToDeck("yamada_modern_army");
                        app.healPlayer(12);
                        app.gold += 60;
                    }
                }
            ]
        },
        {
            id: "event_satsuma_rebellion",
            act: 3,
            title: "西南戦争、士族の決起",
            desc: "不満を募らせた士族が故郷で兵を挙げた。反乱に加わるか、政府軍として鎮めるか。",
            choices: [
                {
                    text: "旧友と共に決起する",
                    effectDesc: "志士『中村半次郎』を獲得。次の戦闘の攻撃力+20、HPを 16 失う。",
                    action: (app) => {
                        app.addCardToDeck("nakamura_charge");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 20;
                        app.damagePlayer(16);
                    }
                },
                {
                    text: "政府軍として鎮圧に向かう",
                    effectDesc: "志士『山県有朋』を獲得。『アームストロング砲』をデッキに加えるが、列強介入+8%。",
                    action: (app) => {
                        app.addCardToDeck("yamagata_march");
                        app.addCardToDeck("weapon_armstrong");
                        app.modifyImperialGauge(8);
                    }
                },
                {
                    text: "戦場を離れ、民の避難を助ける",
                    effectDesc: "志士『西郷隆盛』を獲得。列強介入-10%、最大HP+7。",
                    action: (app) => {
                        app.addCardToDeck("saigo_jigen");
                        app.modifyImperialGauge(-10);
                        app.maxHp += 7;
                        app.hp += 7;
                    }
                }
            ]
        },
        {
            id: "event_okubo_assassination",
            act: 3,
            title: "大久保利通暗殺、政局の空白",
            desc: "改革を進めた政府要人が襲撃され、政局に大きな空白が生まれた。改革を続けるか、対話を優先するか。",
            choices: [
                {
                    text: "改革を止めず、遺志を継ぐ",
                    effectDesc: "志士『伊藤博文』を獲得。次の戦闘の攻撃力+14、列強介入-5%。",
                    action: (app) => {
                        app.addCardToDeck("ito_diplomat");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 14;
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    text: "反対派と対話し、国をまとめる",
                    effectDesc: "志士『大隈重信』を獲得。HPを完全回復し、50両を支払う。資金が足りない場合は選択不可。",
                    costGold: 50,
                    canChoose: (app) => app.gold >= 50,
                    action: (app) => {
                        app.addCardToDeck("okuma_modernization");
                        app.gold -= 50;
                        app.hp = app.maxHp;
                    }
                },
                {
                    text: "警備を強化し、再発を防ぐ",
                    effectDesc: "志士『大久保利通』を獲得。最大HP+10、HPを 5 回復する。",
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.maxHp += 10;
                        app.healPlayer(5);
                    }
                }
            ]
        },
        {
            id: "event_civilization_enlightenment",
            act: 3,
            title: "文明開化、街灯の夜",
            desc: "街に洋装や鉄道、ガス灯が現れ、人々の暮らしが急速に変わり始めた。新しい技術を受け入れるか、伝統を守るか。",
            choices: [
                {
                    text: "新技術を導入し、国力を高める",
                    effectDesc: "志士『岩崎弥太郎』を獲得。最大HP+8、列強介入+5%。",
                    action: (app) => {
                        app.addCardToDeck("iwazaki_finance");
                        app.maxHp += 8;
                        app.hp += 8;
                        app.modifyImperialGauge(5);
                    }
                },
                {
                    text: "職人の技を守り、和洋を融合する",
                    effectDesc: "志士『木戸孝允』を獲得。40両を得て、HPを 8 回復する。",
                    action: (app) => {
                        app.addCardToDeck("kido_reform");
                        app.gold += 40;
                        app.healPlayer(8);
                    }
                },
                {
                    text: "軍需技術を優先して導入する",
                    effectDesc: "志士『井上馨』を獲得。『舶来ガトリング砲』をデッキに加えるが、列強介入+10%。",
                    action: (app) => {
                        app.addCardToDeck("inoue_negotiation");
                        app.addCardToDeck("weapon_gatling");
                        app.modifyImperialGauge(10);
                    }
                }
            ]
        },
        {
            id: "event_yokohama_settlement",
            act: 3,
            title: "横浜居留地、異文化の交差点",
            desc: "港の居留地に外国商人や通詞が集まり、商取引と情報が行き交う。利益を取るか、摩擦を避けるか。",
            choices: [
                {
                    text: "交易所を開き、利益を得る",
                    effectDesc: "志士『井上馨』を獲得。90両を得るが、列強介入+12%。",
                    action: (app) => {
                        app.addCardToDeck("inoue_negotiation");
                        app.gold += 90;
                        app.modifyImperialGauge(12);
                    }
                },
                {
                    text: "通詞を育て、情報網を整える",
                    effectDesc: "志士『伊藤博文』を獲得。列強介入-6%、次の戦闘の攻撃力+7。",
                    action: (app) => {
                        app.addCardToDeck("ito_diplomat");
                        app.modifyImperialGauge(-6);
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 7;
                    }
                },
                {
                    text: "港の警備を強め、衝突を防ぐ",
                    effectDesc: "志士『佐々木只三郎』を獲得。最大HP+7、HPを 7 回復する。",
                    action: (app) => {
                        app.addCardToDeck("sasaki_patrol");
                        app.maxHp += 7;
                        app.hp += 7;
                    }
                }
            ]
        },
        {
            id: "event_samurai_livelihood",
            act: 3,
            title: "士族授産、失われた禄への道",
            desc: "禄を失った士族たちに、新しい生業を与える政策が必要になった。農業・商業・軍務のどれに道を作るか。",
            choices: [
                {
                    text: "開墾事業を支援し、土地を与える",
                    effectDesc: "志士『前原一誠』を獲得。最大HP+10、50両を支払う。資金が足りない場合は選択不可。",
                    costGold: 50,
                    canChoose: (app) => app.gold >= 50,
                    action: (app) => {
                        app.addCardToDeck("maebara_charge");
                        app.gold -= 50;
                        app.maxHp += 10;
                        app.hp += 10;
                    }
                },
                {
                    text: "商業へ転じる者を援助する",
                    effectDesc: "志士『板垣退助』を獲得。70両を得るが、列強介入+4%。",
                    action: (app) => {
                        app.addCardToDeck("itagaki_charge");
                        app.gold += 70;
                        app.modifyImperialGauge(4);
                    }
                },
                {
                    text: "士族を軍へ編入する",
                    effectDesc: "志士『山田顕義』を獲得。次の戦闘の攻撃力+16、HPを 8 失う。",
                    action: (app) => {
                        app.addCardToDeck("yamada_modern_army");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 16;
                        app.damagePlayer(8);
                    }
                }
            ]
        },
        {
            id: "event_army_ministry",
            act: 3,
            title: "陸軍省設置、軍政の整備",
            desc: "陸軍を統括する新たな役所が設置され、軍の指揮系統が整えられようとしている。中央集権か、地方軍の裁量か。",
            choices: [
                {
                    text: "中央で指揮を統一する",
                    effectDesc: "志士『大村益次郎』を獲得。次の戦闘の攻撃力+18、最大HP+5。",
                    action: (app) => {
                        app.addCardToDeck("omura_reform");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 18;
                        app.maxHp += 5;
                        app.hp += 5;
                    }
                },
                {
                    text: "地方の守備隊を尊重する",
                    effectDesc: "志士『山田顕義』を獲得。HPを 10 回復し、列強介入-7%。",
                    action: (app) => {
                        app.addCardToDeck("yamada_modern_army");
                        app.healPlayer(10);
                        app.modifyImperialGauge(-7);
                    }
                },
                {
                    text: "軍需工場へ予算を集中する",
                    effectDesc: "志士『山県有朋』を獲得。『アームストロング砲』をデッキに加えるが、列強介入+9%。",
                    action: (app) => {
                        app.addCardToDeck("yamagata_march");
                        app.addCardToDeck("weapon_armstrong");
                        app.modifyImperialGauge(9);
                    }
                }
            ]
        },
        {
            id: "event_railway_opening",
            act: 3,
            title: "鉄道開通、文明の蒸気",
            desc: "新橋と横浜を結ぶ鉄道が開通し、人と物の流れが変わろうとしている。交通網を広げるか、軍事輸送を優先するか。",
            choices: [
                {
                    text: "交易路を整え、商業を盛んにする",
                    effectDesc: "志士『大隈重信』を獲得。80両を得るが、列強介入+7%。",
                    action: (app) => {
                        app.addCardToDeck("okuma_modernization");
                        app.gold += 80;
                        app.modifyImperialGauge(7);
                    }
                },
                {
                    text: "軍事輸送を優先し、進軍を速める",
                    effectDesc: "志士『伊藤博文』を獲得。次の戦闘の攻撃力+17、HPを 6 失う。",
                    action: (app) => {
                        app.addCardToDeck("ito_diplomat");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 17;
                        app.damagePlayer(6);
                    }
                },
                {
                    text: "地方の駅を増やし、民の足を守る",
                    effectDesc: "志士『井上馨』を獲得。最大HP+8、列強介入-5%。",
                    action: (app) => {
                        app.addCardToDeck("inoue_negotiation");
                        app.maxHp += 8;
                        app.hp += 8;
                        app.modifyImperialGauge(-5);
                    }
                }
            ]
        },
        {
            id: "event_gakusei_system",
            act: 3,
            title: "学制公布、知識の門",
            desc: "全国に学校を設ける新しい制度が示された。軍学を優先するか、広く学びを届けるか。",
            choices: [
                {
                    text: "全国に学校を整備する",
                    effectDesc: "志士『木戸孝允』を獲得。最大HP+10、HPを 10 回復する。",
                    action: (app) => {
                        app.addCardToDeck("kido_reform");
                        app.maxHp += 10;
                        app.hp += 10;
                    }
                },
                {
                    text: "兵学を教え、国防を強める",
                    effectDesc: "志士『江藤新平』を獲得。次の戦闘の攻撃力+18、40両を得る。",
                    action: (app) => {
                        app.addCardToDeck("eto_reform");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 18;
                        app.gold += 40;
                    }
                },
                {
                    text: "外国教師を招き、知識を取り入れる",
                    effectDesc: "志士『佐久間象山』を獲得。列強介入+6%、カードを1枚引く機会を得る。",
                    action: (app) => {
                        app.addCardToDeck("sakuma_gunnery");
                        app.modifyImperialGauge(6);
                        app.healPlayer(5);
                    }
                }
            ]
        },
        {
            id: "event_postal_system",
            act: 3,
            title: "郵便制度、情報の道",
            desc: "全国へ手紙を届ける新しい仕組みが整えられている。密書を守るか、広く情報を行き渡らせるか。",
            choices: [
                {
                    text: "密書の網を整え、仲間と連絡する",
                    effectDesc: "志士『田中光顕』を獲得。次の戦闘の攻撃力+10、列強介入-5%。",
                    action: (app) => {
                        app.addCardToDeck("tanaka_intelligence");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 10;
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    text: "商用郵便を広げ、資金を集める",
                    effectDesc: "志士『品川弥二郎』を獲得。65両を得るが、列強介入+4%。",
                    action: (app) => {
                        app.addCardToDeck("shinagawa_signal");
                        app.gold += 65;
                        app.modifyImperialGauge(4);
                    }
                },
                {
                    text: "検閲を強め、反乱の芽を摘む",
                    effectDesc: "志士『佐々木高行』を獲得。最大HP+6、HPを 6 回復する。",
                    action: (app) => {
                        app.addCardToDeck("sasaki_governance");
                        app.maxHp += 6;
                        app.hp += 6;
                    }
                }
            ]
        },
        {
            id: "event_ryukyu_annexation",
            act: 3,
            title: "琉球処分、海の国境",
            desc: "琉球をめぐる外交問題が持ち上がり、新政府は国境と自治のあり方を決めようとしている。強硬策か、対話か。",
            choices: [
                {
                    text: "中央の制度へ組み込み、国境を明確にする",
                    effectDesc: "志士『小松帯刀』を獲得。次の戦闘の攻撃力+13、列強介入+5%。",
                    action: (app) => {
                        app.addCardToDeck("komatsu_coordination");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 13;
                        app.modifyImperialGauge(5);
                    }
                },
                {
                    text: "自治を尊重し、外交で調整する",
                    effectDesc: "志士『副島種臣』を獲得。列強介入-10%、HPを 8 回復する。",
                    action: (app) => {
                        app.addCardToDeck("soejima_diplomacy");
                        app.modifyImperialGauge(-10);
                        app.healPlayer(8);
                    }
                },
                {
                    text: "海防を整え、航路を守る",
                    effectDesc: "志士『川村純義』を獲得。『甲鉄艦の艦砲射撃』をデッキに加えるが、列強介入+9%。",
                    action: (app) => {
                        app.addCardToDeck("kawamura_navy");
                        app.addCardToDeck("warship_ironclad");
                        app.modifyImperialGauge(9);
                    }
                }
            ]
        },
        {
            id: "event_meiji_political_crisis",
            act: 3,
            title: "明治六年政変、割れる元勲",
            desc: "海外派遣と国内改革をめぐり、新政府の中心で意見が真っ二つに割れた。政権を守るか、主張を貫くか。",
            choices: [
                {
                    text: "内政を優先し、国力を蓄える",
                    effectDesc: "志士『岩倉具視』を獲得。最大HP+9、列強介入-8%。",
                    action: (app) => {
                        app.addCardToDeck("iwakura_imperial");
                        app.maxHp += 9;
                        app.hp += 9;
                        app.modifyImperialGauge(-8);
                    }
                },
                {
                    text: "派遣論を支持し、威信を示す",
                    effectDesc: "志士『板垣退助』を獲得。次の戦闘の攻撃力+18、HPを 12 失う。",
                    action: (app) => {
                        app.addCardToDeck("itagaki_charge");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 18;
                        app.damagePlayer(12);
                    }
                },
                {
                    text: "双方の派閥を調停する",
                    effectDesc: "志士『副島種臣』を獲得。50両を支払い、HPを完全回復。資金が足りない場合は選択不可。",
                    costGold: 50,
                    canChoose: (app) => app.gold >= 50,
                    action: (app) => {
                        app.addCardToDeck("soejima_diplomacy");
                        app.gold -= 50;
                        app.hp = app.maxHp;
                    }
                }
            ]
        },
        {
            id: "event_first_newspaper",
            act: 3,
            title: "新聞創刊、世論の力",
            desc: "新しい新聞が創刊され、事件や政治の情報が町へ広がり始めた。世論を味方につけるか、情報を管理するか。",
            choices: [
                {
                    text: "報道を広げ、民の支持を集める",
                    effectDesc: "志士『板垣退助』を獲得。HPを 10 回復し、列強介入-5%。",
                    action: (app) => {
                        app.addCardToDeck("itagaki_charge");
                        app.healPlayer(10);
                        app.modifyImperialGauge(-5);
                    }
                },
                {
                    text: "軍事情報を載せ、敵を牽制する",
                    effectDesc: "志士『品川弥二郎』を獲得。次の戦闘の攻撃力+13、40両を得る。",
                    action: (app) => {
                        app.addCardToDeck("shinagawa_signal");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 13;
                        app.gold += 40;
                    }
                },
                {
                    text: "広告を集め、新聞を独立させる",
                    effectDesc: "志士『後藤象二郎』を獲得。75両を得るが、列強介入+4%。",
                    action: (app) => {
                        app.addCardToDeck("goto_political_drive");
                        app.gold += 75;
                        app.modifyImperialGauge(4);
                    }
                }
            ]
        },
        {
            id: "event_tonden_soldiers",
            act: 3,
            title: "屯田兵制度、北辺の守り",
            desc: "北海道の開拓と防衛を担う屯田兵の制度が整えられた。農地を開くか、軍事拠点を築くか。",
            choices: [
                {
                    text: "開拓と防衛を同時に進める",
                    effectDesc: "志士『黒田清隆』を獲得。最大HP+10、次の戦闘の攻撃力+10。",
                    action: (app) => {
                        app.addCardToDeck("kuroda_frontier");
                        app.maxHp += 10;
                        app.hp += 10;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 10;
                    }
                },
                {
                    text: "兵舎を優先し、北辺を固める",
                    effectDesc: "志士『永倉新八』を獲得。『アームストロング砲』をデッキに加えるが、列強介入+8%。",
                    action: (app) => {
                        app.addCardToDeck("nagakura_bushin");
                        app.addCardToDeck("weapon_armstrong");
                        app.modifyImperialGauge(8);
                    }
                },
                {
                    text: "入植者の暮らしを優先する",
                    effectDesc: "志士『山県有朋』を獲得。列強介入-6%、50両を得る。",
                    action: (app) => {
                        app.addCardToDeck("yamagata_march");
                        app.modifyImperialGauge(-6);
                        app.gold += 50;
                    }
                }
            ]
        },
        {
            id: "event_stipend_reform",
            act: 3,
            title: "秩禄処分、士族の岐路",
            desc: "旧藩士への秩禄を整理する政策が進み、長年の暮らしが変わろうとしている。補償か、軍務への転換か。",
            choices: [
                {
                    text: "補償を手厚くし、反発を抑える",
                    effectDesc: "志士『板垣退助』を獲得。70両を支払い、列強介入-8%。資金が足りない場合は選択不可。",
                    costGold: 70,
                    canChoose: (app) => app.gold >= 70,
                    action: (app) => {
                        app.addCardToDeck("itagaki_charge");
                        app.gold -= 70;
                        app.modifyImperialGauge(-8);
                    }
                },
                {
                    text: "士族を軍へ迎え入れる",
                    effectDesc: "志士『前原一誠』を獲得。次の戦闘の攻撃力+17、HPを 9 失う。",
                    action: (app) => {
                        app.addCardToDeck("maebara_charge");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 17;
                        app.damagePlayer(9);
                    }
                },
                {
                    text: "商売を始める資金を渡す",
                    effectDesc: "志士『大久保利通』を獲得。40両を支払い、最大HP+8。資金が足りない場合は選択不可。",
                    costGold: 40,
                    canChoose: (app) => app.gold >= 40,
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.gold -= 40;
                        app.maxHp += 8;
                        app.hp += 8;
                    }
                }
            ]
        },
        {
            id: "event_hokkaido_agency",
            act: 3,
            title: "北海道開拓使、北の実験場",
            desc: "開拓使が設けられ、北海道に新しい産業と町を作る計画が始まった。農地・工場・防衛のどこへ資金を回すか。",
            choices: [
                {
                    text: "農地を広げ、民の暮らしを安定させる",
                    effectDesc: "志士『黒田清隆』を獲得。最大HP+10、HPを 10 回復する。",
                    action: (app) => {
                        app.addCardToDeck("kuroda_frontier");
                        app.maxHp += 10;
                        app.hp += 10;
                    }
                },
                {
                    text: "工場を建て、国産の武器を作る",
                    effectDesc: "志士『榎本武揚』を獲得。次の戦闘の攻撃力+16、70両を支払う。資金が足りない場合は選択不可。",
                    costGold: 70,
                    canChoose: (app) => app.gold >= 70,
                    action: (app) => {
                        app.addCardToDeck("enomoto_naval");
                        app.gold -= 70;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 16;
                    }
                },
                {
                    text: "屯田兵を置き、北辺を守る",
                    effectDesc: "志士『永倉新八』を獲得。列強介入-5%、50両を得る。",
                    action: (app) => {
                        app.addCardToDeck("nagakura_bushin");
                        app.modifyImperialGauge(-5);
                        app.gold += 50;
                    }
                }
            ]
        },
        {
            id: "event_land_tax",
            act: 3,
            title: "地租改正、税の新しい形",
            desc: "土地の価値に基づいて税を集める制度が始まった。安定した財源を得るか、民の負担を軽くするか。",
            choices: [
                {
                    text: "制度を徹底し、国庫を安定させる",
                    effectDesc: "志士『大久保利通』を獲得。90両を得るが、HPを 8 失う。",
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.gold += 90;
                        app.damagePlayer(8);
                    }
                },
                {
                    text: "税率を抑え、民の反発を防ぐ",
                    effectDesc: "志士『板垣退助』を獲得。列強介入-7%、HPを 10 回復する。",
                    action: (app) => {
                        app.addCardToDeck("itagaki_charge");
                        app.modifyImperialGauge(-7);
                        app.healPlayer(10);
                    }
                },
                {
                    text: "税収を軍備へ集中する",
                    effectDesc: "志士『大隈重信』を獲得。次の戦闘の攻撃力+19、30両を得る。",
                    action: (app) => {
                        app.addCardToDeck("okuma_modernization");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 19;
                        app.gold += 30;
                    }
                }
            ]
        },
        {
            id: "event_rokumeikan",
            act: 3,
            title: "鹿鳴館、社交外交の舞台",
            desc: "洋館の舞踏会に外国の要人が集まり、不平等条約改正を見据えた社交外交が始まった。華やかさか、実務か。",
            choices: [
                {
                    text: "社交を重ね、外交関係を改善する",
                    effectDesc: "志士『井上馨』を獲得。列強介入-12%、60両を支払う。資金が足りない場合は選択不可。",
                    costGold: 60,
                    canChoose: (app) => app.gold >= 60,
                    action: (app) => {
                        app.addCardToDeck("inoue_negotiation");
                        app.gold -= 60;
                        app.modifyImperialGauge(-12);
                    }
                },
                {
                    text: "式典より軍備を優先する",
                    effectDesc: "志士『伊藤博文』を獲得。『新式ミニエ銃』をデッキに加え、列強介入+7%。",
                    action: (app) => {
                        app.addCardToDeck("ito_diplomat");
                        app.addCardToDeck("weapon_minie");
                        app.modifyImperialGauge(7);
                    }
                },
                {
                    text: "国内の教育へ予算を回す",
                    effectDesc: "志士『大隈重信』を獲得。最大HP+8、HPを 8 回復する。",
                    action: (app) => {
                        app.addCardToDeck("okuma_modernization");
                        app.maxHp += 8;
                        app.hp += 8;
                    }
                }
            ]
        },
        {
            id: "event_treaty_qing",
            act: 3,
            title: "日清修好条規、東アジアの外交",
            desc: "清との間に対等な条約を結び、東アジアの秩序を探る機会が訪れた。協調か、軍備競争か。",
            choices: [
                {
                    text: "条約を結び、対等な関係を築く",
                    effectDesc: "志士『副島種臣』を獲得。列強介入-9%、50両を得る。",
                    action: (app) => {
                        app.addCardToDeck("soejima_diplomacy");
                        app.modifyImperialGauge(-9);
                        app.gold += 50;
                    }
                },
                {
                    text: "軍備を増やし、交渉力を高める",
                    effectDesc: "志士『大久保利通』を獲得。次の戦闘の攻撃力+17、HPを 6 失う。",
                    action: (app) => {
                        app.addCardToDeck("okubo_strategy");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 17;
                        app.damagePlayer(6);
                    }
                },
                {
                    text: "通商を広げ、国庫を豊かにする",
                    effectDesc: "志士『伊藤博文』を獲得。80両を得るが、列強介入+6%。",
                    action: (app) => {
                        app.addCardToDeck("ito_diplomat");
                        app.gold += 80;
                        app.modifyImperialGauge(6);
                    }
                }
            ]
        },
        {
            id: "event_freedom_rights",
            act: 3,
            title: "自由民権運動、演説の波",
            desc: "各地で政治参加を求める演説会が開かれ、政府のあり方をめぐる声が高まった。弾圧か、議論か。",
            choices: [
                {
                    text: "演説を認め、議会への道を開く",
                    effectDesc: "志士『板垣退助』を獲得。列強介入-8%、最大HP+8。",
                    action: (app) => {
                        app.addCardToDeck("itagaki_charge");
                        app.modifyImperialGauge(-8);
                        app.maxHp += 8;
                        app.hp += 8;
                    }
                },
                {
                    text: "秩序を守るため、集会を制限する",
                    effectDesc: "志士『江藤新平』を獲得。次の戦闘の攻撃力+14、HPを 7 失う。",
                    action: (app) => {
                        app.addCardToDeck("eto_reform");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 14;
                        app.damagePlayer(7);
                    }
                },
                {
                    text: "新聞と結び、世論を味方にする",
                    effectDesc: "志士『中岡慎太郎』を獲得。65両を得るが、列強介入+4%。",
                    action: (app) => {
                        app.addCardToDeck("nakaoka_mediator");
                        app.gold += 65;
                        app.modifyImperialGauge(4);
                    }
                }
            ]
        },
        {
            id: "event_tomioka_silk",
            act: 3,
            title: "富岡製糸場、工場の鐘",
            desc: "西洋式の製糸工場が稼働し、輸出産業の柱を作ろうとしている。利益を急ぐか、働く者の環境を整えるか。",
            choices: [
                {
                    text: "生産を増やし、輸出で稼ぐ",
                    effectDesc: "志士『岩崎弥太郎』を獲得。100両を得るが、列強介入+8%。",
                    action: (app) => {
                        app.addCardToDeck("iwazaki_finance");
                        app.gold += 100;
                        app.modifyImperialGauge(8);
                    }
                },
                {
                    text: "技術教育を優先し、人材を育てる",
                    effectDesc: "志士『大隈重信』を獲得。最大HP+9、次の戦闘の攻撃力+8。",
                    action: (app) => {
                        app.addCardToDeck("okuma_modernization");
                        app.maxHp += 9;
                        app.hp += 9;
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 8;
                    }
                },
                {
                    text: "工場の環境を整え、働く者を守る",
                    effectDesc: "志士『伊藤博文』を獲得。50両を支払い、HPを 12 回復する。資金が足りない場合は選択不可。",
                    costGold: 50,
                    canChoose: (app) => app.gold >= 50,
                    action: (app) => {
                        app.addCardToDeck("ito_diplomat");
                        app.gold -= 50;
                        app.healPlayer(12);
                    }
                }
            ]
        },
        {
            id: "event_hokkaido_village",
            act: 3,
            title: "北海道開拓村、雪原の暮らし",
            desc: "北の大地に開拓村が生まれ、厳しい冬を越すための仕組みが必要になった。軍事か、生活基盤か。",
            choices: [
                {
                    text: "道路と倉庫を整え、冬に備える",
                    effectDesc: "志士『黒田清隆』を獲得。最大HP+12、45両を支払う。資金が足りない場合は選択不可。",
                    costGold: 45,
                    canChoose: (app) => app.gold >= 45,
                    action: (app) => {
                        app.addCardToDeck("kuroda_frontier");
                        app.gold -= 45;
                        app.maxHp += 12;
                        app.hp += 12;
                    }
                },
                {
                    text: "守備隊を置き、国境を警戒する",
                    effectDesc: "志士『永倉新八』を獲得。次の戦闘の攻撃力+16、HPを 8 失う。",
                    action: (app) => {
                        app.addCardToDeck("nagakura_bushin");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 16;
                        app.damagePlayer(8);
                    }
                },
                {
                    text: "交易を開き、物資を呼び込む",
                    effectDesc: "志士『榎本武揚』を獲得。75両を得るが、列強介入+5%。",
                    action: (app) => {
                        app.addCardToDeck("enomoto_naval");
                        app.gold += 75;
                        app.modifyImperialGauge(5);
                    }
                }
            ]
        },
        {
            id: "event_treaty_revision",
            act: 3,
            title: "条約改正交渉、主権の回復",
            desc: "不平等条約の改正をめぐり、外国公使との交渉が続いている。時間をかけるか、強い姿勢で臨むか。",
            choices: [
                {
                    text: "粘り強く交渉し、関税自主権を求める",
                    effectDesc: "志士『井上馨』を獲得。列強介入-15%、HPを 8 回復する。",
                    action: (app) => {
                        app.addCardToDeck("inoue_negotiation");
                        app.modifyImperialGauge(-15);
                        app.healPlayer(8);
                    }
                },
                {
                    text: "軍備を背景に、強硬に迫る",
                    effectDesc: "志士『大隈重信』を獲得。次の戦闘の攻撃力+20、列強介入+7%。",
                    action: (app) => {
                        app.addCardToDeck("okuma_modernization");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 20;
                        app.modifyImperialGauge(7);
                    }
                },
                {
                    text: "交易条件を譲り、資金を確保する",
                    effectDesc: "志士『伊藤博文』を獲得。95両を得るが、列強介入+10%。",
                    action: (app) => {
                        app.addCardToDeck("ito_diplomat");
                        app.gold += 95;
                        app.modifyImperialGauge(10);
                    }
                }
            ]
        },
        {
            id: "event_iba_hachiro",
            act: 2,
            title: "箱根山崎の激闘、隻腕の小天狗",
            desc: "心形刀流の美剣士・伊庭八郎率いる幕府遊撃隊が、箱根の天険にて立ち塞がる。左手に重傷を負いながらも白刃を閃かせるその凄絶な気魄に、何を託すか。",
            choices: [
                {
                    text: "【佐幕派】遊撃隊の突撃に呼応し、共に箱根の天険を死守する",
                    faction: "sabaku",
                    effectDesc: "『伊庭八郎：片腕の剣客』をデッキに加え、次の戦闘の攻撃力+10。",
                    action: (app) => {
                        app.addCardToDeck("iba_duel");
                        app.nextBattleStrengthBuff = (app.nextBattleStrengthBuff || 0) + 10;
                        window.soundSystem.playFanfare();
                    }
                },
                {
                    text: "【討幕派】その比類なき武士道に敬意を表し、陣営を越えて同志として招く",
                    faction: "tobaku",
                    effectDesc: "『伊庭八郎：片腕の剣客』をデッキに加え、列強介入-5%。",
                    action: (app) => {
                        app.addCardToDeck("iba_duel");
                        app.modifyImperialGauge(-5);
                        window.soundSystem.playFanfare();
                    }
                },
                {
                    text: "心形刀流の奥義に挑み、その太刀筋を見極める",
                    effectDesc: "HPを 8 失うが、『伊庭八郎：片腕の剣客』をデッキに加え、25両を得る。",
                    action: (app) => {
                        app.damagePlayer(8);
                        app.addCardToDeck("iba_duel");
                        app.gold += 25;
                        window.soundSystem.playFanfare();
                    }
                },
                {
                    text: "深手を負った伊庭の手当てを行い、陣備えを整える",
                    effectDesc: "HPを 15 回復し、最大HP+5。",
                    action: (app) => {
                        app.healPlayer(15);
                        app.maxHp += 5;
                        app.hp += 5;
                    }
                }
            ]
        }
    ],

    // ==========================================
    // 6. 志士連携（コンボ・コネクトリンク）マスター定義 (全177組・全志士網羅)
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
        desc: "列強介入-5%、防10。",
        apply: (b) => {
            b.modifyImperialGauge(-5);
            b.gainPlayerShield(10);
        }
    },
    {
        id: "combo_katsu_saigo",
        chars: ["katsu", "saigo"],
        title: "【江戸城無血開城！】",
        desc: "敵に18ダメージ、防16、列強介入-8%、カードを1枚引く。",
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
        id: "combo_katsura_kido",
        chars: ["katsura", "kido"],
        title: "【維新の設計図！】",
        desc: "列強介入-5%、腕力+4。",
        apply: (b) => {
            b.modifyImperialGauge(-5);
            b.applyPlayerBuff("strength", 4);
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
        chars: ["katamori", "yamagawa"],
        title: "【会津守護の陣！】",
        desc: "防14、HPを5回復。",
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
        desc: "カードを2枚引き、列強介入-4%。",
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
        desc: "文+1、敵に12ダメージ、列強介入+3%。",
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
        desc: "HPを8回復、敵に脱力2付与。",
        apply: (b) => {
            b.healPlayer(8);
            b.applyStatusToEnemy("weak", 2);
        }
    },
    {
        id: "combo_akane_yamaoka",
        chars: ["akane", "yamaoka"],
        title: "【和平談判の刃！】",
        desc: "列強介入-8%、防12。",
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
        desc: "列強介入-8%、カードを1枚引く。",
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
        desc: "HPを6回復、カードを1枚引く、列強介入-4%。",
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
        desc: "防15、列強介入-6%。",
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
        desc: "敵に12ダメージ、列強介入-5%。",
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
        desc: "文+1、カードを1枚引く、列強介入-4%。",
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
        desc: "防14、列強介入-5%。",
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
        desc: "敵に14ダメージ、防8、列強介入-4%。",
        apply: (b) => {
            b.dealDamageToEnemy(14);
            b.gainPlayerShield(8);
            b.modifyImperialGauge(-4);
        }
    },
    {
        id: "combo_yamagawa_yamakawa_taizo",
        chars: ["yamagawa", "yamakawa_taizo"],
        title: "【会津山川の奮戦！】",
        desc: "防16、HPを5回復。",
        apply: (b) => {
            b.gainPlayerShield(16);
            b.healPlayer(5);
        }
    },
    {
        id: "combo_katsu_nagai",
        chars: ["katsu", "nagai"],
        title: "【幕臣海防の先見！】",
        desc: "防15、列強介入-6%、敵攻撃意図-3。",
        apply: (b) => {
            b.gainPlayerShield(15);
            b.modifyImperialGauge(-6);
            if (b.enemy && b.enemy.intent && b.enemy.intent.damage) {
                b.enemy.intent.damage = Math.max(0, b.enemy.intent.damage - 3);
            }
        }
    },
    {
        id: "combo_kawamura_kuroda_ryosuke",
        chars: ["kawamura", "kuroda_ryosuke"],
        title: "【海防軍政の防備！】",
        desc: "防14、敵シールド8破壊。",
        apply: (b) => {
            b.gainPlayerShield(14);
            if (b.enemy) {
                b.enemy.shield = Math.max(0, b.enemy.shield - 8);
            }
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
        desc: "防16、列強介入-5%。",
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
        desc: "敵に24ダメージ、防14、文+1、カードを2枚引く、列強介入-6%。",
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
        desc: "敵に15ダメージ、列強介入-4%、腕力+3。",
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
        desc: "防12、列強介入-4%、文+1、カードを1枚引く。",
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
        desc: "敵に18ダメージ、HPを3回復。",
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
        desc: "敵に14ダメージ、防10、列強介入-4%。",
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
        desc: "防18、列強介入-6%。",
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
        desc: "文+1、カードを1枚引き、列強介入-4%。",
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
        desc: "敵に14ダメージ、防14、列強介入-4%。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(14); b.modifyImperialGauge(-4);
        }
    },
    {
        id: "combo_kido_okubo",
        chars: ["kido","okubo"],
        title: "【維新二傑の経綸！】",
        desc: "敵に16ダメージ、防16、カードを2枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(16); b.gainPlayerShield(16); b.drawCards(2);
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
        desc: "防16、列強介入-6%、カードを2枚引く。",
        apply: (b) => {
            b.gainPlayerShield(16); b.modifyImperialGauge(-6); b.drawCards(2);
        }
    },
    {
        id: "combo_okubo_komatsu",
        chars: ["okubo","komatsu"],
        title: "【薩摩藩庁の盟約！】",
        desc: "防14、列強介入-5%、文+1。",
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
        desc: "敵に16ダメージ、防12、HPを5回復。",
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
        id: "combo_kuroda_ryosuke_saigo",
        chars: ["kuroda_ryosuke","saigo"],
        title: "【薩摩剛勇の将！】",
        desc: "敵に16ダメージ、防14、腕力+3。",
        apply: (b) => {
            b.dealDamageToEnemy(16); b.gainPlayerShield(14); b.applyPlayerBuff('strength', 3);
        }
    },
    {
        id: "combo_ryoma_goto",
        chars: ["ryoma","goto"],
        title: "【清風亭の盟約・大政奉還！】",
        desc: "敵に15ダメージ、防12、列強介入-6%、カードを1枚引く。",
        apply: (b) => {
            b.dealDamageToEnemy(15); b.gainPlayerShield(12); b.modifyImperialGauge(-6); b.drawCards(1);
        }
    },
    {
        id: "combo_ryoma_iwazaki",
        chars: ["ryoma","iwazaki"],
        title: "【海援隊と三菱の黎明！】",
        desc: "敵に12ダメージ、防10、文+1、30両を得る。",
        apply: (b) => {
            b.dealDamageToEnemy(12); b.gainPlayerShield(10); b.gainPlayerEnergy(1); if (b.app) b.app.gold += 30;
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
        desc: "防14、列強介入-5%、カードを1枚引く。",
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
        desc: "防12、列強介入-4%、カードを1枚引く。",
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
        desc: "防15、HPを5回復、列強介入-4%。",
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
        desc: "敵に12ダメージ、防12、列強介入-5%、文+1。",
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
        desc: "防15、文+1、25両を得る。",
        apply: (b) => {
            b.gainPlayerShield(15); b.gainPlayerEnergy(1); if (b.app) b.app.gold += 25;
        }
    },
    {
        id: "combo_yodo_shungaku",
        chars: ["yodo","shungaku"],
        title: "【四賢侯の英邁！】",
        desc: "防16、列強介入-5%、HPを5回復。",
        apply: (b) => {
            b.gainPlayerShield(16); b.modifyImperialGauge(-5); b.healPlayer(5);
        }
    },
    {
        id: "combo_sakuma_katsu",
        chars: ["sakuma","katsu"],
        title: "【海防砲術の義兄弟！】",
        desc: "敵に14ダメージ、防14、列強介入-5%。",
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
        desc: "防14、HPを8回復。",
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
        desc: "防16、HPを5回復、列強介入-4%。",
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
        id: "combo_yamagawa_sagawa",
        chars: ["yamagawa","sagawa"],
        title: "【会津防衛の双璧！】",
        desc: "敵に14ダメージ、防14。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(14);
        }
    },
    {
        id: "combo_yamagawa_yamamoto",
        chars: ["yamagawa","yamamoto"],
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
        chars: ["yamakawa_taizo","katamori"],
        title: "【彼岸獅子の奇策！】",
        desc: "敵に12ダメージ、防16、HPを5回復。",
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
        desc: "防14、列強介入-4%、カードを1枚引く。",
        apply: (b) => {
            b.gainPlayerShield(14); b.modifyImperialGauge(-4); b.drawCards(1);
        }
    },
    {
        id: "combo_katsu_yamaoka",
        chars: ["katsu","yamaoka"],
        title: "【幕末の三舟・直談判の信義！】",
        desc: "敵に14ダメージ、防16、列強介入-6%。",
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
        desc: "敵に16ダメージ、防16、列強介入-6%。",
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
        desc: "防16、列強介入-6%、カードを1枚引く。",
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
        desc: "敵に15ダメージ、防15、HPを6回復。",
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
        desc: "敵に14ダメージ、防14、列強介入-5%。",
        apply: (b) => {
            b.dealDamageToEnemy(14); b.gainPlayerShield(14); b.modifyImperialGauge(-5);
        }
    },
    {
        id: "combo_enomoto_matsumoto",
        chars: ["enomoto","matsumoto"],
        title: "【箱館救療の仁術！】",
        desc: "防15、HPを8回復。",
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
        desc: "防14、列強介入-6%、文+1。",
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
        desc: "防16、列強介入-5%、文+1。",
        apply: (b) => {
            b.gainPlayerShield(16); b.modifyImperialGauge(-5); b.gainPlayerEnergy(1);
        }
    },
    {
        id: "combo_ii_naosuke_nagai",
        chars: ["ii_naosuke","nagai"],
        title: "【大老と幕閣の決断！】",
        desc: "防16、列強介入-6%、文+1。",
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
]
};

