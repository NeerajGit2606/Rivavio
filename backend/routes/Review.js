const express=require('express')
const reviewController=require("../controllers/Review")
const router=express.Router()
const { authMiddleware, adminMiddleware } = require("../middlewares/auth");

// ⭐ Create review (auth required)
router.post("/", authMiddleware, reviewController.create);

// ⭐ Get reviews by product (public, paginated)
router.get("/product/:id", reviewController.getByProductId);

// ⭐ Update own review (auth required)
router.put("/:id", authMiddleware, reviewController.updateById);

// ⭐ Delete own review (auth required)
router.delete("/:id", authMiddleware, reviewController.deleteById);

// ⭐ Admin approve/hide toggle
router.patch("/:id/approve", adminMiddleware, reviewController.toggleApproval);

module.exports=router