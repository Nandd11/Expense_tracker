// DOM Elements
const transactionForm = document.getElementById("transactionForm");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const transactionList = document.getElementById("transactionList");
const balanceAmount = document.getElementById("balanceAmount");
const incomeAmount = document.getElementById("incomeAmount");
const expenseAmount = document.getElementById("expenseAmount");
const currencySelector = document.getElementById("currency");
const barChartCanvas = document.getElementById("barChart");
const pieChartCanvas = document.getElementById("pieChart");

// Initialize
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let currency = localStorage.getItem("currency") || "USD";
let barChart, pieChart;

// Currency Symbols
const currencySymbols = {
    USD: "$", EUR: "€", INR: "₹", GBP: "£", JPY: "¥"
};

// Format Money
function formatMoney(amount) {
    return `${currencySymbols[currency]}${Math.abs(amount).toFixed(2)}`;
}

// Initialize App
function init() {
    currencySelector.value = currency;
    updateBalance();
    updateTransactions();
    renderCharts();
}

// Add Transaction
transactionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const transaction = {
        id: Date.now(),
        description: descriptionInput.value,
        amount: parseFloat(amountInput.value),
        type: typeInput.value,
        category: categoryInput.value,
        date: new Date().toISOString()
    };

    // Handle refunds (negative amount)
    if (transaction.type === "refund") {
        transaction.amount = -Math.abs(transaction.amount);
    }

    transactions.push(transaction);
    saveTransactions();
    updateBalance();
    updateTransactions();
    renderCharts();

    // Reset form
    descriptionInput.value = "";
    amountInput.value = "";
});

// Currency Change
currencySelector.addEventListener("change", () => {
    currency = currencySelector.value;
    localStorage.setItem("currency", currency);
    updateBalance();
    updateTransactions();
});

// Update Balance (Corrected Version)
function updateBalance() {
    // Calculate total income (only positive additions)
    const income = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate total expenses (only money going out)
    const expense = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate total refunds (money coming back in)
    const refunds = transactions
        .filter(t => t.type === "refund")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Final settled balance
    const balance = income + refunds - expense;

    // Update UI
    balanceAmount.textContent = formatMoney(balance);
    incomeAmount.textContent = `+${formatMoney(income + refunds)}`;
    expenseAmount.textContent = `-${formatMoney(expense)}`;
}

// Update Transactions
function updateTransactions() {
    transactionList.innerHTML = "";
    transactions.forEach(t => {
        const li = document.createElement("li");
        li.className = t.type;
        li.innerHTML = `
            <span>${t.description} (${t.category})</span>
            <span>${t.type === "income" ? "+" : "-"}${formatMoney(t.amount)}</span>
            <button class="delete-btn" data-id="${t.id}">X</button>
        `;
        transactionList.appendChild(li);
    });

    // Delete Transaction
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            transactions = transactions.filter(t => t.id !== +btn.dataset.id);
            saveTransactions();
            updateBalance();
            updateTransactions();
            renderCharts();
        });
    });
}

// Render Charts
function renderCharts() {
    // Destroy existing charts
    if (barChart) barChart.destroy();
    if (pieChart) pieChart.destroy();

    // Prepare data
    const categories = [...new Set(transactions.map(t => t.category))];
    const incomeData = categories.map(cat => 
        transactions
            .filter(t => t.category === cat && t.type === "income")
            .reduce((sum, t) => sum + t.amount, 0)
    );
    const expenseData = categories.map(cat => 
        transactions
            .filter(t => t.category === cat && (t.type === "expense" || t.type === "refund"))
            .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    );

    // Bar Chart (Income vs Expense)
    barChart = new Chart(barChartCanvas, {
        type: "bar",
        data: {
            labels: categories,
            datasets: [
                {
                    label: "Income",
                    data: incomeData,
                    backgroundColor: "#2ecc71"
                },
                {
                    label: "Expense",
                    data: expenseData,
                    backgroundColor: "#e74c3c"
                }
            ]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });

    // Pie Chart (Categories)
    pieChart = new Chart(pieChartCanvas, {
        type: "pie",
        data: {
            labels: categories,
            datasets: [{
                data: categories.map(cat => 
                    transactions
                        .filter(t => t.category === cat)
                        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                ),
                backgroundColor: [
                    "#3498db", "#9b59b6", "#1abc9c", "#f1c40f", "#e67e22"
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "right" }
            }
        }
    });
}

// Save to Local Storage
function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Initialize the app
init();