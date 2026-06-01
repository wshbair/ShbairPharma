
let host = "localhost";
let port = process.env.PORT;
let api =  "http://" + host + ":" + port + "/api/";
const notiflix = require("notiflix");

(function(){
    function showExpenses(){
        // hide common views
        $('#transactions_view, #products_view, #providers_view, #invoices_view, #pos_view, #providers_view, #invoices_view').hide();
        $('#expenses_view').show();
        // load expenses list        
        $.get(api + 'expenses/all').done(function(res){
            console.log('Loaded expenses:', res);
            if(res && res.success && Array.isArray(res.data)){
                var rows = '';
                res.data.forEach(function(e){
                    rows += '<tr>';
                    rows += '<td><input type="checkbox" data-id="'+e._id+'" /></td>';
                    rows += '<td>'+e.title+'</td>';
                    rows += '<td>'+e.category+'</td>';
                    rows += '<td>'+e.amount+'</td>';
                    rows += '<td>'+new Date(e.expenseDate).toLocaleDateString()+'</td>';
                    rows += '<td>'+e.description+'</td>';
                    rows += '<td>'+(e.invoiceId ? '<a href="#" class="view-invoice" data-id="'+e.invoiceId+'">View Invoice</a>' : 'N/A')+'</td>';   
                    rows += '</tr>';
                });
                $('#expenses_list tbody').html(rows);   
            }
        }); 

    }

    function showPos(){
        $('#expenses_view').hide();
        $('#pos_view').show();
    }

    function populateCategories(){
        $.get(api + 'expenses/categories').done(function(res){
            if(res && res.success && Array.isArray(res.categories)){
                var filterOpts = '<option value="">All Categories</option>';
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

    $(function(){
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
        $(document).on('click', '#submitExpenseBtn', function(e){
            e.preventDefault();
            // Handle expense submission logic here
            console.log('Submit expense form - to be implemented');
            $.post(api + 'expenses/expense', {
                title: $('#expenseTitle').val(),
                category: $('#expenseCategory').val(),
                amount: $('#expenseAmount').val(),
                description: $('#expenseDescription').val(),
                expenseDate: $('#expenseDate').val(),
            }).done(function(res){
                if(res && res.success){
                    notiflix.Notify.success('Expense saved successfully');
                    // Reset form
                    $('#saveExpenseForm')[0].reset();
                    // Optionally refresh expenses list if currently visible
                } else {
                    notiflix.Notify.failure('Failed to save expense');
                }
            }).fail(function(){
                notiflix.Notify.failure('Error occurred while saving expense');
            });
        }); 

    });
})();
