chrome.runtime.onMessage.addListener(function(request) {
  if (request.message === "calculate") {
    calculate(request.exons);
  }
});

// Finds all potential pairs of primers and corresponding
// properties and scores
function calculate(exons) {
  let primers = [];
  exons.forEach(function (exon, index) {
    primers.push([]);
    for (let l = 0; l < exon.length - 18; l++) {
      for (let r = l + 18; r < Math.min(exon.length, l + 25); r++) {
        // Forward primer string
        let fPrimer = exon.substring(l, r);
        // Array of reverse primer strings
        let rPrimers = getReverse(exons, fPrimer, index, l, r);
        // Array of corresponding properties of fPrimer-rPrimer pairs
        let properties = getProperties(fPrimer, rPrimers);
        // Array of corresponding scores of fPrimer-rPrimer pairs
        let scores = getScores(fPrimer, rPrimers, properties);
        let primer = {
          forward: fPrimer,
          reverse: rPrimers,
          properties: properties,
          scores: scores
        }
        primers[index].push(primer);
      }
    }
  });
  console.log(primers);
}

// TODO
// Finds potential reverse primers given forward primer
function getReverse(exons, fPrimer, index, l, r) {
  return [];
}

// TODO
function getProperties(fPrimer, rPrimers) {
  let allProps = [];
  rPrimers.forEach(function(rPrimer, index) {
    let properties = {
      isSelfComp: false,
      isHairpin: false,
    }
    allProps.push(properties);
  });
  return allProps;
}

// TODO
function getScores(fPrimer, rPrimers, properties) {
  allScores = [];
  rPrimers.forEach(function(rPrimer, index) {
    let scores = {
      valid: false,
      gcContent: 0,
      meltTemp: 0,
      gcEndpoints: 0
    }
    allScores.push(scores);
  })
  return allScores;
}
