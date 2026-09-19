require("dotenv").config();

const mongoose = require("mongoose");

const User = require("./models/User");
const Transaction = require("./models/Transaction");
const Holding = require("./models/Holding");
const Watchlist = require("./models/Watchlist");
const Budget = require("./models/Budget");

const MONGO_URI = process.env.MONGO_URI;

const DEMO_USER = {
    name: "Arpit Tiwari",
    email: "arpit.demo@ledger.local",
    password: "Demo@12345",
};

// ------------------------------------------------------------
// Helper: create dates relative to current month
// ------------------------------------------------------------
function dateFor(monthOffset, day) {
    const now = new Date();

    return new Date(
        now.getFullYear(),
        now.getMonth() + monthOffset,
        day,
        12,
        0,
        0
    );
}

// ------------------------------------------------------------
// Main seed function
// ------------------------------------------------------------
async function seed() {
    try {
        if (!MONGO_URI) {
            throw new Error("MONGO_URI is missing from .env");
        }

        await mongoose.connect(MONGO_URI);

        console.log("MongoDB connected");

        // ----------------------------------------------------------
        // Find/create ONLY the dedicated demo user
        // ----------------------------------------------------------
        let user = await User.findOne({
            email: DEMO_USER.email,
        });

        if (!user) {
            user = await User.create({
                name: DEMO_USER.name,
                email: DEMO_USER.email,
                password: DEMO_USER.password,
                currency: "INR",
                theme: "light",
                budgetAlerts: true,
            });

            console.log(`Created demo user: ${DEMO_USER.email}`);
        } else {
            // Keep demo login credentials predictable.
            user.name = DEMO_USER.name;
            user.password = DEMO_USER.password;
            await user.save();

            console.log(`Demo user already exists: ${DEMO_USER.email}`);
        }

        // ----------------------------------------------------------
        // IMPORTANT:
        // Delete ONLY this demo user's existing sample data.
        // Your real account remains untouched.
        // ----------------------------------------------------------
        await Promise.all([
            Transaction.deleteMany({ user: user._id }),
            Holding.deleteMany({ user: user._id }),
            Watchlist.deleteMany({ user: user._id }),
            Budget.deleteMany({ user: user._id }),
        ]);

        console.log("Old demo data cleared");

        // ==========================================================
        // TRANSACTIONS
        // ==========================================================

        const transactions = [
            // ========================================================
            // APRIL
            // ========================================================

            {
                type: "income",
                amount: 55000,
                category: "Salary",
                description: "Monthly salary",
                date: dateFor(-5, 1),
                isRecurring: true,
                frequency: "monthly",
            },
            {
                type: "expense",
                amount: 17000,
                category: "Rent",
                description: "Monthly rent",
                date: dateFor(-5, 2),
            },
            {
                type: "expense",
                amount: 4800,
                category: "Food",
                description: "Groceries and dining",
                date: dateFor(-5, 6),
            },
            {
                type: "expense",
                amount: 2800,
                category: "Travel",
                description: "Local travel and fuel",
                date: dateFor(-5, 10),
            },
            {
                type: "expense",
                amount: 3200,
                category: "Bills",
                description: "Electricity, internet and mobile",
                date: dateFor(-5, 14),
            },
            {
                type: "expense",
                amount: 3000,
                category: "Shopping",
                description: "Clothing and personal items",
                date: dateFor(-5, 20),
            },

            // ========================================================
            // MAY
            // ========================================================

            {
                type: "income",
                amount: 55000,
                category: "Salary",
                description: "Monthly salary",
                date: dateFor(-4, 1),
                isRecurring: true,
                frequency: "monthly",
            },
            {
                type: "expense",
                amount: 17000,
                category: "Rent",
                description: "Monthly rent",
                date: dateFor(-4, 2),
            },
            {
                type: "expense",
                amount: 5600,
                category: "Food",
                description: "Groceries and restaurants",
                date: dateFor(-4, 5),
            },
            {
                type: "expense",
                amount: 3500,
                category: "Travel",
                description: "Travel expenses",
                date: dateFor(-4, 9),
            },
            {
                type: "expense",
                amount: 3000,
                category: "Bills",
                description: "Utility bills",
                date: dateFor(-4, 13),
            },
            {
                type: "expense",
                amount: 4000,
                category: "Shopping",
                description: "Shopping",
                date: dateFor(-4, 18),
            },
            {
                type: "expense",
                amount: 1200,
                category: "Health",
                description: "Pharmacy",
                date: dateFor(-4, 23),
            },

            // ========================================================
            // JUNE
            // ========================================================

            {
                type: "income",
                amount: 60000,
                category: "Salary",
                description: "Monthly salary",
                date: dateFor(-3, 1),
                isRecurring: true,
                frequency: "monthly",
            },
            {
                type: "income",
                amount: 5000,
                category: "Freelance",
                description: "Freelance project payment",
                date: dateFor(-3, 12),
            },
            {
                type: "expense",
                amount: 17500,
                category: "Rent",
                description: "Monthly rent",
                date: dateFor(-3, 2),
            },
            {
                type: "expense",
                amount: 6200,
                category: "Food",
                description: "Groceries and dining",
                date: dateFor(-3, 6),
            },
            {
                type: "expense",
                amount: 3600,
                category: "Travel",
                description: "Local travel",
                date: dateFor(-3, 10),
            },
            {
                type: "expense",
                amount: 3100,
                category: "Bills",
                description: "Electricity and internet",
                date: dateFor(-3, 14),
            },
            {
                type: "expense",
                amount: 2800,
                category: "Health",
                description: "Medical and pharmacy",
                date: dateFor(-3, 20),
            },
            {
                type: "expense",
                amount: 3000,
                category: "Shopping",
                description: "Personal shopping",
                date: dateFor(-3, 25),
            },

            // ========================================================
            // JULY
            // ========================================================

            {
                type: "income",
                amount: 60000,
                category: "Salary",
                description: "Monthly salary",
                date: dateFor(-2, 1),
                isRecurring: true,
                frequency: "monthly",
            },
            {
                type: "expense",
                amount: 17500,
                category: "Rent",
                description: "Monthly rent",
                date: dateFor(-2, 2),
            },
            {
                type: "expense",
                amount: 6800,
                category: "Food",
                description: "Groceries and dining",
                date: dateFor(-2, 5),
            },
            {
                type: "expense",
                amount: 4500,
                category: "Travel",
                description: "Travel and commuting",
                date: dateFor(-2, 9),
            },
            {
                type: "expense",
                amount: 3400,
                category: "Bills",
                description: "Utility bills",
                date: dateFor(-2, 13),
            },
            {
                type: "expense",
                amount: 4200,
                category: "Shopping",
                description: "Shopping",
                date: dateFor(-2, 17),
            },
            {
                type: "expense",
                amount: 2000,
                category: "Other",
                description: "Miscellaneous expenses",
                date: dateFor(-2, 23),
            },

            // ========================================================
            // AUGUST
            // ========================================================

            {
                type: "income",
                amount: 62000,
                category: "Salary",
                description: "Monthly salary",
                date: dateFor(-1, 1),
                isRecurring: true,
                frequency: "monthly",
            },
            {
                type: "income",
                amount: 8000,
                category: "Freelance",
                description: "Freelance project payment",
                date: dateFor(-1, 14),
            },
            {
                type: "expense",
                amount: 18000,
                category: "Rent",
                description: "Monthly rent",
                date: dateFor(-1, 2),
            },
            {
                type: "expense",
                amount: 5400,
                category: "Food",
                description: "Groceries and dining",
                date: dateFor(-1, 6),
            },
            {
                type: "expense",
                amount: 3900,
                category: "Travel",
                description: "Travel expenses",
                date: dateFor(-1, 10),
            },
            {
                type: "expense",
                amount: 3300,
                category: "Bills",
                description: "Electricity and internet",
                date: dateFor(-1, 13),
            },
            {
                type: "expense",
                amount: 3500,
                category: "Shopping",
                description: "Personal shopping",
                date: dateFor(-1, 18),
            },
            {
                type: "expense",
                amount: 1800,
                category: "Health",
                description: "Health and pharmacy",
                date: dateFor(-1, 24),
            },

            // ========================================================
            // SEPTEMBER - CURRENT MONTH
            // ========================================================

            {
                type: "income",
                amount: 65000,
                category: "Salary",
                description: "Monthly salary",
                date: dateFor(0, 1),
                isRecurring: true,
                frequency: "monthly",
            },
            {
                type: "income",
                amount: 7000,
                category: "Freelance",
                description: "Freelance project payment",
                date: dateFor(0, 7),
            },
            {
                type: "expense",
                amount: 18000,
                category: "Rent",
                description: "Monthly rent",
                date: dateFor(0, 2),
            },
            {
                type: "expense",
                amount: 6500,
                category: "Food",
                description: "Groceries and dining",
                date: dateFor(0, 5),
            },
            {
                type: "expense",
                amount: 4200,
                category: "Travel",
                description: "Travel and commuting",
                date: dateFor(0, 8),
            },
            {
                type: "expense",
                amount: 3200,
                category: "Bills",
                description: "Electricity, internet and mobile",
                date: dateFor(0, 11),
            },
            {
                type: "expense",
                amount: 4500,
                category: "Shopping",
                description: "Shopping and personal items",
                date: dateFor(0, 13),
            },
            {
                type: "expense",
                amount: 1500,
                category: "Health",
                description: "Pharmacy and health expenses",
                date: dateFor(0, 15),
            },
            {
                type: "expense",
                amount: 1200,
                category: "Other",
                description: "Miscellaneous expenses",
                date: dateFor(0, 18),
            },
        ];

        const transactionDocuments = transactions.map((transaction) => ({
            ...transaction,
            user: user._id,
        }));

        await Transaction.insertMany(transactionDocuments);

        console.log(`Added ${transactionDocuments.length} transactions`);

        // ==========================================================
        // INVESTMENT HOLDINGS
        // ==========================================================

        const holdings = [
            {
                symbol: "TCS",
                name: "Tata Consultancy Services",
                quantity: 100,
                buyPrice: 210,
                buyDate: dateFor(-4, 8),
            },
            {
                symbol: "INFY",
                name: "Infosys",
                quantity: 60,
                buyPrice: 280,
                buyDate: dateFor(-3, 15),
            },
            {
                symbol: "RELIANCE",
                name: "Reliance Industries",
                quantity: 40,
                buyPrice: 340,
                buyDate: dateFor(-3, 22),
            },
            {
                symbol: "HDFCBANK",
                name: "HDFC Bank",
                quantity: 80,
                buyPrice: 90,
                buyDate: dateFor(-2, 10),
            },
            {
                symbol: "AAPL",
                name: "Apple Inc.",
                quantity: 20,
                buyPrice: 180,
                buyDate: dateFor(-1, 12),
            },
            {
                symbol: "MSFT",
                name: "Microsoft",
                quantity: 10,
                buyPrice: 420,
                buyDate: dateFor(-1, 20),
            },
        ];

        await Holding.insertMany(
            holdings.map((holding) => ({
                ...holding,
                user: user._id,
            }))
        );

        console.log(`Added ${holdings.length} holdings`);

        // ==========================================================
        // WATCHLIST
        // ==========================================================

        const watchlist = [
            {
                symbol: "ICICIBANK",
                name: "ICICI Bank",
            },
            {
                symbol: "SBIN",
                name: "State Bank of India",
            },
            {
                symbol: "LT",
                name: "Larsen & Toubro",
            },
            {
                symbol: "ITC",
                name: "ITC",
            },
            {
                symbol: "AAPL",
                name: "Apple Inc.",
            },
            {
                symbol: "MSFT",
                name: "Microsoft",
            },
        ];

        await Watchlist.insertMany(
            watchlist.map((item) => ({
                ...item,
                user: user._id,
            }))
        );

        console.log(`Added ${watchlist.length} watchlist stocks`);

        // ==========================================================
        // CURRENT MONTH BUDGETS
        // ==========================================================

        const now = new Date();

        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const budgets = [
            {
                category: "Food",
                amount: 8000,
            },
            {
                category: "Travel",
                amount: 5000,
            },
            {
                category: "Shopping",
                amount: 6000,
            },
            {
                category: "Bills",
                amount: 4000,
            },
            {
                category: "Rent",
                amount: 20000,
            },
            {
                category: "Health",
                amount: 2500,
            },
            {
                category: "Other",
                amount: 2500,
            },
        ];

        await Budget.insertMany(
            budgets.map((budget) => ({
                ...budget,
                user: user._id,
                month: currentMonth,
                year: currentYear,
            }))
        );

        console.log(`Added ${budgets.length} budgets`);

        // ==========================================================
        // FINAL SUMMARY
        // ==========================================================

        console.log("");
        console.log("======================================");
        console.log("Ledger demo data seeded successfully");
        console.log("======================================");
        console.log("");
        console.log("Demo User");
        console.log("--------------------------------------");
        console.log(`Name:     ${DEMO_USER.name}`);
        console.log(`Email:    ${DEMO_USER.email}`);
        console.log(`Password: ${DEMO_USER.password}`);
        console.log("");
        console.log("Data");
        console.log("--------------------------------------");
        console.log(`Transactions: ${transactionDocuments.length}`);
        console.log(`Holdings:     ${holdings.length}`);
        console.log(`Watchlist:    ${watchlist.length}`);
        console.log(`Budgets:      ${budgets.length}`);
        console.log("");
        console.log("Your normal account was NOT modified.");
        console.log("======================================");
    } catch (error) {
        console.error("");
        console.error("Seed failed:");
        console.error(error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

seed();