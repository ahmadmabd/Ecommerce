const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const oracledb = require("oracledb");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Removed top-level await/global connection.
// Add helper to get a fresh DB connection per request.
async function getDbConnection() {
  // ...adjust connectString to include port...
  return await oracledb.getConnection({
    user: "friend_user",
    password: "friend_password",
    connectString: "10.184.164.201:1521/XE",
  });
}

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("Attempt login:", username);

  try {
    const connection2 = await oracledb.getConnection({
      user: username,
      password: password,
      connectString: "10.184.164.201:1521/XE",
    });

    await connection2.close();

    return res.json({
      success: true,
      message: "Login successful!",
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(401).json({
      success: false,
      message:
        "Login failed: " +
        err.message +
        " (Hint: listener shows service 'XE'. Run 'lsnrctl status' and use host:port/XE or adjust your DB/listener.)",
    });
  }
});

app.get("/products", async (req, res) => {
  let connection;
  try {
    connection = await getDbConnection();
    const result = await connection.execute(`SELECT * FROM Product`, [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    return res.json({
      success: true,
      products: result.rows || [],
    });
  } catch (err) {
    console.error("Fetch products error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products: " + err.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection:", e);
      }
    }
  }
});

app.get("/categories", async (req, res) => {
  let connection;
  try {
    connection = await getDbConnection();
    const result = await connection.execute(`SELECT * FROM CATEGORY`, [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    return res.json({
      success: true,
      categories: result.rows || [],
    });
  } catch (err) {
    console.error("Fetch categories error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories: " + err.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection:", e);
      }
    }
  }
});

app.get("/users", async (req, res) => {
  let connection;
  try {
    connection = await getDbConnection();
    const result = await connection.execute(
      `SELECT * FROM vw_user_profile`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({
      success: true,
      users: result.rows || [],
    });
  } catch (err) {
    console.error("Fetch users error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users: " + err.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection:", e);
      }
    }
  }
});
app.post("/addUser", async (req, res) => {
  const { USERID, FULLNAME, EMAIL, PASSWORD, ADDRESS } = req.body;
  let connection;
  try {
    connection = await getDbConnection();

    const insertSQL = `
      INSERT INTO USERS (USERID, FULLNAME, EMAIL, PASSWORD, ADDRESS)
      VALUES (:USERID, :FULLNAME, :EMAIL, :PASSWORD, :ADDRESS)
    `;

    await connection.execute(
      insertSQL,
      { USERID, FULLNAME, EMAIL, PASSWORD, ADDRESS },
      { autoCommit: true }
    );

    return res.json({
      success: true,
      message: "User added successfully",
    });
  } catch (err) {
    console.error("Add user error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to add user: " + err.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection:", e);
      }
    }
  }
});
app.post("/addProduct", async (req, res) => {
  const { PRODUCTID, NAME, PRICE, STOCK, DESCRIPTION, CATEGORYID } = req.body;

  // Basic validation
  if (!PRODUCTID || !NAME || PRICE === undefined || PRICE === null) {
    return res.status(400).json({
      success: false,
      message:
        "Missing required fields: PRODUCTID, NAME and PRICE are required.",
    });
  }

  let connection;
  try {
    connection = await getDbConnection();

    const insertSQL = `
      INSERT INTO PRODUCT (PRODUCTID, NAME, PRICE, STOCK, DESCRIPTION, CATEGORYID)
      VALUES (:PRODUCTID, :NAME,  :PRICE, :STOCK , :DESCRIPTION, :CATEGORYID)
    `;

    await connection.execute(
      insertSQL,
      { PRODUCTID, NAME, DESCRIPTION, PRICE, STOCK, CATEGORYID },
      { autoCommit: true }
    );

    return res.json({
      success: true,
      message: "Product added successfully",
    });
  } catch (err) {
    console.error("Add product error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to add product: " + err.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection:", e);
      }
    }
  }
});
app.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }

  let connection;
  try {
    connection = await oracledb.getConnection({
      user: "friend_user",
      password: "friend_password",
      connectString: "10.184.164.201/XE",
    });

    const result = await connection.execute(
      `SELECT USERID, FULLNAME, EMAIL, ADDRESS 
       FROM USERS 
       WHERE EMAIL = :email AND PASSWORD = :password`,
      { email, password },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows && result.rows.length > 0) {
      // Return user info (without password)
      return res.json({
        success: true,
        message: "Login successful",
        user: result.rows[0],
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
  } catch (err) {
    console.error("Sign-in error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to sign in: " + err.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error("Error closing connection:", closeErr);
      }
    }
  }
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
