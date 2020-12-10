var exons;
var primerPairs;
var selectedPrimer = -1;
var numberPrimersDisplayed = 10;

chrome.runtime.sendMessage({message: "get exons"}, function(response) {
  exons = response.exons;
  primerPairs = calculate(response.exons);
  console.log(primerPairs);
  updatePage();
});

function updatePage() {
  // Add exons to exon table;
  exons.forEach(function(exon, exonInd) {
    let exonElement = $("<td></td>");
    exonElement.attr("id", "exon"+(exonInd+1).toString());
    exonElement.append($("<span class='pre_text'></span>"));
    exonElement.append($("<span class='high_text'></span>"));
    exonElement.append($("<span class='post_text'></span>"));
    exonElement.find(".pre_text").text(exon);

    let exonRow = $("<tr></tr>");
    exonRow.attr("id", "exon_row"+(exonInd+1).toString());
    exonRow.append($("<td>"+(exonInd+1).toString()+"</td>"));
    exonRow.append(exonElement);
    $("#exon_table").append(exonRow);
  });

  // Add numberPrimersDisplayed primers to display
  for (let i = 0; i < numberPrimersDisplayed; i++) {
    showPrimer(primerPairs[i], i);
  }
}

function showPrimer(primerPair, index) {
  let i = index.toString();
  let primerPairElement = $("<div class='card' id='primerPair"+i+"' style='margin-bottom:10px'></div>");
  let cardHeader = $("<div class='card-header' id='primerHeading"+i+"'></div>'")
  primerPairElement.append(cardHeader);
  let primerPairBtn = $("<button class='btn btn-link btn-block text-left collapsed' type='button' data-toggle='collapse' data-target='#primerText"+i+"' aria-expanded='false' aria-controls='primerText"+i+"'>Primer "+(index+1).toString()+"</button>");
  primerPairBtn.click(function() {
    highlightPrimerPair(primerPair, index, !primerPairBtn.hasClass('collapsed'));
  });
  cardHeader.append(primerPairBtn);
  let primerPairText = $("<div id='primerText"+i+"' class='collapse' aria-labelledby='primerHeading"+i+"' data-parent='#primers'></div>");
  primerPairElement.append(primerPairText);
  let primerPairBody = $("<div class='card body' style='padding:8px'></div>");
  primerPairBody.append(primerPairInfo(primerPair));
  primerPairText.append(primerPairBody);
  $("#primers").append(primerPairElement);
}

function highlightPrimerPair(primerPair, primerIndex, remove) {
  if (remove || selectedPrimer != primerIndex) {
    if (selectedPrimer >= 0) {
      let selectedExon = primerPairs[selectedPrimer].exon;
      let fExonElement = $("#exon"+selectedExon.toString());
      let fExonText = exons[selectedExon-1];
      let rExonElement = $("#exon"+(selectedExon+1).toString());
      let rExonText = exons[selectedExon];
      fExonElement.find(".pre_text").text(fExonText);
      fExonElement.find(".high_text").text("");
      fExonElement.find(".post_text").text("");
      rExonElement.find(".pre_text").text(rExonText);
      rExonElement.find(".high_text").text("");
      rExonElement.find(".post_text").text("");
    }
    if (!remove) {
      let fExonElement = $("#exon"+primerPair.exon.toString());
      let fExonText = exons[primerPair.exon-1];
      let rExonElement = $("#exon"+(primerPair.exon+1).toString());
      let rExonText = exons[primerPair.exon];
      fExonElement.find(".pre_text").text(fExonText.substring(0, primerPair.fInd));
      fExonElement.find(".high_text").text(fExonText.substring(primerPair.fInd, primerPair.fInd+primerPair.fLen));
      fExonElement.find(".post_text").text(fExonText.substring(primerPair.fInd+primerPair.fLen));
      rExonElement.find(".pre_text").text(rExonText.substring(0, primerPair.rInd));
      rExonElement.find(".high_text").text(rExonText.substring(primerPair.rInd, primerPair.rInd+primerPair.rLen));
      rExonElement.find(".post_text").text(rExonText.substring(primerPair.rInd+primerPair.rLen));
    }
    selectedPrimer = primerIndex;
    if (remove) {
      selectedPrimer = -1;
    }
  }
}

function primerPairInfo(primerPair) {
  let fSelfComp = hasHairpin(primerPair.fPrimer);
  let rSelfComp = hasHairpin(primerPair.rPrimer);
  let dimerization = isDimer(primerPair.fPrimer, primerPair.rPrimer);

  let body = $("<div ></div>");
  let prop1 = $("<div></div>");
  prop1.append($("<div class='font-weight-bold' style='font-size:14px'>Forward</div>"));
  prop1.append($("<div class='font-italic' style='font-size:12px; text-indent:10%'>"+primerPair.fPrimer+"</div>"));
  body.append(prop1);
  let prop2 = $("<div></div>");
  prop2.append($("<div class='font-weight-bold' style='font-size:14px'>Reverse</div>"));
  prop2.append($("<div class='font-italic' style='font-size:12px; text-indent:10%'>"+primerPair.rPrimer+"</div>"));
  body.append(prop2);
  let prop3 = $("<div></div>");
  prop3.append($("<div class='font-weight-bold' style='font-size:14px'>Melting Temperature</div>"));
  prop3.append($("<div class='font-italic' style='font-size:12px; text-indent:10%'>for: "+primerPair.fMeltTemp.toFixed(2).toString()+"º | rev: "+primerPair.rMeltTemp.toFixed(2).toString()+"º | diff: "+primerPair.meltTempDiff.toFixed(3).toString()+"º</div>"));
  body.append(prop3);
  let prop4 = $("<div></div>");
  prop4.append($("<div class='font-weight-bold' style='font-size:14px'>G/C Content</div>"));
  prop4.append($("<div class='font-italic' style='font-size:12px; text-indent:10%'>for: "+(primerPair.fPercentGC).toFixed(1).toString()+"% | rev: "+(primerPair.rPercentGC).toFixed(1).toString()+"%</div>"));
  body.append(prop4);
  let prop5 = $("<div></div>");
  prop5.append($("<div class='font-weight-bold' style='font-size:14px'>Start/End with G/C Pair</div>"));
  prop5.append($("<div class='font-italic' style='font-size:12px; text-indent:10%'>for: "+primerPair.fStartGC.toString()+" | rev: "+primerPair.rStartGC.toString()+"</div>"));
  body.append(prop5);
  let prop6 = $("<div></div>");
  prop6.append($("<div class='font-weight-bold' style='font-size:14px'>Self-complementary</div>"));
  prop6.append($("<div class='font-italic' style='font-size:12px; text-indent:10%'>for: "+fSelfComp.toString()+" | rev: "+rSelfComp.toString()+"</div>"));
  body.append(prop6);
  let prop7 = $("<div></div>");
  prop7.append($("<div class='font-weight-bold' style='font-size:14px'>Dimerization</div>"));
  prop7.append($("<div class='font-italic' style='font-size:12px; text-indent:10%'>"+dimerization+"</div>"));
  body.append(prop7);
  let prop8 = $("<div></div>");
  prop8.append($("<div class='font-weight-bold' style='font-size:14px'>Length</div>"));
  prop8.append($("<div class='font-italic' style='font-size:12px; text-indent:10%'>for: "+primerPair.fLen.toString()+" | rev: "+primerPair.rLen.toString()+" | total: "+(primerPair.fLen+primerPair.dist+primerPair.rLen).toString()+"</div>"));
  body.append(prop8);
  return body;
}
