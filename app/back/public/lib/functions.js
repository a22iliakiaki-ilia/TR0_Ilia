const API_URL = "http://localhost:4000";

function getName() {
    return localStorage.getItem("userName");
}

function greetUser() {
    const name = getName();
    const displayElement = document.getElementById("userNameDisplay");
    if (name && displayElement) {
        displayElement.textContent = `Welcome, ${name}!`;
    }else if (displayElement) {
        displayElement.textContent = "Welcome!";
    }
}

greetUser();

function setUserName() {
    const name = document.getElementById("nameInput").value.trim();
    if (!name) return; 
    localStorage.setItem("userName", name);
    console.log(name, "userName", getName())
}
window.setUserName = setUserName;
console.log(name, "userName", getName())

async function startQuiz() {
    const display = document.getElementById('display');
    const answers = document.getElementById('answers');
    const question = document.getElementById('question');
    const image = document.getElementById('image');
    const nextBtn = document.getElementById("next-btn");
    const marcador = document.getElementById("marcador");

    let data = [];
    let currentIndex = 0;
    let selectedAnswerIndex = null;
    let timer = null;
    let remaining = 30;
    let session_id = null;

    const user_respost = {};

    function resolveImageUrl(path) {
        if (!path) return "";
        if (/^https?:\/\//i.test(path)) return path;
        return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
    }

    async function fetchAllData() {
        try {
            const res = await fetch(`${API_URL}/all`);
            if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
            return await res.json();
        } catch (err) {
            console.log("Error", err);
            return null;
        }
    }

    async function checkCorrectes() {
        try {
            const res = await fetch(`${API_URL}/check-correctes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id, user_respost })
            });
            if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
            return await res.json();
        } catch (err) {
            console.log("Error", err);
            return null;
        }
    }


    function renderMarcador(m, obj) {
        const answered = Object.keys(obj).length;
        const total = data.length || 1;
        m.style.width = `${(answered / total) * 100}%`;
    }

    function clearImage() {
        image.removeAttribute("src");
        image.alt = "";
    }

    async function showResult() {
        clearInterval(timer);

        const result = await checkCorrectes();
        clearImage();

        if (!result) {
            question.textContent = "No load";
            answers.innerHTML = "";
            return;
        }

        question.textContent = `${getName()} has encertat ${result.score} de ${result.total} preguntes.`;
        answers.innerHTML = "";
        const li = document.createElement("li");
        li.className = "option";
        li.textContent = `Nota: ${result.nota} / 10`;
        answers.appendChild(li);

        nextBtn.textContent = "Go Home";
        nextBtn.setAttribute("href", "index.html");
    }

    function startTimer() {
        clearInterval(timer);
        remaining = 30;
        display.textContent = remaining;
        display.classList.remove('low-time');

        timer = setInterval(() => {
            remaining--;
            display.textContent = remaining;
            display.classList.toggle('low-time', remaining <= 5);

            if (remaining <= 0) {
                clearInterval(timer);
                if (data[currentIndex]) user_respost[data[currentIndex].id] = null;
                renderMarcador(marcador, user_respost);
                currentIndex++;
                showQuestion(currentIndex);
            }
        }, 1000);
    }

    function showQuestion(i) {
        if (!data[i]) {
            clearInterval(timer);
            showResult();
            return;
        }

        selectedAnswerIndex = null;

        const src = resolveImageUrl(data[i].imatge);
        if (src) {
            image.src = src;
            image.alt = data[i].pregunta;
        } else {
            clearImage();
        }

        question.textContent = data[i].pregunta;

        answers.innerHTML = "";
        data[i].respostes.forEach((text, idx) => {
            const li = document.createElement("li");
            li.className = "option";
            li.dataset.index = idx;
            li.textContent = text;
            li.addEventListener("click", () => {
                answers.querySelectorAll(".option").forEach(el => el.classList.remove("selected"));
                li.classList.add("selected");
                selectedAnswerIndex = idx;
            });
            answers.appendChild(li);
        });

        startTimer();
    }

    function nextQuestion() {
        if (!data[currentIndex]) return;

        user_respost[data[currentIndex].id] = selectedAnswerIndex;
        renderMarcador(marcador, user_respost);
        currentIndex++;
        showQuestion(currentIndex);
    }
    window.nextQuestion = nextQuestion;

    const raw = await fetchAllData();
    if (!raw || !Array.isArray(raw.preguntes) || raw.preguntes.length === 0) {
        question.textContent = "No load";
        return;
    }

    session_id = raw.session_id;
    data = raw.preguntes;
    renderMarcador(marcador, user_respost);
    showQuestion(currentIndex);
}

startQuiz();