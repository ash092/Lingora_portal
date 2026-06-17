# Lingora Vendor Portal TODO

## Admin Pages
- [x] AdminLayout component with sidebar navigation
- [x] AdminDashboard page with stats overview, pending approvals, recent invoices
- [x] AdminVendors page with searchable/filterable vendor database and CSV export
- [x] AdminVendorProfile page with full vendor details, tier assignment, notes, POs, invoices
- [x] AdminPOs page with PO list, status filters, cancel action
- [x] AdminCreatePO page for creating and sending purchase orders
- [x] AdminInvoices page with invoice management, overdue tracking, status updates, CSV export
- [x] AdminEmail page for batch email composition, template management, sending
- [x] SuperAdminAudit page for audit log viewing

## Freelancer Pages
- [x] FreelancerDashboard with stats, pending POs, recent invoices
- [x] FreelancerPOs page with accept/decline workflow
- [x] FreelancerInvoices page with invoice list
- [x] FreelancerProfile page with editable contact, services, languages, payment info, CV upload
- [x] SubmitInvoice page with PO prefill, file upload, Net 45 due date

## App Routing
- [x] All admin routes registered in App.tsx
- [x] All freelancer sub-pages registered in App.tsx (/purchase-orders, /invoices, /invoices/submit, /profile)
- [x] /admin/pos/create route added

## TypeScript
- [x] All TypeScript errors resolved (0 errors from tsc --noEmit)
- [x] Correct API input shapes for getMyPOs, getMyInvoices (require freelancerId)
- [x] Correct po.respond action values ("accept"/"decline" not "accepted"/"declined")
- [x] Correct field names (bankSwiftCode not bankSwift, no city/paymentInfo/nationality)
- [x] Explicit types on all .map() callbacks

## UX Fixes (Round 2)
- [x] Registration form: required field validation (can't proceed with empty required fields)
- [x] Email format validation (must be valid email format)
- [x] Dynamic expertise sub-phases based on selected services (translation → languages → rates, etc.)
- [x] Full language dropdown (200+ languages, searchable)
- [x] Flexible rate fields (text input for non-per-word units, numeric for per-word)
- [x] Email/password login for freelancers (freelancer_session JWT cookie)
- [x] Google OAuth sign-in button on login page (routes to Manus OAuth for admin)
- [x] Admin dashboard: Quick Actions bar (Create PO, Search Vendors, Review Invoices, Send Email)
- [x] Admin sidebar: Create PO button always visible
- [x] TypeScript: 0 errors after all changes

## Pending / Future
- [ ] Email sending requires SMTP configuration (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS env vars)
- [ ] Admin account creation UI (currently done via direct DB insert)
- [ ] Freelancer password reset flow
- [ ] Bulk PO creation

## Google OAuth for Vendors (Round 3)
- [x] OAuth callback: detect vendor vs admin by checking freelancers table, issue freelancer_session cookie for vendors
- [x] Login page: Google button signs vendors in (not admins), admin path is a discreet link
- [x] Register page: "Continue with Google" option to pre-fill name/email from Google profile
- [x] Handle new vendor via Google (no password required, redirect to complete profile)

## Bug Fixes (Round 4)
- [x] Admin login broken: fixed — vendor intent now carried as ?intent=vendor query param on redirectUri, not in state, so sdk state decoding works correctly for both admin and vendor flows
- [x] Admin login: OAuth callback now redirects to /admin; Landing page also auto-redirects authenticated admins to /admin and vendors to /dashboard

## Email Targeting Enhancements (Round 5)
- [x] Backend: add filterSourceLanguage and filterTargetLanguage to email.send procedure
- [x] Backend: update listFreelancers db helper to support language pair filtering
- [x] Frontend: language pair filter dropdowns (source + target) in email composer
- [x] Frontend: live recipient preview list with checkboxes for manual vendor deselection
- [x] Frontend: recipient count badge showing how many vendors will receive the email

## In-Portal Messaging System (Round 6)
- [ ] Database: messages table (id, freelancerId, senderRole, body, poId?, invoiceId?, isRead, createdAt)
- [ ] Backend: messages router (send, getThread, markRead, getUnreadCount)
- [ ] Admin UI: Messages page with conversation list, unread badges, thread view, send reply
- [ ] Vendor UI: Messages tab in dashboard with thread view and send message
- [ ] Email notifications: vendor notified on new admin message, admin notified at vm@lingoraloc.com on new vendor message
- [ ] Admin sidebar: Messages nav item with unread count badge
- [ ] Vendor dashboard: Messages tab with unread indicator
