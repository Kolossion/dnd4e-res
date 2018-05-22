const fs = require('fs');
const fromXML = require('from-xml').fromXML;
const puppeteer = require('puppeteer');

const filePath = process.argv[2];


function replaceSpacesWithUnderscores(string) {
  string.replace(" ", "_");
}

function buildRuleDict(rawCharacter) {
  var rulesBlob = rawCharacter.D20Character.CharacterSheet.RulesElementTally;

  var elements = rulesBlob.RulesElement;
  var rulesDict = {};

  elements.forEach( (ruleElem) => {
    rulesDict[ruleElem["@charelem"]] = ruleElem
  });

  console.log(rulesDict);
}

function buildCharacterRecord(rawCharacter) {
  const ruleDict = buildRuleDict(rawCharacter); 
  let char = rawCharacter.D20Character;
  return {
    name: char.CharacterSheet.Details.name,
    level: parseInt(char.CharacterSheet.Details.Level),
    halfLevel: Math.floor(parseInt(char.CharacterSheet.Details.Level) / 2),
  }
}

async function processCharHtml(charData) {
  console.log(charData);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent("<div>\"Hello World!\"</div>");
  await page.pdf(
    { path: "./" + replaceSpacesWithUnderscores(charData.name.toLowerCase()) + ".pdf",
      landscape: true,
      printBackground: true
    }
  );

  await browser.close();
}

async function processFileData(fileData) {
  const character = fromXML(fileData);
  const charData = buildCharacterRecord(character);
  // const charName = character.D20Character.CharacterSheet.Details.name;
  // const characterHtml = CharProcessor.process(character);
  await processCharHtml(charData);
}

fs.readFile(process.argv[2], "utf8", async (err, data) => {
  if (err != null) {
    console.log(err);
    process.exit();
  } else {
    await processFileData(data);
  }
});
