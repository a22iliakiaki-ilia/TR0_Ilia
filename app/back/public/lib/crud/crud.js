  const API_URL = "http://localhost:4000";

  async function getQuestions() {
    try {
      const response = await fetch(`${API_URL}/questions`);
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const data = await response.json();
      console.log(data);
      return data;
    } catch (err) {
      console.log("Error", err);
      return null;
    }
  }


  async function getQuestionsById(id) {
    try {
      const response = await fetch(`${API_URL}/question/${id}`);
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const data = await response.json();
      console.log(data);
      return data;
    } catch (err) {
      console.log("Error", err);
      return null;  
    }
}

async function deleteQuestionById(id) {
    try {
      const response = await fetch(`${API_URL}/question/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const data = await response.json();
      console.log(data);
      return data;
    } catch (err) {
      console.log("Error", err);
      return null;  
    }
}

async function addQuestion() {
  const pregunta = document.getElementById('newQuestion').value;
  const correctOption = document.getElementById('correctOption').value;
  const imageFile = document.getElementById('newQuestionImage').files[0];

  const respostes = [
    document.getElementById('option1').value,
    document.getElementById('option2').value,
    document.getElementById('option3').value,
    document.getElementById('option4').value,
  ];

  if (!imageFile) {
    alert('Please select an image');
    return;
  }

  const formData = new FormData();
  formData.append('pregunta', pregunta);
  formData.append('respostes', JSON.stringify(respostes));
  formData.append('correctOption', correctOption);
  formData.append('imagen', imageFile); 

  const res = await fetch('/question', {
    method: 'POST',
    body: formData 
  });

  const data = await res.json();
  console.log(data);
}

async function updateQuestion(id, pregunta, imagen, respostes) {
    try {
      const response = await fetch(`${API_URL}/question/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta, imagen, respostes })
      });
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const data = await response.json();
      console.log(data);
      return data;
    } catch (err) {
      console.log("Error", err);
      return null;  
    }
}  