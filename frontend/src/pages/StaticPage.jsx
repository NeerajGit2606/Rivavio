import { Box, Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Navbar } from '../features/navigation/components/Navbar'
import { Footer } from '../features/footer/Footer'

const pages = {
    about: {
        title: 'About Us',
        subtitle: 'OUR STORY',
        sections: [
            { heading: 'Who We Are', body: 'Rivavio is a premium e-commerce destination founded with one mission — to bring quality products directly to your doorstep at honest prices. We partner with trusted brands across Beauty, Fragrances, Furniture, and Groceries to curate a collection that meets the highest standards.' },
            { heading: 'Our Mission', body: 'We believe shopping should be simple, transparent, and enjoyable. Every product on Rivavio is hand-picked by our team to ensure it meets our quality bar. No compromises, no gimmicks — just great products delivered fast.' },
            { heading: 'Our Values', body: 'Customer first. Always. We build everything around the experience of the people who trust us with their purchases. Integrity, quality, and speed are not just words — they are our operating principles.' },
        ]
    },
    team: {
        title: 'Our Team',
        subtitle: 'THE PEOPLE BEHIND RIVAVIO',
        sections: [
            { heading: 'Leadership', body: 'Our leadership team brings decades of combined experience in e-commerce, logistics, and product curation. We are a lean, passionate team driven by the challenge of building the best online shopping experience in India.' },
            { heading: 'Customer Support', body: 'Our support team is available Monday to Saturday, 9 AM to 6 PM IST. We take pride in resolving every query within 24 hours. Real people, real solutions.' },
            { heading: 'Join Us', body: 'We are always looking for talented people who share our passion for great products and exceptional service. Check our Careers page for open positions.' },
        ]
    },
    careers: {
        title: 'Careers',
        subtitle: 'GROW WITH US',
        sections: [
            { heading: 'Why Rivavio?', body: 'At Rivavio, you will work alongside passionate people building something meaningful. We offer competitive salaries, flexible work arrangements, and a culture that values ownership and creativity.' },
            { heading: 'Open Positions', body: 'We are currently hiring for roles in Engineering, Product, Marketing, and Customer Support. Send your resume to careers@rivavio.com with the role in the subject line.' },
            { heading: 'Internships', body: 'We offer internships for students in their final year of study. Duration: 3–6 months. Reach out to careers@rivavio.com to learn more.' },
        ]
    },
    help: {
        title: 'Help Center',
        subtitle: 'HOW CAN WE HELP?',
        sections: [
            { heading: 'Order Issues', body: 'If you have any issue with your order — wrong item, damaged product, or missing package — contact us within 7 days of delivery. We will arrange a replacement or refund immediately.' },
            { heading: 'Payment Problems', body: 'Payments on Rivavio are secured by Razorpay. If your payment was deducted but order was not placed, the amount will be refunded to your source within 5–7 business days.' },
            { heading: 'Account Help', body: 'Forgot your password? Use the "Forgot Password" link on the login page. For any other account-related issues, email support@rivavio.com.' },
        ]
    },
    returns: {
        title: 'Returns & Refunds',
        subtitle: 'HASSLE-FREE RETURNS',
        sections: [
            { heading: '30-Day Return Policy', body: 'We offer a 30-day return window on all products. If you are not satisfied with your purchase for any reason, you can return it within 30 days of delivery for a full refund.' },
            { heading: 'How to Return', body: 'Go to My Orders → select the order → click "Request Return". Our logistics partner will pick up the item from your doorstep within 2–3 business days at no cost to you.' },
            { heading: 'Refund Timeline', body: 'Once we receive and inspect the returned item, refunds are processed within 3–5 business days. The amount will be credited to your original payment method or Rivavio wallet.' },
        ]
    },
    privacy: {
        title: 'Privacy Policy',
        subtitle: 'YOUR DATA, YOUR RIGHTS',
        sections: [
            { heading: 'Information We Collect', body: 'We collect information you provide directly (name, email, address, payment info) and information collected automatically (browsing behavior, device type, IP address). We never sell your personal data to third parties.' },
            { heading: 'How We Use Your Data', body: 'Your data is used to process orders, send shipping updates, improve our services, and send promotional communications (only with your consent). You can opt out of marketing emails at any time.' },
            { heading: 'Data Security', body: 'All data is encrypted in transit (HTTPS) and at rest. Payment information is processed by Razorpay and never stored on our servers. We conduct regular security audits to protect your information.' },
            { heading: 'Contact', body: 'For any privacy-related concerns, email privacy@rivavio.com. We will respond within 48 hours.' },
        ]
    },
    terms: {
        title: 'Terms of Use',
        subtitle: 'PLEASE READ CAREFULLY',
        sections: [
            { heading: 'Acceptance of Terms', body: 'By using Rivavio, you agree to these Terms of Use. If you do not agree, please do not use our platform. We reserve the right to update these terms at any time with notice.' },
            { heading: 'Use of Platform', body: 'You may use Rivavio for personal, non-commercial purposes only. You agree not to misuse the platform, attempt unauthorized access, or engage in fraudulent transactions.' },
            { heading: 'Intellectual Property', body: 'All content on Rivavio including logos, product images, and text is owned by Rivavio or its content suppliers. You may not reproduce, distribute, or create derivative works without explicit permission.' },
            { heading: 'Limitation of Liability', body: 'Rivavio is not liable for indirect, incidental, or consequential damages arising from your use of the platform. Our total liability is limited to the amount paid for the specific transaction in question.' },
        ]
    },
    cookies: {
        title: 'Cookie Policy',
        subtitle: 'HOW WE USE COOKIES',
        sections: [
            { heading: 'What Are Cookies?', body: 'Cookies are small text files stored on your device when you visit our website. They help us remember your preferences, keep you logged in, and understand how you use our platform.' },
            { heading: 'Types of Cookies We Use', body: 'Essential cookies (required for the site to function), Analytics cookies (to understand usage patterns), and Marketing cookies (to show relevant ads). You can control cookie preferences in your browser settings.' },
            { heading: 'Managing Cookies', body: 'You can disable cookies in your browser settings. Note that disabling essential cookies may affect your shopping experience — you may not be able to add items to cart or check out.' },
        ]
    },
    faq: {
        title: 'FAQ',
        subtitle: 'FREQUENTLY ASKED QUESTIONS',
        faqs: [
            { q: 'How long does delivery take?', a: 'Standard delivery takes 3–5 business days. Express delivery (available in select cities) takes 1–2 business days.' },
            { q: 'Can I track my order?', a: 'Yes. Go to My Orders and click on the order you want to track. You will see real-time status updates.' },
            { q: 'What payment methods do you accept?', a: 'We accept UPI, Credit/Debit Cards, Net Banking, and Cash on Delivery (COD) for eligible orders.' },
            { q: 'Is it safe to use my card on Rivavio?', a: 'Absolutely. Payments are processed by Razorpay, a PCI-DSS compliant payment gateway. Your card information is never stored on our servers.' },
            { q: 'Can I cancel my order?', a: 'Yes, you can cancel an order before it is dispatched. Go to My Orders and click Cancel. If the order is already shipped, please use the Returns process.' },
            { q: 'Do you offer Cash on Delivery?', a: 'Yes, COD is available for most pin codes across India. COD orders above ₹5000 may require a small advance payment.' },
            { q: 'How do I use a coupon code?', a: 'Enter your coupon code in the "Apply Coupon" field at checkout. The discount will be applied automatically if the code is valid and your cart meets the minimum order value.' },
            { q: 'What is the Rivavio Wallet?', a: 'Your Rivavio Wallet is credited when you return items or receive refunds. The balance can be used for future purchases at checkout.' },
        ]
    },
    'track-order': {
        title: 'Track Your Order',
        subtitle: 'ORDER TRACKING',
        sections: [
            { heading: 'How to Track', body: 'Login to your account → Go to "My Orders" → Click on the order you want to track. You will see the current status and expected delivery date.' },
            { heading: 'Order Statuses', body: 'Pending: Order received and being processed. Dispatched: Order handed to our logistics partner. Out for Delivery: Order is on its way to you. Delivered: Order successfully delivered.' },
            { heading: 'Need Help?', body: 'If your order has been stuck in one status for more than 3 business days, please contact our support team at support@rivavio.com or call +91 98765 43210.' },
        ]
    },
}

export const StaticPage = ({ pageKey }) => {
    const page = pages[pageKey]
    if (!page) return null

    return (
        <>
            <Navbar />
            <Box sx={{ bgcolor: '#f9f9f7', minHeight: '60vh' }}>
                <Box sx={{ bgcolor: '#1a1a1a', py: 7, textAlign: 'center' }}>
                    <Typography sx={{ color: '#C9A96E', letterSpacing: 4, fontSize: 12, mb: 1 }}>{page.subtitle}</Typography>
                    <Typography variant="h3" sx={{ color: 'white', fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>{page.title}</Typography>
                </Box>

                <Box sx={{ maxWidth: 860, mx: 'auto', px: { xs: 2, md: 5 }, py: 8 }}>
                    {page.faqs ? (
                        // FAQ accordion
                        page.faqs.map((item, i) => (
                            <Accordion key={i} elevation={0} sx={{ mb: 1, border: '1px solid #eee', '&:before': { display: 'none' } }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{item.q}</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography sx={{ color: '#555', lineHeight: 1.8, fontSize: 14 }}>{item.a}</Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))
                    ) : (
                        // Regular sections
                        page.sections.map((s, i) => (
                            <Box key={i} sx={{ mb: 5 }}>
                                <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', mb: 1.5, pb: 1, borderBottom: '2px solid #C9A96E', display: 'inline-block' }}>
                                    {s.heading}
                                </Typography>
                                <Typography sx={{ color: '#555', lineHeight: 1.9, fontSize: 15 }}>{s.body}</Typography>
                            </Box>
                        ))
                    )}
                </Box>
            </Box>
            <Footer />
        </>
    )
}
