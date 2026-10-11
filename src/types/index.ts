/**
 * Domain record shapes retained from VSCMS, plus joined/derived fields exposed
 * to the UI. Records are persisted locally in IndexedDB; column names stay
 * snake_case for compatibility with existing forms and workflows.
 */

/* ---------------- CUSTOMER ---------------- */
export interface Customer {
  customer_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  created_at: string;
  customer_name?: string;
  vehicle_count?: number;
  request_count?: number;
  feedback_count?: number;
  avg_rating?: number;
  total_billed?: number;
}

export interface CustomerDetail extends Customer {
  totals: { total_billed: number; total_paid: number; outstanding: number; avg_rating: number };
  vehicles: Vehicle[];
  appointments: Appointment[];
  requests: ServiceRequestRow[];
  invoices: InvoiceRow[];
  feedback: FeedbackRow[];
}

export interface CustomerInput {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

/* ---------------- MECHANIC ---------------- */
export interface Mechanic {
  mechanic_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  specialization: string | null;
  experience_years: number;
  joining_date: string;
  salary: number;
  total_bonus: number;
  availability_status: AvailabilityStatus;
  mechanic_name?: string;
  active_jobs?: number;
  completed_jobs?: number;
  total_jobs?: number;
  revenue_handled?: number;
  open_estimated_value?: number;
  avg_rating?: number;
  feedback_count?: number;
  last_assigned_at?: string | null;
}

export interface MechanicDetail extends Mechanic {
  requests: MechanicRequestRow[];
  performance: MechanicPerformance | null;
}

export interface MechanicRequestRow {
  request_id: number;
  service_status: RequestStatus;
  created_at: string;
  estimated_cost: number;
  actual_cost: number | null;
  estimated_completion_date: string | null;
  complaint_description: string;
  appointment_date: string;
  service_type: string;
  registration_number: string;
  make: string;
  model: string;
  customer_name: string;
  rating: number | null;
  invoice_total: number | null;
  payment_status: PaymentStatus | null;
}

export interface MechanicPerformance {
  mechanic_id: number;
  mechanic: string;
  completed_requests: number;
  total_revenue_handled: number;
  total_bonus: number;
  specialization?: string | null;
  experience_years?: number;
  availability_status?: AvailabilityStatus;
  active_jobs?: number;
  assigned_requests?: number;
}

export interface MechanicInput {
  firstName: string;
  lastName: string;
  phone: string;
  specialization?: string;
  experienceYears?: number;
  joiningDate: string;
  salary: number;
  availabilityStatus?: AvailabilityStatus;
}

/* ---------------- SUPPLIER ---------------- */
export interface Supplier {
  supplier_id: number;
  supplier_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  gst_number: string | null;
  parts_supplied?: number;
  units_held?: number;
  stock_value?: number;
  attention_parts?: number;
}

export interface SupplierDetail extends Supplier {
  parts: SparePartRow[];
}

export interface SupplierInput {
  supplierName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  gstNumber?: string;
}

/* ---------------- VEHICLE ---------------- */
export interface Vehicle {
  vehicle_id: number;
  customer_id: number;
  registration_number: string;
  chassis_number: string;
  engine_number: string;
  make: string;
  model: string;
  variant: string | null;
  manufacture_year: number | null;
  fuel_type: string | null;
  transmission: string | null;
  color: string | null;
  current_mileage: number | null;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_city?: string;
  appointment_count?: number;
  request_count?: number;
  last_visit_date?: string | null;
  latest_request_status?: RequestStatus | null;
  /** Derived for display only — the schema has no vehicle status column. */
  service_state?: ServiceState;
}

export type ServiceState = 'IN SERVICE' | 'SERVICED' | 'CANCELLED' | 'IDLE';

export interface VehicleDetail extends Vehicle {
  customer: Customer | null;
  appointments: Appointment[];
  requests: VehicleRequestRow[];
  invoices: InvoiceRow[];
  feedback: FeedbackRow[];
  totals: { total_billed: number; total_actual_cost: number; total_requests: number };
}

export interface VehicleRequestRow {
  request_id: number;
  service_status: RequestStatus;
  created_at: string;
  complaint_description: string;
  diagnosis: string | null;
  estimated_cost: number;
  actual_cost: number | null;
  estimated_completion_date: string | null;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  mechanic_name: string;
  specialization: string | null;
  labor_total: number;
  parts_total: number;
  service_count: number;
  part_count: number;
  invoice_id: number | null;
  invoice_total: number | null;
  payment_status: PaymentStatus | null;
  rating: number | null;
}

export interface VehicleInput {
  customerId: number;
  registrationNumber: string;
  chassisNumber: string;
  engineNumber: string;
  make: string;
  model: string;
  variant?: string;
  manufactureYear?: number;
  fuelType?: string;
  transmission?: string;
  color?: string;
  currentMileage?: number;
}

/* ---------------- APPOINTMENT ---------------- */
export interface Appointment {
  appointment_id: number;
  vehicle_id: number;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  booking_mode: BookingMode;
  status: AppointmentStatus;
  registration_number?: string;
  make?: string;
  model?: string;
  manufacture_year?: number | null;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  request_id?: number | null;
  service_status?: RequestStatus | null;
  mechanic_id?: number | null;
  mechanic_name?: string | null;
}

export interface AppointmentDetail extends Appointment {
  request: Record<string, unknown> | null;
  history: Appointment[];
}

export interface AppointmentInput {
  vehicleId: number;
  appointmentDate: string;
  appointmentTime: string;
  serviceType: string;
  bookingMode?: BookingMode;
  status?: AppointmentStatus;
}

/* ---------------- SERVICE_REQUEST ---------------- */
export interface ServiceRequestRow {
  request_id: number;
  appointment_id: number;
  mechanic_id: number;
  complaint_description: string;
  diagnosis: string | null;
  service_status: RequestStatus;
  estimated_completion_date: string | null;
  estimated_cost: number;
  actual_cost: number | null;
  created_at: string;
  appointment_date?: string;
  appointment_time?: string;
  service_type?: string;
  appointment_status?: AppointmentStatus;
  booking_mode?: BookingMode;
  vehicle_id?: number;
  registration_number?: string;
  make?: string;
  model?: string;
  manufacture_year?: number | null;
  current_mileage?: number | null;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_city?: string;
  mechanic_name?: string;
  specialization?: string | null;
  availability_status?: AvailabilityStatus;
  service_count?: number;
  labor_total?: number;
  part_count?: number;
  parts_total?: number;
  invoice_id?: number | null;
  invoice_total?: number | null;
  payment_status?: PaymentStatus | null;
  feedback_id?: number | null;
  rating?: number | null;
}

export interface WorkOrder extends ServiceRequestRow {
  appointment: Record<string, unknown> | null;
  customer: Customer | null;
  mechanic: (Mechanic & { mechanic_name: string }) | null;
  services: ServiceLine[];
  parts: PartUsageRow[];
  invoice: (Invoice & { computed_total: number }) | null;
  feedback: FeedbackRow | null;
  history: Record<string, unknown>[];
  computed: {
    labor_total: number;
    parts_total: number;
    service_count: number;
    part_count: number;
    has_invoice: boolean;
    has_feedback: boolean;
  };
}

export interface RequestInput {
  appointmentId: number;
  mechanicId: number;
  complaintDescription: string;
  estimatedCompletionDate?: string;
  estimatedCost?: number;
}

/* ---------------- SERVICE (labour line item) ---------------- */
export interface ServiceLine {
  service_id: number;
  request_id: number;
  service_name: string;
  description: string | null;
  labor_charge: number;
  estimated_duration: number | null;
  remarks: string | null;
  service_status?: RequestStatus;
  appointment_date?: string;
  service_type?: string;
  registration_number?: string;
  make?: string;
  model?: string;
  customer_name?: string;
  mechanic_name?: string;
}

export interface ServiceInput {
  requestId: number;
  serviceName: string;
  description?: string;
  laborCharge?: number;
  estimatedDuration?: number;
  remarks?: string;
}

export interface ServiceCatalogueEntry {
  service_name: string;
  times_used: number;
  avg_labor_charge: number;
  min_labor_charge: number;
  max_labor_charge: number;
  avg_duration: number;
  sample_description: string | null;
  total_labor: number;
}

/* ---------------- SPARE_PART ---------------- */
export interface SparePartRow {
  part_id: number;
  supplier_id: number;
  part_name: string;
  category: string | null;
  manufacturer: string | null;
  unit_price: number;
  stock_quantity: number;
  reorder_level: number;
  warranty_months: number | null;
  supplier_name?: string;
  supplier_contact?: string | null;
  supplier_phone?: string | null;
  /** fn_stock_status(stock_quantity, reorder_level) */
  stock_status?: StockStatus;
  stock_value?: number;
  usage_count?: number;
  quantity_used_total?: number;
  consumed_value?: number;
  units_used?: number;
}

export interface SparePartDetail extends SparePartRow {
  supplier: Supplier | null;
  usages: PartUsageRow[];
}

export interface PartInput {
  supplierId: number;
  partName: string;
  category?: string;
  manufacturer?: string;
  unitPrice: number;
  stockQuantity?: number;
  reorderLevel?: number;
  warrantyMonths?: number;
}

/* ---------------- PART_USAGE ---------------- */
export interface PartUsageRow {
  usage_id: number;
  request_id: number;
  part_id: number;
  supplier_id?: number;
  quantity_used: number;
  total_cost: number;
  part_name?: string;
  category?: string | null;
  manufacturer?: string | null;
  unit_price?: number;
  stock_quantity?: number;
  warranty_months?: number | null;
  supplier_name?: string;
  service_status?: RequestStatus;
  appointment_date?: string;
  registration_number?: string;
  customer_name?: string;
  mechanic_name?: string;
}

export interface PartUsageResult {
  usage_id: number;
  request_id: number;
  part_id: number;
  part_name: string;
  quantity_used: number;
  total_cost: number;
  unit_price: number;
  stock_before: number;
  stock_after: number;
  stock_status: StockStatus;
  computed_by: string;
}

/* ---------------- INVOICE ---------------- */
export interface Invoice {
  invoice_id: number;
  request_id: number;
  labor_amount: number;
  parts_amount: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  invoice_date: string;
  payment_status: PaymentStatus;
  computed_total?: number;
  labor_lines_total?: number;
  part_lines_total?: number;
}

export interface InvoiceRow extends Invoice {
  service_status?: RequestStatus;
  actual_cost?: number | null;
  estimated_cost?: number;
  appointment_date?: string;
  service_type?: string;
  vehicle_id?: number;
  registration_number?: string;
  make?: string;
  model?: string;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_city?: string;
  mechanic_name?: string;
  service_lines?: number;
  part_lines?: number;
}

export interface InvoiceDetail extends Invoice {
  verification: {
    formula: string;
    stored_total: number;
    database_computed_total: number;
    matches: boolean;
    effective_tax_rate: number;
  };
  context: InvoiceContext | null;
  labour_lines: ServiceLine[];
  part_lines: PartUsageRow[];
  feedback: FeedbackRow | null;
}

export interface InvoiceContext {
  request_id: number;
  service_status: RequestStatus;
  created_at: string;
  complaint_description: string;
  diagnosis: string | null;
  estimated_cost: number;
  actual_cost: number | null;
  estimated_completion_date: string | null;
  appointment_id: number;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  booking_mode: BookingMode;
  vehicle_id: number;
  registration_number: string;
  make: string;
  model: string;
  variant: string | null;
  manufacture_year: number | null;
  current_mileage: number | null;
  color: string | null;
  fuel_type: string | null;
  transmission: string | null;
  customer_id: number;
  first_name: string;
  last_name: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string | null;
  customer_city: string | null;
  customer_state: string | null;
  customer_pincode: string | null;
  mechanic_id: number;
  mechanic_name: string;
  specialization: string | null;
}

/* ---------------- FEEDBACK ---------------- */
export interface FeedbackRow {
  feedback_id: number;
  request_id: number;
  customer_id: number;
  rating: number;
  comments: string | null;
  feedback_date: string;
  customer_name?: string;
  customer_phone?: string;
  vehicle_id?: number;
  registration_number?: string;
  make?: string;
  model?: string;
  service_status?: RequestStatus;
  appointment_date?: string;
  service_type?: string;
  mechanic_id?: number;
  mechanic_name?: string;
  specialization?: string | null;
  mechanic_bonus?: number | null;
}

export interface FeedbackInput {
  requestId: number;
  customerId: number;
  rating: number;
  comments?: string;
  feedbackDate?: string;
}

/* ---------------- vocabularies ---------------- */
export type AppointmentStatus = 'BOOKED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type BookingMode = 'ONLINE' | 'PHONE' | 'WALK_IN';
export type RequestStatus = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';
export type AvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'ON_LEAVE';
export type StockStatus = 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK';

/* ---------------- API envelopes ---------------- */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface Page<T> {
  data: T[];
  pagination: Pagination;
}

export interface ApiErrorBody {
  message: string;
  code: string;
  status: number;
  details?: Record<string, unknown>;
}

export interface DbStatus {
  connected: boolean;
  database: string;
  host: string;
  port: number;
  serverVersion: string | null;
  latencyMs: number | null;
  checkedAt: string;
  error: string | null;
  errorCode: string | null;
  recordCount?: number;
  requestCount?: number;
  openRequestCount?: number;
}

export interface HealthResponse {
  status: 'ok' | 'offline';
  database: DbStatus;
  server: { time: string; nodeEnv: string; version: string };
}

export interface MetaResponse {
  database: {
    name: string;
    host: string;
    port: number;
    connected: boolean;
    server_version: string | null;
    latency_ms: number | null;
    checked_at: string;
    error: string | null;
  };
  schema: {
    tables: number;
    views: number;
    procedures: number;
    functions: number;
    triggers: number;
  } | null;
  vocabularies: {
    appointmentStatuses: AppointmentStatus[];
    bookingModes: BookingMode[];
    requestStatuses: RequestStatus[];
    paymentStatuses: PaymentStatus[];
    availabilityStatuses: AvailabilityStatus[];
    fuelTypes: string[];
    transmissions: string[];
    serviceTypes: string[];
    partCategories: string[];
  };
}

export interface Lookups {
  customers: { customer_id: number; label: string; phone: string; city: string | null }[];
  vehicles: {
    vehicle_id: number;
    label: string;
    make: string;
    model: string;
    customer_id: number;
    customer_name: string;
  }[];
  mechanics: {
    mechanic_id: number;
    label: string;
    specialization: string | null;
    availability_status: AvailabilityStatus;
  }[];
  suppliers: { supplier_id: number; label: string; city: string | null; gst_number: string | null }[];
  parts: {
    part_id: number;
    label: string;
    category: string | null;
    unit_price: number;
    stock_quantity: number;
    reorder_level: number;
    stock_status: StockStatus;
    supplier_name: string;
  }[];
  appointments: {
    appointment_id: number;
    appointment_date: string;
    appointment_time: string;
    service_type: string;
    status: AppointmentStatus;
    label: string;
    customer_name: string;
  }[];
  serviceTypes: { label: string; uses: number }[];
}

/* ---------------- dashboard ---------------- */
export interface DashboardKpis {
  total_customers: number;
  total_vehicles: number;
  work_orders_in_range: number;
  appointments_today: number;
  appointments_in_range: number;
  active_requests: number;
  open_requests: number;
  in_progress_requests: number;
  on_hold_requests: number;
  completed_requests: number;
  cancelled_requests: number;
  completion_rate: number;
  low_stock_parts: number;
  out_of_stock_parts: number;
  needs_reorder_parts: number;
  total_parts: number;
  units_on_hand: number;
  inventory_value: number;
  total_revenue: number;
  collected_revenue: number;
  outstanding_revenue: number;
  labor_revenue: number;
  parts_revenue: number;
  tax_collected: number;
  discounts_given: number;
  invoice_count: number;
  unpaid_invoices: number;
  avg_invoice: number;
  avg_rating: number;
  feedback_count: number;
  five_star_feedback: number;
  critical_feedback: number;
  mechanics_available: number;
  mechanics_busy: number;
  mechanics_total: number;
  bonus_paid: number;
  parts_consumed_value: number;
  part_movements: number;
}

export interface DashboardBundle {
  summary: {
    as_of: string;
    range: string;
    window: { from: string | null; to: string | null };
    kpis: DashboardKpis;
    totals: Record<string, number>;
  };
  todays_appointments: {
    date: string;
    total: number;
    appointments: Appointment[];
    upcoming: (Appointment & { days_away: number })[];
  };
  request_status: {
    service_status: RequestStatus;
    total: number;
    estimated_value: number;
    actual_value: number;
  }[];
  mechanic_workload: (Mechanic & { active_jobs: number; completed_jobs: number })[];
  inventory_alerts: (SparePartRow & { shortfall: number })[];
  recent_activity: ServiceRequestRow[];
  revenue_trend: {
    month: string;
    invoices: number;
    revenue: number;
    labor: number;
    parts: number;
    collected: number;
  }[];
  rating_distribution: { rating: number; count: number }[];
  appointment_trend: { day: string; appointments: number; cancelled: number; with_request: number }[];
}

/* ---------------- inventory summary ---------------- */
export interface InventorySummary {
  total_parts: number;
  categories: number;
  suppliers: number;
  units_on_hand: number;
  inventory_value: number;
  avg_unit_price: number;
  in_stock: number;
  low_stock: number;
  out_of_stock: number;
  needs_reorder: number;
  usage_rows: number;
  units_consumed: number;
  consumed_value: number;
}

export interface InvoiceSummary {
  invoices: number;
  revenue: number;
  labor: number;
  parts: number;
  tax: number;
  discounts: number;
  avg_invoice: number;
  largest_invoice: number;
  collected: number;
  outstanding: number;
  by_status: { payment_status: PaymentStatus; invoices: number; amount: number }[];
  monthly: { month: string; invoices: number; revenue: number; labor: number; parts: number }[];
}

export interface FeedbackSummary {
  total: number;
  avg_rating: number;
  min_rating: number;
  max_rating: number;
  five_star: number;
  critical: number;
  awaiting_feedback: number;
  distribution: { rating: number; count: number; share: number }[];
}

/* ---------------- locally calculated reports ---------------- */
export interface CustomerVehicleHistoryRow {
  customer_id: number;
  customer_name: string;
  registration_number: string;
  make: string;
  model: string;
  request_id: number;
  service_status: RequestStatus;
}

export interface ServiceRequestDetailsRow {
  request_id: number;
  customer_name: string;
  registration_number: string;
  mechanic_name: string;
  complaint: string;
  service_status: RequestStatus;
  estimated_cost: number;
  actual_cost: number | null;
}

export interface InventoryStatusRow {
  part_id: number;
  part_name: string;
  supplier_name: string;
  stock: number;
  reorder_level: number;
  stock_status: StockStatus;
}

export interface InvoiceSummaryRow {
  invoice_id: number;
  customer_name: string;
  registration_number: string;
  labor_amount: number;
  parts_amount: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_status: PaymentStatus;
}

export interface ViewResult<T> {
  rows: T[];
  total: number;
  totals?: Record<string, number>;
}

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}
