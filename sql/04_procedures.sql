-- Phase 3.2: Stored Procedures (Business Logic Layer)
-- These procedures handle ACID-compliant transactions for core workflows.

USE DRAS;

DELIMITER //

-- Procedure: Approve a pending request
-- Validates if total global stock is sufficient before approving.
CREATE PROCEDURE sp_Approve_Request(IN p_Req_ID INT)
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    
    -- Check if request is still pending
    SELECT Status INTO v_status FROM Request WHERE Req_ID = p_Req_ID FOR UPDATE;
    
    IF v_status != 'Pending' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only Pending requests can be approved.';
    END IF;

    -- Check if any item in the request exceeds total global stock
    IF EXISTS (
        SELECT 1 FROM Request_Details rd
        WHERE rd.Req_ID = p_Req_ID AND rd.Requested_Qty > fn_Total_Stock(rd.Res_ID)
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient total stock to approve this request.';
    END IF;

    -- Update quantities and status
    UPDATE Request_Details SET Approved_Qty = Requested_Qty WHERE Req_ID = p_Req_ID;
    UPDATE Request SET Status = 'Approved' WHERE Req_ID = p_Req_ID;

    COMMIT;
END //

-- Procedure: Dispatch resources from a specific warehouse
-- Deducts inventory and logs the dispatch.
CREATE PROCEDURE sp_Dispatch_Request(IN p_Req_ID INT, IN p_W_ID INT)
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Verify request is approved
    SELECT Status INTO v_status FROM Request WHERE Req_ID = p_Req_ID FOR UPDATE;
    IF v_status != 'Approved' AND v_status != 'Partially_Dispatched' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Request must be Approved to dispatch.';
    END IF;

    -- Verify warehouse has the items (lock rows for consistency)
    -- This checks if the warehouse can fulfill ALL items in the request.
    IF EXISTS (
        SELECT 1 FROM Request_Details rd
        WHERE rd.Req_ID = p_Req_ID AND rd.Approved_Qty > fn_Check_Stock(rd.Res_ID, p_W_ID)
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Selected warehouse has insufficient stock for one or more items.';
    END IF;

    -- Deduct stock from Warehouse_Inventory
    UPDATE Warehouse_Inventory wi
    JOIN Request_Details rd ON wi.Res_ID = rd.Res_ID
    SET wi.Quantity = wi.Quantity - rd.Approved_Qty
    WHERE rd.Req_ID = p_Req_ID AND wi.W_ID = p_W_ID;

    -- Log the dispatch
    INSERT INTO Dispatch_Log (Req_ID, W_ID, Estimated_Arrival)
    VALUES (p_Req_ID, p_W_ID, fn_Calculate_ETA(150)); -- Static 150km for demo

    -- Update Request status
    UPDATE Request SET Status = 'Dispatched' WHERE Req_ID = p_Req_ID;

    COMMIT;
END //

-- Procedure: Confirm Delivery
-- Updates status and creates delivery confirmation.
CREATE PROCEDURE sp_Confirm_Delivery(IN p_Dispatch_ID INT, IN p_Received_By VARCHAR(100))
BEGIN
    DECLARE v_req_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT Req_ID INTO v_req_id FROM Dispatch_Log WHERE Dispatch_ID = p_Dispatch_ID FOR UPDATE;

    -- Update Logs
    UPDATE Dispatch_Log SET Status = 'Delivered' WHERE Dispatch_ID = p_Dispatch_ID;
    
    INSERT INTO Delivery_Status (Dispatch_ID, Actual_Arrival, Received_By, Confirmation)
    VALUES (p_Dispatch_ID, NOW(), p_Received_By, 'Received');

    -- Final update to Request
    UPDATE Request SET Status = 'Delivered' WHERE Req_ID = v_req_id;

    COMMIT;
END //

-- Procedure: Restock Inventory
CREATE PROCEDURE sp_Restock(IN p_W_ID INT, IN p_Res_ID INT, IN p_Qty INT, IN p_Supplier VARCHAR(100))
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO Restock_Log (W_ID, Res_ID, Quantity, Supplier)
    VALUES (p_W_ID, p_Res_ID, p_Qty, p_Supplier);

    -- Use UPSERT logic for inventory
    INSERT INTO Warehouse_Inventory (W_ID, Res_ID, Quantity)
    VALUES (p_W_ID, p_Res_ID, p_Qty)
    ON DUPLICATE KEY UPDATE Quantity = Quantity + p_Qty;

    COMMIT;
END //

DELIMITER ;
