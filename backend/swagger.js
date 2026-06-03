const swaggerJsdoc = require('swagger-jsdoc')

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'CartForge API',
            version: '1.0.0',
            description: 'E-commerce backend API documentation',
        },
        servers: [
            { url: 'http://localhost:8000', description: 'Local server' }
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'token'
                }
            },
            schemas: {
                // ✅ Reusable schemas — ek jagah define, sab jagah use
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '64a1b2c3d4e5f6789abc1234' },
                        name: { type: 'string', example: 'Neeraj Sharma' },
                        email: { type: 'string', example: 'neeraj@example.com' },
                        isAdmin: { type: 'boolean', example: false },
                        isVerified: { type: 'boolean', example: true },
                    }
                },
                Review: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '64a1b2c3d4e5f6789abc0001' },
                        user: { $ref: '#/components/schemas/User' },
                        product: { type: 'string', example: '64a1b2c3d4e5f6789abc0002' },
                        rating: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
                        comment: { type: 'string', example: 'Great product!' },
                        isApproved: { type: 'boolean', example: false },
                        createdAt: { type: 'string', format: 'date-time' },
                    }
                },
                Address: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '64a1f2b3c4d5e6f7g8h9' },
                        user: { type: 'string', example: '64a1b2c3d4e5f6789abc0001' },
                        street: { type: 'string', example: '123 Main Street' },
                        city: { type: 'string', example: 'Delhi' },
                        state: { type: 'string', example: 'Delhi' },
                        postalCode: { type: 'string', example: '110001' },
                        country: { type: 'string', example: 'India' },
                    }
                },
                Brand: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '64a1b2c3d4e5f6789abc1111' },
                        name: { type: 'string', example: 'Nike' },
                        logo: { type: 'string', example: 'https://example.com/nike-logo.png' },
                        description: { type: 'string', example: 'Leading sportswear brand' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                }
                ,
                Category: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '64a1b2c3d4e5f6789abc2222' },
                        name: { type: 'string', example: 'Electronics' },
                        description: { type: 'string', example: 'Devices and gadgets' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Order: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '64a1b2c3d4e5f6789abc3333' },
                        user: { type: 'string', example: '64a1b2c3d4e5f6789abc0001' },
                        items: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ["64a1b2c3d4e5f6789abc0002"]
                        },
                        totalAmount: { type: 'number', example: 4999 },
                        status: { type: 'string', example: 'Pending' },
                        paymentMethod: { type: 'string', example: 'Credit Card' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                }
                ,
                Payment: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '64a1b2c3d4e5f6789abc4444' },
                        orderId: { type: 'string', example: 'order_DBJOWzybf0sJbb' },
                        paymentId: { type: 'string', example: 'pay_DBJOuTyf0sJbb' },
                        amount: { type: 'number', example: 4999 },
                        currency: { type: 'string', example: 'INR' },
                        status: { type: 'string', example: 'Success' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Product: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '64a1b2c3d4e5f6789abc5555' },
                        name: { type: 'string', example: 'iPhone 15 Pro' },
                        description: { type: 'string', example: 'Latest Apple smartphone with A17 chip' },
                        price: { type: 'number', example: 129999 },
                        brand: { type: 'string', example: '64a1b2c3d4e5f6789abc1111' },
                        category: { type: 'string', example: '64a1b2c3d4e5f6789abc2222' },
                        isDeleted: { type: 'boolean', example: false },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Review: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '64a1b2c3d4e5f6789abc0001' },
                        user: { $ref: '#/components/schemas/User' },
                        product: { type: 'string', example: '64a1b2c3d4e5f6789abc0002' },
                        rating: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
                        comment: { type: 'string', example: 'Great product!' },
                        isApproved: { type: 'boolean', example: true },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Wishlist: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '64a1f2b3c4d5e6f7g8h9' },
                        user: { type: 'string', example: '64a1b2c3d4e5f6789abc0001' },
                        product: { type: 'string', example: '64a1b2c3d4e5f6789abc0002' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                }
                , Error: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Something went wrong' }
                    }
                }
            }
        }
    },
    // ✅ Ye batao ki comments kahan se padhne hain
    apis: ['./routes/*.js'],
}

const swaggerSpec = swaggerJsdoc(options)
module.exports = swaggerSpec