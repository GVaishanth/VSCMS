import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import test from 'node:test';
import reviewDemoBackup from '../src/data/review-demo-backup.json';
import reviewDemoV3Distribution from '../src/data/review-demo-v3-distribution.json';
import { api } from '../src/services/api';
import { exportSnapshot, importSnapshot, readAll, storageStatus, writeSystemSetting } from '../src/services/localDb';
import { initializeReviewDemoData } from '../src/services/seedData';

test('browser-local workflows migrate the 200-work-order baseline, persist, and restore records', async () => {
  const legacyRecords: Record<string, unknown[]> = Object.fromEntries(
    Object.keys(reviewDemoBackup.records).map((name) => [name, []]),
  );
  legacyRecords.customers = [{ customer_id: 999, first_name: 'Legacy', last_name: 'Record' }];
  legacyRecords.requests = [{ request_id: 999, appointment_id: 999, service_status: 'OPEN' }];
  await importSnapshot({ format: 'vscms-local-backup', version: 1, records: legacyRecords });
  await writeSystemSetting('review-baseline-version', 'work-orders-200-open-20-v2');
  assert.equal((await storageStatus()).count, 2);

  const seeded = await initializeReviewDemoData();
  assert.equal(seeded, true);
  const seededStatus = await storageStatus();
  assert.equal(seededStatus.connected, true);
  assert.equal(seededStatus.count, 933);
  assert.equal(await initializeReviewDemoData(), false);
  assert.equal((await storageStatus()).count, 933);
  const seededRequests = await readAll('requests');
  assert.equal(seededRequests.length, 200);
  assert.equal(seededRequests.filter((row) => row.service_status === 'OPEN').length, 20);
  assert.equal(seededRequests.some((row) => row.request_id === 999), false);
  assert.deepEqual(
    Object.fromEntries(['COMPLETED', 'IN_PROGRESS', 'ON_HOLD', 'CANCELLED', 'OPEN'].map((status) => [
      status,
      seededRequests.filter((row) => row.service_status === status).length,
    ])),
    { COMPLETED: 120, IN_PROGRESS: 25, ON_HOLD: 20, CANCELLED: 15, OPEN: 20 },
  );
  const requestCountsByMechanic = new Map<number, number>();
  for (const request of seededRequests) {
    const id = Number(request.mechanic_id);
    requestCountsByMechanic.set(id, (requestCountsByMechanic.get(id) ?? 0) + 1);
  }
  const mechanicWorkloads = reviewDemoBackup.records.mechanics.map((mechanic) => requestCountsByMechanic.get(mechanic.mechanic_id) ?? 0);
  assert.equal(Math.max(...mechanicWorkloads) - Math.min(...mechanicWorkloads) >= 15, true);
  const busyMechanicIds = new Set(reviewDemoBackup.records.mechanics
    .filter((mechanic) => mechanic.availability_status === 'BUSY')
    .map((mechanic) => mechanic.mechanic_id));
  const activeSeedRequests = seededRequests.filter((request) => ['OPEN', 'IN_PROGRESS', 'ON_HOLD'].includes(request.service_status));
  const activeCountsByMechanic = new Map<number, number>();
  for (const request of activeSeedRequests) {
    const id = Number(request.mechanic_id);
    activeCountsByMechanic.set(id, (activeCountsByMechanic.get(id) ?? 0) + 1);
  }
  assert.equal(busyMechanicIds.size, 7);
  assert.equal(activeSeedRequests.every((request) => busyMechanicIds.has(Number(request.mechanic_id))), true);
  assert.equal([...busyMechanicIds].every((id) => (activeCountsByMechanic.get(id) ?? 0) > 0), true);
  const activeWorkloads = [...busyMechanicIds].map((id) => activeCountsByMechanic.get(id) ?? 0);
  assert.equal(Math.max(...activeWorkloads) - Math.min(...activeWorkloads) >= 4, true);
  const completedCountsByMechanic = new Map<number, number>();
  for (const request of seededRequests.filter((row) => row.service_status === 'COMPLETED')) {
    const id = Number(request.mechanic_id);
    completedCountsByMechanic.set(id, (completedCountsByMechanic.get(id) ?? 0) + 1);
  }
  const completedWorkloads = reviewDemoBackup.records.mechanics.map((mechanic) => completedCountsByMechanic.get(mechanic.mechanic_id) ?? 0);
  assert.equal(Math.max(...completedWorkloads) - Math.min(...completedWorkloads) >= 5, true);
  const serviceTypeCounts = Object.values(reviewDemoBackup.records.appointments.reduce<Record<string, number>>((counts, appointment) => {
    counts[appointment.service_type] = (counts[appointment.service_type] ?? 0) + 1;
    return counts;
  }, {}));
  assert.equal(new Set(serviceTypeCounts).size, 5);
  assert.equal(Math.max(...serviceTypeCounts) - Math.min(...serviceTypeCounts) >= 20, true);
  const bookingModeCounts = Object.values(reviewDemoBackup.records.appointments.reduce<Record<string, number>>((counts, appointment) => {
    counts[appointment.booking_mode] = (counts[appointment.booking_mode] ?? 0) + 1;
    return counts;
  }, {}));
  assert.equal(new Set(bookingModeCounts).size, 3);
  assert.equal(Math.max(...bookingModeCounts) - Math.min(...bookingModeCounts) >= 10, true);
  const feedbackRatings = new Map(reviewDemoBackup.records.feedback.map((item) => [item.request_id, Number(item.rating)]));
  for (const mechanic of reviewDemoBackup.records.mechanics) {
    const expectedBonus = seededRequests
      .filter((request) => request.service_status === 'COMPLETED' && Number(request.mechanic_id) === mechanic.mechanic_id)
      .reduce((total, request) => total
        + 100
        + (Number(request.actual_cost ?? 0) >= 5000 ? 250 : 0)
        + (feedbackRatings.get(request.request_id) === 5 ? 100 : 0), 0);
    assert.equal(Number(mechanic.total_bonus), expectedBonus);
  }
  assert.equal(Object.values(reviewDemoBackup.records).reduce((total, rows) => total + rows.length, 0), 933);
  const health = await api.health();
  assert.equal(health.database.requestCount, 200);
  assert.equal(health.database.openRequestCount, 20);
  assert.equal(health.database.recordCount, 933);
  const requestPage = await api.requests.list({ limit: 15 });
  assert.equal(requestPage.pagination.total, 200);
  const activeRequests = await api.requests.list({ status: 'ACTIVE', limit: 100 });
  assert.equal(activeRequests.data.every((row) => ['OPEN', 'IN_PROGRESS', 'ON_HOLD'].includes(row.service_status)), true);
  assert.equal(activeRequests.pagination.total, 65);
  const attentionParts = await api.inventory.list({ stockStatus: 'ATTENTION', limit: 100 });
  assert.equal(attentionParts.data.length, 5);
  assert.equal(attentionParts.data.every((part) => ['LOW STOCK', 'OUT OF STOCK'].includes(String(part.stock_status))), true);
  const lowStockParts = await api.inventory.list({ stockStatus: 'LOW STOCK', limit: 100 });
  assert.equal(lowStockParts.pagination.total, 4);
  const ascendingCustomers = await api.customers.list({ sort: 'customer_id', order: 'ASC', limit: 5 });
  const descendingCustomers = await api.customers.list({ sort: 'customer_id', order: 'DESC', limit: 5 });
  assert.deepEqual(ascendingCustomers.data.map((row) => row.customer_id), [1, 2, 3, 4, 5]);
  assert.deepEqual(descendingCustomers.data.map((row) => row.customer_id), [25, 24, 23, 22, 21]);
  const todayDashboard = await api.dashboard({ range: 'today' });
  const weekDashboard = await api.dashboard({ range: '7d' });
  const monthDashboard = await api.dashboard({ range: '30d' });
  const baselineDashboard = await api.dashboard({ range: 'all' });
  const appointmentsById = new Map(reviewDemoBackup.records.appointments.map((row) => [row.appointment_id, row]));
  const vehiclesById = new Map(reviewDemoBackup.records.vehicles.map((row) => [row.vehicle_id, row]));
  const requestAppointmentDates = reviewDemoBackup.records.requests
    .map((request) => appointmentsById.get(request.appointment_id)?.appointment_date)
    .filter((date): date is string => Boolean(date))
    .sort();
  assert.equal(requestAppointmentDates[0], '2026-04-11');
  assert.equal(requestAppointmentDates.at(-1), '2026-10-11');
  const isInWindow = (day: string | undefined, window: { from: string | null; to: string | null }) =>
    Boolean(day) && (!window.from || day! >= window.from) && (!window.to || day! <= window.to);
  const expectedRequestsInWindow = (window: { from: string | null; to: string | null }) => reviewDemoBackup.records.requests
    .filter((request) => isInWindow(appointmentsById.get(request.appointment_id)?.appointment_date, window)).length;
  const expectedCustomersInWindow = (window: { from: string | null; to: string | null }) => {
    const ids = new Set<number>();
    for (const appointment of reviewDemoBackup.records.appointments) {
      if (!isInWindow(appointment.appointment_date, window)) continue;
      const vehicle = vehiclesById.get(appointment.vehicle_id);
      if (vehicle) ids.add(vehicle.customer_id);
    }
    return ids.size;
  };
  assert.equal(todayDashboard.summary.totals.requests, expectedRequestsInWindow(todayDashboard.summary.window));
  assert.equal(todayDashboard.summary.kpis.total_customers, expectedCustomersInWindow(todayDashboard.summary.window));
  assert.equal(weekDashboard.summary.totals.requests, expectedRequestsInWindow(weekDashboard.summary.window));
  assert.equal(monthDashboard.summary.totals.requests, expectedRequestsInWindow(monthDashboard.summary.window));
  assert.equal(baselineDashboard.summary.totals.requests, 200);
  assert.equal(baselineDashboard.summary.kpis.work_orders_in_range, 200);
  assert.equal(baselineDashboard.summary.kpis.total_customers, 25);
  assert.equal(baselineDashboard.summary.kpis.open_requests, 20);
  assert.equal(baselineDashboard.request_status.reduce((sum, row) => sum + row.total, 0), 200);
  const windowDashboards = [todayDashboard, weekDashboard, monthDashboard];
  if (todayDashboard.summary.window.from === '2026-10-11') {
    for (const dashboard of windowDashboards) {
      assert.equal(dashboard.summary.kpis.total_revenue > 0, true);
      assert.equal(dashboard.summary.kpis.feedback_count > 0, true);
      assert.equal(dashboard.summary.kpis.avg_rating > 0, true);
      assert.equal(dashboard.revenue_trend.reduce((sum, item) => sum + item.revenue, 0) > 0, true);
    }
  }
  const seededParts = await readAll('parts');
  assert.equal(seededParts.filter((part) => Number(part.stock_quantity) > 0 && Number(part.stock_quantity) <= Number(part.reorder_level)).length, 4);
  assert.equal(seededParts.filter((part) => Number(part.stock_quantity) === 0).length, 1);
  const seededMechanics = await readAll('mechanics');
  assert.deepEqual([...new Set(seededMechanics.map((mechanic) => mechanic.availability_status))].sort(), ['AVAILABLE', 'BUSY', 'ON_LEAVE']);
  const seededRatings = [...new Set(reviewDemoBackup.records.feedback.map((item) => item.rating))].sort();
  assert.deepEqual(seededRatings, [1, 2, 3, 4, 5]);

  // Follow each main register into a joined detail record; catch missing labels
  // and broken relationships before they appear as blank detail fields.
  const vehicleRegister = await api.vehicles.list({ limit: 100 });
  const detailVehicle = await api.vehicles.get(vehicleRegister.data[0].vehicle_id);
  assert.ok(detailVehicle.customer_name && detailVehicle.customer_name !== '—');
  assert.ok(['IN SERVICE', 'SERVICED', 'CANCELLED', 'IDLE'].includes(String(detailVehicle.service_state)));
  assert.equal(detailVehicle.customer?.customer_name, detailVehicle.customer_name);

  const appointmentRegister = await api.appointments.list({ limit: 100 });
  const linkedAppointmentRow = appointmentRegister.data.find((row) => row.request_id != null);
  assert.ok(linkedAppointmentRow);
  const detailAppointment = await api.appointments.get(linkedAppointmentRow!.appointment_id);
  assert.ok(detailAppointment.customer_name && detailAppointment.customer_name !== '—');
  assert.ok(detailAppointment.registration_number);
  assert.equal(detailAppointment.request?.request_id, linkedAppointmentRow!.request_id);
  assert.ok(Array.isArray(detailAppointment.history));

  const serviceRegister = await api.services.list({ limit: 100 });
  const detailService = await api.services.get(serviceRegister.data[0].service_id);
  assert.equal(detailService.request_context?.request_id, detailService.request_id);
  assert.ok(detailService.customer_name && detailService.registration_number);

  const feedbackRegister = await api.feedback.list({ limit: 100 });
  const detailFeedback = await api.feedback.get(feedbackRegister.data[0].feedback_id);
  assert.ok(detailFeedback.customer_name && detailFeedback.customer_name !== '—');
  assert.ok(detailFeedback.registration_number);
  assert.ok(detailFeedback.mechanic_name);

  const invoiceRegister = await api.invoices.list({ limit: 100 });
  const detailInvoice = await api.invoices.get(invoiceRegister.data[0].invoice_id);
  assert.ok(detailInvoice.context?.customer_name && detailInvoice.context.registration_number);
  assert.ok(detailInvoice.verification);

  const customerDetail = await api.customers.get(detailVehicle.customer_id);
  assert.ok(customerDetail.vehicles.some((vehicle) => vehicle.vehicle_id === detailVehicle.vehicle_id));
  const mechanicDetail = await api.mechanics.get(1);
  assert.ok(mechanicDetail.mechanic_name);
  assert.ok(Array.isArray(mechanicDetail.requests));
  const usedPart = (await api.inventory.list({ limit: 100 })).data.find((part) => Number(part.usage_count) > 0);
  assert.ok(usedPart);
  const partDetail = await api.inventory.get(usedPart!.part_id);
  assert.ok(partDetail.supplier_name);
  assert.ok(partDetail.usages.every((usage) => usage.appointment_date && usage.registration_number));
  const supplierDetail = await api.suppliers.get(partDetail.supplier_id);
  assert.ok(supplierDetail.parts.some((part) => part.part_id === partDetail.part_id));

  assert.equal((await api.feedback.awaiting()).length, 20);
  assert.equal((await api.invoices.ungenerated()).filter((invoice) => invoice.service_status === 'COMPLETED').length, 20);
  const seedAppointments = reviewDemoBackup.records.appointments.map((row) => row.appointment_date).sort();
  assert.equal(seedAppointments[0], '2026-04-11');
  assert.equal(seedAppointments.at(-1), '2026-10-16');
  assert.equal(reviewDemoBackup.records.appointments.length - seededRequests.length, 5);

  const emptyRecords = Object.fromEntries(Object.keys(reviewDemoBackup.records).map((name) => [name, []]));
  await importSnapshot({ format: 'vscms-local-backup', version: 1, records: emptyRecords });
  const emptyStatus = await storageStatus();
  assert.equal(emptyStatus.connected, true);
  assert.equal(emptyStatus.count, 0);
  assert.equal(await initializeReviewDemoData(), false);
  assert.equal((await storageStatus()).count, 0);

  const customer = await api.customers.create({
    firstName: 'Asha', lastName: 'Raman', phone: '9000000001', email: 'asha@example.test', city: 'Chennai', state: 'Tamil Nadu',
  });
  assert.equal(await initializeReviewDemoData(), false);
  assert.equal((await api.customers.list({ limit: 100 })).pagination.total, 1);
  await assert.rejects(
    () => api.customers.create({ firstName: 'Duplicate', lastName: 'Customer', phone: '9000000002', email: 'asha@example.test' }),
    /Email is already in use/,
  );

  const vehicle = await api.vehicles.create({
    customerId: customer.customer_id,
    registrationNumber: 'TN01AB1234',
    chassisNumber: 'CHASSIS-001',
    engineNumber: 'ENGINE-001',
    make: 'Maruti',
    model: 'Baleno',
    currentMileage: 42000,
  });
  const appointment = await api.appointments.create({
    vehicleId: vehicle.vehicle_id,
    appointmentDate: '2026-10-11',
    appointmentTime: '10:00',
    serviceType: 'Oil Change',
    bookingMode: 'WALK_IN',
  });
  const mechanic = await api.mechanics.create({
    firstName: 'Ravi', lastName: 'Kumar', phone: '9000000003', specialization: 'Engine',
    experienceYears: 5, joiningDate: '2020-01-01', salary: 28000, availabilityStatus: 'AVAILABLE',
  });
  const request = await api.requests.create({
    appointmentId: appointment.appointment_id,
    mechanicId: mechanic.mechanic_id,
    complaintDescription: 'Routine service',
    estimatedCompletionDate: '2026-10-11',
    estimatedCost: 1800,
  });
  const activeVehicleDetail = await api.vehicles.get(vehicle.vehicle_id);
  assert.equal(activeVehicleDetail.customer_name, 'Asha Raman');
  assert.equal(activeVehicleDetail.service_state, 'IN SERVICE');
  const openDashboard = await api.dashboard({ range: 'all' });
  assert.equal(openDashboard.summary.kpis.open_requests, 1);
  assert.equal(openDashboard.request_status.find((row) => row.service_status === 'OPEN')?.total, 1);
  const supplier = await api.suppliers.create({ supplierName: 'Parts House', city: 'Chennai' });
  const part = await api.inventory.create({
    supplierId: supplier.supplier_id,
    partName: 'Oil Filter',
    unitPrice: 250,
    stockQuantity: 10,
    reorderLevel: 2,
  });

  const issued = await api.partUsage.create({ requestId: request.request_id, partId: part.part_id, quantityUsed: 2 });
  assert.equal(issued.total_cost, 500);
  assert.equal(issued.stock_before, 10);
  assert.equal(issued.stock_after, 8);
  await assert.rejects(
    () => api.partUsage.create({ requestId: request.request_id, partId: part.part_id, quantityUsed: 99 }),
    /Insufficient stock/,
  );
  assert.equal((await api.partUsage.forRequest(request.request_id)).lines, 1);
  assert.equal((await api.inventory.get(part.part_id)).stock_quantity, 8);

  const completion = await api.requests.complete(request.request_id, 1500, 'No further repair required');
  assert.equal(completion.service_status, 'COMPLETED');
  assert.equal((await api.vehicles.get(vehicle.vehicle_id)).service_state, 'SERVICED');
  const invoice = await api.invoices.generate({ requestId: request.request_id, laborAmount: 1500, taxAmount: 100, discountAmount: 0 });
  assert.equal(invoice.parts_amount, 500);
  assert.equal(invoice.total_amount, 2100);

  const report = await api.reports.invoiceSummary();
  assert.equal(report.total, 1);
  assert.equal(report.rows[0].customer_name, 'Asha Raman');
  const dashboard = await api.dashboard({ range: 'all' });
  assert.equal(dashboard.summary.kpis.total_customers, 1);
  assert.equal(dashboard.summary.kpis.total_revenue, 2100);
  assert.equal(dashboard.request_status.find((row) => row.service_status === 'COMPLETED')?.total, 1);
  const revenueMonth = invoice.invoice_date.slice(0, 7);
  assert.equal(dashboard.revenue_trend.find((row) => row.month === revenueMonth)?.revenue, 2100);

  await api.invoices.generate({ requestId: request.request_id, laborAmount: 2500, taxAmount: 100, discountAmount: 0 });
  const updatedDashboard = await api.dashboard({ range: 'all' });
  assert.equal(updatedDashboard.summary.kpis.total_revenue, 3100);
  assert.equal(updatedDashboard.revenue_trend.find((row) => row.month === revenueMonth)?.revenue, 3100);

  const backup = await exportSnapshot();
  await api.customers.create({ firstName: 'Temporary', lastName: 'Record', phone: '9000000004', email: 'temporary@example.test' });
  await importSnapshot(backup);
  assert.equal((await api.customers.list({ limit: 100 })).pagination.total, 1);
  assert.equal((await readAll('partUsage')).length, 1);
  assert.equal((await storageStatus()).count > 0, true);
});

test('v3 distribution migration preserves browser edits and extra records', async () => {
  const legacy = JSON.parse(JSON.stringify(reviewDemoBackup)) as any;
  const oldDistribution = reviewDemoV3Distribution as {
    version: string;
    requestMechanicIds: number[];
    appointmentServiceTypes: string[];
    appointmentBookingModes: string[];
    mechanicBonuses: Record<string, number>;
  };
  assert.equal(oldDistribution.version, 'work-orders-200-open-20-v3');

  for (const request of legacy.records.requests as Array<Record<string, any>>) {
    request.mechanic_id = oldDistribution.requestMechanicIds[Number(request.request_id) - 1];
  }
  for (const appointment of legacy.records.appointments as Array<Record<string, any>>) {
    const id = Number(appointment.appointment_id);
    appointment.service_type = oldDistribution.appointmentServiceTypes[id - 1];
    appointment.booking_mode = oldDistribution.appointmentBookingModes[id - 1];
  }
  for (const mechanic of legacy.records.mechanics as Array<Record<string, any>>) {
    mechanic.total_bonus = oldDistribution.mechanicBonuses[String(mechanic.mechanic_id)];
  }

  const appointmentOne = legacy.records.appointments.find((row: Record<string, any>) => row.appointment_id === 1);
  const newAppointmentOne = reviewDemoBackup.records.appointments.find((row) => row.appointment_id === 1)!;
  const alternateType = ['General Service', 'Oil Change', 'Brake Repair', 'AC Service', 'Wheel Alignment']
    .find((type) => type !== appointmentOne.service_type && type !== newAppointmentOne.service_type)!;
  appointmentOne.service_type = alternateType;
  const appointmentTwo = legacy.records.appointments.find((row: Record<string, any>) => row.appointment_id === 2);
  const newAppointmentTwo = reviewDemoBackup.records.appointments.find((row) => row.appointment_id === 2)!;
  const alternateMode = ['ONLINE', 'PHONE', 'WALK_IN']
    .find((mode) => mode !== appointmentTwo.booking_mode && mode !== newAppointmentTwo.booking_mode)!;
  appointmentTwo.booking_mode = alternateMode;

  const requestOne = legacy.records.requests.find((row: Record<string, any>) => row.request_id === 1);
  const targetRequestOne = reviewDemoBackup.records.requests.find((row) => row.request_id === 1)!;
  const editedMechanicId = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    .find((id) => id !== requestOne.mechanic_id && id !== targetRequestOne.mechanic_id)!;
  requestOne.mechanic_id = editedMechanicId;
  legacy.records.customers.push({ customer_id: 999, first_name: 'Local', last_name: 'Edit' });
  const protectedBonusMechanicId = 10;
  const protectedBonus = 9876;
  legacy.records.mechanics.find((row: Record<string, any>) => row.mechanic_id === protectedBonusMechanicId).total_bonus = protectedBonus;

  await importSnapshot(legacy);
  await writeSystemSetting('review-baseline-version', oldDistribution.version);
  const seededTargetMove = legacy.records.requests.find((request: Record<string, any>) => {
    const id = Number(request.request_id);
    const oldId = oldDistribution.requestMechanicIds[id - 1];
    const nextId = reviewDemoBackup.records.requests.find((row) => row.request_id === id)?.mechanic_id;
    return id !== 1 && oldId !== nextId;
  });
  assert.ok(seededTargetMove);
  const expectedTargetMechanicId = reviewDemoBackup.records.requests
    .find((request) => request.request_id === seededTargetMove.request_id)!.mechanic_id;

  assert.equal(await initializeReviewDemoData(), true);
  assert.equal(await initializeReviewDemoData(), false);
  const migratedRequests = await readAll('requests');
  const migratedAppointments = await readAll('appointments');
  const migratedMechanics = await readAll('mechanics');
  assert.equal(migratedRequests.find((row) => row.request_id === 1)?.mechanic_id, editedMechanicId);
  assert.equal(migratedRequests.find((row) => row.request_id === seededTargetMove.request_id)?.mechanic_id, expectedTargetMechanicId);
  assert.equal(migratedAppointments.find((row) => row.appointment_id === 1)?.service_type, alternateType);
  assert.equal(migratedAppointments.find((row) => row.appointment_id === 2)?.booking_mode, alternateMode);
  assert.equal(migratedAppointments.find((row) => row.appointment_id === 3)?.service_type,
    reviewDemoBackup.records.appointments.find((row) => row.appointment_id === 3)?.service_type);
  assert.equal(migratedAppointments.find((row) => row.appointment_id === 3)?.booking_mode,
    reviewDemoBackup.records.appointments.find((row) => row.appointment_id === 3)?.booking_mode);
  assert.equal(migratedMechanics.find((row) => row.mechanic_id === protectedBonusMechanicId)?.total_bonus, protectedBonus);
  assert.ok((await readAll('customers')).some((row) => row.customer_id === 999));
  assert.equal((await storageStatus()).count, 934);

  const feedbackRatings = new Map((await readAll('feedback')).map((item) => [Number(item.request_id), Number(item.rating)]));
  for (const mechanic of migratedMechanics.filter((row) => Number(row.mechanic_id) !== protectedBonusMechanicId)) {
    const expectedBonus = migratedRequests
      .filter((request) => request.service_status === 'COMPLETED' && Number(request.mechanic_id) === Number(mechanic.mechanic_id))
      .reduce((total, request) => total
        + 100
        + (Number(request.actual_cost ?? 0) >= 5000 ? 250 : 0)
        + (feedbackRatings.get(Number(request.request_id)) === 5 ? 100 : 0), 0);
    assert.equal(Number(mechanic.total_bonus), expectedBonus);
  }
});
