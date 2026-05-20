const express = require("express");
const dotenv = require("dotenv").config();
const app = express();
const cors = require("cors");
const port = process.env.PORT;
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.DB_URI;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db= client.db('furhome')
    const petsCollection = db.collection('pets')
 

    app.post("/list-pets",async(req,res)=>{
      const petData= req.body;
      const allPetData = await petsCollection.insertOne(petData)
res.send(allPetData)      
    })

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
