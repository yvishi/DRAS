-- Phase 3.1: Utility Functions
-- Logic encapsulation for reused calculations.

USE DRAS;

DELIMITER //

-- Function to check available stock for a specific resource in a specific warehouse
CREATE FUNCTION fn_Check_Stock(p_Res_ID INT, p_W_ID INT) 
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_qty INT DEFAULT 0;
    SELECT Quantity INTO v_qty 
    FROM Warehouse_Inventory 
    WHERE Res_ID = p_Res_ID AND W_ID = p_W_ID;
    RETURN IFNULL(v_qty, 0);
END //

-- Function to calculate total stock across all warehouses for a resource
CREATE FUNCTION fn_Total_Stock(p_Res_ID INT) 
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total INT DEFAULT 0;
    SELECT SUM(Quantity) INTO v_total 
    FROM Warehouse_Inventory 
    WHERE Res_ID = p_Res_ID;
    RETURN IFNULL(v_total, 0);
END //

-- Function to estimate arrival time (placeholder for complex logistics logic)
CREATE FUNCTION fn_Calculate_ETA(p_Distance_Km INT) 
RETURNS DATETIME
DETERMINISTIC
NO SQL
BEGIN
    -- Assumes ~4 hours per 100km + 2 hours processing
    RETURN CURRENT_TIMESTAMP + INTERVAL (p_Distance_Km / 25 + 2) HOUR;
END //

DELIMITER ;
