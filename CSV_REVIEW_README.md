# CSV Product Review & Upload Feature

This feature allows you to upload CSV files containing product data, review and edit the information before importing it into the database.

## How to Use

1. **Access the Feature**:
   - Go to the Products view in the main application
   - Click on the "CSV Import" tab
   - Click the "Open CSV Review Tool" button

2. **Upload CSV File**:
   - Select a CSV file containing product data
   - Click "Parse & Review" to load the data

3. **Review & Edit**:
   - Review the parsed data in the table
   - Click on any cell to edit the value inline
   - Use the dropdown for the "Stock Status" field
   - Make any necessary corrections

4. **Upload to Database**:
   - Click "Upload to Database" when ready
   - The system will process the data and show results

## CSV Format

The CSV file should contain the following columns (case-insensitive):

- `id` - Product ID (will be auto-generated if empty)
- `name` - Product name (required)
- `barcode` - Product barcode
- `price` - Sale price (required)
- `costPrice` - Cost price (required)
- `quantity` - Available quantity
- `category` - Product category
- `minStock` - Minimum stock level
- `expirationDate` - Expiry date (YYYY-MM-DD format)
- `profitMargin` - Profit margin percentage
- `stock` - Stock status ("on" or "off")
- `img` - Image filename

## Sample CSV

A sample CSV file (`sample-products.csv`) is included in the project root with example data.

## Features

- **Data Validation**: Automatically validates required fields
- **Inline Editing**: Click any cell to edit values
- **Stock Status Dropdown**: Easy selection for stock status
- **Error Handling**: Clear error messages for upload issues
- **Progress Feedback**: Shows upload progress and results
- **Automatic Category Creation**: Creates categories if they don't exist

## Technical Details

- Uses the existing `/api/inventory/products/csv` endpoint
- Opens in a separate Electron window for better UX
- Supports large CSV files with pagination
- Maintains data integrity during upload process