//Config inicial
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const app = express()

//Config JSON read / Middlewares
app.use(
    express.urlencoded({
        extended: true,
    })
)
//Config JSON response
app.use(express.json())

//Models
const User = require('./models/User')

//Public Routes
const personRoutes = require('./routes/personRoutes')

app.use('/person', personRoutes)

app.get('/', (req, res) => {
    res.json({ msg: "!Bem Vindo a API!" })
})

//Private Routes
app.get('/user/:id', checkToken, async (req, res) => {
    const id = req.params.id

    //Check if user exists
    const user = await User.findById(id, '-password')

    if(!user){
        return res.status(404).json({msg: 'Usuário não encontrado'})
    }

    res.status(200).json({ user })
})

function checkToken(req, res, next){
    
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]

    if(!token){
        return res.status(401).json({msg: "Acesso negado"})
    }

    try{
        const secret = process.env.SECRET
        jwt.verify(token, secret) 
        next()   
    }catch(error){
        res.status(400).json({msg: "Token Invalido!"})
    }
}

//Register user
app.post('/auth/register', async (req, res) => {
    const { name, email, password, confirmpassword } = req.body
    //Validations
    if (!name) {
        return res.status(422).json({ msg: 'O nome é obrigatório!' })
    }
    if (!email) {
        return res.status(422).json({ msg: 'O email é obrigatório!' })
    }
    if (!password) {
        return res.status(422).json({ msg: 'A senha  é obrigatório!' })
    }
    if (password !== confirmpassword) {
        return res.status(422).json({ msg: 'As senhas não conferem!' })
    }
    //Check if user exists
    const userExists = await User.findOne({ email: email })
    if (userExists) {
        return res.status(422).json({ msg: 'Por favor utilize outro e-mail' })
    }

    //Create password
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    //Create user
    const user = new User({
        name,
        email,
        password: passwordHash,
    })

    try {
        await user.save()
        res.status(201).json({ msg: "Usuário criado com sucesso!" })
    } catch (error) {
        res.status(500).json({ msg: "Erro no servidor! tente novamente mais tarde." })
    }
})

//Login User
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body

    if (!email) {
        return res.status(422).json({ msg: 'O email é obrigatório!' })
    }
    if (!password) {
        return res.status(422).json({ msg: 'A senha  é obrigatória!' })
    }

    const user = await User.findOne({ email: email })
    if (!user) {
        return res.status(404).json({ msg: 'Usuário não encontrado no DB' })
    }

    //Check if password match
    const checkPassword = await bcrypt.compare(password, user.password)

    if (!checkPassword) {
        return res.status(422).json({ msg: "!Senha inválida!" })
    }

    try {
        const secret = process.env.SECRET
        const token = jwt.sign(
            {
                id: user._id
            },
            secret,
        )
        res.status(200).json({msg: 'Usuário autenticado com sucesso', token})
    } catch (error) {
        res.status(500).json({ msg: "Erro no servidor! tente novamente mais tarde." })
    }

})


//Credencials
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

