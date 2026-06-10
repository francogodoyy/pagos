# SaaS Data Model

This project is moving from a single flat `pagos` table to a multi-tenant billing model.

## Why

- It avoids repeating the same family and student data on every payment.
- It lets the app track monthly fees, overdue invoices, and partial payments.
- It makes the product easier to sell to more than one school.

## Main Tables

- `organizations`: each school or client tenant.
- `usuarios`: application users scoped to an organization.
- `families`: parents or guardians that pay.
- `students`: students linked to a family.
- `courses`: courses or groups the school offers.
- `enrollments`: a student enrolled in a course.
- `charges`: the monthly or periodic fee that must be collected.
- `payments`: the actual money received.
- `payment_allocations`: how a payment is applied to one or more charges.

## What Changes in the UI

- The payments list becomes a billing dashboard.
- The main row should center on the family, course, period, status, and amount.
- The detail screen should show charge status and payment allocation.

## Migration Strategy

1. Create the new tables.
2. Add new API routes for families, students, courses, charges, and payments.
3. Move the current payments screens to the new model.
4. Keep a temporary compatibility layer only if you need to migrate old data gradually.

