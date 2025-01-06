let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let selectedCurrency = localStorage.getItem('currency') || 'USD';
const currencySymbols = { USD: '$', EUR: '€', GBP: '£' };

function updateCurrency(newCurrency) {
    const rates = { USD: 1, EUR: 0.85, GBP: 0.73 };
    selectedCurrency = newCurrency;
    transactions = transactions.map(t => ({
        ...t,
        amount: t.amount * rates[newCurrency] / rates[t.currency],
        currency: newCurrency
    }));
    localStorage.setItem('currency', newCurrency);
    updateUI();
}

function getCategoryAnalytics() {
    return transactions.reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = 0;
        acc[t.category] += t.type === 'expense' ? t.amount : 0;
        return acc;
    }, {});
}

function updateBudgetProgress() {
    const monthlyBudget = parseFloat(localStorage.getItem('monthlyBudget')) || 0;
    const currentMonth = new Date().getMonth();
    const monthlyExpenses = transactions
        .filter(t => new Date(t.date).getMonth() === currentMonth && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    const progress = (monthlyExpenses / monthlyBudget) * 100;
    document.getElementById('budget-progress').style.width = `${Math.min(progress, 100)}%`;
}

function searchTransactions(query) {
    const filtered = transactions.filter(t => 
        t.description.toLowerCase().includes(query.toLowerCase()) ||
        t.category?.toLowerCase().includes(query.toLowerCase())
    );
    displayTransactions(filtered);
}

function exportToCSV() {
    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category'];
    const csvContent = transactions.map(t => 
        [t.date, t.description, t.amount, t.type, t.category].join(',')
    );
    const blob = new Blob([headers.join(',') + '\n' + csvContent.join('\n')], 
        { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
}

function setupRecurring(transaction, frequency) {
    const recurring = JSON.parse(localStorage.getItem('recurringTransactions')) || [];
    recurring.push({ ...transaction, frequency });
    localStorage.setItem('recurringTransactions', JSON.stringify(recurring));
}

function filterByDateRange(startDate, endDate) {
    return transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= new Date(startDate) && 
               transactionDate <= new Date(endDate);
    });
}

function generateInsights() {
    const monthlyData = transactions.reduce((acc, t) => {
        const month = new Date(t.date).getMonth();
        if (!acc[month]) acc[month] = { income: 0, expenses: 0 };
        acc[month][t.type] += t.amount;
        return acc;
    }, {});
    
    return {
        monthlyData,
        averageExpense: calculateAverageExpense(),
        topCategories: getTopSpendingCategories(3)
    };
}

function checkBudgetAlerts() {
    const monthlyBudget = parseFloat(localStorage.getItem('monthlyBudget')) || 0;
    const currentExpenses = calculateStats().expenses;
    
    if (currentExpenses > monthlyBudget * 0.9) {
        showNotification('Budget Alert', 'You have used 90% of your monthly budget!');
    }
}

function initializeCharts() {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    const categoryData = getCategoryAnalytics();
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: generateColors(Object.keys(categoryData).length)
            }]
        }
    });
}

function generateColors(count) {
    return Array.from({ length: count }, (_, i) => 
        `hsl(${(i * 360) / count}, 70%, 50%)`
    );
}

function calculateAverageExpense() {
    const expenses = transactions.filter(t => t.type === 'expense');
    return expenses.reduce((sum, t) => sum + t.amount, 0) / expenses.length || 0;
}

function getTopSpendingCategories(limit) {
    const categoryTotals = getCategoryAnalytics();
    return Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit);
}

function showNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message });
    }
}

function addTransaction() {
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;

    if (description.trim() === '' || isNaN(amount)) {
        alert('Please enter valid details');
        return;
    }

    const transaction = {
        id: Date.now(),
        description,
        amount,
        type,
        category,
        currency: selectedCurrency,
        date: new Date().toLocaleDateString()
    };

    transactions.push(transaction);
    updateLocalStorage();
    updateUI();
    clearForm();
    checkBudgetAlerts();
}

function calculateAndDisplaySavings() {
    const targetAmount = parseFloat(document.getElementById('target-amount').value);
    const duration = parseInt(document.getElementById('duration-days').value);
    
    if (isNaN(targetAmount) || isNaN(duration)) {
        alert('Please enter valid numbers');
        return;
    }
    
    const savings = calculateSavingsGoal(targetAmount, duration);
    
    document.getElementById('daily-savings').innerHTML = `
        <h3>Daily Savings</h3>
        <p>${savings.daily.toFixed(2)}</p>
    `;
    document.getElementById('weekly-savings').innerHTML = `
        <h3>Weekly Savings</h3>
        <p>${savings.weekly.toFixed(2)}</p>
    `;
    document.getElementById('monthly-savings').innerHTML = `
        <h3>Monthly Savings</h3>
        <p>${savings.monthly.toFixed(2)}</p>
    `;
}

function calculateSavingsGoal(targetAmount, duration) {
    const savingsPerDay = targetAmount / duration;
    const savingsPerWeek = savingsPerDay * 7;
    const savingsPerMonth = savingsPerDay * 30;
    
    return {
        daily: savingsPerDay,
        weekly: savingsPerWeek,
        monthly: savingsPerMonth
    };
}

function updateUI() {
    const balance = calculateBalance();
    const { income, expenses } = calculateStats();

    document.getElementById('balance').textContent = `${selectedCurrency} ${balance.toFixed(2)}`;
    document.getElementById('total-income').textContent = `${selectedCurrency} ${income.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = `${selectedCurrency} ${expenses.toFixed(2)}`;

    displayTransactions();
    updateBudgetProgress();
}

function calculateBalance() {
    return transactions.reduce((acc, transaction) => {
        return transaction.type === 'income' 
            ? acc + transaction.amount 
            : acc - transaction.amount;
    }, 0);
}

function calculateStats() {
    return transactions.reduce((acc, transaction) => {
        if (transaction.type === 'income') {
            acc.income += transaction.amount;
        } else {
            acc.expenses += transaction.amount;
        }
        return acc;
    }, { income: 0, expenses: 0 });
}

function displayTransactions() {
    const list = document.getElementById('transaction-list');
    list.innerHTML = '';

    transactions.slice().reverse().forEach(transaction => {
        const li = document.createElement('li');
        li.className = `transaction-item ${transaction.type}-item`;
        li.innerHTML = `
            <div>
                <strong>${transaction.description}</strong>
                <small>${transaction.date}</small>
            </div>
            <div>
                <span>${selectedCurrency} ${transaction.amount.toFixed(2)}</span>
                <button onclick="deleteTransaction(${transaction.id})">×</button>
            </div>
        `;
        list.appendChild(li);
    });
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    updateLocalStorage();
    updateUI();
}

function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function clearForm() {
    document.getElementById('description').value = '';
    document.getElementById('amount').value = '';
}

function appendToCalc(value) {
    const input = document.getElementById('calc-input');
    input.value += value;
}

function clearCalc() {
    document.getElementById('calc-input').value = '';
}

function calculateResult() {
    const input = document.getElementById('calc-input');
    try {
        const result = eval(input.value);
        input.value = Number(result.toFixed(2));
    } catch (error) {
        input.value = 'Error';
        setTimeout(clearCalc, 1500);
    }
}

function useResultInAmount() {
    const result = document.getElementById('calc-input').value;
    if (result && result !== 'Error') {
        document.getElementById('amount').value = result;
    }
}

function initializeThemeToggle() {
    const themeSwitch = document.getElementById('theme-switch');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    if (prefersDark.matches) {
        document.body.classList.add('dark-mode');
    }
    
    themeSwitch.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });
    
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
        document.body.classList.add('dark-mode');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeThemeToggle();
    updateUI();
    initializeCharts();
    Notification.requestPermission();
    
    document.getElementById('currency-selector').addEventListener('change', (e) => {
        updateCurrency(e.target.value);
    });
    
    document.getElementById('transaction-search').addEventListener('input', (e) => {
        searchTransactions(e.target.value);
    });
});
