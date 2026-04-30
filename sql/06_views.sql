-- Phase 5: Reporting Views
-- High-level analytics for the professor demo dashboard.

USE DRAS;

-- View 1: Current Inventory Overview
-- Joins warehouse and resource details for a readable stock list.
CREATE OR REPLACE VIEW vw_Current_Inventory AS
SELECT 
    w.Name AS Warehouse_Name,
    r.Name AS Resource_Name,
    r.Type AS Resource_Type,
    wi.Quantity,
    wi.Min_Threshold,
    CASE 
        WHEN wi.Quantity <= 0 THEN 'OUT OF STOCK'
        WHEN wi.Quantity < wi.Min_Threshold THEN 'LOW STOCK'
        ELSE 'OK'
    END AS Stock_Status
FROM Warehouse_Inventory wi
JOIN Warehouse w ON wi.W_ID = w.W_ID
JOIN Resource r ON wi.Res_ID = r.Res_ID;

-- View 2: Active Requests Tracker
-- Shows pending and approved requests with camp names.
CREATE OR REPLACE VIEW vw_Active_Requests AS
SELECT 
    r.Req_ID,
    c.Name AS Camp_Name,
    e.Name AS Event_Name,
    r.Priority,
    r.Status,
    r.Request_Time,
    (SELECT COUNT(*) FROM Request_Details rd WHERE rd.Req_ID = r.Req_ID) AS Total_Items
FROM Request r
JOIN Relief_Camp c ON r.Camp_ID = c.Camp_ID
JOIN Disaster_Event e ON c.Event_ID = e.Event_ID
WHERE r.Status IN ('Pending', 'Approved', 'Dispatched');

-- View 3: Warehouse Utilization
-- Shows how much capacity each warehouse is using.
-- (Simplified for demo as we don't have volume-per-resource data yet)
CREATE OR REPLACE VIEW vw_Warehouse_Utilization AS
SELECT 
    w.Name,
    w.Location,
    COUNT(wi.Inv_ID) AS Total_Unique_Resources,
    SUM(wi.Quantity) AS Total_Items_Stored
FROM Warehouse w
LEFT JOIN Warehouse_Inventory wi ON w.W_ID = wi.W_ID
GROUP BY w.W_ID;

-- View 4: Logistics Performance
-- Shows time taken for each delivery.
CREATE OR REPLACE VIEW vw_Delivery_Performance AS
SELECT 
    d.Dispatch_ID,
    r.Req_ID,
    w.Name AS From_Warehouse,
    c.Name AS To_Camp,
    d.Dispatch_Time,
    ds.Actual_Arrival,
    TIMESTAMPDIFF(HOUR, d.Dispatch_Time, ds.Actual_Arrival) AS Hours_In_Transit,
    ds.Confirmation
FROM Dispatch_Log d
JOIN Delivery_Status ds ON d.Dispatch_ID = ds.Dispatch_ID
JOIN Request r ON d.Req_ID = r.Req_ID
JOIN Relief_Camp c ON r.Camp_ID = c.Camp_ID
JOIN Warehouse w ON d.W_ID = w.W_ID;

-- View 5: Crisis Severity Map
-- Shows resource demand per Disaster Level.
CREATE OR REPLACE VIEW vw_Crisis_Demand AS
SELECT 
    e.Level AS Crisis_Level,
    r.Name AS Resource_Name,
    SUM(rd.Requested_Qty) AS Total_Requested,
    SUM(rd.Approved_Qty) AS Total_Fulfilled
FROM Disaster_Event e
JOIN Relief_Camp c ON e.Event_ID = c.Event_ID
JOIN Request req ON c.Camp_ID = req.Camp_ID
JOIN Request_Details rd ON req.Req_ID = rd.Req_ID
JOIN Resource r ON rd.Res_ID = r.Res_ID
GROUP BY e.Level, r.Res_ID;
