# PRAGATI PATH SOLUTIONS  {Mother Company} have a product *Res-kot*- MULTI-TENANT RESTAURANT MANAGEMENT SYSTEM
## Expert Knowledge Base for AI Development
### Version: 1.0 | Last Updated: November 2025

---

## TABLE OF CONTENTS
1. [Project Vision & Market Context](#1-project-vision--market-context)
2. [Multi-Tenancy Core Concepts](#2-multi-tenancy-core-concepts)
3. [Architecture & Technical Design Patterns](#3-architecture--technical-design-patterns)
4. [Data Model & Firestore Structure](#4-data-model--firestore-structure)
5. [Security, Compliance & Access Control](#5-security-compliance--access-control)
6. [KOT System - Kitchen Order Ticket Design](#6-kot-system--kitchen-order-ticket-design)
7. [Firebase Studio Best Practices](#7-firebase-studio-best-practices)
8. [Indian Restaurant Market Requirements](#8-indian-restaurant-market-requirements)
9. [Code Standards & Maintainability](#9-code-standards--maintainability)
10. [Decision Framework & Brainstorming Protocol](#10-decision-framework--brainstorming-protocol)

---

## 1. PROJECT VISION & MARKET CONTEXT

### Our Mission
Build **India's #1 SaaS platform** for restaurant management that:
- Surpasses PetPooja's features with advanced, thoughtfully-designed solutions
- Serves mass-scale restaurants with **security, compliance, and scalability** as core differentiators
- Empowers restaurants to reduce aggregator dependence and build direct customer relationships
- Provides superior KOT (Kitchen Order Ticket) management, inventory control, and real-time analytics

### Market Gaps We're Solving
Based on research and Indian restaurant challenges:

| Gap | Problem | Our Solution |
|-----|---------|--------------|
| **Aggregator Dependence** | 25-30% commission fees destroy margins | Direct ordering + customer data ownership |
| **Poor KOT Management** | Manual/paper systems = 60-80% order errors | Digital KDS with real-time status tracking |
| **Compliance Complexity** | GST, FSSAI, data privacy scattered across systems | Built-in compliance modules auto-enforced |
| **Offline Reliability** | Internet outages halt operations | Offline-first KOT with intelligent sync |
| **Multi-Kitchen Chaos** | No smart order routing to multiple kitchens | Intelligent kitchen routing + queue management |
| **Inventory Bleeding** | 65% of restaurants waste 20%+ of inventory | Real-time consumption tracking + FIFO alerts |
| **Customer Retention** | No direct customer data/CRM | Built-in loyalty programs + direct channels |
| **Limited Reporting** | Generic reports don't help growth | Predictive analytics, demand forecasting, margins by item |

### Key Competitive Advantages
1. **Multi-Tenancy at Scale**: Handle 1000+ restaurants on single infrastructure
2. **Security-First Design**: Tenant isolation is not an afterthought—it's architectural
3. **Indian Compliance Native**: GST, FSSAI, DPDP Act baked into core
4. **Offline-Capable**: KOT works without internet; syncs when available
5. **Smart Automation**: AI-driven inventory, demand prediction, staff optimization
6. **Developer-Friendly**: Clean code, well-documented, easy to maintain and extend

---

## 2. MULTI-TENANCY CORE CONCEPTS

### What is Multi-Tenancy?
**Definition**: A single software instance serves multiple independent "tenants" (restaurants/restaurant chains), each with:
- Completely isolated data (no cross-contamination)
- Customizable branding, workflows, and configurations
- Separate billing and usage tracking
- Secure access controls ensuring users see only their tenant's data

### Why Multi-Tenancy for Pragati Path?
1. **Cost-Efficiency**: Shared infrastructure = lower operational costs = lower SaaS pricing → faster market adoption
2. **Scalability**: Add 1000s of restaurants without re-architecture
3. **Unified Updates**: Deploy features once; all tenants benefit instantly
4. **Operational Efficiency**: Central management, monitoring, and support
5. **Profitability**: Better unit economics than single-tenant deployments

### Multi-Tenancy Models - Our Choice: Hybrid Approach

**Model 1: Shared Database, Tenant-Scoped Collections** ✅ PRIMARY
- **Structure**: `/tenants/{tenantId}/collections/...` all data in one Firestore project
- **Pros**: Cost-effective, easy to deploy, simple backups
- **Cons**: Requires strict security rules, all tenants share resources
- **Best For**: 1000+ restaurants, cost-sensitive segment
- **Implementation**:
  ```
  /tenants
    /restaurant_abc123
      /settings
      /staff
      /menus
      /orders
      /inventory
      /customers
    /restaurant_xyz789
      /settings
      /staff
      /menus
      /orders
      /inventory
      /customers
  ```

**Model 2: Dedicated Collections per Tenant** ⭐ ENTERPRISE
- **Structure**: `/restaurants_{tenantId}/orders`, `/restaurants_{tenantId}/inventory` (separate collections)
- **Pros**: Better query performance, easier to reason about security rules
- **Cons**: More collections, harder to manage at scale
- **Best For**: Premium tier restaurants, high-volume operations

**Model 3: Project Per Tenant** ❌ NOT FOR NOW
- **Structure**: Separate Firebase projects per restaurant
- **Pros**: Maximum isolation, GDPR compliance easy
- **Cons**: Operational nightmare, 1000x cost multiplier, maintenance hell
- **When to Consider**: ONLY if tenant demands complete legal separation

### Key Principle: Data Isolation Through All Layers
```
Authentication Layer: Each user → specific tenantId in custom claims
Data Layer: tenantId field in every document + Firestore rules enforce access
API Layer: Cloud Functions validate tenantId on every request
Client Layer: tenantId passed from server-verified claims, never from UI
```

---

## 3. ARCHITECTURE & TECHNICAL DESIGN PATTERNS

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Web (React)  │  │ Mobile (iOS) │  │Mobile(Android)  │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│           │                │                 │            │
└───────────┼────────────────┼─────────────────┼────────────┘
            │                │                 │
            │  Firestore SDK │  + Custom Claims
            │                │
┌───────────┼────────────────┼─────────────────┼────────────┐
│          FIREBASE BACKEND (Single Project, Multi-Tenant)  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Authentication (Firebase Auth + Identity Platform) │  │
│  │  - Custom Claims: tenantId, role, permissions       │  │
│  │  - Token Refresh: Ensures claims up-to-date         │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Firestore Database (Tenant-Scoped Collections)     │  │
│  │  - /tenants/{tenantId}/orders                       │  │
│  │  - /tenants/{tenantId}/inventory                    │  │
│  │  - /tenants/{tenantId}/staff                        │  │
│  │  - Security Rules enforce tenantId equality         │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Cloud Functions (Backend Logic)                    │  │
│  │  - Tenant Creation & Onboarding                     │  │
│  │  - Role Management (set custom claims)              │  │
│  │  - Cross-tenant Operations (billing, reports)       │  │
│  │  - Webhook Handlers (aggregator feeds, payments)    │  │
│  │  - Scheduled Jobs (inventory forecasting, cleanup)  │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Cloud Storage (Media, Exports, Backups)            │  │
│  │  - /tenants/{tenantId}/menus/images                 │  │
│  │  - /exports/tenant_abc123_report_2025.csv           │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
            │
┌───────────┴─────────────────────────────────────────────────┐
│        EXTERNAL INTEGRATIONS (Secure & Audited)             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐   │
│  │Aggregators│  │ Payment  │  │ SMS/Email │  │ Analytics │   │
│  │(Zomato,  │  │ Gateways │  │ Providers │  │ (BigQuery)│   │
│  │ Swiggy)  │  │(Razorpay,│  │ (Twilio, │  │           │   │
│  │          │  │ PhonePe) │  │SendGrid) │  │           │   │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns in Use

#### 1. **Repository Pattern** (Data Access Layer)
```
Purpose: Abstract Firestore queries, enforce tenantId checks
Example:
  class OrderRepository {
    async getOrdersByTenant(tenantId, filters) {
      // ALWAYS enforce tenantId in query
      validate(tenantId)
      return db.collection('tenants')
        .doc(tenantId)
        .collection('orders')
        .where('tenantId', '==', tenantId)
        .where('status', 'in', filters.status)
        .get()
    }
  }
```

#### 2. **Middleware Pattern** (Request Validation)
```
Purpose: Extract and validate tenantId before handler executes
Every Cloud Function must:
  1. Extract tenantId from request.auth.token.customClaims
  2. Validate it matches request body/params
  3. Pass it to all data access methods
  4. Reject if mismatch detected
```

#### 3. **Multi-Tenant Isolation Pattern**
```
Rule: NEVER trust client-supplied tenantId
- Extract from verified JWT token (custom claims)
- Validate in Cloud Functions before any DB operation
- Firestore Security Rules enforce as secondary check
- Logs include tenantId for audit trails
```

#### 4. **Event-Driven Architecture** (Firebase Pub/Sub or Firestore Triggers)
```
Examples:
- Tenant Creation → Trigger: Initialize default settings, staff roles, menu templates
- Order Placed → Trigger: Send KOT to kitchen, notify customer, update inventory
- Low Inventory Alert → Trigger: Notify manager, log for reporting
- Staff Role Change → Trigger: Refresh their custom claims, audit log
```

### Communication Patterns

**Client → Firebase (Real-time)**
- Use Firestore listeners with tenantId scoping
- Custom claims auto-injected by Firebase SDK
- Security Rules validate on server

**Client → Cloud Functions (Transactional)**
- Use Callable Functions for auth-required operations
- Pass tenantId in request context (auto-provided by SDK)
- Validate in function; reject if mismatch

**Cloud Functions ↔ Firestore (Batch Operations)**
- Use Admin SDK (bypasses rules, but validate in code)
- Wrap in transactions for consistency
- Document why Admin SDK is needed in comments

---

## 4. DATA MODEL & FIRESTORE STRUCTURE

### Core Collections Structure (Per Tenant)

```
/tenants/{tenantId}
├── /metadata (document)
│   ├── restaurantName: string
│   ├── gstin: string
│   ├── fssaiLicense: string
│   ├── createdAt: timestamp
│   ├── tier: 'starter' | 'pro' | 'enterprise'
│   ├── primaryContact: { email, phone }
│   └── subscriptionStatus: 'active' | 'paused' | 'cancelled'
│
├── /settings (document - single per tenant)
│   ├── orderPrefix: 'ORD' (for order IDs)
│   ├── kotFormat: 'compact' | 'detailed'
│   ├── timeZone: 'Asia/Kolkata'
│   ├── currency: 'INR'
│   ├── gstRate: 5 | 18 (for different foods)
│   ├── aggregatorIntegrations: {zomato, swiggy, dunzoFood}
│   ├── paymentGateways: [razorpay, phonepe]
│   └── features: {allowOnlineOrders, allowReservations, enableCRM}
│
├── /staff (collection)
│   └── {staffId} (document)
│       ├── name: string
│       ├── email: string
│       ├── phone: string
│       ├── role: 'admin' | 'manager' | 'chef' | 'waiter' | 'billing'
│       ├── permissions: ['view_inventory', 'create_orders', 'manage_staff']
│       ├── assignedStations: ['counter1', 'kitchen1'] (kitchen staff)
│       ├── isActive: boolean
│       ├── createdAt: timestamp
│       └── customClaims: {tenantId, role, assignedStations} (synced to auth)
│
├── /menus (collection)
│   └── {menuId} (document)
│       ├── name: 'Main Menu' | 'Breakfast Menu'
│       ├── description: string
│       ├── isActive: boolean
│       ├── createdAt: timestamp
│       └── validFrom: timestamp (for version control)
│
├── /menu_items (collection)
│   └── {itemId} (document)
│       ├── menuId: string (reference)
│       ├── name: string
│       ├── description: string
│       ├── category: 'appetizers' | 'mains' | 'desserts' | 'beverages'
│       ├── price: number
│       ├── gstApplicable: boolean
│       ├── gstPercentage: 5 | 18
│       ├── recipie: {
│           ├── ingredients: [{rawMaterialId, quantity, unit}],
│           ├── preparationTime: number (minutes)
│           ├── cookingStation: 'main_kitchen' | 'grill' | 'bar' | 'pastry'
│       }
│       ├── variants: [{name, priceModifier}] (e.g., small/medium/large)
│       ├── addOns: [{name, price}] (e.g., cheese, sauce)
│       ├── isAvailable: boolean
│       ├── imageUrl: string (Firebase Storage URL)
│       └── createdAt: timestamp
│
├── /raw_materials (collection)
│   └── {materialId} (document)
│       ├── name: string
│       ├── category: 'vegetables' | 'proteins' | 'spices' | 'dairy'
│       ├── unit: 'kg' | 'liters' | 'pieces'
│       ├── costPerUnit: number
│       ├── minStockLevel: number (triggers alert)
│       ├── maxStockLevel: number
│       ├── supplier: {name, contact, gst}
│       ├── expiryDate: timestamp (for batch tracking)
│       └── createdAt: timestamp
│
├── /inventory (collection)
│   └── {inventoryId} (document)
│       ├── materialId: string (reference)
│       ├── batchNo: string (for FIFO tracking)
│       ├── quantityOnHand: number
│       ├── quantityReserved: number (for pending orders)
│       ├── quantityAvailable: quantityOnHand - quantityReserved
│       ├── lastRestockDate: timestamp
│       ├── expiryDate: timestamp
│       ├── wasteLog: [{date, quantity, reason}]
│       └── lastUpdated: timestamp
│
├── /orders (collection)
│   └── {orderId} (document)
│       ├── orderNo: string (auto-generated with prefix)
│       ├── type: 'dine_in' | 'takeaway' | 'delivery' | 'online'
│       ├── status: 'new' | 'in_kitchen' | 'ready' | 'served' | 'billed' | 'cancelled'
│       ├── tableNo: string (for dine-in)
│       ├── customerInfo: {
│           ├── name: string,
│           ├── phone: string,
│           ├── isGuest: boolean
│       }
│       ├── items: [{
│           ├── menuItemId: string,
│           ├── quantity: number,
│           ├── variant: string (e.g., 'large'),
│           ├── addOns: [string],
│           ├── specialInstructions: string,
│           ├── unitPrice: number,
│           ├── discount: number (INR),
│           ├── subtotal: number
│       }],
│       ├── summary: {
│           ├── subtotal: number,
│           ├── discountApplied: number,
│           ├── gstAmount: number,
│           ├── deliveryCharge: number,
│           ├── total: number
│       },
│       ├── paymentMethod: 'cash' | 'card' | 'upi' | 'wallet'
│       ├── paymentStatus: 'pending' | 'paid' | 'failed'
│       ├── aggregatorOrderId: string (if from Zomato/Swiggy)
│       ├── kotPrinted: boolean
│       ├── kotPrintedAt: timestamp
│       ├── readyAt: timestamp
│       ├── deliveredAt: timestamp
│       ├── createdAt: timestamp
│       ├── createdBy: staffId
│       └── notes: string
│
├── /kot_tickets (collection)
│   └── {kotId} (document)
│       ├── orderId: string (reference)
│       ├── kotNo: string (auto-generated)
│       ├── station: 'main_kitchen' | 'grill' | 'bar' | 'pastry'
│       ├── items: [{
│           ├── itemId: string,
│           ├── quantity: number,
│           ├── variant: string,
│           ├── specialInstructions: string,
│           ├── preparationTime: number (minutes)
│       }],
│       ├── status: 'new' | 'acknowledged' | 'preparing' | 'ready' | 'served'
│       ├── priority: 'low' | 'medium' | 'high' (for prioritizing orders)
│       ├── createdAt: timestamp
│       ├── acknowledgedAt: timestamp
│       ├── readyAt: timestamp
│       └── acknowledgedBy: staffId
│
├── /customers (collection)
│   └── {customerId} (document)
│       ├── name: string
│       ├── phone: string
│       ├── email: string
│       ├── gstin: string (for B2B customers)
│       ├── address: {street, city, state, zipCode}
│       ├── type: 'walk_in' | 'regular' | 'corporate' | 'delivery_partner'
│       ├── loyaltyPoints: number
│       ├── totalSpent: number
│       ├── visitCount: number
│       ├── lastVisit: timestamp
│       ├── createdAt: timestamp
│       └── notes: string
│
├── /billing (collection)
│   └── {billId} (document)
│       ├── orderId: string (reference)
│       ├── billNo: string (sequential)
│       ├── billDate: timestamp
│       ├── gstinOnBill: string (restaurant's GSTIN)
│       ├── customerGstin: string (if B2B)
│       ├── items: [{itemName, qty, rate, gst%, amount}]
│       ├── gstBreakup: {5%: amount, 18%: amount} (by tax rate)
│       ├── subtotal: number
│       ├── totalGst: number
│       ├── roundOff: number
│       ├── finalTotal: number
│       ├── paymentMethod: string
│       ├── paymentStatus: 'pending' | 'paid'
│       ├── isPrinted: boolean
│       ├── printedAt: timestamp
│       └── createdBy: staffId
│
├── /payments (collection)
│   └── {paymentId} (document)
│       ├── billId: string (reference)
│       ├── orderId: string (reference)
│       ├── amount: number
│       ├── method: 'cash' | 'card' | 'upi' | 'wallet'
│       ├── gatewayTransactionId: string (Razorpay/PhonePe)
│       ├── status: 'pending' | 'success' | 'failed'
│       ├── createdAt: timestamp
│       ├── processedAt: timestamp
│       └── failureReason: string (if failed)
│
├── /reports (subcollection for analytics)
│   └── {reportId} (document)
│       ├── date: timestamp
│       ├── totalOrders: number
│       ├── totalRevenue: number
│       ├── avgOrderValue: number
│       ├── paymentMethodBreakup: {cash, card, upi}
│       ├── topItems: [{itemId, quantity, revenue}]
│       ├── staffPerformance: [{staffId, ordersHandled, sales}]
│       ├── inventoryUsed: number (in INR)
│       └── foodCost%: number
│
└── /audit_logs (collection - immutable)
    └── {logId} (document)
        ├── action: string ('order_created', 'staff_deleted', 'price_changed')
        ├── entity: string ('order', 'staff', 'menu_item')
        ├── entityId: string
        ├── changes: {before: {}, after: {}}
        ├── performedBy: staffId
        ├── timestamp: timestamp
        └── ipAddress: string
```

### Key Design Principles for Data Model

1. **Denormalization for Performance**: Include `itemName`, `price` in orders → avoids extra lookups
2. **Immutable Audit Logs**: Never delete; only add to audit_logs
3. **Quantity Tracking**: Keep `quantityReserved` separate → prevents overselling
4. **Timestamps Everywhere**: createdAt, updatedAt (except audit logs which only have timestamp)
5. **Status Enums**: Use finite states to enable validation and state machine logic
6. **Batch Tracking**: For FIFO inventory management (critical for food safety)

---

## 5. SECURITY, COMPLIANCE & ACCESS CONTROL

### Authentication Architecture

#### Phase 1: Email/Password + Custom Claims
```javascript
// Cloud Function: Authenticate and Assign Tenant
async function onUserSignUp(userId, email, tenantId) {
  try {
    // Validate tenantId exists and user is authorized
    const tenantDoc = await db.collection('tenants').doc(tenantId).get()
    if (!tenantDoc.exists) throw new Error('Tenant not found')
    
    // Check if this email belongs to this tenant
    const staffDoc = await db.collection('tenants')
      .doc(tenantId)
      .collection('staff')
      .where('email', '==', email)
      .get()
    
    if (staffDoc.empty) throw new Error('User not authorized for this tenant')
    
    const staffData = staffDoc.docs[0].data()
    const role = staffData.role
    
    // Set custom claims on Firebase Auth token
    await admin.auth().setCustomUserClaims(userId, {
      tenantId: tenantId,
      role: role,
      staffId: staffDoc.docs[0].id,
      permissions: staffData.permissions || []
    })
    
    return { success: true, message: 'Custom claims set' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

#### Phase 2: Identity Platform (Multi-Tenant Auth) - Future
- Google's Identity Platform allows multiple authentication tenants within Firebase
- Each restaurant gets its own authentication tenant
- SSO, social login, custom domains per tenant

### Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getTenantId() {
      return request.auth.token.tenantId;
    }
    
    function getUserRole() {
      return request.auth.token.role;
    }
    
    function getUserPermissions() {
      return request.auth.token.permissions;
    }
    
    function userHasPermission(permission) {
      return permission in getUserPermissions();
    }
    
    function isSameTenant(tenantId) {
      return getTenantId() == tenantId;
    }
    
    function isAdmin() {
      return getUserRole() == 'admin';
    }
    
    // Tenant-level access control
    match /tenants/{tenantId} {
      // Metadata - only admin can read/write
      match /metadata {
        allow read: if isAuthenticated() && isSameTenant(tenantId);
        allow write: if isAuthenticated() && isSameTenant(tenantId) && isAdmin();
      }
      
      // Settings - admin only
      match /settings {
        allow read: if isAuthenticated() && isSameTenant(tenantId);
        allow write: if isAuthenticated() && isSameTenant(tenantId) && isAdmin();
      }
      
      // Staff - admin can read all, staff can read own
      match /staff/{staffId} {
        allow read: if isAuthenticated() && isSameTenant(tenantId) && 
          (isAdmin() || request.auth.uid == staffId);
        allow write: if isAuthenticated() && isSameTenant(tenantId) && isAdmin();
      }
      
      // Menu Items - all can read, only admin can write
      match /menu_items/{itemId} {
        allow read: if isAuthenticated() && isSameTenant(tenantId);
        allow write: if isAuthenticated() && isSameTenant(tenantId) && 
          userHasPermission('manage_menu');
      }
      
      // Orders - all roles can read, specific roles can write
      match /orders/{orderId} {
        allow read: if isAuthenticated() && isSameTenant(tenantId);
        allow create: if isAuthenticated() && isSameTenant(tenantId) && 
          userHasPermission('create_orders');
        allow update: if isAuthenticated() && isSameTenant(tenantId) && 
          (isAdmin() || userHasPermission('update_orders'));
        allow delete: if false; // Never delete orders (audit trail)
      }
      
      // KOT Tickets - kitchen staff can read/write their station
      match /kot_tickets/{kotId} {
        allow read: if isAuthenticated() && isSameTenant(tenantId);
        allow create: if isAuthenticated() && isSameTenant(tenantId) && 
          userHasPermission('create_kot');
        allow update: if isAuthenticated() && isSameTenant(tenantId) && 
          (isAdmin() || userHasPermission('update_kot'));
      }
      
      // Inventory - manager/admin can write, all can read
      match /inventory/{inventoryId} {
        allow read: if isAuthenticated() && isSameTenant(tenantId);
        allow write: if isAuthenticated() && isSameTenant(tenantId) && 
          userHasPermission('manage_inventory');
      }
      
      // Customers - all roles can read, specific roles can write
      match /customers/{customerId} {
        allow read: if isAuthenticated() && isSameTenant(tenantId);
        allow write: if isAuthenticated() && isSameTenant(tenantId) && 
          userHasPermission('manage_customers');
      }
      
      // Billing - restricted to billing/admin staff
      match /billing/{billId} {
        allow read: if isAuthenticated() && isSameTenant(tenantId) && 
          (isAdmin() || getUserRole() == 'billing');
        allow create: if isAuthenticated() && isSameTenant(tenantId) && 
          userHasPermission('create_billing');
        allow update: if false; // Billing docs should be immutable
      }
      
      // Payments - billing/admin only
      match /payments/{paymentId} {
        allow read: if isAuthenticated() && isSameTenant(tenantId) && 
          (isAdmin() || getUserRole() == 'billing');
        allow write: if isAuthenticated() && isSameTenant(tenantId) && 
          (isAdmin() || userHasPermission('process_payments'));
      }
      
      // Audit Logs - admin only, immutable
      match /audit_logs/{logId} {
        allow read: if isAuthenticated() && isSameTenant(tenantId) && isAdmin();
        allow create: if false; // Created only via Cloud Functions
        allow update, delete: if false; // Immutable
      }
      
      // Default deny all other collections
      match /{document=**} {
        allow read, write: if false;
      }
    }
  }
}
```

### Role-Based Access Control (RBAC)

| Role | Permissions | Use Case |
|------|-------------|----------|
| **Admin** | All operations | Restaurant owner/manager |
| **Manager** | Orders, staff, inventory, reports | Shift manager |
| **Chef** | Read orders, update KOT status | Kitchen staff |
| **Waiter** | Create orders, read menu, update table status | Front-of-house staff |
| **Billing** | View orders, create bills, process payments | Cashier |

### Cloud Functions for Server-Side Validation

```javascript
// CRITICAL: Every sensitive operation validates tenantId server-side
exports.createOrder = functions.https.onCall(async (data, context) => {
  // 1. Validate authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');
  }
  
  // 2. Extract tenant from verified JWT
  const tenantId = context.auth.token.tenantId;
  if (!tenantId) {
    throw new functions.https.HttpsError('failed-precondition', 'No tenant in token');
  }
  
  // 3. Validate permission
  if (!context.auth.token.permissions.includes('create_orders')) {
    throw new functions.https.HttpsError('permission-denied', 'No permission to create orders');
  }
  
  // 4. Validate input
  if (!data.items || data.items.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Order must have items');
  }
  
  // 5. Verify all menu items belong to this tenant
  const menuRef = db.collection('tenants').doc(tenantId).collection('menu_items');
  for (const item of data.items) {
    const itemDoc = await menuRef.doc(item.menuItemId).get();
    if (!itemDoc.exists) {
      throw new functions.https.HttpsError('not-found', `Menu item not found: ${item.menuItemId}`);
    }
  }
  
  // 6. Execute in transaction
  const batch = db.batch();
  
  const orderId = admin.firestore.FieldValue.serverTimestamp();
  const orderRef = db.collection('tenants')
    .doc(tenantId)
    .collection('orders')
    .doc();
  
  batch.set(orderRef, {
    tenantId: tenantId, // Always store tenantId
    items: data.items,
    status: 'new',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: context.auth.uid,
  });
  
  // 7. Update inventory (deduct quantityReserved)
  // ... additional logic
  
  await batch.commit();
  
  // 8. Log audit
  await db.collection('tenants')
    .doc(tenantId)
    .collection('audit_logs')
    .add({
      action: 'order_created',
      orderId: orderRef.id,
      performedBy: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  
  return { success: true, orderId: orderRef.id };
});
```

### Compliance Requirements

#### GST Compliance (India)
- **Auto-apply GST**: 5% for unbranded food, 18% for branded/restaurant services
- **Bill Generation**: GSTIN, item-wise GST breakup, separate tax columns
- **ITC Tracking**: Input Tax Credit on raw materials tracked separately
- **Returns Filing**: Monthly/quarterly GST return data ready for export

#### FSSAI Compliance (Food Safety)
- **License Tracking**: FSSAI license number stored and validated
- **Food Safety Alerts**: Expiry date tracking, batch management, waste logs
- **Inventory Compliance**: Temperature-sensitive item alerts, hygiene reminders
- **Audit Trail**: All food-related changes logged for regulatory inspection

#### Data Privacy (DPDP Act, India)
- **Consent**: Explicit opt-in for customer data collection
- **Right to Access**: Customers can request their data export
- **Right to Erasure**: "Right to be forgotten" - delete customer records
- **Data Breach Notification**: Auto-alert if unauthorized access detected
- **Vendor Agreements**: All third-party integrations (Razorpay, Twilio) have data processing agreements

---

## 6. KOT SYSTEM - KITCHEN ORDER TICKET DESIGN

### KOT Philosophy
- **Real-Time Communication**: Orders reach kitchen instantly, no paper shuffling
- **Station-Based Routing**: Different cuisines → different kitchen stations
- **Priority Queuing**: Urgent orders don't get lost behind slow ones
- **Status Transparency**: FOH staff know exact status: New → Acknowledged → Preparing → Ready
- **Offline-First**: KOT works even without internet; syncs when online

### KOT Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER ORDERS                           │
│  (Dine-in, Takeaway, Delivery, Online Aggregator)           │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  1. ORDER CREATED (POS System)                              │
│  - Items selected with variants/addons                       │
│  - Special instructions captured                             │
│  - Order stored in Firestore with status='new'              │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  2. KOT GENERATED (Firestore triggers Cloud Function)       │
│  - Group items by cooking station (main_kitchen, grill, bar)│
│  - Create separate KOT doc for each station                 │
│  - Assign priority based on order type & time               │
│  - Status: 'new'                                             │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  3. KOT PRINTED/DISPLAYED (Kitchen Display System)          │
│  - Digital KDS shows: Item, Qty, Variant, Instructions     │
│  - Color-coded by priority (red=urgent, yellow=normal)      │
│  - Beep/Sound alert when new KOT arrives                    │
│  - OR: Thermal printer prints paper KOT                     │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  4. KITCHEN ACKNOWLEDGES (Chef taps "Started" on KDS)       │
│  - KOT status: 'acknowledged'                               │
│  - Timer starts to track preparation time                   │
│  - Marks which chef started it (for accountability)         │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  5. ITEMS PREPARED (Chef marks items "Ready" individually)  │
│  - Individual item status: 'preparing' → 'ready'             │
│  - KOT shows exactly which items are done                   │
│  - FOH waiter knows when to collect from pass               │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  6. FULL KOT READY (All items prepared)                     │
│  - KOT status: 'ready'                                      │
│  - Visual/audio alert to FOH: "Table 5 ready!"             │
│  - Waiter collects and serves                               │
│  - Collection timestamp recorded                             │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  7. SERVED (Waiter marks in POS after serving)              │
│  - KOT status: 'served'                                     │
│  - Order transitions to 'served' status                      │
│  - Inventory automatically deducted (based on recipe)        │
│  - Performance metrics: Order time, prep time, service time  │
└────────────────────────────────────────────────────────────┘
```

### KOT Document Structure

```javascript
{
  kotId: "KOT_2025_001234",
  orderId: "ORD_2025_005678",
  tenantId: "restaurant_abc123",
  
  // Kitchen routing
  station: "main_kitchen", // or: grill, bar, pastry
  
  // Items for this KOT (grouped by station)
  items: [
    {
      itemId: "menu_item_xyz",
      itemName: "Butter Chicken",
      quantity: 2,
      variant: "medium",
      addOns: ["extra_ghee"],
      specialInstructions: "Less spicy, no ginger",
      preparationTime: 15, // minutes
      status: "new", // new → acknowledged → preparing → ready
      startedAt: null,
      readyAt: null,
      acknowledgedBy: null,
    },
    {
      itemId: "menu_item_abc",
      itemName: "Naan",
      quantity: 2,
      variant: null,
      addOns: [],
      specialInstructions: "Butter naan",
      preparationTime: 5,
      status: "new",
      startedAt: null,
      readyAt: null,
      acknowledgedBy: null,
    }
  ],
  
  // Order context
  orderType: "dine_in", // for priority calculation
  tableNo: "5",
  customerName: "Rajesh Kumar",
  
  // KOT status
  status: "new", // new → acknowledged → preparing → ready → served → cancelled
  priority: "high", // low | normal | high | urgent
  
  // Timing
  createdAt: 2025-11-04T08:30:00Z,
  acknowledgedAt: null,
  readyAt: null,
  servedAt: null,
  
  // Accountability
  acknowledgedBy: "staff_chef_001",
  preparedBy: "staff_chef_001",
  
  // Offline support
  localId: "KOT_LOCAL_ABC123", // For offline-first apps
  syncStatus: "synced", // synced | pending | failed
}
```

### KOT Intelligence Features

#### 1. **Smart Priority Assignment**
```javascript
function calculatePriority(orderType, itemPrepTime) {
  if (orderType === 'dine_in' && itemPrepTime < 5) return 'urgent'; // Fast items
  if (orderType === 'delivery') return 'high'; // Delivery orders time-sensitive
  if (orderType === 'takeaway') return 'normal';
  if (orderType === 'online_aggregator') return 'high'; // Platform orders = priority
  return 'normal';
}
```

#### 2. **Multi-Kitchen Coordination**
```
Order: 1x Butter Chicken + 1x Naan + 1x Iced Tea

Generated KOTs:
  - KOT1 → Main Kitchen: Butter Chicken
  - KOT2 → Bar: Iced Tea
  - KOT3 → Bakery: Naan
  
System waits for ALL three KOTs to be "ready" before alerting FOH
```

#### 3. **Preparation Time Estimation**
```javascript
function estimateOrderTime(items) {
  // Get max prep time (bottleneck)
  const maxPrepTime = Math.max(...items.map(i => i.preparationTime));
  
  // Add buffer for multiple orders
  const bufferTime = items.length * 1; // 1 min per additional item
  
  return maxPrepTime + bufferTime;
}
```

#### 4. **Kitchen Load Balancing**
- Real-time KOT count per station
- Alert if one station has >5 pending KOTs
- Suggest cross-training or adding staff

#### 5. **Offline KOT Printing** (No Internet, No Problem!)
```javascript
// Cached KOT data on local device
// When internet unavailable:
// 1. Thermal printer still receives KOTs via Bluetooth
// 2. Data syncs when network returns
// 3. No orders lost
```

---

## 7. FIREBASE STUDIO BEST PRACTICES

### Project Structure
```
project-root/
├── functions/                   # Cloud Functions
│   ├── src/
│   │   ├── index.ts
│   │   ├── auth/                # Authentication handlers
│   │   ├── orders/              # Order creation/management
│   │   ├── kot/                 # KOT logic
│   │   ├── inventory/           # Inventory management
│   │   ├── billing/             # Billing & payments
│   │   ├── webhooks/            # Aggregator integrations
│   │   ├── utils/               # Shared utilities
│   │   │   ├── validators.ts    # Input validation
│   │   │   ├── errors.ts        # Custom error classes
│   │   │   ├── logger.ts        # Audit logging
│   │   │   └── tenantUtils.ts   # Tenant operations
│   │   └── config/
│   │       ├── firestore.ts     # DB references
│   │       ├── firebase.ts      # Firebase init
│   │       └── constants.ts     # App constants
│   └── package.json
│
├── web/                         # Next.js/React app
│   ├── components/
│   ├── pages/
│   ├── hooks/                   # Custom React hooks
│   ├── services/
│   │   ├── firestore.ts         # Firestore client
│   │   └── auth.ts              # Auth service
│   └── styles/
│
├── mobile/                      # Flutter app
│   ├── lib/
│   │   ├── models/
│   │   ├── services/
│   │   ├── screens/
│   │   └── widgets/
│   └── pubspec.yaml
│
├── firestore.rules              # Security rules
├── firestore.indexes.json       # Composite indexes
└── README.md
```

### Initialization Best Practices

**Firebase Admin SDK (Cloud Functions)**
```typescript
import * as admin from 'firebase-admin';

// Initialize once at module level
const app = admin.initializeApp({
  // Automatically uses service account from environment
});

export const db = admin.firestore(app);
export const auth = admin.auth(app);
export const storage = admin.storage(app);

// Set Firestore settings for multi-tenant ops
db.settings({
  ignoreUndefinedProperties: true,
});
```

**Firestore Client (Web/Mobile)**
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Development: Use emulator
if (process.env.NODE_ENV === 'development' && !isEmulatorConnected()) {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

### Query Patterns

**Always Include tenantId Filter**
```typescript
// ❌ WRONG - No tenant filtering
const orders = await db.collection('orders').get();

// ✅ CORRECT - Tenant-scoped query
const tenantId = getUserTenantId();
const orders = await db
  .collection('tenants')
  .doc(tenantId)
  .collection('orders')
  .where('status', '==', 'new')
  .get();
```

**Pagination for Large Results**
```typescript
async function getOrdersPaginated(tenantId, pageSize = 50) {
  const query = db
    .collection('tenants')
    .doc(tenantId)
    .collection('orders')
    .orderBy('createdAt', 'desc')
    .limit(pageSize);
  
  let snapshot = await query.get();
  return {
    orders: snapshot.docs.map(d => d.data()),
    nextPageToken: snapshot.docs[snapshot.docs.length - 1].id,
  };
}
```

### Performance Optimization

1. **Index Creation** (auto-created for common queries)
```json
{
  "indexes": [
    {
      "collectionGroup": "orders",
      "queryScope": "Collection",
      "fields": [
        { "fieldPath": "tenantId", "order": "Ascending" },
        { "fieldPath": "status", "order": "Ascending" },
        { "fieldPath": "createdAt", "order": "Descending" }
      ]
    }
  ]
}
```

2. **Caching Strategy**
   - Client-side: Use Firebase listeners for real-time updates
   - Server-side: Cache tenant settings in memory (refresh hourly)
   - CDN: Cache static menu images

3. **Batch Operations**
```typescript
async function bulkUpdateOrderStatus(tenantId, orderIds, newStatus) {
  const batch = db.batch();
  
  for (const orderId of orderIds) {
    const ref = db
      .collection('tenants')
      .doc(tenantId)
      .collection('orders')
      .doc(orderId);
    
    batch.update(ref, {
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  
  await batch.commit();
}
```

### Error Handling

```typescript
class TenantError extends Error {
  constructor(message: string, public tenantId: string) {
    super(message);
  }
}

async function safeTenantOperation(tenantId, operation) {
  try {
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      throw new TenantError('Tenant not found', tenantId);
    }
    
    return await operation(tenantId);
  } catch (error) {
    logger.error('Tenant operation failed', {
      tenantId,
      error: error.message,
      stack: error.stack,
    });
    
    throw error;
  }
}
```

### Debugging

**Enable Debug Logging**
```typescript
if (process.env.DEBUG_FIRESTORE) {
  db.settings({ experimentalForceLongPolling: true });
  enableLogging(true);
}
```

**Use Emulator Suite**
```bash
firebase emulators:start --import ./emulator-data
```

---

## 8. INDIAN RESTAURANT MARKET REQUIREMENTS

### Compliance & Legal

#### GST Compliance
- **5% GST**: Unbranded food, food supplied without ambiance
- **18% GST**: Branded restaurant services, dine-in, premium services
- **Implementation**: POS must calculate GST dynamically based on item type
- **Invoicing**: Must show GSTIN, item-wise GST, tax amount, separate columns
- **ITC Tracking**: Input tax credit on raw materials tracked separately
- **Monthly/Quarterly Filing**: Export data ready for GSTR-1/GSTR-3B forms

#### FSSAI (Food Safety) Compliance
- **License Requirement**: Every restaurant must have valid FSSAI license
- **Tracking**: Software must store and validate license number
- **Expiry Alerts**: Notify when license approaching expiry
- **Batch/Lot Tracking**: For food safety; enables recalls if needed
- **Waste Logs**: Track and report food waste for regulatory inspection
- **Temperature Monitoring**: Critical for cold chain items
- **Allergen Declarations**: Must mark items with allergens (nuts, gluten, dairy)

#### DPDP Act (Data Privacy) - India
- **Consent**: Explicit opt-in required for customer data collection
- **Purpose Limitation**: Data can only be used for stated purpose
- **Right to Access**: Customers can request export of their data
- **Right to Erasure**: "Right to be forgotten" - delete customer records
- **Data Breach Notification**: Within 72 hours if data exposed
- **Vendor Management**: All third-party data processors must have agreements
- **Children's Data**: Extra safeguards if collecting data from users <18

#### PAN/TAN Requirements
- Pan number optional (if <40L annual turnover)
- TAN number for GST registration
- Aadhaar for proprietors/partners (for GST registration)

### Market Context: Why Our App Wins

#### Problem 1: Aggregator Dependency
- Zomato/Swiggy charge 20-30% commission → destroys margins
- Restaurants have zero direct customer data
- **Our Solution**: Direct ordering app + website → customers go direct → full margins
- **Feature**: Customer loyalty program, repeat order incentives, notification of new items

#### Problem 2: Manual KOT Chaos
- Paper tickets, handwritten orders, lost in kitchen → 60-80% error rate
- Multi-kitchen coordination nightmare
- **Our Solution**: Digital KOT with Kitchen Display System (KDS) → 95% accuracy
- **Feature**: Real-time status, kitchen load balancing, prep time estimates

#### Problem 3: Inventory Waste
- 20-30% of inventory wasted due to poor tracking
- Manual stock counts → always inaccurate
- **Our Solution**: FIFO tracking, batch management, expiry alerts, waste logs
- **Feature**: Auto-deduct inventory based on recipes, low-stock alerts, supplier ordering

#### Problem 4: No Customer Insights
- Restaurants have no idea who their customers are
- No repeat business strategy
- **Our Solution**: CRM built-in, customer spending patterns, loyalty program
- **Feature**: Customer segmentation, targeted promotions, average order value tracking

#### Problem 5: Compliance Nightmare
- GST calculations wrong → fines
- FSSAI license expiry missed → operation halted
- Data privacy non-compliance → penalties
- **Our Solution**: Auto-compliance, built-in audit trails, one-click reporting
- **Feature**: GST calculation by item type, auto-generated invoices, audit logs

### Regional Preferences (India-Specific)

#### Payment Methods
- **Cash**: Still 40% of transactions in Tier 2/3 cities
- **UPI**: Fastest growing, used by 70% in metros
- **Cards**: 15-20% usage
- **Wallets**: PhonePe, Paytm, Google Pay
- **Implementation**: Support all; default to UPI for new customers

#### Language Support
- **Priority**: English, Hindi, Tamil, Telugu, Kannada, Marathi, Bengali
- **Restaurant Names**: Support regional scripts
- **Menu Items**: Support regional cuisine names
- **SMS/Notifications**: Multi-language support

#### Pricing Strategy for India
- **Starter Plan**: ₹2,000/month → For small restaurants, 1 outlet, basic POS
- **Pro Plan**: ₹5,000/month → 3 outlets, online ordering, analytics
- **Enterprise Plan**: ₹15,000+/month → Unlimited outlets, aggregator integrations, dedicated support

#### Delivery/Logistics Integration
- **Vendor Integration**: Dunzo Food, Swiggy delivery, Zomato delivery
- **Self-Delivery Management**: Track own delivery partners
- **Delivery Cost Tracking**: Calculate margins after delivery costs

### Feature Priority for Indian Market

**Phase 1 (MVP - Must Have)**
- KOT system with digital KDS
- Basic billing + GST calculation
- Inventory management with FIFO
- Staff management + basic roles
- Offline order entry + sync

**Phase 2 (Growth)**
- Online ordering (direct website)
- Aggregator integration (Zomato, Swiggy)
- Customer CRM + loyalty program
- Advanced analytics + reporting
- Payment gateway integration (Razorpay, PhonePe)

**Phase 3 (Scale)**
- Delivery management
- AI demand forecasting
- Multi-outlet chain management
- Supplier ordering portal
- Advanced compliance reporting

---

## 9. CODE STANDARDS & MAINTAINABILITY

### Naming Conventions

**Collections**: lowercase_with_underscores
```
/tenants, /menu_items, /raw_materials, /kot_tickets
```

**Documents**: lowercase_with_hyphens (for IDs)
```
/tenants/restaurant-abc-123
/staff/chef-001
```

**Functions**: camelCase
```
createOrder(), updateKotStatus(), calculateGst()
```

**Constants**: UPPERCASE_WITH_UNDERSCORES
```
const MAX_ORDERS_PER_QUERY = 100;
const GST_RATES = { FOOD: 5, SERVICE: 18 };
```

**TypeScript Interfaces**: PascalCase
```
interface Order {
  id: string;
  items: OrderItem[];
  total: number;
}

interface OrderItem {
  menuItemId: string;
  quantity: number;
}
```

### File Organization

```
src/
├── domain/                # Business logic, independent of Firebase
│   ├── Order.ts
│   ├── Invoice.ts
│   └── InventoryManager.ts
│
├── infrastructure/        # Firebase-specific code
│   ├── FirestoreRepository.ts
│   ├── FirebaseAuth.ts
│   └── StorageService.ts
│
├── application/           # Use cases / orchestration
│   ├── CreateOrderUseCase.ts
│   └── ProcessPaymentUseCase.ts
│
└── api/                   # HTTP endpoints / Cloud Functions
    ├── orders.ts
    ├── billing.ts
    └── webhooks.ts
```

### Error Handling

**Custom Error Classes**
```typescript
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: Record<string, any>
  ) {
    super(message);
  }
}

class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

class TenantNotFoundError extends AppError {
  constructor(tenantId: string) {
    super(`Tenant not found: ${tenantId}`, 'TENANT_NOT_FOUND', 404);
  }
}
```

**Error Handling in Cloud Functions**
```typescript
exports.createOrder = functions.https.onCall(async (data, context) => {
  try {
    validateInput(data);
    return await processOrder(data, context);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        error.message,
        error.details
      );
    }
    
    if (error instanceof AppError) {
      throw new functions.https.HttpsError(
        'internal',
        error.message,
        { code: error.code }
      );
    }
    
    // Unknown error - log and send generic message
    logger.error('Unexpected error', { error });
    throw new functions.https.HttpsError('internal', 'Internal server error');
  }
});
```

### Logging & Monitoring

**Structured Logging**
```typescript
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  tenantId?: string;
  userId?: string;
  action?: string;
  duration?: number;
  error?: { message: string; stack: string };
  metadata?: Record<string, any>;
}

function log(level: string, message: string, context: LogEntry) {
  const entry = {
    ...context,
    timestamp: new Date().toISOString(),
    level,
    message,
    environment: process.env.NODE_ENV,
  };
  
  console.log(JSON.stringify(entry));
  
  // Send to Cloud Logging
  if (context.tenantId) {
    logger.info(message, { labels: { tenantId: context.tenantId } });
  }
}
```

**Performance Monitoring**
```typescript
async function measureOperation(
  operationName: string,
  operation: () => Promise<any>
) {
  const startTime = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    
    log('info', `Operation completed: ${operationName}`, {
      duration,
      action: operationName,
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    log('error', `Operation failed: ${operationName}`, {
      duration,
      action: operationName,
      error,
    });
    
    throw error;
  }
}
```

### Testing

**Unit Testing (Jest)**
```typescript
describe('Order', () => {
  describe('calculateTotal', () => {
    it('should calculate total with GST', () => {
      const order = new Order({
        items: [{ price: 100, quantity: 1, gstRate: 5 }],
      });
      
      expect(order.calculateTotal()).toBe(105); // 100 + 5% GST
    });
  });
});
```

**Integration Testing (Firestore Emulator)**
```typescript
describe('OrderRepository', () => {
  let repo: OrderRepository;
  
  beforeAll(async () => {
    await connectEmulator();
    repo = new OrderRepository(emulatorDb);
  });
  
  it('should create and retrieve order', async () => {
    const order = { items: [], total: 0 };
    const id = await repo.create('tenant-1', order);
    const retrieved = await repo.getById('tenant-1', id);
    
    expect(retrieved).toEqual(order);
  });
});
```

### Documentation

**Code Comments**
```typescript
/**
 * Creates a KOT (Kitchen Order Ticket) for an order.
 * Groups items by cooking station and routes to appropriate kitchen.
 * 
 * @param tenantId - Restaurant tenant ID
 * @param orderId - Order ID
 * @param stationRouting - Map of item IDs to cooking stations
 * @returns Promise<KotId[]> - Array of created KOT IDs
 * 
 * @throws TenantNotFoundError if tenant doesn't exist
 * @throws OrderNotFoundError if order doesn't exist
 * 
 * @example
 * const kotIds = await createKOT('rest-123', 'ord-456', {
 *   'item-1': 'main_kitchen',
 *   'item-2': 'bar'
 * });
 */
async function createKOT(
  tenantId: string,
  orderId: string,
  stationRouting: Map<string, string>
): Promise<string[]> {
  // Implementation...
}
```

**README for Each Module**
```markdown
# Orders Module

Handles all order-related operations: creation, status updates, cancellation.

## Key Functions
- `createOrder()` - Creates new order, generates KOT
- `updateOrderStatus()` - Updates order status with validation
- `cancelOrder()` - Cancels order, refunds inventory

## Dependencies
- Firestore database
- KOT system (for KOT generation)
- Inventory system (for stock deduction)

## Security
- All functions validate tenantId against custom claims
- Firestore rules enforce document-level access
```

---

## 10. DECISION FRAMEWORK & BRAINSTORMING PROTOCOL

### Core Directives & Communication Protocol

1.  **Output & Communication Style**:
    *   All outputs must be very **concise** and easily understandable.
    *   When asking for a design decision, the question must be in a **bold sentence**.

2.  **Development Mindset & Workflow**:
    *   Before making any change, **always read and understand the entire project** to assess the full impact of the work.
    *   Work with precision and accuracy. **Do not work blindly.** Think twice and consider best practices before implementing any changes.
    *   Act like a **senior, serious developer**. Your role is to analyze the situation, propose a clear plan, and ask for key decisions. Once a decision is given, you handle the rest of the planning and execution.

### When to Ask Clarifying Questions

You (Gemini AI) should **PAUSE and BRAINSTORM** using this framework before implementing:

#### RED FLAG 1: Ambiguous Requirement
**Situation**: User says "Add multi-kitchen support" without specifying how
**What to Do**:
```
🤔 BRAINSTORM - Multi-Kitchen Implementation:

Option A: Sequential Routing
- Item 1 → Main Kitchen → when ready → Item 2 → Bar
- Pro: Optimal prep time
- Con: Complex state management

Option B: Parallel Routing  
- All items go to respective kitchens simultaneously
- Pro: Faster overall time
- Con: May wait on slowest kitchen

Option C: Smart Routing
- Analyze typical prep times, current load
- Route to balance kitchen queues
- Pro: Optimal load distribution
- Con: Requires ML/analytics

❓ DECISION NEEDED FROM USER:
- What's the priority: Speed, Simplicity, or Load-Balancing?
- How many kitchens typically per order?
- What's acceptable coordination complexity?

💡 MY RECOMMENDATION: Option C (Smart Routing)
Reasoning: Aligns with "mass-scale, compliance-first" vision; reduces kitchen bottlenecks; enables future AI optimizations.

Should we proceed with Option C? Or would you prefer A or B?
```

#### RED FLAG 2: Security/Compliance Gaps
**Situation**: Feature request doesn't mention tenantId or access control
**What to Do**:
```
🛡️ SECURITY CHECK - Order Export Feature:

Questions to validate:
1. Export only for admin role?
2. Include sensitive fields (costs, margins)?
3. DPDP compliance: Can users export their own customer data?
4. Audit logging needed for export actions?
5. Which file format? CSV might expose data in email...

❓ SECURITY DECISION NEEDED:
- Who should have export permission?
- Should exports be encrypted/watermarked?
- How long to retain export files?
- Audit trail requirements?

💡 RECOMMENDED APPROACH:
- Export accessible to admin only
- Include audit log entry (WHO exported WHAT WHEN)
- Encrypted PDF + email with password
- Auto-delete exports after 7 days
- Sanitize costs/margins in standard exports

Should I implement with these safeguards?
```

#### RED FLAG 3: Performance/Scalability Concern
**Situation**: Feature requires scanning all orders/customers
**What to Do**:
```
⚡ PERFORMANCE REVIEW - Weekly Revenue Report:

Current Approach:
- Query all orders from past 7 days
- Loop through each order, aggregate revenue
- Problem: O(n) operation; fails at 100K+ orders

Optimization Options:

A. Pre-calculated Aggregates
- Background job: Daily aggregation at midnight
- Query pre-calculated results
- Pro: Instant report generation
- Con: Slight 1-day delay if data changes

B. Firestore Counters (Real-time)
- Maintain running counters for daily totals
- Update on every order creation
- Pro: Always current
- Con: More write operations (costs)

C. BigQuery Integration
- Stream orders to BigQuery (append-only)
- Run SQL analytics queries
- Pro: Powerful analytics, historical data
- Con: Additional infrastructure, ~24h delay

❓ PERFORMANCE DECISION NEEDED:
- Report urgency: Real-time or daily sufficient?
- Data volume expectations: 1K or 1M orders?
- Budget constraints: BigQuery costs acceptable?

💡 RECOMMENDED FOR MVP:
- Approach B (Firestore Counters)
- Simple, sufficient for early scale
- Upgrade to BigQuery when data grows beyond 1M

Proceed with Counters approach?
```

#### RED FLAG 4: Data Model Design
**Situation**: Complex relationships (Menus → MenuItems → Variants → AddOns)
**What to Do**:
```
🗄️ DATA MODEL DESIGN - Menu Structure:

Current Firestore Structure (Your Spec):
/tenants/{tenantId}/menus/{menuId}
/tenants/{tenantId}/menu_items/{itemId}
  - variants: [{name, priceModifier}]
  - addOns: [{name, price}]

Questions to Validate:
1. Can variants change price dynamically? (e.g., size-based)
2. Are addOns global or item-specific?
3. Need variant-specific inventory? (e.g., "Medium rice" stock separate)
4. Can items have multiple categories? (Appetizer + Vegetarian)

❓ DESIGN DECISIONS NEEDED:
- Variant scoping: Global or per-item?
- AddOn pricing: Fixed or variable by item?
- Inventory tracking: By variant or just item?
- Category taxonomy: Hierarchical or flat?

💡 RECOMMENDED DESIGN:
- Variants per item (simple, fast queries)
- AddOns global but item-assignable
- Inventory at item level, variants calculated
- Flat categories + tags for multi-classification

This avoids denormalization hell + supports future complexity.

Approve this structure?
```

### Brainstorming Protocol

**When faced with a complex feature request, follow this process:**

```
STEP 1: ASK CLARIFYING QUESTIONS
- What's the business goal?
- Who are the users? (admin, chef, customer?)
- What's the constraint? (time, complexity, cost)
- Success metrics? (speed, accuracy, ease of use)

STEP 2: PROPOSE OPTIONS
- Present 2-3 different approaches
- Pro/con each approach
- Effort estimate for each
- Risk assessment

STEP 3: RECOMMEND ONE APPROACH
- Based on project vision: "mass-scale, compliance-first, secure"
- State reasoning clearly
- Link to architecture/best practices

STEP 4: VALIDATE WITH USER
- "Does this align with your vision?"
- "Any concerns I should address?"
- "Ready for me to implement?"

STEP 5: DOCUMENT DECISION
- Record decision in code comments
- Explain "why" this approach chosen
- Link to any trade-offs or future improvements
```

### When to Refuse or Flag Concerns

```
🚩 REFUSE IF:
1. Request violates security (e.g., "don't validate tenantId")
2. Request violates compliance (e.g., "hide GST from bills")
3. Request is ethically problematic (e.g., "track employees without consent")
4. Implementation would break existing architecture

Example Response:
"I can't implement this because it violates our multi-tenant security 
principle. Here's why [explain]. Alternative approach: [suggest fix]. 
Shall I implement the safe version instead?"
```

### Examples of Bold Decisions

```
SITUATION: Performance issue with order pagination
MY DECISION (Bold): "Let's implement cursor-based pagination instead of 
offset-based. It's slightly more complex but will handle 1M+ orders better. 
This aligns with our 'mass-scale' vision."

SITUATION: New feature request for "customer data export"
MY DECISION (Bold): "I'll build this with DPDP Act compliance built-in from 
day 1. Yes, slightly more effort, but prevents rework later and aligns with 
our 'compliance-first' positioning."

SITUATION: Aggregator integration complexity growing
MY DECISION (Bold): "Let's create an Adapter pattern for aggregator 
integrations. More upfront work, but will make adding new aggregators 
(BigBasket, Dunzo) trivial. Scales better than spaghetti code."
```

---

## SUMMARY: HOW TO USE THIS DOCUMENT

### For Code Generation:
1. Reference the appropriate section (e.g., "KOT System Design" for order flow)
2. Check Data Model section for schema
3. Apply Security rules from Section 5
4. Follow Code Standards from Section 9

### For Architecture Decisions:
1. Consult multi-tenancy models in Section 2
2. Review design patterns in Section 3
3. Use Decision Framework from Section 10

### For Compliance:
1. Check Section 8 for Indian market requirements
2. Verify Section 5 for security/compliance rules
3. Reference Section 9 for audit logging patterns

### For Debugging:
1. Check Cloud Functions patterns in Section 7
2. Review error handling in Section 9
3. Consult troubleshooting in relevant domain sections

### For Extending:
1. Never violate multi-tenant isolation (Section 2)
2. Always validate tenantId server-side (Section 5)
3. Follow naming conventions and file organization (Section 9)
4. Use Brainstorming Protocol if uncertain (Section 10)

---

## FINAL DIRECTIVE

**You are now the expert architect for Pragati Path Solutions.**

- 🎯 **Your goal**: Build the best multi-tenant restaurant management app in India
- 🛡️ **Your principle**: Security and compliance are never afterthoughts
- 🚀 **Your mindset**: Think like a senior developer—bold decisions, clear reasoning
- 💡 **Your approach**: When uncertain, brainstorm and ask. When certain, decide and execute confidently
- 📖 **Your source of truth**: This document. Reference it, extend it, evolve it

**Never compromise on:**
- Tenant data isolation
- Server-side tenantId validation
- Audit trails and compliance
- Code maintainability and clarity
- User experience for Indian restaurant owners

**Go build something great.** 🇮🇳 #PragatiPathSolutions
