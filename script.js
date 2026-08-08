const API_BASE_URL = "https://classifying-nyc-house-types-srqn.onrender.com";
const PREDICT_ENDPOINT = `${API_BASE_URL}/predict`;
const HEALTH_ENDPOINT = `${API_BASE_URL}/`;

const REDUCE_MOTION = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;


// ============================================================
// ROOM CLASSES
// ============================================================

const ROOM_CLASSES = [
  {
    key: "Entire home/apt",
    label: "Entire home/apt",
    rows: 6,
    cols: 2,
    height: "100%",
  },
  {
    key: "Private room",
    label: "Private room",
    rows: 4,
    cols: 2,
    height: "68%",
  },
  {
    key: "Shared room",
    label: "Shared room",
    rows: 2,
    cols: 2,
    height: "42%",
  },
];


// ============================================================
// EXAMPLE DATA
// ============================================================

const EXAMPLES = [
  {
    latitude: 40.7484,
    longitude: -73.9857,
    price: 120,
    minimum_nights: 2,
    number_of_reviews: 84,
    reviews_per_month: 2.3,
    calculated_host_listings_count: 1,
    availability_365: 210,
    neighbourhood_group: "Manhattan",
    neighbourhood: "Midtown",
  },

  {
    latitude: 40.6782,
    longitude: -73.9442,
    price: 55,
    minimum_nights: 1,
    number_of_reviews: 210,
    reviews_per_month: 4.1,
    calculated_host_listings_count: 3,
    availability_365: 300,
    neighbourhood_group: "Brooklyn",
    neighbourhood: "Bedford-Stuyvesant",
  },

  {
    latitude: 40.7282,
    longitude: -73.7949,
    price: 38,
    minimum_nights: 3,
    number_of_reviews: 12,
    reviews_per_month: 0.6,
    calculated_host_listings_count: 1,
    availability_365: 90,
    neighbourhood_group: "Queens",
    neighbourhood: "Flushing",
  },
];

let exampleIndex = 0;


// ============================================================
// AMBIENT SKYLINE WINDOW TWINKLE
// ============================================================

function buildSkylineLights() {
  const container = document.getElementById("skylineBg");

  if (!container || REDUCE_MOTION) return;

  const count = 42;

  for (let i = 0; i < count; i++) {
    const light = document.createElement("div");

    light.className = "window-light";

    const size = Math.random() < 0.5 ? 2 : 3;

    light.style.width = `${size}px`;
    light.style.height = `${size}px`;
    light.style.left = `${Math.random() * 100}%`;
    light.style.bottom = `${8 + Math.random() * 32}vh`;
    light.style.animationDelay = `${Math.random() * 5}s`;
    light.style.animationDuration = `${3.5 + Math.random() * 3}s`;

    container.appendChild(light);
  }
}


// ============================================================
// FORM ELEMENTS
// ============================================================

const form = document.getElementById("predictForm");
const predictBtn = document.getElementById("predictBtn");
const formError = document.getElementById("formError");

const availabilityInput =
  document.getElementById("availability_365");

const availabilityValue =
  document.getElementById("availabilityValue");

const exampleBtn =
  document.getElementById("exampleBtn");


// ============================================================
// AVAILABILITY RANGE
// ============================================================

if (availabilityInput && availabilityValue) {
  availabilityInput.addEventListener("input", () => {
    availabilityValue.textContent = availabilityInput.value;
  });
}


// ============================================================
// EXAMPLE BUTTON
// ============================================================

if (exampleBtn) {
  exampleBtn.addEventListener("click", () => {
    const data = EXAMPLES[exampleIndex % EXAMPLES.length];

    exampleIndex++;

    Object.entries(data).forEach(([key, value]) => {
      const el = form.elements[key];

      if (el) {
        el.value = value;
      }
    });

    if (availabilityValue) {
      availabilityValue.textContent = data.availability_365;
    }

    if (formError) {
      formError.textContent = "";
    }
  });
}


// ============================================================
// FORM SUBMIT
// ============================================================

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (formError) {
      formError.textContent = "";
    }

    if (!form.reportValidity()) {
      return;
    }

    const payload = collectPayload();

    console.log("Sending payload:", payload);

    setLoading(true);

    try {
      const res = await fetch(PREDICT_ENDPOINT, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });


      // --------------------------------------------------------
      // HANDLE HTTP ERRORS
      // --------------------------------------------------------

      if (!res.ok) {
        const body = await res.json().catch(() => null);

        throw new Error(
          body?.detail
            ? formatDetail(body.detail)
            : `Request failed (${res.status}).`
        );
      }


      // --------------------------------------------------------
      // GET API RESPONSE
      // --------------------------------------------------------

      const result = await res.json();


      // IMPORTANT:
      // This lets you see exactly what Render/FastAPI returns.
      console.log("=================================");
      console.log("API RESPONSE:");
      console.log(result);
      console.log("=================================");


      // --------------------------------------------------------
      // RENDER RESULT
      // --------------------------------------------------------

      renderResult(result);

    } catch (err) {
      console.error("Prediction error:", err);

      if (formError) {
        formError.textContent =
          err.message?.includes("fetch")
            ? "Can't reach the prediction API. Make sure the FastAPI server is running and reachable."
            : err.message ||
              "Something went wrong. Check the values and try again.";
      }

    } finally {
      setLoading(false);
    }
  });
}


// ============================================================
// COLLECT FORM PAYLOAD
// ============================================================

function collectPayload() {
  const fd = new FormData(form);

  return {
    latitude: parseFloat(fd.get("latitude")),

    longitude: parseFloat(fd.get("longitude")),

    price: parseFloat(fd.get("price")),

    minimum_nights: parseInt(
      fd.get("minimum_nights"),
      10
    ),

    number_of_reviews: parseInt(
      fd.get("number_of_reviews"),
      10
    ),

    reviews_per_month: parseFloat(
      fd.get("reviews_per_month")
    ),

    calculated_host_listings_count: parseInt(
      fd.get("calculated_host_listings_count"),
      10
    ),

    availability_365: parseInt(
      fd.get("availability_365"),
      10
    ),

    neighbourhood_group:
      fd.get("neighbourhood_group"),

    neighbourhood:
      fd.get("neighbourhood"),
  };
}


// ============================================================
// FORMAT FASTAPI ERROR
// ============================================================

function formatDetail(detail) {
  if (Array.isArray(detail)) {
    return detail
      .map((d) => d.msg || JSON.stringify(d))
      .join(" ");
  }

  return String(detail);
}


// ============================================================
// LOADING STATE
// ============================================================

function setLoading(isLoading) {
  if (!predictBtn) return;

  predictBtn.disabled = isLoading;

  predictBtn.classList.toggle(
    "loading",
    isLoading
  );
}


// ============================================================
// RESULT ELEMENTS
// ============================================================

const resultEmpty =
  document.getElementById("resultEmpty");

const resultContent =
  document.getElementById("resultContent");

const predictedName =
  document.getElementById("predictedName");

const buildingsRow =
  document.getElementById("buildingsRow");

const probList =
  document.getElementById("probList");


// ============================================================
// NORMALIZE PROBABILITY
// ============================================================

function normalizeProbability(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  // If backend gives 72 instead of 0.72
  if (number > 1) {
    return Math.min(number / 100, 1);
  }

  return Math.max(number, 0);
}


// ============================================================
// GET PREDICTION FROM API RESPONSE
// ============================================================

function getPredictedRoomType(result) {
  return (
    result?.Predicted_room_type ??
    result?.predicted_room_type ??
    result?.prediction ??
    result?.predicted ??
    result?.room_type ??
    result?.PredictedRoomType ??
    ""
  );
}


// ============================================================
// GET PROBABILITIES FROM API RESPONSE
// ============================================================

function getProbabilities(result) {

  // ----------------------------------------------------------
  // Possible array field names
  // ----------------------------------------------------------

  const probabilityArray =
    result?.Probability ??
    result?.probability ??
    result?.probabilities ??
    result?.Probabilities ??
    result?.probs;


  // ----------------------------------------------------------
  // If API returns:
  //
  // "Probability": [0.7, 0.2, 0.1]
  // ----------------------------------------------------------

  if (Array.isArray(probabilityArray)) {
    return ROOM_CLASSES.map((cls, index) => {
      return normalizeProbability(
        probabilityArray[index]
      );
    });
  }


  // ----------------------------------------------------------
  // If API returns:
  //
  // {
  //   "Entire home/apt": 0.7,
  //   "Private room": 0.2,
  //   "Shared room": 0.1
  // }
  // ----------------------------------------------------------

  if (
    probabilityArray &&
    typeof probabilityArray === "object"
  ) {
    return ROOM_CLASSES.map((cls) => {

      const value =
        probabilityArray[cls.key] ??
        probabilityArray[cls.label];

      return normalizeProbability(value);
    });
  }


  // ----------------------------------------------------------
  // Maybe probabilities are directly in the response
  // ----------------------------------------------------------

  const directObject =
    result?.probability ??
    result?.probabilities;

  if (
    directObject &&
    typeof directObject === "object" &&
    !Array.isArray(directObject)
  ) {
    return ROOM_CLASSES.map((cls) => {

      const value =
        directObject[cls.key] ??
        directObject[cls.label];

      return normalizeProbability(value);
    });
  }


  // ----------------------------------------------------------
  // Nothing found
  // ----------------------------------------------------------

  console.warn(
    "No probability field found in API response:",
    result
  );

  return ROOM_CLASSES.map(() => 0);
}


// ============================================================
// RENDER RESULT
// ============================================================

function renderResult(result) {

  console.log("Rendering result:", result);


  // ----------------------------------------------------------
  // GET PREDICTION
  // ----------------------------------------------------------

  const predicted =
    getPredictedRoomType(result);


  // ----------------------------------------------------------
  // GET PROBABILITIES
  // ----------------------------------------------------------

  const probabilities =
    getProbabilities(result);


  console.log("Predicted room:", predicted);

  console.log(
    "Probabilities:",
    probabilities
  );


  // ----------------------------------------------------------
  // PAIR CLASSES + PROBABILITIES
  // ----------------------------------------------------------

  const paired = ROOM_CLASSES.map(
    (cls, i) => ({
      ...cls,
      prob: probabilities[i] ?? 0,
    })
  );


  console.log(
    "Final paired result:",
    paired
  );


  // ----------------------------------------------------------
  // SHOW RESULT PANEL
  // ----------------------------------------------------------

  if (resultEmpty) {
    resultEmpty.hidden = true;
  }

  if (resultContent) {
    resultContent.hidden = false;
  }


  // ----------------------------------------------------------
  // SHOW PREDICTED NAME
  // ----------------------------------------------------------

  if (predictedName) {
    predictedName.textContent =
      predicted || "Unknown";
  }


  // ----------------------------------------------------------
  // BUILD VISUALIZATION
  // ----------------------------------------------------------

  buildBuildings(
    paired,
    predicted
  );


  // ----------------------------------------------------------
  // BUILD PROBABILITY LIST
  // ----------------------------------------------------------

  buildProbList(
    paired,
    predicted
  );
}


// ============================================================
// BUILD BUILDINGS
// ============================================================

function buildBuildings(
  paired,
  predicted
) {

  if (!buildingsRow) return;

  buildingsRow.innerHTML = "";


  paired.forEach((cls) => {

    const col =
      document.createElement("div");

    col.className =
      "building-col";


    // --------------------------------------------------------
    // BUILDING
    // --------------------------------------------------------

    const b =
      document.createElement("div");

    b.className =
      "building";

    b.style.setProperty(
      "--h",
      "18%"
    );


    // --------------------------------------------------------
    // WINDOWS
    // --------------------------------------------------------

    const totalWindows =
      cls.rows * cls.cols;

    const litCount =
      Math.round(
        totalWindows * cls.prob
      );


    for (
      let i = 0;
      i < totalWindows;
      i++
    ) {

      const win =
        document.createElement("div");

      win.className =
        "win";

      b.appendChild(win);
    }


    // --------------------------------------------------------
    // CAPTION
    // --------------------------------------------------------

    const caption =
      document.createElement("div");

    caption.className =
      "building-caption";

    caption.textContent =
      cls.label;


    col.appendChild(b);

    col.appendChild(caption);

    buildingsRow.appendChild(col);


    // --------------------------------------------------------
    // ANIMATION
    // --------------------------------------------------------

    requestAnimationFrame(() => {

      setTimeout(() => {

        b.style.setProperty(
          "--h",
          cls.height
        );


        const wins =
          b.querySelectorAll(".win");


        wins.forEach((w, i) => {

          if (i < litCount) {

            setTimeout(
              () => {
                // IMPORTANT:
                // Add "lit" to the WINDOW.
                w.classList.add("lit");
              },

              REDUCE_MOTION
                ? 0
                : 60 * i + 300
            );
          }
        });


        // Highlight predicted building

        if (cls.key === predicted) {

          b.classList.add(
            "predicted-building"
          );

        }

      }, REDUCE_MOTION ? 0 : 80);

    });

  });
}


// ============================================================
// BUILD PROBABILITY LIST
// ============================================================

function buildProbList(
  paired,
  predicted
) {

  if (!probList) return;

  probList.innerHTML = "";


  // Highest probability first

  const sorted =
    [...paired].sort(
      (a, b) =>
        b.prob - a.prob
    );


  sorted.forEach((cls) => {

    const row =
      document.createElement("div");

    row.className =
      "prob-row";


    if (cls.key === predicted) {
      row.classList.add("top");
    }


    // --------------------------------------------------------
    // NAME
    // --------------------------------------------------------

    const name =
      document.createElement("span");

    name.className =
      "name";

    name.textContent =
      cls.label;


    // --------------------------------------------------------
    // VALUE
    // --------------------------------------------------------

    const value =
      document.createElement("span");

    value.className =
      "value";

    value.textContent =
      "0%";


    // --------------------------------------------------------
    // PROGRESS TRACK
    // --------------------------------------------------------

    const track =
      document.createElement("div");

    track.className =
      "prob-track";


    const fill =
      document.createElement("div");

    fill.className =
      "prob-fill";


    track.appendChild(fill);


    // --------------------------------------------------------
    // ADD TO ROW
    // --------------------------------------------------------

    row.appendChild(name);

    row.appendChild(value);

    row.appendChild(track);

    probList.appendChild(row);


    // --------------------------------------------------------
    // PERCENTAGE
    // --------------------------------------------------------

    const pct =
      Math.round(
        cls.prob * 100
      );


    console.log(
      `${cls.label}: ${pct}%`
    );


    // --------------------------------------------------------
    // ANIMATE
    // --------------------------------------------------------

    requestAnimationFrame(() => {

      setTimeout(() => {

        fill.style.width =
          `${pct}%`;

        animateCount(
          value,
          pct
        );

      }, REDUCE_MOTION ? 0 : 150);

    });

  });
}


// ============================================================
// ANIMATE NUMBER
// ============================================================

function animateCount(
  el,
  target
) {

  if (REDUCE_MOTION) {

    el.textContent =
      `${target}%`;

    return;
  }


  const duration = 700;

  const start =
    performance.now();


  function tick(now) {

    const t =
      Math.min(
        1,
        (now - start) /
          duration
      );


    const eased =
      1 -
      Math.pow(
        1 - t,
        3
      );


    el.textContent =
      `${Math.round(
        target * eased
      )}%`;


    if (t < 1) {

      requestAnimationFrame(
        tick
      );

    }

  }


  requestAnimationFrame(
    tick
  );
}


// ============================================================
// API HEALTH CHECK
// ============================================================

async function checkApiStatus() {

  const statusEl =
    document.getElementById(
      "apiStatus"
    );


  if (!statusEl) return;


  try {

    const res =
      await fetch(
        HEALTH_ENDPOINT,
        {
          method: "GET",
        }
      );


    if (res.ok) {

      statusEl.classList.add(
        "online"
      );

      statusEl.classList.remove(
        "offline"
      );

      statusEl.lastChild.textContent =
        "API connected";

    } else {

      throw new Error(
        "bad status"
      );

    }

  } catch {

    statusEl.classList.add(
      "offline"
    );

    statusEl.classList.remove(
      "online"
    );

    statusEl.lastChild.textContent =
      "API unreachable";
  }
}


// ============================================================
// INIT
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    buildSkylineLights();

    checkApiStatus();

  }
);