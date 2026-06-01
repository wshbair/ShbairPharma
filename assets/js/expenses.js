
let host = "localhost";
let port = process.env.PORT;
let api =  "http://" + host + ":" + port + "/api/";
const notiflix = require("notiflix");

const moneyFormat = require("./utils").moneyFormat;

(function(){
    function showExpenses(){
        // hide common views
        $('#transactions_view, #products_view, #providers_view, #invoices_view, #pos_view, #providers_view, #invoices_view').hide();
        $('#expenses_view').show();
        //@ts-expect-error
        $("#expensesList").DataTable().destroy();
        // load expenses list        
        $.get(api + 'expenses/all').done(function(res){
            if(res && res.success && Array.isArray(res.data)){
                $('#expenses_list').html(renderExpenseRows(res.data));
                //@ts-expect-error
                $("#expensesList").DataTable({
                    order: [[1, "desc"]],
                    dom: "lfrtBip", 
                    pageLength: 10,
                    lengthMenu: [5, 10, 25, 50, 100],
                    buttons: [
                                  // ── CSV Audit Report ───────────────────────────────────────
                                  {
                                    text: '<i class="fa fa-download"></i> CSV',
                                    className: "btn btn-success",
                                    action: function ()  {
                                        downloadExpensesCsv(res.data);
                                    }
                                  },
                    
                                  // ── PDF Audit Report ───────────────────────────────────────
                                  {
                                    text: '<i class="fa fa-file-pdf-o"></i> PDF',
                                    className: "btn btn-danger",
                                    action: function () {
                                        downloadExpensesPdf(res.data);
                                    }
                                  },
                                  // ── Delete Selected ───────────────────────────────────────
                                  {
                                    text: '<i class="fa fa-trash"></i> Delete Selected',
                                    className: "btn btn-warning",
                                    action: function () {
                                        var selectedIds = [];
                                        // Get all rows from DataTable (including hidden/paginated rows)
                                        //@ts-expect-error
                                        var table = $("#expensesList").DataTable();
                                        table.rows().every(function(){
                                            var $checkbox = $(this.node()).find('input[type="checkbox"]:checked');
                                            if($checkbox.length > 0){
                                                var id = $checkbox.data('id');
                                                console.log('Selected expense ID for deletion:', id);
                                                if(id) selectedIds.push(id);
                                            }
                                        });
                                        
                                        if(selectedIds.length === 0){
                                            notiflix.Notify.warning('No expenses selected for deletion');
                                            return;
                                        }
                                        
                                        notiflix.Confirm.show(
                                            'Confirm Delete',
                                            'Are you sure you want to delete ' + selectedIds.length + ' expense(s)?',
                                            'Delete',
                                            'Cancel',
                                            function(){
                                                var deleteCount = 0;
                                                var errorCount = 0;
                                                selectedIds.forEach(function(id){
                                                    $.ajax({
                                                        url: api + 'expenses/expense/' + id,
                                                        type: 'DELETE'
                                                    }).done(function(){
                                                        deleteCount++;
                                                        if(deleteCount + errorCount === selectedIds.length){
                                                            if(errorCount === 0){
                                                                notiflix.Notify.success('Deleted ' + deleteCount + ' expense(s)');
                                                            } else {
                                                                notiflix.Notify.warning('Deleted ' + deleteCount + ' expense(s), ' + errorCount + ' failed');
                                                            }
                                                            showExpenses();
                                                        }
                                                    }).fail(function(){
                                                        errorCount++;
                                                        if(deleteCount + errorCount === selectedIds.length){
                                                            if(errorCount === 0){
                                                                notiflix.Notify.success('Deleted ' + deleteCount + ' expense(s)');
                                                            } else {
                                                                notiflix.Notify.warning('Deleted ' + deleteCount + ' expense(s), ' + errorCount + ' failed');
                                                            }
                                                            showExpenses();
                                                        }
                                                    });
                                                });
                                            },
                                            function(){
                                                // Cancel
                                            }
                                        );
                                    }
                                  }
                                ],
                })
            }
        }); 

    }

    function getExpenseQueryParams(){
        var category = $('#expenseCategoryFilter').val().toString().trim() || '';
        var fromDate = $('#expenseFromDate').val().toString().trim() || '';
        var toDate = $('#expenseToDate').val().toString().trim() || '';
        var params = new URLSearchParams();
        if(category) params.append('category', category);
        if(fromDate) params.append('fromDate', fromDate);
        if(toDate) params.append('toDate', toDate);
        return params.toString() ? '?' + params.toString() : '';
    }

    function renderExpenseRows(expenses, emptyText) {
        if(!Array.isArray(expenses) || expenses.length === 0){
            return '<tr><td colspan="7" style="text-align:center;">' + (emptyText || 'No expenses found') + '</td></tr>';
        }
        var rows = '';
        expenses.forEach(function(e){
            var filename = e.expenseFile || '';
            var safeFilename = filename.replace(/'/g, "\\'");
            rows += '<tr>';
            rows += '<td><input type="checkbox" data-id="'+e._id+'" /></td>';
            rows += '<td>'+ (e.title || '') +'</td>';
            rows += '<td>'+ (e.category || '') +'</td>';
            rows += '<td>'+ (e.amount != null ?  moneyFormat(e.amount) : '') +'</td>';
            rows += '<td>'+ (e.expenseDate ? new Date(e.expenseDate).toLocaleDateString() : '') +'</td>';
            rows += '<td>'+ (e.description || '') +'</td>';
            rows += '<td>'+(filename ? '<button onclick="$.fn.viewInvoiceFile(\''+safeFilename+'\')" class="btn btn-default btn-xs" title="View File"><i class="fa fa-file-pdf-o"></i></button>' : '<span class="text-muted">No file</span>')+'</td>';
            rows += '</tr>';
        });
        return rows;
    }

    function downloadExpensesCsv(expenses){
        function q(v){ return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }
        function csvRow(arr){ return arr.map(q).join(','); }

        var rows = [];
        rows.push(['Title','Category','Amount','Date','Description','Invoice File']);
        expenses.forEach(function(e){
            rows.push([
                e.title || '',
                e.category || '',
                e.amount != null ? e.amount : '',
                e.expenseDate ? new Date(e.expenseDate).toLocaleDateString() : '',
                e.description || '',
                e.expenseFile || ''
            ]);
        });

        var csv = '\uFEFF' + rows.map(csvRow).join('\r\n');
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'expenses_' + new Date().toISOString().slice(0,10) + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function downloadExpensesPdf(expenses){
        // @ts-ignore
        if(typeof pdfMake === 'undefined'){
            notiflix.Notify.failure('PDF export is unavailable');
            return;
        }

        var body = [];
        body.push([
            { text: 'Title', bold: true },
            { text: 'Category', bold: true },
            { text: 'Amount', bold: true },
            { text: 'Date', bold: true },
            { text: 'Description', bold: true },
            { text: 'Invoice File', bold: true }
        ]);

        expenses.forEach(function(e){
            body.push([
                e.title || '',
                e.category || '',
                e.amount != null ? moneyFormat(e.amount) : '',
                e.expenseDate ? new Date(e.expenseDate).toLocaleDateString() : '',
                e.description || '',
                e.expenseFile || ''
            ]);
        });

        var docDef = {
            pageSize: 'A4',
            pageMargins: [30, 30, 30, 30],
            content: [
                { text: 'Expenses Report', style: 'header' },
                { text: 'Generated: ' + new Date().toLocaleString(), style: 'subheader' },
                { text: ' ' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*','auto','auto','auto','*','auto'],
                        body: body
                    },
                    layout: 'lightHorizontalLines'
                }
            ],
            styles: {
                header: { fontSize: 16, bold: true, margin: [0, 0, 0, 8] },
                subheader: { fontSize: 10, color: '#666', margin: [0, 0, 0, 12] }
            },
            defaultStyle: { fontSize: 9 }
        };

        // @ts-ignore
        pdfMake.createPdf(docDef).download('expenses_' + new Date().toISOString().slice(0,10) + '.pdf');
    }

    function showPos(){
        $('#expenses_view').hide();
        $('#pos_view').show();
    }

    function populateCategories(){
        $.get(api + 'expenses/categories').done(function(res){
            if(res && res.success && Array.isArray(res.categories)){
                var filterOpts = '<option value="all">All Categories</option>';
                var selectOpts = '<option value="">Select category</option>';
                res.categories.forEach(function(c){
                    // category object expected {key,label}
                    var key = c.key || c.value || c;
                    var label = c.label || c.name || key;
                    filterOpts += '<option value="'+key+'">'+label+'</option>';
                    selectOpts += '<option value="'+key+'">'+label+'</option>';
                });
                $('#expenseCategoryFilter').html(filterOpts);
                $('#expenseCategory').html(selectOpts);
            }
        }).fail(function(){
            console.warn('Failed to load expense categories');
        });
    }

    function renderExpensePieChart(monthlyData, selectedMonth){
        var categoryTotals = {};
        var allCategories = [];
        
        // Aggregate categories
        if(selectedMonth){
            // Show pie chart for specific month only
            if(monthlyData[selectedMonth] && monthlyData[selectedMonth].categories){
                categoryTotals = monthlyData[selectedMonth].categories;
                allCategories = Object.keys(categoryTotals).sort();
            }
        } else {
            // Aggregate all categories across all months
            Object.keys(monthlyData).forEach(function(monthKey){
                Object.keys(monthlyData[monthKey].categories).forEach(function(cat){
                    if(!categoryTotals[cat]){
                        categoryTotals[cat] = 0;
                    }
                    categoryTotals[cat] += monthlyData[monthKey].categories[cat];
                });
            });
            allCategories = Object.keys(categoryTotals).sort();
        }
        
        if(allCategories.length === 0){
            $('#expensePieChart').hide();
            return;
        }
        
        $('#expensePieChart').show();
        
        // Generate colors for pie chart
        var colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
            '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ];
        
        var pieData = allCategories.map(function(cat, idx){
            return categoryTotals[cat];
        });
        
        var pieLabels = allCategories.map(function(cat){
            var amount = categoryTotals[cat];
            var percentage = ((amount / Object.values(categoryTotals).reduce(function(a,b){return a+b;},0)) * 100).toFixed(1);
            return cat + ' (' + percentage + '%)';
        });
        
        // Destroy existing chart if it exists
        if(window.expensePieChartInstance){
            window.expensePieChartInstance.destroy();
        }
        
        // Create pie chart
        var ctx = document.getElementById('expensePieChart').getContext('2d');
        //@ts-expect-error
        window.expensePieChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: pieLabels,
                datasets: [{
                    data: pieData,
                    backgroundColor: colors.slice(0, allCategories.length),
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 15,
                            font: { size: 12 },
                            generateLabels: function(chart){
                                var data = chart.data;
                                return data.labels.map(function(label, idx){
                                    var value = data.datasets[0].data[idx];
                                    return {
                                        text: label + ': ' + moneyFormat(value),
                                        fillStyle: data.datasets[0].backgroundColor[idx],
                                        hidden: false,
                                        index: idx
                                    };
                                });
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context){
                                return moneyFormat(context.parsed);
                            }
                        }
                    }
                }
            }
        });
    }

    function loadMonthlySummary(selectedMonth, selectedYear){
        var preservedMonth = selectedMonth || $('#summaryMonthSelect').val();
        var preservedYear = selectedYear || $('#summaryYearSelect').val();

        $.get(api + 'expenses/all').done(function(res){
            if(res && res.success && Array.isArray(res.data)){
                var monthlyData = {};
                var grandTotal = 0;
                var allMonths = new Set();
                var allYears = new Set();
                
                res.data.forEach(function(e){
                    var expDate = new Date(e.expenseDate);
                    var monthKey = expDate.getFullYear() + '-' + String(expDate.getMonth() + 1).padStart(2, '0');
                    var monthLabel = expDate.toLocaleString('default', { month: 'long', year: 'numeric' });
                    var category = e.category || 'Uncategorized';
                    var year = expDate.getFullYear();
                    
                    allMonths.add(monthKey);
                    allYears.add(year);
                    
                    if(!monthlyData[monthKey]){
                        monthlyData[monthKey] = {
                            label: monthLabel,
                            total: 0,
                            categories: {}
                        };
                    }
                    
                    if(!monthlyData[monthKey].categories[category]){
                        monthlyData[monthKey].categories[category] = 0;
                    }
                    
                    var amount = parseFloat(e.amount || 0);
                    monthlyData[monthKey].total += amount;
                    monthlyData[monthKey].categories[category] += amount;
                    grandTotal += amount;
                });
                
                // Populate year dropdown and preserve selection
                var yearOpts = '<option value="">All Years</option>';
                Array.from(allYears).sort(function(a,b){return b-a;}).forEach(function(y){
                    yearOpts += '<option value="'+y+'">'+y+'</option>';
                });
                $('#summaryYearSelect').html(yearOpts);
                if(preservedYear && $('#summaryYearSelect option[value="'+preservedYear+'"]').length){
                    $('#summaryYearSelect').val(preservedYear);
                }
                
                // Populate month dropdown and preserve selection
                var monthOpts = '<option value="">All Months</option>';
                Array.from(allMonths).sort().reverse().forEach(function(mk){
                    var yearFromMonth = mk.substring(0,4);
                    if(preservedYear && yearFromMonth !== preservedYear){
                        return;
                    }
                    monthOpts += '<option value="'+mk+'">'+monthlyData[mk].label+'</option>';
                });
                $('#summaryMonthSelect').html(monthOpts);
                if(preservedMonth && $('#summaryMonthSelect option[value="'+preservedMonth+'"]').length){
                    $('#summaryMonthSelect').val(preservedMonth);
                } else if(preservedYear && $('#summaryMonthSelect option[value="'+preservedMonth+'"]').length === 0) {
                    $('#summaryMonthSelect').val('');
                    preservedMonth = '';
                }
                
                // Determine which months to display
                var sortedMonths = Object.keys(monthlyData).sort().reverse();
                if(preservedYear){
                    sortedMonths = sortedMonths.filter(function(m){
                        return m.substring(0,4) === preservedYear;
                    });
                }
                if(preservedMonth){
                    sortedMonths = sortedMonths.filter(function(m){
                        return m === preservedMonth;
                    });
                }
                
                // Recalculate total based on filter
                var filteredTotal = 0;
                sortedMonths.forEach(function(m){
                    filteredTotal += monthlyData[m].total;
                });
                
                // Update total
                $('#summaryTotal').text( moneyFormat(filteredTotal) );
                
                // Build table rows
                var rows = '';
                sortedMonths.forEach(function(monthKey){
                    var data = monthlyData[monthKey];
                    var categoryKeys = Object.keys(data.categories).sort();
                    
                    // Month header row
                    rows += '<tr style="background-color:#f5f5f5;font-weight:bold;">';
                    rows += '<td>'+data.label+'</td>';
                    rows += '<td style="text-align:right;">'+moneyFormat(data.total)+'</td>';
                    rows += '</tr>';
                    
                    // Category rows
                    categoryKeys.forEach(function(cat){
                        rows += '<tr style="background-color:#fafafa;padding-left:20px;">';
                        rows += '<td style="padding-left:30px;">• '+cat+'</td>';
                        rows += '<td style="text-align:right;">'+moneyFormat(data.categories[cat])+'</td>';
                        rows += '</tr>';
                    });
                });
                
                if(sortedMonths.length === 0){
                    rows = '<tr><td colspan="2" style="text-align:center;">No expenses found</td></tr>';
                }
                
                $('#expense_summary_body tbody').html(rows);
                
                // Render pie chart
                renderExpensePieChart(monthlyData, selectedMonth);
            }
        }).fail(function(){
            notiflix.Notify.failure('Failed to load expense summary');
        });
    }

    // open expenses view
    $('#expensesModal').on('click', function(e){
        e.preventDefault();
        // show list tab
        $('.nav-tabs a[href="#expenses_list_tab"]').tab('show');
        showExpenses();
        populateCategories();
    });

    // ensure returning to POS hides expenses
    $('#pointofsale').on('click', function(){ showPos(); });

    // cancel button in expense form
    $('#cancelExpenseBtn').on('click', function(e){
        e.preventDefault();
        $('#saveExpenseForm')[0] && $('#saveExpenseForm')[0].reset();
        // return to POS view
        showPos();
    });

    // basic select-all checkbox handler
    $(document).on('change', '#selectAllExpenses', function(){
        var checked = $(this).is(':checked');
        $('#expenses_list tbody input[type="checkbox"]').prop('checked', checked);
    });
    
    // submit handler for adding/editing expenses - to be implemented
    $(document).on('submit', '#saveExpenseForm', function(e){
        e.preventDefault();
        
        const fd = new FormData();
        fd.append('title', $('#expenseTitle').val().toString().trim());
        fd.append('category', $('#expenseCategory').val().toString().trim());
        fd.append('amount', $('#expenseAmount').val().toString().trim());
        fd.append('description', $('#expenseDescription').val().toString().trim());
        fd.append('expenseDate', $('#expenseDate').val().toString().trim());
        const invoiceFile = $('#expenseInvoice')[0];
        //@ts-expect-error
        if(invoiceFile && invoiceFile.files && invoiceFile.files[0]){
            //@ts-expect-error
            fd.append('invoiceFile', invoiceFile.files[0]);
        }
        
        $.ajax({
            url: api + 'expenses/expense',
            type: 'POST',
            data: fd,
            processData: false,
            contentType: false,
        }).done(function(res){
            console.log('Expense save response:', res);
            if(res){
                notiflix.Notify.success('Expense saved successfully');
                // Reset form
                $('#saveExpenseForm')[0].reset();
                // Optionally refresh expenses list if currently visible
                if($('#expenses_view').is(':visible')){
                    showExpenses();
                }
            } else {
                notiflix.Notify.failure('Failed to save expense');
            }
        }).fail(function(err){
            console.error('Error saving expense:', err);
            notiflix.Notify.failure('Error occurred while saving expense' + (err && err.responseJSON && err.responseJSON.message ? ': ' + err.responseJSON.message : ''));
        });

    });

    // Filter handler
    $('#filterExpensesBtn').on('click', function(e){
        e.preventDefault();
        var url = api + 'expenses/all' + getExpenseQueryParams();
        $.get(url).done(function(res){
            if(res && res.success && Array.isArray(res.data)){
            $('#expenses_list').html(renderExpenseRows(res.data));
        }
        }).fail(function(){
            notiflix.Notify.failure('Failed to load expenses');
        });
    });

    // Clear filter handler
    $('#clearExpenseFilterBtn').on('click', function(e){
        e.preventDefault();
        $('#expenseCategoryFilter').val('');
        $('#expenseFromDate').val('');
        $('#expenseToDate').val('');
        showExpenses();
    });

    // Category filter change handler
    $('#expenseCategoryFilter').on('change', function(){
        var category = $(this).val().toString().trim();
        console.log('Filtering expenses by category:', category);
        if(category === 'all'){
            // If empty, load all expenses
            showExpenses();
            return;
        }
        
        var url = api + 'expenses/category/' + encodeURIComponent(category);
        $.get(url).done(function(res){
            if(res && res.success && Array.isArray(res.data)){
            $('#expenses_list').html(renderExpenseRows(res.data));
                
        }
        }).fail(function(){
            notiflix.Notify.failure('Failed to filter expenses');
        });
    });

    // Load summary when summary tab is shown
    $('a[href="#expenses_summary_tab"]').on('shown.bs.tab', function(){
        var selectedMonth = $('#summaryMonthSelect').val();
        var selectedYear = $('#summaryYearSelect').val();
        loadMonthlySummary(selectedMonth, selectedYear);
    });

    // Month select filter
    $('#summaryMonthSelect').on('change', function(e){
        e.preventDefault();
        var selectedMonth = $(this).val();
        var selectedYear = $('#summaryYearSelect').val();
        loadMonthlySummary(selectedMonth, selectedYear);
    });

    // Year select filter
    $('#summaryYearSelect').on('change', function(){
        var selectedYear = $(this).val();
        var selectedMonth = $('#summaryMonthSelect').val();
        loadMonthlySummary(selectedMonth, selectedYear);
    });

    
})();
