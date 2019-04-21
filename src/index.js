const fs = require('fs');
const fromXML = require('from-xml').fromXML;
const puppeteer = require('puppeteer');
const R = require('ramda');
const sass = require('node-sass');
const _ = require('lodash');

const filePath = process.argv[2];

const abilityNames = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];


function buildRuleDict(rawCharacter) {
  var rulesBlob = rawCharacter.D20Character.CharacterSheet.RulesElementTally;

  var elements = rulesBlob.RulesElement;
  var rulesDict = {};

  elements.forEach( (ruleElem) => {
    rulesDict[ruleElem["@charelem"]] = ruleElem;
  });

  return rulesDict;
}

function getByAlias(list, aliasVal) {
  return list.filter((item) => {
    const aliases = item.alias;

    if (Array.isArray(aliases)) {
      return aliases.map(
        (alias) => alias["@name"].toLowerCase() == aliasVal
      ).reduce(R.or, false)
      
    } else {
      return aliases["@name"].toLowerCase() == aliasVal;
    }
  });
}

function getOneByAlias(list, aliasVal) {
  return getByAlias(list, aliasVal)[0];
}

function buildAbilityRecord(ruleDict, char) {

  const record = {}
  const stats = char.CharacterSheet.StatBlock.Stat;

  abilityNames.forEach((ability) => {
    record[ability] = {
      score: +getOneByAlias(stats,ability)["@value"],
      modifier: +getOneByAlias(stats,ability + " modifier")["@value"],
    }
    // record[ability].score = +getOneByAlias(stats,ability)["@value"];
    // record[ability].modifier = +getOneByAlias(stats,ability + " modifier")["@value"];
  });

  return record
}

function buildCharacterRecord(rawCharacter) {
  const ruleDict = buildRuleDict(rawCharacter); 
  let char = rawCharacter.D20Character;
  return {
    name: char.CharacterSheet.Details.name,
    player: char.CharacterSheet.Details.Player,
    height: char.CharacterSheet.Details.Height,
    weight: char.CharacterSheet.Details.Weight,
    gender: char.CharacterSheet.Details.Gender,
    age: char.CharacterSheet.Details.Age,
    alignment: char.CharacterSheet.Details.Alignment,
    company: char.CharacterSheet.Details.Company,
    xp: char.CharacterSheet.Details.Experience,
    level: parseInt(char.CharacterSheet.Details.Level),
    abilities: buildAbilityRecord(ruleDict, char),
    // halfLevel: Math.floor(parseInt(char.CharacterSheet.Details.Level) / 2),
  }
}

function generateSheetHtml(charData) {
  // I may not have to include CSS since it's being auto-added
  // render the pug file and compile the css here.
  return "<div>\"Hello Faerun!\"</div>"
}

async function processCharHtml(charData) {
  console.log(charData);

  // const styles = sass.renderSync({
  //   file: "./src/sheet/style.scss"
  // });
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const pdfFileName = charData.name.toLowerCase().replace(" ", "_");
  const pageContent = generateSheetHtml(charData);
  await page.setContent(pageContent);
  await page.pdf(
    { path: "./" + pdfFileName + ".pdf",
      landscape: true,
      printBackground: true
    }
  );

  await browser.close();
}

async function processFileData(fileData) {
  const character = fromXML(fileData);
  const charData = buildCharacterRecord(character);
  const charName = character.D20Character.CharacterSheet.Details.name;
  // const characterHtml = CharProcessor.process(character);
  // console.log(characterHtml);
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
