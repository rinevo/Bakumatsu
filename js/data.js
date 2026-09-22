/**
 * 維新の嵐：双極の蒼穹 - Rogue Deck-Build -
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
            type: "shishi",
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
            rarity: "starter",
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

        // --- 🔵 幕府・会津藩（佐幕派）初期カード ---
        "sabaku_strike": {
            id: "sabaku_strike",
            name: "天然理心流の太刀",
            faction: "sabaku",
            type: "shishi",
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
            rarity: "starter",
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
                    window.particleSystem.showComboText("【誠の連帯！】", b.comboCount);
                    window.soundSystem.playConnectLink();
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
            maxHp: 34,
            sprite: "mimarigumi",
            faction: "sabaku",
            intents: [
                { type: "attack", damage: 7, desc: "抜き打ち" },
                { type: "defend", shield: 8, desc: "身構え" },
                { type: "attack", damage: 10, desc: "踏み込み斬り" }
            ]
        },
        "act1_normal_2": {
            name: "尊攘激派の脱藩浪士",
            maxHp: 30,
            sprite: "ronin",
            faction: "tobaku",
            intents: [
                { type: "attack", damage: 9, desc: "狂乱の太刀" },
                { type: "attack", damage: 12, desc: "捨て身の一撃" },
                { type: "buff", strength: 2, desc: "気合の雄叫び" }
            ]
        },
        "act1_elite_izo": {
            name: "人斬り以蔵 (岡田以蔵)",
            maxHp: 65,
            isElite: true,
            sprite: "izo",
            intents: [
                { type: "attack", damage: 8, times: 2, desc: "二連撃" },
                { type: "curse", curseId: "curse_riot", damage: 6, desc: "天誅の怨嗟" },
                { type: "attack", damage: 16, desc: "人斬り秘剣" }
            ]
        },
        "act1_boss_tobaku": {
            name: "新選組局長・近藤勇",
            maxHp: 110,
            isBoss: true,
            sprite: "kondo_boss",
            intents: [
                { type: "defend", shield: 14, desc: "不動の構え" },
                { type: "attack", damage: 15, desc: "虎徹・袈裟斬り" },
                { type: "buff", strength: 3, desc: "誠の号令" },
                { type: "attack", damage: 22, desc: "天然理心流・絶技" }
            ]
        },
        "act1_boss_sabaku": {
            name: "長州総帥・桂小五郎",
            maxHp: 105,
            isBoss: true,
            sprite: "katsura_boss",
            intents: [
                { type: "attack", damage: 12, desc: "神道無念流・霞斬り" },
                { type: "defend", shield: 16, desc: "逃げの小五郎" },
                { type: "curse", curseId: "curse_betrayal", damage: 8, desc: "革命の扇動" },
                { type: "attack", damage: 20, desc: "維新の疾風" }
            ]
        },

        // ACT 2: 東海道進軍・関所突破
        "act2_normal_1": {
            name: "幕府新式歩兵連隊",
            maxHp: 52,
            sprite: "shinsiki",
            intents: [
                { type: "attack", damage: 11, desc: "小銃一斉射撃" },
                { type: "defend", shield: 12, desc: "方陣防御" },
                { type: "attack", damage: 15, desc: "銃剣突撃" }
            ]
        },
        "act2_elite_serizawa": {
            name: "芹沢鴨（豪剣の猛威）",
            maxHp: 85,
            isElite: true,
            sprite: "serizawa",
            intents: [
                { type: "attack", damage: 18, desc: "豪刀乱舞" },
                { type: "buff", strength: 4, desc: "酒気狂乱" },
                { type: "attack", damage: 24, desc: "無慈悲の一閃" }
            ]
        },
        "act2_boss_katamori": {
            name: "会津藩主・松平容保",
            maxHp: 160,
            isBoss: true,
            sprite: "katamori_boss",
            intents: [
                { type: "defend", shield: 22, desc: "会津魂の盾" },
                { type: "attack", damage: 16, desc: "白虎隊斉射" },
                { type: "buff", strength: 3, desc: "死守の命" },
                { type: "attack", damage: 26, desc: "義理不抜の猛撃" }
            ]
        },
        "act2_boss_saigo": {
            name: "薩摩軍総督・西郷隆盛",
            maxHp: 170,
            isBoss: true,
            sprite: "saigo_boss",
            intents: [
                { type: "attack", damage: 18, desc: "薬丸自顕流・初太刀" },
                { type: "defend", shield: 20, desc: "薩摩隼人の気迫" },
                { type: "attack", damage: 28, desc: "桜島大噴火撃" },
                { type: "buff", strength: 4, desc: "敬天愛人" }
            ]
        },

        // ACT 3: 江戸城 / 京都御所 決戦
        "act3_final_yoshinobu": {
            name: "征夷大将軍・徳川慶喜",
            maxHp: 240,
            isFinalBoss: true,
            sprite: "yoshinobu_boss",
            intents: [
                { type: "defend", shield: 25, desc: "徳川三百年の方陣" },
                { type: "attack", damage: 20, desc: "幕府新鋭砲兵斉射" },
                { type: "curse", curseId: "curse_extraterritoriality", damage: 10, desc: "列強外交の重圧" },
                { type: "attack", damage: 32, desc: "双極の終焉・葵の裁き" }
            ]
        },
        "act3_final_kangun": {
            name: "新政府官軍総司令部",
            maxHp: 250,
            isFinalBoss: true,
            sprite: "kangun_boss",
            intents: [
                { type: "attack", damage: 22, desc: "錦旗の下での総進軍" },
                { type: "defend", shield: 28, desc: "御所親衛陣" },
                { type: "buff", strength: 5, desc: "討幕の宣誓" },
                { type: "attack", damage: 34, desc: "新時代への鉄槌" }
            ]
        }
    },

    // ==========================================
    // 5. 歴史的分岐イベント
    // ==========================================
    events: [
        {
            id: "event_ikedaya",
            title: "池田屋事件の急襲",
            desc: "三条小橋の旅籠「池田屋」に不逞志士が集結しているとの報せが入った。夜雨の中、提灯の明かりが揺れる。",
            choices: [
                {
                    text: "先陣を切って斬り込む（戦闘リスク大・高報酬）",
                    effectDesc: "HPを 10 失うが、強力なレリックと 60両 を獲得。",
                    action: (app) => {
                        app.damagePlayer(10);
                        app.gold += 60;
                        app.obtainRandomRelic();
                    }
                },
                {
                    text: "裏手を固め、逃走者を捕縛する（堅実）",
                    effectDesc: "カードを1枚デッキから削除し、30両 を獲得。",
                    action: (app) => {
                        app.gold += 30;
                        app.openCardRemovalModal();
                    }
                },
                {
                    text: "深入りを避け、情報のみ持ち帰る",
                    effectDesc: "HPを 12 回復する。",
                    action: (app) => {
                        app.healPlayer(12);
                    }
                }
            ]
        },
        {
            id: "event_glover",
            title: "長崎グラバー商会の密談",
            desc: "英国商人トーマス・グラバーが新式の洋式火器を前に、妖しい微笑みを浮かべている。「貴国の未来のために、格安で最新の兵器を用立てましょう…ただし代償は条約で」",
            choices: [
                {
                    text: "莫大な借款契約を結び、最新火器を受け取る",
                    effectDesc: "『新式ミニエ銃』と 80両 を獲得するが、【列強介入+15%】＆呪い『治外法権の受容』が混入！",
                    action: (app) => {
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
                    effectDesc: "【列強介入-8%】。気迫により最大HP+4。",
                    action: (app) => {
                        app.modifyImperialGauge(-8);
                        app.maxHp += 4;
                        app.hp += 4;
                    }
                }
            ]
        },
        {
            id: "event_teradaya",
            title: "伏見・寺田屋の遭難",
            desc: "深夜、宿が幕府捕吏に包囲された！「上意討ちである！」襖を蹴破る足音が響く。",
            choices: [
                {
                    text: "隠し持った高杉晋作のピストルで応戦！",
                    effectDesc: "HP 8 ダメージを受けるが、敵を撃退しレリック『西洋懐中時計』を獲得。",
                    action: (app) => {
                        app.damagePlayer(8);
                        app.obtainRelic("pocket_watch");
                    }
                },
                {
                    text: "お龍の機転に従い、裏庭から脱出する",
                    effectDesc: "HPを 10 回復し、山札の全カードを把握する。",
                    action: (app) => {
                        app.healPlayer(10);
                    }
                }
            ]
        },
        {
            id: "event_taisei_hokan",
            title: "大政奉還の歴史的評議",
            desc: "徳川慶喜が政権を朝廷に返上するか否か、天下を揺るがす建白書が突きつけられた。",
            choices: [
                {
                    text: "内戦を避け、平和的政権移行を後押しする",
                    effectDesc: "【列強介入-12%】。全カードの最大HP+5＆完全回復。",
                    action: (app) => {
                        app.modifyImperialGauge(-12);
                        app.maxHp += 5;
                        app.hp = app.maxHp;
                    }
                },
                {
                    text: "旧勢力の完全排除を主張し、決戦を挑む",
                    effectDesc: "デッキに『アームストロング砲』を追加。次の戦闘で攻撃力倍増。",
                    action: (app) => {
                        app.addCardToDeck("weapon_armstrong");
                        app.nextBattleStrengthBuff = 6;
                    }
                }
            ]
        }
    ]
};

