-- View 1
CREATE OR REPLACE VIEW vw_Public_Products AS
SELECT
   p.ProductID,
   p.Name          AS ProductName,
   p.Price,
   p.Stock,
   p.Description,
   c.Name          AS CategoryName,
   p.CategoryID
FROM Product p
LEFT JOIN Category c
 ON p.CategoryID = c.CategoryID;
 
-- View 2
CREATE OR REPLACE VIEW vw_Order_Summary AS

SELECT

    o.OrderID,

    o.DateOrdered,

    o.Status,

    o.Total,

    u.FullName AS CustomerName

FROM Orders o

JOIN Users u ON o.UserID = u.UserID;

 
-- View 3
CREATE OR REPLACE VIEW vw_User_Profile AS

SELECT

    UserID,

    FullName,

    Email

FROM Users

WITH READ ONLY;

 
CREATE OR REPLACE VIEW vw_Category_Stats AS

SELECT 

    c.CategoryID,

    c.Name AS CategoryName,

    COUNT(p.ProductID) AS TotalProducts

FROM Category c

LEFT JOIN Product p ON c.CategoryID = p.CategoryID

GROUP BY c.CategoryID, c.Name;
 
 ---------------------------------------------------------------------------------------------------------
-- ChazaTasks.sql

--task 1: View: Return Each Category With Its Products

CREATE OR REPLACE VIEW vw_Category_List AS

SELECT  

    c.Name AS CategoryName,

    p.Name AS ProductName,

    p.Price

FROM Category c

LEFT JOIN Product p ON c.CategoryID = p.CategoryID

ORDER BY CategoryName,ProductName;




 --task 2: Create a Stored Procedure to Add a New User

 CREATE OR REPLACE FUNCTION fn_email_exists (
    p_email IN VARCHAR2
) RETURN BOOLEAN
IS
    v_count NUMBER;
BEGIN
    IF p_email IS NULL THEN -- Check for NULL input
        RETURN FALSE; 
    END IF;

    SELECT COUNT(*)
    INTO   v_count
    FROM   users
    WHERE  LOWER(email) = LOWER(TRIM(p_email)); 
    RETURN (v_count > 0);
EXCEPTION
    WHEN NO_DATA_FOUND THEN -- If no data is found, email does not exist(lselect ma raj3t natije)
        RETURN FALSE;
END fn_email_exists;
/




CREATE OR REPLACE PROCEDURE pr_create_user (
    p_fullname IN VARCHAR2,
    p_email    IN VARCHAR2,
    p_password IN VARCHAR2,
    p_address  IN VARCHAR2 DEFAULT NULL
)
IS
BEGIN

    IF TRIM(p_fullname) IS NULL THEN
        RAISE_APPLICATION_ERROR(
            -20010,
            'Full name is required.'
        );
    END IF;

    IF TRIM(p_email) IS NULL THEN
        RAISE_APPLICATION_ERROR(
            -20011,
            'Email is required.'
        );
    END IF;

    IF TRIM(p_password) IS NULL THEN
        RAISE_APPLICATION_ERROR(
            -20012,
            'Password is required.'
        );
    END IF;

    IF fn_email_exists(p_email) THEN
        RAISE_APPLICATION_ERROR(
            -20013,
            'Email already exists. Please use another email.'
        );
    END IF;


    INSERT INTO users (
        fullname,
        email,
        password,
        address
    ) VALUES (       
        TRIM(p_fullname),
        LOWER(TRIM(p_email)),        
        p_password,
        p_address
    );
END pr_create_user;
/


--task 3: Create a Function to Check User Sign-In Credentials

CREATE OR REPLACE FUNCTION fn_check_sign_in (
    p_email    IN VARCHAR2,
    p_password IN VARCHAR2       
) RETURN BOOLEAN
IS
    v_count NUMBER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM users
    WHERE LOWER(email) = LOWER(TRIM(p_email))
      AND password = p_password;   

    RETURN v_count = 1;
END fn_check_sign_in;
/

----------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fc_get_pass(
    p_email IN VARCHAR2      
) RETURN VARCHAR2
IS
    v_pass VARCHAR2(200);
BEGIN
    -- Check if email exist
    IF NOT fn_email_exists(p_email) THEN
        RAISE_APPLICATION_ERROR(
            -20013,
            'Email does NOT exist.'
        );
    END IF;

    -- Retrieve password
    SELECT password
    INTO v_pass
    FROM users
    WHERE LOWER(email) = LOWER(TRIM(p_email));

    RETURN v_pass;
END fc_get_pass;
/


SELECT fc_get_pass('admin@gmail.com') FROM dual;
SELECT fc_get_pass('yara@gmail.com') FROM dual;

--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_get_categories
RETURN SYS_REFCURSOR
IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR
        SELECT 
            categoryID,
            name AS categoryName
        FROM Category
        ORDER BY name;

    RETURN v_cursor;
END fn_get_categories;
/


VAR rc REFCURSOR;

EXEC :rc := fn_get_categories;

PRINT rc;


--task 4:

CREATE OR REPLACE FUNCTION fn_get_all_orders_total
RETURN NUMBER
IS
    v_total NUMBER;
BEGIN
    SELECT SUM(TOTAL)
    INTO v_total
    FROM ORDERS;

    IF v_total IS NULL THEN
        RETURN 0;
    END IF;

    RETURN v_total;
END;
/







------------------------------------------------------------------------------------------------
--  AhmadTasks.sql

/*First task.
It's about creating a view ,
that return from table of product each product has the stock>0,
And showing the categorie name instead of the id,
"By joining the table of category with table of product(by categoryid)"*/
CREATE OR REPLACE VIEW vw_active_products AS
SELECT
    p.name AS productName,
    p.price,
    p.description,
    c.Name
FROM product p
JOIN category c
    ON p.categoryId = c.categoryId
WHERE p.stock > 0;

/*Second task.
The first part is to,
Create a function tests in the category's table if the category(given as parameter) is found:
If yes it returns 1,else 0; */

CREATE OR REPLACE FUNCTION fn_category_exists (
  p_category_id IN NUMBER
) RETURN NUMBER
IS
  v_count NUMBER := 0;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM Category
  WHERE categoryid = p_category_id;
  IF v_count > 0 THEN
    RETURN 1;
  ELSE
    RETURN 0;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END fn_category_exists;
/

/*The second part is,
Create a procedure that adds a new product(given as parameter) to the product's table,
after testing if the category of it exists by calling the previous function(fn_category_exists).
**if the category exists the product is added,
else an error message is shown to the user that the category is not found.
**when succeded so return an Optional success message***/  

CREATE OR REPLACE PROCEDURE pr_add_product (
    p_name        IN VARCHAR2,
    p_price       IN NUMBER,
    p_stock       IN NUMBER,
    p_description IN VARCHAR2,
    p_category_id IN NUMBER
)
IS
BEGIN
    IF fn_category_exists(p_category_id) = 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Category ID ' || p_category_id || ' does not exist.');
    ELSE
        INSERT INTO Product (name, price, stock, description, categoryid)
        VALUES (p_name, p_price, p_stock, p_description, p_category_id);
        DBMS_OUTPUT.PUT_LINE('Product "' || p_name || '" added successfully.');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error adding product: ' || SQLERRM);
        RAISE;
END pr_add_product;
/

/* Note:*in the 2 parts the EXCEPTION that is in the end is to 
handle any unexpected errors that may occur during the execution of the function or procedure.
(EX:table not found ,connection issues...etc) */

/*this function checks if a user email exists in the USERS table.
If it exists, it returns TRUE; otherwise, it returns FALSE.*/
create or replace function check_user_email (user_email IN VARCHAR2)
return BOOLEAN
is
v_count number;
begin
select count(*) into v_count
from USERS
where email = user_email;
if v_count>0 then return true;
else return false;
end if;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
end check_user_email;
/


/*This procedure removes all user's orders from the orders table based on the userid*/
CREATE OR REPLACE PROCEDURE remove_user_orders (
    p_user_id IN NUMBER
)
IS
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM orders
    WHERE userid = p_user_id;
 
    IF v_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'No orders found for this user_id.');
    END IF;
 
    DELETE FROM orders
    WHERE userid = p_user_id;
 
    COMMIT;
END remove_user_orders;
/
 

/*This procedure removes a user from the USERS table based on the provided email.
Before removing the user, it checks if the email exists using the check_user_email function.
if yes it removes all the orders of this user by calling remove_user_orders procedure,
then deletes the user from the USERS table and commits the changes.*/
CREATE OR REPLACE PROCEDURE remove_user_byemail (
    user_email IN VARCHAR2
)
IS
    v_userid users.userid%TYPE;
BEGIN
    IF check_user_email(user_email) = FALSE THEN
        RAISE_APPLICATION_ERROR(
            -20001,
            'Email ' || user_email || ' does not exist'
        );
    END IF;
    SELECT userid
    INTO v_userid
    FROM users
    WHERE email = user_email;
    remove_user_orders(v_userid);
    DELETE FROM users
    WHERE email = user_email;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('User removed successfully.');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error removing user: ' || SQLERRM);
        RAISE;
END remove_user_byemail;
/

/*function to count all products in the product table.
It returns the total number of products as a NUMBER.*/
CREATE OR REPLACE function 
count_products 
returns number
IS
    v_count number;
SELECT
    count(*)
INTO v_count 
FROM product ;
RETURN v_count;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error counting products: ' || SQLERRM);
        RETURN 0;
END count_products;
/

------------------------------------------------------------------------------------------------

-- LamitaTasks.sql

-- ============================================================
-- TASK 1: Create a View for the Product with Maximum Price
-- This view shows the product(s) with the highest price,
-- along with its category name.
-- ============================================================
CREATE OR REPLACE VIEW vw_Max_Price_Product AS
SELECT
    p.ProductID,
    p.Name AS ProductName,
    p.Price,
    p.Description,
    c.Name AS CategoryName
FROM Product p
JOIN Category c
    ON p.CategoryID = c.CategoryID
WHERE p.Price = (SELECT MAX(Price) FROM Product);


-- ============================================================
-- TASK 2 : Create a Function to Calculate Total Order Amount
-- This function calculates the total amount for a given order.
-- Returns:
--   - total amount if items exist
--   - 0 if no items exist in the order
-- ============================================================
CREATE OR REPLACE FUNCTION fn_calculate_order_total (
    p_order_id IN NUMBER   
) RETURN NUMBER
IS
    v_total NUMBER;        
BEGIN
    SELECT SUM(Quantity * UnitPrice)
    INTO v_total
    FROM Order_Item
    WHERE OrderID = p_order_id;

    IF v_total IS NULL THEN
        RETURN 0;
    END IF;

    RETURN v_total;
END;
/
======================================
-- TASK 3 : Create a Function to Count User Orders
-- This function calculates the total number of orders for a given user.
-- Returns:
--   - number of orders if the user exists
--   - 0 if the user exists but has no orders
--   - -1 if the user does not exist
-- ============================================================
CREATE OR REPLACE FUNCTION fn_count_user_orders (
    p_user_id IN NUMBER
) RETURN NUMBER
IS
    v_count NUMBER;
    v_user_exists NUMBER;
BEGIN

    SELECT COUNT(*)
    INTO v_user_exists
    FROM Users
    WHERE UserID = p_user_id;

    IF v_user_exists = 0 THEN
        
        RETURN -1;
    END IF;
    
    SELECT COUNT(*)
    INTO v_count
    FROM Orders
    WHERE UserID = p_user_id;

    RETURN v_count;

END;
/


------------------------------------------------------------------------------------------------

-- DeemaTasks.sql
-- ============================================================
-- TASK 1: Create a View to Display Out-of-Stock Products
-- This view returns all products that are currently out of stock (Stock = 0).
-- It joins the Product and Category tables in order to display the category name
-- instead of the category ID, making the output more user-friendly.
-- ============================================================

CREATE OR REPLACE VIEW vw_OutOfStock_Products AS
SELECT
    p.ProductID,              
    p.Name AS ProductName,    
    p.Price,                  
    p.Description,           
    c.Name AS CategoryName    
FROM Product p
JOIN Category c
    ON p.CategoryID = c.CategoryID
WHERE p.Stock = 0;             



-- ============================================================
-- TASK 2: Create a Function to Check Product Availability
-- This function checks whether a product is available based on its stock.
-- It returns:
--   - 'Available' if the stock is greater than zero
--   - 'Out of Stock' if the stock is zero
--   - 'Product Not Found' if the product ID does not exist
-- ============================================================

CREATE OR REPLACE FUNCTION fn_product_availability (
    p_product_id IN NUMBER    
) RETURN VARCHAR2
IS
    v_stock NUMBER;          
BEGIN   
    
    SELECT stock INTO v_stock
    FROM Product
    WHERE ProductID = p_product_id;

    IF v_stock > 0 THEN
        RETURN 'Available';
    ELSE
        RETURN 'Out of Stock';
    END IF;

EXCEPTION
   
    WHEN NO_DATA_FOUND THEN
        RETURN 'Product Not Found';
END;


------------------------------------------------------------
-- TASK 3:Function: fn_count_products_by_category
-- Description:
-- This function returns the number of products that belong
-- to a specific category.
--
-- It takes a category ID as input and counts how many
-- products are associated with that category in the Product table.
------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_count_products_by_category (
    p_category_id IN Category.CategoryID%TYPE
) RETURN NUMBER
IS
    v_count NUMBER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM Product
    WHERE CategoryID = p_category_id;

    RETURN v_count;
END;
/

------------------------------------------------------------
-- TASK 4 : Function fn_top_user
-- Description:
-- This function returns the full name of the user
-- who has placed the order with the highest total amount
-- in the system.
--
-- It works by:
-- 1. Finding the maximum order total from the Orders table.
-- 2. Selecting the UserID associated with that maximum total.
-- 3. Retrieving the corresponding FullName from the Users table.
--
-- If no orders exist, the function returns 'NO USER'.
------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_top_user
RETURN VARCHAR2
IS
   
    v_name VARCHAR2(200);

BEGIN
    -- Select the full name of the user
    -- who has the order with the highest total
    SELECT FullName
    INTO v_name
    FROM Users
    WHERE UserID = (
        SELECT UserID
        FROM Orders
        WHERE Total = (SELECT MAX(Total) FROM Orders)
        AND ROWNUM = 1
    );

    -- Return the user's name
    RETURN v_name;

EXCEPTION
    -- If no user or no orders are found
    WHEN NO_DATA_FOUND THEN
        RETURN 'NO USER';
END;
/

