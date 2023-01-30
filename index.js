const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qytn8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try{
     await client.connect();
     const database = client.db("PowerHack");
     const newsCollection = database.collection("bullingInfo");
     const usersCollection = database.collection("users");

        //get billing info added pagination
        app.get("/api/billing-list", async(req,res)=>{
            const loadBill = newsCollection.find({});
            const page = req.query.page;
            const size = parseInt(req.query.size);
            const count = await loadBill.count();
            let bill;
            if(page){
                bill = await loadBill.skip(page*size).limit(size).toArray();
            }
            else{
                bill = await loadBill.toArray();
            }
            
            res.send({bill,count})
        })

        //billing information added
        app.post("/api/add-billing",async(req,res)=>{
          const bill = req.body;
          const result = await newsCollection.insertOne(bill);
          res.json(result)
        })

        //searched value filtration based on name or phone number or email
        app.get("/api/billing-list/:searched",async(req,res)=>{
            const search = req.params.searched;
            const loadBilling = newsCollection.find({});
            const allBilling = await loadBilling.toArray();
            let filteredData = allBilling.filter(billing => {
                return billing.name.includes(search) || billing.email.includes(search) || billing.phone.includes(search);
              });
            res.send(filteredData) 
        })

        //total paid amound calculation
        app.get("/api/billing",async(req,res)=>{
          const loadBill = newsCollection.find({});
          let total = 0;
          const sum = await loadBill.toArray();
          await sum.forEach(item =>{
                total = total + parseInt(item.paidAmount) 
          })
          res.send({total}) 
        })

        //delete bill info from database
        app.delete("/api/delete-billing/:id", async(req,res)=>{
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result =  await newsCollection.deleteOne(query)
            res.json(result)
        })

        
        //jwt token base authentication 
          app.get("/jwt",async(req,res)=>{
            const email = req.query.email;
            const query= {email:email};
            const user = await usersCollection.findOne(query);
            if(user){
              const token = jwt.sign({email},process.env.ACCESS_TOKEN,{expiresIn:"1hr"})
              return res.send({accessToken : token})
            }
            res.status(403).send({accessToken: ''})
          })
          
          //user added on database
          app.post("/api/registration",async(req,res)=>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result)
          })

        //update billing information
        app.put("/api/update-billing/:id",async(req,res)=>{
            const id = req.params.id;
            const bill = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                  name: bill.name,
                  email: bill.email,
                  phone: bill.phone,
                  paidAmount: bill.paidAmount
                },
              };
            const result = await newsCollection.updateOne(filter,updateDoc,options)
            res.json(result)
        })
    
        }
    finally{
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Power Hack Server!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
