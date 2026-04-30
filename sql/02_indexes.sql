-- Phase 2: Performance Indexes
-- Optimization for dashboard queries and high-concurrency procedure lookups.

USE DRAS;

-- Request status and priority are frequently filtered for officer queues
CREATE INDEX idx_request_status     ON Request(Status);
CREATE INDEX idx_request_priority   ON Request(Priority);
CREATE INDEX idx_request_camp       ON Request(Camp_ID);
CREATE INDEX idx_request_time       ON Request(Request_Time);

-- Resource lookup in inventory
CREATE INDEX idx_inventory_resource ON Warehouse_Inventory(Res_ID);
CREATE INDEX idx_inventory_warehouse ON Warehouse_Inventory(W_ID);

-- Dispatch tracking
CREATE INDEX idx_dispatch_status    ON Dispatch_Log(Status);
CREATE INDEX idx_dispatch_time      ON Dispatch_Log(Dispatch_Time);

-- Event monitoring
CREATE INDEX idx_event_level        ON Disaster_Event(Level);
CREATE INDEX idx_event_status       ON Disaster_Event(Status);

-- Alerting
CREATE INDEX idx_stock_alert_open   ON Stock_Alert(Resolved, W_ID);

-- Audit log filtering by table or time
CREATE INDEX idx_audit_table_time   ON Audit_Log(Table_Name, Changed_At);
