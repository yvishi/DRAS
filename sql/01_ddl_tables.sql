-- Phase 1: DDL — Core Tables for ReliefChain (DRAS)
-- Database: DRAS
-- Version: 1.0 (Academic Submission)

CREATE DATABASE IF NOT EXISTS DRAS;
USE DRAS;

-- Tier 1: Independent Tables
CREATE TABLE Control_Center (
    CC_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Location VARCHAR(255) NOT NULL,
    Contact VARCHAR(50),
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Disaster_Event (
    Event_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Location VARCHAR(255) NOT NULL,
    Level ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
    Status ENUM('Active', 'Monitoring', 'Resolved') DEFAULT 'Active',
    Start_Date DATETIME NOT NULL,
    End_Date DATETIME,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Resource (
    Res_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL UNIQUE,
    Type VARCHAR(50) NOT NULL, -- Food, Medical, Shelter, etc.
    Unit VARCHAR(20) NOT NULL, -- kg, L, units, boxes
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Warehouse (
    W_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Location VARCHAR(255) NOT NULL,
    Capacity_m3 DECIMAL(10,2),
    Contact VARCHAR(50),
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tier 2: Tables with Single Foreign Keys
CREATE TABLE Relief_Camp (
    Camp_ID INT AUTO_INCREMENT PRIMARY KEY,
    Event_ID INT NOT NULL,
    Name VARCHAR(100) NOT NULL,
    Location VARCHAR(255) NOT NULL,
    Current_Occupancy INT DEFAULT 0,
    Max_Capacity INT NOT NULL,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_camp_event FOREIGN KEY (Event_ID) REFERENCES Disaster_Event(Event_ID) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE Warehouse_Inventory (
    Inv_ID INT AUTO_INCREMENT PRIMARY KEY,
    W_ID INT NOT NULL,
    Res_ID INT NOT NULL,
    Quantity INT DEFAULT 0,
    Min_Threshold INT DEFAULT 10,
    Last_Updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_warehouse FOREIGN KEY (W_ID) REFERENCES Warehouse(W_ID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_inv_resource FOREIGN KEY (Res_ID) REFERENCES Resource(Res_ID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uq_inv_w_res UNIQUE (W_ID, Res_ID),
    CONSTRAINT chk_quantity_positive CHECK (Quantity >= 0)
);

-- Tier 3: Transactional Tables
CREATE TABLE Request (
    Req_ID INT AUTO_INCREMENT PRIMARY KEY,
    CC_ID INT NOT NULL,
    Camp_ID INT NOT NULL,
    Priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
    Status ENUM('Pending', 'Approved', 'Partially_Dispatched', 'Dispatched', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    Request_Time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_Status_Update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_req_cc FOREIGN KEY (CC_ID) REFERENCES Control_Center(CC_ID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_req_camp FOREIGN KEY (Camp_ID) REFERENCES Relief_Camp(Camp_ID) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tier 4: Details and Logs
CREATE TABLE Request_Details (
    Req_Detail_ID INT AUTO_INCREMENT PRIMARY KEY,
    Req_ID INT NOT NULL,
    Res_ID INT NOT NULL,
    Requested_Qty INT NOT NULL,
    Approved_Qty INT DEFAULT 0,
    CONSTRAINT fk_rd_request FOREIGN KEY (Req_ID) REFERENCES Request(Req_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rd_resource FOREIGN KEY (Res_ID) REFERENCES Resource(Res_ID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_req_qty_positive CHECK (Requested_Qty > 0),
    CONSTRAINT chk_appr_qty_range CHECK (Approved_Qty >= 0 AND Approved_Qty <= Requested_Qty)
);

CREATE TABLE Dispatch_Log (
    Dispatch_ID INT AUTO_INCREMENT PRIMARY KEY,
    Req_ID INT NOT NULL,
    W_ID INT NOT NULL,
    Dispatch_Time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Estimated_Arrival DATETIME,
    Status ENUM('Packed', 'In_Transit', 'Delivered', 'Delayed') DEFAULT 'Packed',
    CONSTRAINT fk_disp_req FOREIGN KEY (Req_ID) REFERENCES Request(Req_ID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_disp_warehouse FOREIGN KEY (W_ID) REFERENCES Warehouse(W_ID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uq_disp_req UNIQUE (Req_ID)
);

CREATE TABLE Restock_Log (
    Restock_ID INT AUTO_INCREMENT PRIMARY KEY,
    W_ID INT NOT NULL,
    Res_ID INT NOT NULL,
    Quantity INT NOT NULL,
    Restock_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Supplier VARCHAR(100),
    CONSTRAINT fk_rs_warehouse FOREIGN KEY (W_ID) REFERENCES Warehouse(W_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rs_resource FOREIGN KEY (Res_ID) REFERENCES Resource(Res_ID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_restock_qty_positive CHECK (Quantity > 0)
);

-- Tier 5: Tracking and Alerts
CREATE TABLE Delivery_Status (
    Delivery_ID INT AUTO_INCREMENT PRIMARY KEY,
    Dispatch_ID INT NOT NULL UNIQUE,
    Actual_Arrival TIMESTAMP NULL,
    Received_By VARCHAR(100),
    Confirmation ENUM('Received', 'Damaged', 'Missing', 'Refused') DEFAULT 'Received',
    Remarks TEXT,
    CONSTRAINT fk_del_dispatch FOREIGN KEY (Dispatch_ID) REFERENCES Dispatch_Log(Dispatch_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Stock_Alert (
    Alert_ID INT AUTO_INCREMENT PRIMARY KEY,
    W_ID INT NOT NULL,
    Res_ID INT NOT NULL,
    Alert_Time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Resolved BOOLEAN DEFAULT FALSE,
    Resolved_At TIMESTAMP NULL,
    CONSTRAINT fk_alert_warehouse FOREIGN KEY (W_ID) REFERENCES Warehouse(W_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_alert_resource FOREIGN KEY (Res_ID) REFERENCES Resource(Res_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Audit_Log (
    Log_ID INT AUTO_INCREMENT PRIMARY KEY,
    Table_Name VARCHAR(50) NOT NULL,
    Action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    Old_Value JSON,
    New_Value JSON,
    Changed_By VARCHAR(100),
    Changed_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
