import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { LoadingScreen, type LoadingPhase } from './components/common/LoadingScreen';
import { DetailSkeleton } from './components/common/Skeleton';
import { EmptyState } from './components/common/EmptyState';
import { Button } from './components/common/Button';
import { DbStatusProvider } from './hooks/useDbStatus';
import { LookupsProvider } from './hooks/useLookups';
import { ToastProvider } from './hooks/useToast';
import { initializeReviewDemoData } from './services/seedData';
import { Search } from 'lucide-react';

/* Route-level code splitting keeps the first paint fast on the workshop floor. */
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'));
const Vehicles = lazy(() => import('./pages/Vehicles'));
const VehicleDetail = lazy(() => import('./pages/VehicleDetail'));
const Appointments = lazy(() => import('./pages/Appointments'));
const AppointmentDetail = lazy(() => import('./pages/AppointmentDetail'));
const ServiceRequests = lazy(() => import('./pages/ServiceRequests'));
const ServiceRequestDetail = lazy(() => import('./pages/ServiceRequestDetail'));
const Mechanics = lazy(() => import('./pages/Mechanics'));
const MechanicDetail = lazy(() => import('./pages/MechanicDetail'));
const Services = lazy(() => import('./pages/Services'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const Inventory = lazy(() => import('./pages/Inventory'));
const PartDetail = lazy(() => import('./pages/PartDetail'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const SupplierDetail = lazy(() => import('./pages/SupplierDetail'));
const Invoices = lazy(() => import('./pages/Invoices'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const Feedback = lazy(() => import('./pages/Feedback'));
const FeedbackDetail = lazy(() => import('./pages/FeedbackDetail'));
const Reports = lazy(() => import('./pages/Reports'));

function RouteFallback() {
  return (
    <div className="space-y-4">
      <div className="surface p-4">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton mt-3 h-7 w-72" />
      </div>
      <DetailSkeleton />
    </div>
  );
}

function DatabaseBootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<LoadingPhase>('database');

  useEffect(() => {
    let active = true;
    const minimumDisplay = new Promise<void>((resolve) => window.setTimeout(resolve, 1250));
    const initialize = initializeReviewDemoData((nextPhase) => {
      if (active) setPhase(nextPhase);
    }).catch(() => {
      // Let the app show its normal database-unavailable notice if local storage
      // cannot be opened; the startup screen should never trap the user.
      if (active) setPhase('ready');
    });

    void Promise.all([initialize, minimumDisplay]).then(() => {
      if (!active) return;
      setPhase('ready');
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  if (!ready) return <LoadingScreen phase={phase} />;

  return children;
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="surface">
      <EmptyState
        icon={Search}
        title="Page not found"
        description="That route does not exist in the VSCMS application. Return to the operations overview."
        action={
          <Button variant="primary" size="sm" onClick={() => navigate('/')}>
            Back to overview
          </Button>
        }
      />
    </div>
  );
}

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const onRefreshAll = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <DatabaseBootstrap>
      <DbStatusProvider>
        <LookupsProvider>
          <ToastProvider>
          <AppShell onRefreshAll={onRefreshAll} refreshKey={refreshKey}>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />

                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/:customerId" element={<CustomerDetail />} />

                <Route path="/vehicles" element={<Vehicles />} />
                <Route path="/vehicles/:vehicleId" element={<VehicleDetail />} />

                <Route path="/appointments" element={<Appointments />} />
                <Route path="/appointments/:appointmentId" element={<AppointmentDetail />} />

                <Route path="/service-requests" element={<ServiceRequests />} />
                <Route path="/service-requests/:requestId" element={<ServiceRequestDetail />} />

                <Route path="/mechanics" element={<Mechanics />} />
                <Route path="/mechanics/:mechanicId" element={<MechanicDetail />} />

                <Route path="/services" element={<Services />} />
                <Route path="/services/:serviceId" element={<ServiceDetail />} />

                <Route path="/inventory" element={<Inventory />} />
                <Route path="/inventory/:partId" element={<PartDetail />} />

                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/suppliers/:supplierId" element={<SupplierDetail />} />

                <Route path="/invoices" element={<Invoices />} />
                <Route path="/invoices/:invoiceId" element={<InvoiceDetail />} />

                <Route path="/feedback" element={<Feedback />} />
                <Route path="/feedback/:feedbackId" element={<FeedbackDetail />} />
                <Route path="/reports" element={<Reports />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AppShell>
          </ToastProvider>
        </LookupsProvider>
      </DbStatusProvider>
    </DatabaseBootstrap>
  );
}
