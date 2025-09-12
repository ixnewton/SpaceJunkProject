# Space Junk Tracker System

## 1. Overview

The Space Junk Tracker is a comprehensive system designed to source, track, and predict the trajectories of man-made objects in Earth's orbit. It provides crucial data for collision avoidance, re-entry prediction, and overall space situational awareness. The system aggregates data from public sources, calculates orbital paths, and offers a web-based portal for users to visualize and analyze the data.

### Key Features

*   **Comprehensive Data Sourcing**: Aggregates TLE data from Celestrak for active satellites, space stations, and debris.
*   **Real-time Object Tracking**: Maintains a database of orbital parameters for all tracked objects.
*   **Trajectory & Collision Prediction**: Utilizes an SGP4 propagator to predict future positions and analyze close approaches (conjunctions).
*   **Web-Based User Portal**: An intuitive interface for user registration, browsing the object catalog, performing analysis, and visualizing orbits in 3D.
*   **Alerting**: Automatically sends email notifications for high-risk collision events.

## 2. System Architecture

The system is built on a modular, microservices-based architecture to ensure scalability, resilience, and maintainability. Each service is responsible for a distinct part of the system's functionality.

*   **API Gateway** (`Node.js/Express`): The single entry point for all client requests. It securely routes traffic to the appropriate downstream service.
*   **User Web Portal** (`Node.js/Express/Handlebars`): The user-facing web application. It handles user authentication, data presentation, and interaction with the backend services via the API Gateway.
*   **Data Ingestion Service** (`Node.js`): Periodically fetches the latest TLE data from external sources and populates the central MongoDB database.
*   **Orbital Calculation Engine** (`Python/FastAPI`): The core scientific engine. It uses the SGP4 model to calculate an object's position and velocity at any given time.
*   **Collision Analysis Service** (`Python/FastAPI`): Consumes data from the Orbital Calculation Engine to analyze trajectories, identify potential collisions, and trigger alerts.
*   **Notification Service** (`Node.js/Nodemailer`): Manages and sends email alerts for critical events, such as imminent collisions.

### Data Storage

*   **MongoDB**: A central NoSQL database used to store space object metadata (including TLEs), user account information, and service status.

## 3. Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v14 or later)
*   [Python](https://www.python.org/) (v3.8 or later) with `pip`
*   [MongoDB](https://www.mongodb.com/try/download/community) running on the default port (27017).

### Installation

To set up the development environment, you need to install the dependencies for each microservice.

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install Python Dependencies:**
    Navigate to each Python service directory and install its requirements.
    ```bash
    # For Collision Analysis Service
    cd services/collision-analysis-service
    pip install -r requirements.txt
    cd ../..

    # For Orbital Calculation Engine
    cd services/orbital-calculation-engine
    pip install -r requirements.txt
    cd ../..
    ```

3.  **Install Node.js Dependencies:**
    Navigate to each Node.js service directory and run `npm install`.
    ```bash
    # For API Gateway
    cd services/api-gateway
    npm install
    cd ../..

    # For Data Ingestion Service
    cd services/data-ingestion-service
    npm install
    cd ../..

    # For Notification Service
    cd services/notification-service
    npm install
    cd ../..

    # For User Web Portal
    cd services/user-web-portal
    npm install
    cd ../..
    ```

### Running the System

The services must be started in a specific order to ensure that dependencies are available.

1.  **Start the Database:**
    Ensure your MongoDB instance is running.

2.  **Start the Core Services (Python):**
    Open two separate terminal tabs for the Python services.
    ```bash
    # Terminal 1: Orbital Calculation Engine
    uvicorn services.orbital-calculation-engine.main:app --host 0.0.0.0 --port 8005 --reload

    # Terminal 2: Collision Analysis Service
    uvicorn services.collision-analysis-service.main:app --host 0.0.0.0 --port 8002 --reload
    ```

3.  **Start the Application Services (Node.js):**
    Open four separate terminal tabs for the Node.js services.
    ```bash
    # Terminal 3: Notification Service
    node services/notification-service/server.js

    # Terminal 4: Data Ingestion Service
    # This will run an initial data fetch on the first start.
    node services/data-ingestion-service/server.js

    # Terminal 5: User Web Portal
    node services/user-web-portal/server.js

    # Terminal 6: API Gateway
    node services/api-gateway/server.js
    ```

    **Note:** The Notification Service uses an Ethereal test account. You will need to create your own at [Ethereal.email](https://ethereal.email/) and replace the credentials in `services/notification-service/server.js` to receive email previews.

4.  **Access the Application:**
    Once all services are running, you can access the User Web Portal at:
    [http://localhost:3000](http://localhost:3000)

    The API Gateway is listening on `http://localhost:8000`, but you will typically interact with the system through the web portal.

## 4. How to Use

1.  **Register an Account**: Navigate to the portal and create a new user account.
2.  **Log In**: Log in with your new credentials. You will be redirected to the Conjunction Analysis page.
3.  **Browse the Catalog**: Visit the "Space Junk Catalog" to see a list of all tracked objects.
4.  **Perform Analysis**: On the "Conjunction Analysis" page, select two different objects from the dropdowns and click "Analyze" to see the time and distance of their closest approach.
5.  **Visualize Orbits**: After running a successful analysis, a "Visualize" button will appear. Click it to see a 3D rendering of the two objects' orbits.
