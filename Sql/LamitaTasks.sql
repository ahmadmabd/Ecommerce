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
/

-- ============================================================
-- TASK 2: Create a Function to Calculate Total Order Amount
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