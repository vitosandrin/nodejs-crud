//config inicial
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const app = express()

//config ler json / middlewares
app.use(
    express.urlencoded({
        extended: true,
    })
)

app.use(express.json())

//rotas da API
const personRoutes = require('./routes/personRoutes')

app.use('/person', personRoutes)

//rota inicial
app.get('/', (req, res) => {
    res.json({ message: "oi express" })
})

//definir porta
const DB_USER = process.env.DB_USER 
const DB_PASSWORD = encodeURIComponent(process.env.DB_PASSWORD)

mongoose
    .connect(
        `mongodb+srv://${DB_USER}:${DB_PASSWORD}@apicluster.erh0c.mongodb.net/database?retryWrites=true&w=majority`
    )
    .then(() => {
        console.log('!Database Conected!')
        app.listen(5000)
    })
    .catch((err) => console.log(err))

