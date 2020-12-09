// Event listener for popup start button click
chrome.runtime.onMessage.addListener(function(request) {
  if (request.message === "start") {
    run();
  }
});

function run() {
  // exons is wrapped set of each exon element
  let exons = $(".bg2 .text_sequence.exon_sequence");
  // Array of exon strings
  let exonsText = [];
  exons.each(function() {
    exonsText.push(this.textContent.trim().replace(/(\r\n|\n|\r)/gm, ""));
  })

  tempExons = ["", "TAAAAAAGCTGAGTGAAGACAGTTTGA", "CTAAGCAGCCTGAAGAAGTTTTTGATGTACTGGAG"]

  chrome.runtime.sendMessage({message: "calculate", exons: exonsText});
}

// TODO
// Determines if current site is ensembl site with exons
function isValidSite() {
  return true;
}
