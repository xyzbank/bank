// Основной игровой объект
class BankCardGame {
    constructor() {
        this.gameData = {
            balance: 1000,
            clickValue: 10,
            passiveIncome: 10.5,
            totalEarned: 1000,
            level: 1,
            exp: 0,
            nextLevelExp: 1000,
            
            upgrades: {
                clickPower: { level: 1, baseCost: 100, cost: 100, multiplier: 1.2 },
                passiveIncome: { level: 1, baseCost: 500, cost: 500, multiplier: 1.5 },
                luck: { level: 1, baseCost: 300, cost: 300, multiplier: 1.3 }
            },
            
            office: {
                level: 1,
                exp: 0,
                nextLevelExp: 5000,
                upgrades: {
                    security: { level: 1, cost: 10000, incomeMultiplier: 1.1 },
                    terminals: { level: 1, cost: 15000, incomeMultiplier: 1.2 },
                    staff: { level: 1, cost: 20000, incomeMultiplier: 1.3 }
                }
            },
            
            cards: [
                { id: 1, name: "Основная карта", type: "platinum", incomeBonus: 1.0, lastDigits: "1234" }
            ],
            
            transactions: [],
            
            playerId: this.generatePlayerId(),
            lastSaveTime: Date.now()
        };
        
        this.init();
    }
    
    // Генерация уникального ID игрока
    generatePlayerId() {
        // Используем localStorage для хранения постоянного ID
        let storedId = localStorage.getItem('bankCardPlayerId');
        if (!storedId) {
            // Генерируем новый ID: префикс + случайная строка + timestamp
            const prefix = "BANK";
            const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
            const timestamp = Date.now().toString(36).toUpperCase();
            storedId = `${prefix}-${randomStr}-${timestamp}`;
            localStorage.setItem('bankCardPlayerId', storedId);
        }
        return storedId;
    }
    
    // Инициализация игры
    init() {
        this.loadGame();
        this.setupEventListeners();
        this.renderGame();
        this.startGameLoop();
        
        // Показываем ID игрока
        document.getElementById('player-id').textContent = this.gameData.playerId;
    }
    
    // Загрузка сохраненной игры
    loadGame() {
        const savedGame = localStorage.getItem('bankCardGameData');
        if (savedGame) {
            try {
                const parsed = JSON.parse(savedGame);
                // Объединяем сохраненные данные с дефолтными
                Object.assign(this.gameData, parsed);
                
                // Обновляем ID из localStorage
                const storedId = localStorage.getItem('bankCardPlayerId');
                if (storedId) {
                    this.gameData.playerId = storedId;
                }
                
                this.showNotification('Игра загружена!', 'success');
            } catch (e) {
                console.error('Ошибка загрузки игры:', e);
            }
        }
    }
    
    // Сохранение игры
    saveGame() {
        this.gameData.lastSaveTime = Date.now();
        localStorage.setItem('bankCardGameData', JSON.stringify(this.gameData));
        this.showNotification('Игра сохранена!', 'success');
    }
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Клик по основной карте
        document.getElementById('click-btn').addEventListener('click', () => this.handleClick());
        
        // Копирование ID
        document.getElementById('copy-id-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(this.gameData.playerId);
            this.showNotification('ID скопирован в буфер обмена!', 'success');
        });
        
        // Перевод денег
        document.getElementById('transfer-btn').addEventListener('click', () => this.handleTransfer());
        
        // Создание новой карты
        document.getElementById('create-card-btn').addEventListener('click', () => this.showCardModal());
        document.getElementById('confirm-create-card').addEventListener('click', () => this.createCard());
        
        // Управление модальным окном
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('card-modal').style.display = 'none';
        });
        
        // Изменение типа карты в модальном окне
        document.getElementById('card-type').addEventListener('change', () => this.updateCardPreview());
        
        // Сохранение и сброс
        document.getElementById('save-btn').addEventListener('click', () => this.saveGame());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());
        
        // Закрытие модального окна при клике вне его
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('card-modal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Обработка клика по карте
    handleClick() {
        // Базовый заработок
        let earned = this.gameData.clickValue;
        
        // Бонус от уровня удачи
        const luckBonus = 1 + (this.gameData.upgrades.luck.level * 0.05);
        earned *= luckBonus;
        
        // Случайный бонус (1-5% шанс на x2-x10)
        if (Math.random() < 0.01 * this.gameData.upgrades.luck.level) {
            const multiplier = Math.floor(Math.random() * 9) + 2;
            earned *= multiplier;
            this.showNotification(`УДАЧА! x${multiplier} к заработку!`, 'warning');
        }
        
        this.gameData.balance += earned;
        this.gameData.totalEarned += earned;
        
        // Добавление опыта
        this.addExp(earned / 10);
        
        // Обновление отображения
        this.updateBalance();
        
        // Анимация
        this.createClickAnimation(earned);
    }
    
    // Создание анимации клика
    createClickAnimation(amount) {
        const btn = document.getElementById('click-btn');
        const popup = document.createElement('div');
        popup.className = 'click-popup';
        popup.textContent = `+${amount.toFixed(2)} ₽`;
        popup.style.position = 'absolute';
        popup.style.color = '#2ecc71';
        popup.style.fontWeight = 'bold';
        popup.style.pointerEvents = 'none';
        popup.style.zIndex = '100';
        
        btn.appendChild(popup);
        
        // Анимация
        let pos = 0;
        const animate = () => {
            pos += 2;
            popup.style.transform = `translateY(-${pos}px)`;
            popup.style.opacity = 1 - (pos / 100);
            
            if (pos < 100) {
                requestAnimationFrame(animate);
            } else {
                popup.remove();
            }
        };
        
        animate();
    }
    
    // Добавление опыта и повышение уровня
    addExp(exp) {
        this.gameData.exp += exp;
        
        // Проверка повышения уровня
        if (this.gameData.exp >= this.gameData.nextLevelExp) {
            this.gameData.level++;
            this.gameData.exp -= this.gameData.nextLevelExp;
            this.gameData.nextLevelExp = Math.floor(this.gameData.nextLevelExp * 1.5);
            
            // Бонус за уровень
            this.gameData.balance += this.gameData.level * 1000;
            this.showNotification(`Уровень повышен! Теперь уровень ${this.gameData.level}`, 'success');
            
            // Обновление отображения
            this.updateLevel();
        }
        
        // Обновление прогресс-бара
        this.updateProgressBar();
    }
    
    // Обработка перевода
    handleTransfer() {
        const recipientId = document.getElementById('recipient-id').value.trim();
        const amount = parseFloat(document.getElementById('transfer-amount').value);
        
        // Валидация
        if (!recipientId) {
            this.showNotification('Введите ID получателя', 'error');
            return;
        }
        
        if (isNaN(amount) || amount <= 0) {
            this.showNotification('Введите корректную сумму', 'error');
            return;
        }
        
        if (amount > this.gameData.balance) {
            this.showNotification('Недостаточно средств', 'error');
            return;
        }
        
        if (recipientId === this.gameData.playerId) {
            this.showNotification('Нельзя отправлять перевод себе', 'error');
            return;
        }
        
        // Комиссия (5%)
        const fee = amount * 0.05;
        const totalAmount = amount + fee;
        
        // Проверка эмуляции перевода
        // В реальном приложении здесь был бы запрос к серверу
        this.gameData.balance -= totalAmount;
        
        // Добавление в историю
        const transaction = {
            id: Date.now(),
            type: 'outgoing',
            recipientId,
            amount,
            fee,
            total: totalAmount,
            timestamp: new Date().toLocaleString()
        };
        
        this.gameData.transactions.unshift(transaction);
        
        // Ограничение истории до 50 записей
        if (this.gameData.transactions.length > 50) {
            this.gameData.transactions.pop();
        }
        
        // Обновление интерфейса
        this.updateBalance();
        this.renderTransactions();
        
        this.showNotification(`Перевод на ${amount.toFixed(2)} ₽ отправлен (комиссия: ${fee.toFixed(2)} ₽)`, 'success');
        
        // Очистка формы
        document.getElementById('recipient-id').value = '';
        document.getElementById('transfer-amount').value = 100;
    }
    
    // Показ модального окна создания карты
    showCardModal() {
        const cost = 5000;
        
        if (this.gameData.balance < cost) {
            this.showNotification(`Недостаточно средств! Нужно ${cost} ₽`, 'error');
            return;
        }
        
        document.getElementById('create-cost').textContent = cost.toLocaleString();
        document.getElementById('card-modal').style.display = 'flex';
        this.updateCardPreview();
    }
    
    // Обновление предпросмотра карты
    updateCardPreview() {
        const type = document.getElementById('card-type').value;
        const preview = document.getElementById('preview-card');
        
        let gradient, typeName;
        
        switch(type) {
            case 'standard':
                gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                typeName = 'СТАНДАРТНАЯ';
                break;
            case 'gold':
                gradient = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)';
                typeName = 'ЗОЛОТАЯ';
                break;
            case 'platinum':
                gradient = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
                typeName = 'ПЛАТИНОВАЯ';
                break;
            case 'diamond':
                gradient = 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)';
                typeName = 'БРИЛЛИАНТОВАЯ';
                break;
        }
        
        preview.style.background = gradient;
        preview.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <span>BANK SIMULATOR</span>
                <span>${typeName}</span>
            </div>
            <div style="font-size: 2rem; margin: 10px 0;">
                <i class="fas fa-microchip"></i>
            </div>
            <div style="font-family: 'Courier New', monospace; letter-spacing: 2px; font-size: 1.2rem;">
                **** **** **** ${Math.floor(Math.random() * 9000 + 1000)}
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                <div>
                    <div style="font-size: 0.7rem;">ВЛАДЕЛЕЦ</div>
                    <div>ИГРОК</div>
                </div>
                <div>
                    <div style="font-size: 0.7rem;">СРОК ДЕЙСТВИЯ</div>
                    <div>${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${(new Date().getFullYear() + 4).toString().slice(-2)}</div>
                </div>
            </div>
        `;
    }
    
    // Создание новой карты
    createCard() {
        const name = document.getElementById('card-name').value.trim() || 'Моя карта';
        const type = document.getElementById('card-type').value;
        const cost = 5000;
        
        if (this.gameData.balance < cost) {
            this.showNotification('Недостаточно средств!', 'error');
            return;
        }
        
        // Определение бонуса в зависимости от типа карты
        let incomeBonus;
        switch(type) {
            case 'standard': incomeBonus = 1.05; break;
            case 'gold': incomeBonus = 1.15; break;
            case 'platinum': incomeBonus = 1.30; break;
            case 'diamond': incomeBonus = 1.50; break;
        }
        
        // Создание карты
        const newCard = {
            id: this.gameData.cards.length + 1,
            name,
            type,
            incomeBonus,
            lastDigits: Math.floor(Math.random() * 9000 + 1000).toString(),
            created: new Date().toLocaleDateString()
        };
        
        this.gameData.cards.push(newCard);
        this.gameData.balance -= cost;
        
        // Пересчет пассивного дохода
        this.calculatePassiveIncome();
        
        // Обновление интерфейса
        this.updateBalance();
        this.renderCards();
        this.renderUpgrades();
        
        // Закрытие модального окна
        document.getElementById('card-modal').style.display = 'none';
        document.getElementById('card-name').value = '';
        
        this.showNotification(`Карта "${name}" создана! Пассивный доход увеличен.`, 'success');
    }
    
    // Пересчет пассивного дохода
    calculatePassiveIncome() {
        // Базовый доход
        let income = 10.5;
        
        // Умножение от улучшения
        income *= (1 + (this.gameData.upgrades.passiveIncome.level - 1) * 0.5);
        
        // Бонус от карт
        let cardsBonus = 1.0;
        this.gameData.cards.forEach(card => {
            cardsBonus *= card.incomeBonus;
        });
        income *= cardsBonus;
        
        // Бонус от офиса
        let officeBonus = 1.0;
        Object.values(this.gameData.office.upgrades).forEach(upgrade => {
            officeBonus *= Math.pow(upgrade.incomeMultiplier, upgrade.level - 1);
        });
        income *= officeBonus;
        
        this.gameData.passiveIncome = income;
        
        // Обновление отображения
        document.getElementById('income-per-second').textContent = `${income.toFixed(2)} ₽`;
        document.getElementById('passive-income').textContent = `${income.toFixed(2)} ₽/сек`;
    }
    
    // Покупка улучшения
    buyUpgrade(upgradeType) {
        const upgrade = this.gameData.upgrades[upgradeType];
        
        if (this.gameData.balance < upgrade.cost) {
            this.showNotification('Недостаточно средств!', 'error');
            return;
        }
        
        this.gameData.balance -= upgrade.cost;
        
        // Повышение уровня улучшения
        upgrade.level++;
        
        // Увеличение стоимости
        upgrade.cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.multiplier, upgrade.level - 1));
        
        // Применение эффекта улучшения
        switch(upgradeType) {
            case 'clickPower':
                this.gameData.clickValue = 10 * Math.pow(1.5, upgrade.level - 1);
                document.getElementById('click-value').textContent = this.gameData.clickValue.toFixed(2);
                break;
            case 'passiveIncome':
                this.calculatePassiveIncome();
                break;
        }
        
        // Обновление интерфейса
        this.updateBalance();
        this.renderUpgrades();
        
        this.showNotification(`Улучшение "${this.getUpgradeName(upgradeType)}" куплено!`, 'success');
    }
    
    // Покупка улучшения офиса
    buyOfficeUpgrade(upgradeType) {
        const upgrade = this.gameData.office.upgrades[upgradeType];
        
        if (this.gameData.balance < upgrade.cost) {
            this.showNotification('Недостаточно средств!', 'error');
            return;
        }
        
        this.gameData.balance -= upgrade.cost;
        upgrade.level++;
        upgrade.cost = Math.floor(upgrade.cost * 2);
        
        // Увеличение опыта офиса
        this.gameData.office.exp += 1000;
        
        // Проверка повышения уровня офиса
        if (this.gameData.office.exp >= this.gameData.office.nextLevelExp) {
            this.gameData.office.level++;
            this.gameData.office.exp -= this.gameData.office.nextLevelExp;
            this.gameData.office.nextLevelExp = Math.floor(this.gameData.office.nextLevelExp * 2);
            
            // Бонус за уровень офиса
            this.gameData.passiveIncome *= 1.2;
            this.showNotification(`Офис повышен до уровня ${this.gameData.office.level}!`, 'success');
            
            this.updateOfficeLevel();
        }
        
        // Пересчет дохода
        this.calculatePassiveIncome();
        
        // Обновление интерфейса
        this.updateBalance();
        this.renderOfficeUpgrades();
        
        this.showNotification(`Улучшение офиса "${this.getOfficeUpgradeName(upgradeType)}" куплено!`, 'success');
    }
    
    // Получение имени улучшения
    getUpgradeName(type) {
        const names = {
            clickPower: 'Усиление клика',
            passiveIncome: 'Пассивный доход',
            luck: 'Удача'
        };
        return names[type] || type;
    }
    
    // Получение имени улучшения офиса
    getOfficeUpgradeName(type) {
        const names = {
            security: 'Система безопасности',
            terminals: 'Банкоматы',
            staff: 'Обучение персонала'
        };
        return names[type] || type;
    }
    
    // Основной игровой цикл
    startGameLoop() {
        setInterval(() => {
            // Пассивный доход
            this.gameData.balance += this.gameData.passiveIncome / 10;
            this.gameData.totalEarned += this.gameData.passiveIncome / 10;
            
            // Обновление каждые 10 секунд
            if (Date.now() - this.gameData.lastSaveTime > 10000) {
                this.saveGame();
            }
            
            this.updateBalance();
        }, 100); // Обновление каждые 100 мс для плавности
        
        // Автосохранение каждую минуту
        setInterval(() => {
            this.saveGame();
        }, 60000);
    }
    
    // Обновление отображения баланса
    updateBalance() {
        document.getElementById('balance').textContent = this.gameData.balance.toLocaleString('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' ₽';
        
        document.getElementById('total-earned').textContent = this.gameData.totalEarned.toLocaleString('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' ₽';
    }
    
    // Обновление отображения уровня
    updateLevel() {
        document.getElementById('level').textContent = this.gameData.level;
    }
    
    // Обновление уровня офиса
    updateOfficeLevel() {
        document.getElementById('office-level').textContent = this.gameData.office.level;
        
        // Обновление прогресс-бара
        const progress = (this.gameData.office.exp / this.gameData.office.nextLevelExp) * 100;
        document.getElementById('office-progress').style.width = `${progress}%`;
    }
    
    // Обновление прогресс-бара уровня
    updateProgressBar() {
        // Для основного уровня
        const progress = (this.gameData.exp / this.gameData.nextLevelExp) * 100;
        // Здесь можно добавить прогресс-бар если нужно
    }
    
    // Рендеринг улучшений
    renderUpgrades() {
        const container = document.getElementById('upgrades-container');
        container.innerHTML = '';
        
        Object.entries(this.gameData.upgrades).forEach(([key, upgrade]) => {
            const upgradeElement = document.createElement('div');
            upgradeElement.className = 'upgrade-item';
            
            upgradeElement.innerHTML = `
                <div class="upgrade-info">
                    <h3>${this.getUpgradeName(key)} (Ур. ${upgrade.level})</h3>
                    <p>${this.getUpgradeDescription(key)}</p>
                </div>
                <div class="upgrade-buy">
                    <span class="upgrade-price">${upgrade.cost.toLocaleString()} ₽</span>
                    <button class="buy-btn" 
                            onclick="game.buyUpgrade('${key}')"
                            ${this.gameData.balance < upgrade.cost ? 'disabled' : ''}>
                        Купить
                    </button>
                </div>
            `;
            
            container.appendChild(upgradeElement);
        });
    }
    
    // Рендеринг улучшений офиса
    renderOfficeUpgrades() {
        const container = document.getElementById('office-upgrades');
        container.innerHTML = '';
        
        Object.entries(this.gameData.office.upgrades).forEach(([key, upgrade]) => {
            const upgradeElement = document.createElement('div');
            upgradeElement.className = 'office-upgrade-item';
            
            upgradeElement.innerHTML = `
                <div class="upgrade-info">
                    <h3>${this.getOfficeUpgradeName(key)} (Ур. ${upgrade.level})</h3>
                    <p>Увеличивает пассивный доход в ${upgrade.incomeMultiplier} раза</p>
                </div>
                <div class="upgrade-buy">
                    <span class="upgrade-price">${upgrade.cost.toLocaleString()} ₽</span>
                    <button class="buy-btn" 
                            onclick="game.buyOfficeUpgrade('${key}')"
                            ${this.gameData.balance < upgrade.cost ? 'disabled' : ''}>
                        Улучшить
                    </button>
                </div>
            `;
            
            container.appendChild(upgradeElement);
        });
        
        this.updateOfficeLevel();
    }
    
    // Рендеринг карт
    renderCards() {
        const container = document.getElementById('cards-container');
        container.innerHTML = '';
        
        this.gameData.cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = `user-card ${card.type}`;
            
            let typeName;
            switch(card.type) {
                case 'standard': typeName = 'СТАНДАРТ'; break;
                case 'gold': typeName = 'ЗОЛОТАЯ'; break;
                case 'platinum': typeName = 'ПЛАТИНУМ'; break;
                case 'diamond': typeName = 'БРИЛЛИАНТ'; break;
            }
            
            cardElement.innerHTML = `
                <div class="user-card-type">${typeName}</div>
                <div class="user-card-name">${card.name}</div>
                <div class="user-card-number">**** **** **** ${card.lastDigits}</div>
                <div class="user-card-income">Бонус дохода: +${((card.incomeBonus - 1) * 100).toFixed(0)}%</div>
                <div class="user-card-created">Создана: ${card.created}</div>
            `;
            
            container.appendChild(cardElement);
        });
    }
    
    // Рендеринг истории переводов
    renderTransactions() {
        const container = document.getElementById('transactions-list');
        container.innerHTML = '';
        
        if (this.gameData.transactions.length === 0) {
            container.innerHTML = '<div class="transaction-item">История переводов пуста</div>';
            return;
        }
        
        this.gameData.transactions.slice(0, 10).forEach(transaction => {
            const transactionElement = document.createElement('div');
            transactionElement.className = `transaction-item ${transaction.type}`;
            
            const sign = transaction.type === 'incoming' ? '+' : '-';
            
            transactionElement.innerHTML = `
                <div>
                    <strong>${transaction.type === 'incoming' ? 'От:' : 'Кому:'} ${transaction.recipientId}</strong>
                    <div style="font-size: 0.8rem; color: #666;">${transaction.timestamp}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: bold; color: ${transaction.type === 'incoming' ? '#2ecc71' : '#e74c3c'}">
                        ${sign}${transaction.amount.toFixed(2)} ₽
                    </div>
                    <div style="font-size: 0.8rem; color: #666;">
                        Комиссия: ${transaction.fee.toFixed(2)} ₽
                    </div>
                </div>
            `;
            
            container.appendChild(transactionElement);
        });
    }
    
    // Получение описания улучшения
    getUpgradeDescription(type) {
        const descriptions = {
            clickPower: 'Увеличивает заработок за клик',
            passiveIncome: 'Увеличивает пассивный доход',
            luck: 'Увеличивает шанс критического заработка'
        };
        return descriptions[type] || '';
    }
    
    // Полный рендеринг игры
    renderGame() {
        this.updateBalance();
        this.updateLevel();
        this.renderUpgrades();
        this.renderOfficeUpgrades();
        this.renderCards();
        this.renderTransactions();
        
        // Обновление значений
        document.getElementById('click-value').textContent = this.gameData.clickValue.toFixed(2);
        document.getElementById('click-bonus').textContent = `${this.gameData.clickValue.toFixed(2)} ₽`;
        document.getElementById('income-per-second').textContent = `${this.gameData.passiveIncome.toFixed(2)} ₽`;
        document.getElementById('passive-income').textContent = `${this.gameData.passiveIncome.toFixed(2)} ₽/сек`;
    }
    
    // Показ уведомлений
    showNotification(message, type = 'info') {
        const notificationArea = document.getElementById('notification-area');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notificationArea.appendChild(notification);
        
        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    // Сброс игры
    resetGame() {
        if (confirm('Вы уверены? Все ваши прогресс будет потерян!')) {
            localStorage.removeItem('bankCardGameData');
            this.gameData = new BankCardGame().gameData;
            this.renderGame();
            this.showNotification('Игра сброшена!', 'warning');
        }
    }
    
    // Экспорт данных
    exportData() {
        const dataStr = JSON.stringify(this.gameData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `bank-card-simulator-${this.gameData.playerId}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showNotification('Данные экспортированы!', 'success');
    }
}

// Запуск игры
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new BankCardGame();
});

// Добавляем обработчики для покупки улучшений в глобальную область видимости
window.buyUpgrade = function(type) {
    game.buyUpgrade(type);
};

window.buyOfficeUpgrade = function(type) {
    game.buyOfficeUpgrade(type);
};
