const myObj = [
  { first: "wanda", last: "adi" },
  { first: "wanda", last: "adi" },
  { first: "wanda", last: "adi" }
];

const ID = '1Jc6DImFcqbaJlXpmB1Df7PiAM5xGCQ9gR8NTqaalJtc';

function doGet(e) {
  const data = output(e);
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = output(e);
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function output(e) {
  let data = {};

  if (e && e.parameter && 'type' in e.parameter) {
    let valID = e.parameter.type;

    if (valID === '1') {
      data.vals = SpreadsheetApp.openById(ID).getSheets()[0].getDataRange().getValues();
    } else if (valID === '2') {
      data.vals = myObj;
    } else if (valID === '3') {
      data.vals = e;
    } else {
      data.vals = { status: 'Kosong !!!' };
    }
  } else {
    data.vals = { status: 'Parameter type tidak ada' };
  }

  return data;
}
