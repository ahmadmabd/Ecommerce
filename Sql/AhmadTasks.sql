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