  let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

  function addTransaction() {
      const description = document.getElementById('description').value;
      const amount = parseFloat(document.getElementById('amount').value);
      const type = document.getElementById('type').value;

      if (description.trim() === '' || isNaN(amount)) {
          alert('Please enter valid details');
          return;
      }

      const transaction = {
          id: Date.now(),
          description,
          amount,
          type,
          date: new Date().toLocaleDateString()
      };

      transactions.push(transaction);
      updateLocalStorage();
      updateUI();
      clearForm();
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

      document.getElementById('balance').textContent = `${balance.toFixed(2)}`;
      document.getElementById('total-income').textContent = `${income.toFixed(2)}`;
      document.getElementById('total-expenses').textContent = `${expenses.toFixed(2)}`;

      displayTransactions();
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
                  <span>${transaction.amount.toFixed(2)}</span>
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

  document.addEventListener('DOMContentLoaded', () => {
      initializeThemeToggle();
      updateUI();
  });

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
