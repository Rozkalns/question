const converter = new showdown.Converter();
const reloadButton = document.querySelector( '.reload' );
const reloadSvg = document.querySelector( 'svg' );
const question = document.getElementById('question');
const support = document.querySelector('.support .btn');
const links = document.querySelector('.links');
let lesson = '';
let sheet = {};

const mapping = {
  'interview12': {
    'gid': 165972876,
    'ejuz' : 'g4et'
  }, // grade 12, 10/60
  'monologue12': {
    'gid': 606603779,
    'ejuz' : 'i5gp'
  } , // grade 12 120/300
  'dialogue9': {
    'gid': 361983600,
    'ejuz' : 'pzzm'
  }, // grade 9 60/420
  'interview9': {
    'gid': 1311882750,
    'ejuz' : 'y2ex'
  }, // grade 10/60
  'words': {
    'type': 'randomTwo',
    'gid': 1863447477,
    'range': 'A2:A',
    'ejuz' : null
  }, // grade 10/60
}

let array = [];
let rotation = 0;

// Functions
Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

String.prototype.unquoted = function () {
  return this.replace (/(^")|("$)/g, '');
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1)
}

function reload() {
  reloadClick();
  pause(200).then(write);
}

function reloadClick() {
  rotation -= 180;

  reloadSvg.style.webkitTransform = 'translateZ(0px) rotateZ( ' + rotation + 'deg )';
  reloadSvg.style.MozTransform  = 'translateZ(0px) rotateZ( ' + rotation + 'deg )';
  reloadSvg.style.transform  = 'translateZ(0px) rotateZ( ' + rotation + 'deg )';
  
  question.style.opacity = '0';
}

function fetchClass() {
  if (hash()) {
    question.innerText = '🔭';
    question.classList.add(lesson = hash() || 'home');
    fetchItem(sheet = mapping[lesson]);

    links.style.display = 'none';
    links.innerHTML = '';
  } else {
    question.innerText = 'Questions Lake';
    makeLinks();
  }
}

function fetchItem(sheet) {
  if (sheet === null || typeof sheet !== 'object') {
    question.innerHTML = 'Izvēlies klasi...';
    return;
  }

  let url = `https://docs.google.com/spreadsheets/d/1C8wqEI2iXL50fE3CwU5VDS_FZbvOeFy8UwQuhKD7jaQ/export?exportFormat=csv&single=true`;
  url += sheet.hasOwnProperty('gid') ? `&gid=${sheet.gid}` : '';
  url += sheet.hasOwnProperty('range') ? `&range=${sheet.range}` : '';

  fetch(url).then(function(response){
      return response.text();
    })
    .then(function(text){
      array = text.match(/[^\r\n]+/g).map(t => t.unquoted());
      write();
    })
    .catch(function(err){
      console.log(err);  
    });
}

function write() {
  let text = '';
  if (!array.length) {
    text = 'te nekā nav...'
  } else {
    let type = 'standard';
    if (sheet.hasOwnProperty('type')) {
      type = sheet.type;
    }

    switch(type) {
      case 'randomTwo':
        text = pickRandomWords(2);
        break;
      case 'standard':
      default:
        text = pickText();
        break;
    }
  }
  
  question.style.opacity = '1';
  question.innerHTML = text;
}

function makeLinks() {
  if (!hash()) {
    Object.keys(mapping).forEach(function (key) {
      const item = mapping[key];
      const human = key.match(/\d+|\D+/g).map(i => i.capitalize()).join(' ');
      const short = item.ejuz && `https://ej.uz/${item.ejuz}`;

      let copy = document.createElement('span');
      if (short) {
        copy.innerText = '🔗';
        copy.classList.add('copy');

        copy.addEventListener('click', (e) => {
          copyToClipboard(short)
          successCopy(e.target);
        });
      }

      let box = document.createElement('div');
      box.innerHTML = `
        <a href="#${key}" class="title">${human}</a><br>
        ${short || ''} 
      `

      box.append(copy);
      links.append(box)
    });

    links.style.display = 'block';
  }
}

function hash() {
  return window.location.hash.replace(/^#/, '');
}

function qs(param) {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  return urlParams.get(param)
}

function pickRandomWords(words) {
  const wordCount = array.length;
  let indexes = [];
  for (let i = 0; words > i; i++) {
    indexes.push(Math.floor(Math.random() * wordCount));
  }
  return indexes.map(i => array[i]).join(' ');
}

function pickText() {
  if (!hash()) {
    return;
  }

  const topics = array.filter(t => t.length && t.toUpperCase() === t);
  const questions = array.diff(topics);
  const randomQuestionIndex =  Math.floor(Math.random() * questions.length)
  
  let pickedLine = questions[randomQuestionIndex];
  if (hash() === 'dialogue9') {
    pickedLine = pickedLine.replace(/\s\u2022\s/g, "\n- ");
  }

  if (topics.length) {
    const lookupPart = array.slice(0,array.indexOf(pickedLine)).reverse();
    const topicIndex = lookupPart.findIndex(isTopicName);
    const topic = lookupPart[topicIndex];

    pickedLine =  `**${topic.trim()}**<br>${pickedLine.trim()}`;
  }

  if (pickedLine.length > 700) {
    pickedLine += '<div class="breathe"></div>'
  }

  return converter.makeHtml(pickedLine);
}

function successCopy(el) {
  let ok = document.createElement('span');
  ok.innerText = "👍 copied";
  ok.style.fontSize = '1em';

  el.after(ok);

  pause(1200).then(() => {
    ok.remove();
  });

}

const copyToClipboard = str => {
  const el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

const pause = time => new Promise(resolve => setTimeout(resolve, time))
const isTopicName = t => t.toUpperCase() === t;

// Events
fetchClass();
window.addEventListener("hashchange", fetchClass, false);
reloadButton.addEventListener('click', reload);
support.addEventListener('click', (el) => {
    el.target.classList.add('expand')
    pause(7.5 * 1000).then(() => el.target.classList.remove('expand'))
});

// Show button.
pause(1).then(() => reloadButton.classList.add('active'));
