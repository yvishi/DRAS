-- Phase 7: Validation & Test Protocol
-- Run these scripts to verify system integrity for the professor demo.

USE DRAS;

-- Test 1: Constraint Violation (Negative Inventory)
-- Expected: Error 1644 (SIGNAL from trigger or CHECK constraint)
-- UPDATE Warehouse_Inventory SET Quantity = -50 WHERE Inv_ID = 1;

-- Test 2: Trigger Verification (Stock Alert)
-- Lowering stock below threshold to see if an alert is generated.
SELECT 'Testing Trigger: trg_after_inventory_update' AS Test_Log;
UPDATE Warehouse_Inventory SET Quantity = 5 WHERE Res_ID = 2 AND W_ID = 1;
SELECT * FROM Stock_Alert WHERE Resolved = FALSE;

-- Test 3: Procedure Verification (Insufficient Stock)
-- Expected: SIGNAL 'Insufficient total stock'
SELECT 'Testing Procedure: sp_Approve_Request (Failure Case)' AS Test_Log;
-- INSERT INTO Request (CC_ID, Camp_ID, Status) VALUES (1, 1, 'Pending');
-- INSERT INTO Request_Details (Req_ID, Res_ID, Requested_Qty) VALUES (LAST_INSERT_ID(), 1, 100000);
-- CALL sp_Approve_Request(LAST_INSERT_ID());

-- Test 4: View Verification (Analytics)
SELECT 'Testing View: vw_Current_Inventory' AS Test_Log;
SELECT * FROM vw_Current_Inventory WHERE Stock_Status != 'OK';

-- Test 5: Audit Log Verification
SELECT 'Testing Audit Log: trg_after_request_status_update' AS Test_Log;
SELECT * FROM Audit_Log ORDER BY Changed_At DESC LIMIT 5;

-- Test 6: Join Query (Manual Reporting for Professor)
-- Query: "Show me all resources currently in transit for Cyclone Amphan"
SELECT 
    e.Name AS Event,
    c.Name AS Destination_Camp,
    r.Name AS Resource,
    rd.Approved_Qty,
    d.Dispatch_Time,
    d.Status AS Dispatch_Status
FROM Disaster_Event e
JOIN Relief_Camp c ON e.Event_ID = c.Event_ID
JOIN Request req ON c.Camp_ID = req.Camp_ID
JOIN Request_Details rd ON req.Req_ID = rd.Req_ID
JOIN Resource r ON rd.Res_ID = r.Res_ID
JOIN Dispatch_Log d ON req.Req_ID = d.Req_ID
WHERE e.Name = 'Cyclone Amphan' AND d.Status = 'Packed';
