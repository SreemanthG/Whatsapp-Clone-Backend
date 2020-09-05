//importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js'
import Pusher from 'pusher'
import cors from 'cors';
//app config
const app = express();
const port = process.env.port||9000;

const pusher = new Pusher({
    appId: '1067564',
    key: '466cd20be118a3f986af',
    secret: '5b96de91f3c7459c1a2b',
    cluster: 'ap2',
    encrypted: true
  });

const db = mongoose.connection

db.once('open',()=>{
    console.log("DB is connected");

    const msgCollection = db.collection("messagecontents")
    const changeStream = msgCollection.watch();
    changeStream.on('change',(change)=>{
        console.log(change);
        if(change.operationType==='insert'){
            const messageDetails = change.fullDocument
            pusher.trigger('messages','inserted',
            {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp:messageDetails.timestamp,
                received: messageDetails.received
            })
        } else{
            console.log('Error triggering Pusher');
        }
        


    })
})
//middlewares
app.use(express.json())
app.use(cors())

// DB config
mongoose.connect("mongodb+srv://sreemanth:123@cluster0.o8n2j.mongodb.net/Whatsapp-Mern-Backend",{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology:true
})

//api routes
app.get("/",(req,res)=>res.status(200).send("hello world"))

app.get('/messages/sync',(req,res)=>{
    Messages.find((err,data)=>{
        if(err){
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    })
})

app.post('/messages/new',(req,res)=>{
    const dbMessage = req.body;

    Messages.create(dbMessage,(err,data)=>{
        if(err){
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    })
})
//app listen    
app.listen(port,function(){
    console.log("Server has started");
})