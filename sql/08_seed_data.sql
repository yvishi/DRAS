-- Phase 6.2: Seed Data
-- 20+ rows across tables for a realistic demo.

USE DRAS;

-- 1. Control Centers
INSERT INTO Control_Center (Name, Location, Contact) VALUES
('National HQ', 'New Delhi', '+91 11 2345 6789'),
('Regional HQ West', 'Mumbai', '+91 22 9876 5432'),
('Regional HQ East', 'Kolkata', '+91 33 5555 4444');

-- 2. Disaster Events
INSERT INTO Disaster_Event (Name, Location, Level, Status, Start_Date) VALUES
('Cyclone Amphan', 'West Bengal Coast', 'Critical', 'Active', '2026-04-10 08:00:00'),
('Kerala Floods', 'Wayanad Region', 'High', 'Active', '2026-04-20 14:00:00'),
('Bihar Heatwave', 'Gaya District', 'Medium', 'Monitoring', '2026-04-25 10:00:00');

-- 3. Resources
INSERT INTO Resource (Name, Type, Unit) VALUES
('Drinking Water', 'Food', 'L'),
('Rice Bag (25kg)', 'Food', 'Units'),
('Paracetamol', 'Medical', 'Boxes'),
('Tarpaulin Sheet', 'Shelter', 'Units'),
('First Aid Kit', 'Medical', 'Units'),
('Blankets', 'Shelter', 'Units'),
('Dry Biscuits', 'Food', 'Packets'),
('Solar Lamp', 'Utility', 'Units');

-- 4. Warehouses
INSERT INTO Warehouse (Name, Location, Capacity_m3, Contact) VALUES
('Central Hub Kolkata', 'Salt Lake City', 5000.00, 'mgr_kol@relief.in'),
('South Hub Kochi', 'Ernakulam', 3000.00, 'mgr_kochi@relief.in'),
('West Hub Surat', 'Industrial Area', 4000.00, 'mgr_surat@relief.in');

-- 5. Relief Camps
INSERT INTO Relief_Camp (Event_ID, Name, Location, Current_Occupancy, Max_Capacity) VALUES
(1, 'Canning High School', 'Canning Town', 120, 500),
(1, 'Digha Shelter', 'East Midnapore', 450, 1000),
(2, 'St. Marys Camp', 'Wayanad', 80, 200);

-- 6. Initial Inventory (Direct Inserts)
INSERT INTO Warehouse_Inventory (W_ID, Res_ID, Quantity, Min_Threshold) VALUES
(1, 1, 10000, 500), (1, 2, 500, 50), (1, 4, 200, 20),
(2, 1, 5000, 500), (2, 3, 100, 10), (2, 6, 300, 50),
(3, 7, 1000, 100), (3, 8, 150, 15);

-- 7. Sample Requests
INSERT INTO Request (CC_ID, Camp_ID, Priority, Status) VALUES
(1, 1, 'Urgent', 'Pending'),
(1, 2, 'High', 'Pending'),
(2, 3, 'Medium', 'Pending');

-- 8. Request Details
INSERT INTO Request_Details (Req_ID, Res_ID, Requested_Qty) VALUES
(1, 1, 500), (1, 2, 20),
(2, 4, 100), (2, 1, 1000),
(3, 6, 50);

-- 9. Using Procedures to simulate system usage
-- Approve and Dispatch Request #1
CALL sp_Approve_Request(1);
CALL sp_Dispatch_Request(1, 1);

-- Confirm Delivery of Request #1
CALL sp_Confirm_Delivery(1, 'Officer Suresh');

-- Restock Warehouse #2
CALL sp_Restock(2, 1, 2000, 'AquaPure Ltd');
