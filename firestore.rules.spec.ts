const { initializeTestEnvironment, assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const fs = require("fs");

let testEnv;

const OWNER_USER = { uid: "owner-uid" };
const MANAGER_USER = { uid: "manager-uid" };
const CASHIER_USER = { uid: "cashier-uid" };
const OTHER_USER = { uid: "other-uid" };
const RESTAURANT_ID = "test-restaurant";

describe("Firestore Security Rules", () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "rules-spec-test",
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  // Clear the database before each test
  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // Seed the database for tests that need it
  const setupRestaurantAndStaff = async (staffSetup) => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      const restaurantRef = db.collection("restaurants").doc(RESTAURANT_ID);
      await restaurantRef.set({ ownerId: OWNER_USER.uid, name: "Test Cafe" });

      for (const user of staffSetup) {
        await restaurantRef.collection("staff").doc(user.uid).set({ role: user.role });
      }
    });
  };

  describe("User Profile Access", () => {
    it("should allow a user to read and update their own profile", async () => {
      const context = testEnv.authenticatedContext(OWNER_USER.uid);
      const userDoc = context.firestore().collection("users").doc(OWNER_USER.uid);
      await assertSucceeds(userDoc.set({ displayName: "Initial Name"}));
      await assertSucceeds(userDoc.get());
      await assertSucceeds(userDoc.update({ displayName: "New Name" }));
    });

    it("should NOT allow a user to read or update another user's profile", async () => {
      const context = testEnv.authenticatedContext(OTHER_USER.uid);
      const userDoc = context.firestore().collection("users").doc(OWNER_USER.uid);
      await assertFails(userDoc.get());
      await assertFails(userDoc.update({ displayName: "New Name" }));
    });
  });

  describe("Restaurant Document Access", () => {
    beforeEach(async () => await setupRestaurantAndStaff([]));

    it("should allow the owner to read and update the restaurant document", async () => {
        const context = testEnv.authenticatedContext(OWNER_USER.uid);
        const restDoc = context.firestore().collection("restaurants").doc(RESTAURANT_ID);
        await assertSucceeds(restDoc.get());
        await assertSucceeds(restDoc.update({ name: "Updated Name" }));
    });

    it("should NOT allow a manager, cashier, or other user to update the restaurant document", async () => {
        await setupRestaurantAndStaff([{ uid: MANAGER_USER.uid, role: "manager" }]);
        const managerContext = testEnv.authenticatedContext(MANAGER_USER.uid);
        const cashierContext = testEnv.authenticatedContext(CASHIER_USER.uid);
        const otherContext = testEnv.authenticatedContext(OTHER_USER.uid);

        const restDoc_manager = managerContext.firestore().collection("restaurants").doc(RESTAURANT_ID);
        const restDoc_cashier = cashierContext.firestore().collection("restaurants").doc(RESTAURANT_ID);
        const restDoc_other = otherContext.firestore().collection("restaurants").doc(RESTAURANT_ID);
        
        // They can read, but not update
        await assertSucceeds(restDoc_manager.get());
        await assertFails(restDoc_manager.update({ name: "Manager Update" }));
        await assertFails(restDoc_cashier.update({ name: "Cashier Update" }));
        await assertFails(restDoc_other.update({ name: "Other Update" }));
    });

    it("should NOT allow anyone to create or delete a restaurant directly", async () => {
        const context = testEnv.authenticatedContext(OWNER_USER.uid);
        const newRestDoc = context.firestore().collection("restaurants").doc("new-restaurant");
        const existingRestDoc = context.firestore().collection("restaurants").doc(RESTAURANT_ID);
        await assertFails(newRestDoc.set({ ownerId: OWNER_USER.uid }));
        await assertFails(existingRestDoc.delete());
    });
  });

  describe("Menu Access", () => {
    beforeEach(async () => await setupRestaurantAndStaff([
        { uid: MANAGER_USER.uid, role: "manager" },
        { uid: CASHIER_USER.uid, role: "cashier" }
    ]));

    const getMenuDoc = (user) => {
        const context = testEnv.authenticatedContext(user.uid);
        return context.firestore().collection("restaurants").doc(RESTAURANT_ID).collection("menu").doc("pizza");
    }

    it("should allow a Cashier to read the menu", async () => {
        await assertSucceeds(getMenuDoc(CASHIER_USER).get());
    });

    it("should NOT allow a Cashier to write to the menu", async () => {
        await assertFails(getMenuDoc(CASHIER_USER).set({ price: 20 }));
    });

    it("should allow a Manager to read and write to the menu", async () => {
        const menuDoc = getMenuDoc(MANAGER_USER);
        await assertSucceeds(menuDoc.get());
        await assertSucceeds(menuDoc.set({ price: 22 }));
    });

    it("should NOT allow an unaffiliated user to access the menu", async () => {
        const menuDoc = getMenuDoc(OTHER_USER);
        await assertFails(menuDoc.get());
        await assertFails(menuDoc.set({ price: 25 }));
    });
  });

  describe("Order Access", () => {
    beforeEach(async () => await setupRestaurantAndStaff([
        { uid: MANAGER_USER.uid, role: "manager" },
        { uid: CASHIER_USER.uid, role: "cashier" }
    ]));

    const getOrderDoc = (user) => {
        const context = testEnv.authenticatedContext(user.uid);
        return context.firestore().collection("restaurants").doc(RESTAURANT_ID).collection("orders").doc("order-123");
    }

    it("should allow a Cashier to create and read orders", async () => {
        const orderDoc = getOrderDoc(CASHIER_USER);
        await assertSucceeds(orderDoc.set({ status: "new" }));
        await assertSucceeds(orderDoc.get());
    });

    it("should NOT allow a Cashier to update or delete orders", async () => {
        // Need to create the order first with priveleged access
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().collection("restaurants").doc(RESTA-URANT_ID).collection("orders").doc("order-123").set({});
        });
        const orderDoc = getOrderDoc(CASHIER_USER);
        await assertFails(orderDoc.update({ status: "complete" }));
        await assertFails(orderDoc.delete());
    });

    it("should allow a Manager to update and delete orders", async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().collection("restaurants").doc(RESTAURANT_ID).collection("orders").doc("order-123").set({});
        });
        const orderDoc = getOrderDoc(MANAGER_USER);
        await assertSucceeds(orderDoc.update({ status: "complete" }));
        await assertSucceeds(orderDoc.delete());
    });
  });

  describe("Staff Management", () => {
    beforeEach(async () => await setupRestaurantAndStaff([]));

    const getStaffDoc = (user, staffMemberUid) => {
        const context = testEnv.authenticatedContext(user.uid);
        return context.firestore().collection("restaurants").doc(RESTAURANT_ID).collection("staff").doc(staffMemberUid);
    }

    it("should allow the Owner to read and write to the staff collection", async () => {
        const staffDoc = getStaffDoc(OWNER_USER, MANAGER_USER.uid);
        await assertSucceeds(staffDoc.get());
        await assertSucceeds(staffDoc.set({ role: "manager" }));
    });

    it("should NOT allow a Manager or Cashier to access the staff collection", async () => {
        await setupRestaurantAndStaff([{ uid: MANAGER_USER.uid, role: "manager" }]);

        const managerDocForOther = getStaffDoc(MANAGER_USER, CASHIER_USER.uid);
        const cashierDocForSelf = getStaffDoc(CASHIER_USER, CASHIER_USER.uid);

        await assertFails(managerDocForOther.get());
        await assertFails(managerDocForOther.set({ role: "cashier" }));
        await assertFails(cashierDocForSelf.get()); // Even reading their own staff doc is disallowed
    });
  });
});