var exons;
var primerPairs;
var selectedPrimer = -1;

chrome.runtime.sendMessage({message: "get exons"}, function(response) {
  exons = response.exons;
  primerPairs = calculate(response.exons);
  console.log(primerPairs);
  updatePage();
});

function updatePage() {
  exons.forEach(function(exon, exonInd) {
    let exonElement = $("<td></td>");
    exonElement.attr("id", "exon"+(exonInd+1).toString());
    exonElement.attr("style", "word-wrap: break-word");
    exonElement.append($("<span class='pre_text'></span>"));
    exonElement.append($("<span class='high_text'></span>"));
    exonElement.append($("<span class='post_text'></span>"));
    exonElement.find(".pre_text").text(exon);

    let exonRow = $("<tr></tr>");
    exonRow.attr("id", "exon_row"+(exonInd+1).toString());
    exonRow.append($("<td>Exon "+(exonInd+1).toString()+"</td>"));
    exonRow.append(exonElement);
    $("#exon_table").append(exonRow);
  });

  for (let i = 0; i < 10; i++) {
    showPrimer(primerPairs[i], i);
  }
}

function showPrimer(primerPair, index) {
  let primerPairElement = $("<div class=primer_pair></div>");
  primerPairElement.attr("id", "primerPair"+(index).toString());
  primerPairElement.text("Forward Primer: "+primerPair.fPrimer+" Reverse Primer: "+primerPair.rPrimer+"\n");
  primerPairElement.click(function() {
    highlightPrimerPair(primerPair, index);
  });
  $(".primers").append(primerPairElement);
}

function highlightPrimerPair(primerPair, primerIndex) {
  console.log(primerPair);
  if (selectedPrimer != primerIndex) {
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

    selectedPrimer = primerIndex;
  }
}
