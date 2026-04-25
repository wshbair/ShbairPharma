const utils = require("./utils");

/** CheckOut Functions **/
$(document).ready(function () {
  /**
   * handle keypad button pressed.
   * @param {string} value - The keypad value to be processed.
   * @param {boolean} isDueInput - Indicates whether the input is for due payment.
   */

  $.fn.paymentChange = function () {
    let paymentAmount = $("#paymentText").val();
    $("#paymentText").val(utils.moneyFormat(paymentAmount));
    $("#payment").val(paymentAmount);
    $(this).calculateChange();
  }

  $.fn.keypadBtnPressed = function (value, isDueInput) {
    let paymentAmount = $("#payment").val();
    if (isDueInput) {
      $("#refNumber").val($("#refNumber").val() + "" + value);
    } else {
      paymentAmount = paymentAmount + "" + value;
      $("#paymentText").val(utils.moneyFormat(paymentAmount));
      $("#payment").val(paymentAmount);
      $(this).calculateChange();
    }
  };

  /**
   * Format payment amount with commas when a point is pressed
   */
  $.fn.digits = function () {
    let paymentAmount = $("#payment").val();
    $("#paymentText").val(parseFloat(paymentAmount).toFixed(2));
    $("#payment").val(paymentAmount + ".");
    $(this).calculateChange();
  };

  /**
   * Calculate and display the balance due.
   */
  $.fn.calculateChange = function () {
    var payablePrice = $("#payablePrice").val().replace(",", "");
    var payment = $("#payment").val().replace(",", "");
    var change = payablePrice - payment;
    if (change <= 0) {
      $("#change").text(utils.moneyFormat(Math.abs(change.toFixed(2))));
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
        $(this).calculateChange();
      }
       
    };break;

    case "point": {
      $(this).digits()
      };break;

   default: $(this).keypadBtnPressed(key, isdue); break;
  }
});

  /** Switch Views for Payment Options **/
  var $list = $(".list-group-item").on("click", function () {
    $list.removeClass("active");
    $(this).addClass("active");
    if (this.id == "palpal") {
      $("#cardInfo").show();
      $("#cardInfo .input-group-addon").text("Mobile Number");
      var price = $("#payablePrice").val();
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