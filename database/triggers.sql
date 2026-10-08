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
