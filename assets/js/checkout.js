// @ts-check
/// <reference types="jquery" />

const utils = require("./utils");

/** CheckOut Functions **/
$(document).ready(function () {

  //@ts-expect-error
  $.fn.paymentChange = function () {
    let paymentAmount = $("#paymentText").val();
    $("#paymentText").val(utils.moneyFormat(paymentAmount));
    $("#payment").val(paymentAmount);
    //@ts-expect-error
    $(this).calculateChange();
  }

  //@ts-expect-error
  $.fn.keypadBtnPressed = function (value, isDueInput) {
    let paymentAmount = $("#payment").val();
    if (isDueInput) {
      $("#refNumber").val($("#refNumber").val() + "" + value);
    } else {
      paymentAmount = paymentAmount + "" + value;
      $("#paymentText").val(utils.moneyFormat(paymentAmount));
      $("#payment").val(paymentAmount);
      //@ts-expect-error
      $(this).calculateChange();
    }
  };

  /**
   * Format payment amount with commas when a point is pressed
   */
  //@ts-expect-error
  $.fn.digits = function () {
    let paymentAmount = $("#payment").val().toString();
    $("#paymentText").val(parseFloat(paymentAmount).toFixed(2));
    $("#payment").val(paymentAmount + ".");
    //@ts-expect-error
    $(this).calculateChange();
  };

  /**
   * Calculate and display the balance due.
   */
  //@ts-expect-error
  $.fn.calculateChange = function () {
    const payablePrice = $("#payablePrice").val().toString().replace(",", "");
    const payment = $("#payment").val().toString().replace(",", "");
    const change = parseFloat(payablePrice) - parseFloat(payment);
    if (change <= 0) {
      $("#change").text(utils.moneyFormat(Math.abs(change)));
      $("#confirmPayment").show();
    } else {
      $("#change").text("0");
      $("#confirmPayment").hide();
    }
  };

  $(".keypad-btn").on("click", function () {
    const key = $(this).data("val");
    const isdue = $(this).data("isdue");
    switch(key)
    {
    case "del" : { 
      if(isdue)
      {
        $('#refNumber').val((i, val) => val.slice(0, -1));
      }
      else
      {
        $("#payment").val((i, val) => val.slice(0, -1));
      //re-format displayed amount after deletion 
      $("#paymentText").val((i, val) => utils.moneyFormat($("#payment").val()));
      }
      //@ts-expect-error
      $(this).calculateChange()
    }; break;

    case "ac":{
      if(isdue)
      {
          $('#refNumber').val('');
      }
      else
      {
        $('#payment,#paymentText').val('');
        //@ts-expect-error
        $(this).calculateChange();
      }
       
    };break;

    case "point": {
      //@ts-expect-error
      $(this).digits()
      };break;

  //@ts-expect-error
   default: $(this).keypadBtnPressed(key, isdue); break;
  }
});

  /** Switch Views for Payment Options **/
  var $list = $(".list-group-item").on("click", function () {
    $list.removeClass("active");
    $(this).addClass("active");
    if (this.id == "palpay") {
      $("#cardInfo").show();
      $("#cardInfo .input-group-addon").text("Mobile Number");
      var price = $("#payablePrice").val().toString();
      $("#payment").val(price.replace(/,/g, ""));
      $("#paymentText").val(price);
      $("#changeDisplay").hide();
      $("#confirmPayment").show();
    } else {
      $("#cardInfo").hide();
      $("#paymentInfo").val("");
      $("#payment,#paymentText").val("");
      $("#changeDisplay").show();
      $("#confirmPayment").hide();
    }
  });
});