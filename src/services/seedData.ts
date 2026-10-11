import reviewDemoBackup from '../data/review-demo-backup.json';
import reviewDemoV3Distribution from '../data/review-demo-v3-distribution.json';
import {
  importSnapshot,
  readAll,
  readSystemSetting,
  saveRows,
  writeSystemSetting,
} from './localDb';

const SEED_MARKER = 'review-baseline-version';
const SEED_VERSION = 'work-orders-200-open-20-v4';
const PREVIOUS_DISTRIBUTION_VERSION = 'work-orders-200-open-20-v3';
const ACTIVE_STATUSES = new Set(['OPEN', 'IN_PROGRESS', 'ON_HOLD']);

export type ReviewDemoInitializationPhase = 'database' | 'checking' | 'importing' | 'ready';
let initialization: Promise<boolean> | null = null;

type LegacyDistribution = {
  version: string;
  requestMechanicIds: number[];
  appointmentServiceTypes: string[];
  appointmentBookingModes: string[];
  mechanicBonuses: Record<string, number>;
};

const legacyDistribution = reviewDemoV3Distribution as LegacyDistribution;

/**
 * Rebalance the v3 review baseline in place without replacing a browser's data.
 * Only fields that still match the original v3 fixture are migrated; user-edited
 * fields, extra records, and unrelated collections are left alone.
 */
async function migrateV3Distribution(): Promise<void> {
  const fixtureAppointments = new Map(
    reviewDemoBackup.records.appointments.map((appointment) => [Number(appointment.appointment_id), appointment]),
  );
  const fixtureRequests = new Map(
    reviewDemoBackup.records.requests.map((request) => [Number(request.request_id), request]),
  );

  const [appointments, requests, mechanics, feedback] = await Promise.all([
    readAll('appointments'),
    readAll('requests'),
    readAll('mechanics'),
    readAll('feedback'),
  ]);
  const mechanicsById = new Map(mechanics.map((mechanic) => [Number(mechanic.mechanic_id), mechanic]));
  const unchangedAppointmentTypes = new Set<number>();
  const nextAppointments = appointments.map((appointment) => {
    const id = Number(appointment.appointment_id);
    const fixture = fixtureAppointments.get(id);
    const oldType = legacyDistribution.appointmentServiceTypes[id - 1];
    const oldMode = legacyDistribution.appointmentBookingModes[id - 1];
    let changed = false;
    const next = { ...appointment };

    if (fixture && oldType !== undefined && (appointment.service_type === oldType || appointment.service_type === fixture.service_type)) {
      unchangedAppointmentTypes.add(id);
      if (appointment.service_type === oldType && next.service_type !== fixture.service_type) {
        next.service_type = fixture.service_type;
        changed = true;
      }
    }
    if (fixture && oldMode !== undefined && appointment.booking_mode === oldMode && next.booking_mode !== fixture.booking_mode) {
      next.booking_mode = fixture.booking_mode;
      changed = true;
    }
    return changed ? next : appointment;
  });

  const nextRequests = requests.map((request) => {
    const id = Number(request.request_id);
    const appointmentId = Number(request.appointment_id);
    const fixture = fixtureRequests.get(id);
    const appointmentFixture = fixtureAppointments.get(appointmentId);
    const oldMechanicId = legacyDistribution.requestMechanicIds[id - 1];
    const targetMechanic = fixture ? Number(fixture.mechanic_id) : NaN;
    if (
      !fixture ||
      !appointmentFixture ||
      oldMechanicId === undefined ||
      Number(request.mechanic_id) !== Number(oldMechanicId) ||
      request.service_status !== fixture.service_status ||
      !unchangedAppointmentTypes.has(appointmentId)
    ) {
      return request;
    }

    const targetMechanicRecord = mechanicsById.get(targetMechanic);
    if (ACTIVE_STATUSES.has(String(request.service_status)) && targetMechanicRecord?.availability_status !== 'BUSY') {
      return request;
    }
    return Number(request.mechanic_id) === targetMechanic ? request : { ...request, mechanic_id: targetMechanic };
  });

  if (nextAppointments.some((appointment, index) => appointment !== appointments[index])) {
    await saveRows('appointments', nextAppointments);
  }
  if (nextRequests.some((request, index) => request !== requests[index])) {
    await saveRows('requests', nextRequests);
  }

  // Recompute SQL-style completion bonuses only where the mechanic's total still
  // equals the untouched v3 baseline. A user-modified total is preserved.
  const ratingByRequest = new Map(feedback.map((entry) => [Number(entry.request_id), Number(entry.rating)]));
  const computedBonuses = new Map<number, number>(mechanics.map((mechanic) => [Number(mechanic.mechanic_id), 0]));
  for (const request of nextRequests) {
    if (request.service_status !== 'COMPLETED') continue;
    const mechanicId = Number(request.mechanic_id);
    const bonus = 100
      + (Number(request.actual_cost ?? 0) >= 5000 ? 250 : 0)
      + (ratingByRequest.get(Number(request.request_id)) === 5 ? 100 : 0);
    computedBonuses.set(mechanicId, (computedBonuses.get(mechanicId) ?? 0) + bonus);
  }
  const nextMechanics = mechanics.map((mechanic) => {
    const id = Number(mechanic.mechanic_id);
    const oldBonus = legacyDistribution.mechanicBonuses[String(id)];
    if (oldBonus === undefined || Number(mechanic.total_bonus) !== Number(oldBonus)) return mechanic;
    const bonus = computedBonuses.get(id) ?? 0;
    return Number(mechanic.total_bonus) === bonus ? mechanic : { ...mechanic, total_bonus: bonus };
  });
  if (nextMechanics.some((mechanic, index) => mechanic !== mechanics[index])) {
    await saveRows('mechanics', nextMechanics);
  }
}

/**
 * Load the baseline once in a new browser. The v3-to-v4 distribution update is
 * deliberately field-preserving; subsequent user edits are never reseeded.
 */
export function initializeReviewDemoData(
  onProgress?: (phase: ReviewDemoInitializationPhase) => void,
): Promise<boolean> {
  if (initialization) return initialization;
  initialization = (async () => {
    onProgress?.('database');
    const currentVersion = await readSystemSetting(SEED_MARKER);
    onProgress?.('checking');
    if (currentVersion === SEED_VERSION) {
      onProgress?.('ready');
      return false;
    }

    onProgress?.('importing');
    if (currentVersion === PREVIOUS_DISTRIBUTION_VERSION && legacyDistribution.version === PREVIOUS_DISTRIBUTION_VERSION) {
      await migrateV3Distribution();
    } else {
      await importSnapshot(reviewDemoBackup);
    }
    await writeSystemSetting(SEED_MARKER, SEED_VERSION);
    onProgress?.('ready');
    return true;
  })().finally(() => {
    initialization = null;
  });
  return initialization;
}
