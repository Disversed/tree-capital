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
        this.age = 21; // Начальный уровень (возраст) игрока
        this.maxAge = 65; // Уровень (возраст) окончания игры
        this.ageLevelProgress = 0.0; // Прогресс уровня (от 0.0 до 100.0). После перехода на новый уровень сбрасывается на 0.0
        this.ageLevelGainOnTap = 25.0; // Увеличение прогресса уровня за клик по дереву
        this.ageLevelGainOnDelay = 0.5; // Автоматическое увеличение прогресса уровня за промежуток времени
        this.isTreeActive = false; // Состояние роста дерева ДНПС (может стать активным только раз, далее состояние не меняется)
        this.isShieldActive = false; // Состояние щита НСЖ
        this.shieldDurationProgress = 100.0 // Прогресс оставшегося действия щита НСЖ (от 100.0 до 0.0)

        // Кнопки улучшений
        this.btnApple = document.getElementById('income-upgrade-button');
        this.btnShield = document.getElementById('shield-upgrade-button');

        // Хар-ки улучшений дохода
        this.incomeLevel = 1;
        this.incomeLevelUpCost = 500; // Кол-во яблок, необходимое для улучшения дохода
        this.ageLevelUpBonusApples = 100; // Кол-во яблок, получаемое игроком за новый уровень
        this.applesGainOnTap = 10; // Кол-во яблок, получаемое игроком за клик по дереву

        // Хар-ки улучшений щита НСЖ
        this.shieldLevel = 1;
        this.shieldCostPerLevel = 50;
        this.shieldLevelUpCost = 500; // Кол-во яблок, необходимое для улучшения щита НСЖ
        this.shieldDuration = 5 // Продолжительность действия щита (кол-во лет)
        this.shieldInsurancePayoutPercent = 0.5 // Доля убытков, которая будет возмещена при страховом случае
        this.shieldCumulativeBonusApples = 200; // Бонус яблок, начисляемый при окончании действия щита НСЖ

        // Настройки событий нажатия кнопок улучшений
        if (this.btnApple)
            this.btnApple.addEventListener('click', () => this.showIncomeUpgradePopup());
        if (this.btnShield)
            this.btnShield.addEventListener('click', () => this.showShieldActivationPopup());
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
        this.scene.pause();
        alert(`Игра окончена! Ваш итоговый капитал: ${this.apples} яблок!`);
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
        if (this.ageLevelProgress >= 100) {
            this.ageLevelUp();
            return;
        }
        
        this.ageLevelProgress += deltaProgress;
        this.uiHandler.updatePlayerAgeBar(this.ageLevelProgress);
    }

    // Поднять уровень (возраст)
    ageLevelUp() {
        this.updateAge(this.age + 1);
        this.updateApples(this.apples + this.ageLevelUpBonusApples);
        this.ageLevelProgress = 0.0;

        if (this.shieldDurationProgress > 0.0 && this.isShieldActive) {
            this.decreaseShieldDurationOnLevelUp();
        }

        switch (this.age) {
            case 30:
                this.tree.setTexture('growing-sapling-1');
                break;
            case 45:
                this.tree.setTexture('growing-sapling-2');
                break;
            case 55:
                this.tree.setTexture('strong-tree');
                break;
            default:
                return;
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
    toggleShield(isActive) {
        if (isActive === this.isShieldActive)
            return;

        if (isActive) {
            this.shieldDurationProgress = 100.0;
            this.decreaseShieldDurationOnLevelUp();
            this.showShieldDurationPopup();
            this.btnShield.addEventListener('click', () => this.showShieldUpgradePopup());
        }
        else {
            this.hideShieldDurationPopup();
            this.btnShield.addEventListener('click', () => this.showShieldActivationPopup());
            // Логика начисления бонуса при деактивации щита НСЖ
        }

        this.isShieldActive = isActive;
        this.shield.visible = isActive;
    }

    // Уменшить длительность щита НСЖ
    decreaseShieldDurationOnLevelUp() {
        this.shieldDurationProgress += -1 / this.shieldDuration * 100;
        this.uiHandler.updateShieldDurationBar(this.shieldDurationProgress);
        this.uiHandler.updateShieldDurationRemainCounter(this.shieldDuration * this.shieldDurationProgress / 100);

        // Логика проверки баланса игрока и снятия очков за поддержание щита НСЖ (продумать случай нехватки очков)

        if (this.shieldDurationProgress <= 0.0) {
            this.toggleShield(false);
            return;
        }
    }

    // Попап для включения щита НСЖ
    showShieldActivationPopup() {
        let popupShieldUpgrade = {
            title: "Щит НСЖ",
            subtitle: `НСЖ (Накопительное страхование жизни)`,
            description: "Работает как 2 в 1: защищает сбережения от рисков и увеличивает ваш капитал. Плата взимается за каждый цикл.",
            
            eventIcon: this.cache.text.get("shield-activation-icon"),
            
            primaryButtonText: `Активировать за ${this.shieldCostPerLevel}`,
            primaryButtonIcon: this.cache.text.get("apple-icon"),
            secondaryButtonText: "Позже",
            
            onPrimaryClick: () => {
                // Логика проверки баланса игрока
                this.toggleShield(true);
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
                // Логика проверки баланса игрока
                // Логика улучшения щита
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
                // Логика проверки баланса игрока
               // Логика улучшения дохода
            },
        };

        this.uiHandler.showPopup(popupShieldUpgrade);
    }
}