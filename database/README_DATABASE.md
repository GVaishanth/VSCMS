# VSCMS Database
MySQL 8.x schema for the Vehicle Service Center Management System.

## Run in Workbench
Open `database.sql` in MySQL Workbench and execute the complete script (lightning button). Refresh Schemas and expand `vscms`. It creates exactly 11 tables, five views, seven procedures, three functions, triggers, indexes, and sample data. The component files are also provided for inspection or separate execution.

## Tables and relationships
CUSTOMER owns VEHICLE; VEHICLE has APPOINTMENT; each APPOINTMENT has at most one SERVICE_REQUEST. MECHANIC handles requests; requests contain SERVICE rows and use SPARE_PART through PART_USAGE only. SUPPLIER supplies parts. Requests have at most one INVOICE and optional FEEDBACK; customers can submit multiple feedback records. Parent deletion is RESTRICTed to preserve history; key updates CASCADE.

## Database objects
Views: `vw_customer_vehicle_history`, `vw_service_request_details`, `vw_inventory_status`, `vw_mechanic_performance`, `vw_invoice_summary`.
Procedures: `sp_register_customer`, `sp_register_vehicle`, `sp_create_appointment`, `sp_create_request`, `sp_complete_request`, `sp_generate_invoice`, `sp_award_bonus`.
Functions: `fn_invoice_total`, `fn_mechanic_bonus`, `fn_stock_status`.
Triggers calculate part cost and deduct stock, reject insufficient stock, award completion bonuses, and calculate invoice totals. Bonus policy: 100 for completion, 250 more for actual cost >= 5000, and 100 more for a 5-star feedback awarded by the bonus procedure.

## Verification
At the end of `database.sql`, uncomment test queries selectively. Useful checks include `SHOW TABLES`, `SELECT * FROM vw_invoice_summary`, `SELECT fn_stock_status(0,5)`, `SHOW PROCEDURE STATUS WHERE Db='vscms'`, `SHOW FUNCTION STATUS WHERE Db='vscms'`, `SHOW TRIGGERS`, and `SHOW INDEX FROM VEHICLE`.
