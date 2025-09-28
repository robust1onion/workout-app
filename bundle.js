(() => {
  // src/state.js
  var d = /* @__PURE__ */ new Date();
  var day = (d.getDay() + 6) % 7;
  var week = 1;
  var DOMelements = {
    sideBar: document.getElementById("sideBar"),
    table: document.getElementById("workoutTableBody"),
    form: document.getElementById("workoutForm"),
    save: document.getElementById("save"),
    add: document.getElementById("addButton"),
    weekIdentifier: document.getElementById("weekIdentifier"),
    content: document.getElementById("content"),
    weekInfo: document.getElementById("weekInfo"),
    weekLeft: document.getElementById("centerL"),
    weekRight: document.getElementById("centerR")
  };
  var currentState = {
    currentDay: day,
    currentWeek: week
  };
  var arrays = {
    weekNames: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    workouts: {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: []
    },
    weeklyLogs: {}
  };

  // src/editWorkout.js
  function add() {
    let exerciseInput = document.getElementById("exercise").value;
    let setsInput = document.getElementById("sets").value;
    let repsInput = document.getElementById("reps").value;
    if (exerciseInput == "" || setsInput == "" || repsInput == "") {
      return;
    }
    let newRow = { exercise: exerciseInput, sets: setsInput, reps: repsInput };
    arrays.workouts[currentState.currentDay].push(newRow);
    render();
  }
  function changeDay(newDay) {
    currentState.currentDay = newDay;
    render();
  }

  // src/historyLogic.js
  DOMelements.weekLeft.addEventListener("click", () => {
    moveWeeks(-1);
  });
  DOMelements.weekRight.addEventListener("click", () => {
    moveWeeks(1);
  });
  document.addEventListener("change", (event) => {
    const el = event.target;
    if (!el.id.startsWith("input-")) return;
    const [, week2, day2, exerciseIndex, setIndex, field] = el.id.split("-");
    const value = el.value.trim();
    arrays.weeklyLogs[week2][day2][exerciseIndex][field][setIndex] = value === "" ? null : Number(value);
    console.log(arrays.weeklyLogs);
  });
  function fillEmptyWeek() {
    if (arrays.weeklyLogs[currentState.currentWeek]) return;
    arrays.weeklyLogs[currentState.currentWeek] = {};
    for (let day2 = 0; day2 < 7; day2++) {
      arrays.weeklyLogs[currentState.currentWeek][day2] = arrays.workouts[day2].map((ex) => ({
        exercise: ex.exercise,
        sets: ex.sets,
        plannedReps: ex.reps,
        reps: Array(ex.sets).fill(null),
        weight: Array(ex.sets).fill(null)
      }));
    }
  }
  function overrideEmptyWeeks() {
    if (!arrays.weeklyLogs[currentState.currentWeek]) {
      arrays.weeklyLogs[currentState.currentWeek] = {};
    }
    for (let day2 = 0; day2 < 7; day2++) {
      let dayExercises = arrays.weeklyLogs[currentState.currentWeek][day2];
      let isEmptyDay = true;
      if (dayExercises && dayExercises.length > 0) {
        isEmptyDay = dayExercises.every(
          (ex) => ex.reps.every((r) => r === null) && ex.weight.every((w) => w === null)
        );
      }
      if (!dayExercises || dayExercises.length === 0 || isEmptyDay) {
        arrays.weeklyLogs[currentState.currentWeek][day2] = arrays.workouts[day2].map((ex) => ({
          exercise: ex.exercise,
          sets: ex.sets,
          plannedReps: ex.reps,
          reps: Array(ex.sets).fill(null),
          weight: Array(ex.sets).fill(null)
        }));
      }
    }
  }
  function moveWeeks(dir) {
    currentState.currentWeek += dir;
    if (currentState.currentWeek < 1) {
      currentState.currentWeek -= dir;
    }
    render();
  }

  // src/renderDocument.js
  function renderSideBar() {
    DOMelements.sideBar.innerHTML = "";
    for (let i = 0; i < 7; i++) {
      let sideBarButton = document.createElement("button");
      sideBarButton.textContent = arrays.weekNames[i];
      sideBarButton.classList.add("day-btn");
      if (currentState.currentDay == i) {
        sideBarButton.classList.add("active");
      }
      sideBarButton.addEventListener("click", () => {
        changeDay(i);
      });
      DOMelements.sideBar.appendChild(sideBarButton);
    }
  }
  function renderTable() {
    DOMelements.table.innerHTML = "";
    let draggedIndex = null;
    arrays.workouts[currentState.currentDay].forEach((element, index) => {
      const row = DOMelements.table.insertRow();
      row.setAttribute("draggable", true);
      row.insertCell().textContent = element.exercise;
      row.insertCell().textContent = element.sets;
      row.insertCell().textContent = element.reps;
      const removeCell = row.insertCell();
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "-";
      removeBtn.classList.add("remove");
      removeBtn.addEventListener("click", () => {
        arrays.workouts[currentState.currentDay].splice(index, 1);
        renderTable();
      });
      removeCell.appendChild(removeBtn);
      row.addEventListener("dragstart", () => {
        draggedIndex = index;
        row.classList.add("dragging");
      });
      row.addEventListener("dragover", (event) => {
        event.preventDefault();
        row.classList.add("drop-target");
      });
      row.addEventListener("dragleave", () => {
        row.classList.remove("drop-target");
      });
      row.addEventListener("drop", () => {
        const temp = arrays.workouts[currentState.currentDay][draggedIndex];
        arrays.workouts[currentState.currentDay].splice(draggedIndex, 1);
        arrays.workouts[currentState.currentDay].splice(index, 0, temp);
        render();
      });
      row.addEventListener("dragend", () => {
        document.querySelectorAll(".drop-target").forEach((r) => r.classList.remove("drop-target"));
        document.querySelectorAll(".dragging").forEach((r) => r.classList.remove("dragging"));
      });
    });
  }
  function renderHistory() {
    const container = DOMelements.content;
    container.innerHTML = "";
    const dayIndex = currentState.currentDay;
    DOMelements.weekIdentifier.textContent = "Week " + currentState.currentWeek;
    if (arrays.workouts[currentState.currentDay].length === 0) {
      container.style.display = "none";
      return;
    } else {
      container.style.display = "block";
    }
    fillEmptyWeek();
    overrideEmptyWeeks();
    const week2 = currentState.currentWeek;
    const dayName = arrays.weekNames[dayIndex];
    const dayExercises = arrays.weeklyLogs[week2][dayIndex] || [];
    const h1 = document.createElement("h1");
    h1.id = "center";
    h1.textContent = dayName;
    container.appendChild(h1);
    dayExercises.forEach((exerciseObj, exerciseIndex) => {
      const h2 = document.createElement("h2");
      h2.textContent = exerciseObj.exercise + ":";
      h2.classList.add("spacing");
      container.appendChild(h2);
      for (let set = 0; set < exerciseObj.sets; set++) {
        const h3 = document.createElement("h3");
        h3.textContent = `Set ${set + 1}:`;
        h3.classList.add("spacingLess");
        container.appendChild(h3);
        const repsInput = document.createElement("input");
        repsInput.type = "number";
        repsInput.min = 0;
        repsInput.placeholder = "reps";
        repsInput.id = `input-${currentState.currentWeek}-${currentState.currentDay}-${exerciseIndex}-${set}-reps`;
        repsInput.value = exerciseObj.reps[set] ?? "";
        repsInput.addEventListener("input", (e) => {
          exerciseObj.reps[set] = e.target.valueAsNumber;
        });
        container.appendChild(repsInput);
        const divUnit = document.createElement("div");
        divUnit.classList.add("input-with-unit");
        const weightInput = document.createElement("input");
        weightInput.type = "number";
        weightInput.min = 0;
        weightInput.placeholder = "weight";
        weightInput.id = `input-${currentState.currentWeek}-${currentState.currentDay}-${exerciseIndex}-${set}-weight`;
        weightInput.value = exerciseObj.weight[set] ?? "";
        weightInput.addEventListener("input", (e) => {
          exerciseObj.weight[set] = e.target.valueAsNumber;
        });
        divUnit.appendChild(weightInput);
        container.appendChild(divUnit);
      }
    });
  }
  function render() {
    renderSideBar();
    renderTable();
    renderHistory();
  }

  // src/save.js
  function save() {
    localStorage.setItem("workouts", JSON.stringify(arrays.workouts));
    localStorage.setItem("weeklyLogs", JSON.stringify(arrays.weeklyLogs));
  }
  function load() {
    const loadWorkouts = localStorage.getItem("workouts");
    const loadWeeklyLogs = localStorage.getItem("weeklyLogs");
    if (loadWorkouts) {
      arrays.workouts = JSON.parse(loadWorkouts);
    }
    if (loadWeeklyLogs) {
      arrays.weeklyLogs = JSON.parse(loadWeeklyLogs);
    }
  }

  // src/index.js
  DOMelements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    add();
  });
  DOMelements.save.addEventListener("click", () => {
    save();
  });
  load();
  render();
})();
