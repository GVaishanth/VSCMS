-- VSCMS master initializer for MySQL 8.x / Workbench
-- Execute this file from top to bottom. It is intentionally self-contained.

-- ===== schema.sql =====
CREATE DATABASE IF NOT EXISTS vscms CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE vscms;
SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS FEEDBACK, INVOICE, PART_USAGE, SERVICE, SPARE_PART, SERVICE_REQUEST, APPOINTMENT, VEHICLE, SUPPLIER, MECHANIC, CUSTOMER;
SET FOREIGN_KEY_CHECKS=1;
CREATE TABLE CUSTOMER (customer_id INT AUTO_INCREMENT PRIMARY KEY, first_name VARCHAR(50) NOT NULL, last_name VARCHAR(50) NOT NULL, phone VARCHAR(15) NOT NULL, email VARCHAR(100) NOT NULL UNIQUE, address VARCHAR(255), city VARCHAR(50), state VARCHAR(50), pincode VARCHAR(10), created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_customer_phone(phone));
CREATE TABLE MECHANIC (mechanic_id INT AUTO_INCREMENT PRIMARY KEY, first_name VARCHAR(50) NOT NULL, last_name VARCHAR(50) NOT NULL, phone VARCHAR(15) NOT NULL, specialization VARCHAR(100), experience_years INT NOT NULL DEFAULT 0 CHECK(experience_years>=0), joining_date DATE NOT NULL, salary DECIMAL(10,2) NOT NULL CHECK(salary>=0), total_bonus DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK(total_bonus>=0), availability_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE');
CREATE TABLE SUPPLIER (supplier_id INT AUTO_INCREMENT PRIMARY KEY, supplier_name VARCHAR(100) NOT NULL, contact_person VARCHAR(100), phone VARCHAR(15), email VARCHAR(100), address VARCHAR(255), city VARCHAR(50), gst_number VARCHAR(20) UNIQUE);
CREATE TABLE VEHICLE (vehicle_id INT AUTO_INCREMENT PRIMARY KEY, customer_id INT NOT NULL, registration_number VARCHAR(20) NOT NULL UNIQUE, chassis_number VARCHAR(30) NOT NULL UNIQUE, engine_number VARCHAR(30) NOT NULL UNIQUE, make VARCHAR(50) NOT NULL, model VARCHAR(50) NOT NULL, variant VARCHAR(50), manufacture_year YEAR, fuel_type VARCHAR(20), transmission VARCHAR(20), color VARCHAR(30), current_mileage INT DEFAULT 0 CHECK(current_mileage>=0), CONSTRAINT fk_vehicle_customer FOREIGN KEY(customer_id) REFERENCES CUSTOMER(customer_id) ON UPDATE CASCADE ON DELETE RESTRICT);
CREATE TABLE APPOINTMENT (appointment_id INT AUTO_INCREMENT PRIMARY KEY, vehicle_id INT NOT NULL, appointment_date DATE NOT NULL, appointment_time TIME NOT NULL, service_type VARCHAR(50) NOT NULL, booking_mode VARCHAR(20) NOT NULL DEFAULT 'ONLINE', status VARCHAR(20) NOT NULL DEFAULT 'BOOKED', FOREIGN KEY(vehicle_id) REFERENCES VEHICLE(vehicle_id) ON UPDATE CASCADE ON DELETE RESTRICT);
CREATE TABLE SERVICE_REQUEST (request_id INT AUTO_INCREMENT PRIMARY KEY, appointment_id INT NOT NULL UNIQUE, mechanic_id INT NOT NULL, complaint_description TEXT NOT NULL, diagnosis TEXT, service_status VARCHAR(20) NOT NULL DEFAULT 'OPEN', estimated_completion_date DATE, estimated_cost DECIMAL(10,2) DEFAULT 0 CHECK(estimated_cost>=0), actual_cost DECIMAL(10,2) CHECK(actual_cost IS NULL OR actual_cost>=0), created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(appointment_id) REFERENCES APPOINTMENT(appointment_id) ON UPDATE CASCADE ON DELETE RESTRICT, FOREIGN KEY(mechanic_id) REFERENCES MECHANIC(mechanic_id) ON UPDATE CASCADE ON DELETE RESTRICT);
CREATE TABLE SERVICE (service_id INT AUTO_INCREMENT PRIMARY KEY, request_id INT NOT NULL, service_name VARCHAR(100) NOT NULL, description TEXT, labor_charge DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK(labor_charge>=0), estimated_duration INT CHECK(estimated_duration IS NULL OR estimated_duration>=0), remarks VARCHAR(255), FOREIGN KEY(request_id) REFERENCES SERVICE_REQUEST(request_id) ON UPDATE CASCADE ON DELETE RESTRICT);
CREATE TABLE SPARE_PART (part_id INT AUTO_INCREMENT PRIMARY KEY, supplier_id INT NOT NULL, part_name VARCHAR(100) NOT NULL, category VARCHAR(50), manufacturer VARCHAR(100), unit_price DECIMAL(10,2) NOT NULL CHECK(unit_price>=0), stock_quantity INT NOT NULL DEFAULT 0 CHECK(stock_quantity>=0), reorder_level INT NOT NULL DEFAULT 0 CHECK(reorder_level>=0), warranty_months INT DEFAULT 0 CHECK(warranty_months>=0), FOREIGN KEY(supplier_id) REFERENCES SUPPLIER(supplier_id) ON UPDATE CASCADE ON DELETE RESTRICT);
CREATE TABLE PART_USAGE (usage_id INT AUTO_INCREMENT PRIMARY KEY, request_id INT NOT NULL, part_id INT NOT NULL, quantity_used INT NOT NULL CHECK(quantity_used>0), total_cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK(total_cost>=0), FOREIGN KEY(request_id) REFERENCES SERVICE_REQUEST(request_id) ON UPDATE CASCADE ON DELETE RESTRICT, FOREIGN KEY(part_id) REFERENCES SPARE_PART(part_id) ON UPDATE CASCADE ON DELETE RESTRICT);
CREATE TABLE INVOICE (invoice_id INT AUTO_INCREMENT PRIMARY KEY, request_id INT NOT NULL UNIQUE, labor_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK(labor_amount>=0), parts_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK(parts_amount>=0), tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK(tax_amount>=0), discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK(discount_amount>=0), total_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK(total_amount>=0), invoice_date DATE NOT NULL, payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING', FOREIGN KEY(request_id) REFERENCES SERVICE_REQUEST(request_id) ON UPDATE CASCADE ON DELETE RESTRICT);
CREATE TABLE FEEDBACK (feedback_id INT AUTO_INCREMENT PRIMARY KEY, request_id INT NOT NULL UNIQUE, customer_id INT NOT NULL, rating TINYINT NOT NULL CHECK(rating BETWEEN 1 AND 5), comments TEXT, feedback_date DATE NOT NULL, FOREIGN KEY(request_id) REFERENCES SERVICE_REQUEST(request_id) ON UPDATE CASCADE ON DELETE RESTRICT, FOREIGN KEY(customer_id) REFERENCES CUSTOMER(customer_id) ON UPDATE CASCADE ON DELETE RESTRICT);


-- ===== indexes.sql =====
USE vscms;
CREATE INDEX idx_customer_phone ON CUSTOMER(phone);
CREATE INDEX idx_vehicle_customer ON VEHICLE(customer_id);
CREATE INDEX idx_appointment_date ON APPOINTMENT(appointment_date);
CREATE INDEX idx_request_status ON SERVICE_REQUEST(service_status);
CREATE INDEX idx_request_mechanic ON SERVICE_REQUEST(mechanic_id);
CREATE INDEX idx_part_name ON SPARE_PART(part_name);
CREATE INDEX idx_part_stock ON SPARE_PART(stock_quantity);
CREATE INDEX idx_invoice_date ON INVOICE(invoice_date);
CREATE INDEX idx_feedback_rating ON FEEDBACK(rating);
-- Supporting indexes accelerate joins and operational searches.


-- ===== sample_data.sql =====
USE vscms;
INSERT INTO CUSTOMER(first_name,last_name,phone,email,address,city,state,pincode) VALUES
('Arun','Kumar','9100000000','arunkumar1@example.com','1 MG Road','Vellore','Tamil Nadu','632000'),
('Priya','Sharma','9100000001','priyasharma2@example.com','2 MG Road','Chennai','Tamil Nadu','632001'),
('Ravi','Patel','9100000002','ravipatel3@example.com','3 MG Road','Bengaluru','Tamil Nadu','632002'),
('Ananya','Iyer','9100000003','ananyaiyer4@example.com','4 MG Road','Coimbatore','Tamil Nadu','632003'),
('Vikram','Singh','9100000004','vikramsingh5@example.com','5 MG Road','Vellore','Tamil Nadu','632004'),
('Meena','Rao','9100000005','meenarao6@example.com','6 MG Road','Chennai','Tamil Nadu','632005'),
('Suresh','Nair','9100000006','sureshnair7@example.com','7 MG Road','Bengaluru','Tamil Nadu','632006'),
('Kavya','Reddy','9100000007','kavyareddy8@example.com','8 MG Road','Coimbatore','Tamil Nadu','632007'),
('Dinesh','Joshi','9100000008','dineshjoshi9@example.com','9 MG Road','Vellore','Tamil Nadu','632008'),
('Lakshmi','Menon','9100000009','lakshmimenon10@example.com','10 MG Road','Chennai','Tamil Nadu','632009'),
('Rahul','Verma','9100000010','rahulverma11@example.com','11 MG Road','Bengaluru','Tamil Nadu','632000'),
('Divya','Krishnan','9100000011','divyakrishnan12@example.com','12 MG Road','Coimbatore','Tamil Nadu','632001'),
('Manoj','Das','9100000012','manojdas13@example.com','13 MG Road','Vellore','Tamil Nadu','632002'),
('Sneha','Bose','9100000013','snehabose14@example.com','14 MG Road','Chennai','Tamil Nadu','632003'),
('Karthik','Pillai','9100000014','karthikpillai15@example.com','15 MG Road','Bengaluru','Tamil Nadu','632004'),
('Pooja','Gupta','9100000015','poojagupta16@example.com','16 MG Road','Coimbatore','Tamil Nadu','632005'),
('Ajay','Mishra','9100000016','ajaymishra17@example.com','17 MG Road','Vellore','Tamil Nadu','632006'),
('Nithya','Balan','9100000017','nithyabalan18@example.com','18 MG Road','Chennai','Tamil Nadu','632007'),
('Santhosh','Paul','9100000018','santhoshpaul19@example.com','19 MG Road','Bengaluru','Tamil Nadu','632008'),
('Ishita','Jain','9100000019','ishitajain20@example.com','20 MG Road','Coimbatore','Tamil Nadu','632009');
INSERT INTO VEHICLE VALUES
(1,1,'TN23AB1000','CHASSIS000001','ENGINE000001','Maruti','Swift','Standard',2017,'Diesel','Automatic','White',12000),
(2,2,'TN24AB1001','CHASSIS000002','ENGINE000002','Hyundai','i20','Standard',2018,'Petrol','Manual','Black',13800),
(3,3,'TN25AB1002','CHASSIS000003','ENGINE000003','Tata','Nexon','Standard',2019,'Petrol','Automatic','Blue',15600),
(4,4,'TN26AB1003','CHASSIS000004','ENGINE000004','Honda','City','Standard',2020,'Diesel','Manual','Red',17400),
(5,5,'TN27AB1004','CHASSIS000005','ENGINE000005','Toyota','Innova','Standard',2021,'Petrol','Automatic','White',19200),
(6,6,'TN28AB1005','CHASSIS000006','ENGINE000006','Mahindra','XUV700','Standard',2022,'Petrol','Manual','Black',21000),
(7,7,'TN29AB1006','CHASSIS000007','ENGINE000007','Maruti','Swift','Standard',2023,'Diesel','Automatic','Blue',22800),
(8,8,'TN30AB1007','CHASSIS000008','ENGINE000008','Hyundai','i20','Standard',2024,'Petrol','Manual','Red',24600),
(9,9,'TN31AB1008','CHASSIS000009','ENGINE000009','Tata','Nexon','Standard',2017,'Petrol','Automatic','White',26400),
(10,10,'TN32AB1009','CHASSIS000010','ENGINE000010','Honda','City','Standard',2018,'Diesel','Manual','Black',28200),
(11,11,'TN23AB1010','CHASSIS000011','ENGINE000011','Toyota','Innova','Standard',2019,'Petrol','Automatic','Blue',30000),
(12,12,'TN24AB1011','CHASSIS000012','ENGINE000012','Mahindra','XUV700','Standard',2020,'Petrol','Manual','Red',31800),
(13,13,'TN25AB1012','CHASSIS000013','ENGINE000013','Maruti','Swift','Standard',2021,'Diesel','Automatic','White',33600),
(14,14,'TN26AB1013','CHASSIS000014','ENGINE000014','Hyundai','i20','Standard',2022,'Petrol','Manual','Black',35400),
(15,15,'TN27AB1014','CHASSIS000015','ENGINE000015','Tata','Nexon','Standard',2023,'Petrol','Automatic','Blue',37200),
(16,16,'TN28AB1015','CHASSIS000016','ENGINE000016','Honda','City','Standard',2024,'Diesel','Manual','Red',39000),
(17,17,'TN29AB1016','CHASSIS000017','ENGINE000017','Toyota','Innova','Standard',2017,'Petrol','Automatic','White',40800),
(18,18,'TN30AB1017','CHASSIS000018','ENGINE000018','Mahindra','XUV700','Standard',2018,'Petrol','Manual','Black',42600),
(19,19,'TN31AB1018','CHASSIS000019','ENGINE000019','Maruti','Swift','Standard',2019,'Diesel','Automatic','Blue',44400),
(20,20,'TN32AB1019','CHASSIS000020','ENGINE000020','Hyundai','i20','Standard',2020,'Petrol','Manual','Red',46200),
(21,1,'TN23AB1020','CHASSIS000021','ENGINE000021','Tata','Nexon','Standard',2021,'Petrol','Automatic','White',48000),
(22,2,'TN24AB1021','CHASSIS000022','ENGINE000022','Honda','City','Standard',2022,'Diesel','Manual','Black',49800),
(23,3,'TN25AB1022','CHASSIS000023','ENGINE000023','Toyota','Innova','Standard',2023,'Petrol','Automatic','Blue',51600),
(24,4,'TN26AB1023','CHASSIS000024','ENGINE000024','Mahindra','XUV700','Standard',2024,'Petrol','Manual','Red',53400),
(25,5,'TN27AB1024','CHASSIS000025','ENGINE000025','Maruti','Swift','Standard',2017,'Diesel','Automatic','White',55200);
INSERT INTO MECHANIC VALUES
(1,'Arun','Kumar','9810000000','Engine',3,'2020-01-01',28000.00,0,'BUSY'),
(2,'Priya','Sharma','9810000001','Electrical',4,'2020-02-01',29500.00,0,'AVAILABLE'),
(3,'Ravi','Patel','9810000002','Brakes',5,'2020-03-01',31000.00,0,'AVAILABLE'),
(4,'Ananya','Iyer','9810000003','Diagnostics',6,'2020-04-01',32500.00,0,'BUSY'),
(5,'Vikram','Singh','9810000004','Engine',7,'2020-05-01',34000.00,0,'AVAILABLE'),
(6,'Meena','Rao','9810000005','Electrical',8,'2020-06-01',35500.00,0,'AVAILABLE'),
(7,'Suresh','Nair','9810000006','Brakes',9,'2020-07-01',37000.00,0,'BUSY'),
(8,'Kavya','Reddy','9810000007','Diagnostics',10,'2020-08-01',38500.00,0,'AVAILABLE'),
(9,'Dinesh','Joshi','9810000008','Engine',3,'2020-09-01',40000.00,0,'AVAILABLE'),
(10,'Lakshmi','Menon','9810000009','Electrical',4,'2020-01-01',41500.00,0,'BUSY');
INSERT INTO SUPPLIER VALUES
(1,'Supplier A','Contact A','9720000000','sales1@supply.in','Industrial Estate','Chennai','33GST1000000'),
(2,'Supplier B','Contact B','9720000001','sales2@supply.in','Industrial Estate','Chennai','33GST1000001'),
(3,'Supplier C','Contact C','9720000002','sales3@supply.in','Industrial Estate','Chennai','33GST1000002'),
(4,'Supplier D','Contact D','9720000003','sales4@supply.in','Industrial Estate','Chennai','33GST1000003'),
(5,'Supplier E','Contact E','9720000004','sales5@supply.in','Industrial Estate','Chennai','33GST1000004'),
(6,'Supplier F','Contact F','9720000005','sales6@supply.in','Industrial Estate','Chennai','33GST1000005'),
(7,'Supplier G','Contact G','9720000006','sales7@supply.in','Industrial Estate','Chennai','33GST1000006'),
(8,'Supplier H','Contact H','9720000007','sales8@supply.in','Industrial Estate','Chennai','33GST1000007');
INSERT INTO APPOINTMENT VALUES
(1,1,'2026-01-01','09:00:00','General Service','ONLINE','COMPLETED'),
(2,2,'2026-02-02','10:00:00','Oil Change','PHONE','COMPLETED'),
(3,3,'2026-03-03','11:00:00','Brake Repair','ONLINE','COMPLETED'),
(4,4,'2026-04-04','12:00:00','AC Service','PHONE','COMPLETED'),
(5,5,'2026-05-05','13:00:00','General Service','ONLINE','COMPLETED'),
(6,6,'2026-06-06','14:00:00','Oil Change','PHONE','COMPLETED'),
(7,7,'2026-07-07','15:00:00','Brake Repair','ONLINE','COMPLETED'),
(8,8,'2026-08-08','16:00:00','AC Service','PHONE','COMPLETED'),
(9,9,'2026-09-09','09:00:00','General Service','ONLINE','COMPLETED'),
(10,10,'2026-01-10','10:00:00','Oil Change','PHONE','COMPLETED'),
(11,11,'2026-02-11','11:00:00','Brake Repair','ONLINE','COMPLETED'),
(12,12,'2026-03-12','12:00:00','AC Service','PHONE','COMPLETED'),
(13,13,'2026-04-13','13:00:00','General Service','ONLINE','COMPLETED'),
(14,14,'2026-05-14','14:00:00','Oil Change','PHONE','COMPLETED'),
(15,15,'2026-06-15','15:00:00','Brake Repair','ONLINE','COMPLETED'),
(16,16,'2026-07-16','16:00:00','AC Service','PHONE','COMPLETED'),
(17,17,'2026-08-17','09:00:00','General Service','ONLINE','COMPLETED'),
(18,18,'2026-09-18','10:00:00','Oil Change','PHONE','COMPLETED'),
(19,19,'2026-01-19','11:00:00','Brake Repair','ONLINE','COMPLETED'),
(20,20,'2026-02-20','12:00:00','AC Service','PHONE','COMPLETED'),
(21,21,'2026-03-21','13:00:00','General Service','ONLINE','COMPLETED'),
(22,22,'2026-04-22','14:00:00','Oil Change','PHONE','COMPLETED'),
(23,23,'2026-05-23','15:00:00','Brake Repair','ONLINE','COMPLETED'),
(24,24,'2026-06-24','16:00:00','AC Service','PHONE','COMPLETED'),
(25,25,'2026-07-25','09:00:00','General Service','ONLINE','COMPLETED'),
(26,1,'2026-08-01','10:00:00','Oil Change','PHONE','BOOKED'),
(27,2,'2026-09-02','11:00:00','Brake Repair','ONLINE','BOOKED'),
(28,3,'2026-01-03','12:00:00','AC Service','PHONE','BOOKED'),
(29,4,'2026-02-04','13:00:00','General Service','ONLINE','BOOKED'),
(30,5,'2026-03-05','14:00:00','Oil Change','PHONE','BOOKED');
INSERT INTO SERVICE_REQUEST VALUES
(1,1,1,'Routine inspection and reported issue 1','Inspection completed','COMPLETED','2026-08-10',2500.00,2200,'2026-07-01 09:00:00'),
(2,2,2,'Routine inspection and reported issue 2','Inspection completed','COMPLETED','2026-08-11',2600.00,2200,'2026-07-02 09:00:00'),
(3,3,3,'Routine inspection and reported issue 3','Inspection completed','COMPLETED','2026-08-12',2700.00,2200,'2026-07-03 09:00:00'),
(4,4,4,'Routine inspection and reported issue 4','Inspection completed','COMPLETED','2026-08-13',2800.00,2200,'2026-07-04 09:00:00'),
(5,5,5,'Routine inspection and reported issue 5','Inspection completed','COMPLETED','2026-08-14',2900.00,2200,'2026-07-05 09:00:00'),
(6,6,6,'Routine inspection and reported issue 6','Inspection completed','COMPLETED','2026-08-15',3000.00,2200,'2026-07-06 09:00:00'),
(7,7,7,'Routine inspection and reported issue 7','Inspection completed','COMPLETED','2026-08-16',3100.00,2200,'2026-07-07 09:00:00'),
(8,8,8,'Routine inspection and reported issue 8','Inspection completed','COMPLETED','2026-08-17',3200.00,2200,'2026-07-08 09:00:00'),
(9,9,9,'Routine inspection and reported issue 9','Inspection completed','COMPLETED','2026-08-18',3300.00,2200,'2026-07-09 09:00:00'),
(10,10,10,'Routine inspection and reported issue 10','Inspection completed','COMPLETED','2026-08-19',3400.00,2200,'2026-07-10 09:00:00'),
(11,11,1,'Routine inspection and reported issue 11','Inspection completed','COMPLETED','2026-08-20',3500.00,2200,'2026-07-11 09:00:00'),
(12,12,2,'Routine inspection and reported issue 12','Inspection completed','COMPLETED','2026-08-21',3600.00,2200,'2026-07-12 09:00:00'),
(13,13,3,'Routine inspection and reported issue 13','Inspection completed','COMPLETED','2026-08-22',3700.00,2200,'2026-07-13 09:00:00'),
(14,14,4,'Routine inspection and reported issue 14','Inspection completed','COMPLETED','2026-08-23',3800.00,2200,'2026-07-14 09:00:00'),
(15,15,5,'Routine inspection and reported issue 15','Inspection completed','COMPLETED','2026-08-24',3900.00,2200,'2026-07-15 09:00:00'),
(16,16,6,'Routine inspection and reported issue 16','Inspection completed','COMPLETED','2026-08-10',4000.00,2200,'2026-07-16 09:00:00'),
(17,17,7,'Routine inspection and reported issue 17','Inspection completed','COMPLETED','2026-08-11',4100.00,2200,'2026-07-17 09:00:00'),
(18,18,8,'Routine inspection and reported issue 18','Inspection completed','COMPLETED','2026-08-12',4200.00,2200,'2026-07-18 09:00:00'),
(19,19,9,'Routine inspection and reported issue 19','Inspection completed','COMPLETED','2026-08-13',4300.00,2200,'2026-07-19 09:00:00'),
(20,20,10,'Routine inspection and reported issue 20','Inspection completed','COMPLETED','2026-08-14',4400.00,2200,'2026-07-20 09:00:00'),
(21,21,1,'Routine inspection and reported issue 21','Inspection completed','COMPLETED','2026-08-15',4500.00,2200,'2026-07-01 09:00:00'),
(22,22,2,'Routine inspection and reported issue 22','Inspection completed','COMPLETED','2026-08-16',4600.00,2200,'2026-07-02 09:00:00'),
(23,23,3,'Routine inspection and reported issue 23','Inspection completed','COMPLETED','2026-08-17',4700.00,2200,'2026-07-03 09:00:00'),
(24,24,4,'Routine inspection and reported issue 24','Inspection completed','COMPLETED','2026-08-18',4800.00,2200,'2026-07-04 09:00:00'),
(25,25,5,'Routine inspection and reported issue 25','Inspection completed','COMPLETED','2026-08-19',4900.00,2200,'2026-07-05 09:00:00'),
(26,26,6,'Routine inspection and reported issue 26','Inspection completed','OPEN','2026-08-20',5000.00,NULL,'2026-07-06 09:00:00'),
(27,27,7,'Routine inspection and reported issue 27','Inspection completed','OPEN','2026-08-21',5100.00,NULL,'2026-07-07 09:00:00'),
(28,28,8,'Routine inspection and reported issue 28','Inspection completed','OPEN','2026-08-22',5200.00,NULL,'2026-07-08 09:00:00'),
(29,29,9,'Routine inspection and reported issue 29','Inspection completed','OPEN','2026-08-23',5300.00,NULL,'2026-07-09 09:00:00'),
(30,30,10,'Routine inspection and reported issue 30','Inspection completed','OPEN','2026-08-24',5400.00,NULL,'2026-07-10 09:00:00');
INSERT INTO SERVICE VALUES
(1,1,'Oil change','Professional oil replacement',500.00,30,'As required'),
(2,2,'Brake inspection','Professional brake inspection',850.00,60,'As required'),
(3,3,'Wheel alignment','Professional alignment',1200.00,90,'As required'),
(4,4,'AC check','Professional air conditioning',1550.00,120,'As required'),
(5,5,'Full service','Professional maintenance',1900.00,30,'As required'),
(6,6,'Oil change','Professional oil replacement',500.00,60,'As required'),
(7,7,'Brake inspection','Professional brake inspection',850.00,90,'As required'),
(8,8,'Wheel alignment','Professional alignment',1200.00,120,'As required'),
(9,9,'AC check','Professional air conditioning',1550.00,30,'As required'),
(10,10,'Full service','Professional maintenance',1900.00,60,'As required'),
(11,11,'Oil change','Professional oil replacement',500.00,90,'As required'),
(12,12,'Brake inspection','Professional brake inspection',850.00,120,'As required'),
(13,13,'Wheel alignment','Professional alignment',1200.00,30,'As required'),
(14,14,'AC check','Professional air conditioning',1550.00,60,'As required'),
(15,15,'Full service','Professional maintenance',1900.00,90,'As required'),
(16,16,'Oil change','Professional oil replacement',500.00,120,'As required'),
(17,17,'Brake inspection','Professional brake inspection',850.00,30,'As required'),
(18,18,'Wheel alignment','Professional alignment',1200.00,60,'As required'),
(19,19,'AC check','Professional air conditioning',1550.00,90,'As required'),
(20,20,'Full service','Professional maintenance',1900.00,120,'As required'),
(21,21,'Oil change','Professional oil replacement',500.00,30,'As required'),
(22,22,'Brake inspection','Professional brake inspection',850.00,60,'As required'),
(23,23,'Wheel alignment','Professional alignment',1200.00,90,'As required'),
(24,24,'AC check','Professional air conditioning',1550.00,120,'As required'),
(25,25,'Full service','Professional maintenance',1900.00,30,'As required'),
(26,26,'Oil change','Professional oil replacement',500.00,60,'As required'),
(27,27,'Brake inspection','Professional brake inspection',850.00,90,'As required'),
(28,28,'Wheel alignment','Professional alignment',1200.00,120,'As required'),
(29,29,'AC check','Professional air conditioning',1550.00,30,'As required'),
(30,30,'Full service','Professional maintenance',1900.00,60,'As required'),
(31,1,'Oil change','Professional oil replacement',500.00,90,'As required'),
(32,2,'Brake inspection','Professional brake inspection',850.00,120,'As required'),
(33,3,'Wheel alignment','Professional alignment',1200.00,30,'As required'),
(34,4,'AC check','Professional air conditioning',1550.00,60,'As required'),
(35,5,'Full service','Professional maintenance',1900.00,90,'As required'),
(36,6,'Oil change','Professional oil replacement',500.00,120,'As required'),
(37,7,'Brake inspection','Professional brake inspection',850.00,30,'As required'),
(38,8,'Wheel alignment','Professional alignment',1200.00,60,'As required'),
(39,9,'AC check','Professional air conditioning',1550.00,90,'As required'),
(40,10,'Full service','Professional maintenance',1900.00,120,'As required'),
(41,11,'Oil change','Professional oil replacement',500.00,30,'As required'),
(42,12,'Brake inspection','Professional brake inspection',850.00,60,'As required'),
(43,13,'Wheel alignment','Professional alignment',1200.00,90,'As required'),
(44,14,'AC check','Professional air conditioning',1550.00,120,'As required'),
(45,15,'Full service','Professional maintenance',1900.00,30,'As required'),
(46,16,'Oil change','Professional oil replacement',500.00,60,'As required'),
(47,17,'Brake inspection','Professional brake inspection',850.00,90,'As required'),
(48,18,'Wheel alignment','Professional alignment',1200.00,120,'As required'),
(49,19,'AC check','Professional air conditioning',1550.00,30,'As required'),
(50,20,'Full service','Professional maintenance',1900.00,60,'As required');
INSERT INTO SPARE_PART VALUES
(1,1,'Engine Oil','Lubricant','OEM',350.00,5,5,6),
(2,2,'Oil Filter','Filter','OEM',525.00,6,5,7),
(3,3,'Brake Pad','Brake','OEM',700.00,7,5,8),
(4,4,'Air Filter','Electrical','OEM',875.00,8,5,9),
(5,5,'Spark Plug','Lubricant','OEM',1050.00,9,5,10),
(6,6,'Coolant','Filter','OEM',1225.00,10,5,11),
(7,7,'Battery','Brake','OEM',1400.00,11,5,12),
(8,8,'Wiper Blade','Electrical','OEM',1575.00,12,5,13),
(9,1,'Engine Oil','Lubricant','OEM',350.00,13,5,14),
(10,2,'Oil Filter','Filter','OEM',525.00,14,5,15),
(11,3,'Brake Pad','Brake','OEM',700.00,15,5,16),
(12,4,'Air Filter','Electrical','OEM',875.00,16,5,17),
(13,5,'Spark Plug','Lubricant','OEM',1050.00,17,5,18),
(14,6,'Coolant','Filter','OEM',1225.00,18,5,19),
(15,7,'Battery','Brake','OEM',1400.00,19,5,20),
(16,8,'Wiper Blade','Electrical','OEM',1575.00,20,5,21),
(17,1,'Engine Oil','Lubricant','OEM',350.00,21,5,22),
(18,2,'Oil Filter','Filter','OEM',525.00,22,5,23),
(19,3,'Brake Pad','Brake','OEM',700.00,23,5,6),
(20,4,'Air Filter','Electrical','OEM',875.00,24,5,7),
(21,5,'Spark Plug','Lubricant','OEM',1050.00,5,5,8),
(22,6,'Coolant','Filter','OEM',1225.00,6,5,9),
(23,7,'Battery','Brake','OEM',1400.00,7,5,10),
(24,8,'Wiper Blade','Electrical','OEM',1575.00,8,5,11),
(25,1,'Engine Oil','Lubricant','OEM',350.00,9,5,12),
(26,2,'Oil Filter','Filter','OEM',525.00,10,5,13),
(27,3,'Brake Pad','Brake','OEM',700.00,11,5,14),
(28,4,'Air Filter','Electrical','OEM',875.00,12,5,15),
(29,5,'Spark Plug','Lubricant','OEM',1050.00,13,5,16),
(30,6,'Coolant','Filter','OEM',1225.00,14,5,17);
INSERT INTO PART_USAGE VALUES
(1,1,1,1,0),
(2,2,2,2,0),
(3,3,3,3,0),
(4,4,4,1,0),
(5,5,5,2,0),
(6,6,6,3,0),
(7,7,7,1,0),
(8,8,8,2,0),
(9,9,9,3,0),
(10,10,10,1,0),
(11,11,11,2,0),
(12,12,12,3,0),
(13,13,13,1,0),
(14,14,14,2,0),
(15,15,15,3,0),
(16,16,16,1,0),
(17,17,17,2,0),
(18,18,18,3,0),
(19,19,19,1,0),
(20,20,20,2,0),
(21,21,21,3,0),
(22,22,22,1,0),
(23,23,23,2,0),
(24,24,24,3,0),
(25,25,25,1,0),
(26,26,26,2,0),
(27,27,27,3,0),
(28,28,28,1,0),
(29,29,29,2,0),
(30,30,30,3,0),
(31,1,1,1,0),
(32,2,2,2,0),
(33,3,3,3,0),
(34,4,4,1,0),
(35,5,5,2,0),
(36,6,6,3,0),
(37,7,7,1,0),
(38,8,8,2,0),
(39,9,9,3,0),
(40,10,10,1,0),
(41,11,11,2,0),
(42,12,12,3,0),
(43,13,13,1,0),
(44,14,14,2,0),
(45,15,15,3,0),
(46,16,16,1,0),
(47,17,17,2,0),
(48,18,18,3,0),
(49,19,19,1,0),
(50,20,20,2,0);
INSERT INTO INVOICE(invoice_id,request_id,labor_amount,parts_amount,tax_amount,discount_amount,total_amount,invoice_date,payment_status) VALUES
(1,1,1000.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=1),180.00,0.00,1180.00,'2026-07-01','PENDING'),
(2,2,1100.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=2),200.00,50.00,1250.00,'2026-07-02','PAID'),
(3,3,1200.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=3),220.00,50.00,1370.00,'2026-07-03','PENDING'),
(4,4,1300.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=4),240.00,0.00,1540.00,'2026-07-04','PAID'),
(5,5,1400.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=5),260.00,50.00,1610.00,'2026-07-05','PENDING'),
(6,6,1500.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=6),280.00,50.00,1730.00,'2026-07-06','PAID'),
(7,7,1600.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=7),300.00,0.00,1900.00,'2026-07-07','PENDING'),
(8,8,1700.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=8),320.00,50.00,1970.00,'2026-07-08','PAID'),
(9,9,1800.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=9),340.00,50.00,2090.00,'2026-07-09','PENDING'),
(10,10,1900.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=10),360.00,0.00,2260.00,'2026-07-10','PAID'),
(11,11,2000.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=11),380.00,50.00,2330.00,'2026-07-11','PENDING'),
(12,12,2100.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=12),400.00,50.00,2450.00,'2026-07-12','PAID'),
(13,13,2200.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=13),420.00,0.00,2620.00,'2026-07-13','PENDING'),
(14,14,2300.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=14),440.00,50.00,2690.00,'2026-07-14','PAID'),
(15,15,2400.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=15),460.00,50.00,2810.00,'2026-07-15','PENDING'),
(16,16,2500.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=16),480.00,0.00,2980.00,'2026-07-16','PAID'),
(17,17,2600.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=17),500.00,50.00,3050.00,'2026-07-17','PENDING'),
(18,18,2700.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=18),520.00,50.00,3170.00,'2026-07-18','PAID'),
(19,19,2800.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=19),540.00,0.00,3340.00,'2026-07-19','PENDING'),
(20,20,2900.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=20),560.00,50.00,3410.00,'2026-07-20','PAID'),
(21,21,3000.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=21),580.00,50.00,3530.00,'2026-07-01','PENDING'),
(22,22,3100.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=22),600.00,0.00,3700.00,'2026-07-02','PAID'),
(23,23,3200.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=23),620.00,50.00,3770.00,'2026-07-03','PENDING'),
(24,24,3300.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=24),640.00,50.00,3890.00,'2026-07-04','PAID'),
(25,25,3400.00,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=25),660.00,0.00,4060.00,'2026-07-05','PENDING');
INSERT INTO FEEDBACK VALUES
(1,1,1,3,'Good service experience','2026-08-01'),
(2,2,2,4,'Good service experience','2026-08-02'),
(3,3,3,5,'Good service experience','2026-08-03'),
(4,4,4,3,'Good service experience','2026-08-04'),
(5,5,5,4,'Good service experience','2026-08-05'),
(6,6,6,5,'Good service experience','2026-08-06'),
(7,7,7,3,'Good service experience','2026-08-07'),
(8,8,8,4,'Good service experience','2026-08-08'),
(9,9,9,5,'Good service experience','2026-08-09'),
(10,10,10,3,'Good service experience','2026-08-10'),
(11,11,11,4,'Good service experience','2026-08-11'),
(12,12,12,5,'Good service experience','2026-08-12'),
(13,13,13,3,'Good service experience','2026-08-13'),
(14,14,14,4,'Good service experience','2026-08-14'),
(15,15,15,5,'Good service experience','2026-08-15'),
(16,16,16,3,'Good service experience','2026-08-16'),
(17,17,17,4,'Good service experience','2026-08-17'),
(18,18,18,5,'Good service experience','2026-08-18'),
(19,19,19,3,'Good service experience','2026-08-19'),
(20,20,20,4,'Good service experience','2026-08-20');


-- ===== functions.sql =====
USE vscms;
DROP FUNCTION IF EXISTS fn_invoice_total;
DROP FUNCTION IF EXISTS fn_mechanic_bonus;
DROP FUNCTION IF EXISTS fn_stock_status;
DELIMITER $$
CREATE FUNCTION fn_invoice_total(p_labor DECIMAL(10,2),p_parts DECIMAL(10,2),p_tax DECIMAL(10,2),p_discount DECIMAL(10,2)) RETURNS DECIMAL(10,2) DETERMINISTIC
BEGIN RETURN GREATEST(0,COALESCE(p_labor,0)+COALESCE(p_parts,0)+COALESCE(p_tax,0)-COALESCE(p_discount,0)); END$$
CREATE FUNCTION fn_mechanic_bonus(p_actual DECIMAL(10,2),p_rating TINYINT) RETURNS DECIMAL(10,2) DETERMINISTIC
BEGIN RETURN 100 + IF(COALESCE(p_actual,0)>=5000,250,0) + IF(COALESCE(p_rating,0)=5,100,0); END$$
CREATE FUNCTION fn_stock_status(p_stock INT,p_reorder INT) RETURNS VARCHAR(20) DETERMINISTIC
BEGIN RETURN CASE WHEN p_stock=0 THEN 'OUT OF STOCK' WHEN p_stock<=p_reorder THEN 'LOW STOCK' ELSE 'IN STOCK' END; END$$
DELIMITER ;


-- ===== procedures.sql =====
USE vscms;
DROP PROCEDURE IF EXISTS sp_register_customer; DROP PROCEDURE IF EXISTS sp_register_vehicle; DROP PROCEDURE IF EXISTS sp_create_appointment; DROP PROCEDURE IF EXISTS sp_create_request; DROP PROCEDURE IF EXISTS sp_complete_request; DROP PROCEDURE IF EXISTS sp_generate_invoice; DROP PROCEDURE IF EXISTS sp_award_bonus;
DELIMITER $$
CREATE PROCEDURE sp_register_customer(IN p_first VARCHAR(50),IN p_last VARCHAR(50),IN p_phone VARCHAR(15),IN p_email VARCHAR(100),IN p_address VARCHAR(255),IN p_city VARCHAR(50),IN p_state VARCHAR(50),IN p_pincode VARCHAR(10)) BEGIN INSERT INTO CUSTOMER(first_name,last_name,phone,email,address,city,state,pincode) VALUES(p_first,p_last,p_phone,p_email,p_address,p_city,p_state,p_pincode); END$$
CREATE PROCEDURE sp_register_vehicle(IN p_customer INT,IN p_reg VARCHAR(20),IN p_chassis VARCHAR(30),IN p_engine VARCHAR(30),IN p_make VARCHAR(50),IN p_model VARCHAR(50),IN p_variant VARCHAR(50),IN p_year YEAR,IN p_fuel VARCHAR(20),IN p_trans VARCHAR(20),IN p_color VARCHAR(30),IN p_mileage INT) BEGIN IF NOT EXISTS(SELECT 1 FROM CUSTOMER WHERE customer_id=p_customer) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Customer does not exist'; END IF; INSERT INTO VEHICLE(customer_id,registration_number,chassis_number,engine_number,make,model,variant,manufacture_year,fuel_type,transmission,color,current_mileage) VALUES(p_customer,p_reg,p_chassis,p_engine,p_make,p_model,p_variant,p_year,p_fuel,p_trans,p_color,p_mileage); END$$
CREATE PROCEDURE sp_create_appointment(IN p_vehicle INT,IN p_date DATE,IN p_time TIME,IN p_type VARCHAR(50),IN p_mode VARCHAR(20)) BEGIN IF NOT EXISTS(SELECT 1 FROM VEHICLE WHERE vehicle_id=p_vehicle) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Vehicle does not exist'; END IF; INSERT INTO APPOINTMENT(vehicle_id,appointment_date,appointment_time,service_type,booking_mode) VALUES(p_vehicle,p_date,p_time,p_type,p_mode); END$$
CREATE PROCEDURE sp_create_request(IN p_appointment INT,IN p_mechanic INT,IN p_complaint TEXT,IN p_est_date DATE,IN p_est_cost DECIMAL(10,2)) BEGIN IF EXISTS(SELECT 1 FROM SERVICE_REQUEST WHERE appointment_id=p_appointment) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Appointment already has a request'; END IF; INSERT INTO SERVICE_REQUEST(appointment_id,mechanic_id,complaint_description,estimated_completion_date,estimated_cost) VALUES(p_appointment,p_mechanic,p_complaint,p_est_date,p_est_cost); END$$
CREATE PROCEDURE sp_complete_request(IN p_request INT,IN p_actual DECIMAL(10,2),IN p_diagnosis TEXT) BEGIN START TRANSACTION; UPDATE SERVICE_REQUEST SET actual_cost=p_actual,diagnosis=p_diagnosis,service_status='COMPLETED' WHERE request_id=p_request; IF ROW_COUNT()=0 THEN ROLLBACK; SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Request does not exist'; ELSE COMMIT; END IF; END$$
CREATE PROCEDURE sp_generate_invoice(IN p_request INT,IN p_labor DECIMAL(10,2),IN p_tax DECIMAL(10,2),IN p_discount DECIMAL(10,2)) BEGIN INSERT INTO INVOICE(request_id,labor_amount,parts_amount,tax_amount,discount_amount,invoice_date) VALUES(p_request,p_labor,(SELECT COALESCE(SUM(total_cost),0) FROM PART_USAGE WHERE request_id=p_request),p_tax,p_discount,CURDATE()) ON DUPLICATE KEY UPDATE labor_amount=VALUES(labor_amount),parts_amount=VALUES(parts_amount),tax_amount=VALUES(tax_amount),discount_amount=VALUES(discount_amount),total_amount=fn_invoice_total(VALUES(labor_amount),VALUES(parts_amount),VALUES(tax_amount),VALUES(discount_amount)); END$$
CREATE PROCEDURE sp_award_bonus(IN p_request INT) BEGIN UPDATE MECHANIC m JOIN SERVICE_REQUEST r ON r.mechanic_id=m.mechanic_id LEFT JOIN FEEDBACK f ON f.request_id=r.request_id SET m.total_bonus=m.total_bonus+IF(f.rating=5,100,0) WHERE r.request_id=p_request AND r.service_status='COMPLETED'; END$$
DELIMITER ;


-- ===== triggers.sql =====
USE vscms;
DROP TRIGGER IF EXISTS trg_part_usage_before_insert; DROP TRIGGER IF EXISTS trg_part_usage_after_insert; DROP TRIGGER IF EXISTS trg_request_completed_bonus; DROP TRIGGER IF EXISTS trg_invoice_total;
DELIMITER $$
CREATE TRIGGER trg_part_usage_before_insert BEFORE INSERT ON PART_USAGE FOR EACH ROW
BEGIN DECLARE price DECIMAL(10,2); DECLARE stock INT; SELECT unit_price,stock_quantity INTO price,stock FROM SPARE_PART WHERE part_id=NEW.part_id FOR UPDATE; IF stock < NEW.quantity_used THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Insufficient spare-part stock'; END IF; SET NEW.total_cost=NEW.quantity_used*price; END$$
CREATE TRIGGER trg_part_usage_after_insert AFTER INSERT ON PART_USAGE FOR EACH ROW UPDATE SPARE_PART SET stock_quantity=stock_quantity-NEW.quantity_used WHERE part_id=NEW.part_id$$
CREATE TRIGGER trg_request_completed_bonus AFTER UPDATE ON SERVICE_REQUEST FOR EACH ROW
BEGIN IF NEW.service_status='COMPLETED' AND OLD.service_status<>'COMPLETED' THEN UPDATE MECHANIC SET total_bonus=total_bonus+fn_mechanic_bonus(NEW.actual_cost,NULL) WHERE mechanic_id=NEW.mechanic_id; END IF; END$$
CREATE TRIGGER trg_invoice_total BEFORE INSERT ON INVOICE FOR EACH ROW SET NEW.total_amount=fn_invoice_total(NEW.labor_amount,NEW.parts_amount,NEW.tax_amount,NEW.discount_amount)$$
DELIMITER ;
-- Policy: completed request earns 100; actual cost >= 5000 earns 250 extra; a 5-star feedback earns 100 extra when awarded by procedure.


-- ===== views.sql =====
USE vscms;
CREATE OR REPLACE VIEW vw_customer_vehicle_history AS SELECT c.customer_id,CONCAT(c.first_name,' ',c.last_name) customer_name,v.registration_number,v.make,v.model,sr.request_id,sr.service_status FROM CUSTOMER c JOIN VEHICLE v ON v.customer_id=c.customer_id JOIN APPOINTMENT a ON a.vehicle_id=v.vehicle_id JOIN SERVICE_REQUEST sr ON sr.appointment_id=a.appointment_id;
CREATE OR REPLACE VIEW vw_service_request_details AS SELECT sr.request_id,CONCAT(c.first_name,' ',c.last_name) customer_name,v.registration_number,CONCAT(m.first_name,' ',m.last_name) mechanic_name,sr.complaint_description complaint,sr.service_status,sr.estimated_cost,sr.actual_cost FROM SERVICE_REQUEST sr JOIN APPOINTMENT a ON a.appointment_id=sr.appointment_id JOIN VEHICLE v ON v.vehicle_id=a.vehicle_id JOIN CUSTOMER c ON c.customer_id=v.customer_id JOIN MECHANIC m ON m.mechanic_id=sr.mechanic_id;
CREATE OR REPLACE VIEW vw_inventory_status AS SELECT p.part_id,p.part_name,s.supplier_name,p.stock_quantity stock,p.reorder_level,fn_stock_status(p.stock_quantity,p.reorder_level) stock_status FROM SPARE_PART p JOIN SUPPLIER s ON s.supplier_id=p.supplier_id;
CREATE OR REPLACE VIEW vw_mechanic_performance AS SELECT m.mechanic_id,CONCAT(m.first_name,' ',m.last_name) mechanic,COUNT(CASE WHEN sr.service_status='COMPLETED' THEN 1 END) completed_requests,COALESCE(SUM(CASE WHEN sr.service_status='COMPLETED' THEN sr.actual_cost ELSE 0 END),0) total_revenue_handled,m.total_bonus FROM MECHANIC m LEFT JOIN SERVICE_REQUEST sr ON sr.mechanic_id=m.mechanic_id GROUP BY m.mechanic_id,m.first_name,m.last_name,m.total_bonus;
CREATE OR REPLACE VIEW vw_invoice_summary AS SELECT i.invoice_id,CONCAT(c.first_name,' ',c.last_name) customer_name,v.registration_number,i.labor_amount,i.parts_amount,i.tax_amount,i.discount_amount,i.total_amount,i.payment_status FROM INVOICE i JOIN SERVICE_REQUEST sr ON sr.request_id=i.request_id JOIN APPOINTMENT a ON a.appointment_id=sr.appointment_id JOIN VEHICLE v ON v.vehicle_id=a.vehicle_id JOIN CUSTOMER c ON c.customer_id=v.customer_id;


-- ===== NON-DESTRUCTIVE VALIDATION QUERIES (manual) =====
-- SHOW TABLES;
-- SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema='vscms' AND table_type='BASE TABLE'; -- expect 11
-- SELECT * FROM vw_customer_vehicle_history LIMIT 10;
-- SELECT * FROM vw_service_request_details LIMIT 10;
-- SELECT * FROM vw_inventory_status;
-- SELECT * FROM vw_mechanic_performance;
-- SELECT * FROM vw_invoice_summary;
-- SELECT fn_invoice_total(1000,500,135,50), fn_mechanic_bonus(6000,5), fn_stock_status(0,5);
-- SHOW PROCEDURE STATUS WHERE Db='vscms';
-- SHOW FUNCTION STATUS WHERE Db='vscms';
-- SHOW TRIGGERS FROM vscms;
-- SHOW INDEX FROM VEHICLE;
-- SELECT COUNT(*) FROM CUSTOMER; -- expect 20
-- SELECT COUNT(*) FROM VEHICLE; -- expect 25
-- SELECT COUNT(*) FROM SERVICE_REQUEST; -- expect 30
-- Foreign-key enforcement test (leave commented; would fail intentionally):
-- INSERT INTO VEHICLE(customer_id,registration_number,chassis_number,engine_number,make,model) VALUES(999,'TEST','TESTCH','TESTEN','X','Y');
