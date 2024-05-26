const express = require("express");
const router = express.Router();
const model = require("../modules/model.js");


router.get("/ai", async (req, res) => {
  try {
    const prompt = "Write a story about a magic backpack."

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(text);
    res.send(text);

  } catch (err) {
    res.sendStatus(500);
  }
});

router.get("/chat", async (req, res) => {
  try {
    const prompt = "Write a story about a magic backpack."

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(text);
    res.send(text);

  } catch (err) {
    res.sendStatus(500);
  }
});


// async function run() {
//     const prompt = "Write a story about a magic backpack."

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();
//     return text;
//   }


module.exports = router;
