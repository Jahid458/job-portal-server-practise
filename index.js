const express = require('express')
const cors  = require('cors'); 
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000 ; 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors())
app.use(express.json()); 

// DB_USER = job_hunting
//DB_PASS =  dZTYxYMPjXhkYsI8



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.7i4ix.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");


    //jobs related api 
    //get one data. get all data , get some data [0, 1 , many]
    const jobscollection = client.db('jobportal').collection('jobs');
    const jobApplicationCollection = client.db('jobportal').collection('job_applications');

    app.get('/jobs',async(req,res)=>{
        const cursor = jobscollection.find();
        const result = await cursor.toArray();
        res.send(result)

    })

    app.get('/jobs/:id', async(req,res)=> {
        const id = req.params.id; 
        const query = {_id: new ObjectId(id)}
        const result = await jobscollection.findOne(query);
        res.send(result)

    })

    //job-application APIS

    app.get('/job-application', async (req, res) => {
        const email = req.query.email;
        const query = { applicant_email: email }
        const result = await jobApplicationCollection.find(query).toArray();

        // fokira way to aggregate data
        for (const application of result) {
            // console.log(application.job_id)
            const query1 = { _id: new ObjectId(application.job_id) }
            const job = await jobscollection.findOne(query1);
            if(job){
                application.title = job.title;
                application.location = job.location;
                application.company = job.company;
                application.company_logo = job.company_logo;
            }
        }

        res.send(result);
    })


    app.post('/job-applications', async (req, res) => {
        const application = req.body;
        const result = await jobApplicationCollection.insertOne(application);
        res.send(result);
    })



  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  } 
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('Job Is Falling in the sky')
})

app.listen(port, ()=>{
    console.log(`Job is Listening : ${port}`);
})