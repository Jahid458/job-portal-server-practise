const express = require('express')
const cors  = require('cors'); 
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000 ; 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}))
app.use(express.json()); 
app.use(cookieParser());



const logger = (req,res,next) => {
  console.log('Inside The logger');
  next();
}

const verifyToken = (req, res, next) => {
  // console.log('Inside verify token Middleware', req.cookies);
  const token = req?.cookies?.token;

  if(!token){
    return res.status(401).send({message: 'Unauthorized Access!'})
  }

  jwt.verify(token,process.env.JWT_SECRET, (err,decoded)=>{
        if(err){
          return res.status(401).send({message: 'Unauthorise Access'})
        }
        
        req.user = decoded;
        next();
  })

}





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






    //auth -related Apis 
    app.post('/jwt',async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.JWT_SECRET,{expiresIn:'48h'})
      res.cookie('token',token,{
        httpOnly: true,
        secure:false
        // http://localhost:5173/signin

      }).send({success: true})
    })

    
    //jobs related apis
    app.get('/jobs',logger,verifyToken, async(req,res)=>{
      console.log('Now inside the api callback');
      const email = req.query.email;
      let query ={}
      if(email){
        query = {hr_email: email}
      }
        const cursor = jobscollection.find(query);
        const result = await cursor.toArray();
        res.send(result)
    })

    app.post('/jobs', async(req,res)=> {
      const newjob = req.body;
      const result = await jobscollection.insertOne(newjob); 
      res.send(result);
    })

    app.get('/jobs/:id', async(req,res)=> {
        const id = req.params.id; 
        const query = {_id: new ObjectId(id)}
        const result = await jobscollection.findOne(query);
        res.send(result)

    })

    //job-application APIS

    app.get('/job-application',verifyToken, async (req, res) => {
        const email = req.query.email;
        const query = { applicant_email: email }

        if(req.user.email !== req.query.email){
          return res.status(403).send({message: 'Forbidden access'})
        }

        console.log('Cookies Call', req.cookies);
 
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


    //sign in --> jahir@email.com 112233


    // app.get('/job-applications/:id') ==> get a specific job Applications by Id
    app.get('/job-applications/jobs/:job_id', async(req,res)=>{
      const jobId = req.params.job_id;
      const query = {job_id: jobId};
      const result = await jobApplicationCollection.find(query).toArray();
      res.send(result);

    }) 

    app.post('/job-applications', async (req, res) => {
        const application = req.body;
        const result = await jobApplicationCollection.insertOne(application);
      // not the best way (use aggerate)
      const id = application.job_id;
      const query = {_id: new ObjectId(id)}
      const job = await jobscollection.findOne(query);
      console.log(job);
      let newCount = 0 ; 
      if(job.applicationCount){
          newCount = job.applicationCount + 1 ;
      }
      else{
        newCount = 1
      }
      // now updated the job Info 
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
        $set:{
          applicationCount: newCount
        }
      }

      const updatedResult = await jobscollection.updateOne(filter,updatedDoc);


        res.send(result);
    })

    app.patch('/job-applications/:id', async(req,res)=> {
      const id = req.params.id;
      const data = req.body;
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
        $set:{
          status: data.status
        }
      }

      const result = await jobApplicationCollection.updateOne(filter,updatedDoc);
      res.send(result)

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