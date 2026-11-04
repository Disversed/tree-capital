window.UIHandler = {
    init(scene) {
        this.scene = scene;


        this.applesEl = document.getElementById('apple-score');
        this.ageEl = document.getElementById('player-age');
        this.ageProgressBarEl = document.getElementById('age-progress-bar');
        this.shieldDurationBarEl = document.getElementById('shield-duration-bar');
        this.shieldDurationRemainCounterEl = document.getElementById('shield-duration-remain-counter');
        

        this.popupOverlay = document.getElementById('game-popup');
        this.popupCloseBtn = document.getElementById('popup-close-btn');
        this.popupTitle = document.getElementById('popup-title');
        this.popupSubtitle = document.getElementById('popup-subtitle');
        this.popupDesc = document.getElementById('popup-desc');
        this.popupEventIcon = document.getElementById('popup-icon-container');
        this.popupPrimaryBtn = document.getElementById('popup-primary-btn');
        this.popupPrimaryBtnText = document.getElementById('popup-primary-btn-text');
        this.popupPrimaryBtnIcon = document.getElementById('popup-primary-btn-icon');
        this.popupSecondaryBtn = document.getElementById('popup-secondary-btn');

        if (this.popupCloseBtn) {
            this.popupCloseBtn.addEventListener('click', () => this.hidePopup());
        }
        if (this.popupOverlay) {
            this.popupOverlay.addEventListener('click', (e) => {
                if (e.target === this.popupOverlay) {
                    this.hidePopup();
                }
            });
        }


        this.popupShieldDuration = document.getElementById('shield-duration-popup');
    },

    // Обновление кол-ва яблок / игрового счета
    updateApplesCount(newApples) {
        if (newApples < 0) throw Error('Invalid apples count.');
        if (this.applesEl) this.applesEl.innerText = newApples;
    },

    // Обновление возраста игрока
    updatePlayerAge(newAge) {
        if (newAge < 1) throw Error('Invalid age value.');
        if (this.ageEl) this.ageEl.innerText = Math.floor(newAge);
    },

    // Обновление прогресса цикла игрока
    updatePlayerAgeBar(newProgressValue = 0.0) {
        if (newProgressValue < 0) newProgressValue = 0;
        if (newProgressValue > 100) newProgressValue = 100;
        if (this.ageProgressBarEl) {
            this.ageProgressBarEl.style.width = newProgressValue + '%';
        }
    },

    // Обновление длительности активного щита НСЖ
    updateShieldDurationBar(newProgressValue = 0.0) {
        if (newProgressValue < 0) newProgressValue = 0;
        if (newProgressValue > 100) newProgressValue = 100;
        if (this.shieldDurationBarEl) {
            this.shieldDurationBarEl.style.width = newProgressValue + '%';
        }
    },

    // Обновить остаток лет действия щита НСЖ
    updateShieldDurationRemainCounter(newValue = 0) {
        if (newValue < 0) newValue = 0;
        if (newValue > 100) newValue = 100;
        if (this.shieldDurationRemainCounterEl) {
            this.shieldDurationRemainCounterEl.innerHTML = newValue;
        }
    },

    // Открыть попап
    showPopup(data) {
        if (!this.popupOverlay) return;

        this.scene.pauseGame();

        // Текст попапа
        if (this.popupTitle) this.popupTitle.innerText = data.title || '';
        if (this.popupSubtitle) this.popupSubtitle.innerText = data.subtitle || '';
        if (this.popupDesc) this.popupDesc.innerText = data.description || '';

        // Основная иконка
        if (this.popupEventIcon) {
            this.popupEventIcon.innerHTML = data.eventIcon || '';
        }

        // Настройка основной кнопки
        if (this.popupPrimaryBtn && data.onPrimaryClick) {
            this.popupPrimaryBtn.style.display = 'flex';
            if (this.popupPrimaryBtnText) {
                this.popupPrimaryBtnText.innerText = data.primaryButtonText || 'Ок';
            }
            
            // Очищаем старые обработчики и вешаем новый
            this.popupPrimaryBtn.onclick = () => {
                data.onPrimaryClick();
                if (data.closeOnPrimary !== false) {
                    this.hidePopup();
                }
            };

            // Иконка основной кнопки (может отсутствовать)
            if (this.popupPrimaryBtnIcon) {
                this.popupPrimaryBtnIcon.innerHTML = data.primaryButtonIcon || '';
            }

        } else if (this.popupPrimaryBtn) {
            this.popupPrimaryBtn.style.display = 'none';
        }

        // Настройка второстепенной кнопки
        if (this.popupSecondaryBtn) {
            if (data.secondaryButtonText) {
                this.popupSecondaryBtn.style.display = 'block';
                this.popupSecondaryBtn.innerText = data.secondaryButtonText;
                this.popupSecondaryBtn.onclick = () => {
                    if (data.onSecondaryClick) data.onSecondaryClick();
                    this.hidePopup();
                };
            } else {
                this.popupSecondaryBtn.style.display = 'none';
            }
        }

        this.popupOverlay.classList.add('visible');
    },

    // Скрыть попап
    hidePopup() {
        if (this.popupOverlay) {
            this.popupOverlay.classList.remove('visible');

            this.scene.resumeGame();
        }
    },


    // Открыть попап продолжительности действия щита НСЖ
    showShieldDurationPopup() {
        if (this.popupShieldDuration) {
            this.popupShieldDuration.classList.add('visible');
        }
    },

    // Скрыть попап продолжительности действия щита НСЖ
    hideShieldDurationPopup() {
        if (this.popupShieldDuration) {
            this.popupShieldDuration.classList.remove('visible');
        }
    },


    // Показать подсказку
    showHint(text) {
        const overlay = document.getElementById('hint-overlay');
        const textEl = document.getElementById('hint-text');

        if (textEl) textEl.innerText = text;

        overlay.classList.add('visible');

        overlay.onclick = () => {
            this.hideHint();
        };
    },

    // Скрыть подсказку
    hideHint() {
        const overlay = document.getElementById('hint-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
        }
    }
};