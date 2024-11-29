const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

console.log(process.env.DATABASE_URL);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Express app listening on port ${PORT}`));
