
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