const Review = require("../models/Review")
const Order = require("../models/Order")

exports.create = async (req, res) => {
    try {
        // Verified purchase badge: only true if this user has an order containing this product
        const matchingOrder = await Order.findOne({
            user: req.body.user,
            status: { $ne: 'Cancelled' },
            item: { $elemMatch: { 'product._id': req.body.product } }
        })

        const created = new Review({ ...req.body, isVerifiedPurchase: !!matchingOrder })
        await created.save()
        await created.populate({ path: 'user', select: '-password' });
        res.status(201).json(created)
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error posting review, please trying again later' })
    }
}

exports.getByProductId = async (req, res) => {
    try {
        const { id } = req.params
        let skip = 0
        let limit = 0

        if (req.query.page && req.query.limit) {
            const pageSize = req.query.limit
            const page = req.query.page

            skip = pageSize * (page - 1)
            limit = pageSize
        }
        const query = { product: id, isApproved: true };
        const result = await Review.find(query).skip(skip).limit(limit).populate('user').exec();
        const totalDocs = await Review.find(query).countDocuments().exec();

        res.set("X-Total-Count", totalDocs)
        res.status(200).json(result)

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error getting reviews for this product, please try again later' })
    }
}

exports.updateById = async (req, res) => {
    try {
        const { id } = req.params
        const updated = await Review.findByIdAndUpdate(id, req.body, { new: true }).populate('user')
        res.status(200).json(updated)
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error updating review, please try again later' })
    }
}

exports.deleteById = async (req, res) => {
    try {
        const { id } = req.params
        const deleted = await Review.findByIdAndDelete(id)
        res.status(200).json(deleted)
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error deleting review, please try again later' })
    }
}

exports.toggleApproval = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findById(id);
        if (!review) return res.status(404).json({ message: "Review not found" });

        review.isApproved = !review.isApproved;
        await review.save();
        res.status(200).json(review);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error toggling approval, please try again later' });
    }
};
