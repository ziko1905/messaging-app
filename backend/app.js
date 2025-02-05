const express = require("express");
const errorMiddleware = require("./middleware/errorMiddleware");
const authRouter = require("./routes/authRouter");
const app = express();
const cors = require("cors");
const { corsConfig } = require("./config/cors");

app.use(cors(...corsConfig));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));

require("./config/passport").config();

app.use("/", authRouter);

app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Express app listening on port ${PORT}`));
