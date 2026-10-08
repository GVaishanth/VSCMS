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
