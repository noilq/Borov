const express = require('express')
const db = require('./database')
const bodyParser = require('body-parser')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')
const PORT = process.env.PORT ?? 5000

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, '../frontend/src/pages')))

const userRoutes = require('./routes/UserRoutes')
const postRoutes = require('./routes/PostRoutes')
const commentRoutes = require('./routes/CommentRoutes')
const feedRoutes = require('./routes/FeedRoutes')

app.use('/user', userRoutes)
app.use('/post', postRoutes)
app.use('/comment', commentRoutes)
app.use('/feed', feedRoutes)

//SWAGGER
const swaggerJSDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

const swaggerOptions = {
    swaggerDefinition: {
      info: {
        title: 'API',
        version: '1.0.0',
        description: '',
      },
    },
    apis: ['./routes/*.js'], 
  }
  
const swaggerSpec = swaggerJSDoc(swaggerOptions)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})

