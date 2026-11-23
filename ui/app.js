// ===== MindGuard - script for all pages =====

// Change this to your ML model link (Flask server)
var API_URL = "http://127.0.0.1:5000/predict";

// Find out which page we are on (set in the <body> tag of each page)
var page = document.body.getAttribute("data-page");


// ===== Loading page =====
function startLoading() {
  var bar = document.getElementById("bar");
  var percentText = document.getElementById("pct");
  var value = 0;

  var timer = setInterval(function () {
    value = value + Math.random() * 4 + 1;

    if (value >= 100) {
      value = 100;
      clearInterval(timer);
      setTimeout(function () {
        window.location.href = "home.html";
      }, 400);
    }

    bar.style.width = value + "%";
    percentText.innerHTML = Math.floor(value) + "%";
  }, 80);
}


// ===== Home page =====
function startHome() {
  var modal = document.getElementById("modal");
  var learnMoreBtn = document.getElementById("learnMore");
  var closeBtn = document.getElementById("closeModal");

  // Open the popup
  learnMoreBtn.onclick = function () {
    modal.classList.add("open");
  };

  // Close the popup with the button
  closeBtn.onclick = function () {
    modal.classList.remove("open");
  };

  // Close the popup when clicking outside the box
  modal.onclick = function (event) {
    if (event.target == modal) {
      modal.classList.remove("open");
    }
  };

  startHabits();
}


// ===== Habit picker (home page) =====
var habitChecks = [
  "Sleep hours and screen time before bed.",
  "Notifications and app opens per day.",
  "Sleep hours and how stress builds up.",
  "Social media hours and weekend screen time."
];

var habitHelps = [
  "Keep screens out of the last 30 minutes of your day.",
  "Mute the apps you don't need and check in batches.",
  "Pick a fixed bedtime and charge your phone away from bed.",
  "Set a daily limit and plan one offline activity."
];

function showHabit(k) {
  var chips = document.getElementsByClassName("habit-chip");

  document.getElementById("habitCheck").innerHTML = habitChecks[k];
  document.getElementById("habitHelp").innerHTML = habitHelps[k];

  // Highlight only the chosen button
  for (var i = 0; i < chips.length; i++) {
    if (i == k) {
      chips[i].className = "habit-chip active";
    } else {
      chips[i].className = "habit-chip";
    }
  }
}

function startHabits() {
  var chips = document.getElementsByClassName("habit-chip");

  for (var i = 0; i < chips.length; i++) {
    chips[i].onclick = function () {
      var number = Number(this.getAttribute("data-k"));
      showHabit(number);
    };
  }

  showHabit(0);
}


// ===== Prediction page =====

// Ready-made values for the 4 buttons at the top
var presets = {
  student: { age: 20, gender: "Male", screen: 7.5, social: 3.5, gaming: 1.5, work: 4, notifications: 120, sleep: 6.5, stress: "Moderate", opens: 85, impact: "Moderate", weekend: 9 },
  professional: { age: 32, gender: "Female", screen: 4, social: 1, gaming: 0.5, work: 8, notifications: 60, sleep: 7.5, stress: "Low", opens: 40, impact: "Low", weekend: 4 },
  gamer: { age: 24, gender: "Male", screen: 8, social: 2, gaming: 4, work: 3, notifications: 80, sleep: 6, stress: "Moderate", opens: 70, impact: "Moderate", weekend: 11 },
  detox: { age: 27, gender: "Female", screen: 2, social: 0.5, gaming: 0, work: 6, notifications: 20, sleep: 8, stress: "Low", opens: 20, impact: "Low", weekend: 2 }
};

// Show the slider numbers in the small boxes
function updateNumbers() {
  var ids = ["age", "screen", "social", "gaming", "work", "notifications", "sleep", "opens", "weekend"];

  for (var i = 0; i < ids.length; i++) {
    var slider = document.getElementById(ids[i]);
    var box = document.getElementById(ids[i] + "Val");
    box.innerHTML = slider.value;
  }
}

// Put the values of a preset into the form
function fillForm(values) {
  for (var key in values) {
    var field = document.getElementById(key);
    if (field) {
      field.value = values[key];
    }
  }
  updateNumbers();
}

// Read all the values from the form
function getValue(id) {
  return document.getElementById(id).value;
}

function collectForm() {
  var data = {
    age: Number(getValue("age")),
    gender: getValue("gender"),
    screen: Number(getValue("screen")),
    social: Number(getValue("social")),
    gaming: Number(getValue("gaming")),
    work: Number(getValue("work")),
    notifications: Number(getValue("notifications")),
    sleep: Number(getValue("sleep")),
    stress: getValue("stress"),
    opens: Number(getValue("opens")),
    impact: getValue("impact"),
    weekend: Number(getValue("weekend"))
  };
  return data;
}

// Simple formula used when the ML server is not running
function fallbackPredict(d) {
  var score = 0;

  score = score + Math.min(d.screen / 12, 1) * 30;
  score = score + Math.min(d.social / 8, 1) * 15;
  score = score + Math.min(d.gaming / 6, 1) * 10;
  score = score + Math.min(d.notifications / 200, 1) * 10;
  score = score + Math.min(d.opens / 150, 1) * 10;
  score = score + Math.max(0, (7 - d.sleep) / 4) * 10;

  if (d.stress == "Moderate") {
    score = score + 5;
  }
  if (d.stress == "High") {
    score = score + 10;
  }

  if (d.impact == "Moderate") {
    score = score + 3;
  }
  if (d.impact == "High") {
    score = score + 5;
  }

  score = Math.min(Math.round(score), 100);

  var risk = "Low";
  if (score >= 65) {
    risk = "High";
  } else if (score >= 35) {
    risk = "Moderate";
  }

  var label = 0;
  if (score >= 35) {
    label = 1;
  }

  return { label: label, risk: risk, probability: score / 100 };
}

// Save the result and open the result page
function saveAndGo(input, result) {
  sessionStorage.setItem("mg_input", JSON.stringify(input));
  sessionStorage.setItem("mg_result", JSON.stringify(result));
  window.location.href = "result.html";
}

// Send the data to the ML model
function runPrediction(input) {
  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
    .then(function (response) {
      if (response.ok == false) {
        throw "Server error";
      }
      return response.json();
    })
    .then(function (result) {
      // The ML model answered: { label, risk, probability }
      saveAndGo(input, result);
    })
    .catch(function () {
      // The ML model is not running, so use the simple formula
      var result = fallbackPredict(input);
      saveAndGo(input, result);
    });
}

function startPredict() {
  // Update the small number boxes when a slider moves
  var sliders = document.querySelectorAll('input[type="range"]');
  for (var i = 0; i < sliders.length; i++) {
    sliders[i].oninput = updateNumbers;
  }

  // The 4 preset buttons
  var presetButtons = document.getElementsByClassName("preset");
  for (var j = 0; j < presetButtons.length; j++) {
    presetButtons[j].onclick = function () {
      for (var k = 0; k < presetButtons.length; k++) {
        presetButtons[k].classList.remove("active");
      }
      this.classList.add("active");
      fillForm(presets[this.getAttribute("data-preset")]);
    };
  }

  // Start with the student values
  fillForm(presets.student);

  // The Predict button
  var predictBtn = document.getElementById("predictBtn");
  predictBtn.onclick = function () {
    predictBtn.disabled = true;
    predictBtn.innerHTML = "Analyzing...";
    var input = collectForm();
    runPrediction(input);
  };
}


// ===== Result page =====

// Text points shown under "Key Insights"
function buildInsights(input) {
  var insights = [];

  if (input.screen > 6) {
    insights.push("Your daily screen time is higher than average.");
  }
  if (input.social > 3) {
    insights.push("Consider reducing social media and gaming hours.");
  }
  if (input.sleep < 7) {
    insights.push("Your sleep is below the recommended 7-8 hours.");
  }
  if (input.notifications > 100) {
    insights.push("A high number of notifications keeps pulling your attention.");
  }
  insights.push("Maintain a healthy balance with offline activities.");

  return insights.slice(0, 4);
}

// Text points shown under "Recommended Actions"
function buildActions(input) {
  var actions = [];

  if (input.screen > 6) {
    actions.push("Limit screen time to < 6 hours/day");
  }
  actions.push("Take regular breaks");
  if (input.sleep < 7) {
    actions.push("Improve sleep schedule");
  }
  if (input.notifications > 100) {
    actions.push("Mute non-essential notifications");
  }

  return actions.slice(0, 4);
}

// Put a list of text points into a <ul>
function fillList(id, items) {
  var list = document.getElementById(id);
  list.innerHTML = "";

  for (var i = 0; i < items.length; i++) {
    var li = document.createElement("li");
    li.innerHTML = items[i];
    list.appendChild(li);
  }
}

function startResult() {
  var result = JSON.parse(sessionStorage.getItem("mg_result"));
  var input = JSON.parse(sessionStorage.getItem("mg_input"));

  // If there is no data, go back to the prediction page
  if (result == null || input == null) {
    window.location.href = "predict.html";
    return;
  }

  var risk = result.risk;

  var probability = result.probability;
  if (probability === undefined) {
    probability = 0.5;
  }
  var percent = Math.round(probability * 100);

  // Ring color for each risk level
  var ringColor = "#f59e0b";
  if (risk == "Low") {
    ringColor = "#22c55e";
  }
  if (risk == "High") {
    ringColor = "#ef4444";
  }

  var gauge = document.getElementById("gauge");
  gauge.style.background = "conic-gradient(" + ringColor + " " + percent + "%, #e5e9f7 0)";

  document.getElementById("riskText").innerHTML = risk + "<br>Risk";

  var pill = document.getElementById("levelPill");
  pill.innerHTML = "Addiction Level: " + risk;
  pill.className = "level-pill " + risk.toLowerCase();

  document.getElementById("labelNum").innerHTML = result.label;

  if (result.label == 1) {
    document.getElementById("labelText").innerHTML = "(Addicted)";
  } else {
    document.getElementById("labelText").innerHTML = "(Not Addicted)";
  }

  document.getElementById("confidence").innerHTML = "Model confidence: " + percent + "%";

  fillList("insights", buildInsights(input));
  fillList("actions", buildActions(input));
}


// ===== Start the right code for each page =====
window.onload = function () {
  if (page == "loading") {
    startLoading();
  }
  if (page == "home") {
    startHome();
  }
  if (page == "predict") {
    startPredict();
  }
  if (page == "result") {
    startResult();
  }
};