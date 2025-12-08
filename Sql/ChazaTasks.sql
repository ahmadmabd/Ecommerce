--task 1: View: Return Each Category With Its Products

-- CREATE OR REPLACE VIEW vw_Category_List AS

-- SELECT  

--     c.Name AS CategoryName,

--     p.Name AS ProductName,

--     p.Price

-- FROM Category c

-- LEFT JOIN Product p ON c.CategoryID = p.CategoryID

-- ORDER BY CategoryName,ProductName;




 --task 2: Create a Stored Procedure to Add a New User

--  CREATE OR REPLACE FUNCTION fn_email_exists (
--     p_email IN VARCHAR2
-- ) RETURN BOOLEAN
-- IS
--     v_count NUMBER;
-- BEGIN
--     IF p_email IS NULL THEN
--         RETURN FALSE; 
--     END IF;

--     SELECT COUNT(*)
--     INTO   v_count
--     FROM   users
--     WHERE  LOWER(email) = LOWER(TRIM(p_email)); 
--     RETURN (v_count > 0);
-- EXCEPTION
--     WHEN NO_DATA_FOUND THEN
--         RETURN FALSE;
-- END fn_email_exists;
-- /




-- CREATE OR REPLACE PROCEDURE pr_create_user (
--     p_fullname IN VARCHAR2,
--     p_email    IN VARCHAR2,
--     p_password IN VARCHAR2,
--     p_address  IN VARCHAR2 DEFAULT NULL
-- )
-- IS
-- BEGIN

--     IF TRIM(p_fullname) IS NULL THEN
--         RAISE_APPLICATION_ERROR(
--             -20010,
--             'Full name is required.'
--         );
--     END IF;

--     IF TRIM(p_email) IS NULL THEN
--         RAISE_APPLICATION_ERROR(
--             -20011,
--             'Email is required.'
--         );
--     END IF;

--     IF TRIM(p_password) IS NULL THEN
--         RAISE_APPLICATION_ERROR(
--             -20012,
--             'Password is required.'
--         );
--     END IF;

--     IF fn_email_exists(p_email) THEN
--         RAISE_APPLICATION_ERROR(
--             -20013,
--             'Email already exists. Please use another email.'
--         );
--     END IF;


--     INSERT INTO users (
--         fullname,
--         email,
--         password,
--         address
--     ) VALUES (       
--         TRIM(p_fullname),
--         LOWER(TRIM(p_email)),        
--         p_password,
--         p_address
--     );
-- END pr_create_user;
-- /
