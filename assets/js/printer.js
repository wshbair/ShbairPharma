const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } = require('node-thermal-printer');
const printerInterface = 'tcp://127.0.0.1:9001'
const {playNotificationSound, decodeHtmlEntities} = require("./utils");
 

async function printReceipt(jsonReceipt) {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    // Network printer IP
    interface: printerInterface,
    removeSpecialCharacters: false,
    lineCharacter: "=",
    characterSet: CharacterSet.PC864_ARABIC,
    width: 48, 
  });

  const isConnected = await printer.isPrinterConnected();

  if (!isConnected) {
    $("#printerConnectionStatus").text(`Printer: ${isConnected ? 'Connected' : "Offline"}`);
    $("#printerConnectionStatus").addClass('greenback')
    return;
  } else 
    $("#printerConnectionStatus").text(`Printing ...`);

  // Center text
  printer.alignCenter();
   
  //printer.setTextDoubleHeight();
  //printer.setTextDoubleWidth();
  //printer.setTypeFontA();
  await printer.printImage(jsonReceipt.store.logo);
  printer.bold(true);
  printer.setTextSize(1,1);
  printer.println(jsonReceipt.store.name);

  printer.setTextNormal();
  printer.println(jsonReceipt.store.addressOne + " , "+ jsonReceipt.store.addressTwo);
  printer.println("Tel : " + jsonReceipt.store.contact);
  printer.drawLine();
  printer.alignLeft();
  printer.println(`Order No : ${jsonReceipt.order.orderNumber}`);
  printer.println(`Ref No   : ${jsonReceipt.order.refNumber}`)
  printer.println(`Customer : ${jsonReceipt.order.customer}`);
  printer.println(`Cashier  : ${jsonReceipt.order.cashier}`);
  printer.println(`Date     : ${jsonReceipt.order.date}`);
  printer.drawLine();

  printer.tableCustom([
    { text: "Item", align: "LEFT", width: 0.6 },
    { text: "Qty", align: "CENTER", width: 0.15 },
    { text: "Price", align: "RIGHT", width: 0.25 },
  ]);
  printer.tableCustom([
    { text: "----", align: "LEFT", width: 0.6 },
    { text: "---", align: "CENTER", width: 0.15 },
    { text: "-----", align: "RIGHT", width: 0.25 },
  ]);

  for(const item of jsonReceipt.order.items)
  {
      printer.tableCustom([
        {
        text: decodeHtmlEntities(item.name),
        align: "LEFT",
        width: 0.6,
        },
        {
        text: item.quantity,
        align: "CENTER",
        width: 0.15,
        },
        {
        text: item.price,
        align: "RIGHT",
        width: 0.25,
        },
    ]);

  }

  printer.drawLine();
  printer.tableCustom([
    { text: "Subtotal", align: "LEFT", width: 0.7 },
    { text: jsonReceipt.order.subTotal, align: "RIGHT", width: 0.3 },
  ]);
  printer.tableCustom([
    { text: "Discount", align: "LEFT", width: 0.7 },
    { text: "-"+jsonReceipt.order.discount, align: "RIGHT", width: 0.3 },
  ]);

  printer.tableCustom([
    { text: `VAT(${jsonReceipt.order.tax.tax_percentage}%)`, align: "LEFT", width: 0.7 },
    { text: "+"+jsonReceipt.order.tax.total_vat, align: "RIGHT", width: 0.3 },
  ]);

  printer.println('')
  printer.bold(true);
  printer.setTextSize(0,0);
  printer.tableCustom([
    { text: "TOTAL TTC", align: "LEFT", width: 0.7 },
    { text: jsonReceipt.order.orderTotal, align: "RIGHT", width: 0.3 },
  ]);
  printer.println('')
  printer.setTextNormal();
  printer.tableCustom([
    { text: "Paid", align: "LEFT", width: 0.7 },
    { text: jsonReceipt.order.payment?.paid || "", align: "RIGHT", width: 0.3 },
  ]);
  printer.tableCustom([
    { text: "Change", align: "LEFT", width: 0.7 },
    { text: jsonReceipt.order.payment?.change || "", align: "RIGHT", width: 0.3 },
  ]);
  printer.tableCustom([
    { text: "Method", align: "LEFT", width: 0.7 },
    { text: jsonReceipt.order.payment?.method || "", align: "RIGHT", width: 0.3 },
  ]);

  if(jsonReceipt.order.payment?.method !== "Cash") {
        printer.tableCustom([
            { text: "PayPal", align: "LEFT", width: 0.7 },
            { text: jsonReceipt.order.mobileNumber, align: "RIGHT", width: 0.3 },
        ]);
    }

  printer.drawLine();

  printer.setTextNormal();
  printer.tableCustom([
    { text: "Number of Items", align: "LEFT", width: 0.7 },
    { text: jsonReceipt.order.items.length , align: "RIGHT", width: 0.3 },
  ]);
  printer.bold(false);
  printer.drawLine();
  printer.alignCenter();
  printer.println('');
  printer.println(jsonReceipt.store.footer);
  // Feed paper
  printer.newLine();
  printer.newLine();
  // Auto cut
  printer.cut();
  // Open cash drawer
  // printer.openCashDrawer();

  // Execute print
  await printer.execute();
  $("#printerConnectionStatus").text(`Printer: ${isConnected ? 'Connected' : 'Offline'}`)
  //playNotificationSound();
}

async function printerStatus() {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: printerInterface,
  });
  const isConnected = await printer.isPrinterConnected();
  if(isConnected)
    return "Online"
  else 
    return "Offline"
}

// export function
module.exports = {
  printReceipt,
  printerStatus
};