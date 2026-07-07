import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? true }));
app.use(express.json());


const port = 8080;
app.listen(port, () => {
  console.log(`Server started on ${port}`);
});
