const express = require("express");
const dotenv = require("dotenv").config();
const app = express();
const cors = require("cors");
const port = process.env.PORT;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
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
const JWKS =  createRemoteJWKSet(
  new URL((`${process.env.CLIENT_URI}/api/auth/jwks`))
)

const verifyToken = async (req, res, next) => {
  const header = req?.headers.authorization;
  if (!header) {
    return res.status(401).json({message:"Unathorized"})
  }

  const token = header.split(" ")[1]
  if (!token) {
    return res.status(401).json({message:"Unathorized"})
  }
  console.log(header);
try {
  
  const {payload} = await jwtVerify(token,JWKS)
  console.log(payload);
  next();
} catch (error) {
  return res.status(403).json({message:"forbidden"})
}



};

async function run() {
  try {
    await client.connect();

    const db = client.db("furhome");
    const petsCollection = db.collection("pets");
    const pestAdaptioncCollection = db.collection("adaptions");

    app.post("/list-pets", verifyToken, async (req, res) => {
      const petData = req.body;
      const allPetData = await petsCollection.insertOne(petData);

      res.send(allPetData);
    });
    app.get("/listing/:userId", async (req, res) => {
      const { userId } = req.params;
      const result = await petsCollection.find({ userId: userId }).toArray();
      res.send(result);
    });
    app.get("/all-pets" , async (req, res) => {
      const search = req.query.search || "";
      let query = {};
      if (search) {
        query.name = {
          $regex: search,
          $options: "i",
        };
      }
      console.log(search);

      const result = await petsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/all-pet", async(req,res)=>{
      const result =await petsCollection.find().limit(6).toArray()
      res.send(result)
    })

    app.get("/list-pets/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const result = await petsCollection.findOne({ _id: new ObjectId(id) });
      res.json(result);
    });
    app.patch("/list-pets/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      const result = await petsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: data },
      );
      res.send(result);
    });
    app.delete("/request/:petid", verifyToken, async (req, res) => {
      const { petid } = req.params;

      const result = await pestAdaptioncCollection.deleteOne({ petId: petid });
      console.log(result);

      res.send(result);
    });
    app.delete("/list-pets/:id", verifyToken, async (req, res) => {
      const { id } = req.params;

      const result = await petsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.post("/list-pet", verifyToken, async (req, res) => {
      const petAdapt = req.body;
      const alredyexist = await pestAdaptioncCollection.findOne({
        petId: petAdapt.petId,
        email: petAdapt.email,
      });
      if (alredyexist) {
        return res.send({
          message: "You already requsted this pet",
        });
      }
      const result = await pestAdaptioncCollection.insertOne(petAdapt);
      res.json(result);
      console.log(result);
    });
    app.get("/requsts", async (req, res) => {
      const email = req.query.email;

      const result = await pestAdaptioncCollection
        .find({ email: email })
        .toArray();
      res.json(result);
      console.log(result);
    });
    app.get("/my-pet-requests/:OwnerEmail", async (req, res) => {
      const { OwnerEmail } = req.params;
      const result = await pestAdaptioncCollection
        .find({ OwnerEmail: OwnerEmail })
        .toArray();

      res.json(result);
      console.log(result);
    });
    app.patch("/my-pet-requests/:petId", async (req, res) => {
      const { petId } = req.params;
      const data = req.body;
      console.log(data);

      const result = await pestAdaptioncCollection.updateOne(
        { petId: petId },
        { $set: { status: data.status } },
      );
      const results = await petsCollection.updateOne(
        { _id: new ObjectId(petId) },
        { $set: { status: data.status } },
      );

      res.json({ result, results });
      console.log(result);
    });

    // app.patch("/my-pet-requests/:Id",async(req,res)=>{
    //   const {petId} = req.params
    //   const data = req.body
    //   const result = await petsCollection.updateOne({petId:petId},{$set:data})
    //   res.send(result)
    // })

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
