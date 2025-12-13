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

