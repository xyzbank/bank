// Игровое состояние
const gameState = {
    money: 0,
    passiveIncome: 0,
    clients: 0,
    clickValue: 1000,
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
            type: "passive"
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
            type: "click"
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
            incomeMultiplier: 1.1, // Умножает весь пассивный доход на 10%
            costGrowth: 2.5,
            type: "multiplier"
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
            type: "passive"
        }
    ]
};

// DOM элементы
const moneyEl = document.getElementById('money');
const passiveIncomeEl = document.getElementById('passiveIncome');
const clientsEl = document.getElementById('clients');
const clickCard = document.getElementById('clickCard');
const clickBonusEl = document.getElementById('clickBonus');
const clickValueEl = document.getElementById('clickValue');
const upgradesContainer = document.getElementById('upgradesContainer');

// Функция форматирования чисел
function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + ' трлн';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + ' млрд';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + ' млн';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + ' тыс';
    return Math.floor(num);
}

// Обновление UI
function updateUI() {
    moneyEl.textContent = formatNumber(gameState.money);
    passiveIncomeEl.textContent = formatNumber(gameState.passiveIncome);
    clientsEl.textContent = formatNumber(gameState.clients);
    clickValueEl.textContent = formatNumber(gameState.clickValue);
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

    setTimeout(() => {
        bonus.remove();
    }, 1000);
});

// Покупка улучшения
function buyUpgrade(upgradeId) {
    const upgrade = gameState.upgrades.find(u => u.id === upgradeId);
    if (!upgrade || gameState.money < upgrade.cost) return;

    gameState.money -= upgrade.cost;
    upgrade.level++;

    // Применение эффекта улучшения
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

    // Увеличение стоимости для следующего уровня
    upgrade.cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costGrowth, upgrade.level));

    updateUI();
    renderUpgrades();
}

// Рендер улучшений
function renderUpgrades() {
    upgradesContainer.innerHTML = '';
    gameState.upgrades.forEach(upgrade => {
        const upgradeEl = document.createElement('div');
        upgradeEl.className = 'upgrade';

        const canBuy = gameState.money >= upgrade.cost;
        const buttonText = canBuy ? `Купить за ${formatNumber(upgrade.cost)} ₽` : 'Недостаточно средств';

        upgradeEl.innerHTML = `
            <div class="upgrade-header">
                <div class="upgrade-icon"><i class="${upgrade.icon}"></i></div>
                <div class="upgrade-title">${upgrade.name} (Ур. ${upgrade.level})</div>
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

// Пассивный доход (раз в секунду)
setInterval(() => {
    if (gameState.passiveIncome > 0) {
        gameState.money += gameState.passiveIncome;
        updateUI();
    }
}, 1000);

// Инициализация игры
function initGame() {
    updateUI();
    renderUpgrades();
    console.log('Игра "Банк-Кликер" запущена!');
}

// Запуск игры при загрузке страницы
window.onload = initGame;
