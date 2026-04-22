//-- URL TO DEPLOYED SERVER --
//https://assignment4-41x2.onrender.com

const http = require('http');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const { randomUUID } = require("crypto");
const {mongoClient, MongoClient} = require("mongodb");

const Note = require('./model/noteModel');

//getting the mongodb uri from the .env file
require("dotenv").config();
const uri = process.env.MONGO_URI;

//Getting mongodb client
const client = new MongoClient(uri);

//creating and then connecting the database to the code
let codehuntingCollection ;
let users ;
async function connectDB(){
    try{
        await client.connect();
        codehuntingCollection = client.db("codehunting_db").collection("codehunting_collection");
        users = client.db("codehunting_db").collection("users");
        console.log("Connectd to MongoDB");
    }
    catch(error){
        console.error(
            "MongoDB connection failed ? : ", error
        );
        //exit from the entire program
        process.exit(1);
    }
}

function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json"
    });
    res.end(JSON.stringify(data));
}

const server = http.createServer( async(req, res) => {
    if(req.url === '/'){
        // res.end("<h1> Home Page</h1>");
        fs.readFile( path.join(__dirname, '../public', 'login.html'),
        (err,content)=>{
            if(err) throw err;
            
            res.writeHead(200, {'content-Type': 'text/html'});
            res.end(content);
        });
    }

    else if(req.url === '/panel'){
        fs.readFile( path.join(__dirname, '../public', 'index.html'),
        (err,content) =>{
            if(err) throw err;

            res.writeHead(200, {'content-Type': 'text/html'});
            res.end(content);
        });
    }
    
    else if(req.url === "/api"){
        codehuntingCollection.find({}).toArray().then(
            results => {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(results));
            }
        ).catch(err => {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error : "Failed to fetch the books"}));
        })
    }
    
    //post method to create a user
    else if (req.method === 'POST' && req.url === '/api/users') {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", async () => {
            try {
                const data = JSON.parse(body);

                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(data.password, salt);

                const result = await users.insertOne({
                    name: data.name,
                    email: data.email,
                    password: hashedPassword
                });

                sendJSON(res, 201, {
                    message: "User created",
                    result
                });
            } 
            catch (err) {
                console.error("CREATE ERROR:", err);
                sendJSON(res, 500, { message: err.message });
            }
            });
        req.on("error", (err) => {
            console.error("REQUEST ERROR:", err);
            sendJSON(res, 500, { message: "Request failed" });
        });
    }

    //post method to input the username/pass and log in
    else if (req.method === 'POST' && req.url === '/api/users/login') {
    let body = "";

    req.on("data", chunk => {
        body += chunk.toString();
    });

    req.on("end", async () => {
        try {
            const data = JSON.parse(body);

            const user = await users.findOne({ email: data.email });

            if (!user) {
                return sendJSON(res, 401, { error: "User not found" });
            }

            const isMatch = await bcrypt.compare(data.password, user.password);

            if (!isMatch) {
                return sendJSON(res, 401, { error: "Invalid password" });
            }

            sendJSON(res, 200, { message: "Login successful" });

        } catch (err) {
            console.error(err);
            sendJSON(res, 500, { error: "Server error" });
        }
    });
}

else if (req.method === 'POST' && req.url.startsWith('/api/data')) {
    let body = "";

    req.on("data", chunk => {
        body += chunk.toString();
    });

    req.on("end", async () => {
        try {
            const data = JSON.parse(body);
            const result = await codehuntingCollection.insertOne({
                id: Number(data.id) || randomUUID(),
                tier_name: data.tier_name,
                debug: Number(data.debug),
                price: Number(data.price),
                oneonone: Boolean(data.oneonone)
            });
            return sendJSON(res, 201, result);

        } catch (err) {
            console.error("CREATE ERROR:", err);
            return sendJSON(res, 500, { message: err.message });
        }
    });

    req.on("error", (err) => {
        console.error("REQUEST ERROR:", err);
        return sendJSON(res, 500, { message: "Request failed" });
    });
}
else if (req.method === 'DELETE' && req.url.startsWith('/api/data')) {

    try {
        const { pathname } = new URL(req.url, `http://${req.headers.host}`);
        const id = pathname.split('/')[3];

        if (!id) {
            return sendJSON(res, 400, { message: "Missing ID" });
        }

        const result = await codehuntingCollection.deleteOne({
            id: id
        });

        return sendJSON(res, 200, {
            message: "Deleted",
            deletedCount: result.deletedCount
        });

    } catch (err) {
        return sendJSON(res, 500, { message: err.message });
    }
}


  // UPDATE game
else if (req.method === 'PUT' && req.url.startsWith('/api/data')) {
    let body = "";
    req.on("data", chunk => {
        body += chunk.toString();
    });

    req.on("end", async () => {
        try {
            const { pathname } = new URL(req.url, `http://${req.headers.host}`);
            const id = pathname.split('/')[3];
            const data = JSON.parse(body);
            const { id: _, ...updateData } = data;
            const result = await codehuntingCollection.updateOne(
                { id: Number(id) },
                { $set: updateData }
            );
            return sendJSON(res, 200, result);

        } catch (err) {
            return sendJSON(res, 500, { message: err.message });
        }
    });
}

//get all data
else if (req.method === 'GET' && req.url === '/api/data') {
    try {
        const data = await codehuntingCollection.find({}).toArray();
        return sendJSON(res, 200, data);
    } catch (err) {
        return sendJSON(res, 500, { message: err.message });
    }
}
  
  //method for the register.html file
    else if(req.url === '/register'){
        fs.readFile( path.join(__dirname, '../public', 'register.html'),
        (err,content) =>{
            if(err) throw err;

            res.writeHead(200, {'content-Type': 'text/html'});
            res.end(content);
        });
    }

    //Else to cover any issues left over
    else {
    const filePath = path.join(__dirname, '../public', req.url);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }

        // Set content type based on file extension
        const ext = path.extname(filePath);

        let contentType = 'text/plain';
        if (ext === '.js') contentType = 'application/javascript';
        else if (ext === '.css') contentType = 'text/css';
        else if (ext === '.html') contentType = 'text/html';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
}
});

const PORT = 5555;
connectDB().then(
    () =>{
        server.listen(PORT, () => console.log("Server running on port: " + PORT));
    }
)
