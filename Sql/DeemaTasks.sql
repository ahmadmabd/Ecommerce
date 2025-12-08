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