const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const oracledb = require("oracledb");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("Attempt login:", username);

  try {
    const connection = await oracledb.getConnection({
      user: username,
      password: password,
      // Use the service name reported by your listener (lsnrctl status shows "XE")
      connectString: "10.184.164.201/XE",
    });

    await connection.close();

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
  try {
    const connection = await oracledb.getConnection({
      user: "system",
      password: "ahmad123",
      connectString: "localhost/XE",
    });

    const result = await connection.execute(`SELECT * FROM Product`, [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    await connection.close();

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
  }
});

app.get("/categories", async (req, res) => {
  try {
    const connection = await oracledb.getConnection({
      user: "system",
      password: "oracle",
      connectString: "localhost/XE",
    });

    const result = await connection.execute(`SELECT * FROM CATEGORY`, [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    await connection.close();

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
  }
});

app.get("/users", async (req, res) => {
  try {
    const connection = await oracledb.getConnection({
      user: "system",
      password: "ahmad123",
      connectString: "localhost/XE",
    });

    const result = await connection.execute(
      `SELECT * FROM vw_user_profile`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    await connection.close();

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
  }
});
app.post("/addUser", async (req, res) => {
  const { USERID, FULLNAME, EMAIL, PASSWORD, ADDRESS } = req.body;

  try {
    const connection = await oracledb.getConnection({
      user: "system",
      password: "ahmad123",
      connectString: "localhost/XE",
    });

    const insertSQL = `
      INSERT INTO USERS (USERID, FULLNAME, EMAIL, PASSWORD, ADDRESS)
      VALUES (:USERID, :FULLNAME, :EMAIL, :PASSWORD, :ADDRESS)
    `;

    await connection.execute(
      insertSQL,
      { USERID, FULLNAME, EMAIL, PASSWORD, ADDRESS },
      { autoCommit: true }
    );

    await connection.close();

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

  try {
    const connection = await oracledb.getConnection({
      user: "system",
      password: "oracle",
      connectString: "localhost/XE",
    });

    const insertSQL = `
      INSERT INTO PRODUCT (PRODUCTID, NAME, PRICE, STOCK, DESCRIPTION, CATEGORYID)
      VALUES (:PRODUCTID, :NAME,  :PRICE, :STOCK , :DESCRIPTION, :CATEGORYID)
    `;

    await connection.execute(
      insertSQL,
      { PRODUCTID, NAME, DESCRIPTION, PRICE, STOCK, CATEGORYID },
      { autoCommit: true }
    );

    await connection.close();

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
  }
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
