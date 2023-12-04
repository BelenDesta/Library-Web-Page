require("express");

const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') }) 

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

 /* Our database and collection */
 let databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};

 const { MongoClient, ServerApiVersion } = require('mongodb');

 const uri = `mongodb+srv://${userName}:${password}@cluster0.uxf4sau.mongodb.net/?retryWrites=true&w=majority`;
 const client = new MongoClient(uri, {serverApi: ServerApiVersion.v1 });


/* Important */
process.stdin.setEncoding("utf8");

// console.log(`Argv[1] is: ${process.argv[1]}`);

let portEntered = process.argv[2]; 

const http = require("http");
const path2 = require("path");
const express = require("express"); /* Accessing express module */
const app = express(); /* app is a request handler function */
const bodyParser = require("body-parser"); /* To handle post parameters */

const portNumber = portEntered;


/* Initializes request.body with post information */ 
app.use(bodyParser.urlencoded({extended:false}));

/* directory where templates will reside */
app.set("views", path2.resolve(__dirname, "templates"));

/* view/templating engine */
app.set("view engine", "ejs");

app.listen(portNumber);
console.log(`Web server started and running at http://localhost:${portNumber}`);

let catalogTableString =  "<table border='1'>";
catalogTableString += "<tr><th>Book Title</th><th>Book Author</th><th>Quantity</th></tr>";


app.get("/", (request, response) =>{ 
    response.render("index", {portNumber: portNumber});
  
  });

  app.post("/", (request, response) => {
    
  let {userSelection} = request.body;

  console.log(userSelection);

  if(userSelection == "librarian"){
    console.log("Librarian functionality");

    console.log(`Port number is: ${portNumber}`);

    response.render("librarianActions", {portNumber: portNumber});
     
  }else if(userSelection == "user"){
    console.log("User functionality");

    response.render("userActions");
  }
  });

  app.post("/librarianActions", (request, response) => {
    let {userSelection} = request.body;

    console.log(userSelection);

    if(userSelection == "addBookToCatalog"){
      console.log("PPP Librarian functionality");
  
      response.render("addBook", {portNumber: portNumber});
       
    }else if(userSelection == "removeFromCatalog"){
      console.log("REMOVING BOOKS FROM CATALOG");

      response.render("removeBook", {status: "", portNumber: portNumber});
    }
    else if(userSelection == "viewCatalog"){
      console.log(" PPP User functionality");
  
      

     let currCatalog = viewCatalog(); 
     
     console.log("Catalog string is: " + currCatalog);

     console.log(currCatalog);
     response.render("viewCatalog" , {catalogTable: catalogTableString, portNumber: portNumber});

    }else if(userSelection == "searchBook"){

      response.render("searchBook", {result: "", portNumber: portNumber});
    }
    });

app.post("/userActions", (request, response) => {
      let {userSelection} = request.body;
  
      console.log(userSelection);
  
      if(userSelection == "viewCatalog"){
        console.log(" Regular User functionality");
    
        let currCatalog = viewCatalog();  

        console.log("Catalog string is: " + currCatalog);

        response.render("viewCatalog" , {catalogTable: catalogTableString, portNumber: portNumber});
  }else if(userSelection == "editReadingList"){

   
    findAllAvailable();

async function findAllAvailable(){
  try {

    await client.connect();
    let filter = {quantity: {$gte:0}};
    const cursor = client.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find(filter);
    
    const result = await cursor.toArray();
    console.log(`Found: ${result.length} movies`);
    console.log(result);

    let resultString = "<table border='1'><tr><th>Title</th><th>Author</th><th>Quantity</th></tr>";

    result.forEach(item => resultString += `<tr><td>${item.bookTitle}</td><td>${item.bookAuthor}</td><td>${item.quantity}</td></tr>`);

    resultString += "</table>";

    console.log(`Result strig is: ${resultString}`);

    response.render("checkOut", {booksAvailable: resultString, portNumber: portNumber});

} catch (e) {
    console.error(e);
} finally {
    await client.close();
}
}

  }else if(userSelection == "searchBook"){

    response.render("searchBook", {result: "", portNumber: portNumber});
  }
      });

app.get("/removeBook", (request, response) => {
response.render("removeBook", {status: "", portNumber: portNumber});
});

app.post("/removeBook", (request, response) => {
    let {bookTitle, bookAuthor} = request.body; 

    const variables = {
      bookTitle: bookTitle,
      bookAuthor: bookAuthor,
    }

    deleteBook(variables);

    async function deleteBook(filters){

      let result; 
    
      try {
        await client.connect();
        console.log("***** Deleting one movie *****");
       
        result = await deleteOne(client, databaseAndCollection, filters);
    
        return result; 
    
    
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    
        return result;
    }
    }
    
    async function deleteOne(client, databaseAndCollection, filters) {
     
      const result = await client.db(databaseAndCollection.db)
                     .collection(databaseAndCollection.collection)
                     .deleteOne(filters);
      
       console.log(`Documents deleted ${result.deletedCount}`);
    
       if(result.deletedCount > 0){
        response.render("removeBook", {status: "Deleted", portNumber: portNumber});

       }else{
        response.render("removeBook", {status: "Unsucessful Deletion", portNumber: portNumber});

       }
    }
    



});


app.get("/addBook", (request, response) => {
  response.render("addBook",  {portNumber: portNumber});
});

app.post("/addBook", (request, response) => {
  let {bookTitle, bookAuthor, quantity} = request.body; 

  console.log(`Book title is: ${bookTitle}`);
  console.log(`Book author is: ${bookAuthor}`);
  console.log(`Book quantity is: ${quantity}`);



  const variables = {
    bookTitle: bookTitle,
    bookAuthor: bookAuthor,
    quantity: Number(quantity),
  }

  insertNewBook(variables);

  catalogTableString += `<tr><td>${bookTitle}</td><td>${bookAuthor}</td><td>${quantity}</td></tr>`;

  response.render("bookAdded", {title: bookTitle, author: bookAuthor, quantity: quantity, portNumber: portNumber});

});

async function insertNewBook(variables){
  //  console.log(`Inserting new person`);
    try {
        await client.connect();
       
        /* Inserting one movie */
      //  console.log("***** Inserting person *****");
       //  let movie1 = {name: "Notebook", year: 2000};

      
        await insertBook(client, databaseAndCollection, variables);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}


async function insertBook(client, databaseAndCollection, newBook) {
  const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newBook);

 // console.log(`Movie entry created with id ${result.insertedId}`);
}




async function viewCatalog(){
  try {
    await client.connect();
    let filter = {};
    const cursor = client.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find(filter);
    
    const result = await cursor.toArray();
    console.log(`Found: ${result.length} movies`);
    console.log(result);
    let catalogString = "<table border ='1'><tr><th>Title</th><th>Author</th><th>Quantity</th></tr>";
    result.forEach(item => catalogString += `<tr><td>${item.bookTitle}</td><td>${item.bookAuthor}</td><td>${item.quantity}</td></tr>`);

    console.log("Catalog string is: " + catalogString);

    catalogTableString = catalogString;
    // printCatalog(catalogString);
    


   
} catch (e) {
    console.error(e);
} finally {
    await client.close();

  
}

}





app.post("/searchBook", (request, response) => {
    let {bookTitle, bookAuthor} = request.body;

    const variables = {
      bookTitle: bookTitle,
      bookAuthor: bookAuthor,
    };

  find(variables);


  async function find(filters){
    try {
      await client.connect();
              console.log("***** Looking up one movie *****");
             // let movieName = "Batman";
              await lookUpOneEntry(client, databaseAndCollection, filters);
  
    
  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
  }

  async function lookUpOneEntry(client, databaseAndCollection, filters) {
   
    const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .findOne(filters);

   if (result) {
       console.log(result);

       let resultString = "";

       resultString += `Found book: ${result.bookTitle} with author ${result.bookAuthor}`;

       response.render("searchBook", {result: resultString, portNumber: portNumber});

      
   } else {
    response.render("searchBook", {result: "Book does not exist.", portNumber: portNumber});

   }
}

}); 





