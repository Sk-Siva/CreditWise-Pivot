# CreditWise Pivot

A web application that allows users to upload CSV files and generate customized pivot tables using a credit-based system.

## Features

- **Credit System**: Purchase and manage credits to use application features
- **CSV Upload**: Upload your CSV data for analysis
- **Pivot Table Generation**: Create customized pivot tables from your data
- **Credit-Based Actions**:
  - 5 credits for each file upload
  - 2 credits for each field selection in pivot configuration
  - 10 credits for downloading the generated pivot table

## Usage

1. **Register/Login**: Create an account or log in to an existing one
2. **Buy Credits**: Purchase credits to use the application features
3. **Upload CSV**: Upload your CSV file (costs 5 credits)
4. **Configure Pivot Table**:
   - Select row fields
   - Select column fields
   - Select value fields
   - Choose aggregation functions (each field selection costs 2 credits)
5. **Generate Pivot Table**: View your generated pivot table
6. **Download**: Download the pivot table (costs 10 credits)

## API Endpoints

### User Authentication

- **POST /api/user/register** - Register a new user
- **POST /api/user/login** - Login existing user

### Credit Management

- **GET /api/credits/balance/:userId** - Get user's credit balance
- **POST /api/credits/use** - Use credits for an action
- **POST /api/credits/buy** - Purchase credits
- **GET /api/credits/plans** - Get available credit plans
