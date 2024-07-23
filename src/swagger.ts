import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { Express } from 'express'

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: "Top Hat's Discussion Forum API",
            version: '1.0.0',
        },
    },
    apis: ['./src/routes/*.ts'], // Path to the API docs
}

const swaggerSpec = swaggerJsdoc(options)

export function setupSwagger(app: Express) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}
