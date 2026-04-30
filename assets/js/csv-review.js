//const { ipcRenderer } = require("electron");
const notiflix = require("notiflix");
//const path = require("path");

const extractCategories = (text) => {
  const rows = text.split(/\r?\n/).filter(r => r.trim().length);
  if (rows.length === 0) return [];

  const header = rows[0].split(",").map(h => h.trim().toLowerCase());
  const colIndex = header.indexOf("category");
  if (colIndex === -1) return [];

  return rows.slice(1)
    .map(r => {
      const value = r.split(",")[colIndex];
      return value ? value.trim().toLowerCase() : "";
    })
    .filter(v => v !== "");
};

const extractUniqueCategories = (csvFile) => {
  const all = extractCategories(csvFile);
  return Array.from(new Set(all));
};

$(document).ready(function() {
    let parsedProducts = [];
    let host = "localhost";
    let port = process.env.PORT;
    let api = "http://" + host + ":" + port + "/api/";
    let lastDeleted = [];

    // File input change handler
    $('#csvFile').on('change', function() {
        //@ts-expect-error
        const file = this.files[0];
        console.log("Selected file:", file);
        if (file) {
            $('#parseBtn').prop('disabled', false);
        } else {
            $('#parseBtn').prop('disabled', true);
        }
    });

    // Parse CSV button click
    $('#parseBtn').on('click', function() {
        //@ts-expect-error
        const file = $('#csvFile')[0].files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const csvText = e.target.result;
            parseCSV(csvText);
        };
        reader.readAsText(file);
    });

    // Back to upload button
    $('#backBtn').on('click', function() {
        $('#reviewSection').hide();
        $('#uploadSection').show();
        $('#csvFile').val('');
        $('#parseBtn').prop('disabled', true);
        parsedProducts = [];
    });

    // Upload to database button
    $('#uploadBtn').on('click', function() {
        uploadProducts();
    });

    // Function to display products in the review table
    function formatProductName(input) {
        if (!input) return "";

        // Normalize spacing + lowercase
        let text = input
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();

        // Extract dosage (e.g., 500mg, 5 ml, 1g)
        const doseMatch = text.match(/\d+(\.\d+)?\s?(mg|g|ml|mcg|µg|l)/i);
        const dose = doseMatch
            ? doseMatch[0].replace(/\s?/, " ").toLowerCase()
            : "";

        // Remove dosage from name
        let name = dose ? text.replace(doseMatch[0], "").trim() : text;

        // ✅ Capitalize EACH word
        name = name
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

        // Final format
        return dose ? `${name} ${dose}` : name;
    }

    function parseCSV(csvText) {
        try {
            const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
            if (lines.length === 0) {
                showMessage('CSV file is empty', 'danger');
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            parsedProducts = [];

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                if (values.length === headers.length) {
                    const product = {};
                    headers.forEach((header, index) => {
                        product[header] = values[index] ? values[index].trim() : '';
                    });
                    product.name = formatProductName(product.name).trim();
                    product.category = product.category.toLowerCase().trim();
                    if(product.name !== "")
                        parsedProducts.push(product);
                }
            }

            if (parsedProducts.length === 0) {
                showMessage('No valid product data found in CSV', 'warning');
                return;
            }

            displayProductsTable();
            $('#uploadSection').hide();
            $('#reviewSection').show();

        } catch (error) {
            showMessage('Error parsing CSV: ' + error.message, 'danger');
        }
    }

    $('#selectAll').on('change', function () {
        //@ts-expect-error
        $('.row-check').prop('checked', this.checked);
        });

    $('#bulkDeleteBtn').on('click', () => {
    const rows = [];

    $('#productsTableBody tr').each(function (index) {
        const checked = $(this).find('.row-check').is(':checked');
        if (checked) rows.push(parsedProducts[index]);
    });

    if (!rows.length) {
        alert("No rows selected");
        return;
    }

    if (!confirm(`Delete ${rows.length} products?`)) return;

    lastDeleted = [...rows];

    parsedProducts = parsedProducts.filter(p => !rows.includes(p));

    displayProductsTable();
    });


    // Updated displayProductsTable with checkboxes and delete buttons    
    function displayProductsTable() {
        const tbody = $('#productsTableBody');
        tbody.empty();
            parsedProducts.forEach((product) => {
                const row = $('<tr>');
                // ✅ Checkbox
                const checkbox = $(`<input type="checkbox" class="row-check">`);
                row.append($('<td>').append(checkbox));
                row.append(createEditableCell(product.id || '', 'id'));
                row.append(createEditableCell(product.name || '', 'name'));
                row.append(createEditableCell(product.barcode || '', 'barcode'));
                row.append(createEditableCell(product.price || 0, 'price'));
                row.append(createEditableCell(product.costprice || 0, 'costPrice'));
                row.append(createEditableCell(product.quantity || 0, 'quantity'));
                row.append(createEditableCell(product.category || '', 'category'));
                row.append(createEditableCell(product.minstock || 1, 'minStock'));
                row.append(createEditableCell(product.expirationdate || product.expirationDate || '', 'expirationDate'));
                row.append(createEditableCell(product.profitmargin || product.profitMargin || '', 'profitMargin'));

                // ✅ Single delete
                const deleteBtn = $(`<button class="btn btn-sm btn-danger"><i class="fa fa-trash"></i></button>`);

                deleteBtn.on('click', () => {
                    if (!confirm("Delete this product?")) return;
                    lastDeleted = [product];
                    parsedProducts = parsedProducts.filter(p => p !== product);
                    displayProductsTable();
                });

                row.append($('<td>').append(deleteBtn));
                tbody.append(row);
            });
    }

    // Create editable cell
    function createEditableCell(value, field, rowIndex) {
        const cell = $('<td>');
        const span = $('<span>', {
            class: 'editable-cell',
            text: value,
            'data-field': field,
            'data-row': rowIndex
        });

        cell.append(span);
        return cell;
    }

    // Create select cell for stock status
    function createSelectCell(value, field, rowIndex, options) {
        const cell = $('<td>');
        const select = $('<select>', {
            class: 'form-control form-control-sm',
            'data-field': field,
            'data-row': rowIndex
        });

        options.forEach(option => {
            const optionEl = $('<option>', {
                value: option,
                text: option,
                selected: option === value
            });
            select.append(optionEl);
        });

        select.on('change', function() {
            const rowIndex = $(this).data('row');
            const field = $(this).data('field');
            const value = $(this).val();
            parsedProducts[rowIndex][field] = value;
        });

        cell.append(select);
        return cell;
    }

    // Handle editable cells
    $(document).on('click', '.editable-cell', function() {
        const span = $(this);
        const currentValue = span.text();
        const field = span.data('field');
        const rowIndex = span.data('row');

        const input = $('<input>', {
            type: 'text',
            class: 'edit-input form-control form-control-sm',
            value: currentValue
        });

        span.replaceWith(input);
        input.focus();

        input.on('blur keypress', function(e) {
            if (e.type === 'blur' || e.keyCode === 13) {
                const newValue = $(this).val();
                parsedProducts[rowIndex][field] = newValue;

                const newSpan = $('<span>', {
                    class: 'editable-cell',
                    text: newValue,
                    'data-field': field,
                    'data-row': rowIndex
                });

                $(this).replaceWith(newSpan);
            } else if (e.keyCode === 27) { // Escape key
                const originalSpan = $('<span>', {
                    class: 'editable-cell',
                    text: currentValue,
                    'data-field': field,
                    'data-row': rowIndex
                });
                $(this).replaceWith(originalSpan);
            }
        });
    });

    // upload products to database
    function uploadProducts() {
        if (parsedProducts.length === 0) {
            showMessage('No products to upload', 'warning');
            return;
        }

        // Convert to CSV format for upload
        const headers = ['id', 'name', 'barcode', 'price', 'costPrice', 'quantity', 'category', 'minStock', 'expirationDate', 'profitMargin', 'stock', 'img'];
        let csvContent = headers.join(',') + '\n';

        parsedProducts.forEach(product => {
            const row = headers.map(header => {
                let value = product[header.toLowerCase()] || '';
                // Escape commas and quotes in CSV
                if (value.includes(',') || value.includes('"')) {
                    value = '"' + value.replace(/"/g, '""') + '"';
                }
                return value;
            });
            csvContent += row.join(',') + '\n';
        });

        // Create blob and form data
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const formData = new FormData();
        var input = $("#csvFile")[0];
        //@ts-expect-error
        formData.append('csvfile', blob, input.files[0]);

        // Show loading state
        $('#uploadBtn').prop('disabled', true).text('Uploading...');
        let productInsertResponse;
        // Upload to API
        $.ajax({
            url: api + 'inventory/products/csv',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                productInsertResponse= response
                //showMessage(`Upload successful! Inserted: ${response.inserted}, Updated: ${response.updated}`, 'success');
                $('#uploadBtn').prop('disabled', true).text('Uploaded to Database');
            },
            error: function(xhr) {
                let errorMsg = 'Upload failed';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                showMessage(errorMsg, 'danger');
                $('#uploadBtn').prop('disabled', false).text('Upload to Database');
            }
        });

    
        // create categories in batch
        const reader = new FileReader();
        reader.onload = function(e) {
        const csvText = e.target.result;
        const categoriesList = extractUniqueCategories(csvText);
        console.log("Extracted categories:", categoriesList);
        $.ajax({
            url: api + "categories/category/batch",
            type: "POST",
            data: JSON.stringify(categoriesList),
            contentType: "application/json",
            success: function (resp) {
            notiflix.Report.success(
            "Products and Categories Uploaded Successfully",
            //`Inserted products: ${productInsertResponse.inserted}, Updated products: ${productInsertResponse.updated}`,
            "",
            "Ok"
            );
                
            },
            error: function (jqXHR) {
            var message =  "Failed to upload categories.";
            var errorTitle = "Failed to upload categories.";
            notiflix.Report.failure(errorTitle, message, "Ok");
            }
        });
        };
        //@ts-expect-error
        reader.readAsText(input.files[0]);
    }

    function showMessage(message, type) {
        const alertClass = `alert alert-${type}`;
        const alert = `<div class="${alertClass} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="close" data-dismiss="alert">
                <span>&times;</span>
            </button>
        </div>`;

        $('#statusMessages').html(alert);

        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                //@ts-expect-error
                alert.alert('close');
            }, 5000);
        }
    }
});