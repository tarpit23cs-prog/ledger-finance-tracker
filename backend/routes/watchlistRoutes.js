const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require("../controllers/watchlistController");

const router = express.Router();

router.use(protect);
router.route("/").get(getWatchlist).post(addToWatchlist);
router.delete("/:id", removeFromWatchlist);

module.exports = router;
