# Link Harmony — System 

## Purpose
This document defines the actual working logic of the system. It is not written for marketing or presentation. It exists to eliminate ambiguity in how the system operates.

---

## Core System Definition

Link Harmony is a transaction system that connects buyers and publishers for guest post orders.

The system is only considered functional if a buyer can complete one full order cycle without manual intervention.

---

## Core Flow: Order Lifecycle

1. Buyer selects a website
2. Buyer places an order
   - status: pending

3. Publisher receives order
   - can accept or reject

4. If accepted:
   - status: in_progress

5. Publisher submits post (URL or proof)
   - status: submitted

6. Buyer reviews submission
   - approve → status: completed
   - reject → status: revision_required

7. If revision required:
   - publisher resubmits
   - status: submitted

8. Optional edge cases:
   - cancellation
   - dispute (not fully implemented)

---

## State Machine (Strict Rules)

Allowed transitions:

- pending → accepted / rejected
- accepted → in_progress
- in_progress → submitted
- submitted → completed / revision_required
- revision_required → submitted
- any → cancelled (edge case)

No other transitions are valid.

---

## Database Design (Minimum Required)

### users
- id
- email
- role (buyer | publisher | admin)
- created_at

### websites
- id
- publisher_id (FK → users)
- domain
- niche
- price
- metrics (DR, traffic)

### orders (CORE TABLE)
- id
- buyer_id (FK → users)
- website_id (FK → websites)
- status
- price
- requirements (text)
- submission_url
- created_at

### order_messages
- id
- order_id (FK)
- sender_id
- message
- created_at

### reviews
- id
- order_id
- rating
- comment

---

## API Responsibilities (Conceptual)

Buyer:
- create_order()
- view_orders()

Publisher:
- accept_order()
- reject_order()
- submit_post()

Buyer Actions:
- approve_order()
- request_revision()

System:
- enforce state transitions

---

## Current System Status

Mark each clearly during development:

- Order creation: [ ]
- Order acceptance: [ ]
- Submission flow: [ ]
- Approval/revision: [ ]
- Full cycle completion: [ ]

System is NOT complete until all are working end-to-end.

---

## Non-Core (Ignore Until Core Works)

The following are intentionally excluded until the core loop is stable:

- AI recommendations
- Advanced analytics
- Escrow payments
- Messaging enhancements

---

## Failure Conditions (Kill Switch)

Stop development and fix system if:

- Orders require manual database edits
- State transitions are bypassed
- Users are confused about next step

---

## Single Success Metric

The system succeeds only if:

One buyer can complete one full order without developer intervention.

Anything else is secondary.

