class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    init() {
        // Настройка связи с интерфейсом окна
        this.uiHandler = window.UIHandler;
        if (this.uiHandler === null) {
            throw Error("No UI handler has been found.")
        }

        // Начальное игровое состояние
        this.updateDelay = 50;  // Промежуток времени (мс)

        this.apples = 0; // Cчет игрока (кол-во яблок)
        this.ageMin = 10; // Уровень (возраст) в начале игры 
        this.age = this.ageMin; // Уровень (возраст) игрока
        this.ageMax = 65; // Уровень (возраст) окончания игры
        this.ageLevelProgress = 0.0; // Прогресс уровня (от 0.0 до 100.0). После перехода на новый уровень сбрасывается на 0.0
        this.ageLevelGainOnTap = 30.0; // Увеличение прогресса уровня за клик по дереву
        this.ageLevelGainOnDelay = 0.5; // Автоматическое увеличение прогресса уровня за промежуток времени
        this.isTreeActive = false; // Состояние роста дерева ДНПС 
        this.isShieldActive = false; // Состояние щита НСЖ
        this.shieldDurationProgress = 100.0 // Прогресс оставшегося действия щита НСЖ (от 100.0 до 0.0)
        this.taxEventsRemained = 2; // Кол-во событий, связанных с налогами, которое может произойти за игровую сессию
        this.crisisEventsRemained = 2 // Кол-во событий, связанных с кризисными ситуациями, которое может произойти за игровую сессию
        this.inflationEventsRemained = 2; // Кол-во событий, связанных с инфляцией яблок

        // Кнопки улучшений
        this.btnApple = document.getElementById('income-upgrade-button');
        this.btnShield = document.getElementById('shield-upgrade-button');

        // Хар-ки дерева ДНПС
        this.treeFertilizingCostPerLevel = 50;
        this.ageTreeActivation = 0;
        this.DnpsContributionCount = 0;

        // Хар-ки улучшений дохода
        this.incomeLevel = 1;
        this.incomeLevelUpCost = 200; // Кол-во яблок, необходимое для улучшения дохода
        this.ageLevelUpBonusApples = 40; // Кол-во яблок, получаемое игроком за новый уровень
        this.applesGainOnTap = 10; // Кол-во яблок, получаемое игроком за клик по дереву

        // Хар-ки улучшений щита НСЖ
        this.shieldLevel = 1;
        this.shieldCostPerLevel = 50;
        this.shieldLevelUpCost = 200; // Кол-во яблок, необходимое для улучшения щита НСЖ
        this.shieldDuration = 10 // Продолжительность действия щита (кол-во лет)
        this.shieldInsurancePayoutPercent = 0.25 // Доля убытков, которая будет возмещена при страховом случае
        this.shieldCumulativeBonusApples = this.shieldCostPerLevel * this.shieldDuration + this.shieldDuration * 10; // Бонус яблок, начисляемый при окончании действия щита НСЖ

        // Настройки событий нажатия кнопок улучшений
        if (this.btnApple) {
            this.btnApple.addEventListener('click', () => {
                if (this.isTreeActive)
                    this.showIncomeUpgradePopup()
                else
                    this.showDnpsActivationPopup();
            });
        }
        this.setAppleButtonAvailablility(false);

        if (this.btnShield) {
            this.btnShield.addEventListener('click', () => {
                if (this.isShieldActive)
                    this.showShieldUpgradePopup()
                else
                    this.showShieldActivationPopup();
            });
        }
        this.setShieldButtonAvailablility(false);

    }

    // Метод разблокировки / блокировки кнопки яблок в UI
    setAppleButtonAvailablility(isAvailable) {
        if (!this.btnApple) 
            return;

        if (isAvailable) {
            this.btnApple.removeAttribute('disabled');
        } else {
            this.btnApple.setAttribute('disabled', 'true');
        }
    }

    // Метод разблокировки / блокировки кнопки щита в UI
    setShieldButtonAvailablility(isAvailable) {
        if (!this.btnShield) 
            return;

        if (isAvailable) {
            this.btnShield.removeAttribute('disabled');
        } else {
            this.btnShield.setAttribute('disabled', 'true');
        }
    }

    preload() {
        // Игровые объекты
        this.load.svg('ground', 'assets/tree-sprites/ground.svg', {
            scale: 0.8
        });
        this.load.svg('weak-sapling', 'assets/tree-sprites/weak-sapling.svg', {
            scale: 0.8
        });
        this.load.svg('growing-sapling-1', 'assets/tree-sprites/growing-sapling-1.svg', {
            scale: 0.8
        });
        this.load.svg('growing-sapling-2', 'assets/tree-sprites/growing-sapling-2.svg', {
            scale: 0.8
        });
        this.load.svg('strong-tree', 'assets/tree-sprites/strong-tree.svg', {
            scale: 0.8
        });
        this.load.svg('shield', 'assets/shield-sprites/shield.svg', {
            scale: 0.8
        });

        // Иконки (svg)
        this.load.text('shield-upgrade-icon', 'assets/event-icons/shield_upgrade.svg');
        this.load.text('income-upgrade-icon', 'assets/event-icons/income_upgrade.svg');
        this.load.text('shield-activation-icon', 'assets/event-icons/shield_activation.svg');
        this.load.text('fertilizer-icon', 'assets/event-icons/fertilizer.svg');
        this.load.text('tornado-icon', 'assets/event-icons/tornado.svg');
        this.load.text('torn-bag-icon', 'assets/event-icons/torn_bag.svg');
        this.load.text('worms-icon', 'assets/event-icons/worms.svg');
        this.load.text('tree-icon', 'assets/event-icons/tree.svg');
        this.load.text('start-game-icon', 'assets/event-icons/start_game.svg');

        this.load.text('apple-icon', 'assets/hud-icons/apple.svg');
    }

    create() {
        const { width, height } = this.scale;
        
        this.ground = this.add.sprite(0, 0, 'ground');
        this.tree = this.add.sprite(0, 0, 'weak-sapling');
        this.shield = this.add.sprite(0, 0, 'shield');
        this.shield.visible = false;

        this.treeContainer = this.add.container(width / 2, height * 0.6, [
            this.ground,
            this.tree,
            this.shield
        ]);

        this.tree.setInteractive();
        this.tree.on('pointerdown', this.onTreeClicked, this);

        // Постепенное автоматическое накопление уровня
        this.time.addEvent({
            delay: this.updateDelay,
            callback: () => {
                this.addAgeLevelProgress(this.ageLevelGainOnDelay);
            },
            callbackScope: this,
            loop: true
        });

        // Инициализация UI
        if (window.UIHandler) {
            window.UIHandler.init(this);
        }

        this.updateAge(this.age);
                
        this.showWelcomePopup();
    }

    pauseGame() {
        this.scene.pause();

        this.children.list.forEach(child => {
            if (child.input) {
                child.disableInteractive();
            }
        });
    }

    resumeGame() {
        this.scene.resume();

        this.children.list.forEach(child => {
            if (child.setInteractive) {
                child.setInteractive();
            }
        });
    }

    endGame() {
        this.showEndGamePopup();
    }



    // Событие клика на дерево ДНПС
    onTreeClicked() {
        this.tree.setScale(1);
        this.tree.setY(0);
        this.tweens.killTweensOf(this.tree);

        this.addAgeLevelProgress(this.ageLevelGainOnTap);
        this.updateApples(this.apples + this.applesGainOnTap);
        
        // Анимация уменьшения/увеличения при клике
        this.tweens.add({
            targets: this.tree,
            scaleX: 1.05,
            scaleY: 1.05,
            y: this.tree.y - 5,
            duration: 100,
            yoyo: true
        });
    }

    // Обновить значение уровня (возраста)
    updateAge(newAge) {
        this.age = newAge;
        this.uiHandler.updatePlayerAge(this.age);
    }

    // Обновить счет игрока (кол-во яблок)
    updateApples(newApples) {
        this.apples = newApples;
        this.uiHandler.updateApplesCount(newApples);
    }

    // Добавить прогресс уровня (возраста)
    addAgeLevelProgress(deltaProgress = 0.0) {
        this.ageLevelProgress += deltaProgress;

        if (this.ageLevelProgress >= 100) {
            this.ageLevelUp();
            return;
        }
        else {
            this.uiHandler.updatePlayerAgeBar(this.ageLevelProgress);
        }
    }

    // Поднять уровень (возраст)
    ageLevelUp() {
        if (this.age >= this.ageMax) {
            this.showEndGamePopup();
            return;
        }

        this.updateAge(this.age + 1);
        this.updateApples(this.apples + this.ageLevelUpBonusApples);
        this.ageLevelProgress = 0.0;

        // СЮЖЕТНОЕ СОБЫТИЕ 1: Миф №3 (Ранний старт / Молодость)
        if (this.age === 13 && !this.isTreeActive) {
            this.showDnpsActivationPopup();
            this.setAppleButtonAvailablility(true);
        }

        // СЮЖЕТНОЕ СОБЫТИЕ 2: Знакомство со Щитом НСЖ (Миф №2)
        if (this.age === 20 && !this.isShieldActive) {
            this.showShieldActivationPopup();
            this.setShieldButtonAvailablility(true);
        }

        // СЮЖЕТНОЕ СОБЫТИЕ 3 (Миф №6): Середина пути (примерно 40 цикл)
        // Срабатывает, если дерево ДНПС было актировано ранее
        if (this.age === 40 && this.isTreeActive) {
            this.showMidGamePopup();
        }

        // Рандомное кризисное событие («Налоговые черви»):
        // Срабатывает случайно в диапазоне от 27 до 50 лет с шансом ~30% при переходе года, если еще не происходило
        if (this.taxEventsRemained > 0 && this.age >= 27 && this.age <= 50) {
            if (Math.random() < 0.1) {
                this.taxEventsRemained -= 1;
                this.showTaxCrisisPopup();
            }
        }

        // Рандомное событие: Торнадо (между 27 и 40 годами)
        if (this.crisisEventsRemained > 0 && this.age >= 30 && this.age <= 60) {
            if (Math.random() < 0.1) {
                this.crisisEventsRemained -= 1;
                this.showCrisisPopup();
            }
        }

        // Рандомное событие: Яблочная инфляция (Миф №1) — между 26 и 50 годами
        if (this.inflationEventsRemained && this.age >= 32 && this.age <= 50) {
            if (Math.random() < 0.1) {
                this.inflationEventsRemained -= 1;
                this.showInflationCrisisPopup();
            }
        }

        if (this.isShieldActive) {
            this.decreaseShieldDurationOnLevelUp();
        }

        if (this.isTreeActive) {
            this.executeDnpsContribution();

            switch (this.age) {
                case 30 + (this.ageTreeActivation - this.ageMin):
                    this.tree.setTexture('growing-sapling-1');
                    break;
                case 45 + (this.ageTreeActivation - this.ageMin):
                    this.tree.setTexture('growing-sapling-2');
                    break;
                case 55 + (this.ageTreeActivation - this.ageMin):
                    this.tree.setTexture('strong-tree');
                    break;
                default:
                    return;
            }
        }
    }



    // Отобразить попап продолжительности действия щита НСЖ
    showShieldDurationPopup() {
        this.uiHandler.showShieldDurationPopup();
    }

    // Скрыть попап продолжительности действия щита НСЖ
    hideShieldDurationPopup() {
        this.uiHandler.hideShieldDurationPopup();
    }

    // Активировать щит НСЖ
    toggleShield(isActive, isEarlyExit = false) {
        if (isActive === this.isShieldActive)
            return;

        if (isActive) {
            this.shieldDurationProgress = 100.0;

            this.uiHandler.updateShieldDurationBar(this.shieldDurationProgress);
            this.uiHandler.updateShieldDurationRemainCounter(this.shieldDuration * this.shieldDurationProgress / 100);
            
            this.showShieldDurationPopup();
        }
        else {
            let refundApples = this.shieldCumulativeBonusApples * (1 - this.shieldDurationProgress / 100);
            if (isEarlyExit) {
                // Штраф за досрочный выход: игрок теряет большую часть накопленного бонуса (выкупная сумма)
                refundApples *= 0.5;
            }
            this.updateApples(this.apples + refundApples);

            this.hideShieldDurationPopup();
        }

        this.isShieldActive = isActive;
        this.shield.visible = isActive;
    }

    // Уменьшить длительность щита НСЖ
    decreaseShieldDurationOnLevelUp() {
        if (this.apples >= this.shieldCostPerLevel) {
            this.updateApples(this.apples - this.shieldCostPerLevel);
        } else {
            this.showShieldEarlyExitPopup(true)
            return;
        }

        this.shieldDurationProgress += -1 / this.shieldDuration * 100;

        if (this.shieldDurationProgress <= 0.0) {
            this.toggleShield(false);
            return;
        }
        else {
            this.uiHandler.updateShieldDurationBar(this.shieldDurationProgress);
            this.uiHandler.updateShieldDurationRemainCounter(this.shieldDuration * this.shieldDurationProgress / 100);
        }
    }



    // Попап для включения щита НСЖ
    showShieldActivationPopup() {
        let popupShieldUpgrade = {
            title: "Щит НСЖ",
            subtitle: `НСЖ (Накопительное страхование жизни)`,
            description: "Работает как 2 в 1: сохраняет капитал при негативных событиях и гарантированно возвращает накопления с приростом в конце срока. Плата взимается за каждый цикл.",
            
            eventIcon: this.cache.text.get("shield-activation-icon"),
            
            primaryButtonText: `Активировать за ${this.shieldCostPerLevel}`,
            primaryButtonIcon: this.cache.text.get("apple-icon"),
            secondaryButtonText: "Позже",
            
            onPrimaryClick: () => {
                if (this.apples >= this.shieldCostPerLevel) {
                    this.toggleShield(true);
                } 
                else {
                    alert("Недостаточно яблок для активации щита!");
                }
            },
        };

        this.uiHandler.showPopup(popupShieldUpgrade);
    }

    // Попап для улучшения щита НСЖ
    showShieldUpgradePopup() {
        let popupShieldUpgrade = {
            title: "Улучшение щита НСЖ",
            subtitle: `Уровень ${this.shieldLevel} из 3`,
            description: "Срок действия щита НСЖ (Накопительное страхование жизни) увеличится на 5 игровых лет. Защитите урожай от потерь.",
            
            eventIcon: this.cache.text.get("shield-upgrade-icon"),
            
            primaryButtonText: `Улучшить за ${this.shieldLevelUpCost}`,
            primaryButtonIcon: this.cache.text.get("apple-icon"),
            secondaryButtonText: "Позже",
            
            onPrimaryClick: () => {
                if (this.shieldLevel >= 3) {
                    alert("Достигнут максимальный уровень щита!");
                    return;
                }

                if (this.apples >= this.shieldLevelUpCost) {
                    this.updateApples(this.apples - this.shieldLevelUpCost);
                    this.shieldLevel += 1;
                    this.shieldDuration += 5;
                    this.shieldLevelUpCost += 250; 
                } 
                else {
                    alert("Недостаточно яблок для улучшения щита!");
                }
            },
        };

        this.uiHandler.showPopup(popupShieldUpgrade);
    }


    // Попап для улучшения дохода
    showIncomeUpgradePopup() {
        let popupShieldUpgrade = {
            title: "Улучшение дохода",
            subtitle: `Уровень ${this.incomeLevel} из 3`,
            description: "Доход за каждый прожитый цикл увеличивается на 50 яблок.",
            
            eventIcon: this.cache.text.get("income-upgrade-icon"),
            
            primaryButtonText: `Улучшить за ${this.incomeLevelUpCost}`,
            primaryButtonIcon: this.cache.text.get("apple-icon"),
            secondaryButtonText: "Позже",
            
            onPrimaryClick: () => {
                if (this.incomeLevel >= 3) {
                    alert("Достигнут максимальный уровень дохода!");
                    return;
                }

                if (this.apples >= this.incomeLevelUpCost) {
                    this.updateApples(this.apples - this.incomeLevelUpCost);
                    this.incomeLevel += 1;
                    this.ageLevelUpBonusApples += 25;
                    this.applesGainOnTap += 2;
                    this.incomeLevelUpCost += 250;
                } 
                else {
                    alert("Недостаточно яблок для улучшения дохода!");
                }       
            },
        };

        this.uiHandler.showPopup(popupShieldUpgrade);
    }


    executeDnpsContribution() {
        let totalContribution = this.treeFertilizingCostPerLevel;
        totalContribution += this.isShieldActive ? this.shieldCostPerLevel : 0

        if (this.apples >= totalContribution) {
            this.updateApples(this.apples - this.treeFertilizingCostPerLevel);
            this.DnpsContributionCount += 1;
        } 
        else if (this.apples >= this.treeFertilizingCostPerLevel) {
            this.showShieldEarlyExitPopup(true);
        }
        else {
            alert("Недостаточно яблок для ухода за деревом ДНПС!");
        }
    }

    // Попап для активации дерева ДНПС (Миф №3 — ранний старт / взносы)
    showDnpsActivationPopup() {
        let dnpsPopup = {
            title: "Первый шаг к капиталу",
            subtitle: "",
            description: "Дерево ДНПС (Добровольное накопительное пенсионное страхование) только начинает расти. Приступите к уходу прямо сейчас: ранний старт делает взносы минимальными, а сложный процент за годы взрастит огромный капитал. Плата взимается за каждый цикл.",
            
            eventIcon: this.cache.text.get("fertilizer-icon"),
            
            primaryButtonText: `Начать удобрять за ${this.treeFertilizingCostPerLevel}`,
            primaryButtonIcon: this.cache.text.get("apple-icon"),
            
            onPrimaryClick: () => {
                if (this.apples >= this.treeFertilizingCostPerLevel) {
                    this.isTreeActive = true;
                    this.ageTreeActivation = this.age;
                } 
                else {
                    alert("Недостаточно яблок для ухода за деревом ДНПС!");
                }
            },

            // Доработать логику появления в случае отказа от предложения
        };

        this.uiHandler.showPopup(dnpsPopup);
    }

    // Попап кризисного события: Налоговая атака червей (Миф №5)
    showTaxCrisisPopup() {
        const taxLoss = Math.floor(this.apples * 0.20);
        let descriptionText = "";
        
        if (this.isShieldActive) {
            descriptionText = "Благодаря щиту НСЖ ваши накопления и выплаты полностью защищены от налоговых червей!";
        } else {
            descriptionText = `Свободные накопления не защищены государственными льготами, вы теряете часть урожая (-${taxLoss} яблок).`;
            if (this.apples >= taxLoss) {
                this.updateApples(this.apples - taxLoss);
            } else {
                this.updateApples(0);
            }
        }

        let taxPopup = {
            title: "Предупреждение!",
            subtitle: "Налоговые черви атакуют!",
            description: descriptionText,
            
            eventIcon: this.cache.text.get("worms-icon"),
            
            primaryButtonText: "Продолжить",

            onPrimaryClick: () => {

            },
        };

        this.uiHandler.showPopup(taxPopup);
    }

    // Попап кризисного события (Торнадо / Засуха)
    showCrisisPopup() {
        const baseLoss = Math.floor(this.apples * 0.5);
        let actualLoss = baseLoss;
        let description = "";
        let title = "";
        let subtitle = "";
        let iconKey = "";
        let type = Math.floor(Math.random() * 2);

        if (this.isShieldActive) {
            actualLoss = Math.floor(baseLoss * (1 - this.shieldInsurancePayoutPercent));
        }

        if (type === 0) {
            title = "Предупреждение!";
            subtitle = "Торнадо повредил ваши запасы!";
            iconKey = "tornado-icon";
            
            if (this.isShieldActive) {
                description = `Торнадо попытался разорвать ваши яблоки, но щит НСЖ спас ${this.shieldInsurancePayoutPercent * 100}% урожая.\n(-${actualLoss} яблок)`;
            } else {
                description = `Торнадо разорвал ваши запасы! Без защиты НСЖ вы несете полные потери.\n(-${actualLoss} яблок)`;
            }
        } else if (type === 1) {
            title = "Предупреждение!";
            subtitle = "Непредвиденный засушливый сезон!";
            iconKey = "torn-bag-icon";

            if (this.isShieldActive) {
                description = `Некоторые запасы ваших яблок были испорчены, но щит НСЖ спас ${this.shieldInsurancePayoutPercent * 100}% урожая.\n(-${actualLoss} яблок)`;
            } else {
                description = `Засуха испортила ваши запасы яблок! Без защиты НСЖ вы потеряли весь урожай этого сезона.\n(-${actualLoss} яблок)`;
            }
        }

        this.updateApples(this.apples - actualLoss);

        let crisisPopup = {
            title: title,
            subtitle: subtitle,
            description: description,
            eventIcon: this.cache.text.get(iconKey),
            
            primaryButtonText: "Продолжить",

            onPrimaryClick: () => {

            },
        };

        this.uiHandler.showPopup(crisisPopup);
    }

    // Попап сюжетного события: Миф №6 (Середина пути / ДНПС)
    showMidGamePopup() {
        let midGamePopup = {
            title: "Середина пути - не время расслабляться!",
            subtitle: `Вы достигли ${this.age} цикла!`,
            description: "Кажется, что до финиша еще далеко и можно сделать паузу в накоплениях ДНПС. Но именно сейчас закладывается фундамент вашего будущего капитала - останавливаться нельзя!",
            
            eventIcon: this.cache.text.get("tree-icon"),
            
            primaryButtonText: "Продолжить вклады",
            secondaryButtonText: "Сделать паузу",
            
            onPrimaryClick: () => {
                // Игрок делает правильный финансовый выбор:
                // ДНПС остается активным, сложный процент продолжит работать на полную мощность
            },

            onSecondaryClick: () => {
                // Игрок поддается мифу и делает паузу:
                // Приостанавливаем активный рост ДНПС
                this.isTreeActive = false;
            }
        };

        this.uiHandler.showPopup(midGamePopup);
    }

    // Попап досрочного расторжения НСЖ (Миф №4)
    showShieldEarlyExitPopup(isInsufficientFunds = false) {
        let titleText = "Деактивация щита";
        let subtitleText = "Досрочное расторжение НСЖ";
        let descriptionText = "Ваш щит НСЖ (Накопительного страхования жизни) рассчитан на долгий срок. Если забрать средства прямо сейчас, до окончания программы, вы получите лишь выкупную сумму - часть накоплений сгорит, а также придется вернуть полученный налоговый вычет.";
        
        let primaryText = "Оставить щит";
        let secondaryText = "Деактивировать щит с потерями";
        
        let hasPrimary = true;

        // Если деактивация происходит из-за нехватки средств для продления
        if (isInsufficientFunds) {
            subtitleText = "Досрочное расторжение НСЖ";
            descriptionText = "Недостаточно яблок для продления действия щита! Программа прекращается досрочно: вы получаете выкупную сумму, часть накоплений сгорает из-за досрочного прекращения взносов.";
            
            primaryText = null;
            secondaryText = "Понятно";
            hasPrimary = false;
        }

        let earlyExitPopup = {
            title: titleText,
            subtitle: subtitleText,
            description: descriptionText,
            
            eventIcon: this.cache.text.get("shield-activation-icon"),
            
            primaryButtonText: primaryText,
            secondaryButtonText: secondaryText,
            
            onPrimaryClick: hasPrimary ? () => {
                // Игрок принимает правильное решение и оставляет защиту
            } : null,

            onSecondaryClick: () => {
                this.toggleShield(false, true);
            }
        };

        this.uiHandler.showPopup(earlyExitPopup);
    }

    // Попап кризисного события: Яблочная инфляция (Миф №1)
    showInflationCrisisPopup() {
        const inflationLoss = Math.floor(this.apples * 0.5); // Ущерб от инфляции по макету
        
        // Инфляция бьет по свободным яблокам на балансе игрока, 
        // но средства в ДНПС или под щитом НСЖ защищены индексацией.
        // Если свободных яблок меньше, списываем сколько есть (до 0).
        if (this.apples > 0) {
            this.updateApples(this.apples - inflationLoss);
        }

        let inflationPopup = {
            title: "Предупреждение!",
            subtitle: "Яблочная инфляция!",
            description: `Часть ваших яблок на счете засохла (-${inflationLoss} яблок). Яблоки вложенные в дерево ДНПС и щит НСЖ не были тронуты, так как защищены индексацией/процентом.`,
            
            eventIcon: this.cache.text.get("torn-bag-icon"),
            
            primaryButtonText: "Понятно",
            onPrimaryClick: () => {

            }
        };

        this.uiHandler.showPopup(inflationPopup);
    }


    // Приветственный экран
    showWelcomePopup() {
        let welcomePopup = {
            title: "Добро пожаловать!",
            subtitle: "Путь к финансовой независимости",
            description: "Вам предстоит пройти жизненный путь от 10 до 65 лет. Выращивайте дерево ДНПС, принимайте грамотные финансовые решения, щит НСЖ и свою смекалку, чтобы защитить капитал от кризисов и сформировать надежное будущее!",
            
            eventIcon: this.cache.text.get("start-game-icon"),
            
            primaryButtonText: "Начать игру",
            
            onPrimaryClick: () => {

            }
        };

        this.uiHandler.showPopup(welcomePopup);
    }

    // Экран окончания игры
    showEndGamePopup() {
        let finalRating = "Отличный результат!";
        if (this.apples < 3000) {
            finalRating = "Вам есть к чему стремиться! Попробуйте применить другую тактику финансового планирования.";
        } else if (this.apples >= 7000) {
            finalRating = "Великолепно! Вы настоящий мастер финансового планирования!";
        }

        let victoryPopup = {
            title: "Игра завершена!",
            subtitle: `Вы достигли возраста ${this.ageMax} лет!`,
            description: `Ваш итоговый капитал составил: \n${this.apples} яблок. \n${finalRating}`,
            
            eventIcon: this.cache.text.get("income-upgrade-icon"),
            
            primaryButtonText: "Начать заново",
            
            onPrimaryClick: () => {
                // Перезапуск текущей сцены
                this.scene.restart();
            }
        };

        this.uiHandler.showPopup(victoryPopup);
    }
}