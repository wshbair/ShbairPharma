const jsPDF = require("jspdf");
const html2canvas = require("html2canvas");
const JsBarcode = require("jsbarcode");
const macaddress = require("macaddress");
const notiflix = require("notiflix");
const validator = require("validator");
const DOMPurify = require("dompurify");
const _ = require("lodash");
let fs = require("fs");
let path = require("path");
let moment = require("moment");
let { ipcRenderer } = require("electron");
let dotInterval = setInterval(function () {
  $(".dot").text(".");
}, 3000);
let Store = require("electron-store");
const remote = require("@electron/remote");
const app = remote.app;
const utils = require("./utils");
const { t } = require("./i18n");

// Populate login footer with live version and current year
$("#app_version").text(app.getVersion());
$("#footer_year").text(new Date().getFullYear());

let cart = [];
let index = 0;
let allUsers = [];
let allProducts = [];
let allCategories = [];
let allProviders = [];
let allTransactions = [];
let allInvoices = [];
let currentProvider = null;
let currentProviderInvoiceData = null;
let sold = [];
let state = [];
let sold_items = [];
let item;
let auth;
let holdOrder = 0;
let vat = 0;
let perms = null;
let deleteId = 0;
let paymentType = 0;
let receipt = "";
let totalVat = 0;
let subTotal = 0;
let method = "";
let order_index = 0;
let user_index = 0;
let product_index = 0;
let transaction_index;
const appName = process.env.APPNAME;
const appData = process.env.APPDATA;
let host = "localhost";
let port = process.env.PORT;
let img_path = path.join(appData, appName, "uploads", "/");
let api = "http://" + host + ":" + port + "/api/";
const bcrypt = require("bcrypt");
let categories = [];
let holdOrderList = [];
let customerOrderList = [];
let ownUserEdit = null;
let totalPrice = 0;
let orderTotal = 0;
let auth_error = "Incorrect username or password";
let auth_empty = "Please enter a username and password";
let holdOrderlocation = $("#renderHoldOrders");
let customerOrderLocation = $("#renderCustomerOrders");
let storage = new Store();
let settings;
let platform;
let user = {};
let start = moment().startOf("month");
let end = moment();
let start_date = moment(start).toDate();
let end_date = moment(end).toDate();
let by_till = 0;
let by_user = 0;
let by_status = 1;
const default_item_img = path.join("assets","images","default.jpg");
const permissions = [
  "perm_products",
  "perm_categories",
  "perm_transactions",
  "perm_users",
  "perm_settings",
];
notiflix.Notify.init({
  position: "right-top",
  cssAnimationDuration: 600,
  messageMaxLength: 150,
  clickToClose: true,
  closeButton: true
});
const {
  DATE_FORMAT,
  moneyFormat,
  isExpired,
  daysToExpire,
  getStockStatus,
  checkFileExists,
  setContentSecurityPolicy,
} = require("./utils");

//set the content security policy of the app
setContentSecurityPolicy();

$(function () {
  function cb(start, end) {
    $("#reportrange span").html(
      start.format("MMMM D, YYYY") + "  -  " + end.format("MMMM D, YYYY"),
    );
  }

  $("#reportrange").daterangepicker(
    {
      startDate: start,
      endDate: end,
      autoApply: true,
      timePicker: true,
      timePicker24Hour: true,
      timePickerIncrement: 10,
      timePickerSeconds: true,
      // minDate: '',
      ranges: {
        Today: [moment().startOf("day"), moment()],
        Yesterday: [
          moment().subtract(1, "days").startOf("day"),
          moment().subtract(1, "days").endOf("day"),
        ],
        "Last 7 Days": [
          moment().subtract(6, "days").startOf("day"),
          moment().endOf("day"),
        ],
        "Last 30 Days": [
          moment().subtract(29, "days").startOf("day"),
          moment().endOf("day"),
        ],
        "This Month": [moment().startOf("month"), moment().endOf("month")],
        "This Month": [moment().startOf("month"), moment()],
        "Last Month": [
          moment().subtract(1, "month").startOf("month"),
          moment().subtract(1, "month").endOf("month"),
        ],
      },
    },
    cb,
  );

  cb(start, end);

  $("#expirationDate").daterangepicker({
    singleDatePicker: true,
    locale: {
      format: DATE_FORMAT,
    },
  });

  $("#entryDate").daterangepicker({
    singleDatePicker: true,
    defaultDate: moment(),
    locale: {
      format: DATE_FORMAT,
    },
  });


  
});

//Allow only numbers in input field
$.fn.allowOnlyNumbers = function() {
  return this.on('keydown', function(e) {
  // Allow: backspace, delete, tab, escape, enter, ., ctrl/cmd+A, ctrl/cmd+C, ctrl/cmd+X, ctrl/cmd+V, end, home, left, right, down, up
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 || 
      (e.keyCode >= 35 && e.keyCode <= 40) || 
      ((e.keyCode === 65 || e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 88) && (e.ctrlKey === true || e.metaKey === true))) {
      return;
  }
  // Ensure that it is a number and stop the keypress
  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
    e.preventDefault();
  }
});
};
$('.number-input').allowOnlyNumbers();

//Serialize Object
$.fn.serializeObject = function () {
  var o = {};
  var a = this.serializeArray();
  $.each(a, function () {
    if (o[this.name]) {
      if (!o[this.name].push) {
        o[this.name] = [o[this.name]];
      }
      o[this.name].push(this.value || "");
    } else {
      o[this.name] = this.value || "";
    }
  });
  return o;
};

auth = storage.get("auth");
user = storage.get("user");

$("#main_app").hide();
if (auth == undefined) {
  $.get(api + "users/check/", function (data) {});

  authenticate();
} else {
  $("#login").hide();
  $("#main_app").show();
  platform = storage.get("settings");

  if (platform != undefined) {
    if (platform.app == "Network Point of Sale Terminal") {
      api = "http://" + platform.ip + ":" + port + "/api/";
      perms = true;
    }
  }

  $.get(api + "users/user/" + user._id, function (data) {
    user = data;
    $("#loggedin-user").text(user.fullname);
  });

  $.get(api + "settings/get", function (data) {
    settings = data.settings;
  });

  $.get(api + "users/all", function (users) {
    allUsers = [...users];
  });

  $(document).ready(function () {
    //update title based on company
    let appTitle = !!settings ? `${validator.unescape(settings.store)} - ${appName}` : appName;
    $("title").text(appTitle);

    $(".loading").hide();

    loadCategories();
    loadProviders();
    loadProducts();
    loadCustomers();
    loadInvoicesForForm();

    if (settings && validator.unescape(settings.symbol)) {
      $("#price_curr, #payment_curr, #change_curr").text(validator.unescape(settings.symbol));
    }

    setTimeout(function () {
      if (settings == undefined && auth != undefined) {
        $("#settingsModal").modal("show");
      } else {
        vat = parseFloat(validator.unescape(settings.percentage));
        $("#taxInfo").text(settings.charge_tax ? vat : 0);
      }
    }, 1500);

    $("#settingsModal").on("hide.bs.modal", function () {
      setTimeout(function () {
        if (settings == undefined && auth != undefined) {
          $("#settingsModal").modal("show");
        }
      }, 1000);
    });

    if (0 == user.perm_products) {
      $(".p_one").hide();
    }
    if (0 == user.perm_categories) {
      $(".p_two").hide();
    }
    if (0 == user.perm_transactions) {
      $(".p_three").hide();
    }
    if (0 == user.perm_users) {
      $(".p_four").hide();
    }
    if (0 == user.perm_settings) {
      $(".p_five").hide();
    }

    //load products in pos
    function loadProducts(data) {
      $.get(api + "inventory/products", function (data) {
        data.forEach((item) => {
          item.price = parseFloat(item.price).toFixed(2);
        });

        allProducts = [...data];

        loadProductList();

        let delay = 0;
        let expiredCount = 0;
        allProducts.forEach((product) => {
          let todayDate = moment();
          let expiryDate = moment(product.expirationDate, DATE_FORMAT);

          if (!isExpired(expiryDate)) {
            const diffDays = daysToExpire(expiryDate);

            if (diffDays > 0 && diffDays <= 30) {
              var days_noun = diffDays > 1 ? "days" : "day";
              notiflix.Notify.warning(
                `${product.name} has only ${diffDays} ${days_noun} left to expiry`,
              );
            }
          } else {
            expiredCount++;
          }
        });

        //Show notification if there are any expired goods.
        if(expiredCount>0)
        {
           notiflix.Notify.failure(
          `${expiredCount} ${
            expiredCount > 0 ? "products" : "product"
          } expired. Please restock!`,
        );
        }

        $("#parent").text("");

        data.forEach((item) => {
          if (!categories.includes(item.category)) {
            categories.push(item.category);
          }
          let item_isExpired = isExpired(item.expirationDate);
          let item_stockStatus = getStockStatus(item.quantity,item.minStock);
          if(item.img==="")
          {
            item_img = default_item_img;
          }
          else
          {
            item_img = path.join(img_path, item.img);
            item_img = checkFileExists(item_img) ? item_img : default_item_img;
          }
          
          let item_info = `<div class="col-lg-2 box ${item.category}"
                                onclick="$(this).addToCart(${item._id}, ${
                                  item.quantity
                                }, ${item.stock})">
                            <div class="widget-panel widget-style-2 ${item_isExpired || item_stockStatus < 1 ? "widget-style-danger" : ""}" title="${item.name}">                    
                            <div id="image"><img src="${item_img}" id="product_img" alt=""></div>                    
                                        <div class="text-muted m-t-5 text-center">
                                        <div class="name" id="product_name"><span class="${
                                          item_isExpired ? "text-danger" : ""
                                        }">${item.name}</span></div> 
                                        <span class="sku">${
                                          item.barcode || item._id
                                        }</span>
                                        <span class="${item_stockStatus<1?'text-danger':''}"><span class="stock" data-i18n="STOCK">STOCK </span><span class="count">${
                                          item.stock == 1
                                            ? item.quantity
                                            : "N/A"
                                        }</span></span></div>
                                        <span class="text-success text-center"><b data-plugin="counterup">${
                                          validator.unescape(settings.symbol) +
                                          moneyFormat(item.price)
                                        }</b> </span>
                            </div>
                        </div>`;
          $("#parent").append(item_info);
        });
      });
    }

    //load providers in dropdown
    function loadProviders() {
      $.get(api + "providers/all", function (data) {
        allProviders = data;
        // Update product form provider select
        $("#provider").html(`<option value="">Select</option>`);
        allProviders.forEach((provider) => {
          $("#provider").append(
            `<option value="${provider._id}">${provider.name}</option>`,
          );
        });
        // Rebuild provider filter dropdowns (providers view + products view)
        let filterOpts = `<option value="">All Providers</option>`;
        allProviders.forEach((p) => {
          filterOpts += `<option value="${p._id}">${p.name}</option>`;
        });
        $("#providerListFilter, #productProviderFilter").html(filterOpts);
      });
    }

    //load categories in dropdown and sidebar
    function loadCategories() {
      $.get(api + "categories/all", function (data) {
        allCategories = data;
        loadCategoryList();
        $("#category,#categories").html(`<option value="0" data-i18n="select_category">Select</option>`);
        allCategories.forEach((category) => {
          $("#category,#categories").append(
            `<option value="${category.name}">${category.name}</option>`,
          );
        });
      });
    }

    //
    function loadCustomers() {
      $.get(api + "customers/all", function (customers) {
        $("#customer").html(
          `<option value="0" selected="selected" data-i18n="walk_in_customer">Walk in customer</option>`, 
        );

        customers.forEach((cust) => {
          let customer = `<option value='{"id": ${cust._id}, "name": "${cust.name}"}'>${cust.name}</option>`;
          $("#customer").append(customer);
        });
      });
    }

    // Populate invoice datalist in the product form (for autocomplete)
    function loadInvoicesForForm(providerId) {
      const url = providerId
        ? api + "invoice/invoice/provider/" + providerId
        : api + "invoice/invoices";

      $.get(url, function (data) {
        const invoices = providerId ? (data.invoices || []) : (data || []);
        const sym = (settings && validator.unescape(settings.symbol)) || '';
        const opts = invoices.map(function (inv) {
          const date = inv.invoiceDate
            ? new Date(inv.invoiceDate).toLocaleDateString()
            : '';
          const net = inv.netAmount
            ? sym + parseFloat(inv.netAmount).toFixed(2)
            : '';
          const status = inv.paymentStatus || '';
          const label = [date, net, status].filter(Boolean).join(' · ');
          return `<option value="${inv.invoiceId}">${label}</option>`;
        }).join('');
        $("#invoiceIdList").html(opts);
      });
    }

    // ── INVOICES VIEW ────────────────────────────────────────────
    function loadInvoicesView() {
      $.get(api + "invoice/invoices", function (data) {
        allInvoices = data || [];

        // Populate provider filter from loaded invoices + allProviders
        const providerMap = {};
        allProviders.forEach(function (p) { providerMap[p._id] = p.name; });
        const seenIds = [];
        let opts = '<option value="" data-i18n="inv_all_providers">All Providers</option>';
        allInvoices.forEach(function (inv) {
          if (inv.providerId && !seenIds.includes(inv.providerId)) {
            seenIds.push(inv.providerId);
            opts += '<option value="' + inv.providerId + '">' + (providerMap[inv.providerId] || inv.providerId) + '</option>';
          }
        });
        $("#inv_filter_provider").html(opts);

        renderInvoicesList(allInvoices);
      }).fail(function () {
        notiflix.Report.failure("Error", "Failed to load invoices.", "Ok");
      });
    }

    function applyInvoiceFilter() {
      const id      = $("#inv_search_id").val().trim().toLowerCase();
      const provider = $("#inv_filter_provider").val();
      const dateFrom = $("#inv_filter_date_from").val();
      const dateTo   = $("#inv_filter_date_to").val();
      const status   = $("#inv_filter_status").val();
      const amtMin   = parseFloat($("#inv_filter_amt_min").val()) || 0;
      const amtMaxRaw = $("#inv_filter_amt_max").val();
      const amtMax   = amtMaxRaw !== "" ? parseFloat(amtMaxRaw) : Infinity;
      const now      = new Date();

      const filtered = allInvoices.filter(function (inv) {
        if (id && !(inv.invoiceId || "").toLowerCase().includes(id)) return false;
        if (provider && inv.providerId !== provider) return false;
        if (dateFrom && inv.invoiceDate && new Date(inv.invoiceDate) < new Date(dateFrom)) return false;
        if (dateTo  && inv.invoiceDate && new Date(inv.invoiceDate) > new Date(dateTo + "T23:59:59")) return false;
        const net = parseFloat(inv.netAmount || 0);
        if (net < amtMin) return false;
        if (amtMax !== Infinity && net > amtMax) return false;
        if (status) {
          const isOverdue = inv.paymentStatus !== "paid" && inv.dueDate && new Date(inv.dueDate) < now;
          const eff = inv.paymentStatus === "paid" ? "paid" : (isOverdue ? "overdue" : "pending");
          if (eff !== status) return false;
        }
        return true;
      });

      renderInvoicesList(filtered);
    }

    function renderInvoicesList(invoices) {
      const sym = (settings && validator.unescape(settings.symbol)) || "";
      const now = new Date();
      const providerMap = {};
      allProviders.forEach(function (p) { providerMap[p._id] = p.name; });

      let totalAmt = 0, paidAmt = 0, pendingAmt = 0;
      let html = "";

      invoices.forEach(function (inv) {
        const net  = parseFloat(inv.netAmount  || 0);
        const paid = parseFloat(inv.paidAmount || (inv.paymentStatus === "paid" ? net : 0));
        totalAmt   += net;
        paidAmt    += paid;
        pendingAmt += (net - paid);
        const isOverdue = inv.paymentStatus !== "paid" && inv.dueDate && new Date(inv.dueDate) < now;

        let badge;
        if (inv.paymentStatus === "paid") {
          badge = '<span class="invoice-status-badge badge-paid" data-i18n="status_paid">Paid</span>';
        } else if (isOverdue) {
          badge = '<span class="invoice-status-badge badge-overdue" data-i18n="status_overdue">Overdue</span>';
        } else {
          badge = '<span class="invoice-status-badge badge-pending" data-i18n="status_pending">Pending</span>';
        }

        const provName = inv.providerId ? (providerMap[inv.providerId] || inv.providerId) : "—";
        const invDate  = inv.invoiceDate ? moment(inv.invoiceDate).format("DD MMM YYYY") : "—";
        const dueDate  = inv.dueDate     ? moment(inv.dueDate).format("DD MMM YYYY")     : "—";

        const fileBtn = inv.invoiceFile
          ? "<button onclick=\"$.fn.viewInvoiceFile('" + inv.invoiceFile + "')\" class=\"btn btn-default btn-xs\" title=\"View File\"><i class=\"fa fa-file-pdf-o\"></i></button> "
          : "";
        html += "<tr>" +
          "<td><strong>" + inv.invoiceId + "</strong></td>" +
          "<td>" + provName + "</td>" +
          "<td>" + invDate + "</td>" +
          "<td>" + dueDate + "</td>" +
          "<td>" + sym + net.toFixed(2) + "</td>" +
          "<td>" + badge + "</td>" +
          "<td style=\"white-space:nowrap;\">" +
            "<button onclick=\"$.fn.showInvoiceDetail('" + inv.invoiceId + "')\" class=\"btn btn-info btn-xs\" title=\"View Details\"><i class=\"fa fa-search-plus\"></i></button> " +
            "<button onclick=\"$.fn.editInvoice('" + inv.invoiceId + "')\" class=\"btn btn-warning btn-xs\" title=\"Edit\"><i class=\"fa fa-pencil\"></i></button> " +
            fileBtn +
            "<button onclick=\"$.fn.deleteInvoice('" + inv.invoiceId + "')\" class=\"btn btn-danger btn-xs\" title=\"Delete\"><i class=\"fa fa-trash\"></i></button>" +
          "</td>" +
          "</tr>";
      });

      if (!html) {
        html = '<tr><td colspan="7" class="text-center" style="color:var(--c-muted);padding:20px;" data-i18n="inv_no_results">No invoices match your search.</td></tr>';
      }

      $("#inv_list_body").html(html);
      $("#inv_list_count").text(invoices.length);
      $("#inv_stat_total").text(invoices.length);
      $("#inv_stat_amount").text(sym + totalAmt.toFixed(2));
      $("#inv_stat_paid").text(sym + paidAmt.toFixed(2));
      $("#inv_stat_pending").text(sym + pendingAmt.toFixed(2));
      $("#inv_view_stats_row").show();
      $("#inv_detail_panel").hide();
      $("#inv_detail_placeholder").show();

      if (typeof applyLanguage === "function") applyLanguage(currentLang);
    }

    $.fn.showInvoiceDetail = function (invoiceId) {
      const sym = (settings && validator.unescape(settings.symbol)) || "";
      const now = new Date();
      const providerMap = {};
      allProviders.forEach(function (p) { providerMap[p._id] = p.name; });

      const inv = allInvoices.find(function (i) { return i.invoiceId === invoiceId; });
      if (!inv) return;

      const isOverdue = inv.paymentStatus !== "paid" && inv.dueDate && new Date(inv.dueDate) < now;
      let statusBadge;
      if (inv.paymentStatus === "paid") {
        statusBadge = '<span class="invoice-status-badge badge-paid">Paid</span>';
      } else if (isOverdue) {
        statusBadge = '<span class="invoice-status-badge badge-overdue">Overdue</span>';
      } else {
        statusBadge = '<span class="invoice-status-badge badge-pending">Pending</span>';
      }

      const provName = inv.providerId ? (providerMap[inv.providerId] || inv.providerId) : "—";

      const infoHtml =
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;">' +
          '<div><span style="color:var(--c-muted);">Invoice ID</span><br><strong>' + inv.invoiceId + '</strong></div>' +
          '<div><span style="color:var(--c-muted);">Status</span><br>' + statusBadge + '</div>' +
          '<div><span style="color:var(--c-muted);">Provider</span><br>' + provName + '</div>' +
          '<div><span style="color:var(--c-muted);">Method</span><br>' + (inv.paymentMethod || '—') + '</div>' +
          '<div><span style="color:var(--c-muted);">Invoice Date</span><br>' + (inv.invoiceDate ? moment(inv.invoiceDate).format("DD MMM YYYY") : "—") + '</div>' +
          '<div><span style="color:var(--c-muted);">Due Date</span><br>' + (inv.dueDate ? moment(inv.dueDate).format("DD MMM YYYY") : "—") + '</div>' +
          '<div><span style="color:var(--c-muted);">Total</span><br>' + sym + parseFloat(inv.totalAmount || 0).toFixed(2) + '</div>' +
          '<div><span style="color:var(--c-muted);">Net Amount</span><br><strong>' + sym + parseFloat(inv.netAmount || 0).toFixed(2) + '</strong></div>' +
          '<div><span style="color:var(--c-muted);">Tax</span><br>' + sym + parseFloat(inv.taxAmount || 0).toFixed(2) + '</div>' +
          '<div><span style="color:var(--c-muted);">Discount</span><br>' + sym + parseFloat(inv.discountAmount || 0).toFixed(2) + '</div>' +
          (inv.notes ? '<div style="grid-column:1/-1;"><span style="color:var(--c-muted);">Notes</span><br>' + inv.notes + '</div>' : '') +
        '</div>';

      $("#inv_detail_info").html(infoHtml);

      // Action buttons
      let actionsHtml =
        "<button onclick=\"$.fn.editInvoice('" + inv.invoiceId + "')\" class=\"btn btn-warning btn-sm\">" +
          "<i class=\"fa fa-pencil\"></i> Edit Invoice" +
        "</button>";
      if (inv.invoiceFile) {
        actionsHtml +=
          " <button onclick=\"$.fn.viewInvoiceFile('" + inv.invoiceFile + "')\" class=\"btn btn-info btn-sm\">" +
            "<i class=\"fa fa-file-pdf-o\"></i> View File" +
          "</button>";
      }
      actionsHtml +=
        " <button onclick=\"$.fn.deleteInvoice('" + inv.invoiceId + "')\" class=\"btn btn-danger btn-sm\">" +
          "<i class=\"fa fa-trash\"></i> Delete" +
        "</button>";
      $("#inv_detail_actions").html(actionsHtml);

      $("#inv_detail_placeholder").hide();
      $("#inv_detail_panel").show();
      $("#inv_pay_summary").hide();
      $("#inv_pay_stats").empty();
      $("#inv_pay_rows").empty();

      // Load provider payments (if invoice has a provider)
      if (inv.providerId) {
        $.get(api + "payment/provider/" + inv.providerId, function (payData) {
          const payments = payData.payments || [];
          const totalInvoiced = parseFloat(payData.totalInvoiced || 0);
          const totalPaid     = parseFloat(payData.totalPaid || 0);
          const balance       = parseFloat(payData.balance || 0);
          const balColor      = balance > 0 ? "var(--c-danger)" : "var(--c-success)";

          // 3 mini stat chips
          const statsHtml =
            '<div style="flex:1;min-width:90px;padding:8px 12px;background:var(--c-bg);border-radius:var(--radius-sm);border:1px solid var(--c-border);text-align:center;">' +
              '<div style="font-size:10px;color:var(--c-muted);text-transform:uppercase;letter-spacing:.4px;">Total Invoiced</div>' +
              '<div style="font-size:14px;font-weight:700;color:var(--c-text);">' + sym + totalInvoiced.toFixed(2) + '</div>' +
            '</div>' +
            '<div style="flex:1;min-width:90px;padding:8px 12px;background:var(--c-bg);border-radius:var(--radius-sm);border:1px solid var(--c-border);text-align:center;">' +
              '<div style="font-size:10px;color:var(--c-muted);text-transform:uppercase;letter-spacing:.4px;">Payments Made</div>' +
              '<div style="font-size:14px;font-weight:700;color:var(--c-success);">' + sym + totalPaid.toFixed(2) + '</div>' +
            '</div>' +
            '<div style="flex:1;min-width:90px;padding:8px 12px;background:var(--c-bg);border-radius:var(--radius-sm);border:1px solid var(--c-border);text-align:center;">' +
              '<div style="font-size:10px;color:var(--c-muted);text-transform:uppercase;letter-spacing:.4px;">Balance Due</div>' +
              '<div style="font-size:14px;font-weight:700;color:' + balColor + ';">' + sym + balance.toFixed(2) + '</div>' +
            '</div>';
          $("#inv_pay_stats").html(statsHtml);

          // Payment rows
          const methodLabels = { cash: "Cash", bank_transfer: "Bank Transfer", check: "Check", other: "Other" };
          let running = totalInvoiced;
          let rowsHtml = "";
          if (payments.length > 0) {
            payments.forEach(function (p) {
              running -= parseFloat(p.amount || 0);
              const rc = running > 0 ? "var(--c-danger)" : "var(--c-success)";
              rowsHtml +=
                "<tr>" +
                "<td>" + (p.paymentDate ? moment(p.paymentDate).format("DD MMM YYYY") : "—") + "</td>" +
                "<td><strong>" + sym + parseFloat(p.amount || 0).toFixed(2) + "</strong></td>" +
                "<td>" + (methodLabels[p.paymentMethod] || p.paymentMethod || "—") + "</td>" +
                "<td style='color:" + rc + ";font-weight:600;'>" + sym + running.toFixed(2) + "</td>" +
                "</tr>";
            });
          } else {
            rowsHtml = '<tr><td colspan="4" class="text-center" style="color:var(--c-muted);">No payments recorded yet.</td></tr>';
          }
          $("#inv_pay_rows").html(rowsHtml);
          $("#inv_pay_summary").show();
        });
      }

      // Load linked products
      $.get(api + "invoice/invoice/" + invoiceId + "/products", function (products) {
        let prodHtml = "";
        if (products && products.length > 0) {
          products.forEach(function (p) {
            prodHtml += "<tr>" +
              "<td>" + (p.name || "—") + "</td>" +
              "<td>" + (p.barcode || "—") + "</td>" +
              "<td>" + (p.quantity || 0) + "</td>" +
              "<td>" + sym + parseFloat(p.costPrice || 0).toFixed(2) + "</td>" +
              "<td>" + sym + parseFloat(p.price || 0).toFixed(2) + "</td>" +
              "<td>" + (p.expirationDate || "—") + "</td>" +
              "</tr>";
          });
        } else {
          prodHtml = '<tr><td colspan="6" class="text-center" style="color:var(--c-muted);" data-i18n="inv_no_linked_products">No linked products for this invoice.</td></tr>';
        }
        $("#inv_detail_products_body").html(prodHtml);
        if (typeof applyLanguage === "function") applyLanguage(currentLang);
      }).fail(function () {
        $("#inv_detail_products_body").html('<tr><td colspan="6" class="text-center text-danger">Failed to load products.</td></tr>');
      });
    };

    // Live filter events for invoices view
    $("#inv_search_id").on("input", applyInvoiceFilter);
    $("#inv_filter_provider, #inv_filter_status").on("change", applyInvoiceFilter);
    $("#inv_filter_date_from, #inv_filter_date_to").on("change", applyInvoiceFilter);
    $("#inv_filter_amt_min, #inv_filter_amt_max").on("input", applyInvoiceFilter);
    $("#inv_clear_filter").on("click", function () {
      $("#inv_search_id").val("");
      $("#inv_filter_provider").val("");
      $("#inv_filter_date_from").val("");
      $("#inv_filter_date_to").val("");
      $("#inv_filter_status").val("");
      $("#inv_filter_amt_min").val("");
      $("#inv_filter_amt_max").val("");
      renderInvoicesList(allInvoices);
    });

    // Load and render invoice list for a selected provider
    function loadInvoiceList(providerId) {
      if (!providerId) {
        $("#invoice_list").empty();
        $("#providerInvoiceTable").hide();
        $("#invoice_list_placeholder").show();
        $("#invoice_stats_row").hide();
        return;
      }

      $.get(api + "invoice/invoice/provider/" + providerId, function (data) {
        currentProviderInvoiceData = data;
        updateProviderStats(data);

        const sym = (settings && validator.unescape(settings.symbol)) || '';
        const now = new Date();
        let html = '';

        if (data.invoices && data.invoices.length > 0) {
          data.invoices.forEach(function (inv) {
            const date = inv.invoiceDate
              ? new Date(inv.invoiceDate).toLocaleDateString()
              : '-';
            const dueDate = inv.dueDate
              ? new Date(inv.dueDate).toLocaleDateString()
              : '-';
            const amount = parseFloat(inv.totalAmount || 0).toFixed(2);
            const net    = parseFloat(inv.netAmount   || 0).toFixed(2);

            const isOverdue =
              inv.paymentStatus === 'pending' &&
              inv.dueDate &&
              new Date(inv.dueDate) < now;

            let statusBadge;
            if (inv.paymentStatus === 'paid') {
              statusBadge = `<span class="invoice-status-badge badge-paid" data-i18n="status_paid">Paid</span>`;
            } else if (isOverdue) {
              statusBadge = `<span class="invoice-status-badge badge-overdue" data-i18n="status_overdue">Overdue</span>`;
            } else {
              statusBadge = `<span class="invoice-status-badge badge-pending" data-i18n="status_pending">Pending</span>`;
            }

            const fileBtn = inv.invoiceFile
              ? `<button onclick="$(this).viewInvoiceFile('${inv.invoiceFile}')" class="btn btn-info btn-xs" title="View Bill"><i class="fa fa-file-image-o"></i> View</button> `
              : `<button class="btn btn-default btn-xs" disabled title="No file attached"><i class="fa fa-file-o"></i></button> `;

            const markPaidBtn = inv.paymentStatus !== 'paid'
              ? `<button onclick="$(this).markInvoicePaid('${inv.invoiceId}')" class="btn btn-success btn-xs" title="Mark as Paid"><i class="fa fa-check"></i></button> `
              : '';

            const editBtn = `<button onclick="$(this).editInvoice('${inv.invoiceId}')" class="btn btn-warning btn-xs" title="Edit"><i class="fa fa-edit"></i></button> `;

            html += `<tr>
              <td><strong>${inv.invoiceId}</strong></td>
              <td>${date}</td>
              <td>${dueDate}</td>
              <td>${sym}${amount}</td>
              <td>${sym}${net}</td>
              <td>${statusBadge}</td>
              <td class="nobr">
                <span class="btn-group">
                  ${fileBtn}${editBtn}${markPaidBtn}<button onclick="$(this).deleteInvoice('${inv.invoiceId}')" class="btn btn-danger btn-xs" title="Delete"><i class="fa fa-trash"></i></button>
                </span>
              </td>
            </tr>`;
          });
        } else {
          html = `<tr><td colspan="7" class="text-center" style="color:var(--c-muted);padding:20px;" data-i18n="no_invoices_msg">No invoices found for this provider.</td></tr>`;
        }

        $("#invoice_list").html(html);
        $("#invoice_list_placeholder").hide();
        $("#providerInvoiceTable").show();
        // Re-apply translations to dynamically created elements
        if (typeof applyLanguage === 'function') applyLanguage(currentLang);
      }).fail(function () {
        currentProviderInvoiceData = null;
        $("#invoice_list").html(
          `<tr><td colspan="7" class="text-center text-danger">Failed to load invoices.</td></tr>`
        );
        $("#invoice_list_placeholder").hide();
        $("#providerInvoiceTable").show();
      });
    }

    // ── PAYMENT INSTALLMENTS ─────────────────────────────────────────────────
    let currentProviderPayments = [];
    let currentProviderBalance  = 0;

    function loadPaymentList(providerId) {
      if (!providerId) {
        currentProviderPayments = [];
        $("#payment_list").empty();
        $("#pay_list_count").text(0);
        return;
      }

      $.get(api + "payment/provider/" + providerId, function (data) {
        currentProviderPayments = data.payments || [];
        const sym = (settings && validator.unescape(settings.symbol)) || '';

        // Update stat cards
        const totalInvoiced = parseFloat(data.totalInvoiced || 0);
        const totalPaid     = parseFloat(data.totalPaid || 0);
        const balance       = parseFloat(data.balance || 0);
        currentProviderBalance = balance;
        $("#pay_stat_invoiced").text(totalInvoiced.toFixed(2));  // hidden, used by export
        $("#pay_stat_count").text(currentProviderPayments.length); // hidden, used by export
        $("#pay_stat_paid").text(sym + totalPaid.toFixed(2));
        $("#pay_stat_balance").text(sym + balance.toFixed(2));

        // Update the balance chip with color coding
        $("#provider_info_balance").text(sym + balance.toFixed(2))
          .css("color", balance > 0 ? "var(--c-danger)" : "var(--c-success)");

        // Render 5-column rows (Date / Amount / Method / Running Balance / Actions)
        let html = '';
        let running = totalInvoiced;
        const methodLabels = { cash: 'Cash', bank_transfer: 'Bank', check: 'Check', other: 'Other' };
        if (currentProviderPayments.length > 0) {
          currentProviderPayments.forEach(function (p) {
            running -= parseFloat(p.amount || 0);
            const method = methodLabels[p.paymentMethod] || p.paymentMethod || '—';
            const balColor = running > 0 ? "var(--c-danger)" : "var(--c-success)";
            html += "<tr>" +
              "<td>" + (p.paymentDate ? moment(p.paymentDate).format("DD MMM YYYY") : "—") + "</td>" +
              "<td><strong>" + sym + parseFloat(p.amount || 0).toFixed(2) + "</strong></td>" +
              "<td>" + method + "</td>" +
              "<td style='color:" + balColor + ";font-weight:600;'>" + sym + running.toFixed(2) + "</td>" +
              "<td style='white-space:nowrap;'>" +
                "<button onclick=\"$.fn.editPayment('" + p.paymentId + "')\" class='btn btn-warning btn-xs' title='Edit'><i class='fa fa-pencil'></i></button> " +
                "<button onclick=\"$.fn.deletePayment('" + p.paymentId + "')\" class='btn btn-danger btn-xs' title='Delete'><i class='fa fa-trash'></i></button>" +
              "</td>" +
              "</tr>";
          });
        } else {
          html = '<tr><td colspan="5" class="text-center" style="color:var(--c-muted);padding:20px;">No payments recorded yet.</td></tr>';
        }
        $("#payment_list").html(html);
        $("#pay_list_count").text(currentProviderPayments.length);
        if (typeof applyLanguage === 'function') applyLanguage(currentLang);
      }).fail(function () {
        notiflix.Report.failure("Error", "Failed to load payments.", "Ok");
      });
    }

    // ── ADD PAYMENT BUTTON ───────────────────────────────────────────────────
    $("#addPaymentBtn").on("click", function () {
      const today = new Date().toISOString().split('T')[0];
      $("#savePayment")[0].reset();
      $("#pay_original_id").val("");
      $("#pay_provider_id").val(currentProvider ? currentProvider._id : "");
      $("#pay_date").val(today);
      $("#pay_method").val("cash");
      if (currentProviderBalance > 0) {
        $("#pay_amount").val(currentProviderBalance.toFixed(2));
      }
      $("#paymentFormIcon").attr("class", "fa fa-plus-circle");
      $("#paymentFormTitle").text(t('add_payment_title'));
      $("#newPayment").modal("show");
    });

    // ── SAVE PAYMENT FORM ────────────────────────────────────────────────────
    $("#savePayment").submit(function (e) {
      e.preventDefault();
      const amount = parseFloat($("#pay_amount").val());
      if (!amount || amount <= 0) {
        notiflix.Report.warning("Validation", "Please enter a valid amount.", "Ok");
        return;
      }
      if (!$("#pay_date").val()) {
        notiflix.Report.warning("Validation", "Please enter a payment date.", "Ok");
        return;
      }

      const originalId = $("#pay_original_id").val();
      const isEdit = originalId !== "";
      const payload = {
        amount:        amount,
        paymentDate:   $("#pay_date").val(),
        paymentMethod: $("#pay_method").val(),
        reference:     $("#pay_reference").val(),
        notes:         $("#pay_notes").val(),
      };

      if (isEdit) {
        $.ajax({
          url: api + "payment/" + originalId,
          type: "PUT",
          contentType: "application/json",
          data: JSON.stringify(payload),
          success: function () {
            $("#newPayment").modal("hide");
            notiflix.Report.success("Updated", "Payment updated.", "Ok");
            if (currentProvider) { loadPaymentList(currentProvider._id); loadInvoiceList(currentProvider._id); }
          },
          error: function (err) {
            const msg = (err.responseJSON && err.responseJSON.message) || "Unknown error.";
            notiflix.Report.failure("Error", "Failed to update: " + msg, "Ok");
          }
        });
      } else {
        payload.providerId = $("#pay_provider_id").val();
        $.ajax({
          url: api + "payment/",
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify(payload),
          success: function () {
            $("#newPayment").modal("hide");
            notiflix.Report.success("Saved", "Payment recorded.", "Ok");
            if (currentProvider) { loadPaymentList(currentProvider._id); loadInvoiceList(currentProvider._id); }
          },
          error: function (err) {
            const msg = (err.responseJSON && err.responseJSON.message) || "Unknown error.";
            notiflix.Report.failure("Error", "Failed to save: " + msg, "Ok");
          }
        });
      }
    });

    // ── EDIT PAYMENT ─────────────────────────────────────────────────────────
    $.fn.editPayment = function (paymentId) {
      const p = currentProviderPayments.find(function (x) { return x.paymentId === paymentId; });
      if (!p) return;
      $("#pay_original_id").val(p.paymentId);
      $("#pay_provider_id").val(p.providerId);
      $("#pay_amount").val(parseFloat(p.amount || 0).toFixed(2));
      $("#pay_date").val(p.paymentDate ? p.paymentDate.split('T')[0] : '');
      $("#pay_method").val(p.paymentMethod || 'cash');
      $("#pay_reference").val(p.reference || '');
      $("#pay_notes").val(p.notes || '');
      $("#paymentFormIcon").attr("class", "fa fa-edit");
      $("#paymentFormTitle").text(t('edit_payment_title'));
      $("#newPayment").modal("show");
    };

    // ── DELETE PAYMENT ───────────────────────────────────────────────────────
    $.fn.deletePayment = function (paymentId) {
      notiflix.Confirm.show(
        "Delete Payment?",
        "This will permanently remove the payment record.",
        "Yes, delete",
        "Cancel",
        function () {
          $.ajax({
            url: api + "payment/" + paymentId,
            type: "DELETE",
            success: function () {
              notiflix.Report.success("Deleted", "Payment removed.", "Ok");
              if (currentProvider) { loadPaymentList(currentProvider._id); loadInvoiceList(currentProvider._id); }
            },
            error: function (err) {
              const msg = (err.responseJSON && err.responseJSON.message) || "Cannot delete.";
              notiflix.Report.failure("Error", msg, "Ok");
            }
          });
        }
      );
    };

    // ── PAYMENT CSV EXPORT ───────────────────────────────────────────────────
    $("#exportPaymentCsvBtn").on("click", function () {
      const sym  = (settings && validator.unescape(settings.symbol)) || '';
      const prov = currentProvider || {};
      const payments = currentProviderPayments;

      function q(v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }
      function csvRow(arr) { return arr.map(q).join(","); }

      const rows = [];
      rows.push(["Provider Payment Report"]);
      rows.push(["Provider", prov.name || ""]);
      rows.push(["Phone",    prov.phone || ""]);
      rows.push(["Generated", moment().format("YYYY-MM-DD HH:mm:ss")]);
      rows.push([]);

      const totalPaid = payments.reduce(function (s, p) { return s + parseFloat(p.amount || 0); }, 0);
      rows.push(["SUMMARY"]);
      rows.push(["Total Payments Made", payments.length]);
      rows.push(["Total Amount Paid",   sym + totalPaid.toFixed(2)]);
      rows.push([]);

      rows.push(["PAYMENTS"]);
      rows.push(["Date", "Amount", "Method", "Reference", "Running Balance", "Notes"]);
      let running = parseFloat($("#pay_stat_invoiced").text().replace(/[^0-9.-]/g, '')) || 0;
      payments.forEach(function (p) {
        running -= parseFloat(p.amount || 0);
        const methodLabels = { cash: 'Cash', bank_transfer: 'Bank Transfer', check: 'Check', other: 'Other' };
        rows.push([
          p.paymentDate ? moment(p.paymentDate).format("YYYY-MM-DD") : "",
          parseFloat(p.amount || 0).toFixed(2),
          methodLabels[p.paymentMethod] || p.paymentMethod || "",
          p.reference || "",
          running.toFixed(2),
          p.notes || "",
        ]);
      });

      const csv = "\uFEFF" + rows.map(csvRow).join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = "payments_" + (prov.name || "provider").replace(/\s+/g, "_") + "_" + moment().format("YYYYMMDD") + ".csv";
      a.click();
      URL.revokeObjectURL(url);
    });

    // ── PAYMENT PDF EXPORT ───────────────────────────────────────────────────
    $("#exportPaymentPdfBtn").on("click", function () {
      const sym  = (settings && validator.unescape(settings.symbol)) || '';
      const prov = currentProvider || {};
      const payments = currentProviderPayments;
      const now  = moment().format("DD MMM YYYY HH:mm");

      const totalInvoiced = parseFloat($("#pay_stat_invoiced").text().replace(/[^0-9.-]/g, '')) || 0;
      const totalPaid     = payments.reduce(function (s, p) { return s + parseFloat(p.amount || 0); }, 0);
      const balance       = totalInvoiced - totalPaid;

      function isArabic(str) { return /[\u0600-\u06FF]/.test(str); }
      function cell(text, opts) {
        const t = String(text == null ? "" : text);
        const base = { text: t, style: isArabic(t) ? "arabic" : undefined };
        return Object.assign(base, opts || {});
      }

      const methodLabels = { cash: 'Cash', bank_transfer: 'Bank Transfer', check: 'Check', other: 'Other' };
      let running = totalInvoiced;
      const tableRows = payments.map(function (p) {
        running -= parseFloat(p.amount || 0);
        return [
          cell(p.paymentDate ? moment(p.paymentDate).format("DD MMM YYYY") : "—"),
          cell(sym + parseFloat(p.amount || 0).toFixed(2), { bold: true }),
          cell(methodLabels[p.paymentMethod] || p.paymentMethod || "—"),
          cell(p.reference || "—"),
          cell(sym + running.toFixed(2), { color: running > 0 ? "#c0392b" : "#27ae60" }),
          cell(p.notes || "—"),
        ];
      });

      if (tableRows.length === 0) {
        tableRows.push([{ text: "No payments recorded.", colSpan: 6, alignment: "center", color: "#999" }, {}, {}, {}, {}, {}]);
      }

      const docDef = {
        pageSize: "A4",
        pageMargins: [30, 40, 30, 40],
        defaultStyle: { font: "Tahoma", fontSize: 10 },
        styles: {
          arabic: { font: "Tahoma" },
          title:  { fontSize: 16, bold: true, color: "#1a3c5e" },
          meta:   { fontSize: 9, color: "#666" },
          section: { fontSize: 10, bold: true, color: "#ffffff", fillColor: "#2c7be5" },
          summaryLabel: { fontSize: 9, color: "#555" },
          summaryValue: { fontSize: 11, bold: true, color: "#1a3c5e" },
        },
        content: [
          { text: "Provider Payment Report", style: "title", margin: [0, 0, 0, 4] },
          { text: "Generated: " + now, style: "meta", margin: [0, 0, 0, 12] },

          // Provider info
          {
            table: { widths: ["*", "*"], body: [
              [cell("Provider: " + (prov.name || "—"), { bold: true }), cell("Phone: " + (prov.phone || "—"))],
              [cell("Email: " + (prov.email || "—")), cell("")]
            ]},
            layout: "lightHorizontalLines", margin: [0, 0, 0, 14]
          },

          // Summary stats
          {
            table: { widths: ["*", "*", "*"], body: [[
              { stack: [{ text: "Total Invoiced", style: "summaryLabel" }, { text: sym + totalInvoiced.toFixed(2), style: "summaryValue" }], alignment: "center" },
              { stack: [{ text: "Total Paid", style: "summaryLabel" }, { text: sym + totalPaid.toFixed(2), style: "summaryValue", color: "#27ae60" }], alignment: "center" },
              { stack: [{ text: "Remaining Balance", style: "summaryLabel" }, { text: sym + balance.toFixed(2), style: "summaryValue", color: balance > 0 ? "#c0392b" : "#27ae60" }], alignment: "center" },
            ]]},
            layout: "lightHorizontalLines", margin: [0, 0, 0, 14]
          },

          // Payments table
          { text: "Payment History", style: "section", margin: [0, 0, 0, 4] },
          {
            table: {
              headerRows: 1,
              widths: ["auto", "auto", "auto", "auto", "auto", "*"],
              body: [
                [
                  { text: "Date",            bold: true, fillColor: "#eaf1fb" },
                  { text: "Amount",          bold: true, fillColor: "#eaf1fb" },
                  { text: "Method",          bold: true, fillColor: "#eaf1fb" },
                  { text: "Reference",       bold: true, fillColor: "#eaf1fb" },
                  { text: "Running Balance", bold: true, fillColor: "#eaf1fb" },
                  { text: "Notes",           bold: true, fillColor: "#eaf1fb" },
                ],
                ...tableRows
              ]
            },
            layout: "lightHorizontalLines"
          }
        ]
      };

      pdfMake.fonts = {
        Tahoma: {
          normal:     "Tahoma.ttf",
          bold:       "Tahoma.ttf",
          italics:    "Tahoma.ttf",
          bolditalics:"Tahoma.ttf",
        }
      };
      pdfMake.createPdf(docDef).download("payments_" + (prov.name || "provider").replace(/\s+/g, "_") + "_" + moment().format("YYYYMMDD") + ".pdf");
    });

    $.fn.addToCart = function (id, count, stock) {
      $.get(api + "inventory/product/" + id, function (product) {
        if (isExpired(product.expirationDate)) {
          notiflix.Report.failure(
            "Expired",
            `${product.name} is expired! Please restock.`,
            "Ok",
          );
        } else {
          if (count > 0) {
            $(this).addProductToCart(product);
          } else {
            if (stock == 1) {
              notiflix.Report.failure(
                "Out of stock!",
                `${product.name} is out of stock! Please restock.`,
                "Ok",
              );
            }
          }
        }
      });
    };

    function barcodeSearch(e) {
      e.preventDefault();
      console.log($("#skuCode").val());
      let searchBarCodeIcon = $(".search-barcode-btn").html();
      $(".search-barcode-btn").empty();
      $(".search-barcode-btn").append(
        $("<i>", { class: "fa fa-spinner fa-spin" }),
      );

      let req = {
        skuCode: $("#skuCode").val(),
      };

      $.ajax({
        url: api + "inventory/product/sku",
        type: "POST",
        data: JSON.stringify(req),
        contentType: "application/json; charset=utf-8",
        cache: false,
        processData: false,
        success: function (product) {
          $(".search-barcode-btn").html(searchBarCodeIcon);
          const expired = isExpired(product.expirationDate);
          if (product._id != undefined && product.quantity >= 1 && !expired) {
            $(this).addProductToCart(product);
            $("#searchBarCode").get(0).reset();
            $("#basic-addon2").empty();
            $("#basic-addon2").append(
              $("<i>", { class: "glyphicon glyphicon-ok" }),
            );
            $("#skuCode").trigger("focus");
          }
          else if(product == "")
          {
            notiflix.Report.warning(
              "Product Not Found!",
              "<b>" + $("#skuCode").val() + "</b> is not a valid barcode!",
              "Ok",
            );
          }
          else if (expired) {
            notiflix.Report.failure(
              "This is Expired!",
              `${product.name} is expired`,
              "Ok",
            );
          } else if (product.quantity < 0.5) {
            notiflix.Report.info(
              "Out of stock!",
              "This item is currently unavailable",
              "Ok",
            );
          } else {
            notiflix.Report.warning(
              "Not Found!",
              "<b>" + $("#skuCode").val() + "</b> is not a valid barcode!",
              "Ok",
            );

            $("#searchBarCode").get(0).reset();
            $("#basic-addon2").empty();
            $("#basic-addon2").append(
              $("<i>", { class: "glyphicon glyphicon-ok" }),
            );
          }
        },
        error: function (err) {
          if (err.status === 422) {
            $(this).showValidationError(data);
            $("#basic-addon2").append(
              $("<i>", { class: "glyphicon glyphicon-remove" }),
            );
          } else if (err.status === 404) {
            $("#basic-addon2").empty();
            $("#basic-addon2").append(
              $("<i>", { class: "glyphicon glyphicon-remove" }),
            );
          } else {
            $(this).showServerError();
            $("#basic-addon2").empty();
            $("#basic-addon2").append(
              $("<i>", { class: "glyphicon glyphicon-warning-sign" }),
            );
          }
          $("#searchBarCode").get(0).reset();
          $("#skuCode").trigger("focus");
        },
      });
    }

    $("#searchBarCode").on("submit", function (e) {
      barcodeSearch(e);
    });

    // Auto-focus barcode input on load so scanner can type immediately
    $("#skuCode").trigger("focus");

    $("body").on("click", "#jq-keyboard button", function (e) {
      let pressed = $(this)[0].className.split(" ");
      if ($("#skuCode").val() != "" && pressed[2] == "enter") {
        barcodeSearch(e);
      }
    });

    $.fn.addProductToCart = function (data) {
      item = {
        id: data._id,
        product_name: data.name,
        sku: data.sku,
        price: data.price,
        profit_margin: parseFloat(data.profitMargin) || 0,
        quantity: 1,
      };

      if ($(this).isExist(item)) {
        $(this).qtIncrement(index);
      } else {
        cart.push(item);
        $(this).renderTable(cart);
      }
    };

    $.fn.isExist = function (data) {
      let toReturn = false;
      $.each(cart, function (index, value) {
        if (value.id == data.id) {
          $(this).setIndex(index);
          toReturn = true;
        }
      });
      return toReturn;
    };

    $.fn.setIndex = function (value) {
      index = value;
    };

    $.fn.calculateCart = function () {
      let total = 0;
      let totalCost = 0;
      let grossTotal;
      let total_items = 0;
      $.each(cart, function (index, data) {
        let margin = data.profit_margin || 0;
        total += data.quantity * data.price;
        totalCost += data.quantity * data.price * 100 / (100 + margin);
        total_items += parseFloat(data.quantity);
      });
      $("#total").text(total_items);
      total = total - $("#inputDiscount").val();
      $("#price").text(validator.unescape(settings.symbol) + moneyFormat(total.toFixed(2)));

      subTotal = total;

      if ($("#inputDiscount").val() >= total) {
        $("#inputDiscount").val(0);
      }

      if (settings.charge_tax) {
        totalVat = (total * vat) / 100;
        grossTotal = total + totalVat;
      } else {
        grossTotal = total;
      }

      orderTotal = grossTotal.toFixed(2);

      $("#gross_price").text(validator.unescape(settings.symbol) + moneyFormat(orderTotal));
      $("#payablePrice").val(moneyFormat(grossTotal));

      let profit = total - totalCost;
      $("#bill_cost").text(validator.unescape(settings.symbol) + moneyFormat(totalCost.toFixed(2)));
      $("#bill_profit")
        .text(validator.unescape(settings.symbol) + moneyFormat(profit.toFixed(2)))
        .toggleClass("text-success", profit >= 0)
        .toggleClass("text-danger", profit < 0);
    };

    $.fn.renderTable = function (cartList) {
      $("#cartTable .card-body").empty();
      $(this).calculateCart();
      $.each(cartList, function (index, data) {
        $("#cartTable .card-body").append(
          $("<div>", { class: "row m-t-10" }).append(
            $("<div>", { class: "col-md-1", text: index + 1 }),
            $("<div>", { class: "col-md-3", text: data.product_name }),
            $("<div>", { class: "col-md-3" }).append(
              $("<div>", { class: "input-group" }).append(
                $("<span>", { class: "input-group-btn" }).append(
                  $("<button>", {
                    class: "btn btn-light",
                    onclick: "$(this).qtDecrement(" + index + ")",
                  }).append($("<i>", { class: "fa fa-minus" })),
                ),
                $("<input>", {
                  class: "form-control",
                  type: "text",
                  value: data.quantity,
                  min: "1",
                  onchange: "$(this).qtInput(" + index + ")",
                }),
                $("<span>", { class: "input-group-btn" }).append(
                  $("<button>", {
                    class: "btn btn-light",
                    onclick: "$(this).qtIncrement(" + index + ")",
                  }).append($("<i>", { class: "fa fa-plus" })),
                ),
              ),
            ),
            $("<div>", {
              class: "col-md-3",
              text:
                validator.unescape(settings.symbol) +
                moneyFormat((data.price * data.quantity).toFixed(2)),
            }),
            $("<div>", { class: "col-md-1" }).append(
              $("<button>", {
                class: "btn btn-light btn-xs",
                onclick: "$(this).deleteFromCart(" + index + ")",
              }).append($("<i>", { class: "fa fa-times" })),
            ),
          ),
        );
      });
    };

    $.fn.deleteFromCart = function (index) {
      cart.splice(index, 1);
      $(this).renderTable(cart);
    };

    $.fn.qtIncrement = function (i) {
      item = cart[i];
      let product = allProducts.filter(function (selected) {
        return selected._id == parseInt(item.id);
      });
     
      if (product[0].stock == 1) {
        if (item.quantity < product[0].quantity) {
          item.quantity = parseFloat(item.quantity) + 0.5;
          $(this).renderTable(cart);
        } else {
          notiflix.Report.info(
            "No more stock!",
            "You have already added all the available stock.",
            "Ok",
          );
        }
      } else {
        item.quantity = parseFloat(item.quantity) + 0.5;
        $(this).renderTable(cart);
      }
    };

    $.fn.qtDecrement = function (i) {
      if (item.quantity > 0.1) {
        item = cart[i];
        
        item.quantity = Number((parseFloat(item.quantity) - 0.1).toFixed(2)) ;
         
        $(this).renderTable(cart);
      }
    };

    $.fn.qtInput = function (i) {
      item = cart[i];
      // item.quantity = $(this).val();
      // $(this).renderTable(cart);
      item.quantity = $(this).val();
      let product = allProducts.filter(function (selected) {
        return selected._id == parseInt(item.id);
      });
      if (product[0].stock == 1) {
        if (parseFloat(item.quantity) < parseFloat(product[0].quantity)) {
          $(this).renderTable(cart);
        } else {
          notiflix.Report.info(
            "No more stock!",
            "You have already added all the available stock.",
            "Ok",
          );
        }
      } else {
        item.quantity = $(this).val();
        $(this).renderTable(cart);
      }
      
    };


    $.fn.cancelOrder = function () {
      if (cart.length > 0) {
        const diagOptions = {
          title: "Are you sure?",
          text: "You are about to remove all items from the cart.",
          icon: "warning",
          showCancelButton: true,
          okButtonText: "Yes, clear it!",
          cancelButtonText: "Cancel",
          options: {
            // okButtonBackground: "#3085d6",
            cancelButtonBackground: "#d33",
          },
        };

        notiflix.Confirm.show(
          diagOptions.title,
          diagOptions.text,
          diagOptions.okButtonText,
          diagOptions.cancelButtonText,
          () => {
            cart = [];
            $(this).renderTable(cart);
            holdOrder = 0;
            notiflix.Report.success(
              "Cleared!",
              "All items have been removed.",
              "Ok",
            );
          },
          "",
          diagOptions.options,
        );
      }
    };

    $("#payButton").on("click", function () {
      if (cart.length != 0) {
        $("#paymentModel").modal("toggle");
      } else {
        notiflix.Report.warning("Oops!", "There is nothing to pay!", "Ok");
      }
    });

    $("#hold").on("click", function () {
      if (cart.length != 0) {
        $("#dueModal").modal("toggle");
      } else {
        notiflix.Report.warning("Oops!", "There is nothing to hold!", "Ok");
      }
    });

    function printJobComplete() {
      notiflix.Report.success("Done", "print job complete", "Ok");
    }

    $.fn.submitDueOrder = function (status) {
      let items = "";
      let payment = 0.0;
      paymentType = $('.list-group-item.active').data('payment-type');
      cart.forEach((item) => {
    items += `<tr><td>${DOMPurify.sanitize(item.product_name)}</td><td>${
      DOMPurify.sanitize(item.quantity)
    } </td><td class="text-right"> ${DOMPurify.sanitize(validator.unescape(settings.symbol))} ${moneyFormat(
      DOMPurify.sanitize(Math.abs(item.price).toFixed(2)),
    )} </td></tr>`;
});

      let currentTime = new Date(moment());
      let discount = $("#inputDiscount").val();
      console.log($("#customer").val()) 
      let customer = JSON.parse($("#customer").val());
      let date = moment(currentTime).format("YYYY-MM-DD HH:mm:ss");
      let paymentAmount = $("#payment").val().replace(",", "");
      let changeAmount = $("#change").text().replace(",", "");
      let mobileNumber = $("#paymentInfo").val();
      let paid =
        $("#payment").val() == "" ? "" : parseFloat(paymentAmount).toFixed(2);
      let change =
        $("#change").text() == "" ? "" : parseFloat(changeAmount).toFixed(2);
      let refNumber = $("#refNumber").val();
      let orderNumber = holdOrder;
      let type = "";
      let tax_row = "";
      switch (paymentType) {
        case 1:
          type = "Cash";
          break;
        case 3:
          type = "Mobile App (PalPay)";
          break;
      }

      if (paid != "") {
        payment = `<tr>
                        <td>Paid</td>
                        <td>:</td>
                        <td class="text-right">${validator.unescape(settings.symbol)} ${moneyFormat(
                          Math.abs(paid).toFixed(2),
                        )}</td>
                    </tr>
                    <tr>
                        <td>Change</td>
                        <td>:</td>
                        <td class="text-right">${validator.unescape(settings.symbol)} ${moneyFormat(
                          Math.abs(change).toFixed(2),
                        )}</td>
                    </tr>
                    <tr>
                        <td>Method</td>
                        <td>:</td>
                        <td class="text-right">${type}</td>
                    </tr>`;
      }

      if (settings.charge_tax) {
        tax_row = `<tr>
                    <td>VAT(${validator.unescape(settings.percentage)})% </td>
                    <td>:</td>
                    <td class="text-right">${validator.unescape(settings.symbol)} ${moneyFormat(
                      parseFloat(totalVat).toFixed(2),
                    )}</td>
                </tr>`;
      }

      if (status == 0) {
        if ($("#customer").val() == 0 && $("#refNumber").val() == "") {
          notiflix.Report.warning(
            "Reference Required!",
            "You either need to select a customer <br> or enter a reference!",
            "Ok",
          );
          return;
        }
      }

      $(".loading").show();

      if (holdOrder != 0) {
        orderNumber = holdOrder;
        method = "PUT";
      } else {
        orderNumber = Math.floor(Date.now() / 1000);
        method = "POST";
      }

      logo = path.join(img_path, validator.unescape(settings.img));

      receipt = `<div style="font-size: 10px">                            
        <p style="text-align: center;">
        ${
          checkFileExists(logo)
            ? `<img style='max-width: 50px' src='${logo}' /><br>`
            : ``
        }
            <span style="font-size: 22px;">${validator.unescape(settings.store)}</span> <br>
            ${validator.unescape(settings.address_one)} <br>
            ${validator.unescape(settings.address_two)} <br>
            ${
              validator.unescape(settings.contact) != "" ? "Tel: " + validator.unescape(settings.contact) + "<br>" : ""
            } 
            ${validator.unescape(settings.tax) != "" ? "Vat No: " + validator.unescape(settings.tax) + "<br>" : ""} 
        </p>
        <hr>
        <left>
            <p>
            Order No : ${orderNumber} <br>
            Ref No : ${refNumber == "" ? orderNumber : _.escape(refNumber)} <br>
            Customer : ${
              customer == 0 ? "Walk in customer" : _.escape(customer.name)
            } <br>
            Cashier : ${user.fullname} <br>
            Date : ${date}<br>
            </p>

        </left>
        <hr>
        <table width="90%">
            <thead>
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th class="text-right">Price</th>
            </tr>
            </thead>
            <tbody>
             ${items}                
            <tr><td colspan="3"><hr></td></tr>
            <tr>                        
                <td><b>Subtotal</b></td>
                <td>:</td>
                <td class="text-right"><b>${validator.unescape(settings.symbol)}${moneyFormat(
                  subTotal.toFixed(2),
                )}</b></td>
            </tr>
            <tr>
                <td>Discount</td>
                <td>:</td>
                <td class="text-right">${
                  discount > 0
                    ? validator.unescape(settings.symbol) +
                      moneyFormat(parseFloat(discount).toFixed(2))
                    : ""
                }</td>
            </tr>
            ${tax_row}
            <tr>
                <td><h5>Total</h5></td>
                <td><h5>:</h5></td>
                <td class="text-right">
                    <h5>${validator.unescape(settings.symbol)} ${moneyFormat(
                      parseFloat(orderTotal).toFixed(2),
                    )}</h3>
                </td>
            </tr>
            ${payment == 0 ? "" : payment}
            ${mobileNumber ? `<tr><td>Mobile Number</td><td>:</td><td class="text-right">${mobileNumber}</td></tr>` : ""}
            </tbody>
            </table>
            <br>
            <hr>
            <br>
            <p style="text-align: center;">
             ${validator.unescape(settings.footer)}
             </p>
            </div>`;

      if (status == 3) {
        if (cart.length > 0) {
          printJS({ printable: receipt, type: "raw-html" });

          $(".loading").hide();
          return;
        } else {
          $(".loading").hide();
          return;
        }
      }

      let data = {
        order: orderNumber,
        ref_number: refNumber,
        discount: discount,
        customer: customer,
        status: status,
        subtotal: parseFloat(subTotal).toFixed(2),
        tax: totalVat,
        order_type: 1,
        items: cart,
        date: currentTime,
        payment_type: type,
        payment_info: $("#paymentInfo").val(),
        total: orderTotal,
        paid: paid,
        change: change,
        _id: orderNumber,
        till: platform.till,
        mac: platform.mac,
        user: user.fullname,
        user_id: user._id,
      };

      $.ajax({
        url: api + "new",
        type: method,
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        cache: false,
        processData: false,
        success: function (data) {
          cart = [];
          $("#inputDiscount").val(0);
          receipt = DOMPurify.sanitize(receipt,{ ALLOW_UNKNOWN_PROTOCOLS: true });
          $("#viewTransaction").html("");
          $("#viewTransaction").html(receipt);
          $("#orderModal").modal("show");
          loadProducts();
          loadCustomers();
          $(".loading").hide();
          $("#dueModal").modal("hide");
          $("#paymentModel").modal("hide");
          $(this).getHoldOrders();
          $(this).getCustomerOrders();
          $(this).renderTable(cart);
        },

        error: function (data) {
          $(".loading").hide();
          $("#dueModal").modal("toggle");
          notiflix.Report.failure(
            "Something went wrong!",
            "Please refresh this page and try again",
            "Ok",
          );
        },
      });

      $("#refNumber").val("");
      $("#change").text("");
      $("#payment,#paymentText").val("");
    };

    $.get(api + "on-hold", function (data) {
      holdOrderList = data;
      holdOrderlocation.empty();
      // clearInterval(dotInterval);
      $(this).renderHoldOrders(holdOrderList, holdOrderlocation, 1);
    });

    $.fn.getHoldOrders = function () {
      $.get(api + "on-hold", function (data) {
        holdOrderList = data;
        clearInterval(dotInterval);
        holdOrderlocation.empty();
        $(this).renderHoldOrders(holdOrderList, holdOrderlocation, 1);
      });
    };

/*     $.fn.renderHoldOrders = function (data, renderLocation, orderType) {
      $.each(data, function (index, order) {
        $(this).calculatePrice(order);
        renderLocation.append(
          $("<div>", {
            class:
              orderType == 1 ? "col-md-3 order" : "col-md-4 customer-order",
          }).append(
            $("<a>").append(
              $("<div>", { class: "card-box order-box" }).append(
                $("<p>").append(
                  
                  $("<b>", { text: "Ref :" }),
                  $("<span>", { text: order.ref_number || order.order, class: "ref_number" }),
                  $("<br>"),
                  $("<b>", { text: "Date: " }),
                  $("<span>", { text: new Date(order.date).toLocaleDateString(), class: "ref_number" }),
                  $("<br>"),
                  $("<b>", { text: "Items :" }),
                  $("<span>", { text: order.items.length }),
                  $("<br>"),
                  $("<b>", { text: "Total price :" }),
                  $("<span>", {
                    text: validator.unescape(settings.symbol) +  order.total,
                    class: "label label-info",
                    style: "font-size:14px;",
                  }),
                  $("<br>"),
                  $("<b>", { text: "Customer :" }),
                  $("<span>", {
                    text:
                      order.customer != 0
                        ? order.customer.name
                        : "Walk in customer",
                    class: "customer_name",
                  }),
                  $("<br>"),
                  $("<b>", { text: "Status :" }),
                  $("<span>", {
                    text:
                    order.status == 0
                      ? "On hold"
                      : "Paid",
                    class: order.status == 0 ? "label label-warning" : "label label-success",
                    style: "font-size:14px;",
                  }),
                  
                ),
                $("<button>", {
                  class: "btn btn-danger del",
                  onclick:
                    "$(this).deleteOrder(" + index + "," + orderType + ")",
                }).append($("<i>", { class: "fa fa-trash" })),

                $("<button>", {
                  class: "btn btn-default",
                  onclick:
                    "$(this).orderDetails(" + index + "," + orderType + ")",
                }).append($("<span>", { class: "fa fa-shopping-basket" })),
              ),
            ),
          ),
        );
      });
    }; */

    $.fn.renderHoldOrders = function (data, renderLocation, orderType) {
  renderLocation.empty();

  // Handle empty data
  if (!data || data.length === 0) {
    renderLocation.append(
      $("<div>", {
        class: "alert alert-info text-center",
        text: "No data to show"
      })
    );
    return;
  }

  const tableId = "holdOrdersTable_" + Math.floor(Math.random() * 10000);

  const table = $("<table>", {
    id: tableId,
    class: "table table-bordered table-striped table-hover nowrap",
    style: "width:100%"
  });

  const thead = $("<thead>").append(
    $("<tr>").append(
      $("<th>", { text: "Ref" }),
      $("<th>", { text: "Date" }),
      $("<th>", { text: "Items" }),
      $("<th>", { text: "Total" }),
      $("<th>", { text: "Customer" }),
      $("<th>", { text: "Status" }),
      $("<th>", { text: "Actions", orderable: false })
    )
  );

  const tbody = $("<tbody>");

  $.each(data, function (index, order) {
    $(this).calculatePrice(order);

    const row = $("<tr>", {
      class: "custom-row",
      style: "cursor:pointer"
    }).append(
      $("<td>", { text: order.ref_number || order.order }),
      $("<td>", { text: new Date(order.date).toLocaleDateString() }),
      $("<td>", { text: order.items.length }),
      $("<td>").append(
        $("<span>", {
          text: validator.unescape(settings.symbol) + order.total,
          class: "label label-info"
        })
      ),
      $("<td>", {
        text: order.customer != 0
          ? order.customer.name
          : "Walk in customer"
      }),
      $("<td>").append(
        $("<span>", {
          text: order.status == 0 ? "On hold" : "Paid",
          class: order.status == 0
            ? "label label-warning"
            : "label label-success"
        })
      ),
      $("<td>").append(
        $("<button>", {
          class: "btn btn-danger btn-sm del",
          click: function (e) {
            e.stopPropagation(); // prevent row click
            $(this).deleteOrder(index, orderType);
          }
        }).append($("<i>", { class: "fa fa-trash" })),

        " ",

        $("<button>", {
          class: "btn btn-default btn-sm",
          click: function (e) {
            e.stopPropagation(); // prevent row click
            $(this).orderDetails(index, orderType);
          }
        }).append($("<span>", { class: "fa fa-shopping-basket" }))
      )
    );

    // Row click (like card click)
    row.on("click", function () {
      $(this).orderDetails(index, orderType);
    });

    tbody.append(row);
  });

  table.append(thead).append(tbody);
  renderLocation.append(table);

  // Initialize DataTable
  $("#" + tableId).DataTable({
    responsive: true,
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50],
    language: {
      emptyTable: "No data to show",
      search: "Search:",
      paginate: {
        next: "Next",
        previous: "Prev"
      }
    },
    columnDefs: [
      { orderable: false, targets: 6 } // disable sorting on Actions column
    ]
  });
};

    $.fn.calculatePrice = function (data) {
      totalPrice = 0;
      $.each(data.products, function (index, product) {
        totalPrice += product.price * product.quantity;
      });

      let vat = (totalPrice * data.vat) / 100;
      totalPrice = (totalPrice + vat - data.discount).toFixed(0);

      return totalPrice;
    };

    $.fn.orderDetails = function (index, orderType) {
      $("#refNumber").val("");

      if (orderType == 1) {
        $("#refNumber").val(holdOrderList[index].ref_number);

        $("#customer option:selected").removeAttr("selected");

        $("#customer option")
          .filter(function () {
            return $(this).text() == "Walk in customer";
          })
          .prop("selected", true);

        holdOrder = holdOrderList[index]._id;
        cart = [];
        $.each(holdOrderList[index].items, function (index, product) {
          item = {
            id: product.id,
            product_name: product.product_name,
            sku: product.sku,
            price: product.price,
            quantity: product.quantity,
          };
          cart.push(item);
        });
      } else if (orderType == 2) {
        $("#refNumber").val("");

        $("#customer option:selected").removeAttr("selected");

        $("#customer option")
          .filter(function () {
            return $(this).text() == customerOrderList[index].customer.name;
          })
          .prop("selected", true);

        holdOrder = customerOrderList[index]._id;
        cart = [];
        $.each(customerOrderList[index].items, function (index, product) {
          item = {
            id: product.id,
            product_name: product.product_name,
            sku: product.sku,
            price: product.price,
            quantity: product.quantity,
          };
          cart.push(item);
        });
      }
      $(this).renderTable(cart);
      $("#holdOrdersModal").modal("hide");
      $("#customerModal").modal("hide");
    };

    $.fn.deleteOrder = function (index, type) {
      switch (type) {
        case 1:
          deleteId = holdOrderList[index]._id;
          break;
        case 2:
          deleteId = customerOrderList[index]._id;
      }

      let data = {
        orderId: deleteId,
      };
      let diagOptions = {
        title: "Delete order?",
        text: "This will delete the order. Are you sure you want to delete!",
        icon: "warning",
        showCancelButton: true,
        okButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        okButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      };

      notiflix.Confirm.show(
        diagOptions.title,
        diagOptions.text,
        diagOptions.okButtonText,
        diagOptions.cancelButtonText,
        () => {
          $.ajax({
            url: api + "delete",
            type: "POST",
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            cache: false,
            success: function (data) {
              $(this).getHoldOrders();
              $(this).getCustomerOrders();

              notiflix.Report.success(
                "Deleted!",
                "You have deleted the order!",
                "Ok",
              );
            },
            error: function (data) {
              $(".loading").hide();
            },
          });
        },
      );
    };

    $.fn.getCustomerOrders = function () {
      $.get(api + "customer-orders", function (data) {
        clearInterval(dotInterval);
        customerOrderList = data;
        customerOrderLocation.empty();
        $(this).renderHoldOrders(customerOrderList, customerOrderLocation, 2);
      });
    };

    $("#saveCustomer").on("submit", function (e) {
      e.preventDefault();

      let custData = {
        _id: Math.floor(Date.now() / 1000),
        name: $("#userName").val(),
        phone: $("#phoneNumber").val(),
        email: $("#emailAddress").val(),
        address: $("#userAddress").val(),
      };

      $.ajax({
        url: api + "customers/customer",
        type: "POST",
        data: JSON.stringify(custData),
        contentType: "application/json; charset=utf-8",
        cache: false,
        processData: false,
        success: function (data) {
          $("#newCustomer").modal("hide");
          notiflix.Report.success(
            "Customer added!",
            "Customer added successfully!",
            "Ok",
          );
          $("#customer option:selected").removeAttr("selected");
          $("#customer").append(
            $("<option>", {
              text: custData.name,
              value: `{"id": ${custData._id}, "name": ${custData.name}}`,
              selected: "selected",
            }),
          );

          $("#customer")
            .val(`{"id": ${custData._id}, "name": ${custData.name}}`)
            .trigger("chosen:updated");
        },
        error: function (data) {
          $("#newCustomer").modal("hide");
          notiflix.Report.failure(
            "Error",
            "Something went wrong please try again",
            "Ok",
          );
        },
      });
    });

    $("#confirmPayment").hide();
    $("#cardInfo").hide();
    $("#payment").on("input", function () {
      $(this).calculateChange();
    });
    $("#confirmPayment").on("click", function () {
      if ($("#payment").val() == "") {
        notiflix.Report.warning(
          "Nope!",
          "Please enter the amount that was paid!",
          "Ok",
        );
      } else {
        $(this).submitDueOrder(1);
      }
    });

    $("#transactions").on("click", function () {
      loadTransactions();
      loadUserList();

      $("#pos_view").hide();
      $("#pointofsale").hide();
      $("#transactions_view").show();
      $("#products_view").hide();
      $("#providers_view").hide();
      $("#invoices_view").hide();
      $(this).hide();
    });

    $("#pointofsale").on("click", function () {
      $("#pos_view").show();
      $("#transactions").hide();
      $("#transactions_view").hide();
      $("#products_view").hide();
      $("#providers_view").hide();
      $("#invoices_view").hide();
      $(this).hide();
    });

    $("#viewRefOrders").on("click", function () {
      setTimeout(function () {
        $("#holdOrderInput").focus();
      }, 500);
    });

    $("#viewCustomerOrders").on("click", function () {
      setTimeout(function () {
        $("#holdCustomerOrderInput").focus();
      }, 500);
    });

    $("#newProductModal").on("click", function () {
      $("#saveProduct").get(0).reset();
      $("#current_img").text("");
      $("#invoice_id").val("");
      loadInvoicesForForm(); // load all invoices (no provider filter yet)
    });

    // When provider changes in the product form, filter invoice datalist to that provider
    $("#provider").on("change", function () {
      const providerId = $(this).val();
      $("#invoice_id").val(""); // clear stale invoice selection
      loadInvoicesForForm(providerId || null);
    });

    $("#saveProduct").submit(function (e) {
      e.preventDefault();

      $(this).attr("action", api + "inventory/product");
      $(this).attr("method", "POST");

      $(this).ajaxSubmit({
        contentType: "application/json",
        success: function (response) {
          $("#saveProduct").get(0).reset();
          $("#current_img").text("");

          loadProducts();
          diagOptions = {
            title: "Product Saved",
            text: "Select an option below to continue.",
            okButtonText: "Add another",
            cancelButtonText: "Close",
          };

          notiflix.Confirm.show(
            diagOptions.title,
            diagOptions.text,
            diagOptions.okButtonText,
            diagOptions.cancelButtonText,
            ()=>{},
            () => {
              $("#newProduct").modal("hide");
            },
          );
        },
        //error for product
        error: function (jqXHR, _textStatus, errorThrown) {
          const errObj = jqXHR.responseJSON;
          const errTitle = errObj ? errObj.error : ("Error " + jqXHR.status);
          const errMsg = errObj ? errObj.message : (jqXHR.responseText || errorThrown || "An unexpected error occurred.");
          console.error(errMsg);
          notiflix.Report.failure(errTitle, errMsg, "Ok");
        }

      });
    });

    // ── ADD INVOICE BUTTON ──────────────────────────────────
    $("#addInvoiceBtn").on("click", function () {
      const today = new Date().toISOString().split('T')[0];
      $("#saveInvoice")[0].reset();
      $("#inv_original_invoice_id").val("");
      $("#inv_invoice_id").prop("readonly", false);
      $("#inv_invoice_date").val(today);
      $("#inv_payment_status").val("pending");
      $("#inv_net_amount").val("0.00");
      // Populate provider select from allProviders
      let provOpts = '<option value="">' + t('select_provider_hint') + '</option>';
      allProviders.forEach(function (p) {
        provOpts += '<option value="' + p._id + '">' + (p.name || p._id) + '</option>';
      });
      $("#inv_provider_id").html(provOpts).prop("disabled", false);
      // Switch to create mode UI
      $("#inv_file_section").show();
      $("#inv_current_file_section").hide();
      $("#invoiceFormIcon").attr("class", "fa fa-plus-circle");
      $("#invoiceFormTitle").text(t('add_invoice_title'));
      $("#newInvoice").modal("show");
    });

    // ── PROVIDER INVOICE EXPORT ─────────────────────────────────
    function providerExportBase() {
      const sym      = (settings && validator.unescape(settings.symbol)) || '';
      const data     = currentProviderInvoiceData || { invoices: [], totalInvoices: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0, overdueAmount: 0 };
      const invoices = data.invoices || [];
      const prov     = currentProvider || {};
      const now      = new Date();
      return { sym, data, invoices, prov, now };
    }

    $("#exportInvoiceCsvBtn").on("click", function () {
      const { sym, data, invoices, prov } = providerExportBase();

      function q(v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }
      function csvRow(arr) { return arr.map(q).join(","); }

      const rows = [];

      // Section 1 — report info
      rows.push(["Provider Invoice Report"]);
      rows.push(["Provider",  prov.name  || ""]);
      rows.push(["Phone",     prov.phone || ""]);
      rows.push(["Email",     prov.email || ""]);
      rows.push(["Generated", moment().format("YYYY-MM-DD HH:mm:ss")]);
      rows.push([]);

      // Section 2 — summary
      rows.push(["SUMMARY"]);
      rows.push(["Total Invoices",  data.totalInvoices  || 0]);
      rows.push(["Total Amount",    sym + parseFloat(data.totalAmount   || 0).toFixed(2)]);
      rows.push(["Paid Amount",     sym + parseFloat(data.paidAmount    || 0).toFixed(2)]);
      rows.push(["Pending Amount",  sym + parseFloat(data.pendingAmount || 0).toFixed(2)]);
      rows.push(["Overdue Amount",  sym + parseFloat(data.overdueAmount || 0).toFixed(2)]);
      rows.push([]);

      // Section 3 — invoices
      rows.push(["INVOICES"]);
      rows.push(["Invoice ID", "Invoice Date", "Due Date", "Total Amount", "Tax", "Discount", "Net Amount", "Status", "Payment Method", "Notes"]);
      invoices.forEach(function (inv) {
        const isOverdue = inv.paymentStatus !== 'paid' && inv.dueDate && new Date(inv.dueDate) < new Date();
        rows.push([
          inv.invoiceId    || "",
          inv.invoiceDate  ? moment(inv.invoiceDate).format("YYYY-MM-DD")  : "",
          inv.dueDate      ? moment(inv.dueDate).format("YYYY-MM-DD")      : "",
          parseFloat(inv.totalAmount    || 0).toFixed(2),
          parseFloat(inv.taxAmount      || 0).toFixed(2),
          parseFloat(inv.discountAmount || 0).toFixed(2),
          parseFloat(inv.netAmount      || 0).toFixed(2),
          inv.paymentStatus === 'paid' ? "Paid" : (isOverdue ? "Overdue" : "Pending"),
          inv.paymentMethod || "",
          inv.notes         || "",
        ]);
      });

      const csvContent = "\uFEFF" + rows.map(csvRow).join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download",
        "invoices_" + (prov.name || "provider").replace(/\s+/g, "_") +
        "_" + moment().format("YYYY-MM-DD") + ".csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });

    $("#exportInvoicePdfBtn").on("click", function () {
      const { sym, data, invoices, prov } = providerExportBase();

      if (!pdfMake.vfs["Tahoma.ttf"]) {
        const appRoot = app.getAppPath();
        pdfMake.vfs["Tahoma.ttf"]      = fs.readFileSync(path.join(appRoot, "assets/fonts/Tahoma.ttf")).toString("base64");
        pdfMake.vfs["Tahoma-Bold.ttf"] = fs.readFileSync(path.join(appRoot, "assets/fonts/Tahoma-Bold.ttf")).toString("base64");
        pdfMake.fonts = {
          Roboto: { normal: "Roboto-Regular.ttf", bold: "Roboto-Medium.ttf", italics: "Roboto-Italic.ttf", bolditalics: "Roboto-MediumItalic.ttf" },
          Tahoma: { normal: "Tahoma.ttf", bold: "Tahoma-Bold.ttf", italics: "Tahoma.ttf", bolditalics: "Tahoma-Bold.ttf" },
        };
      }

      function cell(value, extra) {
        const str = String(value == null ? "" : value);
        const isArabic = /[\u0600-\u06FF]/.test(str);
        return Object.assign({
          text: str, fontSize: 7,
          font:      isArabic ? "Tahoma" : "Roboto",
          alignment: isArabic ? "right"  : "left",
        }, extra || {});
      }

      const summaryBody = [
        [
          { text: "Total Invoices",  style: "summaryLabel" },
          { text: String(data.totalInvoices || 0),                         style: "summaryValue" },
          { text: "Total Amount",    style: "summaryLabel" },
          { text: sym + parseFloat(data.totalAmount   || 0).toFixed(2),    style: "summaryValue" },
          { text: "Paid Amount",     style: "summaryLabel" },
          { text: sym + parseFloat(data.paidAmount    || 0).toFixed(2),    style: "summaryValue" },
        ],
        [
          { text: "Overdue Amount",  style: "summaryLabel" },
          { text: sym + parseFloat(data.overdueAmount || 0).toFixed(2),    style: "summaryValue" },
          { text: "Pending Amount",  style: "summaryLabel" },
          { text: sym + parseFloat(data.pendingAmount || 0).toFixed(2),    style: "summaryValue" },
          { text: "Outstanding",     style: "summaryLabel" },
          { text: sym + parseFloat(data.pendingAmount || 0).toFixed(2),    style: "summaryValue" },
        ],
      ];

      const txHeaders = ["Invoice ID", "Invoice Date", "Due Date", "Total", "Tax", "Discount", "Net Amount", "Status", "Method", "Notes"];
      const txRows = invoices.map(function (inv) {
        const isOverdue = inv.paymentStatus !== 'paid' && inv.dueDate && new Date(inv.dueDate) < new Date();
        const status = inv.paymentStatus === 'paid' ? "Paid" : (isOverdue ? "Overdue" : "Pending");
        return [
          inv.invoiceId || "—",
          inv.invoiceDate ? moment(inv.invoiceDate).format("DD/MM/YY") : "—",
          inv.dueDate     ? moment(inv.dueDate).format("DD/MM/YY")     : "—",
          sym + parseFloat(inv.totalAmount    || 0).toFixed(2),
          sym + parseFloat(inv.taxAmount      || 0).toFixed(2),
          sym + parseFloat(inv.discountAmount || 0).toFixed(2),
          sym + parseFloat(inv.netAmount      || 0).toFixed(2),
          status,
          inv.paymentMethod || "—",
          inv.notes         || "—",
        ].map(function (v) { return cell(v); });
      });

      const docDefinition = {
        pageOrientation: "landscape",
        pageMargins: [28, 50, 28, 36],

        header: function (currentPage) {
          if (currentPage === 1) return null;
          return { text: "ShbairPharma — Provider Invoice Report", alignment: "center", fontSize: 7, color: "#888", margin: [0, 14, 0, 0] };
        },
        footer: function (currentPage, pageCount) {
          return {
            columns: [
              { text: "Generated: " + moment().format("YYYY-MM-DD HH:mm:ss"), fontSize: 7, color: "#888", alignment: "left",  margin: [28, 0, 0, 0] },
              { text: "Page " + currentPage + " of " + pageCount,             fontSize: 7, color: "#888", alignment: "right", margin: [0,  0, 28, 0] },
            ],
          };
        },

        content: [
          { text: "ShbairPharma",              style: "brand" },
          { text: "Provider Invoice Report",   style: "reportTitle" },
          { text: moment().format("YYYY-MM-DD HH:mm:ss"), style: "generatedDate" },
          { text: " ", margin: [0, 4] },

          // Provider info bar
          {
            table: {
              widths: ["*", "*", "*"],
              body: [[
                { text: "Provider: " + (prov.name  || "—"), style: "filterCell" },
                { text: "Phone: "   + (prov.phone || "—"), style: "filterCell" },
                { text: "Email: "   + (prov.email || "—"), style: "filterCell" },
              ]],
            },
            layout: { hLineWidth: () => 0, vLineWidth: () => 0, fillColor: () => "#eef3f9" },
            margin: [0, 0, 0, 14],
          },

          // Summary stats
          { text: "Summary", style: "sectionTitle" },
          {
            table: {
              widths: ["auto", "*", "auto", "*", "auto", "*"],
              body: summaryBody,
            },
            layout: {
              hLineWidth: () => 1, vLineWidth: () => 1,
              hLineColor: () => "#c9d8e8", vLineColor: () => "#c9d8e8",
              fillColor:  function (i) { return i % 2 === 0 ? "#eef3f9" : "#f8fafc"; },
              paddingLeft: () => 8, paddingRight: () => 8,
              paddingTop:  () => 6, paddingBottom: () => 6,
            },
            margin: [0, 4, 0, 18],
          },

          // Invoices table
          { text: "Invoices  (" + invoices.length + " records)", style: "sectionTitle" },
          {
            table: {
              headerRows: 1,
              widths: ["auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "*"],
              body: [
                txHeaders.map(function (h) { return { text: h, style: "tableHeader" }; }),
                ...txRows,
              ],
            },
            layout: {
              hLineWidth: function (i, node) { return (i === 0 || i === node.table.body.length) ? 1 : 0.5; },
              vLineWidth: () => 0,
              hLineColor: () => "#c9d8e8",
              fillColor:  function (i) { return i === 0 ? null : (i % 2 === 0 ? "#f4f7fb" : null); },
              paddingLeft: () => 5, paddingRight: () => 5,
              paddingTop:  () => 3, paddingBottom: () => 3,
            },
            margin: [0, 4, 0, 0],
          },
        ],

        styles: {
          brand:        { fontSize: 17, bold: true, alignment: "center", color: "#1a2436", margin: [0, 0, 0, 4] },
          reportTitle:  { fontSize: 12, bold: true, alignment: "center", color: "#0d7377", margin: [0, 0, 0, 4] },
          generatedDate:{ fontSize: 7,              alignment: "center", color: "#888",    margin: [0, 0, 0, 8] },
          sectionTitle: { fontSize: 9, bold: true,  color: "#2d4154",                      margin: [0, 0, 0, 4] },
          filterCell:   { fontSize: 8,              alignment: "center", color: "#444",    margin: [4, 6, 4, 6] },
          summaryLabel: { fontSize: 8,              color: "#555",       margin: [0, 0, 0, 0] },
          summaryValue: { fontSize: 9, bold: true,  color: "#1a2436", alignment: "right",  margin: [0, 0, 0, 0] },
          tableHeader:  { fillColor: "#2d4154", color: "white", fontSize: 7, bold: true, alignment: "center", margin: [0, 3, 0, 3] },
        },
      };

      pdfMake
        .createPdf(docDefinition)
        .download(
          "invoices_" + (prov.name || "provider").replace(/\s+/g, "_") +
          "_" + moment().format("YYYY-MM-DD") + ".pdf"
        );
    });

    // Auto-calculate net amount in invoice form
    $("#inv_total_amount, #inv_tax_amount, #inv_discount_amount").on("input", function () {
      const total    = parseFloat($("#inv_total_amount").val())    || 0;
      const tax      = parseFloat($("#inv_tax_amount").val())      || 0;
      const discount = parseFloat($("#inv_discount_amount").val()) || 0;
      $("#inv_net_amount").val((total + tax - discount).toFixed(2));
    });

    // ── SAVE INVOICE FORM ────────────────────────────────────
    $("#saveInvoice").submit(function (e) {
      e.preventDefault();
      if (!$("#inv_invoice_date").val()) {
        notiflix.Report.warning("Validation", "Please enter an invoice date.", "Ok");
        return;
      }

      const originalId = $("#inv_original_invoice_id").val();
      const isEdit = originalId !== "";

      if (isEdit) {
        // PUT: send as FormData so a replacement file can be included
        const fd = new FormData();
        fd.append("invoiceDate",    $("#inv_invoice_date").val());
        fd.append("dueDate",        $("#inv_due_date").val());
        fd.append("totalAmount",    parseFloat($("#inv_total_amount").val()) || 0);
        fd.append("taxAmount",      parseFloat($("#inv_tax_amount").val()) || 0);
        fd.append("discountAmount", parseFloat($("#inv_discount_amount").val()) || 0);
        fd.append("netAmount",      parseFloat($("#inv_net_amount").val()) || 0);
        fd.append("paymentStatus",  $("#inv_payment_status").val());
        fd.append("paymentMethod",  $("#inv_payment_method").val() || "");
        fd.append("notes",          $("#inv_notes").val() || "");
        fd.append("status",         "active");
        const editFileEl = $("#inv_edit_file")[0];
        if (editFileEl && editFileEl.files && editFileEl.files.length > 0) {
          fd.append("invoiceFile", editFileEl.files[0]);
        }
        $.ajax({
          url: api + "invoice/invoice/" + originalId,
          type: "PUT",
          data: fd,
          processData: false,
          contentType: false,
          success: function () {
            $("#newInvoice").modal("hide");
            notiflix.Report.success("Invoice Updated", "Invoice updated successfully.", "Ok");
            const providerId = $("#providerListFilter").val();
            if (providerId) loadInvoiceList(providerId);
            loadInvoicesForForm();
            loadInvoicesView();
          },
          error: function (err) {
            const msg = (err.responseJSON && err.responseJSON.message) || "Unknown error.";
            notiflix.Report.failure("Error", "Failed to update invoice: " + msg, "Ok");
          }
        });
      } else {
        // POST: send FormData (supports file upload)
        const fd = new FormData(this);
        $.ajax({
          url: api + "invoice/invoice",
          type: "POST",
          data: fd,
          processData: false,
          contentType: false,
          success: function () {
            $("#newInvoice").modal("hide");
            notiflix.Report.success("Invoice Saved", "Invoice added successfully.", "Ok");
            const providerId = $("#providerListFilter").val();
            if (providerId) loadInvoiceList(providerId);
            loadInvoicesForForm();
            loadInvoicesView();
          },
          error: function (err) {
            const msg = (err.responseJSON && err.responseJSON.message) || "Unknown error.";
            notiflix.Report.failure("Error", "Failed to save invoice: " + msg, "Ok");
          }
        });
      }
    });

    // ── INVOICE ACTIONS ──────────────────────────────────────
    $.fn.deleteInvoice = function (invoiceId) {
      notiflix.Confirm.show(
        "Are you sure?",
        "This will permanently delete the invoice.",
        "Yes, delete it!",
        "Cancel",
        function () {
          $.ajax({
            url: api + "invoice/invoice/" + invoiceId,
            type: "DELETE",
            success: function () {
              notiflix.Report.success("Deleted!", "Invoice removed.", "Ok");
              const providerId = $("#providerListFilter").val();
              if (providerId) loadInvoiceList(providerId);
              loadInvoicesForForm();
              loadInvoicesView();
            },
            error: function (err) {
              const msg = (err.responseJSON && err.responseJSON.message) || "Cannot delete this invoice.";
              notiflix.Report.failure("Error", msg, "Ok");
            }
          });
        }
      );
    };

    $.fn.markInvoicePaid = function (invoiceId) {
      $.ajax({
        url: api + "invoice/invoice/" + invoiceId,
        type: "PUT",
        contentType: "application/json",
        data: JSON.stringify({ paymentStatus: "paid" }),
        success: function () {
          notiflix.Report.success("Updated!", "Invoice marked as paid.", "Ok");
          const providerId = $("#providerListFilter").val();
          if (providerId) loadInvoiceList(providerId);
        },
        error: function () {
          notiflix.Report.failure("Error", "Failed to update invoice status.", "Ok");
        }
      });
    };

    $.fn.editInvoice = function (invoiceId) {
      $.get(api + "invoice/invoice/" + invoiceId, function (inv) {
        if (!inv) {
          notiflix.Report.failure("Error", "Invoice not found.", "Ok");
          return;
        }
        // Populate provider select
        let provOpts = '<option value="">' + t('select_provider_hint') + '</option>';
        allProviders.forEach(function (p) {
          provOpts += '<option value="' + p._id + '">' + (p.name || p._id) + '</option>';
        });
        $("#inv_provider_id").html(provOpts).val(inv.providerId).prop("disabled", true);

        // Populate form fields
        $("#inv_original_invoice_id").val(inv.invoiceId);
        $("#inv_invoice_id").val(inv.invoiceId).prop("readonly", true);
        $("#inv_invoice_date").val(inv.invoiceDate ? inv.invoiceDate.split('T')[0] : '');
        $("#inv_due_date").val(inv.dueDate ? inv.dueDate.split('T')[0] : '');
        $("#inv_total_amount").val(parseFloat(inv.totalAmount || 0).toFixed(2));
        $("#inv_tax_amount").val(parseFloat(inv.taxAmount || 0).toFixed(2));
        $("#inv_discount_amount").val(parseFloat(inv.discountAmount || 0).toFixed(2));
        $("#inv_net_amount").val(parseFloat(inv.netAmount || 0).toFixed(2));
        $("#inv_payment_status").val(inv.paymentStatus || 'pending');
        $("#inv_payment_method").val(inv.paymentMethod || '');
        $("#inv_notes").val(inv.notes || '');

        // Switch to edit mode UI
        $("#inv_file_section").hide();
        $("#inv_current_file_section").show();
        if (inv.invoiceFile) {
          $("#inv_current_file_display").html(
            `<i class="fa fa-paperclip"></i> ${inv.invoiceFile} ` +
            `<button type="button" onclick="$(this).viewInvoiceFile('${inv.invoiceFile}')" ` +
            `class="btn btn-info btn-xs"><i class="fa fa-eye"></i> View</button>`
          );
        } else {
          $("#inv_current_file_display").html('<span style="color:var(--c-muted);">No file attached</span>');
        }

        // Update modal title and icon
        $("#invoiceFormIcon").attr("class", "fa fa-edit");
        $("#invoiceFormTitle").text(t('edit_invoice_title'));
        $("#newInvoice").modal("show");
      }).fail(function () {
        notiflix.Report.failure("Error", "Failed to load invoice details.", "Ok");
      });
    };

    $.fn.viewInvoiceFile = function (filename) {
      if (!filename) return;
      const filePath = path.join(appData, appName, "uploads", filename);
      const ext = path.extname(filename).toLowerCase();
      const isImage = ['.jpg', '.jpeg', '.png'].includes(ext);
      const isPdf   = ext === '.pdf';

      const fileUrl = (process.platform === 'win32')
        ? 'file:///' + filePath.replace(/\\/g, '/')
        : 'file://' + filePath;

      // "Open in Viewer" always available as a fallback
      $("#invoicePreviewOpenBtn").off("click").on("click", function () {
        const { shell } = remote;
        shell.openPath(filePath).then(function (errStr) {
          if (errStr) notiflix.Report.failure("Error", "Could not open file: " + errStr, "Ok");
        });
      });

      if (isImage) {
        $("#invoicePreviewModal .modal-dialog").css({ width: "", maxWidth: "" });
        $("#invoicePreviewIcon").attr("class", "fa fa-file-image-o");
        $("#invoicePreviewTitle").text(filename);
        $("#invoicePreviewBody").html(
          `<img src="${fileUrl}" alt="Invoice"
               style="max-width:100%;max-height:65vh;border-radius:var(--radius);box-shadow:var(--shadow-lg);"
               onerror="this.outerHTML='<p class=\\'text-danger\\'>Could not load image. Use \"Open in Viewer\" below.</p>'">`
        );
      } else if (isPdf) {
        // Widen the modal so the PDF has room to breathe
        $("#invoicePreviewModal .modal-dialog").css({ width: "90%", maxWidth: "90%" });
        $("#invoicePreviewIcon").attr("class", "fa fa-file-pdf-o");
        $("#invoicePreviewTitle").text(filename);
        $("#invoicePreviewBody").html(
          `<iframe src="${fileUrl}"
                   style="width:100%;height:75vh;border:none;border-radius:var(--radius-sm);"
                   onerror="this.outerHTML='<p class=\\'text-danger\\'>Could not render PDF inline. Use \\'Open in Viewer\\' below.</p>'">
           </iframe>`
        );
      } else {
        // Unknown file type — system viewer only
        $("#invoicePreviewModal .modal-dialog").css({ width: "", maxWidth: "" });
        $("#invoicePreviewIcon").attr("class", "fa fa-file-o");
        $("#invoicePreviewTitle").text(filename);
        $("#invoicePreviewBody").html(
          `<div style="padding:40px 0;color:var(--c-muted);">
             <i class="fa fa-file-o fa-4x"></i>
             <p style="margin-top:16px;font-size:15px;">${filename}</p>
             <p style="font-size:13px;">Click "Open in Viewer" to open this file.</p>
           </div>`
        );
      }

      $("#invoicePreviewModal").modal("show");
    };

    // Reset modal size and clear iframe/img on close to stop background PDF rendering
    $("#invoicePreviewModal").on("hidden.bs.modal", function () {
      $("#invoicePreviewModal .modal-dialog").css({ width: "", maxWidth: "" });
      $("#invoicePreviewBody").empty();
    });

    $("#saveCategory").submit(function (e) {
      e.preventDefault();

      if ($("#category_id").val() == "") {
        method = "POST";
      } else {
        method = "PUT";
      }

      $.ajax({
        type: method,
        url: api + "categories/category",
        data: $(this).serialize(),
        success: function (data, textStatus, jqXHR) {
          $("#saveCategory").get(0).reset();
          loadCategories();
          loadProducts();
          diagOptions = {
            title: "Category Saved",
            text: "Select an option below to continue.",
            okButtonText: "Add another",
            cancelButtonText: "Close",
          };

          notiflix.Confirm.show(
            diagOptions.title,
            diagOptions.text,
            diagOptions.okButtonText,
            diagOptions.cancelButtonText,
            ()=>{},

            () => {
                $("#newCategory").modal("hide");
            },
          );
        },
      });
    });

    $("#saveProvider").submit(function (e) {
      e.preventDefault();
      let method = $("#provider_id").val() ? "PUT" : "POST";

      $.ajax({
        type: method,
        url: api + "providers/provider",
        data: $(this).serialize(),
        success: function () {
          $("#saveProvider").get(0).reset();
          loadProviders();
          diagOptions = {
            title: "Provider Saved",
            text: "Select an option below to continue.",
            okButtonText: "Add another",
            cancelButtonText: "Close",
          };

          notiflix.Confirm.show(
            diagOptions.title,
            diagOptions.text,
            diagOptions.okButtonText,
            diagOptions.cancelButtonText,
            () => {},
            () => {
              $("#newProvider").modal("hide");
            },
          );
        },
      });
    });

    // Upload products in batch using csv file
    $("#upload_products").on("click", function (e) {
      e.preventDefault();
      var $btn = $(this);
      var input = $("#productsFile")[0];
      if (!input || !input.files || input.files.length === 0) {
        notiflix.Report.warning("No file selected", "Please choose a CSV file to upload.", "Ok");
        return;
      }
      var fd = new FormData();
      fd.append("csvfile", input.files[0]);
      $btn.prop("disabled", true).text("Uploading...");
      $.ajax({
        url: api + "inventory/products/csv",
        type: "POST",
        data: fd,
        processData: false,
        contentType: false,
        success: function (resp) {
          $btn.prop("disabled", false).text("Upload Products");
          $("#productsFile").val("");
          loadProducts();
          loadCategories();
          notiflix.Report.success(
            "Products Uploaded",
            "Inserted: " + resp.inserted + ", Updated: " + resp.updated,
            "Ok"
          );
        },
        error: function (jqXHR) {
          $btn.prop("disabled", false).text("Upload Products");
          var message = jqXHR.responseJSON && jqXHR.responseJSON.message ? jqXHR.responseJSON.message : "Failed to upload CSV file.";
          var errorTitle = jqXHR.responseJSON && jqXHR.responseJSON.error ? jqXHR.responseJSON.error : "Error";
          notiflix.Report.failure(errorTitle, message, "Ok");
        }
      });
      // create categories in batch
      const reader = new FileReader();
      reader.onload = function(e) {
        const csvText = e.target.result;
        const categoriesList = utils.extractUniqueCategories(csvText);
        console.log(categoriesList);
        $.ajax({
          url: api + "categories/category/batch",
          type: "POST",
          data: JSON.stringify(categoriesList),
          contentType: "application/json",
          success: function (resp) {
            loadCategories();
            notiflix.Report.success(
              "Categories Uploaded",
              "Inserted: " + resp.inserted + ", Updated: " + resp.updated,
              "Ok"
            );
          },
          error: function (jqXHR) {
            var message = jqXHR.responseJSON && jqXHR.responseJSON.message ? jqXHR.responseJSON.message : "Failed to upload categories.";
            var errorTitle = jqXHR.responseJSON && jqXHR.responseJSON.error ? jqXHR.responseJSON.error : "Error";
            notiflix.Report.failure(errorTitle, message, "Ok");
          }
        });
      };
      reader.readAsText(input.files[0]);
    });

    $.fn.editProduct = function (index) {
      $("#products_view").show();
      $("#pos_view").hide();
      $("#category option")
        .filter(function () {
          return $(this).val() == allProducts[index].category;
        })
        .prop("selected", true);
      $("#productName").val(allProducts[index].name);
      $("#product_price").val(allProducts[index].price);
      $("#quantity").val(allProducts[index].quantity);
      $("#barcode").val(allProducts[index].barcode || allProducts[index]._id);
      $("#expirationDate").val(allProducts[index].expirationDate);
      $("#minStock").val(allProducts[index].minStock || 1);
      $("#product_id").val(allProducts[index]._id);
      $("#img").val(allProducts[index].img);
      $("#profit_margin").val(allProducts[index].profitMargin || 0);
      $("#cost_price").val(allProducts[index].costPrice || 0);
      $("#provider option")
        .filter(function () {
          return $(this).val() == allProducts[index].provider;
        })
        .prop("selected", true);

      const editProviderId = allProducts[index].provider || null;
      loadInvoicesForForm(editProviderId);
      $("#invoice_id").val(allProducts[index].invoiceId || "");
      $("#entryDate").val(allProducts[index].entryDate || "");

      if (allProducts[index].img != "") {
        $("#imagename").hide();
        $("#current_img").html(
          `<img src="${img_path + allProducts[index].img}" alt="">`,
        );
        $("#rmv_img").show();
      }

      if (allProducts[index].stock == 0) {
        $("#stock").prop("checked", true);
      }

      $("#newProduct").modal("show");
    };

    $("#userModal").on("hide.bs.modal", function () {
      $(".perms").hide();
    });

    $.fn.editUser = function (index) {
      user_index = index;

      $("#Users").modal("hide");

      $(".perms").show();

      $("#user_id").val(allUsers[index]._id);
      $("#fullname").val(allUsers[index].fullname);
      $("#username").val(validator.unescape(allUsers[index].username));
      $("#password").attr("placeholder", "New Password");
    

      for (perm of permissions) {
        var el = "#" + perm;
        if (allUsers[index][perm] == 1) {
          $(el).prop("checked", true);
        } else {
          $(el).prop("checked", false);
        }
      }

      $("#userModal").modal("show");
    };

    $.fn.editCategory = function (index) {
      $("#Categories").modal("hide");
      $("#categoryName").val(allCategories[index].name);
      $("#category_id").val(allCategories[index]._id);
      $("#newCategory").modal("show");
    };

    $.fn.deleteProduct = function (id) {
      diagOptions = {
        title: "Are you sure?",
        text: "You are about to delete this product.",
        okButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      };

      notiflix.Confirm.show(
        diagOptions.title,
        diagOptions.text,
        diagOptions.okButtonText,
        diagOptions.cancelButtonText,
        () => {
          $.ajax({
            url: api + "inventory/product/" + id,
            type: "DELETE",
            success: function (result) {
              loadProducts();
              notiflix.Report.success("Done!", "Product deleted", "Ok");
            },
          });
        },
      );
    };

    $.fn.deleteUser = function (id) {
      diagOptions = {
        title: "Are you sure?",
        text: "You are about to delete this user.",
        cancelButtonColor: "#d33",
        okButtonText: "Yes, delete!",
      };

      notiflix.Confirm.show(
        diagOptions.title,
        diagOptions.text,
        diagOptions.okButtonText,
        diagOptions.cancelButtonText,
        () => {
          $.ajax({
            url: api + "users/user/" + id,
            type: "DELETE",
            success: function (result) {
              loadUserList();
              notiflix.Report.success("Done!", "User deleted", "Ok");
            },
          });
        },
      );
    };

    $.fn.deleteCategory = function (id) {
      diagOptions = {
        title: "Are you sure?",
        text: "You are about to delete this category.",
        okButtonText: "Yes, delete it!",
      };

      notiflix.Confirm.show(
        diagOptions.title,
        diagOptions.text,
        diagOptions.okButtonText,
        diagOptions.cancelButtonText,
        () => {
          $.ajax({
            url: api + "categories/category/" + id,
            type: "DELETE",
            success: function (result) {
              loadCategories();
              notiflix.Report.success("Done!", "Category deleted", "Ok");
            },
          });
        },
      );
    };

    $.fn.editProvider = function (index) {
      $("#Providers").modal("hide");
      $("#providerName").val(allProviders[index].name);
      $("#providerPhone").val(allProviders[index].phone || "");
      $("#providerEmail").val(allProviders[index].email || "");
      $("#provider_id").val(allProviders[index]._id);
      $("#newProvider").modal("show");
    };

    $.fn.deleteProvider = function (id) {
      diagOptions = {
        title: "Are you sure?",
        text: "You are about to delete this provider.",
        okButtonText: "Yes, delete it!",
      };

      notiflix.Confirm.show(
        diagOptions.title,
        diagOptions.text,
        diagOptions.okButtonText,
        diagOptions.cancelButtonText,
        () => {
          $.ajax({
            url: api + "providers/provider/" + id,
            type: "DELETE",
            success: function () {
              loadProviders();
              notiflix.Report.success("Done!", "Provider deleted", "Ok");
            },
          });
        },
      );
    };

    $("#productModal").on("click", function () {
      // Rebuild provider filter options
      $("#productProviderFilter").html(`<option value="">All Providers</option>`);
      allProviders.forEach((prov) => {
        $("#productProviderFilter").append(
          `<option value="${prov._id}">${prov.name}</option>`
        );
      });
      loadProductList();

      // Switch to products view
      $("#pos_view").hide();
      $("#transactions_view").hide();
      $("#products_view").show();
      $("#pointofsale").hide();
      $("#transactions").hide();
      $("#providers_view").hide();
      $("#invoices_view").hide();

    });

    $("#providerModal").on("click", function () {
      // loadProviders() now rebuilds all filter dropdowns internally
      loadProviders();

      $("#pos_view").hide();
      $("#transactions_view").hide();
      $("#products_view").hide();
      $("#providers_view").show();
      $("#pointofsale").hide();
      $("#transactions").hide();
      $("#invoices_view").hide();

      // Reset view to blank state
      updateProviderInfo(null);
      updateProviderStats(null);
      loadInvoiceList(null);
      loadPaymentList(null);
      $("#exportInvoiceCsvBtn, #exportInvoicePdfBtn").prop("disabled", true);
      $("#providerListFilter").val('');
    });

    $("#invoicesModal").on("click", function () {
      loadInvoicesView();
      $("#pos_view").hide();
      $("#transactions_view").hide();
      $("#products_view").hide();
      $("#providers_view").hide();
      $("#invoices_view").show();
      $("#pointofsale").hide();
      $("#transactions").hide();
    });

    $("#productProviderFilter").on("change", function () {
      loadProductList();
    });

    function updateProviderInfo(provider) {
      if (!provider) {
        $("#provider_info_name").text('-');
        $("#provider_info_phone").text('-');
        $("#provider_info_email").text('-');
        $("#provider_info_balance").text('-');
        return;
      }
      $("#provider_info_name").text(provider.name || '-');
      $("#provider_info_phone").text(provider.phone || '-');
      $("#provider_info_email").text(provider.email || '-');
      $("#provider_info_balance").text('-'); // filled by updateProviderStats
    }

    function updateProviderStats(stats) {
      if (!stats) {
        $("#stat_total_invoices").text('0');
        $("#stat_total_amount").text('0.00');
        $("#stat_paid_amount").text('0.00');
        $("#stat_pending_amount").text('0.00');
        return;
      }
      const sym = (settings && validator.unescape(settings.symbol)) || '';
      $("#stat_total_invoices").text(stats.totalInvoices || 0);
      $("#stat_total_amount").text(sym + parseFloat(stats.totalAmount || 0).toFixed(2));
      $("#stat_paid_amount").text(sym + parseFloat(stats.paidAmount || 0).toFixed(2));
      $("#stat_pending_amount").text(sym + parseFloat(stats.pendingAmount || 0).toFixed(2));
    }

    function selectProvider(providerId) {
      if (!providerId) {
        currentProvider = null;
        currentProviderInvoiceData = null;
        updateProviderInfo(null);
        updateProviderStats(null);
        loadInvoiceList(null);
        loadPaymentList(null);
        $("#exportInvoiceCsvBtn, #exportInvoicePdfBtn").prop("disabled", true);
        $("#pv_detail").hide();
        $("#pv_empty_state").show();
        return;
      }
      const selected = allProviders.find(p => p._id == providerId);
      currentProvider = selected || null;
      $("#pv_empty_state").hide();
      $("#pv_detail").show();
      updateProviderInfo(selected);
      loadInvoiceList(providerId);
      loadPaymentList(providerId);
      $("#exportInvoiceCsvBtn, #exportInvoicePdfBtn").prop("disabled", false);
    }

    $("#providerListFilter").on("change", function () {
      selectProvider(this.value);
    });

    $("#usersModal").on("click", function () {
      loadUserList();
    });

    $("#categoryModal").on("click", function () {
      loadCategoryList();
    });

    $("#cost_price").off("input change").on("input change", function () {
        var price = parseFloat($("#cost_price").val()) || 0;
        var margin = parseFloat($("#profit_margin").val()) || 0;
        var salePrice = price + (price * margin / 100);
        //var salePrice = price + margin;
        $("#product_price").val(salePrice.toFixed(2));
      });

      $("#profit_margin").off("input change").on("input change", function () {
        var price = parseFloat($("#cost_price").val()) || 0;
        var margin = parseFloat($("#profit_margin").val()) || 0;
        var salePrice = price + (price * margin / 100);
        //var salePrice = price + margin;
        $("#product_price").val(salePrice.toFixed(2));
      });

    function loadUserList() {
      let counter = 0;
      let user_list = "";
      $("#user_list").empty();
      $("#userList").DataTable().destroy();

      $.get(api + "users/all", function (users) {
        allUsers = [...users];

        users.forEach((user, index) => {
          state = [];
          let class_name = "";

          if (user.status != "") {
            state = user.status.split("_");
            login_status = state[0];
            login_time = state[1];

            switch (login) {
              case "Logged In":
                class_name = "btn-default";

                break;
              case "Logged Out":
                class_name = "btn-light";
                break;
            }
          }

          counter++;
          user_list += `<tr>
            <td>${user.fullname}</td>
            <td>${user.username}</td>
            <td class="${class_name}">${
              state.length > 0 ? login_status : ""
            } <br><small> ${state.length > 0 ? login_time : ""}</small></td>
            <td>${
              user._id == 1
                ? '<span class="btn-group"><button class="btn btn-dark"><i class="fa fa-edit"></i></button><button class="btn btn-dark"><i class="fa fa-trash"></i></button></span>'
                : '<span class="btn-group"><button onClick="$(this).editUser(' +
                  index +
                  ')" class="btn btn-warning"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteUser(' +
                  user._id +
                  ')" class="btn btn-danger"><i class="fa fa-trash"></i></button></span>'
            }</td></tr>`;

          if (counter == users.length) {
            $("#user_list").html(user_list);

            $("#userList").DataTable({
              order: [[1, "desc"]],
              autoWidth: false,
              info: true,
              JQueryUI: true,
              ordering: true,
              paging: false,
            });
          }
        });
      });
    }

    function loadProductList() {
      const selectedProvider = $("#productProviderFilter").val();
      let products = selectedProvider
        ? allProducts.filter((p) => p.provider === selectedProvider)
        : [...allProducts];
      let product_list = "";
      let counter = 0;
      $("#product_list").empty();
      $("#productList").DataTable().destroy();

      products.forEach((product, index) => {
        counter++;
        let category = allCategories.filter(function (category) {
          return category.name == product.category;
        });

        product.stockAlert = "";
        const todayDate = moment();
        const expiryDate = moment(product.expirationDate, DATE_FORMAT);

        //show stock status indicator
        const stockStatus = getStockStatus(product.quantity,product.minStock);
          if(stockStatus<=0)
          {
          if (stockStatus === 0) {
            product.stockStatus = "No Stock";
            icon = "fa fa-exclamation-triangle";
          }
          if (stockStatus === -1) {
            product.stockStatus = "Low Stock";
            icon = "fa fa-caret-down";
          }

          product.stockAlert = `<p class="text-danger"><small><i class="${icon}"></i> ${product.stockStatus}</small></p>`;
        }
        //calculate days to expiry
        product.expiryAlert = "";
        if (!isExpired(expiryDate)) {
          const diffDays = daysToExpire(expiryDate);

          if (diffDays > 0 && diffDays <= 30) {
            var days_noun = diffDays > 1 ? "days" : "day";
            icon = "fa fa-clock-o";
            product.expiryStatus = `${diffDays} ${days_noun} left`;
            product.expiryAlert = `<p class="text-danger"><small><i class="${icon}"></i> ${product.expiryStatus}</small></p>`;
          }
        } else {
          icon = "fa fa-exclamation-triangle";
          product.expiryStatus = "Expired";
          product.expiryAlert = `<p class="text-danger"><small><i class="${icon}"></i> ${product.expiryStatus}</small></p>`;
        }

        if(product.img==="")
        {
          product_img=default_item_img;
        }
        else
        {
          product_img = img_path + product.img;
          product_img = checkFileExists(product_img)
          ? product_img
          : default_item_img;
        }
        //render product list
        product_list +=
          '<tr>'+
          //   <td><img id="` +
          // product._id +
          // `"></td>
            `<td>${product.barcode}
            <td>${product.name}
            ${product.expiryAlert}</td>
            <td>${validator.unescape(settings.symbol)}${product.price}</td>
            <td>${validator.unescape(settings.symbol)}${product.costPrice}</td>

             <td>${product.stock == 1 ? product.quantity : "N/A"}
            ${product.stockAlert}
            </td>
            <td>${product.category}</td>
            <td>${product.invoiceId || "N/A"}</td>
            <td class="nobr"><span class="btn-group"><button onClick="$(this).editProduct(${index})" class="btn btn-warning btn-sm"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteProduct(${
              product._id
            })" class="btn btn-danger btn-sm"><i class="fa fa-trash"></i></button></span></td></tr>`;

        if (counter == products.length) {
          $("#product_list").html(product_list);

          // products.forEach((product) => {
          //   let bcode = product.barcode || product._id;
          //   $("#" + product._id + "").JsBarcode(bcode, {
          //     width: 1,
          //     height: 25,
          //     fontSize: 13,
          //   });
          // });
        }
      });

      // $("#productList").DataTable({
      //   order: [[1, "desc"]],
      //   autoWidth: true,
      //   info: true,
      //   JQueryUI: true,
      //   ordering: true,
      //   paging: true,
      //   dom: "Bfrtip",
      //   buttons: [
      //     {
      //       extend: "pdfHtml5",
      //       className: "btn btn-light", // Custom class name
      //       text: " Download PDF", // Custom text
      //       filename: "product_list", // Default filename
      //     },
      //   ],
      // });
      $("#productList").DataTable({
        dom: "Bfrtip",
        buttons: [
          // ── CSV Product Report ──────────────────────────────────────────
          {
            text: '<i class="fa fa-download"></i> CSV',
            className: "btn btn-success",
            action: function () {
              const sym           = (settings && validator.unescape(settings.symbol)) || '';
              const providerLabel = $("#productProviderFilter option:selected").text() || "All Providers";
              const selectedProvider = $("#productProviderFilter").val();
              const source = selectedProvider
                ? allProducts.filter((p) => p.provider === selectedProvider)
                : [...allProducts];

              function q(v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }
              function csvRow(arr) { return arr.map(q).join(","); }

              // Compute summary
              let totalCostValue = 0, totalSaleValue = 0, lowStockCount = 0;
              source.forEach(function (p) {
                const qty = p.stock == 1 ? parseFloat(p.quantity || 0) : 0;
                totalCostValue += parseFloat(p.costPrice || 0) * qty;
                totalSaleValue += parseFloat(p.price     || 0) * qty;
                if (p.stock == 1 && qty <= parseFloat(p.minStock || 1)) lowStockCount++;
              });
              const categories = [...new Set(source.map(function (p) { return p.category; }).filter(Boolean))].length;

              const rows = [];

              // Section 1 — report info
              rows.push(["Product List Report"]);
              rows.push(["Generated", moment().format("YYYY-MM-DD HH:mm:ss")]);
              rows.push(["Provider Filter", providerLabel]);
              rows.push([]);

              // Section 2 — summary
              rows.push(["SUMMARY"]);
              rows.push(["Total Products",        source.length]);
              rows.push(["Categories",            categories]);
              rows.push(["Total Cost Value",      sym + totalCostValue.toFixed(2)]);
              rows.push(["Total Sale Value",      sym + totalSaleValue.toFixed(2)]);
              rows.push(["Low / Out of Stock",    lowStockCount]);
              rows.push([]);

              // Section 3 — product data
              rows.push(["PRODUCTS"]);
              rows.push([
                "Barcode", "Name", "Category", "Provider",
                "Sale Price", "Cost Price", "Profit %",
                "Quantity", "Min Stock", "Managed Stock",
                "Expiration Date", "Invoice ID",
              ]);
              source.forEach(function (p) {
                rows.push([
                  p.barcode || p._id,
                  p.name,
                  p.category,
                  p.provider || "",
                  p.price,
                  p.costPrice || 0,
                  p.profitMargin || 0,
                  p.stock == 1 ? p.quantity : "N/A",
                  p.minStock || 1,
                  p.stock == 1 ? "Yes" : "No",
                  p.expirationDate || "",
                  p.invoiceId || "",
                ]);
              });

              const csvContent = "\uFEFF" + rows.map(csvRow).join("\r\n");
              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
              const url  = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", "product_list_" + moment().format("YYYY-MM-DD") + ".csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            },
          },

          // ── PDF Product Report ──────────────────────────────────────────
          {
            text: '<i class="fa fa-file-pdf-o"></i> PDF',
            className: "btn btn-danger",
            action: function () {
              if (!pdfMake.vfs["Tahoma.ttf"]) {
                const appRoot = app.getAppPath();
                pdfMake.vfs["Tahoma.ttf"]      = fs.readFileSync(path.join(appRoot, "assets/fonts/Tahoma.ttf")).toString("base64");
                pdfMake.vfs["Tahoma-Bold.ttf"] = fs.readFileSync(path.join(appRoot, "assets/fonts/Tahoma-Bold.ttf")).toString("base64");
                pdfMake.fonts = {
                  Roboto: { normal: "Roboto-Regular.ttf", bold: "Roboto-Medium.ttf", italics: "Roboto-Italic.ttf", bolditalics: "Roboto-MediumItalic.ttf" },
                  Tahoma: { normal: "Tahoma.ttf", bold: "Tahoma-Bold.ttf", italics: "Tahoma.ttf", bolditalics: "Tahoma-Bold.ttf" },
                };
              }

              function cell(value, extra) {
                const str = String(value == null ? "" : value);
                const isArabic = /[\u0600-\u06FF]/.test(str);
                return Object.assign({
                  text: str, fontSize: 7,
                  font:      isArabic ? "Tahoma" : "Roboto",
                  alignment: isArabic ? "right"  : "left",
                }, extra || {});
              }

              const sym           = (settings && validator.unescape(settings.symbol)) || '';
              const providerLabel = $("#productProviderFilter option:selected").text() || "All Providers";
              const selectedProvider = $("#productProviderFilter").val();
              const source = selectedProvider
                ? allProducts.filter((p) => p.provider === selectedProvider)
                : [...allProducts];

              // Compute summary
              let totalCostValue = 0, totalSaleValue = 0, lowStockCount = 0;
              source.forEach(function (p) {
                const qty = p.stock == 1 ? parseFloat(p.quantity || 0) : 0;
                totalCostValue += parseFloat(p.costPrice || 0) * qty;
                totalSaleValue += parseFloat(p.price     || 0) * qty;
                if (p.stock == 1 && qty <= parseFloat(p.minStock || 1)) lowStockCount++;
              });
              const categories = [...new Set(source.map(function (p) { return p.category; }).filter(Boolean))].length;

              const summaryBody = [
                [
                  { text: "Total Products",   style: "summaryLabel" },
                  { text: String(source.length),                    style: "summaryValue" },
                  { text: "Total Cost Value",  style: "summaryLabel" },
                  { text: sym + totalCostValue.toFixed(2),          style: "summaryValue" },
                  { text: "Low / Out of Stock", style: "summaryLabel" },
                  { text: String(lowStockCount),                    style: "summaryValue" },
                ],
                [
                  { text: "Categories",        style: "summaryLabel" },
                  { text: String(categories),                       style: "summaryValue" },
                  { text: "Total Sale Value",  style: "summaryLabel" },
                  { text: sym + totalSaleValue.toFixed(2),          style: "summaryValue" },
                  { text: "Provider",          style: "summaryLabel" },
                  { text: providerLabel,                            style: "summaryValue" },
                ],
              ];

              const tableHeaders = [
                "Barcode", "Name", "Category", "Provider",
                "Sale Price", "Cost Price", "Profit %",
                "Qty", "Min Stock", "Managed", "Expiry", "Invoice ID",
              ];
              const tableRows = source.map(function (p) {
                return [
                  p.barcode || p._id,
                  p.name,
                  p.category,
                  p.provider || "—",
                  sym + parseFloat(p.price      || 0).toFixed(2),
                  sym + parseFloat(p.costPrice  || 0).toFixed(2),
                  (p.profitMargin || 0) + "%",
                  p.stock == 1 ? p.quantity : "N/A",
                  p.minStock || 1,
                  p.stock == 1 ? "Yes" : "No",
                  p.expirationDate || "—",
                  p.invoiceId || "—",
                ].map(function (v) { return cell(v); });
              });

              const docDefinition = {
                pageOrientation: "landscape",
                pageMargins: [28, 50, 28, 36],

                header: function (currentPage) {
                  if (currentPage === 1) return null;
                  return { text: "ShbairPharma — Product List Report", alignment: "center", fontSize: 7, color: "#888", margin: [0, 14, 0, 0] };
                },
                footer: function (currentPage, pageCount) {
                  return {
                    columns: [
                      { text: "Generated: " + moment().format("YYYY-MM-DD HH:mm:ss"), fontSize: 7, color: "#888", alignment: "left",  margin: [28, 0, 0, 0] },
                      { text: "Page " + currentPage + " of " + pageCount,             fontSize: 7, color: "#888", alignment: "right", margin: [0,  0, 28, 0] },
                    ],
                  };
                },

                content: [
                  // Title block
                  { text: "ShbairPharma",        style: "brand" },
                  { text: "Product List Report", style: "reportTitle" },
                  { text: moment().format("YYYY-MM-DD HH:mm:ss"), style: "generatedDate" },
                  { text: " ", margin: [0, 4] },

                  // Filter bar
                  {
                    table: {
                      widths: ["*"],
                      body: [[{ text: "Provider: " + providerLabel, style: "filterCell" }]],
                    },
                    layout: { hLineWidth: () => 0, vLineWidth: () => 0, fillColor: () => "#eef3f9" },
                    margin: [0, 0, 0, 14],
                  },

                  // Summary stats
                  { text: "Summary", style: "sectionTitle" },
                  {
                    table: {
                      widths: ["auto", "*", "auto", "*", "auto", "*"],
                      body: summaryBody,
                    },
                    layout: {
                      hLineWidth: () => 1, vLineWidth: () => 1,
                      hLineColor: () => "#c9d8e8", vLineColor: () => "#c9d8e8",
                      fillColor:  function (i) { return i % 2 === 0 ? "#eef3f9" : "#f8fafc"; },
                      paddingLeft: () => 8, paddingRight: () => 8,
                      paddingTop:  () => 6, paddingBottom: () => 6,
                    },
                    margin: [0, 4, 0, 18],
                  },

                  // Products table
                  { text: "Products  (" + source.length + " records)", style: "sectionTitle" },
                  {
                    table: {
                      headerRows: 1,
                      widths: ["auto", "*", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto"],
                      body: [
                        tableHeaders.map(function (h) { return { text: h, style: "tableHeader" }; }),
                        ...tableRows,
                      ],
                    },
                    layout: {
                      hLineWidth: function (i, node) { return (i === 0 || i === node.table.body.length) ? 1 : 0.5; },
                      vLineWidth: () => 0,
                      hLineColor: () => "#c9d8e8",
                      fillColor:  function (i) { return i === 0 ? null : (i % 2 === 0 ? "#f4f7fb" : null); },
                      paddingLeft: () => 5, paddingRight: () => 5,
                      paddingTop:  () => 3, paddingBottom: () => 3,
                    },
                    margin: [0, 4, 0, 0],
                  },
                ],

                styles: {
                  brand:        { fontSize: 17, bold: true, alignment: "center", color: "#1a2436", margin: [0, 0, 0, 4] },
                  reportTitle:  { fontSize: 12, bold: true, alignment: "center", color: "#0d7377", margin: [0, 0, 0, 4] },
                  generatedDate:{ fontSize: 7,              alignment: "center", color: "#888",    margin: [0, 0, 0, 8] },
                  sectionTitle: { fontSize: 9, bold: true,  color: "#2d4154",                      margin: [0, 0, 0, 4] },
                  filterCell:   { fontSize: 8,              alignment: "center", color: "#444",    margin: [4, 6, 4, 6] },
                  summaryLabel: { fontSize: 8,              color: "#555",       margin: [0, 0, 0, 0] },
                  summaryValue: { fontSize: 9, bold: true,  color: "#1a2436", alignment: "right",  margin: [0, 0, 0, 0] },
                  tableHeader:  { fillColor: "#2d4154", color: "white", fontSize: 7, bold: true, alignment: "center", margin: [0, 3, 0, 3] },
                },
              };

              pdfMake
                .createPdf(docDefinition)
                .download("product_list_" + moment().format("YYYY-MM-DD") + ".pdf");
            },
          },
        ]
      });
    }

    function loadCategoryList() {
      let category_list = "";
      let counter = 0;
      $("#category_list").empty();
      $("#categoryList").DataTable().destroy();

      allCategories.forEach((category, index) => {
        counter++;
        category_list += `<tr>
            <td>${category.name}</td>
            <td><span class="btn-group"><button onClick="$(this).editCategory(${index})" class="btn btn-warning"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteCategory(${category._id})" class="btn btn-danger"><i class="fa fa-trash"></i></button></span></td></tr>`;
      });

      if (counter == allCategories.length) {
        $("#category_list").html(category_list);
        $("#categoryList").DataTable({
          autoWidth: false,
          info: true,
          JQueryUI: true,
          ordering: true,
          paging: true,
        });
      }
    }

  

    $("#log-out").on("click", function () {
      const diagOptions = {
        title: "Are you sure?",
        text: "You are about to log out.",
        cancelButtonColor: "#3085d6",
        okButtonText: "Logout",
      };

      notiflix.Confirm.show(
        diagOptions.title,
        diagOptions.text,
        diagOptions.okButtonText,
        diagOptions.cancelButtonText,
        () => {
          $.get(api + "users/logout/" + user._id, function (data) {
            storage.delete("auth");
            storage.delete("user");
            ipcRenderer.send("app-reload", "");
          });
        },
      );
    });

    $("#settings_form").on("submit", function (e) {
      e.preventDefault();
      let formData = $(this).serializeObject();
      let mac_address;

      api = "http://" + host + ":" + port + "/api/";

      macaddress.one(function (err, mac) {
        mac_address = mac;
      });
      const appChoice = $("#app").find("option:selected").text();
    
      formData["app"] = appChoice;
      formData["mac"] = mac_address;
      formData["till"] = 1;

      // Update application field in settings form
      let $appField = $("#settings_form input[name='app']");
      let $hiddenAppField = $('<input>', {
        type: 'hidden',
        name: 'app',
        value: formData.app
    });
        $appField.length 
            ? $appField.val(formData.app) 
            : $("#settings_form").append(`<input type="hidden" name="app" value="${$hiddenAppField}" />`);


      if (formData.percentage != "" && typeof formData.percentage === 'number') {
        notiflix.Report.warning(
          "Oops!",
          "Please make sure the tax value is a number",
          "Ok",
        );
      } else {
        storage.set("settings", formData);

        $(this).attr("action", api + "settings/post");
        $(this).attr("method", "POST");

        $(this).ajaxSubmit({
          contentType: "application/json",
          success: function () {
            ipcRenderer.send("app-reload", "");
          },
          error: function (jqXHR) {
            console.error(jqXHR.responseJSON.message);
            notiflix.Report.failure(
              jqXHR.responseJSON.error,
              jqXHR.responseJSON.message,
              "Ok",
            );
      }
    });
    }
  });

    $("#net_settings_form").on("submit", function (e) {
      e.preventDefault();
      let formData = $(this).serializeObject();

      if (formData.till == 0 || formData.till == 1) {
        notiflix.Report.warning(
          "Oops!",
          "Please enter a number greater than 1.",
          "Ok",
        );
      } else {
        if (isNumeric(formData.till)) {
          formData["app"] = $("#app").find("option:selected").text();
          storage.set("settings", formData);
          ipcRenderer.send("app-reload", "");
        } else {
          notiflix.Report.warning(
            "Oops!",
            "Till number must be a number!",
            "Ok",
          );
        }
      }
    });

    $("#saveUser").on("submit", function (e) {
      e.preventDefault();
      let formData = $(this).serializeObject();

      if (formData.password != formData.pass) {
        notiflix.Report.warning("Oops!", "Passwords do not match!", "Ok");
      }

      if (
        bcrypt.compare(formData.password, user.password) ||
        bcrypt.compare(formData.password, allUsers[user_index].password)
      ) {
        $.ajax({
          url: api + "users/post",
          type: "POST",
          data: JSON.stringify(formData),
          contentType: "application/json; charset=utf-8",
          cache: false,
          processData: false,
          success: function (data) {
            if (ownUserEdit) {
              ipcRenderer.send("app-reload", "");
            } else {
              $("#userModal").modal("hide");

              loadUserList();

              $("#Users").modal("show");
              notiflix.Report.success("Great!", "User details saved!", "Ok");
            }
          },
          error: function (jqXHR,textStatus, errorThrown) {
            notiflix.Report.failure(
              jqXHR.responseJSON.error,
              jqXHR.responseJSON.message,
              "Ok",
            );
          },
        });
      }
    });

    $("#app").on("change", function () {
      if (
        $(this).find("option:selected").text() ==
        "Network Point of Sale Terminal"
      ) {
        $("#net_settings_form").show(500);
        $("#settings_form").hide(500);
        macaddress.one(function (err, mac) {
          $("#mac").val(mac);
        });
      } else {
        $("#net_settings_form").hide(500);
        $("#settings_form").show(500);
      }
    });

    $("#cashier").on("click", function () {
      ownUserEdit = true;

      $("#userModal").modal("show");

      $("#user_id").val(user._id);
      $("#fullname").val(user.fullname);
      $("#username").val(user.username);
      $("#password").attr("placeholder", "New Password");

      for (perm of permissions) {
        var el = "#" + perm;
        if (allUsers[index][perm] == 1) {
          $(el).prop("checked", true);
        } else {
          $(el).prop("checked", false);
        }
      }
    });

    $("#add-user").on("click", function () {
      if (platform.app != "Network Point of Sale Terminal") {
        $(".perms").show();
      }

      $("#saveUser").get(0).reset();
      $("#userModal").modal("show");
    });

    $("#settings").on("click", function () {
      if (platform.app == "Network Point of Sale Terminal") {
        $("#net_settings_form").show(500);
        $("#settings_form").hide(500);

        $("#ip").val(platform.ip);
        $("#till").val(platform.till);

        macaddress.one(function (err, mac) {
          $("#mac").val(mac);
        });

        $("#app option")
          .filter(function () {
            return $(this).text() == platform.app;
          })
          .prop("selected", true);
      } else {
        $("#net_settings_form").hide(500);
        $("#settings_form").show(500);

        $("#settings_id").val("1");
        $("#store").val(validator.unescape(settings.store));
        $("#address_one").val(validator.unescape(settings.address_one));
        $("#address_two").val(validator.unescape(settings.address_two));
        $("#contact").val(validator.unescape(settings.contact));
        $("#tax").val(validator.unescape(settings.tax));
        $("#symbol").val(validator.unescape(settings.symbol));
        $("#percentage").val(validator.unescape(settings.percentage));
        $("#footer").val(validator.unescape(settings.footer));
        $("#logo_img").val(validator.unescape(settings.img));
        if (settings.charge_tax) {
          $("#charge_tax").prop("checked", true);
        }
        if (validator.unescape(settings.img) != "") {
          $("#logoname").hide();
          $("#current_logo").html(
            `<img src="${img_path + validator.unescape(settings.img)}" alt="">`,
          );
          $("#rmv_logo").show();
        }

        $("#app option")
          .filter(function () {
            return $(this).text() == validator.unescape(settings.app);
          })
          .prop("selected", true);
      }
    });
 });

  $("#rmv_logo").on("click", function () {
    $("#remove_logo").val("1");
    // $("#logo_img").val('');
    $("#current_logo").hide(500);
    $(this).hide(500);
    $("#logoname").show(500);
  });

  $("#rmv_img").on("click", function () {
    $("#remove_img").val("1");
    // $("#img").val('');
    $("#current_img").hide(500);
    $(this).hide(500);
    $("#imagename").show(500);
  });
}

$.fn.print = function () {
  printJS({ printable: receipt, type: "raw-html" });
};

function loadTransactions() {
  let tills = [];
  let users = [];
  let sales = 0;
  let transact = 0;
  let unique = 0;

  sold_items = [];
  sold = [];

  let counter = 0;
  let transaction_list = "";
  let query = `by-date?start=${start_date}&end=${end_date}&user=${by_user}&status=${by_status}&till=${by_till}`;

  $.get(api + query, function (transactions) {
    if (transactions.length > 0) {
      $("#transaction_list").empty();
      $("#transactionList").DataTable().destroy();

      allTransactions = [...transactions];

      transactions.forEach((trans, index) => {
        sales += parseFloat(trans.total);
        transact++;

        trans.items.forEach((item) => {
          sold_items.push(item);
        });

        if (!tills.includes(trans.till)) {
          tills.push(trans.till);
        }

        if (!users.includes(trans.user_id)) {
          users.push(trans.user_id);
        }

        counter++;
        transaction_list += `<tr>
                                <td>${trans.order}</td>
                                <td class="nobr">${moment(trans.date).format(
                                  "DD-MMM-YYYY HH:mm:ss",
                                )}</td>
                                <td>${
                                  validator.unescape(settings.symbol) + moneyFormat(trans.total)
                                }</td>
                                <td>${
                                  trans.paid == ""
                                    ? ""
                                    : validator.unescape(settings.symbol) + moneyFormat(trans.paid)
                                }</td>
                                <td>${
                                  trans.change
                                    ? validator.unescape(settings.symbol) +
                                      moneyFormat(
                                        Math.abs(trans.change).toFixed(2),
                                      )
                                    : ""
                                }</td>
                                <td>${
                                  trans.paid == ""
                                    ? ""
                                    : trans.payment_type
                                }</td>
                                <td>${trans.till}</td>
                                <td>${trans.user}</td>
                                <td>${
                                  trans.paid == ""
                                    ? '<button class="btn btn-dark"><i class="fa fa-search-plus"></i></button>'
                                    : '<button onClick="$(this).viewTransaction(' +
                                      index +
                                      ')" class="btn btn-info"><i class="fa fa-search-plus"></i></button></td>'
                                }</tr>
                    `;

        if (counter == transactions.length) {
          $("#total_sales #counter").text(
            validator.unescape(settings.symbol) + moneyFormat(parseFloat(sales).toFixed(2)),
          );
          $("#total_transactions #counter").text(transact);

          const result = {};

          for (const { product_name, price, quantity, id } of sold_items) {
            if (!result[product_name]) result[product_name] = [];
            result[product_name].push({ id, price, quantity });
          }

          for (item in result) {
            let price = 0.0;
            let quantity = 0.0;
            let id = 0;

            result[item].forEach((i) => {
              id = i.id;
              price = i.price;
              quantity = quantity + parseFloat(i.quantity);
            });

            sold.push({
              id: id,
              product: item,
              qty: quantity,
              price: price,
            });
          }

          loadSoldProducts();

          if (by_user == 0 && by_till == 0) {
            userFilter(users);
            tillFilter(tills);
          }

          $("#transaction_list").html(transaction_list);
          $("#transactionList").DataTable({
            order: [[1, "desc"]],
            autoWidth: false,
            info: true,
            JQueryUI: true,
            ordering: true,
            paging: true,
            dom: "Bfrtip",
            buttons: [
              // ── CSV Audit Report ───────────────────────────────────────
              {
                text: '<i class="fa fa-download"></i> CSV',
                className: "btn btn-success",
                action: function () {
                  const sym          = (settings && validator.unescape(settings.symbol)) || '';
                  const cashierLabel = by_user  == 0 ? "All" : $("#users option:selected").text();
                  const tillLabel    = by_till  == 0 ? "All" : $("#tills option:selected").text();
                  const statusLabel  = by_status == 1 ? "Paid" : "Unpaid";
                  const periodLabel  =
                    moment(start_date).format("YYYY-MM-DD") + " to " +
                    moment(end_date).format("YYYY-MM-DD");

                  // Quote a single cell value per RFC 4180
                  function q(v) {
                    return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
                  }
                  // Convert a row (array) to a quoted CSV line
                  function csvRow(arr) {
                    return arr.map(q).join(",");
                  }

                  // Compute summary totals
                  let totalRevenue = 0, totalTax = 0, totalDiscount = 0, totalItemsCount = 0;
                  allTransactions.forEach(function (tr) {
                    totalRevenue  += parseFloat(tr.total    || 0);
                    totalTax      += parseFloat(tr.tax      || 0);
                    totalDiscount += parseFloat(tr.discount || 0);
                    totalItemsCount += (tr.items || []).length;
                  });
                  const avg = allTransactions.length > 0
                    ? (totalRevenue / allTransactions.length).toFixed(2) : "0.00";

                  // Build all rows as arrays, then serialize together
                  const rows = [];

                  // ── Section 1: Report info ──────────────────────────────
                  rows.push(["Transaction Audit Report"]);
                  rows.push(["Period",    periodLabel]);
                  rows.push(["Generated", moment().format("YYYY-MM-DD HH:mm:ss")]);
                  rows.push(["Cashier",   cashierLabel]);
                  rows.push(["Till",      tillLabel]);
                  rows.push(["Status",    statusLabel]);
                  rows.push([]);

                  // ── Section 2: Summary ──────────────────────────────────
                  rows.push(["SUMMARY"]);
                  rows.push(["Total Transactions",  allTransactions.length]);
                  rows.push(["Total Revenue",       sym + parseFloat(totalRevenue).toFixed(2)]);
                  rows.push(["Total Tax",           sym + parseFloat(totalTax).toFixed(2)]);
                  rows.push(["Total Discount",      sym + parseFloat(totalDiscount).toFixed(2)]);
                  rows.push(["Avg per Transaction", sym + avg]);
                  rows.push(["Total Items Sold",    totalItemsCount]);
                  rows.push([]);

                  // ── Section 3: Transactions ─────────────────────────────
                  rows.push(["TRANSACTIONS"]);
                  rows.push([
                    "Order #", "Date", "Customer",
                    "Subtotal", "Tax", "Discount", "Total", "Paid", "Change",
                    "Payment Method", "Till", "Cashier", "Status", "Items",
                  ]);
                  allTransactions.forEach(function (tr) {
                    rows.push([
                      tr.order,
                      moment(tr.date).format("YYYY-MM-DD HH:mm:ss"),
                      tr.customer || "",
                      parseFloat(tr.subtotal || 0).toFixed(2),
                      parseFloat(tr.tax      || 0).toFixed(2),
                      parseFloat(tr.discount || 0).toFixed(2),
                      parseFloat(tr.total    || 0).toFixed(2),
                      tr.paid !== "" ? parseFloat(tr.paid || 0).toFixed(2) : "",
                      tr.change ? Math.abs(parseFloat(tr.change)).toFixed(2) : "",
                      tr.payment_type || "",
                      tr.till  || "",
                      tr.user  || "",
                      tr.status == 1 ? "Paid" : "Unpaid",
                      (tr.items || []).length,
                    ]);
                  });

                  // Serialize: CRLF line endings for Excel compatibility
                  const csvContent = "\uFEFF" + rows.map(csvRow).join("\r\n");

                  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                  const url  = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.setAttribute("href", url);
                  link.setAttribute("download",
                    "transactions_" + moment(start_date).format("YYYY-MM-DD") +
                    "_to_" + moment(end_date).format("YYYY-MM-DD") + ".csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                },
              },

              // ── PDF Audit Report ───────────────────────────────────────
              {
                text: '<i class="fa fa-file-pdf-o"></i> PDF',
                className: "btn btn-danger",
                action: function () {
                  if (!pdfMake.vfs["Tahoma.ttf"]) {
                    const appRoot = app.getAppPath();
                    pdfMake.vfs["Tahoma.ttf"]      = fs.readFileSync(path.join(appRoot, "assets/fonts/Tahoma.ttf")).toString("base64");
                    pdfMake.vfs["Tahoma-Bold.ttf"] = fs.readFileSync(path.join(appRoot, "assets/fonts/Tahoma-Bold.ttf")).toString("base64");
                    pdfMake.fonts = {
                      Roboto: { normal: "Roboto-Regular.ttf", bold: "Roboto-Medium.ttf", italics: "Roboto-Italic.ttf", bolditalics: "Roboto-MediumItalic.ttf" },
                      Tahoma: { normal: "Tahoma.ttf", bold: "Tahoma-Bold.ttf", italics: "Tahoma.ttf", bolditalics: "Tahoma-Bold.ttf" },
                    };
                  }

                  function cell(value, extra) {
                    const str = String(value == null ? "" : value);
                    const isArabic = /[\u0600-\u06FF]/.test(str);
                    return Object.assign({
                      text: str, fontSize: 7,
                      font:      isArabic ? "Tahoma" : "Roboto",
                      alignment: isArabic ? "right"  : "left",
                    }, extra || {});
                  }

                  const sym          = (settings && validator.unescape(settings.symbol)) || '';
                  const cashierLabel = by_user  == 0 ? "All" : $("#users option:selected").text();
                  const tillLabel    = by_till  == 0 ? "All" : $("#tills option:selected").text();
                  const statusLabel  = by_status == 1 ? "Paid" : "Unpaid";
                  const periodLabel  =
                    moment(start_date).format("DD MMM YYYY") + "  —  " +
                    moment(end_date).format("DD MMM YYYY");

                  let totalRevenue = 0, totalTax = 0, totalDiscount = 0, totalItemsCount = 0;
                  allTransactions.forEach(function (tr) {
                    totalRevenue  += parseFloat(tr.total    || 0);
                    totalTax      += parseFloat(tr.tax      || 0);
                    totalDiscount += parseFloat(tr.discount || 0);
                    (tr.items || []).forEach(function () { totalItemsCount++; });
                  });
                  const avg = allTransactions.length > 0
                    ? (totalRevenue / allTransactions.length).toFixed(2) : "0.00";

                  // Summary stats (2 rows × 6 cols)
                  const summaryBody = [
                    [
                      { text: "Transactions",       style: "summaryLabel" },
                      { text: String(allTransactions.length),                style: "summaryValue" },
                      { text: "Total Revenue",       style: "summaryLabel" },
                      { text: sym + parseFloat(totalRevenue).toFixed(2),     style: "summaryValue" },
                      { text: "Avg / Transaction",   style: "summaryLabel" },
                      { text: sym + avg,                                      style: "summaryValue" },
                    ],
                    [
                      { text: "Items Sold",          style: "summaryLabel" },
                      { text: String(totalItemsCount),                        style: "summaryValue" },
                      { text: "Total Tax",           style: "summaryLabel" },
                      { text: sym + parseFloat(totalTax).toFixed(2),         style: "summaryValue" },
                      { text: "Total Discount",      style: "summaryLabel" },
                      { text: sym + parseFloat(totalDiscount).toFixed(2),    style: "summaryValue" },
                    ],
                  ];

                  // Transaction rows
                  const txHeaders = [
                    "Order #", "Date & Time", "Customer",
                    "Subtotal", "Tax", "Discount", "Total", "Paid", "Change",
                    "Method", "Till", "Cashier", "Status",
                  ];
                  const txRows = allTransactions.map(function (tr) {
                    return [
                      tr.order,
                      moment(tr.date).format("DD/MM/YY HH:mm"),
                      tr.customer || "—",
                      sym + parseFloat(tr.subtotal || 0).toFixed(2),
                      sym + parseFloat(tr.tax      || 0).toFixed(2),
                      sym + parseFloat(tr.discount || 0).toFixed(2),
                      sym + parseFloat(tr.total    || 0).toFixed(2),
                      tr.paid !== "" ? sym + parseFloat(tr.paid || 0).toFixed(2) : "—",
                      tr.change ? sym + Math.abs(parseFloat(tr.change)).toFixed(2) : "—",
                      tr.payment_type || "—",
                      tr.till  || "—",
                      tr.user  || "—",
                      tr.status == 1 ? "Paid" : "Unpaid",
                    ].map(function (v) { return cell(v); });
                  });

                  const docDefinition = {
                    pageOrientation: "landscape",
                    pageMargins: [28, 50, 28, 36],

                    header: function (currentPage) {
                      if (currentPage === 1) return null;
                      return { text: "ShbairPharma — Transaction Audit Report", alignment: "center", fontSize: 7, color: "#888", margin: [0, 14, 0, 0] };
                    },
                    footer: function (currentPage, pageCount) {
                      return {
                        columns: [
                          { text: "Generated: " + moment().format("YYYY-MM-DD HH:mm:ss"), fontSize: 7, color: "#888", alignment: "left",  margin: [28, 0, 0, 0] },
                          { text: "Page " + currentPage + " of " + pageCount,             fontSize: 7, color: "#888", alignment: "right", margin: [0,  0, 28, 0] },
                        ],
                      };
                    },

                    content: [
                      // Title block
                      { text: "ShbairPharma",             style: "brand" },
                      { text: "Transaction Audit Report", style: "reportTitle" },
                      { text: periodLabel,                style: "reportPeriod" },
                      { text: moment().format("YYYY-MM-DD HH:mm:ss"), style: "generatedDate" },
                      { text: " ", margin: [0, 4] },

                      // Active filters bar
                      {
                        table: {
                          widths: ["*", "*", "*"],
                          body: [[
                            { text: "Cashier: " + cashierLabel, style: "filterCell" },
                            { text: "Till: "    + tillLabel,    style: "filterCell" },
                            { text: "Status: "  + statusLabel,  style: "filterCell" },
                          ]],
                        },
                        layout: { hLineWidth: () => 0, vLineWidth: () => 0, fillColor: () => "#eef3f9" },
                        margin: [0, 0, 0, 14],
                      },

                      // Summary stats
                      { text: "Summary", style: "sectionTitle" },
                      {
                        table: {
                          widths: ["auto", "*", "auto", "*", "auto", "*"],
                          body: summaryBody,
                        },
                        layout: {
                          hLineWidth: () => 1, vLineWidth: () => 1,
                          hLineColor: () => "#c9d8e8", vLineColor: () => "#c9d8e8",
                          fillColor:  function (i) { return i % 2 === 0 ? "#eef3f9" : "#f8fafc"; },
                          paddingLeft: () => 8, paddingRight: () => 8,
                          paddingTop:  () => 6, paddingBottom: () => 6,
                        },
                        margin: [0, 4, 0, 18],
                      },

                      // Transactions table
                      { text: "Transaction Details  (" + allTransactions.length + " records)", style: "sectionTitle" },
                      {
                        table: {
                          headerRows: 1,
                          widths: ["auto", "auto", "*", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "*", "auto"],
                          body: [
                            txHeaders.map(function (h) { return { text: h, style: "tableHeader" }; }),
                            ...txRows,
                          ],
                        },
                        layout: {
                          hLineWidth: function (i, node) { return (i === 0 || i === node.table.body.length) ? 1 : 0.5; },
                          vLineWidth: () => 0,
                          hLineColor: () => "#c9d8e8",
                          fillColor:  function (i) { return i === 0 ? null : (i % 2 === 0 ? "#f4f7fb" : null); },
                          paddingLeft: () => 5, paddingRight: () => 5,
                          paddingTop:  () => 3, paddingBottom: () => 3,
                        },
                        margin: [0, 4, 0, 22],
                      },
                    ],

                    styles: {
                      brand:        { fontSize: 17, bold: true, alignment: "center", color: "#1a2436", margin: [0, 0, 0, 4] },
                      reportTitle:  { fontSize: 12, bold: true, alignment: "center", color: "#0d7377", margin: [0, 0, 0, 4] },
                      reportPeriod: { fontSize: 9,              alignment: "center", color: "#444",    margin: [0, 0, 0, 2] },
                      generatedDate:{ fontSize: 7,              alignment: "center", color: "#888",    margin: [0, 0, 0, 8] },
                      sectionTitle: { fontSize: 9, bold: true,  color: "#2d4154",                      margin: [0, 0, 0, 4] },
                      filterCell:   { fontSize: 8,              alignment: "center", color: "#444",    margin: [4, 6, 4, 6] },
                      summaryLabel: { fontSize: 8,              color: "#555",       margin: [0, 0, 0, 0] },
                      summaryValue: { fontSize: 9, bold: true,  color: "#1a2436", alignment: "right",  margin: [0, 0, 0, 0] },
                      tableHeader:  { fillColor: "#2d4154", color: "white", fontSize: 7, bold: true, alignment: "center", margin: [0, 3, 0, 3] },
                    },
                  };

                  pdfMake
                    .createPdf(docDefinition)
                    .download(
                      "transactions_" + moment(start_date).format("YYYY-MM-DD") +
                      "_to_" + moment(end_date).format("YYYY-MM-DD") + ".pdf"
                    );
                },
              },
            ],
          });
        }
      });
    } else {
      notiflix.Report.warning(
        "No data!",
        "No transactions available within the selected criteria",
        "Ok",
      );
    }
  });
}

function sortDesc(a, b) {
  if (a.qty > b.qty) {
    return -1;
  }
  if (a.qty < b.qty) {
    return 1;
  }
  return 0;
}

function loadSoldProducts() {
  sold.sort(sortDesc);

  let counter = 0;
  let sold_list = "";
  let items = 0;
  let products = 0;
  $("#product_sales").empty();

  sold.forEach((item, index) => {
    items = items + parseInt(item.qty);
    products++;

    let product = allProducts.filter(function (selected) {
      return selected._id == item.id;
    });
    
    counter++;
    
    sold_list += `<tr>
            <td>${item.product}</td>
            <td>${item.qty}</td>
            <td>${
              product[0]?.stock == 1
                ? product.length > 0
                  ? product[0].quantity
                  : ""
                : "N/A"
            }</td>
            <td>${
              validator.unescape(settings.symbol) +
              moneyFormat((item.qty * parseFloat(item.price)).toFixed(2))
            }</td>
            </tr>`;

    if (counter == sold.length) {
      $("#total_items #counter").text(items);
      $("#total_products #counter").text(products);
      $("#product_sales").html(sold_list);
    }
  });
}

function userFilter(users) {
  $("#users").empty();
  $("#users").append(`<option value="0">All</option>`);

  users.forEach((user) => {
    let u = allUsers.filter(function (usr) {
      return usr._id == user;
    });

    $("#users").append(`<option value="${user}">${u[0].fullname}</option>`);
  });
}

function tillFilter(tills) {
  $("#tills").empty();
  $("#tills").append(`<option value="0">All</option>`);
  tills.forEach((till) => {
    $("#tills").append(`<option value="${till}">${till}</option>`);
  });
}

$.fn.viewTransaction = function (index) {
  transaction_index = index;

  let discount = allTransactions[index].discount;
  let customer =
    allTransactions[index].customer == 0
      ? "Walk in Customer"
      : allTransactions[index].customer.username;
  let refNumber =
    allTransactions[index].ref_number != ""
      ? allTransactions[index].ref_number
      : allTransactions[index].order;
  let orderNumber = allTransactions[index].order;
  let paymentMethod = "";
  let tax_row = "";
  let items = "";
  let products = allTransactions[index].items;

  products.forEach((item) => {
    items += `<tr><td>${item.product_name}</td><td>${
      item.quantity
    } </td><td class="text-right"> ${validator.unescape(settings.symbol)} ${moneyFormat(
      Math.abs(item.price).toFixed(2),
    )} </td></tr>`;
  });

  paymentMethod = allTransactions[index].payment_type;
 

  if (allTransactions[index].paid != "") {
    payment = `<tr>
                    <td>Paid</td>
                    <td>:</td>
                    <td class="text-right">${validator.unescape(settings.symbol)} ${moneyFormat(
                      Math.abs(allTransactions[index].paid).toFixed(2),
                    )}</td>
                </tr>
                <tr>
                    <td>Change</td>
                    <td>:</td>
                    <td class="text-right">${validator.unescape(settings.symbol)} ${moneyFormat(
                      Math.abs(allTransactions[index].change).toFixed(2),
                    )}</td>
                </tr>
                <tr>
                    <td>Method</td>
                    <td>:</td>
                    <td class="text-right">${paymentMethod}</td>
                </tr>`;
  }

  if (settings.charge_tax) {
    tax_row = `<tr>
                <td>Vat(${validator.unescape(settings.percentage)})% </td>
                <td>:</td>
                <td class="text-right">${validator.unescape(settings.symbol)}${parseFloat(
                  allTransactions[index].tax,
                ).toFixed(2)}</td>
            </tr>`;
  }

    logo = path.join(img_path, validator.unescape(settings.img));
      
      receipt = `<div style="font-size: 10px">                            
        <p style="text-align: center;">
        ${
          checkFileExists(logo)
            ? `<img style='max-width: 50px' src='${logo}' /><br>`
            : ``
        }
            <span style="font-size: 22px;">${validator.unescape(settings.store)}</span> <br>
            ${validator.unescape(settings.address_one)} <br>
            ${validator.unescape(settings.address_two)} <br>
            ${
              validator.unescape(settings.contact) != "" ? "Tel: " + validator.unescape(settings.contact) + "<br>" : ""
            } 
            ${validator.unescape(settings.tax) != "" ? "Vat No: " + validator.unescape(settings.tax) + "<br>" : ""} 
    </p>
    <hr>
    <left>
        <p>
        Invoice : ${orderNumber} <br>
        Ref No : ${refNumber} <br>
        Customer : ${
          allTransactions[index].customer == 0
            ? "Walk in Customer"
            : allTransactions[index].customer.name
        } <br>
        Cashier : ${allTransactions[index].user} <br>
        Date : ${moment(allTransactions[index].date).format(
          "DD MMM YYYY HH:mm:ss",
        )}<br>
        </p>

    </left>
    <hr>
    <table width="90%">
        <thead>
        <tr>
            <th>Item</th>
            <th>Qty</th>
            <th class="text-right">Price</th>
        </tr>
        </thead>
        <tbody>
        ${items}                
        <tr><td colspan="3"><hr></td></tr>
        <tr>                        
            <td><b>Subtotal</b></td>
            <td>:</td>
            <td class="text-right"><b>${validator.unescape(settings.symbol)}${moneyFormat(
              allTransactions[index].subtotal,
            )}</b></td>
        </tr>
        <tr>
            <td>Discount</td>
            <td>:</td>
            <td class="text-right">${
              discount > 0
                ? validator.unescape(settings.symbol) +
                  moneyFormat(
                    parseFloat(allTransactions[index].discount).toFixed(2),
                  )
                : ""
            }</td>
        </tr>
        
        ${tax_row}
    
        <tr>
            <td><h5>Total</h5></td>
            <td><h5>:</h5></td>
            <td class="text-right">
                <h5>${validator.unescape(settings.symbol)}${moneyFormat(
                  allTransactions[index].total,
                )}</h5>
            </td>
        </tr>
        ${payment == 0 ? "" : payment}
        </tbody>
        </table>
        <br>
        <hr>
        <br>
        <p style="text-align: center;">
         ${validator.unescape(settings.footer)}
         </p>
        </div>`;

        //prevent DOM XSS; allow windows paths in img src
        receipt = DOMPurify.sanitize(receipt,{ ALLOW_UNKNOWN_PROTOCOLS: true });

  $("#viewTransaction").html("");
  $("#viewTransaction").html(receipt);

  $("#orderModal").modal("show");
};

$("#status").on("change", function () {
  by_status = $(this).find("option:selected").val();
  loadTransactions();
});

$("#tills").on("change", function () {
  by_till = $(this).find("option:selected").val();
  loadTransactions();
});

$("#users").on("change", function () {
  by_user = $(this).find("option:selected").val();
  loadTransactions();
});

$("#reportrange").on("apply.daterangepicker", function (ev, picker) {
  start = picker.startDate.format("DD MMM YYYY hh:mm A");
  end = picker.endDate.format("DD MMM YYYY hh:mm A");

  start_date = picker.startDate.toDate().toJSON();
  end_date = picker.endDate.toDate().toJSON();

  loadTransactions();
});

function authenticate() {
  $(".loading").hide();
  $("body").attr("class", "login-page");
  $("#login").show();
  let savedUsername = storage.get("remember_me_username");
  if (savedUsername) {
    $("input[name='username']").val(savedUsername);
    $("#remember_me").prop("checked", true);
  }
}

$("body").on("submit", "#account", function (e) {
  e.preventDefault();
  let formData = $(this).serializeObject();

  if (formData.username == "" || formData.password == "") {
    notiflix.Report.warning("Incomplete form!", auth_empty, "Ok");
  } else {
    $.ajax({
      url: api + "users/login",
      type: "POST",
      data: JSON.stringify(formData),
      contentType: "application/json; charset=utf-8",
      cache: false,
      processData: false,
      success: function (data) {
        if (data.auth === true) {
          if (formData.remember_me) {
            storage.set("remember_me_username", formData.username);
          } else {
            storage.delete("remember_me_username");
          }
          storage.set("auth", { auth: true });
          storage.set("user", data);
          ipcRenderer.send("app-reload", "");
          $("#login").hide();
        } else {
          notiflix.Report.warning("Oops!", auth_error, "Ok");
        }
      },
      error: function (data) {
        console.log(data);
      },
    });
  }
});

$("#quit").on("click", function () {
  const diagOptions = {
    title: "Are you sure?",
    text: "You are about to close the application.",
    icon: "warning",
    okButtonText: "Close Application",
    cancelButtonText: "Cancel"
  };

  notiflix.Confirm.show(
    diagOptions.title,
    diagOptions.text,
    diagOptions.okButtonText,
    diagOptions.cancelButtonText,
    () => {
      ipcRenderer.send("app-quit", "");
    },
  );
});

ipcRenderer.on("click-element", (event, elementId) => {
  document.getElementById(elementId).click();
});
