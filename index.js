require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

// const { ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yizt2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();

    const tasksCollection = client.db("task-pilot-db").collection("tasks");
    const userCollection = client.db("task-pilot-db").collection("users");

    app.post("/users", async (req, res) => {
      const user = req.body;
      const isExist = await userCollection.findOne({ email: user?.email });
      if (isExist) {
        return res.status(409).send({ message: "User already exists." });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // CARD
    app.get("/tasks/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await tasksCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/task/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tasksCollection.findOne(query);
      res.send(result);
    });

    // Add a task
    app.post("/tasks", async (req, res) => {
      const { title, description, dueDate, category, email } = req.body;
      const newTask = {
        title,
        description,
        category,
        email,
        dueDate: dueDate ? new Date(dueDate) : null,
        timestamp: new Date(),
      };

      const result = await tasksCollection.insertOne(newTask);
      res.status(201).json(result);
    });

    // Update a task
    app.put("/tasks/:id", async (req, res) => {
      const { id } = req.params;
      const updateData = req.body;

      const result = await tasksCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json({ message: "Task updated successfully" });
    });

    // Delete a task
    app.delete("/tasks/:id", async (req, res) => {
      const { id } = req.params;

      // const result = await tasksCollection.deleteOne({
      //   _id: new MongoClient.ObjectId(id),
      // });
      const result = await tasksCollection.deleteOne({
        _id: new ObjectId(id), // Use ObjectId directly
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json({ message: "Task deleted" });
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Run the database connection setup
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server Is Running on Port: ${port}`);
});
