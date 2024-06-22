# Backend Project


```
//Connection of MongoDB using iife

(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("ERROR:",error)
            throw error
        })

        app.listen(`${process.env.PORT}` ,()=>{
            console.log(`Server is running on port no : ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("ERROR:",error)
        throw error
    }
})()

```
