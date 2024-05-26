const { scrypt, randomBytes, timingSafeEqual } = require("node:crypto");
const express = require("express");
const router = express.Router();
const pool = require("../modules/pool.js");

const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 5;

router.post("/register", (req, res) => {

  const { firstName, lastName, displayName, email, password } = req.body;

  const salt = randomBytes(128);

  const normalizedPassword = password.normalize('NFC');
  let password_buffer = Buffer.from(normalizedPassword, 'utf8');

  scrypt(password_buffer, salt, 128, { N: COST, r: BLOCK_SIZE, p: PARALLELIZATION }, (err, hashed_salted_password) => {
    if (err) throw err;

    const query = `
      INSERT INTO users
        (first_name, last_name, display_name, email, hashed_salted_password, salt)
      VALUES
        ($1, $2, $3, $4, $5, $6)
      RETURNING
        id;
    `;

    const queryValues = [
      firstName,
      lastName,
      displayName,
      email,
      hashed_salted_password,
      salt
    ];

    pool
      .query(query, queryValues)
      .then((dbRes) => {
        res.cookie("cookie_name", "cookie_value", { domain: 'localhost', expires: 0, httpOnly: true, path: '/' })
        res.status(201).json({ message: `Registration Successful!`, id: dbRes.rows[0].id });
      })
      .catch((dbErr) => {
        console.error(`Error registering new user`, dbErr);
        if (dbErr.code === "23505" && dbErr.constraint === "users_email_key") {
          res
            .status(400)
            .json({ message: `Invalid signup info, please try again.` });
        } else {
          res.status(500).json({ message: "Registration Error" });
        }
      });
  });
});

router.post("/login", (req, res) => {

  const { email, password } = req.body;

  const query = `
        SELECT * FROM
            users
        WHERE
            email = $1;
    `;

  const queryValues = [email];

  pool
    .query(query, queryValues)
    .then((dbRes) => {
      let user = dbRes.rows[0];

      if (user) {
        const stored_hashed_salted_password = user.hashed_salted_password;
        const salt = user.salt;

        const normalizedPassword = password.normalize('NFC');
        let password_buffer = Buffer.from(normalizedPassword, 'utf8')

        scrypt(password_buffer, salt, 128, { N: COST, r: BLOCK_SIZE, p: PARALLELIZATION }, (err, attempted_hashed_salted_password) => {
          if (err) throw err;

          if (timingSafeEqual(stored_hashed_salted_password, attempted_hashed_salted_password)) {
            console.log("passwords match");
            let body = {
              id: user.id,
              firstName: user.first_name,
              lastName: user.last_name,
              displayName: user.display_name,
              email: user.email,
              phone: user.phone,
              message: "Success!",
            };

            res.cookie("cookie_name", "cookie_value", { domain: 'localhost', expires: 0, httpOnly: true, path: '/' })

            res.status(200).json(body);
          } else {
            console.log("passwords dont match");
            let body = {
              message: "That combination of email and password does not exist",
            };
            res.status(403).json(body);
          }
        });
      } else {
        console.log("user not found");
        let body = {
          message: "That combination of email and password does not exist",
        };
        res.status(403).json(body);
      }
    })
    .catch((dbErr) => {
      console.error(`Error logging user in`, dbErr);
      res.status(500).json({ message: `Error logging you in.` });
    });
});

router.put("/reset/:id", (req, res) => {

  const id = req.params.id;

  console.log('id', id);

  const { email, currentPassword, newPassword } = req.body;

  const query = `
        SELECT * FROM
          users
        WHERE
          id = $1
        AND
          email = $2;
    `;

  const queryValues = [id, email];

  pool
    .query(query, queryValues)
    .then((dbRes) => {
      let user = dbRes.rows[0];

      if (user) {


        const stored_hashed_salted_password = user.hashed_salted_password;
        const salt = user.salt;

        const normalizedCurrentPassword = currentPassword.normalize('NFC');
        let current_password_buffer = Buffer.from(normalizedCurrentPassword, 'utf8')

        scrypt(current_password_buffer, salt, { N: COST, r: BLOCK_SIZE, p: PARALLELIZATION }, 128, (err, current_hashed_salted_password) => {
          if (err) throw err;

          if (timingSafeEqual(stored_hashed_salted_password, current_hashed_salted_password)) {
            console.log("passwords match");

            const newSalt = randomBytes(128);

            const normalizedNewPassword = newPassword.normalize('NFC');
            let new_password_buffer = Buffer.from(normalizedNewPassword, 'utf8')

            scrypt(new_password_buffer, newSalt, 128, (err, new_hashed_salted_password) => {
              if (err) throw err;

              const query = `
                UPDATE
                  users
                SET
                  hashed_salted_password = $1,
                  salt = $2
                WHERE
                  id = $3
                AND
                  email = $4
                RETURNING
                  id;
              `;

              const queryValues = [
                new_hashed_salted_password,
                newSalt,
                id,
                email
              ];

              pool
                .query(query, queryValues)
                .then((dbRes) => {
                  res.status(201).json({ message: `Password Update Successful!`, id: dbRes.rows[0].id });
                })
                .catch((dbErr) => {
                  console.error(`Error updating password:`, dbErr);
                  if (dbErr.code === "23505" && dbErr.constraint === "users_email_key") {
                    res
                      .status(400)
                      .json({ message: `Error updating password, please try again.` });
                  } else {
                    res.status(500).json({ message: "Password Update Error" });
                  }
                });
            });
          } else {
            console.log("passwords dont match");
            let body = {
              message: "That combination of email and password does not exist",
            };
            res.status(403).json(body);
          }
        });
      } else {
        console.log("user not found");
        let body = {
          message: "That combination of email and password does not exist",
        };
        res.status(403).json(body);
      }
    })
    .catch((dbErr) => {
      console.error(`Error updating password`, dbErr);
      res.status(500).json({ message: `Error updating your password.` });
    });
});

router.delete("/:id", (req, res) => {

  const id = req.params.id;

});

module.exports = router;
