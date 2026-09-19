const cron = require("node-cron");
const Transaction = require("../models/Transaction");

const addInterval = (date, frequency) => {
  const next = new Date(date);
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      break;
  }
  return next;
};

const processRecurringTransactions = async () => {
  const now = new Date();
  const due = await Transaction.find({
    isRecurring: true,
    frequency: { $ne: "none" },
    nextOccurrence: { $lte: now },
  });

  for (const source of due) {
    // eslint-disable-next-line no-await-in-loop
    await Transaction.create({
      user: source.user,
      type: source.type,
      amount: source.amount,
      category: source.category,
      description: source.description,
      date: now,
      isRecurring: false,
      frequency: "none",
    });

    source.nextOccurrence = addInterval(source.nextOccurrence || now, source.frequency);
    // eslint-disable-next-line no-await-in-loop
    await source.save();
  }

  if (due.length > 0) {
    console.log(`Recurring job: created ${due.length} transaction(s)`);
  }
};

const startRecurringJob = () => {
  // Runs once a day at 00:05
  cron.schedule("5 0 * * *", processRecurringTransactions);
};

module.exports = { startRecurringJob, processRecurringTransactions };
