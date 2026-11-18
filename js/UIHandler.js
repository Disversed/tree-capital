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

        if (data.primaryButtonIsActive == null) data.primaryButtonIsActive = true;

        // Основная иконка
        if (this.popupEventIcon) {
            this.popupEventIcon.innerHTML = data.eventIcon || '';
        }

        // Флаг для защиты от случайных кликов (изначально кнопки заблокированы)
        let isPopupInteractive = false;
        const unlockTimeout = setTimeout(() => {
            isPopupInteractive = true;
        }, 500);

        // Настройка основной кнопки
        if (this.popupPrimaryBtn) {
            if (data.primaryButtonIsActive) {
                this.popupPrimaryBtn.classList.remove('disabled');
            }
            else {
                this.popupPrimaryBtn.classList.add('disabled');
            }
        }

        if (this.popupPrimaryBtn && data.onPrimaryClick) {
            if (this.popupPrimaryBtnText) {
                this.popupPrimaryBtnText.innerText = data.primaryButtonText || 'Ок';
            }
            
            // Очищаем старые обработчики и вешаем новый
            this.popupPrimaryBtn.onclick = () => {
                if (!isPopupInteractive) return;
                clearTimeout(unlockTimeout);

                if (data.primaryButtonIsActive) {
                    data.onPrimaryClick();
                    if (data.closeOnPrimary !== false) {
                        this.hidePopup();
                    }
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
                this.popupSecondaryBtn.innerText = data.secondaryButtonText;
                this.popupSecondaryBtn.onclick = () => {
                    if (!isPopupInteractive) return;
                    clearTimeout(unlockTimeout);
                    
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
    },



    // Конфиг для соцсетей
    shareConfig: {
        url: 'https://stravita.by/game/',
        imageUrl: 'https://stravita.by/game/share.jpg',
        title: 'Игра Stravita: ваше будущее принесло плоды!',
        text: 'Мой урожай — {apples} яблок!\nА сколько накопите вы?',
        photoUrl: ''
    },

    enabledNetworks: ['tg', 'vk'],
    currentApples: 0, // Храним текущие яблоки прямо в объекте, чтобы не терять видимость

    // Показать финальный экран
    showResultScreen(applesCount) {
        this.currentApples = applesCount; // Сохраняем для использования в других методах
        const resultScreen = document.getElementById('result-screen');
        const sharePopup = document.getElementById('share-popup');
        const shareButtonsContainer = document.getElementById('share-buttons');
        
        document.getElementById('result-apples').textContent = applesCount;
        
        if (this.shareConfig.photoUrl) {
            document.getElementById('result-photo').style.backgroundImage = `url("${this.shareConfig.photoUrl}")`;
        }

        // Рендер кнопок шеринга
        const enc = encodeURIComponent;
        const networks = {
            tg: { name: 'Telegram',   link: (c, t) => `https://t.me/share/url?url=${enc(c.url)}&text=${enc(t)}` },
            vk: { name: 'ВКонтакте',  link: (c, t) => `https://vk.com/share.php?url=${enc(c.url)}&title=${enc(c.title)}&comment=${enc(t)}&image=${enc(c.imageUrl)}&noparse=true` }
        };

        const postText = this.shareConfig.text.replace('{apples}', applesCount.toLocaleString('ru-RU'));
        document.getElementById('share-text').textContent = postText;
        
        shareButtonsContainer.innerHTML = '';
        this.enabledNetworks.forEach((key) => {
            const net = networks[key];
            const a = document.createElement('a');
            a.className = 'simple-green-button text-btn';
            a.href = net.link(this.shareConfig, postText);
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = net.name;
            shareButtonsContainer.appendChild(a);
        });

        const openShareBtn = document.getElementById('open-share-button');
        openShareBtn.onclick = () => {
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            
            // Проверяем нативку
            if (isMobile && navigator.share) {
                this.shareResultAsImage(); // Вызываем через this, чтобы метод нашлся
            } else {
                sharePopup.classList.add('visible');
            }
        };

        const closeShare = () => sharePopup.classList.remove('visible');
        document.getElementById('close-share-button').onclick = closeShare;
        document.getElementById('back-to-results-button').onclick = closeShare;

        // Открываем финальный экран
        resultScreen.classList.add('is-open');
    },

    // Функция нативного шеринга картинки (Способ 2)
    async shareResultAsImage() {
        const sharePopup = document.getElementById('share-popup');

        if (!navigator.share) {
            alert('Ваш браузер не поддерживает прямую отправку файлов.');
            sharePopup.classList.add('visible');
            return;
        }

        try {
            // Создаем временный холст для генерации открытки
            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1080;
            const ctx = canvas.getContext('2d');

            // Заливаем фон
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Рисуем текст
            ctx.fillStyle = '#0057a3';
            ctx.font = 'bold 60px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Мой результат в Stravita!', canvas.width / 2, 150);

            ctx.font = '50px sans-serif';
            ctx.fillText(`Накоплено яблок: ${this.currentApples}`, canvas.width / 2, 250);

            // Превращаем холст в файл (Blob)
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                
                const file = new File([blob], 'stravita-result.png', { type: 'image/png' });
                const shareData = {
                    title: 'Stravita Game',
                    text: `Мой урожай — ${this.currentApples} яблок! А сколько накопите вы?`,
                    files: [file]
                };

                try {
                    if (navigator.canShare && navigator.canShare(shareData)) {
                        await navigator.share(shareData);
                    } else {
                        this.downloadBlobAsFile(blob, 'stravita-result.png');
                    }
                } catch (err) {
                    console.log('Шеринг отменен или не удался', err);
                }
            }, 'image/png');

        } catch (error) {
            console.error('Ошибка при создании картинки для шеринга:', error);
            sharePopup.classList.add('visible');
        }
    },

    // Вспомогательная функция для скачивания файла на ПК
    downloadBlobAsFile(blob, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }

};

