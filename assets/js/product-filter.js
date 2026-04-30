$(document).ready(function () {
  $("#categories").on("change", function () {
    let selected = $("#categories option:selected").val();
    if (selected == "0") {
      $("#parent > div").fadeIn(450);
    } else {
      var $el = $("." + selected).fadeIn(450);
      $("#parent > div").not($el).hide();
    }
  });

  $("#search").on("input", function () {
    //@ts-expect-error
    if (typeof window.posSearchProducts === "function") {
      //@ts-expect-error
      window.posSearchProducts($(this).val());
    }
  });

  // Listen for clicks on virtual keyboard buttons inside #jq-keyboard
  $("body").on("click", "#jq-keyboard button", function (e) {
    //@ts-expect-error
    if ($("#search").is(":focus") && typeof window.posSearchProducts === "function") {
      //@ts-expect-error
      window.posSearchProducts($("#search").val());
    }
  });

  function searchOpenOrders() {
    var matcher = new RegExp($("#holdOrderInput").val().toString(), "gi");
    $(".order")
      .show()
      .not(function () {
        return matcher.test($(this).find(".ref_number").text());
      })
      .hide();
  }

  var $searchHoldOrder = $("#holdOrderInput").on("input", function () {
    searchOpenOrders();
  });

  $("body").on("click", ".holdOrderKeyboard .key", function () {
    if ($("#holdOrderInput").is(":focus")) {
      searchOpenOrders();
    }
  });

  function searchCustomerOrders() {
    var matcher = new RegExp($("#holdCustomerOrderInput").val().toString(), "gi");
    $(".customer-order")
      .show()
      .not(function () {
        return matcher.test($(this).find(".customer_name").text());
      })
      .hide();
  }

  $("#holdCustomerOrderInput").on("input", function () {
      searchCustomerOrders();
    }
  );

  $("body").on("click", ".customerOrderKeyboard .key", function () {
    if ($("#holdCustomerOrderInput").is(":focus")) {
      searchCustomerOrders();
    }
  });

});