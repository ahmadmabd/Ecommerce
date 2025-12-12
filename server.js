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
    password: "chazasql",
    connectString: "localhost:1521/xe",
  });
}
app.post("/sign-up", async (req, res) => {
  const { fullName, email, password, address } = req.body;

  // Basic validation (optional, can rely on DB procedure)
  if (!fullName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "fullName, email and password are required.",
    });
  }

  let connection;
  try {
    connection = await getDbConnection();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Call stored procedure pr_create_user
    await connection.execute(
      `BEGIN pr_create_user(:p_fullname, :p_email, :p_password, :p_address); END;`,
      {
        p_fullname: fullName,
        p_email: email,
        p_password: hashedPassword,
        p_address: address || null,
      },
      { autoCommit: true }
    );

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
    });
  } catch (err) {
    console.error("Signup error:", err);

    // Handle Oracle application errors from the procedure
    if (err.message && err.message.includes("ORA-20013")) {
      return res.status(409).json({
        success: false,
        message: "Email already exists. Please use another email.",
      });
    }
    if (err.message && err.message.includes("ORA-20010")) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }
    if (err.message && err.message.includes("ORA-20011")) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }
    if (err.message && err.message.includes("ORA-20012")) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create user: " + err.message,
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
    connection = await getDbConnection();

    // fetch user by email including stored (hashed) password
    const result = await connection.execute(
      `SELECT USERID, FULLNAME, EMAIL, ADDRESS, PASSWORD
       FROM USERS
       WHERE EMAIL = :email`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const userRow = result.rows[0];
    //const hashedPassword = userRow.PASSWORD;

    const passResult = await connection.execute(
      `SELECT fc_get_pass(:email) AS PASSWORD FROM dual`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const hashedPassword = passResult.rows[0]?.PASSWORD;

    // if no stored password, reject
    if (!hashedPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // compare provided password with hashed password using bcrypt
    const passwordMatches = await bcrypt.compare(password, hashedPassword);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // remove password before returning user info
    delete userRow.PASSWORD;

    return res.json({
      success: true,
      message: "Login successful",
      user: userRow,
    });
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
  const { NAME, PRICE, STOCK, DESCRIPTION, CATEGORYNAME } = req.body;

  if (!NAME || PRICE === undefined || PRICE === null || !CATEGORYNAME) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  let connection;
  try {
    connection = await getDbConnection();

    // 1. Get CategoryID
    const catResult = await connection.execute(
      `SELECT CategoryID FROM Category WHERE Name = :name`,
      { name: CATEGORYNAME },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (catResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Category not found",
      });
    }

    const CATEGORYID = catResult.rows[0].CATEGORYID;

    // 2. Call procedure
    await connection.execute(
      `
      BEGIN
        pr_add_product(
          :p_name,
          :p_price,
          :p_stock,
          :p_description,
          :p_category_id
        );
      END;
      `,
      {
        p_name: NAME,
        p_price: PRICE,
        p_stock: STOCK,
        p_description: DESCRIPTION,
        p_category_id: CATEGORYID,
      },
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
      message: err.message,
    });
  } finally {
    if (connection) await connection.close();
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

app.get("/api/orders/top-user", async (req, res) => {
  let connection;

  try {
    connection = await getDbConnection();

    const result = await connection.execute(
      `BEGIN
         :result := fn_top_user();
       END;`,
      {
        result: {
          dir: oracledb.BIND_OUT,
          type: oracledb.STRING,
        },
      }
    );

    return res.json({
      success: true,
      topUser: result.outBinds.result,
    });
  } catch (err) {
    console.error("Fetch top user error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to get top user: " + err.message,
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

// New route: GET /num_product - returns total number of products using DB function count_products()
app.get("/num_product", async (req, res) => {
  let connection;
  try {
    connection = await getDbConnection();

    const result = await connection.execute(
      `SELECT count_products() AS CNT FROM DUAL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const count = (result.rows && result.rows[0] && result.rows[0].CNT) || 0;

    return res.json({ success: true, count });
  } catch (err) {
    console.error("Count products error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to get product count: " + err.message,
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

app.get("/orders", async (req, res) => {
  let connection;
  try {
    connection = await getDbConnection();

    const sql = `
      SELECT o.ORDERID,
             o.TOTAL,
             o.DATEORDERED,
             o.STATUS,
             u.FULLNAME
      FROM ORDERS o
      JOIN USERS u ON u.USERID = o.USERID
      ORDER BY o.DATEORDERED DESC
    `;

    const result = await connection.execute(sql, [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    return res.json({
      success: true,
      orders: result.rows || [],
    });
  } catch (err) {
    console.error("Fetch orders error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders: " + err.message,
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

app.get("/ordertotal", async (req, res) => {
  let connection;
  try {
    connection = await getDbConnection();

    const result = await connection.execute(
      `SELECT fn_get_all_orders_total AS total FROM dual`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve order total",
      });
    }

    const total = result.rows[0].TOTAL || 0;

    return res.json({
      success: true,
      total: total,
    });
  } catch (err) {
    console.error("Order total error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
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
