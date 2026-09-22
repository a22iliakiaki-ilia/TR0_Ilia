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