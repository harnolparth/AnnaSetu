AnnaSetu -- Food Donation Management System

AnnaSetu is a web-based **Food Donation Management System** that
connects food donors, NGOs, and volunteers to help collect and
distribute surplus food efficiently.

The system provides separate interfaces for:

-   **Donors** -- register, log in, publish food donations, view
    donation status, and respond to NGO requests.
-   **NGOs** -- view available food, request donations, track requests,
    and view deliveries.
-   **Volunteers** -- manage availability, view available delivery
    tasks, accept deliveries, and update delivery status.
-   **Admin** -- view system statistics and registered users.

The project uses a **Flask REST API with direct PostgreSQL SQL queries**
for the backend and a **multi-page HTML/CSS/JavaScript frontend**.

------------------------------------------------------------------------

1. Project Objectives

The main objectives of AnnaSetu are:

1.  Reduce food wastage by connecting surplus-food donors with NGOs.
2.  Provide NGOs with a simple way to find and request available food.
3.  Provide volunteers with delivery tasks and delivery-status
    management.
4.  Maintain donation, request, delivery, and notification records in
    PostgreSQL.
5.  Provide role-based access using JWT authentication.
6.  Provide map-based views for pickup and delivery locations.
7.  Provide an admin interface for basic system monitoring.

------------------------------------------------------------------------

2. Technology Stack

Backend

-   Python
-   Flask
-   PostgreSQL
-   Psycopg 3
-   Psycopg Pool
-   Flask-JWT-Extended
-   Flask-CORS
-   python-dotenv
-   Werkzeug password hashing

Frontend

-   HTML5
-   CSS3
-   JavaScript
-   Leaflet.js
-   OpenStreetMap
-   Nominatim geocoding

Database

-   PostgreSQL
-   Direct SQL queries
-   No SQLAlchemy / ORM

------------------------------------------------------------------------

3. Project Structure

AnnaSetu/
│
├── Backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── admin.py
│   │   │   ├── auth.py
│   │   │   ├── delivery.py
│   │   │   ├── donor.py
│   │   │   ├── ngo.py
│   │   │   ├── notification.py
│   │   │   └── volunteer.py
│   │   ├── auth_utils.py
│   │   ├── db.py
│   │   ├── utils.py
│   │   └── __init__.py
│   │
│   ├── database/
│   │   ├── database.sql
│   │   ├── queries.sql
│   │   └── README_SQL.txt
│   │
│   ├── requirements.txt
│   ├── run.py
│   └── README.md
│
└── Frontend/
   ├── admin/
   ├── donor/
   ├── ngo/
   ├── volunteer/
   ├── js/
   ├── style.css
   └── index.html

------------------------------------------------------------------------

4. Database Design

The project contains seven main database tables:

  Table             Purpose
  ----------------- -----------------------------------------------------
  `donor`           Stores donor account and profile information
  `ngo`             Stores NGO account and profile information
  `volunteer`       Stores volunteer account, vehicle, and availability
  `food_donation`   Stores food donation details and status
  `request`         Stores NGO requests for food donations
  `delivery`        Stores delivery assignment and delivery status
  `notification`    Stores notifications for system users

 Main Workflow

Donor
  │
  │ Publish food donation
  ▼
Food Donation
  │
  │ Available to NGOs
  ▼
NGO
  │
  │ Request donation
  ▼
Donor
  │
  ├── Accept ──► Delivery Created
  │                    │
  │                    ▼
  │                Volunteer
  │                    │
  │                    ▼
  │              Food Pickup
  │                    │
  │                    ▼
  │              On The Way
  │                    │
  │                    ▼
  │                Delivered
  │
  └── Reject ──► Request Rejected

If multiple NGOs request the same donation, the donor can accept one
request; the backend workflow prevents two concurrent donor decisions
from accepting the same donation.

------------------------------------------------------------------------

5. User Roles

Donor

Donors can:

-   Register an account.
-   Log in.
-   Add food donations.
-   Enter food name, type, quantity, meals, availability, expiry, and
    pickup address.
-   Use the browser's location feature for pickup location.
-   View their donations.
-   View NGO requests for a donation.
-   Accept or reject NGO requests.
-   Receive notifications.

NGO

NGOs can:

-   Register and log in.
-   View currently available donations.
-   Request a donation.
-   View their requests.
-   View deliveries related to accepted requests.
-   View pickup/delivery locations on the map.
-   Receive notifications.

Volunteer

Volunteers can:

-   Register and log in.
-   Set their availability.
-   View available delivery tasks.
-   Accept a delivery.
-   View assigned deliveries.
-   Update delivery status.
-   View pickup and NGO locations on the map.
-   Receive notifications.

Admin

The admin is a system-level role and does not require a separate
database table.

Admin can:

-   Log in using credentials configured in the environment file.
-   View system statistics.
-   View registered users.

Admin registration is not provided.

------------------------------------------------------------------------

6. Donation and Delivery Status

Donation Status

The database supports statuses such as:

Available
Pending
Accepted
Picked Up
On The Way
Delivered
Cancelled
Expired

Request Status

Pending
Accepted
Rejected
Completed
Cancelled

Delivery Status

Available
Accepted
Picked Up
On The Way
Delivered
Cancelled

------------------------------------------------------------------------

7. Backend API

The backend runs as a Flask REST API.

Authentication

POST /api/auth/register/donor
POST /api/auth/register/ngo
POST /api/auth/register/volunteer
POST /api/auth/login

Donor APIs

POST   /api/donors/donations
GET    /api/donors/donations
GET    /api/donors/donations/<donation_id>
PUT    /api/donors/donations/<donation_id>
DELETE /api/donors/donations/<donation_id>
GET    /api/donors/donations/<donation_id>/requests
PATCH  /api/donors/requests/<request_id>/decision

NGO APIs

GET  /api/ngos/donations/available
POST /api/ngos/donations/<donation_id>/requests
GET  /api/ngos/requests
GET  /api/ngos/deliveries
GET  /api/ngos/profile

Volunteer APIs

GET   /api/volunteers/profile
PATCH /api/volunteers/availability

GET   /api/deliveries/available
GET   /api/deliveries/my
POST  /api/deliveries/<delivery_id>/accept
PATCH /api/deliveries/<delivery_id>/status

Notification APIs

GET   /api/notifications
PATCH /api/notifications/<notification_id>/read

Admin APIs

GET /api/admin/stats
GET /api/admin/users

Health Check

GET /api/health
Expected response:

``` json
{
  "status": "ok",
  "message": "NGO Food Donation API is running"
}
```

------------------------------------------------------------------------

8. Backend Setup

Prerequisites

Install:

-   Python
-   PostgreSQL
-   pgAdmin (optional but useful for database management)

Step 1 -- Create the Database

The supplied SQL documentation uses the database name:

annasetu

Create the database in PostgreSQL/pgAdmin and connect to it before
running the schema.

> If you have already configured your local project with a different
> database name, such as `annasetu`, make sure the `DATABASE_URL` in
> your `.env` matches your actual PostgreSQL database.

Step 2 -- Run the Database Schema

Open:

``` text
Backend/database/database.sql
```

Run the SQL script while connected to your selected database.

For lab/demo queries, use:

``` text
Backend/database/queries.sql
```

Step 3 -- Create a Virtual Environment

From the `Backend` directory:

``` powershell
python -m venv venv
```

Activate it on Windows PowerShell:

``` powershell
.\venv\Scripts\Activate.ps1
```

Step 4 -- Install Dependencies

``` powershell
pip install -r requirements.txt
```

Step 5 -- Configure Environment Variables

Create:

``` text
Backend/.env
```

using the provided `.env.example` as a reference.

Step 6 -- Start the Backend

``` powershell
python run.py
```

The backend is normally available at:

``` text
http://127.0.0.1:5000
```

Test it using:

``` text
http://127.0.0.1:5000/api/health
```

------------------------------------------------------------------------

9. Frontend Setup

Open another terminal.

Go to the frontend folder:

``` powershell
cd Frontend
```

Start a simple HTTP server:

``` powershell
python -m http.server 5500
```

Open:

``` text
http://127.0.0.1:5500
```

Do not open `index.html` directly using `file://`.

The frontend communicates with the Flask backend at:

``` text
http://127.0.0.1:5000
```

------------------------------------------------------------------------

10. Frontend Pages

Donor

donor/dashboard.html
donor/add-donation.html
donor/donations.html
donor/map.html
donor/notifications.html
donor/profile.html


### NGO

ngo/dashboard.html
ngo/available.html
ngo/requests.html
ngo/deliveries.html
ngo/map.html
ngo/notifications.html
ngo/profile.html

Volunteer

volunteer/dashboard.html
volunteer/available.html
volunteer/my-deliveries.html
volunteer/availability.html
volunteer/map.html
volunteer/notifications.html
volunteer/profile.html

Admin

admin/dashboard.html
admin/users.html
admin/statistics.html
admin/notifications.html
admin/profile.html

------------------------------------------------------------------------

11. Authentication and Security

The application uses **JWT access tokens** for authenticated API
requests.

Passwords are stored as hashes rather than plain-text passwords.

Role-based route protection is used for:

donor
ngo
volunteer
admin

The frontend stores the authentication token in browser storage and
sends it with protected API requests.

For a production deployment, the default development secrets should be
replaced with strong secrets and HTTPS should be used.

------------------------------------------------------------------------

12. Maps and Location

AnnaSetu uses **Leaflet.js** with **OpenStreetMap** for map display.

The map functionality includes:

-   Food pickup locations.
-   NGO locations for volunteer deliveries.
-   Current user location.
-   Google-Maps-style blue current-location marker.
-   Current-location accuracy circle.
-   "My Location" control.
-   Address geocoding using OpenStreetMap Nominatim.

Browser location permission is required for automatic current-location
detection.

The core database stores addresses. Map display and geocoding are
handled on the frontend.

------------------------------------------------------------------------

13. Notifications

Notifications are generated for important workflow events such as:

-   New NGO donation request.
-   Request decision.
-   Delivery-related updates.
-   Volunteer-related delivery events.

Notifications contain:

notification_id
user_id
user_type
message
notification_type
is_read
created_at

The `user_id` and `user_type` combination identifies the recipient.

------------------------------------------------------------------------

14. Concurrency Handling

The backend uses PostgreSQL transactions and row-level locking for
important operations.

When a donor accepts an NGO request, the relevant request and donation
rows are locked using:

``` sql
FOR UPDATE
```

This helps prevent two concurrent donor decisions from accepting
different NGOs for the same donation.

When volunteers attempt to accept the same delivery, the delivery row is
locked so that only one successful transaction can change an available
delivery to an accepted delivery.

------------------------------------------------------------------------

15. Testing Workflow

A complete demonstration can be performed using the following sequence:

Step 1

Register a donor.

Step 2

Log in as the donor.

Step 3

Create a food donation.

Step 4

Register an NGO.

Step 5

Log in as the NGO.

Step 6

Open available donations and request a donation.

Step 7

Log in as the donor and view the NGO request.

Step 8

Accept the request.

Step 9

Register and log in as a volunteer.

Step 10

Open available deliveries.

Step 11

Accept the delivery.

Step 12

Update delivery status:

Accepted
    ↓
Picked Up
    ↓
On The Way
    ↓
Delivered

Step 13

Check notifications for the involved users.

Step 14

Check the map pages and current-location feature.

------------------------------------------------------------------------

16. Important Notes

-   PostgreSQL must be running before starting the Flask backend.
-   The backend must be started before using frontend features that call
    the API.
-   The frontend should be served through HTTP rather than opened
    directly with `file://`.
-   Browser location permission is required for current-location
    features.
-   Internet access is required for OpenStreetMap tiles and Nominatim
    geocoding.
-   Do not upload `.env`, passwords, or other secrets to GitHub.
-   The included `venv` folder is a local Python environment and
    normally should not be committed to version control.

------------------------------------------------------------------------

17. Future Enhancements

Possible future improvements include:

-   Real-time notifications using WebSockets.
-   More advanced delivery tracking.
-   Exact GPS coordinates stored with donations.
-   Route optimization for volunteers.
-   Distance-based donation filtering.
-   Email/SMS notifications.
-   NGO verification.
-   Donor and volunteer ratings.
-   Production deployment with HTTPS.
-   Cloud-hosted PostgreSQL database.
-   Mobile application.

------------------------------------------------------------------------

18. Project Summary

**AnnaSetu** provides an integrated platform for managing surplus food
donations from the point of donation to final delivery.

The system combines:

Donor
  ↓
Food Donation
  ↓
NGO Request
  ↓
Donor Decision
  ↓
Delivery
  ↓
Volunteer
  ↓
Pickup
  ↓
On The Way
  ↓
Delivered

The project demonstrates a complete full-stack workflow using **Flask,
PostgreSQL, direct SQL, JWT authentication, HTML/CSS/JavaScript, and
Leaflet/OpenStreetMap**.


Author,

Parth Harnol
