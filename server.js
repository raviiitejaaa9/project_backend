const express = require("express");
const path = require("path");
const {open} = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");
const port = 4000;

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, "project.db");

let db = null;

const initializeDbAndServer = async() => {
    try{
        db = await open({
            filename : dbPath,
            driver : sqlite3.Database
        })

        app.listen(port, () => {
            console.log(`Server started at Port: ${port}`);
        });
        
    }
    catch(e){
        console.log(`Database Error : ${e.message}`)
        process.exit(1)
    }
}

initializeDbAndServer();

// 1. Api call for New User Registration
app.post("/api/auth/signup", async(request,response) => {

    const {firstName, lastName, mobileNumber, email, password} = request.body;
    // console.log(mobileNumber) 

    const userRegQuery = `
        INSERT INTO users(
            firstName, lastName, mobileNumber, email, password
        )
        VALUES(
            ?, ?, ?, ?, ?
        );
    `;

    const userCheckQuery = `
            SELECT * 
            FROM users
            WHERE email = ?;
    `;

    try{
        const isEmailRegistered = await db.get(userCheckQuery, [email])
        console.log(isEmailRegistered)
        if (isEmailRegistered !== undefined) {
            await response.status(400).json({
                status : 400,
                message : "Email already Registered"
            })
        }
        else{
            await db.run(userRegQuery, [firstName, lastName, mobileNumber, email, password]);
            const userData = await db.get(userCheckQuery, [email]);
            const { userId } = userData;
            await response.status(200).json({
                status : 200,
                message : "User Registration Successful",
                userId,
                userData,
            })
        }
    }
    catch(e){
        await response.status(505).json({
            status : 505,
            message : "Server Error"
        })
    }
})


// 2. Api call for user Authentication 
app.post("/api/auth/login", async(request,response) => {

    const {userEmail, userPassword} = request.body;
    // console.log(userEmail , userPassword);

    const getUserDetailQuery = `
        SELECT *
        FROM users 
        WHERE email = ?;
    `;

    
    try{
        const userData = await db.get(getUserDetailQuery, [userEmail])
        // console.log(userData)

        if(userData === undefined){
            await response.status(400).json({
                status : 400,
                message : "Email is not Registered. Please Register First"
            })
        }
        else {
            const {userId, email, password} = userData;
            if (password !== userPassword){
                await response.status(402).json({
                    status : 402,
                    message : "Password Incorrect"
                })
            }
            else{
                await response.status(202).json({
                    status : 202,
                    userId,
                    userData,
                })
            }
        }

    }
    catch(e){
        await response.status(500).json({
            status : 500,
            message : "Server Error"
        })
    }

})

// 3. Api Call for getting user profile details 
app.get("/profile/:id", async(request,response) => {

    const {id} = request.params 

    const getUserDetails = `
        SELECT * 
        FROM users 
        WHERE userId = ?;
    `;

    try {
        const userDetails = await db.get(getUserDetails, [id]);

        if (userDetails === undefined){
            await response.status(400).json({
                status : 400,
                message : "userId not Present"
            })
        }
        else{
            await response.status(200).json({
                status :200,
                userDetails
            })
        }
    }
    catch(e){
        await response.status(500).json({
            status : 500,
            message : "Server Error"
        })
    }
})
