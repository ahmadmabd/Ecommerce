const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const oracledb = require("oracledb");
const bcrypt = require("bcrypt"); // added bcrypt

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

async function getDbConnection() {
  // ...adjust connectString to include port...
  return await oracledb.getConnection({
    user: "system",
    password: "oracle",
    connectString: "localhost:1521/XE",
  });
}

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
app.post("/updateProduct/:id", async (req, res) => {
  const { id } = req.params;
  const { NAME, PRICE, STOCK, DESCRIPTION, CATEGORYID } = req.body;

  // Basic validation
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
    });
  }

  if (!NAME || PRICE === undefined || PRICE === null) {
    return res.status(400).json({
      success: false,
      message: "Name and Price are required.",
    });
  }

  let connection;
  try {
    connection = await getDbConnection();

    const updateSQL = `
      UPDATE PRODUCT 
      SET NAME = :NAME, PRICE = :PRICE, STOCK = :STOCK, DESCRIPTION = :DESCRIPTION, CATEGORYID = :CATEGORYID
      WHERE PRODUCTID = :id
    `;

    const result = await connection.execute(
      updateSQL,
      { NAME, PRICE, STOCK, DESCRIPTION, CATEGORYID, id },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (err) {
    console.error("Update product error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update product: " + err.message,
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
  const { NAME, PRICE, STOCK, DESCRIPTION, CATEGORYID } = req.body;

  // Basic validation
  if (!NAME || PRICE === undefined || PRICE === null) {
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
      INSERT INTO PRODUCT (NAME, PRICE, STOCK, DESCRIPTION, CATEGORYID)
      VALUES (:NAME,  :PRICE, :STOCK , :DESCRIPTION, :CATEGORYID)
    `;

    await connection.execute(
      insertSQL,
      { NAME, DESCRIPTION, PRICE, STOCK, CATEGORYID },
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

// Get single product by id with category name (joined)
app.get("/product/:id", async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await getDbConnection();
    const sql = `
      SELECT *
FROM vw_Public_Products
WHERE ProductID = :id

    `;

    const result = await connection.execute(
      sql,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    await connection.close();

    const row = (result.rows && result.rows[0]) || null;
    if (!row) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.json({ success: true, product: row });
  } catch (err) {
    console.error("Fetch product error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product: " + err.message,
    });
  }
});

app.delete("/delete-product/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
    });
  }
  let connection;
  try {
    connection = await getDbConnection();
    const result = await connection.execute(
      `DELETE FROM PRODUCT WHERE PRODUCTID = :id`,
      { id },
      { autoCommit: true }
    );

    await connection.close();

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      message: "Product deleted",
    });
  } catch (err) {
    console.error("Delete product error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product: " + err.message,
    });
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
  const { FULLNAME, EMAIL, PASSWORD, ADDRESS } = req.body;
  let connection;
  try {
    connection = await getDbConnection();

    const insertSQL = `
      INSERT INTO USERS (FULLNAME, EMAIL, PASSWORD, ADDRESS)
      VALUES (:FULLNAME, :EMAIL, :PASSWORD, :ADDRESS)
    `;

    await connection.execute(
      insertSQL,
      { FULLNAME, EMAIL, PASSWORD, ADDRESS },
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

app.get("/user-profile/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "User id is required." });
  }

  let connection;
  try {
    connection = await getDbConnection();

    // Query USERS table (not the view) to return all user columns
    const result = await connection.execute(
      `SELECT * FROM USERS WHERE USERID = :id`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows && result.rows.length > 0) {
      return res.json({ success: true, user: result.rows[0] });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
  } catch (err) {
    console.error("Fetch user profile error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile: " + err.message,
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
