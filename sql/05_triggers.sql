-- Phase 4: Automation Triggers
-- Real-time stock alerts and audit logging.

USE DRAS;

DELIMITER //

-- Trigger 1: Automatic Stock Alerts
-- Fires when inventory drops below the minimum threshold.
CREATE TRIGGER trg_after_inventory_update
AFTER UPDATE ON Warehouse_Inventory
FOR EACH ROW
BEGIN
    IF NEW.Quantity < NEW.Min_Threshold AND OLD.Quantity >= OLD.Min_Threshold THEN
        INSERT INTO Stock_Alert (W_ID, Res_ID)
        VALUES (NEW.W_ID, NEW.Res_ID);
    END IF;
END //

-- Trigger 2: Resolved Alerts
-- Automatically marks alerts as resolved if stock is replenished.
CREATE TRIGGER trg_after_inventory_restock
AFTER UPDATE ON Warehouse_Inventory
FOR EACH ROW
BEGIN
    IF NEW.Quantity >= NEW.Min_Threshold AND OLD.Quantity < OLD.Min_Threshold THEN
        UPDATE Stock_Alert 
        SET Resolved = TRUE, Resolved_At = NOW()
        WHERE W_ID = NEW.W_ID AND Res_ID = NEW.Res_ID AND Resolved = FALSE;
    END IF;
END //

-- Trigger 3: Prevent adding items to non-pending requests
CREATE TRIGGER trg_before_request_details_insert
BEFORE INSERT ON Request_Details
FOR EACH ROW
BEGIN
    DECLARE v_status VARCHAR(20);
    SELECT Status INTO v_status FROM Request WHERE Req_ID = NEW.Req_ID;
    IF v_status != 'Pending' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot add items to a request that is not Pending.';
    END IF;
END //

-- Trigger 4: Basic Audit Logging for Request Status
CREATE TRIGGER trg_after_request_status_update
AFTER UPDATE ON Request
FOR EACH ROW
BEGIN
    IF OLD.Status != NEW.Status THEN
        INSERT INTO Audit_Log (Table_Name, Action, Old_Value, New_Value, Changed_By)
        VALUES (
            'Request', 
            'UPDATE', 
            JSON_OBJECT('Req_ID', OLD.Req_ID, 'Status', OLD.Status),
            JSON_OBJECT('Req_ID', NEW.Req_ID, 'Status', NEW.Status),
            USER()
        );
    END IF;
END //

DELIMITER ;
