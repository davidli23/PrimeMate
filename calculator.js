const minLen = 18;
const maxLen = 24;
const minDist = 30;
const maxDist = 90;
const NaConc = 0.05;
const weights = {
  tempDiff: 20,
  indMeltTemp: 20,
  indGCContent: 20,
  dist: 20,
  startGC: 20
};
const dimerThresh = 5;

// Finds all potential pairs of primers and corresponding
// properties and scores
function calculate(exons) {
  // 2D array of potential primer pairs
  let primerPairs = [];
  // Loop through each exon
  exons.forEach(function (exon, exonInd) {
    // Check if first or last exon
    if (1 <= exonInd && exonInd < exons.length - 1) {
      // Loop through each starting index, taking the best pair with that starting index
      for (let fLeft = Math.max(0, exon.length - maxDist - maxLen); fLeft <= exon.length - minLen; fLeft++) {
        let primerPair = bestPrimerPair(exons, exonInd, fLeft);
        if (primerPair != null) {
          primerPairs.push(primerPair);
        }
      }
    }
  });
  primerPairs.sort(function(p1, p2) {
    return p2.score - p1.score;
  });
  return primerPairs;
}

class PrimerPair {
  constructor(exons, exonInd, fLeft, fRight, rLeft, rRight) {
    this.exon = exonInd + 1;
    this.fPrimer = exons[exonInd].substring(fLeft, fRight);
    this.rPrimerOriginal = exons[exonInd+1].substring(rLeft, rRight);
    this.rPrimer = reverseComplement(this.rPrimerOriginal);
    this.fGCATContent = this.GCATContent(this.fPrimer);
    this.rGCATContent = this.GCATContent(this.rPrimer);
    this.fInd = fLeft;
    this.rInd = rLeft;
    this.fLen = fRight - fLeft;
    this.rLen = rRight - rLeft;
    this.fStartGC = this.startsGC(this.fPrimer);
    this.rStartGC = this.startsGC(this.rPrimerOriginal);
    this.fPercentGC = this.percentGC(this.fGCATContent);
    this.rPercentGC = this.percentGC(this.rGCATContent);;
    this.fMeltTemp = this.meltTemp(this.fGCATContent);
    this.rMeltTemp = this.meltTemp(this.rGCATContent);
    this.dist = exons[exonInd].length - fRight + rLeft;
    this.meltTempDiff = Math.abs(this.fMeltTemp - this.rMeltTemp);
    this.score = this.score();
  }

  GCATContent(primer) {
    let content = {
      total: 0,
      G: 0,
      C: 0,
      A: 0,
      T: 0
    }
    for (let base of primer) {
      content[base] += 1;
      content.total += 1
    }
    return content;
  }

  startsGC(primer) {
    return primer.substring(0, 2) == "GC" || primer.substring(0, 2) == "CG";
  }

  percentGC(content) {
    return 100 * (content.G + content.C) / content.total;
  }

  meltTemp(content) {
    return 100.5 + (41 * (content.G+content.C)/(content.A+content.T+content.G+content.C)) - (820/(content.A+content.T+content.G+content.C)) + 16.6*Math.log10(NaConc);
  }

  score() {
    let tempDiffScore = purity(this.meltTempDiff, 0, 10);
    let indMeltTempScore = (purity(this.fMeltTemp, 60, 10)+purity(this.rMeltTemp, 60, 10))/2;
    let indGCContentScore = 0;
    let distScore = purity(this.dist, 60, 30);
    let startsGCScore = 0;

    if (this.fPercentGC >= 40 && this.fPercentGC <= 60) {
      indGCContentScore += 0.5;
    }
    else {
      indGCContentScore += purity(Math.min(this.fPercentGC, 100 - this.fPercentGC), 40, 20)/2;
    }
    if (this.rPercentGC >= 40 && this.rPercentGC <= 60) {
      indGCContentScore += 0.5;
    }
    else {
      indGCContentScore += purity(Math.min(this.rPercentGC, 100 - this.rPercentGC), 40, 20)/2;
    }

    if (this.fStartGC) {
      startsGCScore += 0.5;
    }
    if (this.rStartGC) {
      startsGCScore += 0.5;
    }

    return weights.tempDiff*tempDiffScore
    + weights.indMeltTemp*indMeltTempScore
    + weights.indGCContent*indGCContentScore
    + weights.dist*distScore
    + weights.startGC*startsGCScore
  }
}

function purity(value, ideal, bound) {
  SD = bound / 2
  return Math.exp(-0.5*Math.pow((value-ideal)/SD, 2));
}

function bestPrimerPair(exons, exonInd, fLeft) {
  let bestPrimerPair = null;
  let bestScore = 0;

  // Loop through each possible primer pair
  for (let fRight = fLeft + minLen; fRight <= Math.min(exons[exonInd].length, fLeft + maxLen); fRight++) {
    let fPrimer = exons[exonInd].substring(fLeft, fRight);
    for (let rLeft = Math.max(0, minDist - (exons[exonInd].length - fRight)); rLeft < Math.min(exons[exonInd+1].length - minLen, maxDist - (exons[exonInd].length - fRight) + 1); rLeft++) {
      for (let rRight = rLeft + minLen; rRight <= Math.min(exons[exonInd+1].length, rLeft + maxLen); rRight++) {
        let rPrimer = reverseComplement(exons[exonInd+1].substring(rLeft, rRight));
        let primerPair = new PrimerPair(exons, exonInd, fLeft, fRight, rLeft, rRight);
        if (primerPair.score > bestScore) {
          bestPrimerPair = primerPair;
          bestScore = primerPair.score;
        }
      }
    }
  }
  return bestPrimerPair;
}

function reverseComplement(primer) {
  let arr = new Array(primer.length)
  for (let i = 0; i < primer.length; i++) {
    switch(primer.substring(i, i+1)) {
      case "C":
        arr[primer.length - 1 - i] = "G";
        break;
      case "G":
        arr[primer.length - 1 - i] = "C";
        break;
      case "A":
        arr[primer.length - 1 - i] = "T";
        break;
      case "T":
        arr[primer.length - 1 - i] = "A";
        break;
    }
  }
  return arr.join("");
}

function complementary(b1, b2) {
  return (b1=="C"&&b2=="G")||(b1=="G"&&b2=="C")||(b1=="A"&&b2=="T")||(b1=="T"&&b2=="A");
}

function isDimer(fPrimer, rPrimer) {
  for (let lInd = 0; lInd <= fPrimer.length - dimerThresh; lInd++) {
    for (let rInd = 0; rInd <= rPrimer.length-dimerThresh; rInd++) {
      let notOk = true;
      for (let i = 0; i < dimerThresh; i++) {
        if (!complementary(fPrimer.substring(lInd+i, lInd+i+1), rPrimer.substring(rInd+i, rInd+i+1))) {
          notOk = false;
          break;
        }
      }
      if (notOk) {
        return true;
      }
    }
  }
  return false;
}

function hasHairpin(primer) {
  for (let lInd = 0; lInd <= primer.length - 2*dimerThresh; lInd++) {
    for (let rInd = lInd+dimerThresh; rInd <= primer.length-dimerThresh; rInd++) {
      let isHairpin = true;
      for (let i = 0; i < dimerThresh; i++) {
        if (!complementary(primer.substring(lInd+i, lInd+i+1), primer.substring(rInd+dimerThresh-i-1,rInd+dimerThresh-i))) {
          isHairpin = false;
          break;
        }
      }
      if (isHairpin) {
        return true;
      }
    }
  }
  return false;
}
