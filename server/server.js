require("dotenv").config();
const express = require("express");
const { Server } = require('socket.io');

const app = express();

// const passwordsRouter = require("./routes/passwords.router");
const modelRouter = require("./routes/model.router");
// const passkeysRouter = require("./routes/passkeys.router");

const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all('*', (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://localhost:5173");
  next() // pass control to the next handler
})

// app.use(express.static("./server/public"));

// app.use("/robots.txt", express.static("./robots.txt"));

// app.use("/.well-known/security.txt", express.static("./security.txt"));
// app.use(
//   "/security/disclosure-policy.html",
//   express.static("./disclosure-policy.html"),
// );
// app.use(
//   "/security/security-contact.html",
//   express.static("./security-contact.html"),
// );

// app.use("/api/v1/passwords", passwordsRouter);
// app.use("/api/v1/passkeys", passkeysRouter);
app.use("/api/v1/chat", modelRouter);

let server;

if (process.env.SERVER_BASE_URL !== 'localhost:5001') {
  // const { createServer } = require('node:http');
  // server = createServer(app);;
  server = app;
} else {
  const fs = require('fs');
  const https = require('https');

  const key = fs.readFileSync('../../../localhost_key_exp_4_19_25.pem');
  const cert = fs.readFileSync('../../../localhost_cert_exp_4_19_25.pem');

  server = https.createServer({ key: key, cert: cert }, app);
}

const io = new Server(server, {
  cors: { origin: 'https://localhost:5173' }
});

// listen for websocket connections
io.on('connection', (socket) => {

  console.log('Socket connected:', socket.id);

  // listen for messages on the socket connection
  socket.on('message', (message) => {
    console.log(message);

    io.emit('message', `${socket.id.substr(0,2)} said ${message}`)
  });
});

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
