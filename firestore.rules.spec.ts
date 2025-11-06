const { initializeTestEnvironment, assertSucceeds, assertFails, firestore } = require("@firebase/rules-unit-testing");

// --- MULTI-TENANT TEST SETUP ---
const PROJECT_ID = "rules-spec-test";

// Define Tenants
const TENANT_A_ID = "restaurant-a";
const TENANT_B_ID = "restaurant-b";

// Define Users and their Custom Claims
const ADMIN_A = { uid: "admin-a-uid", tenantId: TENANT_A_ID, role: "admin", permissions: ['manage_staff', 'manage_menu', 'create_orders', 'update_orders', 'manage_inventory', 'manage_customers', 'create_billing', 'process_payments', 'create_kot', 'update_kot'] };
const BILLING_A = { uid: "billing-a-uid", tenantId: TENANT_A_ID, role: "billing", permissions: ['create_billing', 'process_payments'] };
const ADMIN_B = { uid: "admin-b-uid", tenantId: TENANT_B_ID, role: "admin", permissions: [] };
const NO_CLAIMS_USER = { uid: "no-claims-uid" };

let testEnv;

// CORRECTED: Helper to get an authenticated context with proper claims structure
function getAuthContext(auth) {
  if (!auth) {
    return testEnv.unauthenticatedContext();
  }
  // The second argument to authenticatedContext IS the custom claims token.
  return testEnv.authenticatedContext(auth.uid, {
    tenantId: auth.tenantId,
    role: auth.role,
    permissions: auth.permissions
  });
}

// --- TESTS ---
describe("Res-kot Multi-Tenant Security Rules", () => {

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: { host: "127.0.0.1", port: 8080 },
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    // Seed data with a privileged context
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('tenants').doc(TENANT_A_ID).collection('metadata').doc('info').set({ name: "Tenant A" });
      await db.collection('tenants').doc(TENANT_B_ID).collection('metadata').doc('info').set({ name: "Tenant B" });
    });
  });

  // --- TENANT ISOLATION TESTS ---
  describe("Tenant Isolation", () => {
    it("should FAIL if a user from one tenant tries to read data from another", async () => {
      const db = getAuthContext(ADMIN_B).firestore();
      const docRef = db.collection('tenants').doc(TENANT_A_ID).collection('metadata').doc('info');
      await assertFails(docRef.get());
    });

    it("should FAIL if a user with no tenantId tries to read any tenant data", async () => {
      const db = getAuthContext(NO_CLAIMS_USER).firestore();
      const docRef = db.collection('tenants').doc(TENANT_A_ID).collection('metadata').doc('info');
      await assertFails(docRef.get());
    });

    it("should SUCCEED if a user reads data from their own tenant", async () => {
      const db = getAuthContext(ADMIN_A).firestore();
      const docRef = db.collection('tenants').doc(TENANT_A_ID).collection('metadata').doc('info');
      await assertSucceeds(docRef.get());
    });
  });

  // --- ROLE-BASED ACCESS CONTROL (RBAC) TESTS ---
  describe("Role-Based Access Control (RBAC)", () => {
    it("should ALLOW an admin to write to a tenant's settings", async () => {
      const db = getAuthContext(ADMIN_A).firestore();
      const settingsRef = db.collection('tenants').doc(TENANT_A_ID).collection('settings').doc('main');
      await assertSucceeds(settingsRef.set({ timeZone: 'Asia/Kolkata', tenantId: TENANT_A_ID }));
    });

    it("should DENY a non-admin user from writing to a tenant's settings", async () => {
      const db = getAuthContext(BILLING_A).firestore();
      const settingsRef = db.collection('tenants').doc(TENANT_A_ID).collection('settings').doc('main');
      await assertFails(settingsRef.set({ timeZone: 'Asia/Kolkata', tenantId: TENANT_A_ID }));
    });

    it("should ALLOW a user with 'create_billing' permission to create a bill", async () => {
        const db = getAuthContext(BILLING_A).firestore();
        const billRef = db.collection('tenants').doc(TENANT_A_ID).collection('billing').doc('bill-001');
        await assertSucceeds(billRef.set({ total: 100, tenantId: TENANT_A_ID }));
    });

    it("should DENY a user from updating a bill (immutable rule)", async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().collection('tenants').doc(TENANT_A_ID).collection('billing').doc('bill-001').set({ total: 100 });
        });
        const db = getAuthContext(BILLING_A).firestore();
        const billRef = db.collection('tenants').doc(TENANT_A_ID).collection('billing').doc('bill-001');
        await assertFails(billRef.update({ total: 200 }));
    });

    it("should DENY a user without 'create_orders' permission from creating an order", async () => {
      const db = getAuthContext(BILLING_A).firestore();
      const orderRef = db.collection('tenants').doc(TENANT_A_ID).collection('orders').doc('order-001');
      await assertFails(orderRef.set({ items: [], tenantId: TENANT_A_ID }));
    });

    it("should ALLOW a user to read their own staff document", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('tenants').doc(TENANT_A_ID).collection('staff').doc(BILLING_A.uid).set({ name: "Test User" });
      });
      const db = getAuthContext(BILLING_A).firestore();
      const staffRef = db.collection('tenants').doc(TENANT_A_ID).collection('staff').doc(BILLING_A.uid);
      await assertSucceeds(staffRef.get());
    });

    it("should DENY a user from reading another user's staff document (unless admin)", async () => {
        const db = getAuthContext(BILLING_A).firestore();
        const staffRef = db.collection('tenants').doc(TENANT_A_ID).collection('staff').doc(ADMIN_A.uid);
        await assertFails(staffRef.get());
    });
  });
});