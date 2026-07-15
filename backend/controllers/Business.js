const Business = require("../models/Business")
const User = require("../models/User")
const { sanitizeUser } = require("../utils/SanitizeUser")
const { generateToken } = require("../utils/GenerateToken")

const slugify = (name) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

exports.create = async (req, res) => {
    try {
        const existingUser = await User.findById(req.user._id)

        if (existingUser.businessId) {
            return res.status(400).json({ message: "You already own a business" })
        }

        const { name, gstNumber, phone, address } = req.body

        if (!name) {
            return res.status(400).json({ message: "Business name is required" })
        }

        // derive a unique slug from the name, resolving collisions with a numeric suffix
        const baseSlug = slugify(name)
        let slug = baseSlug
        let suffix = 1
        while (await Business.findOne({ slug })) {
            slug = `${baseSlug}-${suffix}`
            suffix++
        }

        const business = new Business({ name, slug, ownerUserId: existingUser._id, gstNumber, phone, address })
        await business.save()

        existingUser.businessId = business._id
        existingUser.role = "owner"
        await existingUser.save()

        // req.user is the OLD JWT payload (no businessId) -- re-issue the token so
        // subsequent requests carry the fresh businessId claim
        const secureInfo = sanitizeUser(existingUser)
        const token = generateToken(secureInfo)

        res.cookie('token', token, {
            sameSite: process.env.PRODUCTION === 'true' ? "None" : 'Lax',
            maxAge: new Date(Date.now() + (parseInt(process.env.COOKIE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000))),
            httpOnly: true,
            secure: process.env.PRODUCTION === 'true' ? true : false
        })

        res.status(201).json({ business, user: secureInfo })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error occurred while creating business, please try again later" })
    }
}

exports.getMine = async (req, res) => {
    try {
        const business = await Business.findById(req.businessId)

        if (!business) {
            return res.status(404).json({ message: "Business not found" })
        }

        res.status(200).json(business)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error occurred while fetching business" })
    }
}

exports.inviteStaff = async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ message: "email is required" })
        }

        const invitee = await User.findOne({ email })

        if (!invitee) {
            return res.status(404).json({ message: "No account found for this email. Ask them to sign up first, then invite them." })
        }

        if (String(invitee._id) === String(req.user._id)) {
            return res.status(400).json({ message: "You cannot invite yourself" })
        }

        if (invitee.businessId) {
            const message = String(invitee.businessId) === String(req.businessId)
                ? "This user is already part of your team"
                : "This user already belongs to another business"
            return res.status(400).json({ message })
        }

        invitee.businessId = req.businessId
        invitee.role = "staff"
        await invitee.save()

        res.status(200).json({ _id: invitee._id, name: invitee.name, email: invitee.email, role: invitee.role })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error inviting staff member, please try again later" })
    }
}

exports.listStaff = async (req, res) => {
    try {
        const members = await User.find({ businessId: req.businessId }).select("name email role")
        res.status(200).json(members)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error fetching team members" })
    }
}

exports.removeStaff = async (req, res) => {
    try {
        const { userId } = req.params
        const member = await User.findOne({ _id: userId, businessId: req.businessId })

        if (!member) {
            return res.status(404).json({ message: "Team member not found" })
        }

        if (member.role === "owner") {
            return res.status(400).json({ message: "Cannot remove the business owner" })
        }

        member.businessId = null
        member.role = null
        await member.save()

        res.status(200).json({ message: "Team member removed" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error removing team member" })
    }
}
