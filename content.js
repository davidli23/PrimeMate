// Event listener for popup start button click
chrome.runtime.onMessage.addListener(function(request) {
  if (request.message === "start") {
    run();
  }
});

function run() {
  // exons is wrapped set of each exon element
  let exons = $(".bg2 .text_sequence.exon_sequence");
  console.log(exons);
}

// TODO: determines if current site is ensembl site with exons
function isValidSite() {
  return true;
}
