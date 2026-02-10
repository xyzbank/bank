// Игровое состояние
const gameState = {
    money: 10000,
    passiveIncome: 0,
    clients: 0,
    clickValue: 1000,
    officeLevel: 1,
    
    // Базовая статистика офиса
    officeStats: {
        baseVisitors: 5,
        baseAttractiveness: 10,
        baseCapacity: 20,
        currentVisitors: 0
    },
    
    upgrades: [
        {
            id: 1,
            name: "Кофемашина в холле",
            icon: "fas fa-coffee",
            description: "Клиенты довольны, больше времени проводят в офисе.",
            baseCost: 5000,
            cost: 5000,
            level: 0,
            incomePerSec: 50,
            incomePerSecGrowth: 10,
            costGrowth: 1.5,
            type: "passive",
            officeBonus: 0.1 // +10% к привлекательности офиса
        },
        {
            id: 2,
            name: "Дополнительный операционист",
            icon: "fas fa-user-tie",
            description: "Обслуживает больше клиентов, увеличивая доход с клика.",
            baseCost: 15000,
            cost: 15000,
            level: 0,
            clickBonus: 200,
            clickBonusGrowth: 50,
            costGrowth: 1.8,
            type: "click",
            officeBonus: 0.05 // +5% к вместимости
        },
        {
            id: 3,
            name: "Вклад 'Сохраняй'",
            icon: "fas fa-piggy-bank",
            description: "Базовый депозитный продукт. Приносит стабильный пассивный доход.",
            baseCost: 50000,
            cost: 50000,
            level: 0,
            incomePerSec: 300,
            incomePerSecGrowth: 100,
            costGrowth: 2.0,
            type: "passive"
        },
        {
            id: 4,
            name: "Модернизация серверов",
            icon: "fas fa-server",
            description: "Ускоряет все операции, повышая общую эффективность.",
            baseCost: 200000,
            cost: 200000,
            level: 0,
            incomeMultiplier: 1.1,
            costGrowth: 2.5,
            type: "multiplier",
            officeBonus: 0.15 // +15% к эффективности
        },
        {
            id: 5,
            name: "Открытие нового филиала",
            icon: "fas fa-building",
            description: "Расширяет ваше присутствие в городе. Значительно увеличивает доход и клиентов.",
            baseCost: 1000000,
            cost: 1000000,
            level: 0,
            incomePerSec: 2000,
            clientsPerLevel: 100,
            incomePerSecGrowth: 500,
            costGrowth: 3.0,
            type: "passive",
            officeBonus: 0.3 // +30% ко всем показателям офиса
        }
    ],
    
    // Улучшения офиса
    officeUpgradesList: [
        {
            id: "capacity",
            name: "Расширение офиса",
            icon: "fas fa-expand-arrows-alt",
            description: "Увеличивает вместимость офиса, позволяя обслуживать больше клиентов одновременно.",
            baseCost: 50000,
            cost: 50000,
            level: 1,
            effect: 1.5, // Умножает вместимость
            costGrowth: 2.0
        },
        {
            id: "attractiveness",
            name: "Фасад и дизайн",
            icon: "fas fa-paint-roller",
            description: "Улучшает внешний вид офиса, привлекая больше клиентов.",
            baseCost: 30000,
            cost: 30000,
            level: 1,
            effect: 1.3, // Умножает привлекательность
            costGrowth: 1.8
        },
        {
            id: "efficiency",
            name: "Автоматизация процессов",
            icon: "fas fa-robot",
            description: "Внедрение новых технологий увеличивает скорость обслуживания.",
            baseCost: 75000,
            cost: 75000,
            level: 1,
            effect: 1.4, // Умножает доход с клиентов
            costGrowth: 2.2
        }
    ],
    
    // Состояние мира
    world: {
        people: [],
        nextPersonTime: 0,
        lastUpdate: Date.now(),
        peopleInterval: null
    }
};

// DOM элементы
const moneyEl = document.getElementById('money');
const passiveIncomeEl = document.getElementById('passiveIncome');
const clientsEl = document.getElementById('clients');
const officeLevelEl = document.getElementById('officeLevel');
const worldMoneyEl = document.getElementById('worldMoney');
const worldClientsEl = document.getElementById('worldClients');
const worldOfficeLevelEl = document.getElementById('worldOfficeLevel');
const officeVisitorsEl = document.getElementById('officeVisitors');
const officeAttractivenessEl = document.getElementById('officeAttractiveness');
const officeCapacityEl = document.getElementById('officeCapacity');
const clickCard = document.getElementById('clickCard');
const clickBonusEl = document.getElementById('clickBonus');
const clickValueEl = document.getElementById('clickValue');
const upgradesContainer = document.getElementById('upgradesContainer');
const officeUpgradesEl = document.getElementById('officeUpgrades');
const bankScreen = document.getElementById('bankScreen');
const worldScreen = document.getElementById('worldScreen');
const worldBtn = document.getElementById('worldBtn');
const backToBankBtn = document.getElementById('backToBankBtn');
const worldMap = document.getElementById('worldMap');
const officeUpgradeModal = document.getElementById('officeUpgradeModal');
const upgradeDescription = document.getElementById('upgradeDescription');
const currentLevelEl = document.getElementById('currentLevel');
const upgradeCostEl = document.getElementById('upgradeCost');
const newLevelEl = document.getElementById('newLevel');
const cancelUpgradeBtn = document.getElementById('cancelUpgradeBtn');
const confirmUpgradeBtn = document.getElementById('confirmUpgradeBtn');

let currentUpgrade = null;
let peopleInterval = null;

// Форматирование чисел
function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + ' трлн';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + ' млрд';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + ' млн';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + ' тыс';
    return Math.floor(num);
}

// Расчет статистики офиса
function calculateOfficeStats() {
    // Базовые значения
    let visitors = gameState.officeStats.baseVisitors;
    let attractiveness = gameState.officeStats.baseAttractiveness;
    let capacity = gameState.officeStats.baseCapacity;
    
    // Применяем улучшения офиса
    const capacityUpgrade = gameState.officeUpgradesList.find(u => u.id === 'capacity');
    const attractUpgrade = gameState.officeUpgradesList.find(u => u.id === 'attractiveness');
    const efficiencyUpgrade = gameState.officeUpgradesList.find(u => u.id === 'efficiency');
    
    if (capacityUpgrade) capacity *= Math.pow(capacityUpgrade.effect, capacityUpgrade.level - 1);
    if (attractUpgrade) attractiveness *= Math.pow(attractUpgrade.effect, attractUpgrade.level - 1);
    if (efficiencyUpgrade) visitors *= Math.pow(efficiencyUpgrade.effect, efficiencyUpgrade.level - 1);
    
    // Применяем бонусы от улучшений банка
    gameState.upgrades.forEach(upgrade => {
        if (upgrade.officeBonus && upgrade.level > 0) {
            visitors *= (1 + upgrade.officeBonus);
            attractiveness *= (1 + upgrade.officeBonus);
            capacity *= (1 + upgrade.officeBonus);
        }
    });
    
    // Учет уровня офиса
    visitors *= gameState.officeLevel;
    attractiveness *= gameState.officeLevel;
    capacity *= gameState.officeLevel;
    
    return {
        visitors: Math.floor(visitors),
        attractiveness: Math.floor(attractiveness),
        capacity: Math.floor(capacity)
    };
}

// Обновление UI
function updateUI() {
    const officeStats = calculateOfficeStats();
    
    moneyEl.textContent = formatNumber(gameState.money);
    passiveIncomeEl.textContent = formatNumber(gameState.passiveIncome);
    clientsEl.textContent = formatNumber(gameState.clients);
    officeLevelEl.textContent = gameState.officeLevel;
    clickValueEl.textContent = formatNumber(gameState.clickValue);
    
    // Обновление мира (если он активен)
    if (worldScreen.classList.contains('active')) {
        worldMoneyEl.textContent = formatNumber(gameState.money);
        worldClientsEl.textContent = formatNumber(gameState.clients);
        worldOfficeLevelEl.textContent = gameState.officeLevel;
        officeVisitorsEl.textContent = `${officeStats.visitors}/час`;
        officeAttractivenessEl.textContent = `${officeStats.attractiveness}%`;
        officeCapacityEl.textContent = `${officeStats.capacity} чел`;
    }
}

// Клик по карте
clickCard.addEventListener('click', () => {
    gameState.money += gameState.clickValue;
    updateUI();
    
    // Анимация бонуса
    const bonus = clickBonusEl.cloneNode(true);
    bonus.textContent = `+${formatNumber(gameState.clickValue)} ₽`;
    bonus.style.position = 'absolute';
    bonus.style.opacity = '1';
    bonus.style.animation = 'fadeUp 1s ease-out forwards';
    clickCard.appendChild(bonus);
    
    setTimeout(() => bonus.remove(), 1000);
});

// Покупка улучшения
function buyUpgrade(upgradeId) {
    const upgrade = gameState.upgrades.find(u => u.id === upgradeId);
    if (!upgrade || gameState.money < upgrade.cost) return;
    
    gameState.money -= upgrade.cost;
    upgrade.level++;
    
    switch (upgrade.type) {
        case 'passive':
            gameState.passiveIncome += upgrade.incomePerSec;
            gameState.clients += (upgrade.clientsPerLevel || 0);
            upgrade.incomePerSec += upgrade.incomePerSecGrowth || 0;
            break;
        case 'click':
            gameState.clickValue += upgrade.clickBonus;
            upgrade.clickBonus += upgrade.clickBonusGrowth || 0;
            break;
        case 'multiplier':
            gameState.passiveIncome = Math.floor(gameState.passiveIncome * upgrade.incomeMultiplier);
            break;
    }
    
    upgrade.cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costGrowth, upgrade.level));
    updateUI();
    renderUpgrades();
    renderOfficeUpgrades();
}

// Рендер улучшений банка
function renderUpgrades() {
    upgradesContainer.innerHTML = '';
    gameState.upgrades.forEach(upgrade => {
        const canBuy = gameState.money >= upgrade.cost;
        const buttonText = canBuy ? `Купить за ${formatNumber(upgrade.cost)} ₽` : 'Недостаточно средств';
        
        const upgradeEl = document.createElement('div');
        upgradeEl.className = 'upgrade';
        upgradeEl.innerHTML = `
            <div class="upgrade-header">
                <div class="upgrade-icon"><i class="${upgrade.icon}"></i></div>
                <div class="upgrade-title">${upgrade.name}</div>
                <div class="upgrade-level">Ур. ${upgrade.level}</div>
            </div>
            <div class="upgrade-description">${upgrade.description}</div>
            <div class="upgrade-stats">
                <div class="upgrade-cost">${buttonText}</div>
                <div class="upgrade-income">
                    ${upgrade.type === 'passive' ? `+${formatNumber(upgrade.incomePerSec)} ₽/сек` : ''}
                    ${upgrade.type === 'click' ? `+${formatNumber(upgrade.clickBonus)} ₽/клик` : ''}
                    ${upgrade.type === 'multiplier' ? `x${upgrade.incomeMultiplier} к доходу` : ''}
                </div>
            </div>
            <button class="upgrade-button" ${!canBuy ? 'disabled' : ''}>
                ${buttonText}
            </button>
        `;
        
        const button = upgradeEl.querySelector('.upgrade-button');
        button.addEventListener('click', () => buyUpgrade(upgrade.id));
        upgradesContainer.appendChild(upgradeEl);
    });
}

// Рендер улучшений офиса
function renderOfficeUpgrades() {
    officeUpgradesEl.innerHTML = '';
    gameState.officeUpgradesList.forEach(upgrade => {
        const upgradeEl = document.createElement('div');
        upgradeEl.className = 'office-upgrade-item';
        upgradeEl.dataset.id = upgrade.id;
        
        upgradeEl.innerHTML = `
            <div class="upgrade-item-left">
                <div class="upgrade-item-icon"><i class="${upgrade.icon}"></i></div>
                <div class="upgrade-item-info">
                    <h5>${upgrade.name}</h5>
                    <p>Уровень ${upgrade.level}</p>
                </div>
            </div>
            <div class="upgrade-item-cost">${formatNumber(upgrade.cost)} ₽</div>
        `;
        
        upgradeEl.addEventListener('click', () => showOfficeUpgradeModal(upgrade.id));
        officeUpgradesEl.appendChild(upgradeEl);
    });
}

// Показать модальное окно улучшения офиса
function showOfficeUpgradeModal(upgradeId) {
    const upgrade = gameState.officeUpgradesList.find(u => u.id === upgradeId);
    if (!upgrade) return;
    
    currentUpgrade = upgrade;
    
    upgradeDescription.textContent = upgrade.description;
    currentLevelEl.textContent = upgrade.level;
    upgradeCostEl.textContent = `${formatNumber(upgrade.cost)} ₽`;
    newLevelEl.textContent = upgrade.level + 1;
    
    officeUpgradeModal.style.display = 'flex';
}

// Скрыть модальное окно
function hideOfficeUpgradeModal() {
    officeUpgradeModal.style.display = 'none';
    currentUpgrade = null;
}

// Купить улучшение офиса
function buyOfficeUpgrade() {
    if (!currentUpgrade || gameState.money < currentUpgrade.cost) return;
    
    gameState.money -= currentUpgrade.cost;
    currentUpgrade.level++;
    currentUpgrade.cost = Math.floor(currentUpgrade.baseCost * Math.pow(currentUpgrade.costGrowth, currentUpgrade.level - 1));
    
    // Увеличиваем уровень офиса каждые 3 улучшения
    const totalUpgrades = gameState.officeUpgradesList.reduce((sum, u) => sum + (u.level - 1), 0);
    gameState.officeLevel = Math.floor(totalUpgrades / 3) + 1;
    
    updateUI();
    renderOfficeUpgrades();
    hideOfficeUpgradeModal();
    
    // Если мы в мире, перерисовываем его
    if (worldScreen.classList.contains('active')) {
        renderWorld();
    }
}

// Переключение между экранами
function goToWorld() {
    console.log('Переход в мир...');
    bankScreen.classList.remove('active');
    worldScreen.classList.add('active');
    renderWorld();
    updateUI();
}

function goToBank() {
    console.log('Возврат в банк...');
    worldScreen.classList.remove('active');
    bankScreen.classList.add('active');
    
    // Останавливаем анимацию людей
    if (peopleInterval) {
        clearInterval(peopleInterval);
        peopleInterval = null;
    }
}

// Обработчики переключения экранов
worldBtn.addEventListener('click', goToWorld);
backToBankBtn.addEventListener('click', goToBank);

// Обработчики модального окна
cancelUpgradeBtn.addEventListener('click', hideOfficeUpgradeModal);
confirmUpgradeBtn.addEventListener('click', buyOfficeUpgrade);

// Рендер мира
function renderWorld() {
    console.log('Рендеринг мира...');
    worldMap.innerHTML = '';
    
    // Создаем дорогу
    const road = document.createElement('div');
    road.className = 'road';
    worldMap.appendChild(road);
    
    // Создаем офис
    const office = document.createElement('div');
    office.className = 'office-building';
    
    const officeStats = calculateOfficeStats();
    
    office.innerHTML = `
        <div class="office-roof"></div>
        <div class="office-body">
            <div class="office-window" style="top: 30px; left: 20px;"></div>
            <div class="office-window" style="top: 30px; right: 20px;"></div>
            <div class="office-window" style="top: 80px; left: 20px;"></div>
            <div class="office-window" style="top: 80px; right: 20px;"></div>
            <div class="office-door"></div>
        </div>
        <div class="office-sign">БАНК Уровень ${gameState.officeLevel}</div>
    `;
    
    office.addEventListener('click', () => {
        alert(`🏦 Ваш банк\n\nУровень: ${gameState.officeLevel}\nКлиентов в час: ${officeStats.visitors}\nВместимость: ${officeStats.capacity} чел\nПривлекательность: ${officeStats.attractiveness}%\n\nКапитал: ${formatNumber(gameState.money)} ₽`);
    });
    
    worldMap.appendChild(office);
    
    // Создаем деревья
    for (let i = 0; i < 10; i++) {
        const tree = document.createElement('div');
        tree.className = 'tree map-element';
        tree.style.left = `${Math.random() * 90}%`;
        tree.style.top = `${20 + Math.random() * 30}%`;
        tree.style.width = `${30 + Math.random() * 20}px`;
        tree.style.height = `${60 + Math.random() * 40}px`;
        worldMap.appendChild(tree);
    }
    
    // Создаем других банков (конкурентов)
    const competitorBanks = [
        { name: "ВТБ", top: "15%", left: "10%", color: "#1e3799" },
        { name: "Альфа-Банк", top: "60%", left: "80%", color: "#e84118" },
        { name: "Тинькофф", top: "75%", left: "20%", color: "#ff9f1a" }
    ];
    
    competitorBanks.forEach(bank => {
        const bankEl = document.createElement('div');
        bankEl.className = 'bank-element map-element';
        bankEl.textContent = bank.name;
        bankEl.style.top = bank.top;
        bankEl.style.left = bank.left;
        bankEl.style.background = `linear-gradient(135deg, ${bank.color} 0%, ${bank.color}99 100%)`;
        bankEl.addEventListener('click', () => {
            alert(`🏛️ ${bank.name}\n\nКрупный конкурент\nУровень угрозы: 🔴 Высокий\n\nСовет: Улучшайте свой офис, чтобы конкурировать!`);
        });
        worldMap.appendChild(bankEl);
    });
    
    // Запускаем анимацию людей
    startPeopleAnimation();
}

// Анимация людей
function startPeopleAnimation() {
    // Останавливаем старый интервал если есть
    if (peopleInterval) {
        clearInterval(peopleInterval);
    }
    
    const officeStats = calculateOfficeStats();
    
    peopleInterval = setInterval(() => {
        // Удаляем старых людей
        document.querySelectorAll('.person').forEach(p => {
            if (parseFloat(p.style.left) > 110) p.remove();
        });
        
        // Создаем новых людей (частота зависит от привлекательности офиса)
        const spawnChance = 0.1 + (officeStats.attractiveness / 100) * 0.4;
        if (Math.random() < spawnChance) {
            createPerson();
        }
    }, 1000);
}

function createPerson() {
    const officeStats = calculateOfficeStats();
    
    // Проверяем вместимость
    const currentPeople = document.querySelectorAll('.person:not(.entering)').length;
    if (currentPeople >= officeStats.capacity) return;
    
    const person = document.createElement('div');
    person.className = 'person';
    person.style.bottom = '100px';
    person.style.left = '-50px';
    
    // Случайный цвет одежды
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
    person.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Случайная скорость
    const speed = 15 + Math.random() * 10;
    person.style.animationDuration = `${speed}s`;
    
    worldMap.appendChild(person);
    
    // Время до входа в банк зависит от привлекательности
    const timeToEnter = 3000 + (100 - officeStats.attractiveness) * 100;
    
    // Через случайное время человек заходит в банк
    setTimeout(() => {
        if (person.parentNode && !person.classList.contains('entering')) {
            person.classList.add('entering');
            
            setTimeout(() => {
                if (person.parentNode) {
                    person.remove();
                    // Увеличиваем счетчик клиентов и деньги
                    gameState.clients++;
                    const income = Math.floor(gameState.clickValue * (0.05 + (officeStats.attractiveness / 1000)));
                    gameState.money += income;
                    updateUI();
                    
                    // Показываем всплывающее сообщение
                    showIncomePopup(income, person.style.left, person.style.bottom);
                }
            }, 2000);
        }
    }, timeToEnter);
}

function showIncomePopup(amount, left, bottom) {
    const popup = document.createElement('div');
    popup.textContent = `+${formatNumber(amount)} ₽`;
    popup.style.position = 'absolute';
    popup.style.left = left;
    popup.style.bottom = bottom;
    popup.style.color = '#27ae60';
    popup.style.fontWeight = 'bold';
    popup.style.fontSize = '1.2rem';
    popup.style.background = 'rgba(255, 255, 255, 0.9)';
    popup.style.padding = '5px 10px';
    popup.style.borderRadius = '10px';
    popup.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
    popup.style.zIndex = '100';
    popup.style.animation = 'fadeUp 2s ease-out forwards';
    
    worldMap.appendChild(popup);
    
    setTimeout(() => {
        if (popup.parentNode) popup.remove();
    }, 2000);
}

// Пассивный доход
setInterval(() => {
    if (gameState.passiveIncome > 0) {
        gameState.money += gameState.passiveIncome;
        updateUI();
    }
}, 1000);

// Сохранение игры
function saveGame() {
    try {
        const saveData = {
            money: gameState.money,
            passiveIncome: gameState.passiveIncome,
            clients: gameState.clients,
            clickValue: gameState.clickValue,
            officeLevel: gameState.officeLevel,
            upgrades: gameState.upgrades,
            officeUpgradesList: gameState.officeUpgradesList
        };
        localStorage.setItem('bankClickerSave', JSON.stringify(saveData));
        console.log('Игра сохранена');
    } catch (e) {
        console.error('Ошибка сохранения:', e);
    }
}

function loadGame() {
    try {
        const save = localStorage.getItem('bankClickerSave');
        if (save) {
            const loaded = JSON.parse(save);
            gameState.money = loaded.money || 10000;
            gameState.passiveIncome = loaded.passiveIncome || 0;
            gameState.clients = loaded.clients || 0;
            gameState.clickValue = loaded.clickValue || 1000;
            gameState.officeLevel = loaded.officeLevel || 1;
            gameState.upgrades = loaded.upgrades || gameState.upgrades;
            gameState.officeUpgradesList = loaded.officeUpgradesList || gameState.officeUpgradesList;
            console.log('Игра загружена');
        }
    } catch (e) {
        console.error('Ошибка загрузки:', e);
    }
}

// Автосохранение каждые 30 секунд
setInterval(saveGame, 30000);

// Загрузка и инициализация
function initGame() {
    console.log('Инициализация игры...');
    loadGame();
    updateUI();
    renderUpgrades();
    renderOfficeUpgrades();
    
    // Проверяем, не открыт ли уже мир (при перезагрузке страницы)
    if (window.location.hash === '#world') {
        goToWorld();
    }
    
    console.log('Игра "Банк-Кликер с миром" запущена!');
}

window.onload = initGame;

// Сохраняем при закрытии вкладки
window.addEventListener('beforeunload', saveGame);

// Обработка хеша в URL для прямого перехода в мир
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#world' && !worldScreen.classList.contains('active')) {
        goToWorld();
    }
});

// Добавляем кнопку принудительного сохранения (для отладки)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveGame();
        alert('Игра сохранена вручную!');
    }
});
