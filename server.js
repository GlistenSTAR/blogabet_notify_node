const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

const blogabet = require('./apis/blogabet')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: "10mb" }));

app.use(
	cors({
		origin: "*",
		methods: ["*"],
	})
);

// app.use("/api/test", console.log("test"));

app.use("/api/blogabet", blogabet);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
