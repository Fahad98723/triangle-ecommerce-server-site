const express = require('express')
const app = express()
const port = process.env.PORT || 5000
require('dotenv').config()
const cors = require('cors')
const fileUpload = require('express-fileupload')
const ObjectId = require('mongodb').ObjectId;
const stripe = require("stripe")(process.env.STRIPE_SECRET);

app.use(cors())
app.use(express.json())
app.use(fileUpload())
const { MongoClient} = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rf28w.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
      await client.connect();
      const database = client.db("TriangleEcommerce");
      const productsCollection = database.collection("products");
      const usersCollection = database.collection("users");
      const ordersCollection = database.collection("orders");

      console.log('database connected');
      app.post('/products', async (req, res) => {
          const name = req.body.name
          // const image = req.files.image
          const category = req.body.category
          const descriptions = req.body.descriptions
          const gender = req.body.gender
          const price = req.body.price
          const img = req.body.img
          // const imageData = image.data
          // const encodedImage = imageData.toString('base64')
          // const imageBuffer = Buffer.from(encodedImage, 'base64')
          const product = {
              name, category, descriptions, price, gender, img
              // img : imageBuffer
          }

        // const result = await productsCollection.insertOne(product)
        const result = await productsCollection.insertOne(product)
        console.log(product);
        res.json(result)
      })

      app.get('/products', async (req,res) => {
          const result = await productsCollection.find().toArray()
          res.send(result)
      })

      app.get('/products/:id', async (req, res) => {
          const id = req.params.id
          const query = {_id : ObjectId(id)}
          console.log(query);
          const product = await productsCollection.findOne(query)
          res.send(product)

      })

      app.post('/users', async (req, res) => {
        const user = req.body
        const result = await usersCollection.insertOne(user)
        res.json(result)
      })

      app.put('/users' , async (req, res) => {
        const data = req.body
        const filter = {email : data.email}
        const options = {upsert : true}
        const updateDoc = {
          $set: data
        }
        const result = await usersCollection.updateOne(filter, updateDoc, options);
        res.json(result)
      })

      app.post("/create-payment-intent", async (req, res) => {
        const paymentInfo = req.body;
        const amount = paymentInfo.totalAmount * 100
        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "eur",
          payment_method_types: ["card"],
        });
      
        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      });

      app.post('/orders', async (req, res) => {
        const data = req.body
        console.log(data);
        const result = await ordersCollection.insertOne(data)
        res.json(result)
      })

      
      app.put('/orders/:id', async (req, res) => {
        const id = req.params.id;
        const payment = req.body;
        console.log(payment);
        const filter = { _id: ObjectId(id) };
        const updateDoc = {
            $set: {
                payment: payment
            }
        };
        const result = await ordersCollection.updateOne(filter, updateDoc);
        res.json(result);
      });

      app.get('/orders', async (req, res) => {
        let query = {}
        const email = req.query.email
        console.log(email);
        if (email) {
          query = {email : email}
        }
        const cursor = ordersCollection.find(query)
        const result = await cursor.toArray()
        res.send(result)
      })

      app.get('/orders/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await ordersCollection.findOne(query);
        res.json(result);
      })
      

      app.delete('/orders/:id', async (req, res) => {
        const id = req.params.id
        const query = {_id : ObjectId(id)}
        const result = await ordersCollection.deleteOne(query)
        res.json(result)
    })

    // app.put('/orders/:id', async (req, res) => {
    //   const id = req.params.id
    //   const updateItem= req.body
    //   const filter = {_id : ObjectId(id)}
    //   const option = {upsert : true}
    //   const updateStatus = {
    //       $set : {
    //         amount: data.amount,
    //         cart: data.cart,
    //         city: data.city,
    //         created: data.created,
    //         email: data.email,
    //         grandTotalAmount: data.grandTotalAmount,
    //         last4: data.last4,
    //         name: data.name,
    //         shippingCost: data.shippingCost,
    //         status: data.status,
    //         totalAmount: data.totalAmount,
    //         transaction: data.transaction
    //       }
    //   }
    //   const result = await ordersCollection.updateOne(filter, updateStatus,option)
    //   res.json(result)
    // })

     //making users admin 
     app.put('/users/admin', async (req, res) => {
      const data = req.body
      const filter = {email : data.email}
      const updateDoc = {
          $set: {
              role : 'admin'
          },
      }
      const user = await usersCollection.updateOne(filter, updateDoc);
      res.json(user)
    })

    // app.get('/users/:email', async (req, res) => {
    //   const email = req.params.email
    //   const query =  {email :  email}
    //   const user = await usersCollection.findOne(query)
    //   let isAdmin = false
    //   if (user?.role === 'admin') {
    //       isAdmin = true
    //   }
    //   else{
    //       isAdmin = false
    //   }
    //   res.send({admin : isAdmin})
    // })

    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray()
      res.send(result)
    })

    app.delete('/products/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id : ObjectId(id)}
      const result = await productsCollection.deleteOne(query)
      res.json(result)
    })

    } 
    
    finally {
    //   await client.close();
    }
  }
  run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Triangle Ecommerce Shop')
})

app.listen(port, () => {
    console.log('Running server on port', port);
})