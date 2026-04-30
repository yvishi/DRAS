-- Phase 6.1: Role-Based Access Control (RBAC)
-- Define least-privilege access for different system users.

USE DRAS;

-- 1. Control Center Admin (Full Access)
CREATE USER IF NOT EXISTS 'cc_admin'@'localhost' IDENTIFIED BY 'cc_pass123';
GRANT ALL PRIVILEGES ON DRAS.* TO 'cc_admin'@'localhost';

-- 2. Relief Camp Officer (Can raise requests and confirm deliveries)
CREATE USER IF NOT EXISTS 'camp_officer'@'localhost' IDENTIFIED BY 'camp_pass123';
GRANT SELECT ON DRAS.vw_Active_Requests TO 'camp_officer'@'localhost';
GRANT SELECT ON DRAS.vw_Current_Inventory TO 'camp_officer'@'localhost';
GRANT INSERT ON DRAS.Request TO 'camp_officer'@'localhost';
GRANT INSERT ON DRAS.Request_Details TO 'camp_officer'@'localhost';
GRANT EXECUTE ON PROCEDURE DRAS.sp_Confirm_Delivery TO 'camp_officer'@'localhost';

-- 3. Warehouse Manager (Can dispatch and restock)
CREATE USER IF NOT EXISTS 'warehouse_mgr'@'localhost' IDENTIFIED BY 'wh_pass123';
GRANT SELECT ON DRAS.vw_Current_Inventory TO 'warehouse_mgr'@'localhost';
GRANT SELECT ON DRAS.vw_Active_Requests TO 'warehouse_mgr'@'localhost';
GRANT EXECUTE ON PROCEDURE DRAS.sp_Dispatch_Request TO 'warehouse_mgr'@'localhost';
GRANT EXECUTE ON PROCEDURE DRAS.sp_Restock TO 'warehouse_mgr'@'localhost';

-- Revoke direct update on sensitive tables to force usage of procedures
REVOKE UPDATE, DELETE ON DRAS.Warehouse_Inventory FROM 'warehouse_mgr'@'localhost';
REVOKE UPDATE, DELETE ON DRAS.Request FROM 'camp_officer'@'localhost';

FLUSH PRIVILEGES;
