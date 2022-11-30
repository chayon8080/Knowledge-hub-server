const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000



const app = express();

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wd5n7ku.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthorized access')
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        console.log(err, decoded)
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next()
    })
}


async function run() {
    try {
        const catagoriesCollection = client.db('knowledgeHub').collection('catagories')
        const bookingsCollection = client.db('knowledgeHub').collection('bookings')
        const buyersCollection = client.db('knowledgeHub').collection('buyers')
        app.get('/catagories', async (req, res) => {
            const query = {}
            const catagories = await catagoriesCollection.find(query).toArray()
            res.send(catagories)
        })
        app.get('/catagories/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const query = await catagoriesCollection.findOne(filter);
            console.log(query)
            res.send(query)
        })
        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })



        app.post('/buyers', async (req, res) => {
            const buyer = req.body;
            console.log(buyer)
            const result = await buyersCollection.insertOne(buyer);
            res.send(result);
        })
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            console.log('email', email)
            const query = { email: email };
            const user = await buyersCollection.findOne(query);
            console.log('user', user)
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: '' })
        })
    }

    finally {

    }
}
run().catch(console.log)


app.get('/', async (req, res) => {
    res.send('knowledge hub server is running')
})

app.listen(port, () => console.log(`knowledge-hub server is running on port ${port}`))