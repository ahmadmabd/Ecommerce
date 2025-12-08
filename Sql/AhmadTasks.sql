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
    c.categoryName
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